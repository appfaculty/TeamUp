<?php

namespace local_teamup\lib;

defined('MOODLE_INTERNAL') || die();

require_once(__DIR__.'/../persistents/team.class.php');

use \local_teamup\persistents\team;

/**
 * Teams lib
 */
class teams_lib {
    
    const STATUS_DRAFT = 1;
    const STATUS_LIVE = 2;

    /**
     * Get current authenticated user's teams grouped by their roles.
     *
     * @return array
     */
    public static function get_teams() {
        global $USER, $DB;

        $teams = array();

        // Staff
        $sql = "SELECT t.*
                FROM {teamup_teams} t
                INNER JOIN {teamup_team_staff} ts ON t.id = ts.teamid
                WHERE ts.username = ?
                AND ts.status = 0
                AND t.deleted = 0";
        $staffteams = $DB->get_records_sql($sql, [$USER->username]);
        if ($staffteams) {
            $teams[] = (object) array (
                'role' => 'teamstaff',
                'teams' => array_values($staffteams),
            );
        }

        // Student
        $sql = "SELECT t.*
                FROM {teamup_teams} t
                INNER JOIN {teamup_team_students} ts on t.id = ts.teamid
                WHERE ts.username = ?
                AND t.status = ?
                AND ts.status = 0
                AND t.deleted = 0";
        $studentteams = $DB->get_records_sql($sql, [$USER->username, static::STATUS_LIVE]);
        if ($studentteams) {
            foreach ($studentteams as &$team) {
                $coaches = static::get_staff($team->id, 'coach');
                $coaches = array_values(array_map( function($coach) { return tu_lib::user_stub($coach->username); }, $coaches));
                $team->coaches = $coaches;
            }
            $teams[] = (object) array (
                'role' => 'teamstudent',
                'teams' => array_values($studentteams),
            );
        }

        //Parent
        $children = tu_lib::get_users_children();
        foreach($children as $child) {
            $sql = "SELECT t.*
                    FROM {teamup_teams} t
                    INNER JOIN {teamup_team_students} ts on t.id = ts.teamid
                    WHERE ts.username = ?
                    AND t.status = ?
                    AND ts.status = 0
                    AND t.deleted = 0";
            $studentteams = $DB->get_records_sql($sql, [$child->un, static::STATUS_LIVE]);
            if ($studentteams) {
                foreach ($studentteams as &$team) {
                    $coaches = static::get_staff($team->id, 'coach');
                    $coaches = array_values(array_map( function($coach) { return tu_lib::user_stub($coach->username); }, $coaches));
                    $team->coaches = $coaches;
                }
                $teams[] = (object) array (
                    'role' => 'parent',
                    'child' => $child,
                    'teams' => array_values($studentteams),
                );
            }
        }

        return $teams;
    }

    /**
     * Get exported team data, first checking editing capability.
     *
     * @param int $id team id
     * @return array
     */
    public static function get_team_for_editing($id) {
        // Can user access team data? Only Moodle Admin, TeamUp Manager, Team Coach, or Assistant can access a team for editing purposes.
        if (!static::has_capability_edit_team($id)) {
            throw new \Exception("Permission denied.");
            exit;
        }
        $team = new team($id);
        return $team->export();
    }

    /**
     * Check if the current user has capability to create a new team.
     *
     * @return boolean
     */
    public static function has_capability_create_team() {
        global $USER, $DB;

        // TeamUp Manager.
        $manager = $DB->record_exists('teamup_user_index', ['username' => $USER->username, 'role' => 'manager']);
        if ($manager) {
            return true;
        }
    
        // Moodle Admin.
        if (has_capability('moodle/site:config', \context_user::instance($USER->id))) {
            return true;
        }

        return false;
    }

    /**
     * Check if the current user has the capability to edit a given team.
     *
     * @param int $teamid
     * @return boolean
     */
    public static function has_capability_edit_team($teamid) {
        global $USER, $DB;

        // Team Coach or Assistant.
        $teamstaff = $DB->record_exists_sql("SELECT username FROM {teamup_team_staff} WHERE teamid = ? AND username = ? AND status = 0 AND (usertype = 'coach' OR usertype = 'assistant')", [$teamid, $USER->username]);
        if ($teamstaff) {
            return true;
        }

        // TeamUp Manager.
        $manager = $DB->record_exists('teamup_user_index', ['username' => $USER->username, 'role' => 'manager']);
        if ($manager) {
            return true;
        }
    
        // Moodle Admin.
        if (has_capability('moodle/site:config', \context_user::instance($USER->id))) {
            return true;
        }

        return false;
    }

    /**
     * Insert/update team from submitted form data.
     *
     * @param array $data
     * @return array
     */
    public static function save_team($data) {
        global $USER, $DB;

        $team = null;

        try {
            if (!isset($data->id))  {
                throw new \Exception("Submitted data is malformed.");
            }

            if ($data->id > 0) {
                if (!team::record_exists($data->id)) {
                    return;
                }
                if (!static::has_capability_edit_team($data->id)) {
                    throw new \Exception("Permission denied.");
                    exit;
                }
                $team = new team($data->id);
            } else {
                // Can this user create an team? Must be a Moodle Admin or TeamUp Manager.
                if (!static::has_capability_create_team($id)) {
                    throw new \Exception("Permission denied.");
                    exit;
                }

                // Create a new team with data that doesn't change on update.
                $team = new team();
                $team->set('creator', $USER->username);
                $team->set('status', static::STATUS_DRAFT);
                // Generate an idnumber
                $slug = strtolower(trim(preg_replace('/[\s-]+/', '-', preg_replace('/[^A-Za-z0-9-]+/', '-', preg_replace('/[&]/', 'and', preg_replace('/[\']/', '', iconv('UTF-8', 'ASCII//TRANSLIT', $data->teamname))))), '-'));
                do {
                    $random = substr(str_shuffle(MD5(microtime())), 0, 10);
                    $idnumber = $slug.'-'.$random;
                    $exists = $DB->record_exists('teamup_teams', ['idnumber' => $idnumber]);
                } while ($exists);
                $team->set('idnumber', $slug.'-'.$random);
                $team->save();
            }
            // Save data.
            $team->set('category', $data->category);
            $team->set('teamname', $data->teamname);
            $team->set('details', $data->details);
            $team->save();

            // Sync the staff lists.
            static::sync_staff_from_data($team->get('id'), 'coach', $data->coaches);
            static::sync_staff_from_data($team->get('id'), 'assistant', $data->assistants);

            // Sync the student list.
            static::sync_students_from_data($team->get('id'), $data->studentlist);

            // Change student teams if necessary.
            static::move_students_from_data($team->get('id'), $data->studentlistmove);

        } catch (\Exception $e) {
            // Log and rethrow. 
            // https://stackoverflow.com/questions/5551668/what-are-the-best-practices-for-catching-and-re-throwing-exceptions
            throw $e;
        }

        return array(
            'id' => $team->get('id'),
            'status' => $team->get('status'),
        );
    }

    /**
     * Set team status to published.
     *
     * @param array $data
     * @return array
     */
    public static function publish_team($data) {
        global $USER, $DB;

        if (!isset($data->id) || !isset($data->publish))  {
            throw new \Exception("Submitted data is malformed.");
        }

        if (!team::record_exists($data->id)) {
            throw new \Exception("Submitted data is malformed.");
        }

        $team = new team($data->id);
        // Can user edit this team? Must be a Moodle Admin, TeamUp Admin, Manager, Coach, or Assistant.
        if ($data->publish) {
            $team->set('status', static::STATUS_LIVE);
        } else {
            $team->set('status', static::STATUS_DRAFT);
        }
        $team->save();

        return array(
            'id' => $team->get('id'),
            'status' => $team->get('status'),
        );
    }

    /**
     * Search for a team
     *
     * @param string $search
     * @return array results
     */
    public static function search_teams($query) {
        global $DB;
        if (!static::is_manager_or_teamstaff()) {
            return [];
        }
        $sql =  "SELECT * 
        FROM {teamup_teams} 
        WHERE deleted = 0
        AND status = " . teams_lib::STATUS_LIVE . "
        AND teamname LIKE ?" ;
        $data = $DB->get_records_sql($sql, ["%" . $query . "%"]);
        $teams = [];
        foreach ($data as $row) {
            $teams[] = (object) [
                "id" => $row->id,
                "name" => $row->teamname,
            ];
        }
        return $teams;
    }

    /**
     * Log info
     *
     * @param string $message
     * @param mixed $data
     * @param string $transaction
     * @return void
     */
    public static function log($message = '', $data = null, $transaction = '') {
        global $USER, $DB;
        $log = new \stdClass();
        $log->username = $USER->username;
        $log->transaction = $transaction;
        $log->event = $message;
        $log->datajson = $data ? json_encode($data) : '';
        $log->logtime = time();
        $DB->insert_record('teamup_logs', $log);
    }

    /**
     * Update team staff.
     *
     * @param int $teamid
     * @param string $type coach|assistant
     * @param array $newstaff array of user stub objects
     * @param string $source
     * @return void
     */
    public static function sync_staff_from_data($teamid, $type, $newstaff, $source = 'ui') {
        global $DB;

        // Copy usernames into keys.
        $usernames = array_column($newstaff, "un");
        $newstaff = array_combine($usernames, $newstaff);

        // Load existing usernames
        // For db-based records, we want to include staff that have been marked as moved (status 1) and deleted (status 2).
        // so that these users are not re-inserted in the sync process. These will count as existing records for the purposes
        // of the sync, though they will not appear in the site due to their status.
        $strict = true;
        if ($source == 'db') {
            $strict = false;
        }
        $existingstaffrecs = static::get_staff($teamid, $type, $fields = '*', $strict);
        $existingstaff = array_column($existingstaffrecs, "username");
        $existingstaff = array_combine($existingstaff, $existingstaff);

        // Skip over existing staff.
        foreach ($existingstaff as $un) {
            if (array_key_exists($un, $newstaff)) {
                unset($newstaff[$un]);
                unset($existingstaff[$un]);
            }
        }

        // Process inserted staff.
        if (count($newstaff)) {
            $newstaffdata = array_map(function($staff) use ($teamid, $type, $source) {
                $rec = new \stdClass();
                $rec->teamid = $teamid;
                $rec->username = $staff['un'];
                $rec->usertype = $type;
                $rec->status = 0;
                $rec->source = $source;
                return $rec;
            }, $newstaff);
            $DB->insert_records('teamup_team_staff', $newstaffdata);
        }

        // Process remove staff.
        if (count($existingstaff)) {

            list($insql, $inparams) = $DB->get_in_or_equal($existingstaff);
            $params = array_merge([$teamid, $type], $inparams);

            // If syncing from db, delete db staff.
            if ($source == 'db') {
                $sql = "DELETE FROM {teamup_team_staff} 
                WHERE teamid = ? 
                AND source = 'db'
                AND usertype = ? 
                AND username $insql";
                $DB->execute($sql, $params);
            } else {
                // soft delete db-based records so that db sync is aware.
                $sql = "UPDATE {teamup_team_staff} 
                SET status = 2
                WHERE teamid = ? 
                AND source = 'db'
                AND usertype = ? 
                AND username $insql";
                $DB->execute($sql, $params);

                // hard delete ui-based records.
                $sql = "DELETE FROM {teamup_team_staff} 
                WHERE teamid = ? 
                AND source = 'ui'
                AND usertype = ? 
                AND username $insql";
                $DB->execute($sql, $params);
            }
        }
    }

    /**
     * Update team students.
     *
     * @param int $teamid
     * @param array $newstudents
     * @param string $source
     * @return void
     */   
    public static function sync_students_from_data($teamid, $newstudents, $source = 'ui') {
        global $DB;

        // Copy usernames into keys.
        $newstudents = array_combine($newstudents, $newstudents);

        // Load existing students.
        // For db-based records, we want to include students that have been marked as moved (status 1) and deleted (status 2).
        // so that these users are not re-inserted in the sync process. These will count as existing records for the purposes
        // of the sync, though they will not appear in the site due to their status.
        $strict = true;
        if ($source == 'db') {
            $strict = false;
        }
        $existingstudentrecs = static::get_students($teamid, $fields = '*', $strict);
        $existingstudents = array_column($existingstudentrecs, 'username');
        $existingstudents = array_combine($existingstudents, $existingstudents);

        // Skip over existing students.
        foreach ($existingstudents as $existingun) {
            if (in_array($existingun, $newstudents)) {
                unset($newstudents[$existingun]);
                unset($existingstudents[$existingun]);
            }
        }

        // Process inserted students.
        if (count($newstudents)) {
            $newstudentdata = array_map(function($username) use ($teamid, $source) {
                $rec = new \stdClass();
                $rec->teamid = $teamid;
                $rec->username = $username;
                $rec->attributes = '';
                $rec->status = 0;
                $rec->source = $source;
                return $rec;
            }, $newstudents);
            $DB->insert_records('teamup_team_students', $newstudentdata);
        }

        // Process removed students.
        if (count($existingstudents)) {

            list($insql, $inparams) = $DB->get_in_or_equal($existingstudents);
            $params = array_merge([$teamid], $inparams);

            // If syncing from db, delete db students.
            if ($source == 'db') {
                $sql = "DELETE FROM {teamup_team_students} 
                WHERE teamid = ? 
                AND source = 'db'
                AND username $insql";
                $DB->execute($sql, $params);
            } else {
                // soft delete db-based records so that db sync is aware.
                $sql = "UPDATE {teamup_team_students} 
                SET status = 2
                WHERE teamid = ? 
                AND source = 'db'
                AND username $insql";
                $DB->execute($sql, $params);

                // hard delete ui-based records.
                $sql = "DELETE FROM {teamup_team_students} 
                WHERE teamid = ? 
                AND source = 'ui'
                AND username $insql";
                $DB->execute($sql, $params);
            }
        }
    }

    /**
     * Move students from a given team into other teams.
     *
     * @param int $teamid originating team
     * @param array $movestudents objects with student data and new team id.
     * @return void
     */
    private static function move_students_from_data($teamid, $movestudents = []) {
        global $DB;
        if (empty($teamid) || empty($movestudents)) {
            return;
        }

        $moveStudentUsernames = array_column($movestudents, 'username');
        $movestudents = array_combine($moveStudentUsernames, $movestudents);
        $existingstudents = static::get_students_by_usernames($teamid, $moveStudentUsernames);
        
        foreach ($existingstudents as $rec) {
            if (!isset($movestudents[$rec->username])) {
                continue;
            }
            $theMove = (object) $movestudents[$rec->username];
            if (!isset( $theMove->teamid)) {
                continue;
            }
            // Check whether student is already in the move to team. 
            if ($DB->record_exists('teamup_team_students', ['teamid' => $theMove->teamid, 'username' => $rec->username])) {
                // For ui-based records, don't need to move them, just remove them from this team.
                if ($rec->source == 'ui') {
                    $DB->delete_records('teamup_team_students', ['teamid' => $teamid, 'username' => $rec->username]);
                } else {
                    // Set existing recored to 'moved' so that db sync is aware.
                    $rec->status = 1; // Moved.
                    $DB->update_record('teamup_team_students', $rec);
                }
            } else {
                if ($rec->source == 'ui') {
                    // For ui-based records, just move it.
                    $rec->teamid = $theMove->teamid;
                    $DB->update_record('teamup_team_students', $rec);
                } else {
                    // For db-based records, soft move the record so that the db sync is aware.
                    $rec->status = 1; // Moved.
                    $DB->update_record('teamup_team_students', $rec);
                    // Insert the student into the team.
                    unset($rec->id);
                    $rec->status = 0;
                    $rec->teamid = $theMove->teamid;
                    $DB->insert_record('teamup_team_students', $rec);

                }
            }
        }
    }

    /**
     * Generate a changekey hash for team files.
     *
     * @param string $filearea
     * @param int $teamid
     * @return string
     */
    private static function generate_files_changekey($filearea, $teamid) {
        $context = \context_system::instance();
        $fs = get_file_storage();
        $files = $fs->get_area_files($context->id, 'local_teamup', $filearea, $teamid, "filename", false);
        $changekey = '';
        foreach ($files as $file) {
            $changekey .= $file->get_contenthash();
        }
        return sha1($changekey);
    }

    /**
     * Process file operations from UI changes.
     *
     * @param array $files processing instructions for files.
     * @param string $filearea
     * @param int $teamid
     * @return void
     */
    private static function process_files($files, $filearea, $teamid) {
        if (empty($files)) {
            return [];
        }
        $add = array();
        $delete = array();
        foreach($files as $instruct) {
            $instruct = explode("::", $instruct);
            if (count($instruct) < 2) {
                continue;
            }
            switch ($instruct[0]) {
                case "NEW":
                    $add[] = $instruct[1];
                    break;
                case "REMOVED":
                    $delete[] = $instruct[1];
                    break;
            }
        }

        static::store_files($add, $filearea, $teamid);
        static::delete_files($delete);
    }

    /**
     * Delete files
     *
     * @param array $fileids
     * @return void
     */
    private static function delete_files($fileids) {
        if (empty($fileids)) {
            return [];
        }

        $fs = get_file_storage();
        foreach($fileids as $fileid) {
            $file = $fs->get_file_by_id($fileid);
            if ($file) {
                $file->delete();
            }
        }
    }

    /**
     * Store files from temp dir.
     *
     * @param array $filenames
     * @param string $filearea
     * @param int $teamid
     * @return array results
     */
    private static function store_files($filenames, $filearea, $teamid) {
        global $USER, $CFG, $DB;

        if (empty($filenames)) {
            return [];
        }

        $success = array();
        $error = array();
        $dataroot = str_replace('\\\\', '/', $CFG->dataroot);
        $dataroot = str_replace('\\', '/', $dataroot);
        $tempdir = $dataroot . '/temp/local_platform/';

        
        $fs = get_file_storage();
        $fsfd = new \file_system_filedir();
        //$fs = new \file_storage();

        // Store temp files to a permanent file area.
        foreach($filenames as $filename) {
            if ( ! file_exists($tempdir . $filename)) {
                $error[$filename] = 'File not found';
                continue;
            }
            try {
                // Start a new file record.
                $newrecord = new \stdClass();
                // Move the temp file into moodledata.
                list($newrecord->contenthash, $newrecord->filesize, $newfile) = $fsfd->add_file_from_path($tempdir . $filename);
                
                // Remove the temp file.
                unlink($tempdir . $filename);

                // Clean filename.
                $cleanfilename = preg_replace("/^(\d+)\.(\d+)\./", '', $filename);            

                // Complete the record.
                $newrecord->contextid = 1;
                $newrecord->component = 'local_teamup';
                $newrecord->filearea  = $filearea;
                $newrecord->itemid    = $teamid;
                $newrecord->filepath  = '/';
                $newrecord->filename  = $filename;
                $newrecord->timecreated  = time();
                $newrecord->timemodified = time();
                $newrecord->userid      = $USER->id;
                $newrecord->source      = $filename;
                $newrecord->author      = fullname($USER);
                $newrecord->license     = $CFG->sitedefaultlicense;
                $newrecord->status      = 0;
                $newrecord->sortorder   = 0;
                $newrecord->mimetype    = $fs->get_file_system()->mimetype_from_hash($newrecord->contenthash, $newrecord->filename);
                $newrecord->pathnamehash = $fs->get_pathname_hash($newrecord->contextid, $newrecord->component, $newrecord->filearea, $newrecord->itemid, $newrecord->filepath, $newrecord->filename);
                $newrecord->id = $DB->insert_record('files', $newrecord);
                $success[$filename] = $newrecord->id;
            } catch (Exception $ex) {
                $error[$filename] = $ex->getMessage();
            }
        }

        return [$success, $error];
    }

    /**
     * Get student data for a given team.
     *
     * @param int $teamid
     * @param string $fields
     * @param boolean $strict
     * @return array
     */
    public static function get_students($teamid, $fields = "*", $strict = true) {
        global $DB;
        $conds = array('teamid' => $teamid);
        if ($strict) {
            $conds['status'] = 0;
        }
        return $DB->get_records('teamup_team_students', $conds, '', $fields);
    }

    /**
     * Get student data for a given team limited to specified usernames.
     *
     * @param int $teamid
     * @param array $usernames
     * @return array
     */
    public static function get_students_by_usernames($teamid, $usernames) {
        global $DB;
        list($insql, $params) = $DB->get_in_or_equal($usernames);
        $sql = "SELECT * FROM {teamup_team_students} WHERE teamid = ? AND 'status' = 0 AND username $insql";
        $params = array_merge([$teamid], $params);
        return $DB->get_records_sql($sql, $params);
    }

    /**
     * Get staff data for a given team.
     *
     * @param int $teamid
     * @param string $usertype
     * @param string $fields
     * @param boolean $strict
     * @return array
     */
    public static function get_staff($teamid, $usertype = "*", $fields = "*", $strict = true) {
        global $DB;
        $conds = array('teamid' => $teamid);
        if ($strict) {
            $conds['status'] = 0;
        }
        if ($usertype != "*") {
            $conds['usertype'] = $usertype;
        }
        return $DB->get_records('teamup_team_staff', $conds, '', $fields);
    }
    
    /**
     * Check if a user (current user if not supplied) is a staff member (coach/assistant) in the given team.
     *
     * @param int $teamid
     * @param string $username
     * @return boolean
     */
    public static function is_teamstaff($teamid, $username = null) {
        global $USER;
        
        if (empty($username)) {
            $username = $USER->username;
        }
        $teamstaff = static::get_staff($teamid);
        $teamstaff = array_column($teamstaff, 'username');

        return in_array($username, $teamstaff);
    }

    /**
     * Get staff data from a list of teams.
     *
     * @param array $teamids
     * @param string $usertype
     * @return array
     */
    public static function get_staff_for_teams($teamids, $usertype = "*") {
        global $DB;

        list($insql, $params) = $DB->get_in_or_equal($teamids);
        $sql = "SELECT ts.*
                FROM {teamup_team_staff} ts
                INNER JOIN {teamup_teams} t ON ts.teamid = t.id
                WHERE t.deleted = 0
                AND t.status = " . static::STATUS_LIVE . "
                AND ts.teamid $insql
                AND ts.status = 0";
        if ($usertype != "*") {
            $sql .= " AND ts.usertype = {$usertype}";
        }
        return $DB->get_records_sql($sql, $params);
    }

    /**
     * Get student data from a list of teams.
     *
     * @param array $teamids
     * @return array
     */
    public static function get_students_for_teams($teamids) {
        global $DB;
        list($insql, $params) = $DB->get_in_or_equal($teamids);
        $sql = "SELECT ts.*
                FROM {teamup_team_students} ts
                INNER JOIN {teamup_teams} t ON ts.teamid = t.id
                WHERE t.deleted = 0
                AND t.status = " . static::STATUS_LIVE . "
                AND ts.teamid $insql
                AND ts.status = 0";
        return $DB->get_records_sql($sql, $params);
    }

    /**
     * Get the current authenticated user's teams, based on their role/child selection.
     *
     * @param string $viewas
     * @param string $child
     * @return array
     */
    public static function get_users_teams($viewas, $child = null) {
        global $USER, $DB;

        $teams = [];

        if ($viewas == "teamstaff") {
            // Get where user is in team_staff
            $sql = "SELECT DISTINCT t.id
                    FROM {teamup_teams} t
                    INNER JOIN {teamup_team_staff} ts ON t.id = ts.teamid
                    WHERE t.deleted = 0
                    AND t.status = " . static::STATUS_LIVE .  "
                    AND ts.username = '{$USER->username}'
                    AND ts.status = 0";
            $teams = array_column($DB->get_records_sql($sql),'id');  
        }

        else if ($viewas == "teamstudent") {
            // Get where user is in team_students
            $sql = "SELECT DISTINCT t.id
                    FROM {teamup_teams} t
                    INNER JOIN {teamup_team_students} ts ON t.id = ts.teamid
                    WHERE t.deleted = 0
                    AND t.status = " . static::STATUS_LIVE . "
                    AND ts.username = '{$USER->username}'
                    AND ts.status = 0";
            $teams = array_column($DB->get_records_sql($sql),'id');  
        }

        else if ($viewas == "parent") {
            $childsql = '';
            $params = [];
            if ($child) {
                $childsql = ' AND r.user2 = ?';
                $params[] = $child;
            }
            // Get where user is parent of user in team_students
            $sql = "SELECT DISTINCT t.id
                    FROM {teamup_teams} t
                    INNER JOIN {teamup_team_students} ts ON t.id = ts.teamid
                    INNER JOIN {teamup_user_relationships} r ON ts.username = r.user2
                    WHERE t.deleted = 0
                    AND t.status = " . static::STATUS_LIVE . "
                    AND ts.status = 0
                    AND r.user1 = '{$USER->username}'
                    AND r.user1is = 'parent'
                    " . $childsql;
            $teams = array_column($DB->get_records_sql($sql, $params),'id');
        }

        return $teams;
    }

    /**
     * Convert an array of team ids to an array of team idnumbers.
     *
     * @param array $teamids
     * @return array
     */
    public static function get_idnumbers($teamids) {
        global $DB;

        if (empty($teamids)) {
            return [];
        }
        list($insql, $params) = $DB->get_in_or_equal($teamids);
        $sql = "SELECT idnumber
                  FROM {teamup_teams}
                 WHERE deleted = 0
                   AND id $insql";
        $rows = $DB->get_records_sql($sql, $params);
        return array_column($rows, 'idnumber');  
    }

}
