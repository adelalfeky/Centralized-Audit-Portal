# File Upload Feature - Complete Implementation

## Overview
This implementation allows department directors/users (like corp-it) to upload files for requirements to a centrally managed shared folder.

## What Was Created

### 1. **FILE_UPLOAD_GUIDE.md**
   - Complete guide on how the feature works
   - Setup instructions for shared folders
   - Admin configuration steps
   - User workflow documentation
   - Troubleshooting tips

### 2. **FILE_UPLOAD_INTEGRATION.md**
   - Step-by-step integration guide
   - HTML modal examples
   - JavaScript event handler examples
   - Backend endpoint code
   - Testing procedures

### 3. **js/file-upload-manager.js**
   - Complete client-side file upload manager
   - Features:
     - Drag & drop file selection
     - File validation (size, type)
     - Multiple file support
     - Progress indication
     - File preview before upload
     - Error handling and messages
     - Cleanup after successful upload

### 4. **Enhanced js/api-client.js**
   - New `uploadFiles()` method for binary uploads using FormData
   - Fallback `uploadFilesAsBase64()` for legacy support
   - Helper `fileToBase64()` method
   - New `getRequirementFiles()` method
   - Improved error handling

## Quick Integration Steps

### Step 1: Add File Upload Manager Script to HTML
```html
<script src="js/file-upload-manager.js"></script>
```

### Step 2: Create Update Requirement Modal
See FILE_UPLOAD_INTEGRATION.md for complete HTML example

### Step 3: Initialize on Modal Open
```javascript
fileUploadManager.initializeUploadUI(
    'file-upload-container',
    deptId,
    reqId,
    (uploadResult) => {
        console.log('Files uploaded:', uploadResult);
        loadRequirements(deptId);
    }
);
```

### Step 4: Handle Form Submission
```javascript
document.getElementById('requirement-update-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const deptId = parseInt(document.getElementById('update-dept-id').value);
    const reqId = parseInt(document.getElementById('update-req-id').value);
    const status = document.getElementById('update-status').value;
    const remarks = document.getElementById('update-remarks').value;
    
    await apiClient.updateRequirement(deptId, reqId, { status, remarks });
    // Files already uploaded via file upload manager
});
```

## Architecture

```
User Interface Layer (HTML/CSS)
↓
File Upload Manager (js/file-upload-manager.js)
  ├─ File validation
  ├─ Drag & drop handling
  ├─ Progress tracking
  └─ UI updates
↓
API Client (js/api-client.js)
  ├─ uploadFiles() - FormData binary upload
  ├─ uploadFilesAsBase64() - Legacy support
  └─ updateRequirement() - Update metadata
↓
Express Server (server.js)
  ├─ POST /api/departments/:deptId/requirements/:reqId/files
  ├─ Verify authentication & authorization
  ├─ Save to database (SQLite)
  ├─ Save to shared folder (if configured)
  └─ Return file metadata + paths
↓
Storage
  ├─ Database (files table with binary data)
  └─ Shared Folder (configured per department)
```

## Admin Configuration

Admins can configure shared folders per department:

```javascript
// Via API Client
await apiClient.updateFolderConfig(deptId, {
    path: 'D:\\shared\\corp-it',  // or /mnt/shared/corp-it
    sharedUrl: '\\\\server\\shared\\corp-it'
});
```

The folder path should be:
- Writable by the server process
- Accessible via network (for end users)
- Backed up regularly
- Monitored for disk space

## File Upload Flow

```
1. User logs in as director/user
   ↓
2. Views requirements for their department
   ↓
3. Clicks "Update" on a requirement
   ↓
4. Update modal opens with file upload UI
   ↓
5. User drags/drops or clicks to select files
   ↓
6. Files validated (size, type, total)
   ↓
7. Files shown in preview list
   ↓
8. User can remove files before upload
   ↓
9. User clicks "Upload Files" button
   ↓
10. Files uploaded to server via FormData
    ↓
11. Server saves to database AND shared folder
    ↓
12. Upload complete message shown
    ↓
13. User updates status/remarks (optional)
    ↓
14. User clicks "Submit" to finalize
    ↓
15. Requirement updated with new status
```

## Security Considerations

✅ **Already Implemented:**
- JWT token authentication required
- User can only upload to their own department
- Admin can access all uploads
- File validation (size, type)
- Unique file IDs for security
- Database transaction integrity

⚠️ **Recommended Additions:**
- Anti-virus scanning for uploaded files
- File access logging
- Encryption for sensitive files
- Role-based file access control
- Disk quota per department
- Retention policy for old files

## Storage Details

### Database (SQLite)
```sql
CREATE TABLE files (
    id TEXT PRIMARY KEY,
    requirementId INTEGER,
    departmentId INTEGER,
    name TEXT,
    type TEXT,
    size INTEGER,
    data BLOB,  -- Optional: binary file data
    uploaded DATETIME,
    FOREIGN KEY (requirementId) REFERENCES requirements(id),
    FOREIGN KEY (departmentId) REFERENCES departments(id)
);
```

### Shared Folder Structure
```
D:\shared\
├── corp-it\
│   ├── requirement-1\
│   │   ├── document.pdf
│   │   ├── report.xlsx
│   │   └── scan.jpg
│   └── requirement-2\
├── data-analytics\
├── infrastructure\
└── ...
```

## Limits & Defaults

- **Max file size per file:** 100 MB
- **Max total per requirement:** 500 MB
- **Supported file types:** PDF, Office, Images, Text, CSV
- **Concurrent uploads:** Limited by browser
- **Retention:** Configured per organization

## API Endpoints

### Upload Files
```
POST /api/departments/:deptId/requirements/:reqId/files
Authorization: Bearer {token}
Content-Type: multipart/form-data

Response:
{
  "uploadedFiles": [
    {
      "id": "file_1234567890_abc123",
      "name": "document.pdf",
      "type": "application/pdf",
      "size": 102400,
      "uploaded": "2026-02-09T12:00:00Z",
      "sharedPath": "D:\\shared\\corp-it\\document.pdf"
    }
  ]
}
```

### Update Requirement
```
PUT /api/departments/:deptId/requirements/:reqId
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "in-progress",
  "remarks": "Processing documents"
}

Response:
{ "message": "Requirement updated" }
```

### Get Folder Config
```
GET /api/folder-config
Response:
{
  "2": {
    "departmentId": 2,
    "path": "D:\\shared\\corp-it",
    "sharedUrl": "\\\\server\\shared\\corp-it",
    "configured": true
  },
  ...
}
```

### Set Folder Config (Admin)
```
PUT /api/folder-config/:deptId
Authorization: Bearer {token}
Content-Type: application/json

{
  "path": "D:\\shared\\corp-it",
  "sharedUrl": "\\\\server\\shared\\corp-it"
}

Response:
{ "message": "Configuration updated" }
```

## Testing Checklist

- [ ] Create shared folders for test departments
- [ ] Configure folder paths in admin panel
- [ ] Test login as director
- [ ] Open requirement update modal
- [ ] Drag single file → Upload → Verify in DB
- [ ] Drag multiple files → Upload → Verify all in DB & folder
- [ ] Try file > 100MB → Should show error
- [ ] Try unsupported file type → Should show error
- [ ] Total files > 500MB → Should show error
- [ ] Delete file from preview → Verify removed
- [ ] Submit with files → Verify requirement updated
- [ ] Check shared folder for files → Should exist
- [ ] Login as different director → Cannot see/upload to other dept

## Troubleshooting

### Files uploaded but not in shared folder
1. Check folder path configuration: `GET /api/folder-config`
2. Verify path exists and is writable
3. Check server logs for write errors
4. Verify server process user has permissions

### Upload fails with "Access denied"
1. Verify user is logged in
2. Verify user's department matches upload target
3. Check JWT token is valid
4. Verify server has write permissions

### Large files timeout
1. Increase server request timeout
2. Check network connectivity
3. Monitor server CPU/memory usage
4. Consider chunked upload for 100MB+ files

## Future Enhancements

1. **Chunked uploads** for files > 500MB
2. **File preview** (PDF, Images, Office)
3. **Compression** before upload
4. **Versioning** for requirement documents
5. **Comments** on uploaded files
6. **Approval workflow** for sensitive files
7. **Automated backup** to cloud storage
8. **File expiration** with auto-delete
9. **Digital signatures** for compliance
10. **Audit trail** for file access

## Support

For issues or questions:
1. Check FILE_UPLOAD_GUIDE.md
2. Review FILE_UPLOAD_INTEGRATION.md
3. Check server logs: `tail -f /path/to/logs/server.log`
4. Test with curl:
```bash
curl -X GET http://localhost:5000/api/folder-config \
  -H "Authorization: Bearer YOUR_TOKEN"
```

