# Server-Side Data Storage Migration

## Overview
The KPMG GRC Audit Portal has been migrated from client-side localStorage to server-side storage using Node.js/Express API.

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Server
```bash
npm start
```

The server will run on `http://localhost:5000`

### 3. Login Credentials

#### Admin User
- Username: `admin@kpmg.com`
- Password: `Admin123`

#### Test Director User
- Username: `director@kpmg.com`
- Password: `Director123`

## API Endpoints

### Authentication
- `POST /api/login` - Login with credentials

### Users
- `GET /api/users` - Get all users (Admin only)
- `POST /api/users` - Create new user (Admin only)
- `PUT /api/users/:id` - Update user (Admin only)
- `DELETE /api/users/:id` - Delete user (Admin only)

### Departments
- `GET /api/departments` - Get all departments
- `GET /api/departments/:id` - Get specific department

### Requirements
- `PUT /api/departments/:deptId/requirements/:reqId` - Update requirement status

### Files
- `POST /api/departments/:deptId/requirements/:reqId/files` - Upload files
- `DELETE /api/departments/:deptId/requirements/:reqId/files/:fileId` - Delete file

### Folder Configuration
- `GET /api/folder-config` - Get folder configuration
- `PUT /api/folder-config/:deptId` - Update folder configuration

### Statistics
- `GET /api/statistics` - Get admin statistics

### Activities
- `GET /api/activities` - Get activity logs

## Key Changes

### Client-Side
- All `localStorage` calls have been replaced with API calls
- Authentication now uses JWT tokens
- Data is managed through the `apiClient` module

### Server-Side
- Express.js server handles all data operations
- JWT tokens for authentication (24-hour expiration)
- In-memory data storage (can be upgraded to database)
- Role-based access control (Admin/Director)

## Database Integration

Currently, the server uses in-memory storage. To upgrade to a database:

1. **SQLite**: Install `sqlite3` and create persistence layer
2. **MongoDB**: Install `mongoose` for MongoDB integration
3. **PostgreSQL**: Install `pg` and set up schema

Replace the in-memory data structure with database queries in `server.js`.

## Security Considerations

- JWT secret key should be changed in production (currently: `'your-secret-key-change-in-production'`)
- Use HTTPS in production
- Implement rate limiting for login attempts
- Add password hashing (bcrypt) instead of storing plain text
- Set up CORS properly for your domain

## Development Notes

- The server logs all activity for audit purposes
- Failed login attempts are not rate-limited (should be added in production)
- File data is stored as Base64 (suitable for small files; use cloud storage for large files)
