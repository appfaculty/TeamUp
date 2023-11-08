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

        <!-- PWA contents -->
        <!-- Generated assets and the following code via npx pwx-asset-generator command in npm run build -->
        <link rel="apple-touch-icon" href="apple-icon-180.png">
        <meta name="apple-mobile-web-app-capable" content="yes">
        <link rel="apple-touch-startup-image" href="/local/teamup/frontend/dist/assets/pwa/apple-splash-2048-2732.jpg" media="(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)">
        <link rel="apple-touch-startup-image" href="/local/teamup/frontend/dist/assets/pwa/apple-splash-2732-2048.jpg" media="(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)">
        <link rel="apple-touch-startup-image" href="/local/teamup/frontend/dist/assets/pwa/apple-splash-1668-2388.jpg" media="(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)">
        <link rel="apple-touch-startup-image" href="/local/teamup/frontend/dist/assets/pwa/apple-splash-2388-1668.jpg" media="(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)">
        <link rel="apple-touch-startup-image" href="/local/teamup/frontend/dist/assets/pwa/apple-splash-1536-2048.jpg" media="(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)">
        <link rel="apple-touch-startup-image" href="/local/teamup/frontend/dist/assets/pwa/apple-splash-2048-1536.jpg" media="(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)">
        <link rel="apple-touch-startup-image" href="/local/teamup/frontend/dist/assets/pwa/apple-splash-1668-2224.jpg" media="(device-width: 834px) and (device-height: 1112px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)">
        <link rel="apple-touch-startup-image" href="/local/teamup/frontend/dist/assets/pwa/apple-splash-2224-1668.jpg" media="(device-width: 834px) and (device-height: 1112px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)">
        <link rel="apple-touch-startup-image" href="/local/teamup/frontend/dist/assets/pwa/apple-splash-1620-2160.jpg" media="(device-width: 810px) and (device-height: 1080px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)">
        <link rel="apple-touch-startup-image" href="/local/teamup/frontend/dist/assets/pwa/apple-splash-2160-1620.jpg" media="(device-width: 810px) and (device-height: 1080px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)">
        <link rel="apple-touch-startup-image" href="/local/teamup/frontend/dist/assets/pwa/apple-splash-1290-2796.jpg" media="(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio:3) and (orientation: portrait)">
        <link rel="apple-touch-startup-image" href="/local/teamup/frontend/dist/assets/pwa/apple-splash-2796-1290.jpg" media="(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio:3) and (orientation: landscape)">
        <link rel="apple-touch-startup-image" href="/local/teamup/frontend/dist/assets/pwa/apple-splash-1179-2556.jpg" media="(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio:3) and (orientation: portrait)">
        <link rel="apple-touch-startup-image" href="/local/teamup/frontend/dist/assets/pwa/apple-splash-2556-1179.jpg" media="(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio:3) and (orientation: landscape)">
        <link rel="apple-touch-startup-image" href="/local/teamup/frontend/dist/assets/pwa/apple-splash-1284-2778.jpg" media="(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio:3) and (orientation: portrait)">
        <link rel="apple-touch-startup-image" href="/local/teamup/frontend/dist/assets/pwa/apple-splash-2778-1284.jpg" media="(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio:3) and (orientation: landscape)">
        <link rel="apple-touch-startup-image" href="/local/teamup/frontend/dist/assets/pwa/apple-splash-1170-2532.jpg" media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio:3) and (orientation: portrait)">
        <link rel="apple-touch-startup-image" href="/local/teamup/frontend/dist/assets/pwa/apple-splash-2532-1170.jpg" media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio:3) and (orientation: landscape)">
        <link rel="apple-touch-startup-image" href="/local/teamup/frontend/dist/assets/pwa/apple-splash-1125-2436.jpg" media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio:3) and (orientation: portrait)">
        <link rel="apple-touch-startup-image" href="/local/teamup/frontend/dist/assets/pwa/apple-splash-2436-1125.jpg" media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio:3) and (orientation: landscape)">
        <link rel="apple-touch-startup-image" href="/local/teamup/frontend/dist/assets/pwa/apple-splash-1242-2688.jpg" media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio:3) and (orientation: portrait)">
        <link rel="apple-touch-startup-image" href="/local/teamup/frontend/dist/assets/pwa/apple-splash-2688-1242.jpg" media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio:3) and (orientation: landscape)">
        <link rel="apple-touch-startup-image" href="/local/teamup/frontend/dist/assets/pwa/apple-splash-828-1792.jpg" media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio:2) and (orientation: portrait)">
        <link rel="apple-touch-startup-image" href="/local/teamup/frontend/dist/assets/pwa/apple-splash-1792-828.jpg" media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio:2) and (orientation: landscape)">
        <link rel="apple-touch-startup-image" href="/local/teamup/frontend/dist/assets/pwa/apple-splash-1242-2208.jpg" media="(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio:3) and (orientation: portrait)">
        <link rel="apple-touch-startup-image" href="/local/teamup/frontend/dist/assets/pwa/apple-splash-2208-1242.jpg" media="(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio:3) and (orientation: landscape)">
        <link rel="apple-touch-startup-image" href="/local/teamup/frontend/dist/assets/pwa/apple-splash-750-1334.jpg" media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio:2) and (orientation: portrait)">
        <link rel="apple-touch-startup-image" href="/local/teamup/frontend/dist/assets/pwa/apple-splash-1334-750.jpg" media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio:2) and (orientation: landscape)">
        <link rel="apple-touch-startup-image" href="/local/teamup/frontend/dist/assets/pwa/apple-splash-640-1136.jpg" media="(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio:2) and (orientation: portrait)">
        <link rel="apple-touch-startup-image" href="/local/teamup/frontend/dist/assets/pwa/apple-splash-1136-640.jpg" media="(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio:2) and (orientation: landscape)">

        <link rel="manifest" href="/local/teamup/frontend/dist/manifest.webmanifest"><script id="vite-plugin-pwa:register-sw" src="/local/teamup/frontend/dist/registerSW.js"></script></head>
        <meta name="theme-color" content="#0F172A">
    </head>
    <body>
        <div id="root"></div>
    </body>
</html>