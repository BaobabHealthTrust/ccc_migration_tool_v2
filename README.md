#ccc_migration_tool_v2

1. Clone the application from github: https://github.com/BaobabHealthTrust/ccc_migration_tool_v2.git

2. cp database.json.example file and configure it

3. Run ./migrate.js

4. cp the .sql file that is created in the ccc_migration_tool_v2 application folder and load it in the ccc_dev application database

5. YOU ARE DONE!!


NB: Clone the ccc_migration_tool_v application and run .migrate.sh to create patient_program_id in encounter table (working on simplifying this process)