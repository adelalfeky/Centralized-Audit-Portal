const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'kpmg_grc.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err);
        process.exit(1);
    }
});

console.log('\n=== Users in Database ===\n');
db.all('SELECT id, username, password, fullName, role, status FROM users', [], (err, rows) => {
    if (err) {
        console.error('Error querying users:', err);
    } else {
        console.log(JSON.stringify(rows, null, 2));
    }
    
    console.log('\n=== Departments in Database ===\n');
    db.all('SELECT id, name, description FROM departments', [], (err, rows) => {
        if (err) {
            console.error('Error querying departments:', err);
        } else {
            console.log(JSON.stringify(rows, null, 2));
        }
        db.close();
    });
});
