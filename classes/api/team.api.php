<?php

namespace local_teamup\api;

defined('MOODLE_INTERNAL') || die();

require_once(__DIR__.'/../lib/teams.lib.php');
require_once(__DIR__.'/../lib/tu.lib.php');
require_once(__DIR__.'/../persistents/team.class.php');

use \local_teamup\lib\teams_lib;
use \local_teamup\lib\tu_lib;
use \local_teamup\persistents\team;

/**
 * Team API trait
 */
trait team_api {

    /**
     * Get team data by id.
     *
     * @return array
     */
    static public function get_team() {
        $id = required_param('id', PARAM_INT);
        return teams_lib::get_team_for_editing($id);
    }

    /**
     * Create/edit team data from posted form.
     *
     * @return array containing teamid and new status.
     */
    static public function post_team($args) { 
        return teams_lib::save_team( (object) $args);
    }

    /**
     * Change the status of a team to published.
     *
     * @return array containing teamid and new status.
     */
    static public function publish_team($args) { 
        return teams_lib::publish_team( (object) $args);
    }

    /**
     * Get a team's student list.
     *
     * @return array
     */
    static public function get_team_students() {
        $id = required_param('id', PARAM_INT);
        $team = new team($id);
        $team->load_studentsdata();
        return json_decode($team->get('studentsdata'));
    }

    /**
     * Search for teams.
     *
     * @return array results.
     */
    static public function search_teams() {
        $text = required_param('text', PARAM_ALPHANUMEXT);
        return teams_lib::search_teams($text);
    }

    /**
     * Get current authenticated user's teams.
     *
     * @return array results.
     */
    static public function get_user_teams() {
        return teams_lib::get_teams();
    }

}
