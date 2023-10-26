<?php

$string['pluginname'] = 'TeamUp';

$string['settingsappearance'] = 'Appearance settings';
$string['toolname'] = 'Custom tool name';
$string['toolname_desc'] = 'Rename TeamUp for end users.';
$string['favicon'] = 'Favicon';
$string['favicon_desc'] = 'URL to custom favicon.';
$string['logo'] = 'Logo';
$string['logo_desc'] = 'URL to custom logo.';
$string['headerbg'] = 'Header background color';
$string['headerfg'] = 'Header foreground color';
$string['emaillogo'] = 'Email Logo';
$string['emaillogo_desc'] = 'URL to custom logo, displayed at the top of emailed messages.';

$string['settingssyncdb'] = 'Sync database settings';
$string['dbtype'] = 'Database driver';
$string['dbhost'] = 'Database host';
$string['dbname'] = 'Database name';
$string['dbuser'] = 'Database user';
$string['dbpass'] = 'Database password';

$string['sync_categories_sql'] = 'Sync Categories SQL';
$string['sync_categories_sql_desc'] = 'Query columns: CategoryIdnumber* (must be unique) | DisplayName* | ParentCategoryIdnumber (empty for root category)';

$string['sync_schedules_sql'] = 'Sync Schedules SQL';
$string['sync_schedules_sql_desc'] = 'Query columns: ScheduleIdnumber* (must be unique) | TeamIdnumbers* | EventDays* | EventTime* | EventTitle* | EventLocation | EventDescription';

$string['sync_teams_sql'] = 'Sync Teams SQL';
$string['sync_teams_sql_desc'] = 'Query columns: TeamIdnumber* (must be unique) | CategoryIdnumber | TeamName* | TeamDescription | Mode* (create, update or delete)';

$string['sync_teamstaff_sql'] = 'Sync Team Staff SQL';
$string['sync_teamstaff_sql_desc'] = 'Query columns: Row* (a unique sequence number) | TeamIdnumber* | Username* | Role*';

$string['sync_teamstudents_sql'] = 'Sync Team Students SQL';
$string['sync_teamstudents_sql_desc'] = 'Query columns: Row* (a unique sequence number) | TeamIdnumber* | Username*';

$string['messageprovider:notifications'] = 'TeamUp Notifications';
$string['messageprovider:emails'] = 'TeamUp Emails';
