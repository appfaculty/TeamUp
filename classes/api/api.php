<?php

namespace local_teamup;

defined('MOODLE_INTERNAL') || die();

require_once(__DIR__.'/team.api.php');
require_once(__DIR__.'/events.api.php');
require_once(__DIR__.'/messages.api.php');
require_once(__DIR__.'/tu.api.php');

use \local_teamup\api\team_api;
use \local_teamup\api\events_api;
use \local_teamup\api\messages_api;
use \local_teamup\api\tu_api;

class API {
    use team_api;
    use events_api;
    use messages_api;
    use tu_api;
}