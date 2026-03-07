const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

db.all("SELECT * FROM users", [], (err, rows) => {
    if (err) {
        console.error("Error reading users:", err.message);
    } else {
        console.log("Users in database:", JSON.stringify(rows, null, 2));
    }
    db.close();
});
