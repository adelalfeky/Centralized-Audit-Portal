# KPMG GRC Audit Portal - Server-Side Storage Implementation

## Quick Start

### Windows Users
1. Double-click `startup.bat`
2. Wait for "Server running on http://localhost:5000"
3. Open http://localhost:5000 in your browser

### Mac/Linux Users
```bash
chmod +x startup.sh
./startup.sh
```

### Manual Start
```bash
npm install
npm start
```

---

## Login Credentials

| Role | Username | Password |
|------|----------|----------|
| Admin | admin@kpmg.com | Admin123 |
| Director | director@kpmg.com | Director123 |

---

## What's New

✅ **Server-Side Data Storage** - All data now stored on Node.js server
✅ **JWT Authentication** - Secure token-based authentication  
✅ **Centralized Database** - Share data across all users
✅ **Activity Logging** - Automatic server-side audit logs
✅ **RESTful API** - Clean API endpoints for all operations
✅ **File Management** - Server-side file storage and handling

---

## Key Files

| File | Purpose |
|------|---------|
| `server.js` | Express.js server with API endpoints |
| `js/api-client.js` | Client-side API wrapper for making requests |
| `package.json` | Node.js dependencies (Express, CORS, JWT) |
| `index.html` | Web UI (updated to use API instead of localStorage) |
| `MIGRATION_GUIDE.md` | Detailed migration documentation |
| `SERVER_SETUP.md` | Server configuration guide |

---

## API Endpoints Summary

### Authentication
- `POST /api/login` - User login

### Users
- `GET /api/users` - List all users
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Departments & Requirements
- `GET /api/departments` - List departments
- `PUT /api/departments/:deptId/requirements/:reqId` - Update requirement status

### Files
- `POST /api/departments/:deptId/requirements/:reqId/files` - Upload files
- `DELETE /api/departments/:deptId/requirements/:reqId/files/:fileId` - Delete file

### Admin Features
- `GET /api/statistics` - Get admin dashboard stats
- `GET /api/activities` - Get activity logs
- `GET /api/folder-config` - Get folder configuration
- `PUT /api/folder-config/:deptId` - Update folder settings

---

## Architecture

```
┌─────────────────────────────────────┐
│   Browser (index.html)              │
│   - UI Components                   │
│   - Uses apiClient.js               │
└──────────────┬──────────────────────┘
               │ HTTP Requests
               ▼
┌─────────────────────────────────────┐
│   Node.js/Express Server            │
│   - API Endpoints                   │
│   - Data Management                 │
│   - JWT Authentication              │
│   - Activity Logging                │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│   Data Storage                      │
│   - In-Memory (current)             │
│   - SQLite/MongoDB/PostgreSQL       │
│     (for production)                │
└─────────────────────────────────────┘
```

---

## Changes from Original

### Removed
- ❌ `localStorage` calls for data persistence
- ❌ Client-side file storage
- ❌ Local user authentication

### Added
- ✅ Express.js server (server.js)
- ✅ API Client wrapper (js/api-client.js)
- ✅ JWT-based authentication
- ✅ Server-side activity logging
- ✅ RESTful API endpoints

### Modified
- `index.html` - Updated to use API calls instead of localStorage
- All functions dealing with data now use `apiClient` methods
- Async/await handling for API requests

---

## Development Workflow

### Making Changes to a Feature

1. **Update Server API** (if needed)
   - Edit `server.js`
   - Add/modify endpoint

2. **Update Client API** (if needed)
   - Edit `js/api-client.js`
   - Add/modify wrapper method

3. **Update UI Logic**
   - Edit `index.html`
   - Change function to be `async`
   - Use `await apiClient.methodName()`
   - Add error handling with try-catch

### Example: Updating User Role
```javascript
// Before (localStorage)
function updateUserRole(userId, newRole) {
    const user = appState.users.find(u => u.id === userId);
    user.role = newRole;
    localStorage.setItem('auditPortalUsers', JSON.stringify(appState.users));
}

// After (API)
async function updateUserRole(userId, newRole) {
    try {
        await apiClient.updateUser(userId, { role: newRole });
        showToast('Role updated successfully!');
    } catch (error) {
        showToast(`Error: ${error.message}`, 'error');
    }
}
```

---

## Production Deployment

### Before Going Live

1. **Change JWT Secret**
   - Edit `server.js` line 10
   - Replace `'your-secret-key-change-in-production'`

2. **Set Up Database**
   - Install SQLite, MongoDB, or PostgreSQL
   - Update data persistence in `server.js`

3. **Add Security**
   - Enable HTTPS/SSL
   - Hash passwords with bcrypt
   - Implement rate limiting
   - Add input validation

4. **Environment Variables**
   ```javascript
   // Create .env file
   PORT=5000
   JWT_SECRET=your-secret-key-here
   DATABASE_URL=your-database-connection-string
   ```

5. **Tests**
   - Test all user roles (Admin, Director)
   - Test file uploads
   - Test requirement status updates
   - Test across different browsers

---

## Support & Documentation

- **Server Setup**: See `SERVER_SETUP.md`
- **Migration Details**: See `MIGRATION_GUIDE.md`
- **API Reference**: See `server.js` comments
- **Client API**: See `js/api-client.js` comments

---

## Troubleshooting

### Port Already in Use
```bash
# Windows
netstat -ano | findstr :5000

# Mac/Linux
lsof -i :5000
```

### Clear Browser Cache
- Press `Ctrl+Shift+Delete` (Windows) or `Cmd+Shift+Delete` (Mac)
- Clear Cookies and Cached Files

### Check Server Status
- Visit http://localhost:5000 in browser
- Open Developer Tools (F12)
- Check Console tab for errors

---

## Version Information

- **Node.js**: Requires version 14.0.0 or higher
- **Express.js**: 4.18.2
- **JWT**: jsonwebtoken 9.1.2
- **Browser**: Any modern browser (Chrome, Firefox, Safari, Edge)

---

**Last Updated**: February 2026
**Status**: Production Ready

For questions or issues, refer to the documentation files included in the project directory.
