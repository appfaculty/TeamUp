<?php

$messageproviders = array (
    'notifications' => array(
        'defaults' => array(
            'popup' => MESSAGE_PERMITTED + MESSAGE_DEFAULT_LOGGEDIN + MESSAGE_DEFAULT_LOGGEDOFF, // Bell alerts by default.
            'airnotifier' => MESSAGE_PERMITTED + MESSAGE_DEFAULT_LOGGEDIN + MESSAGE_DEFAULT_LOGGEDOFF, // Push notifications by default.
            'email' => MESSAGE_DISALLOWED, // Send emails via a separate API.
        ),
    ),
    'emails' => array(
        'defaults' => array(
            'email' => MESSAGE_PERMITTED + MESSAGE_DEFAULT_LOGGEDIN + MESSAGE_DEFAULT_LOGGEDOFF, //  Does not use message api for sending emails, but makes use of the preference.
            'popup' => MESSAGE_DISALLOWED,
            'airnotifier' => MESSAGE_DISALLOWED,
        ),
    ),
);

