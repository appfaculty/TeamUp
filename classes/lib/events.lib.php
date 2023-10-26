<?php

namespace local_teamup\lib;

defined('MOODLE_INTERNAL') || die();

require_once(__DIR__.'/tu.lib.php');
require_once(__DIR__.'/teams.lib.php');
require_once(__DIR__.'/../persistents/team.class.php');

use \local_teamup\persistents\team;
use \local_teamup\lib\tu_lib;
use \local_teamup\lib\teams_lib;

/**
 * Events lib
 */
class events_lib {

    /**
     * Check if current authenticated user is a staff member of the team associated with a given event.
     *
     * @param int $id event id
     * @return boolean
     */
    public static function is_teamstaff_of_eventteam($id) {
        // Is the user a teamstaff of one of the teams grouped under this event?
        $event = static::get_event($id);
        if (empty($event)) {
            return false;
        }
        if (teams_lib::is_teamstaff($event->teamid)) {
            return true;
        }
        return false;
    }

    /**
     * Check if current authenticated user is a staff member of any team grouped under a given event.
     *
     * @param int $id event id
     * @return boolean
     */
    public static function is_teamstaff_of_event($id) {
        // Is the user a teamstaff of one of the teams grouped under this event?
        $event = static::get_event($id);
        if (empty($event)) {
            return false;
        }
        $teams = static::get_event_teams($event->scheduleid, $event->eventgroup);
        foreach($teams as $team) {
            if (teams_lib::is_teamstaff($team->teamid)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Get teams for a given day in an event series.
     *
     * @param int $scheduleid
     * @param int $eventgroup
     * @return array
     */
    public static function get_event_teams($scheduleid, $eventgroup) {
        global $DB;
        $sql = "SELECT *
                FROM {teamup_events}
                WHERE scheduleid = ?
                AND eventgroup = ?
                AND deleted = 0";
        $groupevents = $DB->get_records_sql($sql, [$scheduleid, $eventgroup]);
        $teams = array_map(function($gevent) {
            return (object) [
                'teamid' => $gevent->teamid,
                'teamname' => $gevent->teamname,
                'cancelled' => $gevent->cancelled,
            ];
        }, $groupevents);
        return $teams;
    }

    /**
     * Get raw event data by id.
     *
     * @param int $id
     * @return array
     */
    public static function get_event($id) {
        global $DB;
        return $DB->get_record('teamup_events', ['id' => $id, 'deleted' => 0]);
    }

    /**
     * Get raw event data for a series.
     *
     * @param int $scheduleid
     * @return array
     */
    public static function get_events_in_series($scheduleid) {
        global $DB;
        $sql = "SELECT *
                FROM {teamup_events}
                WHERE scheduleid = ?
                  AND deleted = 0";
        return $DB->get_records_sql($sql, [$scheduleid]);
    }

    /**
     * Get raw evemts for a given day in an event series.
     *
     * @param int $scheduleid
     * @param int $eventgroup
     * @return array
     */
    public static function get_events_in_series_group($scheduleid, $grouping) {
        global $DB;
        $sql = "SELECT *
                FROM {teamup_events}
                WHERE scheduleid = ?
                  AND eventgroup = ?
                  AND deleted = 0";
        return $DB->get_records_sql($sql, [$scheduleid, $grouping]);
    }

    /**
     * Get useful information about an event series from an event id.
     *
     * @param int $id event id
     * @return array
     */
    public static function get_event_series_info($id) {
        global $DB;
        $event = $DB->get_record('teamup_events', ['id' => $id]);

        $teams = [];
        $hasTeams = false;

        $teamsOnThisDate = [];
        $hasTeamsOnThisDate = false;

        $lastDate = 0;
        $hasDates = false;

        
        // Get other teams in this series.
        $sql = "SELECT *
                FROM {teamup_events}
                WHERE scheduleid = ?
                  AND deleted = 0";
        $scheduleevents = $DB->get_records_sql($sql, [$event->scheduleid]);
        foreach ($scheduleevents as $event) {
            if (!isset($teams[$event->teamid])) {
                // Can user affect this team?
                if (!tu_lib::is_tu_manager()) {
                    if (!teams_lib::is_teamstaff($event->teamid)) {
                        continue;
                    }
                }
                $teams[$event->teamid] = [
                    'teamid' => $event->teamid,
                    'teamname' => $event->teamname,
                ];
            }
            if ($lastDate == 0) {
                $lastDate = $event->timestart;
            }
            if ($lastDate != $event->timestart) {
                $hasDates = true;
            }
        }
        if (count($teams) > 1) {
            $hasTeams = true;
        }

        // Get other teams on this date.
        $sql = "SELECT *
                FROM {teamup_events}
                WHERE scheduleid = ?
                AND eventgroup = ?
                AND deleted = 0";
        $groupevents = $DB->get_records_sql($sql, [$event->scheduleid, $event->eventgroup]);
        $teamsOnThisDate = array_map(function($event) {
            return [
                'teamid' => $event->teamid,
                'teamname' => $event->teamname,
            ];
        }, $groupevents);
        if (!tu_lib::is_tu_manager()) {
            foreach($teamsOnThisDate as $i => $team) {
                if (!teams_lib::is_teamstaff($team['teamid'])) {
                    unset($teamsOnThisDate[$i]);
                }
            }
        }
        if (count($teams) > 1) {
            $hasTeamsOnThisDate = true;
        }

        $hasMultiple = $hasTeams || $hasDates;

        return [
            'teams' => array_values($teams),
            'hasTeams' => $hasTeams,
            'teamsOnThisDate' => array_values($teamsOnThisDate),
            'hasTeamsOnThisDate' => $hasTeamsOnThisDate,
            'hasDates' => $hasDates,
            'hasMultiple' => $hasMultiple,
        ];
    }

    /**
     * Get exported event info and teams by event id.
     *
     * @param int $id
     * @return array
     */
    public static function get_event_info($id) {
        global $DB;

        $event = static::get_event($id);
        if (empty($event)) {
            return;
        }

        $teams = static::get_event_teams($event->scheduleid, $event->eventgroup);
        if (!tu_lib::is_tu_manager()) {
            foreach($teams as $i => $team) {
                if (!teams_lib::is_teamstaff($team->teamid)) {
                    unset($teams[$i]);
                }
            }
        }

        return [
            'event' => static::export([$event])[0],
            'teams' => array_values($teams),
        ];
    }

    /**
     * Fetch events between start and end, for a given role, and optionally a child.
     *
     * @param int $start
     * @param int $end
     * @param string $role
     * @param string $child
     * @return array of exported events
     */
    public static function get_events($start, $end, $role, $child = null) {
        global $DB;

        $events = [];
        $rawevents = [];
        if ($role == "browse") {
            // Only institution managers/staff allowed.
            if (!tu_lib::is_tu_manager_or_staff()) {
                return [];
            }
            $sql = "SELECT e.*
                    FROM {teamup_events} e
                    INNER JOIN {teamup_teams} t ON e.teamid = t.id
                    WHERE e.deleted = 0
                    AND t.status = " . teams_lib::STATUS_LIVE . "
                    AND (
                        (e.timestart >= ? AND e.timestart <= ?) OR 
                        (e.timeend >= ? AND e.timeend <= ?) OR
                        (e.timestart < ? AND e.timeend > ?)
                    )
                    ORDER BY e.timestart ASC";
            $rawevents = $DB->get_records_sql($sql, [$start, $end, $start, $end, $start, $end]);
        } else {
            // Viewing as teamstaff/teamstudent/parent
            $teams = teams_lib::get_users_teams($role, $child);
            // Get events for teams that either start within the range or end within the range.
            $rawevents = static::get_events_for_teams_and_dates($teams, $start, $end);
        }

        $events = static::group_raw_events($rawevents);
        return $events;
    }

    /**
     * Group events into a useful array for display.
     *
     * @param array $rawevents
     * @return array regrouped raw events
     */
    public static function group_raw_events($rawevents) {
        $events = [];
        $groupevents = [];
        foreach($rawevents as $rawevent) {
            // If it has a eventgroup (same schedule and day as other teams)
            if ($rawevent->eventgroup && !$rawevent->altered) {
                $key = $rawevent->scheduleid . "_" . $rawevent->eventgroup;
                if (!isset($groupevents[$key])) {
                    $groupevents[$key] = array();
                }
                $groupevents[$key][] = $rawevent;
            } else {
                $events[] = $rawevent;
            }
        }

        // Collapse grouped events into one event with many teams.
        foreach($groupevents as $eventgroup) {
            if (empty($eventgroup)) {
                continue;
            }
            else if (count($eventgroup) == 1) {
                $events[] = array_pop($eventgroup);
            }
            else {
                $teams = [];
                $allcancelled = 1;
                foreach ($eventgroup as $gevent) {
                    $teams[] = [
                        'teamid' => $gevent->teamid,
                        'teamname' => $gevent->teamname,
                        'cancelled' => $gevent->cancelled,
                    ];
                    if (!$gevent->cancelled) {
                        $allcancelled = 0;
                    }
                }

                $event = array_pop($eventgroup);
                $event->cancelled = $allcancelled;
                $event->teams = $teams;
                $events[] = $event;
            }
        }

        return $events;
    }

    /**
     * Fetch events for the current authenticated user happening today.
     *
     * @return array of events
     */
    public static function get_user_events_today() {
        global $DB, $USER;

        $events = [];
        $today = date('Y-m-d', time());
        $start = strtotime($today . '00:00:00');
        $end = strtotime($today . '23:59:59');

        $allroles = tu_lib::get_teamup_roles();
        $dayroles = [];
        foreach ($allroles as $role) {
            if ($role == 'student' || $role == 'parent') {
                $dayroles[] = $role;
            }
            if ($role == 'coach' || $role == 'assistant') {
                $dayroles[] = 'teamstaff';
            } 
        }
        $dayroles = array_unique($dayroles);

        foreach ($dayroles as $role) {
            if ($role == 'student') {
                // Find events where I am in the team.
                $teams = teams_lib::get_users_teams('teamstudent');
                $rawevents = static::get_events_for_teams_and_dates($teams, $start, $end);
                if ($rawevents) {
                    $rawevents = static::group_raw_events($rawevents);
                    $events[] = (object) array(
                        'role' => 'teamstudent',
                        'events' => $rawevents,
                    );
                }
            }
            if ($role == 'teamstaff') {
                // Find events where I am a staff in the team.
                $teams = teams_lib::get_users_teams('teamstaff');
                $rawevents = static::get_events_for_teams_and_dates($teams, $start, $end);
                if ($rawevents) {
                    $rawevents = static::group_raw_events($rawevents);
                    $events[] = (object) array(
                        'role' => 'teamstaff',
                        'events' => $rawevents,
                    );
                }
            }
            if ($role == 'parent') {
                // Find events where one of my children are in the team.
                $children = tu_lib::get_users_children();
                foreach($children as $child) {
                    $teams = teams_lib::get_users_teams('parent', $child->un);
                    $rawevents = static::get_events_for_teams_and_dates($teams, $start, $end);
                    if ($rawevents) {
                        $rawevents = static::group_raw_events($rawevents);
                        $events[] = (object) array(
                            'role' => 'parent',
                            'child' => $child,
                            'events' => $rawevents,
                        );
                    }
                }
            }
        }

        return $events;
    }

    /**
     * Fetch events for specified teams between start and end.
     *
     * @param array $teams array of team ids.
     * @param int $start
     * @param int $end
     * @return array
     */
    public static function get_events_for_teams_and_dates($teams, $start, $end) {
        global $DB;
        if (empty($teams)) {
            return [];
        }
        list($insql, $params) = $DB->get_in_or_equal($teams);
        $sql = "SELECT e.*
                FROM {teamup_events} e
                INNER JOIN {teamup_teams} t ON e.teamid = t.id
                WHERE e.deleted = 0
                AND t.status = " . teams_lib::STATUS_LIVE . "
                AND (
                    (e.timestart >= ? AND e.timestart <= ?) OR 
                    (e.timeend >= ? AND e.timeend <= ?) OR
                    (e.timestart < ? AND e.timeend > ?)
                )
                AND e.teamid $insql
                ORDER BY e.timestart ASC";
        $params = array_merge([$start, $end, $start, $end, $start, $end], $params);
        return $DB->get_records_sql($sql, $params);
    }

    /**
     * Decorate raw event data.
     *
     * @param array $events
     * @return array
     */
    public static function export($events) {
        return array_values(array_map(function ($event) {
            return (object) array_merge((array) $event, [
                'start' => date('Y-m-d\TH:i:s', $event->timestart),
                'end' => date('Y-m-d\TH:i:s', $event->timeend),
                'startReadable' => date('g:ia, j M Y', $event->timestart),
                'endReadable' => date('g:ia, j M Y', $event->timeend),
                'timestartReadable' => date('G:i', $event->timestart),
                'timeendReadable' => date('G:i', $event->timeend),
                'teams' => property_exists($event, 'teams') ? $event->teams : [ (object) ['teamid' => $event->teamid, 'teamname' => $event->teamname] ],
                'cancelled' => $event->cancelled == 1 ? true : false,
                'backgroundColor' => $event->cancelled ? '#EF9A9A' : '#206bc4',
                'display' => "block",
            ]);
        }, $events));
    }

    /**
     * Create schedule record from submitted form data.
     *
     * @param array $data
     * @param string $source
     * @return int new schedule id.
     */
    public static function save_schedule($data, $source = 'ui') {
        global $USER, $DB;

        if (!tu_lib::is_manager_or_teamstaff()) {
            throw new \Exception("Permission denied.");
            exit;
        }

        // Check everything is there.
        if (empty($data->title) || 
            empty($data->days) || 
            empty($data->teams) || 
            empty($data->start) || 
            empty($data->end)   || 
            empty($data->location)) {
            throw new \Exception("Submitted data is malformed." . json_encode($data));
            exit;
        }

        $schedule = new \stdClass();
        $schedule->teams = json_encode($data->teams);
        $schedule->schedule = json_encode(
            (object) [
                'days' => $data->days,
                'start' => $data->start,
                'end' => $data->end,
            ]
        );
        $schedule->title = $data->title;
        $schedule->location = $data->location;
        $schedule->details = $data->details;
        $schedule->source = $source;
        $schedule->status = 0;
        $scheduleid = $DB->insert_record('teamup_schedules', $schedule);
        return $scheduleid;
    }

    /**
     * Create events from a schedule record.
     *
     * @param int $scheduleid
     * @param boolean $force
     * @return void
     */
    public static function create_events_from_schedule($scheduleid, $force = false) {
        global $USER, $DB;
        $schedule = $DB->get_record('teamup_schedules', ['id' => $scheduleid]);
        if (empty($schedule)) {
            return;
        }
        if ($schedule->status == 1 && !$force) {
            return;
        }

        $calendar = json_decode($schedule->schedule);
        $teams = json_decode($schedule->teams);

        $events = array();
        $eventgroup = 0;
        foreach($calendar->days as $day) {
            $eventgroup++;
            $timestart = strtotime( $day . $calendar->start . ':00');
            $timeend = strtotime( $day . $calendar->end . ':00');
            foreach($teams as $teamidnumber) {
                $team = $DB->get_record('teamup_teams', ['idnumber' => $teamidnumber, 'deleted' => 0]);
                if (!$team) {
                    continue;
                }
                $events[] = (object) [
                    'teamid' => $team->id,
                    'teamname' => $team->teamname,
                    'eventgroup' => $eventgroup,
                    'title' => $schedule->title,
                    'timestart' => $timestart,
                    'timeend' => $timeend,
                    'location' => $schedule->location,
                    'details' => $schedule->details,
                    'scheduleid' => $scheduleid,
                    'deleted' => 0,
                    'cancelled' => 0,
                    'altered' => 0,
                ];
            }
        }

        $DB->insert_records('teamup_events', $events);
    }

    /**
     * Create a cancellation task from submitted form data.
     * 
     * Example form data:
     *   (object) array(
     *     'eventid' => '33',
     *     'action' => 'cancel',
     *     'series' => 'all',
     *     'teams' => 'select',
     *     'teamsChecked' => 
     *       array (
     *         1 => true,
     *         2 => true,
     *       ),
     *     'notifyChecked' => 
     *       array (
     *         0 => 'teamstaff',
     *         1 => 'students',
     *       ),
     *   )
     *
     * @param array $data
     * @return int task id
     */
    public static function create_cancellation_task($data) {
        global $USER, $DB;
        
        $task = new \stdClass();
        $task->refid = $data->eventid;
        $task->creatorusername = $USER->username;
        $task->taskname = 'cancel_event';
        $task->data = json_encode($data);
        $task->status = 0;
        $task->timecreated = time();
        $task->timestarted = 0;
        $task->timecompleted = 0;
        $id = $DB->insert_record('teamup_tasks', $task);
        return $id;
    }

    /**
     * Insert or update roll mark for a given event and user.
     *
     * @param int $eventid
     * @param string $username
     * @param int $rollstatus
     * @param string $geolocation
     * @param string $method
     * @param boolean $skipstaffcheck
     * @return array result information
     */
    public static function submit_attendance($eventid, $username, $rollstatus, $geolocation = '', $method = null, $skipstaffcheck = false) {
        global $DB;

        if (!$skipstaffcheck && !tu_lib::is_tu_manager() && !static::is_teamstaff_of_eventteam($eventid)) {
            throw new \Exception("You do not have permission to mark this roll.");
        }

        $result = 0;
        $existing = $DB->get_record('teamup_event_roll', ['eventid' => $eventid, 'username' => $username]);
        if ($existing) {
            $existing->rollstatus = $rollstatus;
            $existing->geolocation = $geolocation;
            $existing->timemarked = time();
            $result = $DB->update_record('teamup_event_roll', $existing);
        } else {
            $roll = new \stdClass();
            $roll->eventid = $eventid;
            $roll->username = $username;
            $roll->rollstatus = $rollstatus;
            $roll->geolocation = $geolocation;
            $roll->timemarked = time();
            $result = $id = $DB->insert_record('teamup_event_roll', $roll);
        }
        if ($result) {
            return ['operation' => $method ? $method : 'single', 'username' => $username, 'value' => $rollstatus];
        }
        throw new \Exception("There was an error submitting attendance");
    }

    /**
     * Submit roll mark action for a given event and multiple users.
     *
     * @param int $eventid
     * @param array $usernames
     * @param int $rollstatus
     * @param string $geolocation
     * @return array
     */
    public static function submit_attendance_multi($eventid, $usernames, $rollstatus, $geolocation = '') {
        global $DB;

        if (!tu_lib::is_tu_manager() && !static::is_teamstaff_of_eventteam($eventid)) {
            return false;
        }

        foreach ($usernames as $i => $username) {
            $result = static::submit_attendance($eventid, $username, $rollstatus, $geolocation, null, true);
            if (!$result) {
                unset($usernames[$i]);
            }
        }
        return ['operation' => 'multi', 'usernames' => $usernames, 'value' => $rollstatus];
    }

    /**
     * Get roll data for a given event and list of student stub objects.
     *
     * @param int $eventid
     * @param array $students
     * @return array
     */
    public static function get_roll_for_students($eventid, $students) {
        global $DB;
        $roll = [];
        $records = $DB->get_records('teamup_event_roll', ['eventid' => $eventid]);
        $usernames = array_column($records, "username");
        $records = array_combine($usernames, $records);
        foreach($students as $student) {
            if (array_key_exists($student->un, $records)) {
                $roll[$student->un] = $records[$student->un]->rollstatus;
            }
        }
        return $roll;
    }
    
}