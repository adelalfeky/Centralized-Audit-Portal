require('dotenv').config();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Create SQLite database in the application root
const dbPath = path.join(__dirname, 'kpmg_grc.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err);
    } else {
        console.log('Connected to SQLite database at:', dbPath);
    }
});

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON');

// Wrapper for database operations to use promises
const query = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows || []);
            }
        });
    });
};

const run = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function(err) {
            if (err) {
                reject(err);
            } else {
                resolve({ id: this.lastID, changes: this.changes });
            }
        });
    });
};

// Initialize database tables
async function initializeDatabase() {
    try {
        // Create departments table first (no dependencies)
        await run(`
            CREATE TABLE IF NOT EXISTS departments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create users table (references departments)
        await run(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                fullName TEXT NOT NULL,
                email TEXT NOT NULL,
                role TEXT CHECK(role IN ('admin', 'director', 'user')) NOT NULL DEFAULT 'user',
                department INTEGER,
                status TEXT CHECK(status IN ('active', 'inactive')) NOT NULL DEFAULT 'active',
                lastLogin DATETIME,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (department) REFERENCES departments(id) ON DELETE SET NULL
            )
        `);

        // Create requirements table
        await run(`
            CREATE TABLE IF NOT EXISTS requirements (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                departmentId INTEGER NOT NULL,
                description TEXT NOT NULL,
                requestDate DATE NOT NULL,
                status TEXT CHECK(status IN ('pending', 'in-progress', 'completed', 'cancelled')) NOT NULL DEFAULT 'pending',
                remarks TEXT,
                receivingDate DATE,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (departmentId) REFERENCES departments(id) ON DELETE CASCADE
            )
        `);

        // Create files table
        await run(`
            CREATE TABLE IF NOT EXISTS files (
                id TEXT PRIMARY KEY,
                requirementId INTEGER NOT NULL,
                departmentId INTEGER NOT NULL,
                name TEXT NOT NULL,
                type TEXT,
                size INTEGER,
                data BLOB,
                path TEXT,
                uploaded DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (requirementId) REFERENCES requirements(id) ON DELETE CASCADE,
                FOREIGN KEY (departmentId) REFERENCES departments(id) ON DELETE CASCADE
            )
        `);

        // Add missing path column for existing databases
        const filesColumns = await query('PRAGMA table_info(files)');
        const hasPathColumn = filesColumns.some((col) => col.name === 'path');
        if (!hasPathColumn) {
            await run('ALTER TABLE files ADD COLUMN path TEXT');
        }

        // Create activities table
        await run(`
            CREATE TABLE IF NOT EXISTS activities (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                message TEXT NOT NULL,
                departmentId INTEGER,
                type TEXT CHECK(type IN ('system', 'department')) NOT NULL DEFAULT 'department',
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (departmentId) REFERENCES departments(id) ON DELETE SET NULL
            )
        `);

        // Create folder_config table
        await run(`
            CREATE TABLE IF NOT EXISTS folder_config (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                departmentId INTEGER UNIQUE NOT NULL,
                path TEXT,
                sharedUrl TEXT,
                configured BOOLEAN DEFAULT 0,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (departmentId) REFERENCES departments(id) ON DELETE CASCADE
            )
        `);

        console.log('Database tables initialized successfully');
        
        // Insert default admin user if not exists
        const adminUser = await query(
            'SELECT id FROM users WHERE username = ?',
            ['admin@kpmg.com']
        );
        
        if (adminUser.length === 0) {
            await run(
                'INSERT INTO users (username, password, fullName, email, role, status) VALUES (?, ?, ?, ?, ?, ?)',
                ['admin@kpmg.com', 'Admin123', 'System Administrator', 'admin@kpmg.com', 'admin', 'active']
            );
            console.log('Default admin user created');
        }

        // Create default departments if not exists
        const departments = await query('SELECT id FROM departments');
        if (departments.length === 0) {
            await run(
                'INSERT INTO departments (name, description) VALUES (?, ?)',
                ['Corporate IT', 'Corporate IT Division']
            );
            console.log('Default departments created');
        }

    } catch (error) {
        console.error('Error initializing database:', error);
        throw error;
    }
}

module.exports = {
    db,
    initializeDatabase,
    query,
    run,
    // Pool-like interface for compatibility with server.js
    pool: {
        getConnection: async () => {
            return {
                execute: (sql, params) => {
                    return new Promise(async (resolve, reject) => {
                        db.all(sql, params, (err, rows) => {
                            if (err) {
                                reject(err);
                            } else {
                                resolve([rows || []]);
                            }
                        });
                    });
                },
                release: async () => {
                    // No-op for SQLite
                }
            };
        }
    }
};
