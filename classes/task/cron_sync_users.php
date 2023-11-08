<?php
namespace local_teamup\task;
defined('MOODLE_INTERNAL') || die();
class cron_sync_users extends \core\task\scheduled_task {

    use \core\task\logging_trait;

    public function get_name() {
        return 'Sync teamup user index task';
    }

    public function execute() {

        $this->print_start();

        $this->log("Syncing teamup user index table.");
        $this->sync_users();

        $this->log("Syncing teamup relationships index table.");
        $this->sync_relationships();

        $this->print_finish();
    }

    private function sync_users() {
        global $DB;

        // Sync users from mdl_users.
        $sql = "SELECT u.username, u.id, d.data
                  FROM mdl_user u
             LEFT JOIN mdl_user_info_data d ON u.id = d.userid
             LEFT JOIN mdl_user_info_field f ON d.fieldid = f.id
                 WHERE u.suspended = 0
                   AND u.deleted = 0
                   AND f.shortname = 'teamuproles' 
                    OR f.shortname IS NULL";
        $users = $DB->get_records_sql($sql);

        $sql = "SELECT u.username, u.id, d.data
                  FROM mdl_user u
             LEFT JOIN mdl_user_info_data d ON u.id = d.userid
             LEFT JOIN mdl_user_info_field f ON d.fieldid = f.id
                 WHERE u.suspended = 0
                   AND u.deleted = 0
                   AND f.shortname = 'teamupattributes' 
                   OR f.shortname IS NULL";
        $attributes = $DB->get_records_sql($sql);
        
        $key = $DB->sql_concat('username', '":"','role');
        $sql = "SELECT {$key} as ix, id,username,role,userid,attributes FROM {teamup_user_index}";
        $teamupusers = $DB->get_records_sql($sql);

        // Update existing or Insert new users.
        foreach ($users as $user) {
            if (trim($user->data, ',')) {
                $roles = explode(',', trim($user->data, ','));
                foreach ($roles as $role) {
                    $key = "{$user->username}:{$role}";
                    if (array_key_exists($key, $teamupusers)) {
                        $this->log("Update existing teamup user: " . $key);
                        $rec = $teamupusers[$key];
                        unset($rec->ix);
                        $rec->userid = $user->id;
                        $rec->attributes = '';
                        if (isset($attributes[$user->username])) {
                            $rec->attributes =  $attributes[$user->username]->data;
                        }
                        $DB->update_record('teamup_user_index', $rec);
                        unset($teamupusers[$key]);
                    } else {
                        // User combo does not exist.
                        $this->log("Creating new teamup user: " . $key);
                        $rec = new \stdClass();
                        $rec->username = $user->username;
                        $rec->role = $role;
                        $rec->userid = $user->id;
                        $rec->attributes = '';
                        if (isset($attributes[$user->username])) {
                            $rec->attributes =$attributes[$user->username]->data;
                        }
                        $DB->insert_record('teamup_user_index', $rec);
                    }
                }
            }
        }

        // Delete non-existant users.
        if (count($teamupusers)) {
            list($insql, $params) = $DB->get_in_or_equal(array_column($teamupusers, 'username'));
            $sql = "DELETE FROM {teamup_user_index} WHERE username $insql";
            $this->log("Deleting teamup user indexes: " . implode(',', $params));
            $DB->execute($sql, $params);
        }
    }

    private function sync_relationships() {
        global $DB;

        // Create parent relationship index based on mentees.
        $sql = "SELECT ra.id as roleassignmentid, u1.username as studentusername, u2.username as parentusername
                  FROM {role_assignments} ra, {context} c, {user} u1, {user} u2
                 WHERE c.contextlevel = 30
                   AND ra.contextid = c.id
                   AND u1.id = c.instanceid
                   AND u2.id = ra.userid";
        $relationships = $DB->get_records_sql($sql);

        $key = $DB->sql_concat('user1', '":"','user1is', '":"', 'user2');
        $sql = "SELECT {$key} as ix, id, user1, user1is, user2 FROM {teamup_user_relationships}";
        $teamuprelationships = $DB->get_records_sql($sql);

        // Update existing or Insert new relationships.
        foreach ($relationships as $relationship) {
            $key = "{$relationship->parentusername}:parent:{$relationship->studentusername}";
            if (array_key_exists($key, $teamuprelationships)) {
                // Relationship already exists.
                $this->log("Relationship already exists: " . $key);
                unset($teamuprelationships[$key]);
            } else {
                // Relationship does not exist.
                $this->log("Creating new relationship: " . $key);
                $rec = new \stdClass();
                $rec->user1 = $relationship->parentusername;
                $rec->user2 = $relationship->studentusername;
                $rec->user1is = 'parent';
                $rec->attributes = '';
                $DB->insert_record('teamup_user_relationships', $rec);
            }
        }

        // Delete non-existant relationships.
        if (count($teamuprelationships)) {
            list($insql, $params) = $DB->get_in_or_equal(array_column($teamuprelationships, 'id'));
            $sql = "DELETE FROM {teamup_user_relationships} WHERE id $insql";
            $this->log("Deleting relationships: " . implode(',', $params));
            $DB->execute($sql, $params);
        }

    }

    private function print_start() {
        $this->log_start("\n");
        $this->log_start("<------------ TEAMUP cron_sync_users ------------<");
    }

    private function print_finish() {
        $this->log_finish(">------------ END TEAMUP cron_sync_users ------------>");
        $this->log_finish("\n");
    }

    public function can_run(): bool {
        return true;
    }
        
}