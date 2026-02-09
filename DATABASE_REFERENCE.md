# Quick Reference: MySQL Database

## Connection Info
- **Host:** localhost (by default)
- **Port:** 3306 (MySQL default)
- **Database:** kpmg_grc
- **Configuration:** .env file

## Database Tables

### users
Stores user accounts and roles.
```sql
SELECT * FROM users WHERE role = 'admin';
-- Get all admin users
```

### departments
Stores department information.
```sql
SELECT * FROM departments;
-- List all departments
```

### requirements
Audit requirements linked to departments.
```sql
SELECT * FROM requirements WHERE status = 'pending';
-- List pending requirements
```

### files
Uploaded files (stored as BLOB data).
```sql
SELECT id, name, size, uploaded FROM files 
WHERE requirementId = 1;
-- List files for requirement
```

### activities
Activity logs for tracking changes.
```sql
SELECT * FROM activities 
ORDER BY timestamp DESC LIMIT 20;
-- Recent 20 activities
```

### folder_config
Folder path configurations per department.
```sql
SELECT * FROM folder_config 
WHERE configured = TRUE;
-- Show configured departments
```

## Common MySQL Commands

### Connect to MySQL
```bash
mysql -u root -p
```

### Select Database
```sql
USE kpmg_grc;
```

### View Tables
```bash
mysql -u root -p kpmg_grc -e "SHOW TABLES;"
```

### Backup Database
```bash
mysqldump -u root -p kpmg_grc > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restore Database
```bash
mysql -u root -p kpmg_grc < backup.sql
```

### Check Admin User
```sql
SELECT username, email, role, status FROM users WHERE role = 'admin';
```

### Reset Admin Password
```sql
UPDATE users SET password = 'Admin123' 
WHERE username = 'admin@kpmg.com';
```

## Development Tasks

### Add New Table
1. Modify `database.js` - add CREATE TABLE statement
2. Restart server

### Modify Table Structure
1. Update schema in `database.js`
2. Or use SSH to MySQL and run ALTER TABLE
3. Update corresponding API endpoints

### Add New Endpoint
1. Update route in `server.js`
2. Use `pool.getConnection()` for queries
3. Always release connection: `await connection.release()`

### Working with Queries

```javascript
// Get single record
const [rows] = await connection.execute(
    'SELECT * FROM users WHERE id = ?',
    [userId]
);

// Insert new record
const [result] = await connection.execute(
    'INSERT INTO users (username, email) VALUES (?, ?)',
    [username, email]
);
const newId = result.insertId;

// Update record
await connection.execute(
    'UPDATE users SET email = ? WHERE id = ?',
    [newEmail, userId]
);

// Delete record
await connection.execute(
    'DELETE FROM users WHERE id = ?',
    [userId]
);
```

## Environment Setup

### Development
```bash
npm install
npm run dev
```

### Production
```bash
npm install
npm start
```

## Debugging

### View Console Logs
All database operations logged to console:
- Connection establishment
- Table creation
- Insert/Update/Delete operations
- Errors

### Check Server Status
```bash
# In terminal
curl http://localhost:5000/api/statistics \
  -H "Authorization: Bearer <token>"
```

## Performance Tuning

### Connection Pool
Increase in `.env` or `database.js` for high load:
```javascript
connectionLimit: 20,  // Instead of 10
queueLimit: 30,       // Queue overflow
```

### Query Optimization
All queries use:
- Prepared statements (prevent SQL injection)
- Connection pooling (reuse connections)
- Efficient WHERE clauses

### Database Export
For analysis:
```bash
mysqldump -u root -p kpmg_grc --no-data > schema.sql
mysqldump -u root -p kpmg_grc > full_backup.sql
```

## File Storage

Files stored in `files` table as LONGBLOB:
- Max size: Depends on `max_allowed_packet` setting
- Default: 16MB
- Stored as Base64 encoded data

To increase file limit:
```bash
# Edit my.cnf or my.ini
max_allowed_packet = 100M
```

## User Permissions

Grant privileges to a specific user:
```sql
GRANT ALL PRIVILEGES ON kpmg_grc.* TO 'appuser'@'localhost';
FLUSH PRIVILEGES;
```

## Useful Queries

### Count Statistics
```sql
SELECT 
  (SELECT COUNT(*) FROM users) as total_users,
  (SELECT COUNT(*) FROM departments) as total_departments,
  (SELECT COUNT(*) FROM requirements) as total_requirements,
  (SELECT COUNT(*) FROM requirements WHERE status = 'pending') as pending_requirements;
```

### Department Summary
```sql
SELECT 
  d.name as department,
  COUNT(r.id) as total_requirements,
  SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
  SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
FROM departments d
LEFT JOIN requirements r ON d.id = r.departmentId
GROUP BY d.name;
```

### File Storage Usage
```sql
SELECT 
  d.name as department,
  COUNT(f.id) as file_count,
  ROUND(SUM(f.size) / 1024 / 1024, 2) as size_mb
FROM files f
JOIN departments d ON f.departmentId = d.id
GROUP BY d.name;
```

## Maintenance

### Regular Tasks
1. **Weekly:** Review activity logs
2. **Monthly:** Backup database
3. **Quarterly:** Optimize tables

### Optimize Tables
```sql
OPTIMIZE TABLE users,departments,requirements,files,activities,folder_config;
```

### Check Table Status
```sql
CHECK TABLE users,departments,requirements,files,activities,folder_config;
```

## Ports & Services

| Service | Port | Status |
|---------|------|--------|
| MySQL   | 3306 | Local  |
| Server  | 5000 | Local  |
| Browser | 80   | Via server |

## Troubleshooting Checklist

- [ ] MySQL running: `mysql -u root -p`
- [ ] Database exists: `SHOW DATABASES;`
- [ ] Tables created: `SHOW TABLES;`
- [ ] User permissions: `SHOW GRANTS;`
- [ ] Server connected: Check console output
- [ ] Port available: `netstat -ano \| findstr :5000` (Windows)
- [ ] .env configured: Check values match MySQL setup
