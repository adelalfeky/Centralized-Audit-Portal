# MySQL Setup Guide for KPMG GRC Application

## Overview
This application has been updated to use MySQL as the database backend instead of in-memory storage. This guide will help you set up and run the application.

## Prerequisites
- MySQL Server installed and running on your device
- Node.js (v14 or higher)
- npm (Node Package Manager)

## Step 1: Create the MySQL Database

Open your MySQL client (MySQL Command Line, MySQL Workbench, or similar) and run:

```sql
CREATE DATABASE kpmg_grc CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

## Step 2: Configure Database Connection

Edit the `.env` file in the project root directory with your MySQL credentials:

```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password_here
DB_NAME=kpmg_grc
PORT=5000
```

**Important:** 
- Set `DB_HOST` to the IP/hostname where MySQL is running
- Set `DB_USER` to your MySQL username
- Set `DB_PASSWORD` to your MySQL password (leave blank if no password)
- Set `DB_NAME` to the database name you created

## Step 3: Install Dependencies

Navigate to the project directory in your terminal and run:

```bash
npm install
```

This will install:
- `express` - Web framework
- `cors` - Cross-origin requests support
- `jsonwebtoken` - JWT authentication
- `mysql2` - MySQL driver
- `dotenv` - Environment variable management
- `nodemon` - Development server (dev dependency)

## Step 4: Start the Server

Run the application with:

```bash
npm start
```

Or for development with auto-reload:

```bash
npm run dev
```

The server will:
1. Connect to your MySQL database
2. Automatically create all required tables if they don't exist
3. Create a default admin user (admin@kpmg.com / Admin123)
4. Start listening on `http://localhost:5000`

You should see output like:
```
Database tables initialized successfully
Default admin user created
Default departments created
Server running on http://localhost:5000
```

## Step 5: Access the Application

1. Open your browser and navigate to `http://localhost:5000`
2. Login with default credentials:
   - **Username:** admin@kpmg.com
   - **Password:** Admin123

## Database Tables

The application automatically creates the following tables:

### users
- Stores user information and authentication data
- Fields: id, username, password, fullName, email, role, department, status, lastLogin, createdAt

### departments
- Stores department information
- Fields: id, name, description, createdAt

### requirements
- Stores audit requirements for departments
- Fields: id, departmentId, description, requestDate, status, remarks, receivingDate, createdAt, updatedAt

### files
- Stores uploaded file data
- Fields: id, requirementId, departmentId, name, type, size, data, uploaded

### activities
- Stores activity logs
- Fields: id, message, departmentId, type, timestamp

### folder_config
- Stores folder path configurations
- Fields: id, departmentId, path, sharedUrl, configured, createdAt, updatedAt

## Troubleshooting

### Connection Error: "Can't connect to MySQL server"
- Verify MySQL is running: `mysql -u root -p`
- Check DB_HOST in .env file
- Check DB_USER and DB_PASSWORD are correct

### Database not found error
- Run the CREATE DATABASE command from Step 1
- Verify DB_NAME in .env matches your database name

### Permission denied for user
- Check your MySQL username and password in .env
- Ensure the user has CREATE, INSERT, SELECT, UPDATE, DELETE privileges

### Port already in use
- Change the PORT value in .env
- Or kill the process using port 5000

## Production Considerations

Before deploying to production:

1. **Change JWT Secret:**
   - Update `JWT_SECRET` in `.env` to a strong random string

2. **Database Security:**
   - Create a dedicated MySQL user with limited privileges
   - Use strong passwords

3. **Environment Variables:**
   - Never commit `.env` file to version control
   - Use `.env.example` as a template

4. **Connection Pool:**
   - Adjust `connectionLimit` in `database.js` based on your expected load

## API Endpoints

All endpoints require a valid JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

### Authentication
- `POST /api/login` - Login with username and password

### Users (Admin only)
- `GET /api/users` - Get all users
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Departments
- `GET /api/departments` - Get all departments with requirements
- `GET /api/departments/:id` - Get specific department with requirements

### Requirements
- `PUT /api/departments/:deptId/requirements/:reqId` - Update requirement status

### Files
- `POST /api/departments/:deptId/requirements/:reqId/files` - Upload files
- `DELETE /api/departments/:deptId/requirements/:reqId/files/:fileId` - Delete file

### Activities
- `GET /api/activities` - Get activity logs

### Folder Configuration
- `GET /api/folder-config` - Get all folder configurations
- `PUT /api/folder-config/:deptId` - Update folder configuration

### Statistics (Admin only)
- `GET /api/statistics` - Get system statistics

## Data Migration from Previous Version

If you had data in the old in-memory version:
1. Manually recreate users in the new system via the admin panel
2. Recreate departments
3. Re-upload necessary files

## Support & Troubleshooting

For additional help:
- Check application logs in the terminal
- Review the README.md file
- Verify all environment variables are set correctly
- Ensure MySQL user has all necessary permissions
