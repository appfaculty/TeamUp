<?php

namespace local_teamup\api;

defined('MOODLE_INTERNAL') || die();

require_once(__DIR__.'/../lib/events.lib.php');
require_once(__DIR__.'/../lib/tu.lib.php');
require_once(__DIR__.'/../lib/teams.lib.php');
require_once(__DIR__.'/../persistents/team.class.php');

use \local_teamup\lib\events_lib;
use \local_teamup\lib\tu_lib;
use \local_teamup\lib\teams_lib;
use \local_teamup\persistents\team;

/**
 * Events API trait
 */
trait events_api {

    /**
     * Check if the current authenticated user is a team staff of a given event.
     * 
     * @return boolean
     */
    static public function is_event_teamstaff() {
        $eventid = required_param('id', PARAM_INT);
        return ['allowed' => events_lib::is_teamstaff_of_event($eventid)];
    }

    /**
     * Fetch events between start and end, for a given role, and optionally a child.
     *
     * @return array of exported events
     */
    static public function get_events() {
        $start = required_param('start', PARAM_INT);
        $end = required_param('end', PARAM_INT);
        $role = required_param('role', PARAM_TEXT);
        $child = optional_param('child', null, PARAM_RAW);

        $start = $start/1000;
        $end = $end/1000;

        $events = events_lib::get_events($start, $end, $role, $child);
        return events_lib::export($events);
    }

    /**
     * Get current authenticated user's events on today.
     *
     * @return array of exported events
     */
    static public function get_user_events_today() {
        $events = events_lib::get_user_events_today();
        foreach($events as &$event) {
            $event->events = events_lib::export($event->events);
        }
        return $events;
    }

    /**
     * Post a new event schedule.
     *
     * @param array $args
     * @return int schedule id
     */
    static public function post_schedule($args) {
        $args = (object) $args;
        if (empty($args->teams)) {
            return;
        }
        // Team idnumbers are required for schedule.
        $teamids = array_map(function($team) {
            return $team['id'];
        }, $args->teams);
        $args->teams = teams_lib::get_idnumbers($teamids);
        $scheduleid = events_lib::save_schedule($args);
        if ($scheduleid) {
            events_lib::create_events_from_schedule($scheduleid);
        }
        return $scheduleid;
    }

    /**
     * Get useful information about a event.
     *
     * @return array
     */
    static public function get_event_info() {
        $eventid = required_param('id', PARAM_INT);
        return events_lib::get_event_info($eventid);
    }

    /**
     * Get useful information about an event series from a given event.
     *
     * @return array
     */
    static public function get_event_series_info() {
        $eventid = required_param('id', PARAM_INT);
        return events_lib::get_event_series_info($eventid);
    }
    
    /**
     * Set up a task to handle an event cancellation with posted form data.
     *
     * @param array $args
     * @return int cancellation task id
     */
    static public function cancel_event($args) {
        return events_lib::create_cancellation_task((object) $args);
    }

    /**
     * The roll data for a given event and team.
     *
     * @return array team students and attendance info.
     */
    static public function get_attendance_students() {
        $eventid = required_param('eventid', PARAM_INT);
        $teamid = required_param('teamid', PARAM_INT);
        $team = new team($teamid);
        $team->load_studentsdata();
        $students = json_decode($team->get('studentsdata'));
        $roll = events_lib::get_roll_for_students($eventid, $students);
        return ['students' => $students, 'roll' => $roll];
    }

    /**
     * Submit roll mark action for a given event and user.
     *
     * @param array $args
     * @return void
     */
    static public function submit_attendance($args) {
        $args = (object) $args;
        return events_lib::submit_attendance($args->eventid, $args->username, $args->value, $args->geolocation, $args->method);
    }

    /**
     * Submit roll mark action for a given event and multiple users.
     *
     * @param array $args
     * @return void
     */
    static public function submit_attendance_multi($args) {
        $args = (object) $args;
        return events_lib::submit_attendance_multi($args->eventid, $args->usernames, $args->value, $args->geolocation);
    }
}
