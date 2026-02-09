# File Upload Feature - Quick Start Guide

## What's New

Your application now has complete file upload capabilities! Directors and users can upload files for requirements, which are saved to both a database and configurable shared folders.

## Files Created

1. **js/file-upload-manager.js** - Client-side file upload handler
2. **FILE_UPLOAD_GUIDE.md** - Complete feature documentation
3. **FILE_UPLOAD_INTEGRATION.md** - Integration instructions
4. **FILE_UPLOAD_SUMMARY.md** - Architecture & API reference

## 5-Minute Setup

### For Admin

1. **Create shared folders** on your server:
   ```
   D:\shared\corporate-it\
   D:\shared\data-analytics\
   D:\shared\infrastructure\
   etc.
   ```

2. **Configure in Admin Panel** (index1.html):
   - Go to "Settings > Folder Configuration"
   - For each department, set the local path and shared URL
   - Example:
     - Local Path: `D:\shared\corporate-it`
     - Shared URL: `\\server\shared\corporate-it`

### For Developers

Add this to your **requirement update modal** in index.html:

```html
<!-- Include File Upload Manager -->
<script src="js/file-upload-manager.js"></script>

<!-- In your requirement update modal -->
<form id="requirement-update-form">
    <input type="hidden" id="update-dept-id" />
    <input type="hidden" id="update-req-id" />
    
    <div class="form-group">
        <label>Status</label>
        <select id="update-status">
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
        </select>
    </div>
    
    <div class="form-group">
        <label>Remarks</label>
        <textarea id="update-remarks" rows="4"></textarea>
    </div>
    
    <!-- File Upload UI Container -->
    <div id="file-upload-container"></div>
    
    <button type="submit">Submit</button>
</form>

<!-- JavaScript -->
<script>
    // When opening requirement update modal
    function openRequirementUpdate(deptId, reqId) {
        // Set hidden fields
        document.getElementById('update-dept-id').value = deptId;
        document.getElementById('update-req-id').value = reqId;
        
        // Initialize file upload UI
        fileUploadManager.initializeUploadUI(
            'file-upload-container',
            deptId,
            reqId,
            (uploadResult) => {
                console.log('Files uploaded:', uploadResult);
            }
        );
        
        // Show modal
        document.getElementById('requirement-update-modal').classList.remove('hidden');
    }
    
    // Handle form submission
    document.getElementById('requirement-update-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const deptId = parseInt(document.getElementById('update-dept-id').value);
        const reqId = parseInt(document.getElementById('update-req-id').value);
        const status = document.getElementById('update-status').value;
        const remarks = document.getElementById('update-remarks').value;
        
        // Files are already uploaded by file-upload-manager
        // Just update the requirement metadata
        await apiClient.updateRequirement(deptId, reqId, { status, remarks });
        
        alert('Requirement updated successfully!');
        document.getElementById('requirement-update-modal').classList.add('hidden');
    });
</script>
```

## How It Works

### From a Director's Perspective
```
1. Login to portal
2. View their department's requirements
3. Click "Update" on a requirement
4. Drag-drop or select files
5. Click "Upload Files"
6. Files appear in "Uploaded Files" section
7. Update status/remarks if needed
8. Click "Submit"
9. Done! Files saved to shared folder
```

### Behind the Scenes
```
Files selected
    ↓
Validated (size, type, count)
    ↓
Uploaded via API (FormData)
    ↓
Server saves to:
  - Database (for backup)
  - Shared folder (for easy access)
    ↓
Returns file metadata
    ↓
UI shows success message
```

## Key Features

✅ **Drag & Drop** - Users can drag files directly into the upload area

✅ **Multiple Files** - Upload many files at once (up to 500MB total)

✅ **Validation** - Automatic checks for file size and type

✅ **Progress** - Visual feedback during upload

✅ **Error Handling** - Clear error messages for common issues

✅ **Accessibility** - Works with keyboard navigation

✅ **Security** - User can only upload to their own department

## User Limits

- **Max file size:** 100 MB per file
- **Max per upload:** 500 MB total
- **Supported types:** PDF, Office docs, Images, Text
- **Storage:** Database + Shared folder

## Common Issues & Solutions

### Files don't appear in shared folder
**Solution:** Check folder configuration in admin panel
```
Settings > Folder Configuration > Check path is correct
```

### Upload button says "Upload Files" but is greyed out
**Solution:** Select files first by dragging or clicking

### "Access denied" when uploading
**Solution:** Check you're logged in and in the correct department

### File size error
**Solution:** File is too large (>100MB) or total exceeds 500MB

## Testing

Test with a real scenario:

1. **Login as corp-it director**
   - Username: `corp-it`
   - Password: `corp-it123`

2. **Open a requirement**
   - Click one of the 41 Corporate IT requirements

3. **Test file upload**
   - Create a test PDF or text file (< 100MB)
   - Drag it into the upload area
   - Click "Upload Files"
   - Should see success message

4. **Verify files saved**
   - Check database: `SELECT * FROM files;`
   - Check shared folder: `D:\shared\corporate-it\`

## Next Steps

1. ✅ Add file upload UI to your requirement modal
2. ✅ Configure shared folders for departments
3. ✅ Test with a sample file
4. ✅ Train users on how to upload
5. ✅ Monitor shared folder disk space

## Documentation

For detailed information:
- **FILE_UPLOAD_GUIDE.md** - Complete feature guide
- **FILE_UPLOAD_INTEGRATION.md** - Step-by-step integration
- **FILE_UPLOAD_SUMMARY.md** - Technical reference

## API Reference

### Upload files
```javascript
fileUploadManager.initializeUploadUI(
    'container-id',    // HTML element ID
    deptId,            // Department ID
    reqId,             // Requirement ID
    callback           // Called after upload
);
```

### Update requirement
```javascript
await apiClient.updateRequirement(deptId, reqId, {
    status: 'completed',
    remarks: 'Document received'
});
```

### Get folder config
```javascript
const config = await apiClient.getFolderConfig();
console.log(config[2]); // Corp IT folder config
```

### Set folder config (admin only)
```javascript
await apiClient.updateFolderConfig(2, {
    path: 'D:\\shared\\corporate-it',
    sharedUrl: '\\\\server\\shared\\corporate-it'
});
```

## Security Checklist

✅ Users can only upload to their own department
✅ Admin can upload to any department
✅ File size validated before upload
✅ File type checked
✅ Unique file IDs for security
✅ JWT authentication required
✅ All uploads logged

## Need Help?

1. Check the documentation files
2. Review the file-upload-manager.js comments
3. Check browser console for errors: `F12 > Console`
4. Check server logs for API errors
5. Verify folder permissions: `icacls D:\shared`

## That's It!

You now have a fully functional file upload system. Start integrating it into your UI and test with real users.

Happy uploading! 🚀

