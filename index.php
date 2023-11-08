<?php
    require(__DIR__.'/../../config.php');
    require_login();
    require_once __DIR__ . '/bootstrap.php';
    require_once(__DIR__.'/classes/lib/tu.lib.php');

    $teamupconfig = get_config('local_teamup');
    $config = new \stdClass();
    $config->version = $teamupconfig->version;
    $config->sesskey = sesskey();
    $config->wwwroot = $CFG->wwwroot;
    $config->roles = \local_teamup\lib\tu_lib::get_teamup_roles();
    $config->toolname = \local_teamup\lib\tu_lib::get_toolname();
    $config->headerbg = $teamupconfig->headerbg;
    $config->headerfg = $teamupconfig->headerfg;
    $user = \local_teamup\lib\tu_lib::user_stub($USER->username);
    $config->user = $user;
    $config->loginUrl = (new moodle_url('/login/index.php'))->out();
    $config->logoutUrl = (new moodle_url('/login/logout.php', ['sesskey' => $config->sesskey]))->out();
    
    $config->favicon = get_favicon('src/assets/favicon.png');
    $config->logo = get_logo('src/assets/logo.png');
?>
<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>TeamUp</title>
        <script>
            window.appdata = {}
            window.appdata.config = <?= json_encode($config) ?>
        </script>
        <link rel="icon" type="image/x-icon" href="<?= $config->favicon ?>" />
        <?= bootstrap('index.html') ?>
    </head>
    <body>
        <div id="root"></div>
    </body>
</html>