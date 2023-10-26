<?php

namespace local_teamup\lib;

defined('MOODLE_INTERNAL') || die();

require_once(__DIR__.'/teams.lib.php');
use \local_teamup\lib\teams_lib;

require_once(__DIR__.'/../../../platform/classes/lib/service.lib.php');
use \local_platform\lib\service_lib;

class tu_lib {

    /**
     * Get the app title from config or default to TeamUp.
     *
     * @return string
     */
    public static function get_toolname() {
        $config = get_config('local_teamup');
        if (isset($config->toolname) && !empty($config->toolname)) {
            return $config->toolname;
        } else {
            return 'TeamUp';
        }
    }

    /**
     * Get the current authenticated user's roles from the user index table.
     *
     * @param string $username
     * @return array
     */
    public static function get_teamup_roles($username = null) {
        global $USER, $DB;

        if (empty($username)) {
            $username = $USER->username;
        }

        $teamuproles = array_column(
            $DB->get_records('teamup_user_index', array('username' => $username)),
            'role'
        );
        $teamroles = array_column(
            $DB->get_records('teamup_team_staff', array('username' => $username, 'status' => 0)),
            'usertype'
        );
        $allroles = array_values(array_unique(array_merge($teamuproles, $teamroles)));
        return array_map('strtolower', $allroles);
    }

    /**
     * Create a user stub object from a username.
     *
     * @param string $username
     * @return object
     */
    public static function user_stub($username) {
        $mdluser = \core_user::get_user_by_username($username);
        if (empty($mdluser)) {
            return null;
        }
        $user = new \stdClass();
        $user->un = $mdluser->username;
        $user->fn = $mdluser->firstname;
        $user->ln = $mdluser->lastname;
        return $user;
    }

    /**
     * Search staff.
     *
     * @param string $query
     * @return array results
     */
    public static function search_staff($query) {
        global $DB;

        $sql = "SELECT DISTINCT u.username
        FROM {user} u 
        INNER JOIN {teamup_user_index} du ON u.id = du.userid
        WHERE ( du.role = 'staff' OR du.role = 'manager' )
        AND ( u.firstname LIKE ?
        OR u.lastname LIKE ?
        OR u.username LIKE ? )";
        $likesearch = "%" . $query . "%";
        $data = $DB->get_records_sql($sql, [$likesearch, $likesearch, $likesearch]);

        $staff = [];
        foreach ($data as $row) {
            $staff[] = static::user_stub($row->username);
        }
        return $staff;
    }

    /**
     * Search students.
     *
     * @param string $query
     * @return array results
     */
    public static function search_students($query) {
        global $DB;

        $sql = "SELECT DISTINCT u.username
        FROM {user} u 
        INNER JOIN {teamup_user_index} du ON u.id = du.userid
        WHERE du.role = 'student'
        AND ( u.firstname LIKE ?
        OR u.lastname LIKE ?
        OR u.username LIKE ? )";
        $likesearch = "%" . $query . "%";
        $data = $DB->get_records_sql($sql, [$likesearch, $likesearch, $likesearch]);

        $students = [];
        foreach ($data as $row) {
            $students[] = static::user_stub($row->username);
        }
        return $students;
    }

    /**
     * Check if the current authenticated user is a Parent.
     *
     * @return boolean
     */
    public static function is_tu_parent() {
        $roles = static::get_teamup_roles();
        $allowed = in_array('parent', $roles);
        return $allowed;
    }

    /**
     * Check if the current authenticated user is a manager.
     *
     * @return boolean
     */
    public static function is_tu_manager($username = null) {
        $roles = static::get_teamup_roles($username);
        $allowed = in_array('manager', $roles);
        return $allowed;
    }

    /**
     * Check if the current authenticated user is a manager or general staff.
     *
     * @return boolean
     */
    public static function is_tu_manager_or_staff() {
        $roles = static::get_teamup_roles();
        $allowed = in_array('manager', $roles) || in_array('staff', $roles);
        return $allowed;
    }

    /**
     * Check if the current authenticated user is a manager or team staff (coach, assistant).
     *
     * @return boolean
     */
    public static function is_manager_or_teamstaff() {
        $roles = static::get_teamup_roles();
        $allowed = in_array('manager', $roles) || in_array('coach', $roles) || in_array('assistant', $roles);
        return $allowed;
    }

    /**
     * Search categories.
     *
     * @param string $query
     * @return array results
     */
    public static function search_categories($query) {
        global $DB;
        // Check if user is manager or teamstaff (coach, assistant).
        $roles = static::get_teamup_roles();
        $allowed = in_array('manager', $roles) || in_array('coach', $roles) || in_array('assistant', $roles);
        if (!$allowed) {
            return [];
        }
        $sql =  "SELECT * 
        FROM {teamup_categories} 
        WHERE displayname LIKE ?" ;
        $data = $DB->get_records_sql($sql, ["%" . $query . "%"]);
        $categories = [];
        foreach ($data as $row) {
            $categories[] = (object) [
                "id" => $row->idnumber,
                "name" => $row->displayname,
            ];
        }
        return $categories;
    }

    /**
     * Get category diretory info.
     *
     * @param string $category idnumber
     * @return array
     */
    public static function get_category_dir($category) {
        // Check if user is manager or teamstaff (coach, assistant).
        $roles = static::get_teamup_roles();
        $allowed = in_array('manager', $roles) || in_array('coach', $roles) || in_array('assistant', $roles);
        if (!$allowed) {
            return [];
        }

        $category = static::get_category_info($category);
        if (empty($category)) {
            return [];
        }
        $path = static::export_category_path($category);
        $children = static::export_category_children($category);

        return (object) [
            "path" => $path,
            "id" => $category->idnumber,
            "name" => $category->displayname,
            "children" => $children,
        ];
    }

    /**
     * Get category record.
     *
     * @param string $category idnumber
     * @return array
     */
    public static function get_category_info($category) {
        global $DB;
        if ($category == -1) {
            // Get root level.
            $category = (object) [
                'id' => -1,
                'idnumber' => '-1',
                'displayname' => 'Root',
                'parentidnumber' => '-1',
                'path' => '',
            ];
        } else {
            $category = $DB->get_record('teamup_categories', ['idnumber' => $category, 'deleted' => 0]);
        }
        return $category;
    }

    /**
     * Generate a named path for a given category.
     *
     * @param string $category idnumber
     * @return string
     */
    public static function export_category_path($category) {
        global $DB;
        $path = [];
        if ($category->path == '') {
            // Root level.
        } else {
            $parents = explode('/', $category->path);
            array_pop($parents);
            $path[] = (object) [
                "id" => '-1',
                "name" => 'Root',
            ];
            foreach ($parents as $parent) {
                $path[] = (object) [
                    "id" => $parent,
                    "name" => static::get_cat_name($parent),
                ];
            }
        }
        return $path;
    }

    /**
     * Get child categories/teams for a given category
     *
     * @param string $category idnumber
     * @return array
     */
    public static function export_category_children($category) {
        global $DB;
        if ($category->id == -1) {
            // Get root level.
            $cats = $DB->get_records('teamup_categories', ['parentidnumber' => '', 'deleted' => 0]);
            $teams = $DB->get_records('teamup_teams', ['status' => teams_lib::STATUS_LIVE, 'category' => '', 'deleted' => 0]);
        } else {
            $cats = $DB->get_records('teamup_categories', ['parentidnumber' => $category->idnumber, 'deleted' => 0]);
            $teams = $DB->get_records('teamup_teams', ['status' => teams_lib::STATUS_LIVE, 'category' => $category->idnumber, 'deleted' => 0]);
        }
        $children = [];
        foreach ($cats as $cat) {
            $children[] = (object) [
                "id" => $cat->idnumber,
                "type" => 'category',
                "name" => $cat->displayname,
            ];
        }
        foreach ($teams as $team) {
            $children[] = (object) [
                "id" => $team->id,
                "type" => 'team',
                "name" => $team->teamname,
            ];
        }
        return $children;
    }

    /**
     * Get category name from idnumber
     *
     * @param string $idnumber
     * @return string
     */
    public static function get_cat_name($idnumber) {
        global $DB;
        return $DB->get_field('teamup_categories', 'displayname', ['idnumber' => $idnumber]);
    }
    
    /**
     * Get a parent usernames for a given student.
     *
     * @param string $studentusername
     * @return array
     */
    public static function get_parent_usernames($studentusername) {
        global $DB;
        $parents = array();
        $sql = "SELECT user1 as username
                  FROM {teamup_user_relationships}
                 WHERE user2 = ?
                   AND user1is = 'parent'";
        $params = array($studentusername);
        return $DB->get_fieldset_sql($sql, $params);
    }

    /**
     * Get a parent usernames for multiple students.
     *
     * @param array $students usernames
     * @return array
     */
    public static function get_parents_for_students($students) {
        global $DB;
        if (empty($students)) {
            return [];
        }
        list($insql, $params) = $DB->get_in_or_equal($students);
        $sql = "SELECT user1 as username
                  FROM {teamup_user_relationships}
                 WHERE user1is = 'parent'
                   AND user2 $insql";
        return $DB->get_fieldset_sql($sql, $params);
    }

    /**
     * Get usernames for the current authenticated user's children.
     *
     * @return array
     */
    public static function get_users_children() {
        global $DB, $USER;
        $sql = "SELECT user2 as username
                  FROM {teamup_user_relationships}
                 WHERE user1is = 'parent'
                   AND user1 = ?";
        $children = $DB->get_fieldset_sql($sql, [$USER->username]);
        
        if ($children) {
            $children = array_map(function($username) {
                return static::user_stub($username);
            }, $children);
        }

        return $children;
    }

    /**
     * Helper to send an email to a user.
     *
     * @param string $subject
     * @param string $body
     * @param string $recipient
     * @param string|null $sender or current user.
     * @return void
     */
    public static function send_email($subject, $body, $recipient, $sender = null) {
        global $DB;
        $to = \core_user::get_user_by_username($recipient);
        $donotemail = $DB->record_exists('user_preferences', [
            'userid' => $to->id,
            'name' => 'message_provider_local_teamup_emails_enabled',
            'value' => 'none'
        ]);
        $sql = "SELECT * 
                FROM {user_preferences} 
                WHERE userid = ?
                AND name = 'message_provider_local_teamup_communications_enabled'
                AND value LIKE '%email%'";
        $donotemail = $DB->get_record_sql($sql, [$to->id]);
        if ($donotemail) {
            return;
        }
        $from = \core_user::get_noreply_user();
        if ($sender) {
            $from = \core_user::get_user_by_username($sender);
        }
        return service_lib::email_to_user($to, $from, $subject, $body->text, $body->html);
    }
    
}