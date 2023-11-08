<?php
namespace local_teamup\task;
defined('MOODLE_INTERNAL') || die();
class cron_sync_categories extends \core\task\scheduled_task {

    use \core\task\logging_trait;

    private $externalcategories = [];

    public function get_name() {
        return 'Sync teamup categories from SQL';
    }

    public function execute() {
        $this->print_start();

        $this->log("Fetching external categories using sync_categories_sql setting.");
        $config = get_config('local_teamup');
        if (empty($config->sync_categories_sql)) {
            $this->log("sync_categories_sql setting is not configured.");
            $this->print_finish();
            return;
        }
        $dbi = \moodle_database::get_driver_instance($config->dbtype, 'native', true);
        $dbi->connect($config->dbhost, $config->dbuser, $config->dbpass, $config->dbname, '');
        $this->externalcategories = $dbi->get_records_sql($config->sync_categories_sql);

        if (empty($this->externalcategories)) {
            $this->log_finish("No external categories were found.");
            $this->print_finish();
            return;
        }

        $this->log("Syncing categories.");
        $this->sync_categories();
        $this->log("Generating category paths.");
        $this->generate_category_paths();
        $this->print_finish();
    }

    private function sync_categories() {
        global $DB;

        $existingcategories = $DB->get_records('teamup_categories');
        if ($existingcategories) {
            $existingcategories = array_combine(array_column($existingcategories, 'idnumber'), $existingcategories);
        }

        foreach($this->externalcategories as $externalcategory) {
            $idnumber = strtolower($externalcategory->categoryidnumber);
            if (array_key_exists($idnumber, $existingcategories)) {
                $rec = $existingcategories[$idnumber];
                $this->log("Update existing category: " . $idnumber);
                $rec->displayname = $externalcategory->displayname;
                $rec->parentidnumber = strtolower($externalcategory->parentcategoryidnumber);
                $rec->deleted = 0;
                $DB->update_record('teamup_categories', $rec);
                unset($existingcategories[$idnumber]);
            } else {
                $this->log("Creating new category: " . $idnumber);
                $rec = new \stdClass();
                $rec->idnumber = $idnumber;
                $rec->displayname = $externalcategory->displayname;
                $rec->parentidnumber = strtolower($externalcategory->parentcategoryidnumber);
                $rec->path = '';
                $rec->deleted = 0;
                $DB->insert_record('teamup_categories', $rec);
            }
        }

        // Delete existing categories that are not in external source.
        if (count($existingcategories)) {
            list($insql, $params) = $DB->get_in_or_equal(array_keys($existingcategories));
            $sql = "UPDATE {teamup_categories} SET deleted = 1 WHERE idnumber $insql";
            $this->log("Deleting teamup categories: " . implode(',', $params));
            $DB->execute($sql, $params);
        }
    }

    private function generate_category_paths() {
        global $DB;

        foreach($this->externalcategories as $externalcategory) {
            $idnumber = strtolower($externalcategory->categoryidnumber);
            $path = $this->create_path_from_parents($idnumber);
            $this->log($path);
            $sql = "UPDATE {teamup_categories} SET path = ? WHERE idnumber = ?";
            $DB->execute($sql, [$path, $idnumber]);
        }
    }
    
    private function create_path_from_parents($idnumber, $cumulation = '') {
        global $DB;

        $path = $idnumber . '/' . $cumulation;

        $category = $DB->get_record('teamup_categories', ['idnumber' => $idnumber]);
        if (empty($category)) {
            return;
        }

        if (empty($category->parentidnumber)) {
            return substr($path, 0, -1);
        }

        return $this->create_path_from_parents($category->parentidnumber, $path);
    }

    private function print_start() {
        $this->log_start("\n");
        $this->log_start("<------------ TEAMUP cron_sync_categories ------------<");
    }

    private function print_finish() {
        $this->log_finish(">------------ END TEAMUP cron_sync_categories ------------>");
        $this->log_finish("\n");
    }

    public function can_run(): bool {
        return true;
    }
}