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

class adhoc_send_message_email extends \core\task\adhoc_task {

    use \core\task\logging_trait;

    public function get_name() {
        return 'Send email';
    }

    public function execute() {
        global $OUTPUT, $DB;

        $this->print_start();
        $cdata = $this->get_custom_data();
        $taskid = $cdata->taskid;
        $data = $cdata->taskdata;
        //Eg. {"messageid":123,"username":"student1"}'
        $adhocid = $this->get_id();
        $this->log("Sending email for message id {$data->messageid}. teamup_tasks id {$taskid}. mdl_task_adhoc id {$adhocid}");
        
        // Get the teamup task record.
        $task = $DB->get_record('teamup_tasks', ['id' => $taskid, 'status' => 1]);
        if (empty($task)) {
            $this->log("TeamUp task not found. It may already be processing?");
            return;
        }

        // Get the message record.
        $message = messages_lib::get($data->messageid);
        if (empty($message)) {
            $this->log("Message not found. It could have been deleted?");
            return;
        }
        $message = messages_lib::export([$message])[0];

        // Update the teamup task to processing.
        $sql = "UPDATE {teamup_tasks} SET status = 2, timestarted = ? WHERE id = {$task->id}";
        $DB->execute($sql, [time()]);

        // Render the message body.
        $messagehtml = $OUTPUT->render_from_template('local_teamup/email_message_html', ['message' => $message]);
        $messagetext = $OUTPUT->render_from_template('local_teamup/email_message_text', ['message' => $message]);

        $teamupconfig = get_config('local_teamup');
        $body = new \stdClass();
        $body->text = $messagetext;
        $body->html =  $OUTPUT->render_from_template('local_teamup/email_template', array(
            'body' => $messagehtml, 
            'subject' => $message->subject, 
            'url' => (new \moodle_url("/local/teamup/messages/{$message->id}"))->out(), 
            'toolname' => tu_lib::get_toolname(),
            'emaillogo' => !empty($teamupconfig->emaillogo) ? $teamupconfig->emaillogo : (new \moodle_url("/local/teamup/images/email-logo.png"))->out(),
        ));
        
        // Send the email.
        $this->log("Recipient: {$data->username}. Subject: {$message->subject}.");
        $result = tu_lib::send_email($message->subject, $body, $data->username, $message->un);
        $this->log("Result: {$result}");
    
        // Update the teamup task to complete.
        $sql = "UPDATE {teamup_tasks} SET status = 3, timecompleted = ? WHERE id = {$task->id}";
        $DB->execute($sql, [time()]);
        $this->print_finish();
    }

    private function print_start() {
        $this->log_start("\n");
        $this->log_start("<------------ TEAMUP adhoc_send_message_email ------------<");
    }

    private function print_finish() {
        $this->log_finish(">------------ END TEAMUP adhoc_send_message_email ------------>");
        $this->log_finish("\n");
    }

}