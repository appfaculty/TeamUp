<?php
namespace local_teamup\task;
defined('MOODLE_INTERNAL') || die();
class cron_task_runner extends \core\task\scheduled_task {

    use \core\task\logging_trait;

    public function get_name() {
        return 'Spawn teamup tasks';
    }

    public function execute() {

        $this->print_start();

        $this->spawn_unprocessed_tasks();

        $this->print_finish();
        
    }

    private function spawn_unprocessed_tasks() {
        global $DB;

        // Run unprocessed tasks.
        $sql = "SELECT *
                  FROM {teamup_tasks}
                 WHERE status = 0";
        $tasks = $DB->get_records_sql($sql);

        if (empty($tasks)) {
            $this->log("No unprocessed teamup tasks found.");
            return;
        }

        // Update all as dispatched.
        $taskids = array_column($tasks, 'id');
        $this->log("Found tasks: " . json_encode($taskids));
        list($insql, $params) = $DB->get_in_or_equal($taskids);
        $sql = "UPDATE {teamup_tasks} SET status = '1' WHERE id $insql";
        $DB->execute($sql, $params);

        // Create adhoc tasks.
        foreach ($tasks as $task) {
            $classname = '\local_teamup\task\adhoc_' . $task->taskname;
            $this->log("Spawning teamup_task {$task->id}: {$classname}");
            $adhoc = new $classname();
            $user = \core_user::get_user_by_username($task->creatorusername);
            $adhoc->set_userid($user->id);
            $adhoc->set_custom_data(['taskid' => $task->id, 'taskdata' => json_decode($task->data)]);
            $adhoc->set_component('local_teamup');
            $taskadhocid = \core\task\manager::queue_adhoc_task($adhoc);

            $this->log("Created mdl_task_adhoc.id: {$taskadhocid}");
            $sql = "UPDATE {teamup_tasks} SET taskadhocid = {$taskadhocid} WHERE id = {$task->id}";
            $DB->execute($sql);
        }
    }

    private function print_start() {
        $this->log_start("\n");
        $this->log_start("<------------ TEAMUP cron_task_runner ------------<");
    }

    private function print_finish() {
        $this->log_finish(">------------ END TEAMUP cron_task_runner ------------>");
        $this->log_finish("\n");
    }

    public function can_run(): bool {
        return true;
    }
        
}