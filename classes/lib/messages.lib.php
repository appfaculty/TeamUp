<?php

namespace local_teamup\lib;

defined('MOODLE_INTERNAL') || die();

require_once(__DIR__.'/tu.lib.php');
require_once($CFG->libdir.'/messagelib.php');

use \local_teamup\lib\tu_lib;

/**
 * Messages lib
 */
class messages_lib {
    
    /**
     * Create a message
     *
     * @param string $subject
     * @param string $body
     * @param array $recipients
     * @param string $creator
     * @return int message id
     */
    public static function create($subject, $body, $recipients, $creator) {
        global $DB;

        $message = new \stdClass();
        $message->creatorusername = $creator;
        $message->subject = $subject;
        $message->message = $body;
        $message->notificationsent = 0;
        $message->emailsent = 0;
        $message->deleted = 0;
        $message->timecreated = time();
        $message->timemodified = time();
        $messageid = $DB->insert_record('teamup_messages', $message);

        $messageusers = array();
        foreach($recipients as $recipient) {
            // Attach the user.
            $messageusers[] = (object) [
                'messageid' => $messageid,
                'username' => $recipient 
            ];
        }
        $DB->insert_records('teamup_message_users', $messageusers);

        return $messageid;
    }

    /**
     * Create a message from submitted form data.
     *
     * @param array $args
     * @return int message id
     */
    public static function submit_message($args) {
        global $USER;

        // Is user allowed to post to these?
        if (count($args->teams) == 1) {
            // Post to single team from teams page.
            if (!tu_lib::is_tu_manager() && !teams_lib::is_teamstaff($args->teams[0])) {
                throw new \Exception("You do not have permission to message this team.");
            }
        } else {
            // Post to multiple teams, from manager block.
            if (!tu_lib::is_tu_manager()) {
                throw new \Exception("You do not have permission to message these teams.");
            }
        }

        $recipients = static::expand_recipients_from_selections($args->teams, $args->students, $args->notify);
        if (empty($recipients)) {
            throw new \Exception("No recipients found.");
        }
        return static::create($args->subject, $args->message, $recipients, $USER->username);
    }

    /**
     * Get recipient users from message form selections.
     *
     * @param array $teamids
     * @param array $selected students
     * @param array $notify who to notify based on student selections
     * @return array
     */
    public static function expand_recipients_from_selections($teamids, $selected, $notify) {
        $staff = [];
        $students = [];
        $parents = [];
        if (in_array('teamstaff', $notify)) {
            $staff = teams_lib::get_staff_for_teams($teamids);
            $staff = array_column($staff, 'username');
        }
        if (in_array('students', $notify)) {
            if (empty($selected)) {
                $students = teams_lib::get_students_for_teams($teamids);
                $students = array_unique(array_column($students, 'username'));
            } else {
                $students = $selected;
            }
        }
        if (in_array('parents', $notify)) {
            $parents = tu_lib::get_parents_for_students($students);
        }
        $recipients = array_unique(array_merge($staff, $students, $parents));
        return $recipients;
    }

    /**
     * Get exported message data from id.
     *
     * @param int $id
     * @return array
     */
    public static function get_message($id) {
        if (tu_lib::is_tu_manager() || static::is_creator_or_recipient($id)) {
            $message = static::get($id);
            $message->recipients = static::get_recipients($id);
            return $message;
        }
    }

    /**
     * Get raw message by id
     *
     * @param int $id
     * @return array
     */
    public static function get($id) {
        global $DB;

        return $DB->get_record('teamup_messages', ['id' => $id, 'deleted' => 0]);
    }

    /**
     * Get raw message recipients by message id
     *
     * @param int $messageid
     * @return array
     */
    public static function get_recipients($messageid) {
        global $DB;

        return $DB->get_records('teamup_message_users', ['messageid' => $messageid]);
    }

    /**
     * Send moodle notifications for a given message.
     *
     * @param int $messageid
     * @return array notification ids
     */
    public static function send_notifications($messageid) {
        global $OUTPUT, $DB;

        // Set up moodle notifications.
        $message = static::get($messageid);
        if (empty($message)) {
            return;
        }
        $sql = "UPDATE {teamup_messages} SET notificationsent = 1 WHERE id = {$messageid}";
        $DB->execute($sql);

        $recipients = static::get_recipients($messageid);
        $notificationids = [];
        foreach($recipients as $recipient) {
            $to = \core_user::get_user_by_username($recipient->username);

            $donotnotify = $DB->record_exists('user_preferences', [
                'userid' => $to->id,
                'name' => 'message_provider_local_teamup_notifications_enabled',
                'value' => 'none'
            ]);
            if ($donotnotify) {
                continue;
            }

            $from = \core_user::get_user_by_username($message->creatorusername);
            $url = (new \moodle_url('/local/teamup/messages/' . $messageid))->out(false);
            $templatedata = [
                'url' => $url, 
                'subject' => $message->subject, 
                'toolname' => tu_lib::get_toolname()
            ];
            $plain = $OUTPUT->render_from_template('local_teamup/notification_plain', $templatedata);
            $html = $OUTPUT->render_from_template('local_teamup/notification_html', $templatedata);            
            $notification = new \core\message\message();
            $notification->courseid = SITEID;
            $notification->component = 'local_teamup';
            $notification->name = 'notifications';
            $notification->userfrom = $from;
            $notification->userto = $to;
            $notification->anonymous = ($from->username == $to->username) ? true : false; // notification will not go if sender is recipient.
            $notification->subject = $message->subject;
            $notification->fullmessage = $plain;
            $notification->fullmessageformat = FORMAT_PLAIN;
            $notification->fullmessagehtml = $html;
            $notification->smallmessage = $html;
            $notification->notification = 1; // Because this is a notification generated from Moodle, not a user-to-user message
            $notification->contexturl = $url;
            $notification->contexturlname = 'View message';
            $notificationids[] = message_send($notification);
        }

        return $notificationids;      
    }

    /**
     * Set up tasks to send email notifications for a given message.
     *
     * @param int $messageid
     * @return void
     */
    public static function create_send_message_email_tasks($messageid) {
        global $DB;

        $message = static::get($messageid);
        if (empty($message)) {
            return;
        }

        $sql = "UPDATE {teamup_messages} SET emailsent = 1 WHERE id = {$messageid}";
        $DB->execute($sql);

        $recipients = static::get_recipients($messageid);
        $recipients = array_column($recipients, 'username');
        foreach ($recipients as $recipient) {
            $task = new \stdClass();
            $task->refid = $messageid;
            $task->creatorusername = $message->creatorusername;
            $task->taskname = 'send_message_email';
            $data = new \stdClass();
            $data->messageid = $messageid;
            $data->username = $recipient;
            $task->data = json_encode($data);
            $task->status = 0;
            $task->timecreated = time();
            $task->timestarted = 0;
            $task->timecompleted = 0;
            $id = $DB->insert_record('teamup_tasks', $task);
        }
    }

    /**
     * Get paged messages for the current authenticated user.
     *
     * @param int $page
     * @return array
     */
    public static function get_messages($page) {
        global $DB, $USER;

        $limitnum = 3;
        $limitfrom = $limitnum * ($page - 1);

        $sql = "SELECT DISTINCT m.* 
                FROM {teamup_messages} m
                INNER JOIN {teamup_message_users} mu ON m.id = mu.messageid
                WHERE (mu.username = ? OR m.creatorusername = ?)
                AND deleted = 0
                ORDER BY timecreated DESC
        ";

        $messages = $DB->get_records_sql(
            $sql, 
            [$USER->username, $USER->username],
            $limitfrom,
            $limitnum
        );

        return [
            'hasNextPage' => !empty($messages),
            'messages' => $messages
        ];
    }

    /**
     * Export message data
     *
     * @param array $rawmessages
     * @return array
     */
    public static function export($rawmessages) {
        global $USER;

        $messages = [];
        foreach ($rawmessages as $message) {
            $recipients = [];
            if (!empty($message->recipients)) {
                $recipients = array_map(function($r) {
                    return tu_lib::user_stub($r->username);
                }, $message->recipients);
            }
            $o = tu_lib::user_stub($message->creatorusername);
            $o->id = $message->id;
            $o->postedAt = date('j M Y, g:ia', $message->timemodified);
            $o->subject = $message->subject;
            $o->body = $message->message;
            $o->bodyplain = preg_replace( "/\n\s+/", "\n", rtrim(html_entity_decode(strip_tags($message->message))) );
            $o->isOwner = ($message->creatorusername == $USER->username);
            $o->recipients = array_values($recipients);
            $messages[] = $o;
        }
        return $messages;
    }

    /**
     * Delete a message by id
     *
     * @param int $id
     * @return boolean
     */
    public static function delete_message($id) {
        global $DB, $USER;

        $sql = "UPDATE {teamup_messages} SET deleted = 1 WHERE id = ?";
        $params = [$id];
        if (!tu_lib::is_tu_manager()) {
            $sql .= "  AND creatorusername = ?";
            $params[] = $USER->username;
        }
        return $DB->execute($sql, $params);
    }

    /**
     * Edit message from submitted data.
     *
     * @param array $data
     * @return boolean
     */
    public static function edit_message($data) {
        global $DB, $USER;

        $message = nl2br($data->message);
        $sql = "UPDATE {teamup_messages} 
                SET subject = ?, message = ?
                WHERE id = ?";
        $params = [$data->subject, $message, $data->id];
        if (!tu_lib::is_tu_manager()) {
            $sql .= "  AND creatorusername = ?";
            $params[] = $USER->username;
        }
        return $DB->execute($sql, $params);
    }

    /**
     * Check if current authenticated user is the creator or recipient of a given message.
     *
     * @param int $id
     * @return boolean
     */
    public static function is_creator_or_recipient($id) {
        global $DB, $USER;
        
        $sql = "SELECT DISTINCT m.id
                FROM {teamup_messages} m
                INNER JOIN {teamup_message_users} mu ON m.id = mu.messageid
                WHERE m.id = ?
                AND (mu.username = ? OR m.creatorusername = ?)
        ";

        $message = $DB->get_record_sql($sql, [$id, $USER->username, $USER->username]);
        if ($message) {
            return true;
        }
        return false;
    }

}
