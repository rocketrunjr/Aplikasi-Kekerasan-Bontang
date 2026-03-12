const db = require('better-sqlite3')('./data/sisaka.db');
console.table(db.prepare("SELECT target_phone, report_id, message FROM whatsapp_notifications WHERE target_phone='1146603889' ORDER BY created_at DESC").all().map(r => ({ ...r, message: r.message.substring(0, 30).replace(/\n/g, ' ') })));
db.close();
