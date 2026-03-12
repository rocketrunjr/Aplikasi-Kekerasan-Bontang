const Database = require('better-sqlite3');
const db = new Database('data/sisaka.db');
db.exec("PRAGMA writable_schema = 1; delete from sqlite_master where type in ('table', 'index', 'trigger'); PRAGMA writable_schema = 0; VACUUM; PRAGMA INTEGRITY_CHECK;");
db.close();
console.log("DB dropped successfully.");
