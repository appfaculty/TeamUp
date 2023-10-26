<?php
namespace local_teamup\task;

defined('MOODLE_INTERNAL') || die();

require_once(__DIR__.'/../../classes/lib/teams.lib.php');
require_once(__DIR__.'/../../classes/lib/events.lib.php');
require_once(__DIR__.'/../../classes/lib/tu.lib.php');
require_once(__DIR__.'/../../classes/lib/messages.lib.php');

use \local_teamup\lib\events_lib;
use \local_teamup\lib\teams_lib;
use \local_teamup\lib\tu_lib;
use \local_teamup\lib\messages_lib;

class adhoc_cancel_event extends \core\task\adhoc_task {

    use \core\task\logging_trait;

    public function get_name() {
        return 'Cancel teamup event';
    }

    public function execute() {
        global $OUTPUT, $DB;

        $this->print_start();

        // Raise the time limit.
        \core_php_time_limit::raise(300);
        \raise_memory_limit(MEMORY_HUGE);

        // Cancellation data
        $cdata = $this->get_custom_data();
        $taskid = $cdata->taskid;
        $data = $cdata->taskdata;
        /* data example: {
            "eventid":"99",
            "action":"cancel",
            "series":"one",
            "teams":"select",
            "teamsChecked":["30","31"],
            "notifyChecked":["teamstaff","students"]
        }*/
        $this->log_start("Running event cancellation, teamup_tasks.id = " . $taskid . ", mdl_task_adhoc.id = " . $this->get_id());
        $this->log("Data: " . json_encode($data));

        // Find the teamup task and update to processing.
        $task = $DB->get_record('teamup_tasks', ['id' => $taskid, 'status' => 1]);
        if (empty($task)) {
            $this->log("TeamUp task not found. It may already be processing?");
            return;
        }
        $sql = "UPDATE {teamup_tasks} SET status = 2, timestarted = ? WHERE id = {$task->id}";
        $DB->execute($sql, [time()]);
        
        // The triggering event.
        $event = events_lib::get_event($data->eventid);
        if (empty($event)) {
            $this->log("TeamUp event not found. It may have been deleted?");
            return;
        }

        // Get the events being cancelled.
        $events = [];
        if ($data->series == 'one') {
            // Events in this grouping.
            $events = events_lib::get_events_in_series_group($event->scheduleid, $event->eventgroup);
        } else {
            // All events in series.
            $events = events_lib::get_events_in_series($event->scheduleid);
        }       

        // Filter out already cancelled events.
        if ($data->action == 'cancel') {
            $events = array_filter($events, function($e) {
                return $e->cancelled == 0;
            });
        }

        if (empty($events)) {
            $this->log("TeamUp events not found. They may have already been cancelled/deleted?");
            return;
        }

        // Get the teams being cancelled.
        $teams = [];
        if ($data->teams == 'all') {
            foreach($events as $event) {
                $eventteams = events_lib::get_event_teams($event->scheduleid, $event->eventgroup);
                $eventteamids = array_map(function($team){return $team->teamid;}, $eventteams);
                $teams = $eventteamids;
            }
        } else {
            // Selected teams.
            $teams = $data->teamsChecked;
        }
        $teams = array_unique($teams);

        // Filter out teams the initiating user is not permitted to cancel events for.
        // Coaches and assistants can submit cancellations for their own teams.
        if (!tu_lib::is_tu_manager($task->creatorusername)) {
            foreach($teams as $i => $teamid) {
                if (!teams_lib::is_teamstaff($teamid, $task->creatorusername)) {
                    $this->log("Skipping cancellation for team $teamid because initiating user is not team staff.");
                    unset($teams[$i]);
                }
            }
        }

        // Filter out events not being cancelled, based on selected teams.
        foreach($events as $i => $event) {
            if (!in_array($event->teamid, $teams)) {
                unset($events[$i]);
            }
        }

        $events = array_values($events);
        if (empty($events)) {
            $this->log("Events not found.");
            return;
        }

        // Cancel events.
        $col = ($data->action == 'cancel') ? 'cancelled' : 'deleted';
        list($insql, $params) = $DB->get_in_or_equal(array_column($events, 'id'));
        $sql = "UPDATE {teamup_events} SET $col = 1 WHERE id $insql";
        $this->log("Marking $col events: " . implode(',', $params));
        $DB->execute($sql, $params);

        if (empty($data->notifyChecked)) {
            $sql = "UPDATE {teamup_tasks} SET status = 3, timecompleted = ? WHERE id = {$task->id}";
            $DB->execute($sql, [time()]);
            $this->log("No notifications selected.");
            return;
        }

        // The recipients.
        $recipients = messages_lib::expand_recipients_from_selections($teams, [], $data->notifyChecked);
        $this->log("Users to be notified: " . implode(',', $recipients));
        if (empty($recipients)) {
            return;
        }

        // Create message.
        $events = events_lib::export($events);
        $subject = "{$events[0]->title} event cancellation";
        $message = $OUTPUT->render_from_template('local_teamup/cancellation', ['events' => $events]);
        $messageid = messages_lib::create($subject, $message, $recipients, $task->creatorusername);
        $this->log("Message created: {$messageid}");
    
        // Update task status to complete.
        $sql = "UPDATE {teamup_tasks} SET status = 3, timecompleted = ? WHERE id = {$task->id}";
        $DB->execute($sql, [time()]);
        $this->print_finish();
    }

    private function print_start() {
        $this->log_start("\n");
        $this->log_start("<------------ TEAMUP adhoc_cancel_event ------------<");
    }

    private function print_finish() {
        $this->log_finish(">------------ END TEAMUP adhoc_cancel_event ------------>");
        $this->log_finish("\n");
    }

}