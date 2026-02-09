# File Upload Implementation - Integration Guide

## Quick Start

### 1. Include the File Upload Manager in your HTML

Add this to your `index.html` or relevant HTML file (before closing `</body>`):

```html
<!-- File Upload Manager -->
<script src="js/file-upload-manager.js"></script>
```

### 2. Create a Requirement Update Modal

Add a modal for updating requirements with file upload:

```html
<div id="requirement-update-modal" class="modal hidden">
    <div class="modal-content">
        <div class="modal-header">
            <h2>Update Requirement</h2>
            <button type="button" id="close-update-modal" class="text-gray-400 hover:text-gray-600">
                <i class="fas fa-times"></i>
            </button>
        </div>
        
        <form id="requirement-update-form">
            <input type="hidden" id="update-dept-id" />
            <input type="hidden" id="update-req-id" />
            
            <div class="form-group">
                <label for="update-status">Status</label>
                <select id="update-status" required class="form-control">
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                </select>
            </div>
            
            <div class="form-group">
                <label for="update-remarks">Remarks</label>
                <textarea id="update-remarks" rows="4" class="form-control"></textarea>
            </div>
            
            <!-- File Upload Section -->
            <div id="file-upload-container"></div>
            
            <div class="modal-footer">
                <button type="button" id="cancel-update" class="btn btn-secondary">Cancel</button>
                <button type="submit" class="btn btn-primary">Submit</button>
            </div>
        </form>
    </div>
</div>
```

### 3. Initialize File Upload UI on Modal Open

```javascript
// When opening requirement update modal
function openRequirementUpdateModal(deptId, reqId, requirement) {
    const modal = document.getElementById('requirement-update-modal');
    document.getElementById('update-dept-id').value = deptId;
    document.getElementById('update-req-id').value = reqId;
    document.getElementById('update-status').value = requirement.status;
    document.getElementById('update-remarks').value = requirement.remarks || '';
    
    // Initialize file upload UI
    fileUploadManager.initializeUploadUI(
        'file-upload-container',
        deptId,
        reqId,
        function(uploadResult) {
            console.log('Files uploaded:', uploadResult);
            // Refresh requirements list after upload
            loadRequirements(deptId);
        }
    );
    
    modal.classList.remove('hidden');
}
```

### 4. Handle Form Submission

```javascript
document.getElementById('requirement-update-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const deptId = parseInt(document.getElementById('update-dept-id').value);
    const reqId = parseInt(document.getElementById('update-req-id').value);
    const status = document.getElementById('update-status').value;
    const remarks = document.getElementById('update-remarks').value;
    
    try {
        // Update requirement metadata
        await apiClient.updateRequirement(deptId, reqId, {
            status: status,
            remarks: remarks
        });
        
        // Files are already uploaded via the file upload manager
        // Close modal and refresh
        document.getElementById('requirement-update-modal').classList.add('hidden');
        alert('Requirement updated successfully!');
        loadRequirements(deptId);
    } catch (error) {
        alert('Error updating requirement: ' + error.message);
    }
});
```

### 5. Add Event Handlers for Update Buttons

```javascript
// In your requirements list view
function setupRequirementActions() {
    document.querySelectorAll('.btn-update-requirement').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            const deptId = parseInt(btn.dataset.deptId);
            const reqId = parseInt(btn.dataset.reqId);
            
            try {
                // Fetch requirement details
                const requirement = await apiClient.getRequirement(deptId, reqId);
                openRequirementUpdateModal(deptId, reqId, requirement);
            } catch (error) {
                alert('Error loading requirement: ' + error.message);
            }
        });
    });
}
```

## File Upload Flow

```
User Interface:
1. User views requirement
2. Clicks "Update" button
3. Modal opens with:
   - Status dropdown
   - Remarks textarea
   - File upload area (drag & drop)
4. User selects/drags files
5. Files appear in preview list
6. User clicks "Upload Files" button
7. Files upload to server
8. User can see progress
9. Files listed in "Uploaded Files" section
10. User clicks "Submit" to finalize
11. Requirement updated + files saved
```

## Backend Integration

### Update Requirement Endpoint

Add/update in your server.js:

```javascript
app.put('/api/departments/:deptId/requirements/:reqId', verifyToken, async (req, res) => {
    try {
        const deptId = parseInt(req.params.deptId);
        const reqId = parseInt(req.params.reqId);
        const { status, remarks } = req.body;
        
        // Check permissions
        if (req.user.role === 'director' && req.user.department !== deptId) {
            return res.status(403).json({ error: 'Access denied' });
        }
        
        const connection = await pool.getConnection();
        
        // Update requirement
        const updates = [];
        const params = [];
        
        if (status !== undefined) {
            updates.push('status = ?');
            params.push(status);
        }
        if (remarks !== undefined) {
            updates.push('remarks = ?');
            params.push(remarks);
        }
        
        if (updates.length > 0) {
            updates.push('updatedAt = NOW()');
            params.push(reqId);
            params.push(deptId);
            
            await connection.execute(
                'UPDATE requirements SET ' + updates.join(', ') + ' WHERE id = ? AND departmentId = ?',
                params
            );
        }
        
        await addActivity(`Updated requirement #${reqId}: status=${status}`, deptId, connection);
        await connection.release();
        
        res.json({ message: 'Requirement updated' });
    } catch (error) {
        console.error('Update requirement error:', error);
        res.status(500).json({ error: 'Failed to update requirement' });
    }
});
```

### File Upload Endpoint Enhancement

The endpoint should:
1. Save files to the configured shared folder
2. Also store in database as fallback
3. Return both database and shared paths

```javascript
app.post('/api/departments/:deptId/requirements/:reqId/files', verifyToken, async (req, res) => {
    try {
        const deptId = parseInt(req.params.deptId);
        const reqId = parseInt(req.params.reqId);
        
        // Check permissions
        if (req.user.role === 'director' && req.user.department !== deptId) {
            return res.status(403).json({ error: 'Access denied' });
        }
        
        const connection = await pool.getConnection();
        
        // Get folder configuration
        const [configs] = await connection.execute(
            'SELECT path FROM folder_config WHERE departmentId = ? AND configured = TRUE',
            [deptId]
        );
        
        const folderPath = configs.length > 0 ? configs[0].path : null;
        
        // Save uploaded files
        const uploadedFiles = [];
        
        if (req.files) {
            for (const file of req.files) {
                const fileId = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                
                // Save to database
                await connection.execute(
                    'INSERT INTO files (id, requirementId, departmentId, name, type, size, uploaded) VALUES (?, ?, ?, ?, ?, ?, NOW())',
                    [fileId, reqId, deptId, file.originalname, file.mimetype, file.size]
                );
                
                // Save to shared folder if configured
                let sharedPath = null;
                if (folderPath) {
                    const fs = require('fs').promises;
                    const path = require('path');
                    
                    try {
                        const fullPath = path.join(folderPath, file.originalname);
                        await fs.mkdir(path.dirname(fullPath), { recursive: true });
                        await fs.writeFile(fullPath, file.buffer);
                        sharedPath = fullPath;
                    } catch (error) {
                        console.warn(`Could not save to shared folder: ${error.message}`);
                    }
                }
                
                uploadedFiles.push({
                    id: fileId,
                    name: file.originalname,
                    type: file.mimetype,
                    size: file.size,
                    uploaded: new Date().toISOString(),
                    sharedPath: sharedPath
                });
            }
        }
        
        await addActivity(`Uploaded ${req.files.length} file(s) for requirement #${reqId}`, deptId, connection);
        await connection.release();
        
        res.json({ uploadedFiles });
    } catch (error) {
        console.error('Upload files error:', error);
        res.status(500).json({ error: 'Failed to upload files' });
    }
});
```

## Testing

1. **Test File Upload**:
   - Select small PDF file
   - Click upload
   - Check database: `SELECT * FROM files WHERE requirementId = 1;`
   - Check shared folder for file

2. **Test Permissions**:
   - Login as director for Dept A
   - Try upload to Dept B
   - Should get 403 error

3. **Test File Validation**:
   - Try uploading file > 100MB
   - Should show error message
   - Try uploading executable file
   - Should show validation error

4. **Test Shared Folder**:
   - Set invalid path in folder config
   - Upload file
   - Should save to DB but not filesystem
   - Update path in config
   - File should appear in shared folder

## Troubleshooting

### Files not showing after upload
- Check console for errors
- Verify API response has uploadedFiles
- Check database: `SELECT * FROM files;`

### Shared folder saving fails
- Verify path exists: `ls -la /mnt/shared/`
- Check permissions: `ls -ld /mnt/shared/`
- Test with `echo "test" > /mnt/shared/test.txt`

### Large files timeout
- Increase timeout in API client
- Increase max file size in server config
- Use chunked upload for files > 100MB

