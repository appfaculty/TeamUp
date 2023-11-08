<?php
namespace local_teamup\task;

defined('MOODLE_INTERNAL') || die();

require_once(__DIR__.'/../../classes/lib/events.lib.php');
use \local_teamup\lib\events_lib;

class cron_sync_schedules extends \core\task\scheduled_task {

    use \core\task\logging_trait;

    public function get_name() {
        return 'Sync teamup schedules from SQL';
    }

    public function execute() {
        $this->print_start();
        $this->sync_schedules();
        $this->process_schedules();
        $this->print_finish();
    }

    private function sync_schedules() {
        global $DB;

        $this->log("Fetching external schedules using sync_schedules_sql setting.");
        $config = get_config('local_teamup');
        if (empty($config->sync_schedules_sql)) {
            $this->log("sync_schedules_sql setting is not configured.");
            return;
        }
        $dbi = \moodle_database::get_driver_instance($config->dbtype, 'native', true);
        $dbi->connect($config->dbhost, $config->dbuser, $config->dbpass, $config->dbname, '');
        $externalrecords = $dbi->get_records_sql($config->sync_schedules_sql);

        if (empty($externalrecords)) {
            $this->log("No external schedules were found.");
            return;
        }

        foreach($externalrecords as $external) {
            if (empty($external->scheduleidnumber)) {
                $this->log("Skipping record - Empty idnumber encountered.", 2);
                continue;
            }
            $idnumber = strtolower($external->scheduleidnumber);
            $existing = $DB->get_record('teamup_schedules', ['idnumber' => $idnumber]);
            if ($existing) {
                $this->log("Skipping record - Existing schedule found with idnumber '{$idnumber}'. Schedule sync is create-only mode.", 2);
                continue;
            }

            $blanks = empty($external->teamidnumbers) || empty($external->eventdays)
            || empty($external->eventtime) || empty($external->eventtitle);
            if ($blanks) {
                $this->log("Skipping record - Empty required field encountered. The following fields are required: ScheduleIdnumber, TeamIdnumbers, EventDays, EventTime, EventTitle.", 2);
                continue;
            }
            $unset = !isset($external->eventlocation) || !isset($external->eventdescription);
            if ($unset) {
                $this->log("Skipping record - Required columns missing. The following columns must exist, but may be empty: EventLocation, EventDescription.", 2);
                continue;
            }
            $rec = new \stdClass();
            $rec->idnumber = $idnumber;
            $rec->source = 'db';
            $rec->status = 0;
            $rec->title = $external->eventtitle;
            $rec->location = $external->eventlocation;
            $rec->details = $external->eventdescription;

            $teams = array_map('trim', explode(',', $external->teamidnumbers));
            $rec->teams = json_encode(array_map('strtolower', $teams));

            $days = array_map('trim', explode(',', $external->eventdays));
            $times = array_map('trim', explode('-', $external->eventtime));
            if (count($times) !== 2 || strlen($times[0]) === 0 || strlen($times[1]) === 0) {
                $this->log("Skipping record - Malformed EventTime field encountered. Correct format is HH:MM-HH:MM", 2);
                continue;
            }
            $schedule = json_encode(
                (object) [
                    'days' => $days,
                    'start' => $times[0],
                    'end' => $times[1],
                ]
            );
            $rec->schedule = $schedule;
            $DB->insert_record('teamup_schedules', $rec);
            $this->log("Success - Schedule created: idnumber '{$rec->idnumber}'", 2);
        }
    }

    private function process_schedules() {
        global $DB;
        $this->log("Fetching unprocessed schedules with source 'db'.");
        $schedules = $DB->get_records('teamup_schedules', ['status' => 0, 'source' => 'db']);
        foreach($schedules as $schedule) {
            // Make sure teams exist before processing schedule.
            $teamcheckfailed = false;
            $teams = json_decode($schedule->teams);
            foreach($teams as $teamidnumber) {
                $team = $DB->get_record('teamup_teams', ['idnumber' => $teamidnumber]);
                if (!$team) {
                    $this->log("Skipping schedule - it contains a team that does not exist: idnumber $teamidnumber. Fix the team to allow the processing of this schedule." , 2);
                    $teamcheckfailed = true;
                    break;
                }
            }
            if (!$teamcheckfailed) {
                events_lib::create_events_from_schedule($schedule->id);
                $this->log("Proccessed creating events for schedule id '{$schedule->id}'", 2);
                $sql = "UPDATE {teamup_schedules} SET status = 1 WHERE id = ?";
                $DB->execute($sql, [$schedule->id]);
            }
        }
    }

    private function print_start() {
        $this->log_start("\n");
        $this->log_start("<------------ TEAMUP cron_sync_schedules ------------<");
    }

    private function print_finish() {
        $this->log_finish(">------------ END TEAMUP cron_sync_schedules ------------>");
        $this->log_finish("\n");
    }

    public function can_run(): bool {
        return true;
    }
}