<?php
namespace local_teamup\task;

defined('MOODLE_INTERNAL') || die();

require_once(__DIR__.'/../../classes/persistents/team.class.php');
require_once(__DIR__.'/../../classes/lib/teams.lib.php');
use \local_teamup\persistents\team;
use \local_teamup\lib\teams_lib;

class cron_sync_teamstudents extends \core\task\scheduled_task {

    use \core\task\logging_trait;

    public function get_name() {
        return 'Sync teamup team students from SQL';
    }

    public function execute() {
        $this->print_start();
        $this->sync_teamstudents();
        $this->print_finish();
    }

    private function sync_teamstudents() {
        global $DB;

        $this->log("Fetching external team students using sync_teamstudents_sql setting.");
        $config = get_config('local_teamup');
        if (empty($config->sync_teamstudents_sql)) {
            $this->log("sync_teamstudents_sql setting is not configured.");
            $this->print_finish();
            return;
        }
        $dbi = \moodle_database::get_driver_instance($config->dbtype, 'native', true);
        $dbi->connect($config->dbhost, $config->dbuser, $config->dbpass, $config->dbname, '');
        $externalrecords = $dbi->get_records_sql($config->sync_teamstudents_sql);

        if (empty($externalrecords)) {
            $this->log_finish("No external team students members were found.");
            $this->print_finish();
            return;
        }

        // Create a cache structure.
        $syncdata = array();
        $nonteams = array();
        foreach($externalrecords as $i => $external) {
            $blanks = empty($external->teamidnumber) || empty($external->username);
            if ($blanks) {
                $this->log("Skipping record - Empty required field encountered in row {$external->row}. The following fields are required: Row, TeamIdnumber, Username.", 2);
                unset($externalrecords[$i]);
                continue;
            }

            $idnumber = strtolower($external->teamidnumber);
            if (in_array($idnumber, $nonteams)) {
                unset($externalrecords[$i]);
                continue;
            }
            $team = $DB->get_record('teamup_teams', ['idnumber' => $idnumber]);
            if (!$team) {
                $this->log("Team not found with idnumber '{$idnumber}'. Rows with this TeamIdnumber will not be processed.", 2);
                unset($externalrecords[$i]);
                $nonteams[] = $idnumber;
                continue;
            }

            $syncdata[$team->id] = new \stdClass();
            $syncdata[$team->id] = array();
        }

        // Process the records again to populate data into the structure.
        foreach($externalrecords as $external) {
            $idnumber = strtolower($external->teamidnumber);

            $user = \core_user::get_user_by_username($external->username);
            if (!$user) {
                $this->log("Skipping record - User not found with username '{$external->username}'.", 2);
                continue;
            }

            $syncdata[$team->id][] = $external->username;
        }

        // Perform the sync.
        foreach ($syncdata as $teamid => $users) {
            $students = implode(', ', $users);
            $this->log("Syncing students for team id {$teamid}: " . $students, 2);
            teams_lib::sync_students_from_data($teamid, $users, 'db');
        }

    }

    
    private function print_start() {
        $this->log_start("\n");
        $this->log_start("<------------ TEAMUP cron_sync_teamstudents ------------<");
    }

    private function print_finish() {
        $this->log_finish(">------------ END TEAMUP cron_sync_teamstudents ------------>");
        $this->log_finish("\n");
    }

    public function can_run(): bool {
        return true;
    }
}