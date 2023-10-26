<?php

namespace local_teamup\api;

defined('MOODLE_INTERNAL') || die();

require_once(__DIR__.'/../lib/messages.lib.php');

use \local_teamup\lib\messages_lib;

/**
 * Message API trait
 */
trait messages_api {

    /**
     * Get paged messages for the current authenticated user.
     *
     * @return array exported messages.
     */
    static public function get_messages() {
        $page = required_param('page', PARAM_INT);
        $messages =  messages_lib::get_messages($page);
        $messages['messages'] = array_values(messages_lib::export($messages['messages']));
        return $messages;
    }

    /**
     * Get a single message by id.
     *
     * @return array|boolean exported message data or false if not found.
     */
    static public function get_message() {
        $id = required_param('id', PARAM_INT);
        $message = messages_lib::get_message($id);
        if ($message) {
            return messages_lib::export([$message])[0];
        }
        return false;
    }

    /**
     * Create a message from submitted form data.
     *
     * @param array $args
     * @return int new message id
     */
    static public function submit_message($args) {   
        $args = (object) $args;
        return messages_lib::submit_message($args);
    }

    /**
     * Edit a message from submitted form data.
     *
     * @param array $args
     * @return boolean success
     */
    static public function edit_message($args) {
        return messages_lib::edit_message((object) $args);
    }

    /**
     * Delete a message by id.
     *
     * @param array $args containing message id
     * @return boolean success
     */
    static public function delete_message($args) {
        $args = (object) $args;
        return messages_lib::delete_message($args->id);
    }

}
