const Database = require("better-sqlite3");
const db = new Database("data/sisaka.db");

console.log("Disabling foreign keys...");
db.pragma("foreign_keys = OFF");

try {
    console.log("Deleting accounts...");
    db.prepare("DELETE FROM account").run();

    console.log("Deleting sessions...");
    db.prepare("DELETE FROM session").run();

    const targetUsers = [
        "admin@sisaka.id",
        "psikolog@sisaka.id",
        "budi@sisaka.id",
        "siti@sisaka.id"
    ];

    console.log("Deleting specific users...");
    const deleteUserStmt = db.prepare("DELETE FROM user WHERE email = ?");
    for (const email of targetUsers) {
        deleteUserStmt.run(email);
        console.log(`Deleted ${email}`);
    }
} catch (e) {
    console.error("Error during deletion:", e);
} finally {
    console.log("Re-enabling foreign keys...");
    db.pragma("foreign_keys = ON");
}

console.log("Verify remaining users:", db.prepare("SELECT email FROM user").all().map(u => u.email));
