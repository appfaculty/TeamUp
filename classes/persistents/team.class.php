<?php

namespace local_teamup\persistents;

require_once($CFG->libdir.'/classes/persistent.php');
require_once(__DIR__.'/../lib/teams.lib.php');
require_once(__DIR__.'/../lib/tu.lib.php');

use \local_teamup\lib\teams_lib;
use \local_teamup\lib\tu_lib;

defined('MOODLE_INTERNAL') || die();

/**
 * Persistent model representing a single team.
 */
class team extends \core\persistent {

    /** Table to store this persistent model instances. */
    const TABLE = 'teamup_teams';

    /**
     * Return the definition of the properties of this model.
     *
     * @return array
     */
    protected static function define_properties() {
        return [
            "creator" => [
                'type' => PARAM_RAW,
            ],
            "status" => [
                'type' => PARAM_INT,
                'default' => 0,
            ],
            "deleted" => [
                'type' => PARAM_INT,
                'default' => 0,
            ],
            "idnumber" => [
                'type' => PARAM_RAW,
                'default' => '',
            ],
            "teamname" => [
                'type' => PARAM_RAW,
                'default' => '',
            ],
            "category" => [
                'type' => PARAM_RAW,
                'default' => '',
            ],
            "categoryname" => [
                'type' => PARAM_RAW,
                'default' => '',
            ],
            "details" => [
                'type' => PARAM_RAW,
                'default' => '',
            ],
            "studentsdata" => [
                'type' => PARAM_RAW,
                'default' => '',
            ],
            "coachesdata" => [
                'type' => PARAM_RAW,
                'default' => '',
            ],
            "assistantsdata" => [
                'type' => PARAM_RAW,
                'default' => '',
            ],
            "timecreated" => [
                'type' => PARAM_INT,
                'default' => '',
            ],
            "timemodified" => [
                'type' => PARAM_INT,
                'default' => '',
            ],
            "source" => [
                'type' => PARAM_RAW,
                'default' => '',
            ]
        ];
    }

    /**
     * Decorate the model.
     *
     * @return array
     */
    public function export() {
        if (!$this->get('id')) {
            return [];
        }

        $this->load_assistantsdata();
        $this->load_coachesdata();

        return [
            'id' => $this->get('id'),
            'idnumber' => $this->get('idnumber'),
            'creator' => $this->get('creator'),
            'status' => $this->get('status'),
            'teamname' => $this->get('teamname'),
            'category' => $this->get('category'),
            'categoryname' => tu_lib::get_cat_name($this->get('category')),
            'details' => $this->get('details'),
            'coaches' => $this->get('coachesdata'),
            'assistants' => $this->get('assistantsdata'),
            'timecreated' => $this->get('timecreated'),
            'timemodified' => $this->get('timemodified'),
        ];
    }
    
    /**
     * Load related assistant records 
     *
     * @return void
     */
    public function load_assistantsdata() {
        global $DB;

        if (empty($this->get('id'))) {
            return [];
        }

        $sql = "SELECT *
                  FROM {teamup_team_staff}
                 WHERE teamid = ?
                   AND usertype = 'assistant'
                   AND status = 0";
        $params = array($this->get('id'));
        $records = $DB->get_records_sql($sql, $params);

        $assistants = array();
        foreach($records as $rec) {
            $assistant = \local_teamup\lib\tu_lib::user_stub($rec->username);
            if (empty($assistant)) {
                continue;
            }
            $assistants[] = $assistant;
        }

        $this->set('assistantsdata', json_encode($assistants));
    }

    /**
     * Load related coaches records
     *
     * @return void
     */
    public function load_coachesdata() {
        global $DB;

        if (empty($this->get('id'))) {
            return [];
        }

        $sql = "SELECT *
                  FROM {teamup_team_staff}
                 WHERE teamid = ?
                   AND usertype = 'coach'
                   AND status = 0";
        $params = array($this->get('id'));
        $records = $DB->get_records_sql($sql, $params);

        $coaches = array();
        foreach($records as $rec) {
            $coach = \local_teamup\lib\tu_lib::user_stub($rec->username);
            if (empty($coach)) {
                continue;
            }
            $coaches[] = $coach;
        }

        $this->set('coachesdata', json_encode($coaches));
    }

    /**
     * Load related student recods.
     *
     * @return void
     */
    public function load_studentsdata() {
        global $DB;

        if (empty($this->get('id'))) {
            return [];
        }

        $sql = "SELECT *
                FROM {teamup_team_students}
                WHERE teamid = ?
                AND status = 0";
        $params = array($this->get('id'));
        $records = $DB->get_records_sql($sql, $params);

        $students = array();
        foreach($records as $rec) {
            $mdluser = \core_user::get_user_by_username($rec->username);
            if (empty($mdluser)) {
                continue;
            }
            $student = new \stdClass();
            $student->un = $mdluser->username;
            $student->fn = $mdluser->firstname;
            $student->ln = $mdluser->lastname;
            $student->attributes = [];
            $students[] = $student;
        }

        // Sort by last name.
        usort($students, fn($a, $b) => strcmp($a->ln, $b->ln));

        $this->set('studentsdata', json_encode($students));
    }

    /**
     * Get information about team files.
     *
     * @param string $area
     * @param int $id
     * @return array
     */
    public function export_files($area, $id = 0) {
        global $CFG;

        if (empty($id)) {
            if (!$this->get('id')) {
                return [];
            }
            $id = $this->get('id');
        }
        $out = [];
        $fs = get_file_storage();
	    $files = $fs->get_area_files(1, 'local_teamup', $area, $id, "filename", false);
        if ($files) {
            foreach ($files as $file) {
                $displayname = array_pop(explode('__', $file->get_filename()));
                $path = file_encode_url($CFG->wwwroot.'/pluginfile.php', '/1/local_teamup/'.$area.'/'.$id.'/'.$file->get_filename());
                $out[] = [
                    'displayname' => $displayname,
                    'fileid' => $file->get_id(),
                    'serverfilename' => $file->get_filename(),
                    'mimetype' => $file->get_mimetype(),
                    'path' => $path,
                    'existing' => true,
                ];
            }
        }
        
        return $out;
    }

    /**
     * Delete team
     *
     * @return string randomised idnumber
     */
    public function soft_delete() {
        global $DB;
        
        $this->set('deleted', 1);
        //randomize idnumber to take it out of playing field.
        $slug = 'archive-' . $this->get('idnumber');
        do {
            $random = substr(str_shuffle(MD5(microtime())), 0, 10);
            $idnumber = $slug.'-'.$random;
            $exists = $DB->record_exists('teamup_teams', ['idnumber' => $idnumber]);
        } while ($exists);
        $this->set('idnumber', $slug.'-'.$random);
        $this->update();
        return $slug.'-'.$random;
    }

}