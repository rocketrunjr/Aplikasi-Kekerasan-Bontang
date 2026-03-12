const Database = require("better-sqlite3");
const db = new Database("data/sisaka.db");
const users = db.prepare("SELECT email, role, is_approved FROM user").all();
console.log("Users:", users.map(u => u.email).join(", "));
const accounts = db.prepare("SELECT * FROM account").all();
console.log("Accounts count:", accounts.length);
