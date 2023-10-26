<?php

defined('MOODLE_INTERNAL') || die;

if ($hassiteconfig) {
    $settings = new admin_settingpage('local_teamup', get_string('pluginname', 'local_teamup'));
    $ADMIN->add('localplugins', $settings);

    $settings->add(new admin_setting_heading('local_teamup_appearance', get_string('settingsappearance', 'local_teamup'), ''));

    // Custom tool name.
    $name = 'local_teamup/toolname';
    $visiblename = get_string('toolname', 'local_teamup');
    $description = get_string('toolname_desc', 'local_teamup');
    $setting = new admin_setting_configtext($name, $visiblename, $description, 'TeamUp');
    $settings->add($setting);

    // Logo.
    $name = 'local_teamup/logo';
    $visiblename = get_string('logo', 'local_teamup');
    $description = get_string('logo_desc', 'local_teamup');
    $setting = new admin_setting_configtext($name, $visiblename, $description, null);
    $settings->add($setting);

    // Favicon.
    $name = 'local_teamup/favicon';
    $visiblename = get_string('favicon', 'local_teamup');
    $description = get_string('favicon_desc', 'local_teamup');
    $setting = new admin_setting_configtext($name, $visiblename, $description, null);
    $settings->add($setting);

    // Header background color.
    $name = 'local_teamup/headerbg';
    $visiblename = get_string('headerbg', 'local_teamup');
    $setting = new admin_setting_configcolourpicker($name, $visiblename, '', '#0F172A', null , true);
    $settings->add($setting);

    // Header foreground color.
    $name = 'local_teamup/headerfg';
    $visiblename = get_string('headerfg', 'local_teamup');
    $setting = new admin_setting_configcolourpicker($name, $visiblename, '', '#FFFFFF', null , true);
    $settings->add($setting);

    // Email header image url.
    $name = 'local_teamup/emaillogo';
    $visiblename = get_string('emaillogo', 'local_teamup');
    $description = get_string('emaillogo_desc', 'local_teamup');
    $setting = new admin_setting_configtext($name, $visiblename, $description, null);
    $settings->add($setting);

    // Database integration settings.
    $settings->add(new admin_setting_heading('local_teamup_syncdb', get_string('settingssyncdb', 'local_teamup'), ''));
	$options = array("mysqli", "oci", "pdo", "pgsql", "sqlite3", "sqlsrv");
    $name = 'local_teamup/dbtype';
    $visiblename = get_string('dbtype', 'local_teamup');
    $setting = new admin_setting_configselect($name, $visiblename, '', '', array_combine($options, $options));
    $settings->add($setting);

    $name = 'local_teamup/dbhost';
    $visiblename = get_string('dbhost', 'local_teamup');
    $setting = new admin_setting_configtext($name, $visiblename, '', null);
    $settings->add($setting);

    $name = 'local_teamup/dbname';
    $visiblename = get_string('dbname', 'local_teamup');
    $setting = new admin_setting_configtext($name, $visiblename, '', null);
    $settings->add($setting);

    $name = 'local_teamup/dbuser';
    $visiblename = get_string('dbuser', 'local_teamup');
    $setting = new admin_setting_configtext($name, $visiblename, '', null);
    $settings->add($setting);

    $name = 'local_teamup/dbpass';
    $visiblename = get_string('dbpass', 'local_teamup');
    $setting = new admin_setting_configpasswordunmask($name, $visiblename, '', null);
    $settings->add($setting);

    // Category Sync SQL.
    $name = 'local_teamup/sync_categories_sql';
    $visiblename = get_string('sync_categories_sql', 'local_teamup');
    $description = get_string('sync_categories_sql_desc', 'local_teamup');
    $setting = new admin_setting_configtextarea($name, $visiblename, $description, null);
    $settings->add($setting);

    // Schedule Sync SQL.
    $name = 'local_teamup/sync_schedules_sql';
    $visiblename = get_string('sync_schedules_sql', 'local_teamup');
    $description = get_string('sync_schedules_sql_desc', 'local_teamup');
    $setting = new admin_setting_configtextarea($name, $visiblename, $description, null);
    $settings->add($setting);

    // Teams Sync SQL.
    $name = 'local_teamup/sync_teams_sql';
    $visiblename = get_string('sync_teams_sql', 'local_teamup');
    $description = get_string('sync_teams_sql_desc', 'local_teamup');
    $setting = new admin_setting_configtextarea($name, $visiblename, $description, null);
    $settings->add($setting);

    // Team Staff Sync SQL.
    $name = 'local_teamup/sync_teamstaff_sql';
    $visiblename = get_string('sync_teamstaff_sql', 'local_teamup');
    $description = get_string('sync_teamstaff_sql_desc', 'local_teamup');
    $setting = new admin_setting_configtextarea($name, $visiblename, $description, null);
    $settings->add($setting);

    // Team Students Sync SQL.
    $name = 'local_teamup/sync_teamstudents_sql';
    $visiblename = get_string('sync_teamstudents_sql', 'local_teamup');
    $description = get_string('sync_teamstudents_sql_desc', 'local_teamup');
    $setting = new admin_setting_configtextarea($name, $visiblename, $description, null);
    $settings->add($setting);

}
