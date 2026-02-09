# Migration Guide: Client-Side to Server-Side Storage

## Overview
The KPMG GRC Audit Portal has been successfully migrated from using localStorage (client-side) to server-side data storage using Node.js and Express.js. All user data, departments, requirements, and files are now stored and managed on the server.

## What Changed

### Before (Client-Side Storage)
- ❌ All data stored in browser's `localStorage`
- ❌ Data only persisted on that specific computer/browser
- ❌ No central data management
- ❌ Difficult to share data between users
- ❌ Security risks with sensitive data in browser

### After (Server-Side Storage)
- ✅ All data stored on a centralized Node.js/Express server
- ✅ Data accessible from any device
- ✅ JWT-based authentication and authorization
- ✅ Easy user and data management
- ✅ Audit logs automatically recorded server-side
- ✅ Better security and scalability

## How to Start the Server

### Option 1: Windows
Double-click `startup.bat` and it will:
1. Check Node.js installation
2. Install dependencies
3. Start the server on http://localhost:5000

### Option 2: Mac/Linux
```bash
chmod +x startup.sh
./startup.sh
```

### Option 3: Manual Start
```bash
npm install
npm start
```

## Default Login Credentials

### Admin User
- **Username**: `admin@kpmg.com`
- **Password**: `Admin123`

### Test Director User
- **Username**: `director@kpmg.com`
- **Password**: `Director123`

## Key Technical Changes

### Client-Side Changes
All localStorage calls have been replaced with API calls:

| Old Method | New Method |
|-----------|-----------|
| `localStorage.setItem('auditPortalUsers', ...)` | `apiClient.createUser(userData)` |
| `localStorage.getItem('auditPortalUsers')` | `apiClient.getUsers()` |
| `localStorage.removeItem('currentUser')` | `apiClient.logout()` |

### New API Client
A new `js/api-client.js` file provides all server communication:
```javascript
// Example usage
const user = await apiClient.login('user@example.com', 'password');
const users = await apiClient.getUsers();
await apiClient.updateUser(userId, userData);
```

### Server Files
New server files have been created:
- **server.js** - Main Express server with all API endpoints
- **package.json** - Node.js dependencies (Express, CORS, JWT)
- **js/api-client.js** - Client-side API wrapper

## API Endpoints

### Authentication
```
POST /api/login
  Body: { username, password }
  Response: { token, user }
```

### Users Management
```
GET /api/users                    - Get all users (admin only)
POST /api/users                   - Create new user (admin only)
PUT /api/users/:id                - Update user (admin only)
DELETE /api/users/:id             - Delete user (admin only)
```

### Departments & Requirements
```
GET /api/departments              - Get all departments
GET /api/departments/:id          - Get specific department
PUT /api/departments/:deptId/requirements/:reqId - Update requirement
```

### File Management
```
POST /api/departments/:deptId/requirements/:reqId/files     - Upload files
DELETE /api/departments/:deptId/requirements/:reqId/files/:fileId - Delete file
```

### Other Operations
```
GET /api/statistics               - Admin statistics
GET /api/activities               - Activity logs
GET /api/folder-config            - Folder configuration
PUT /api/folder-config/:deptId    - Update folder config
```

## Functions Updated for Server-Side Storage

### User Management
- `handleLogin()` - Now calls `apiClient.login()`
- `saveUser()` - Now calls `apiClient.createUser()` or `updateUser()`
- `deleteUser()` - Now calls `apiClient.deleteUser()`
- `changePassword()` - Now calls `apiClient.updateUser()`
- `handleLogout()` - Now calls `apiClient.logout()`

### Requirements & Status
- `saveRequirementStatus()` - Now calls `apiClient.updateRequirement()`
- `submitRequirementStatus()` - Now calls `apiClient.updateRequirement()` + `uploadFiles()`

### Configuration
- `saveFolderConfiguration()` - Now calls `apiClient.updateFolderConfig()`

### File Operations
- File uploads are now handled via `apiClient.uploadFiles()`
- File deletions use `apiClient.deleteFile()`

## Important Notes

### Authentication Token
- The server uses JWT (JSON Web Tokens) for authentication
- Token is stored in browser's `localStorage` as `authToken`
- Token expires after 24 hours
- Re-login required when token expires

### Activity Logging
- All activities are now automatically logged on the server
- The `addActivity()` function is now a no-op (does nothing)
- Activity logs are accessed via `/api/activities` endpoint

### Data Persistence
- Server stores data in memory by default (for quick testing)
- For production, upgrade to a real database:
  - SQLite
  - MongoDB
  - PostgreSQL

## Troubleshooting

### Server Won't Start
**Problem**: `Error: Cannot find module 'express'`
**Solution**: Run `npm install` to install dependencies

### CORS Errors
**Problem**: `Access to XMLHttpRequest blocked by CORS policy`
**Solution**: Make sure server is running on http://localhost:5000

### Login Fails
**Problem**: `Invalid username or password`
**Solution**: 
- Check credentials are correct
- Ensure server is running
- Check browser console for error messages

### Files Not Uploading
**Problem**: Upload fails silently
**Solution**: 
- Check file size (max 10MB)
- Check file type is supported (PDF, DOCX, XLSX, images)
- Check server has permission to handle files

## Development Notes

### Adding a New Feature that Needs Data
1. Create API endpoint in `server.js` (if needed)
2. Add method to `js/api-client.js`
3. Update HTML/JS functions to call the API method with `await`
4. Handle errors with try-catch

### Example: Adding a new user property
```javascript
// 1. In server.js - update the user schema
const user = {
  id, username, password, fullName, email, role, department, status,
  newProperty: '' // Add here
};

// 2. In js/api-client.js - update API methods if needed
async getUsersWithNewProperty() {
  return this.request('GET', '/users');
}

// 3. In index.html - use the updated API
const users = await apiClient.getUsers();
users.forEach(user => console.log(user.newProperty));
```

## Security Considerations

### Current Implementation
- JWT tokens for authentication
- Role-based access control (Admin/Director)
- Activity logging for audit trails

### Recommendations for Production
- [ ] Use HTTPS instead of HTTP
- [ ] Implement rate limiting for login attempts
- [ ] Hash passwords with bcrypt instead of storing plain text
- [ ] Use environment variables for JWT secret
- [ ] Implement refresh tokens for better security
- [ ] Add input validation and sanitization
- [ ] Set up a real database with authentication
- [ ] Enable HTTPS and secure cookies

## Example: Making an API Call

```javascript
// Async function with error handling
async function loadUserData() {
    try {
        // Make API call
        const users = await apiClient.getUsers();
        
        // Update UI with data
        users.forEach(user => {
            console.log(user.fullName);
        });
    } catch (error) {
        // Handle error
        console.error('Error loading users:', error);
        showToast('Failed to load users', 'error');
    }
}
```

## Supporting Files

- `SERVER_SETUP.md` - Detailed server setup instructions
- `package.json` - Node.js dependencies
- `server.js` - Express server implementation
- `js/api-client.js` - API client library
- `startup.bat` - Windows startup script
- `startup.sh` - Linux/Mac startup script

## Questions?

Refer to:
1. `SERVER_SETUP.md` for server configuration
2. `server.js` for API endpoint implementation
3. `js/api-client.js` for client-side API usage
4. Browser console (F12) for error messages

## Next Steps

1. ✅ Start the server using `startup.bat` (Windows) or `startup.sh` (Mac/Linux)
2. ✅ Open http://localhost:5000 in your browser
3. ✅ Login with provided credentials
4. ✅ Test the application features
5. ⚠️ For production: Upgrade to a real database and implement security recommendations
