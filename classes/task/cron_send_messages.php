<?php
namespace local_teamup\task;

defined('MOODLE_INTERNAL') || die();

require_once(__DIR__.'/../../classes/lib/messages.lib.php');
use \local_teamup\lib\messages_lib;

class cron_send_messages extends \core\task\scheduled_task {

    use \core\task\logging_trait;

    public function get_name() {
        return 'Send notifications and emails for messages';
    }

    public function execute() {
        $this->print_start();

        $this->send_messages();

        $this->print_finish();
    }

    private function send_messages() {
        global $DB;

        // Get unprocessed messages.
        $sql = "SELECT *
                FROM {teamup_messages}
                WHERE deleted = 0
                AND (notificationsent = 0 OR emailsent = 0)";
        $messages = $DB->get_records_sql($sql);
        if (empty($messages)) {
            $this->log("No unsent messages found.");
            return;
        }

        // Send notifcations and emails.
        $messageids = array_column($messages, 'id');
        $this->log("Found messages: " . json_encode($messageids));

        foreach ($messages as $message) {
            if ($message->notificationsent == 0) {
                $this->log("Sending notifications for message " . $message->id);
                messages_lib::send_notifications($message->id);
            }

            if ($message->emailsent == 0) {
                $this->log("Setting up tasks to send emails for message " . $message->id);
                messages_lib::create_send_message_email_tasks($message->id); 
            }
        }

    }

    private function print_start() {
        $this->log_start("\n");
        $this->log_start("<------------ TEAMUP cron_send_messages ------------<");
    }

    private function print_finish() {
        $this->log_finish(">------------ END TEAMUP cron_send_messages ------------>");
        $this->log_finish("\n");
    }
        
}