<?php
namespace local_teamup\task;

defined('MOODLE_INTERNAL') || die();

require_once(__DIR__.'/../../classes/persistents/team.class.php');
require_once(__DIR__.'/../../classes/lib/teams.lib.php');
use \local_teamup\persistents\team;
use \local_teamup\lib\teams_lib;

class cron_sync_teams extends \core\task\scheduled_task {

    use \core\task\logging_trait;

    public function get_name() {
        return 'Sync teamup teams from SQL';
    }

    public function execute() {
        $this->print_start();
        $this->sync_teams();
        $this->print_finish();
    }

    private function sync_teams() {
        global $DB;

        $this->log("Fetching external teams using sync_teams_sql setting.");
        $config = get_config('local_teamup');
        if (empty($config->sync_teams_sql)) {
            $this->log("sync_teams_sql setting is not configured.");
            $this->print_finish();
            return;
        }
        $dbi = \moodle_database::get_driver_instance($config->dbtype, 'native', true);
        $dbi->connect($config->dbhost, $config->dbuser, $config->dbpass, $config->dbname, '');
        $externalrecords = $dbi->get_records_sql($config->sync_teams_sql);

        if (empty($externalrecords)) {
            $this->log_finish("No external teams were found.");
            $this->print_finish();
            return;
        }

        foreach($externalrecords as $external) {
            if (empty($external->teamidnumber)) {
                $this->log("Skipping record - Empty idnumber encountered.", 2);
                continue;
            }

            if (empty($external->mode)) {
                $this->log("Skipping record - Empty mode column. Mode options are 'create', 'update' or 'delete'", 2);
                continue;
            }
            $mode = strtolower($external->mode);

            switch ($mode) {
                case 'create':
                    $this->create_team($external);
                    break;
                case 'update':
                    $this->update_team($external);
                    break;
                case 'delete':
                    $this->delete_team($external);
                    break;
            }
        }
    }

    private function create_team($external) {
        global $DB;

        $blanks = empty($external->teamname);
        if ($blanks) {
            $this->log("Skipping record - Empty required field encountered. The following fields are required: TeamIdnumber, TeamName, Mode.", 2);
            return;
        }
        
        $unset = !isset($external->categoryidnumber) || !isset($external->teamdescription);
        if ($unset) {
            $this->log("Skipping record - Required columns missing. The following columns must exist, but may be empty: CategoryIdnumber, TeamDescription.", 2);
            return;
        }

        $idnumber = strtolower($external->teamidnumber);
        $existing = $DB->get_record('teamup_teams', ['idnumber' => $idnumber]);
        if ($existing) {
            $this->log("Skipping create - Existing team found with idnumber '{$idnumber}'. Mode column is set to 'create'.", 2);
            return;
        }

        $team = new team();
        $team->set('creator', '');
        $team->set('status', teams_lib::STATUS_LIVE);
        $team->set('idnumber', $idnumber);
        $team->set('category', strtolower($external->categoryidnumber));
        $team->set('teamname', $external->teamname);
        $team->set('details', $external->teamdescription);
        $team->set('source', 'db');
        $team->save();
        if ($team->get('id')) {
            $this->log("Success - Team created: idnumber '{$idnumber}'", 2);
        }
    }

    private function update_team($external) {
        global $DB;

        $blanks = empty($external->teamname);
        if ($blanks) {
            $this->log("Skipping record - Empty required field encountered. The following fields are required: TeamIdnumber, TeamName, Mode.", 2);
            return;
        }

        $idnumber = strtolower($external->teamidnumber);
        $existing = $DB->get_record('teamup_teams', ['idnumber' => $idnumber]);
        if (!$existing) {
            $this->log("Skipping update - Existing team not found with idnumber '{$idnumber}'. Attempting create instead.", 2);
            $this->create_team($external);
            return;
        }

        if ($existing->source != 'db') {
            $this->log("Skipping update - Team found ({$idnumber}) was created by another source ('{$existing->source}').", 2);
            return;
        }

        $team = new team($existing->id);
        $team->set('category', strtolower($external->categoryidnumber));
        $team->set('teamname', $external->teamname);
        $team->set('details', $external->teamdescription);
        $team->save();
        $this->log("Success - Team updated: idnumber '{$idnumber}'", 2);
    }

    private function delete_team($external) {
        global $DB;

        $idnumber = strtolower($external->teamidnumber);
        $existing = $DB->get_record('teamup_teams', ['idnumber' => $idnumber]);
        if (!$existing) {
            $this->log("Skipping delete - Existing team not found with idnumber '{$idnumber}'.", 2);
            return;
        }

        if ($existing->source != 'db') {
            $this->log("Skipping delete - Team found ({$idnumber}) was created by another source ('{$existing->source}').", 2);
            return;
        }

        $team = new team($existing->id);
        $archiveidnumber = $team->soft_delete();
        $this->log("Success - Team deleted: idnumber '{$idnumber}' randomized and archived to '{$archiveidnumber}'", 2);
    }

    private function print_start() {
        $this->log_start("\n");
        $this->log_start("<------------ TEAMUP cron_sync_teams ------------<");
    }

    private function print_finish() {
        $this->log_finish(">------------ END TEAMUP cron_sync_teams ------------>");
        $this->log_finish("\n");
    }

    public function can_run(): bool {
        return true;
    }
}