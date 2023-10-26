<?php


namespace local_teamup\api;

defined('MOODLE_INTERNAL') || die();

require_once(__DIR__.'/../lib/tu.lib.php');

use \local_teamup\lib\tu_lib;

/**
 * Generic API trait
 */
trait tu_api {

    /**
     * Search for a staff member in the user index.
     *
     * @return array results.
     */
    static public function search_staff() {
        $text = required_param('text', PARAM_ALPHANUMEXT);
        return tu_lib::search_staff($text);
    }

    /**
     * Search for a student in the user index.
     *
     * @return array results.
     */
    static public function search_students() {
        $text = required_param('text', PARAM_ALPHANUMEXT);
        return tu_lib::search_students($text);
    }

    /**
     * Search categories.
     *
     * @return array results.
     */
    static public function search_categories() {
        $text = required_param('text', PARAM_ALPHANUMEXT);
        return tu_lib::search_categories($text);
    }

    /**
     * Get category directory information.
     *
     * @return array.
     */
    static public function get_category_dir() {
        $category = required_param('category', PARAM_ALPHANUMEXT);
        return tu_lib::get_category_dir($category);
    }

    /**
     * Get current authenticated user's children info.
     *
     * @return array.
     */
    static public function get_users_children() {
        return tu_lib::get_users_children();
    }

    /**
     * Check for existing session.
     * 
     * @throws require_login_exception
     * @return void.
     */
    static public function check_login() {
        if (!isloggedin()) {
            throw new \require_login_exception('Login required.');
        }
    }

}
