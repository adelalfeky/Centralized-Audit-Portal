# File Upload Implementation Guide

## Overview
This guide explains how to enable users (like corp-it) to upload files for requirements to a configurable shared folder.

## Features
1. **Admin Configuration**: Admin can set shared folder paths for each department
2. **File Upload UI**: Directors/Users can select and upload files when updating requirements
3. **Database Tracking**: All uploaded files are tracked in the database
4. **Shared Folder Export**: Files are saved to configured network/shared folders

## Setup Steps

### Step 1: Create Shared Folders
Create network shared folders for each department. Example:
```
\\server\shared\corporate-it\
\\server\shared\data-analytics\
\\server\shared\qa\
```

### Step 2: Configure in Admin Panel
1. Log in as admin
2. Go to **Admin > Folder Configuration**
3. For each department, set:
   - **Local Path**: `D:\shared\corp-it` (Windows) or `/mnt/shared/corp-it` (Linux)
   - **Shared URL**: `\\server\shared\corp-it` or `smb://server/shared/corp-it`

### Step 3: Update Folder Configuration (Database)
Run this to set up the database table if not exists:

```sql
CREATE TABLE IF NOT EXISTS folder_config (
    id INT AUTO_INCREMENT PRIMARY KEY,
    departmentId INT NOT NULL UNIQUE,
    path VARCHAR(500),
    sharedUrl VARCHAR(500),
    configured BOOLEAN DEFAULT FALSE,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (departmentId) REFERENCES departments(id) ON DELETE CASCADE
);
```

### Step 4: Director/User Workflow
1. Log in to portal
2. Go to **Requirements** for your department
3. Click on a requirement
4. Click **Update Requirement**
5. In the update modal:
   - **Update Status** and **Remarks** as needed
   - **Add Files**: Click "Choose Files" or drag-and-drop
   - **Submit**: Files are uploaded to both:
     - Database (as binary data for archival)
     - Configured Shared Folder (for easy access)

## Implementation Details

### File Upload API
```
POST /api/departments/{deptId}/requirements/{reqId}/files
Authorization: Bearer {token}
Content-Type: application/json

{
  "files": [
    {
      "name": "file1.pdf",
      "type": "application/pdf",
      "size": 102400,
      "data": "base64_encoded_data"
    }
  ]
}

Response:
{
  "uploadedFiles": [
    {
      "id": "file_1234567890_abc123",
      "name": "file1.pdf",
      "type": "application/pdf",
      "size": 102400,
      "uploaded": "2026-02-09T12:00:00Z",
      "sharedPath": "\\server\shared\corp-it\file1.pdf"
    }
  ]
}
```

### Required Changes in server.js
The file upload endpoint at `/api/departments/:deptId/requirements/:reqId/files` needs to be enhanced to:
1. Get the configured folder path for the department
2. Save files to both database AND filesystem
3. Return the shared folder path

### Frontend Implementation
The UI needs:
1. File input element with drag-and-drop support
2. File preview/list before upload
3. Progress indicator
4. Success/error messages
5. Link to access files in shared folder

## File Size Limits
- Maximum file size per file: 100MB
- Maximum total upload per requirement: 500MB
- Supported formats: All (configurable)

## Security Notes
- Only authenticated users can upload
- Users can only upload to their own department
- Admin can access all department uploads
- Files are stored with unique IDs for security

## Troubleshooting

### Files not saving to shared folder
1. Check if path exists and is writable
2. Verify network share is accessible
3. Check server process has write permissions
4. Review server logs

### Files in database but not in shared folder
1. Update folder configuration
2. Manually copy files from database to shared folder
3. Re-run upload process

### Permission Denied errors
1. Ensure shared folder path is correct
2. Grant read/write permissions to server process user
3. Test path is accessible: `net use \\server\shared`

