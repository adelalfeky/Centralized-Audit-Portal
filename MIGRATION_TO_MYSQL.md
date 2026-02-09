# Migration Guide: From In-Memory to MySQL Database

## What Changed

Your KPMG GRC Application has been updated to use **MySQL database** instead of in-memory data storage. This ensures data persistence and better scalability.

## Key Changes

### 1. **Data Storage**
- **Before:** All data stored in RAM (lost when server restarts)
- **After:** All data stored in MySQL database (persistent)

### 2. **New Files Added**
- `database.js` - MySQL connection and initialization
- `.env` - Database configuration file
- `.env.example` - Example configuration template
- `MYSQL_SETUP.md` - Complete setup guide
- `start-mysql.bat` - Quick start script for Windows
- `.gitignore` - To exclude sensitive files

### 3. **Updated Files**
- `server.js` - All endpoints now use database queries
- `package.json` - Added `mysql2` and `dotenv` packages

## Database Schema

### Tables Created

1. **users** - User accounts and authentication
2. **departments** - Department information
3. **requirements** - Audit requirements
4. **files** - Uploaded file storage
5. **activities** - Activity logs
6. **folder_config** - Folder configuration

All tables are **automatically created** on first server startup.

## Getting Started

### Step 1: Install MySQL
Ensure MySQL is installed and running on your device.

### Step 2: Create Database
```sql
CREATE DATABASE kpmg_grc CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Step 3: Configure Connection
Edit `.env` file with your MySQL credentials:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=kpmg_grc
```

### Step 4: Install Node Dependencies
```bash
npm install
```

### Step 5: Start Server
```bash
npm start
```

Or on Windows, simply run:
```
start-mysql.bat
```

## API Changes

**No API contract changes!** All endpoints remain the same - they just now use the database instead of in-memory storage.

Example API call (same as before):
```bash
curl -X GET http://localhost:5000/api/users \
  -H "Authorization: Bearer <token>"
```

## Default Credentials

- **Username:** admin@kpmg.com
- **Password:** Admin123

*Change these immediately in production!*

## Data Migration

If you had data in the previous version:

### Option 1: Manual Re-entry
1. Login to the application
2. Re-create users, departments, and requirements through the UI
3. Re-upload files

### Option 2: SQL Script
Contact your administrator to restore from a backup if available.

## Configuration Options

### Environment Variables (.env)

```bash
# Database
DB_HOST=localhost          # MySQL server host
DB_USER=root              # MySQL username
DB_PASSWORD=              # MySQL password (empty for no password)
DB_NAME=kpmg_grc         # Database name

# Server
PORT=5000                 # Server port
JWT_SECRET=...           # JWT secret key
```

## Connection Pool Settings

Edit `database.js` to adjust for your needs:
- `connectionLimit: 10` - Max simultaneous connections
- `queueLimit: 0` - Unlimited queued requests
- `waitForConnections: true` - Wait for available connection

## Troubleshooting

### "Can't connect to MySQL server"
- Verify MySQL is running
- Check DB_HOST, DB_USER, DB_PASSWORD in .env
- Ensure MySQL user has correct permissions

### "Access denied for user"
- Verify MySQL credentials
- Create user if needed

### "Database doesn't exist"
- Run: `CREATE DATABASE kpmg_grc`

### Server won't start
- Check port 5000 isn't in use
- Verify all dependencies installed: `npm install`
- Check console for error messages

## Security Considerations

### Before Production

1. **Change default passwords**
   - Update admin password through UI
   - Change JWT_SECRET in .env

2. **Database security**
   - Use strong passwords
   - Create dedicated MySQL user
   - Restrict database access

3. **Backup strategy**
   - Regular MySQL backups
   - Store backups securely

4. **.env file security**
   - Never commit .env to git
   - Use .env.example as template
   - Set appropriate file permissions

## Advanced Configuration

### Using Remote MySQL Server

Update `.env`:
```
DB_HOST=your-server-ip
DB_USER=remote-user
DB_PASSWORD=strong-password
```

### Connection Pool Tuning

In `database.js`:
```javascript
const dbConfig = {
    connectionLimit: 20,  // Increase for high traffic
    queueLimit: 30,       // Queue overflow limit
};
```

### Enable Query Logging

In `database.js`, add:
```javascript
const mysql = require('mysql2/promise');
mysql.createConnection(dbConfig).then(conn => {
    conn.on('error', console.error);
});
```

## Performance Tips

1. **Indexes** - Database automatically indexed on foreign keys
2. **Connection pooling** - Configured for 10 connections
3. **Query optimization** - All queries use prepared statements
4. **Table cleanup** - Activities table keeps last 1000 records

## Backup & Recovery

### Backup MySQL Database

```bash
mysqldump -u root -p kpmg_grc > backup.sql
```

### Restore from Backup

```bash
mysql -u root -p kpmg_grc < backup.sql
```

## Monitoring

Check logs in console output:
- Database initialization status
- Connection errors
- Query execution issues

For production, enable database logging:
```javascript
pool.on('error', (err) => {
    console.error('MySQL error:', err);
});
```

## Support

Refer to:
- `MYSQL_SETUP.md` - Complete setup instructions
- `README.md` - General documentation
- `.env.example` - Configuration template

## FAQ

**Q: Where is my old data?**
A: In-memory data is lost when the server restarts. Manually re-enter important data.

**Q: Can I use a remote MySQL server?**
A: Yes, update DB_HOST in .env with the server IP/hostname.

**Q: How do I backup the database?**
A: Use `mysqldump` command (see Backup & Recovery section).

**Q: Is my data secure?**
A: Data is secure when using strong passwords and proper MySQL permissions.

**Q: Can I use SQLite instead?**
A: The current setup uses MySQL. Porting to SQLite would require code changes.

## Next Steps

1. ✅ Set up MySQL and create database
2. ✅ Configure .env file
3. ✅ Install dependencies (`npm install`)
4. ✅ Start the server (`npm start`)
5. ✅ Login with admin credentials
6. ✅ Update password immediately
7. ✅ Start using the application

Happy auditing! 🎉
