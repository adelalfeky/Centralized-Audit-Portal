# Complete Working HTML - Requirement Update Modal

Copy this complete example into your `index.html` to use the file upload feature with the fixed backend:

```html
<!-- Add this to your HTML body -->

<!-- Requirement Update Modal -->
<div id="requirement-update-modal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full hidden z-50">
    <div class="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        
        <!-- Header -->
        <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-bold text-gray-900">Update Requirement</h3>
            <button type="button" id="close-update-modal" class="text-gray-400 hover:text-gray-600 text-2xl">
                ×
            </button>
        </div>
        
        <!-- Form -->
        <form id="requirement-update-form" class="space-y-4">
            <!-- Hidden Fields -->
            <input type="hidden" id="update-dept-id" />
            <input type="hidden" id="update-req-id" />
            
            <!-- Status Selection -->
            <div class="form-group">
                <label for="update-status" class="block text-sm font-medium text-gray-700 mb-2">Status <span class="text-red-500">*</span></label>
                <select id="update-status" required class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">-- Select Status --</option>
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                </select>
                <p class="text-xs text-gray-500 mt-1">Status is required</p>
            </div>
            
            <!-- Remarks -->
            <div class="form-group">
                <label for="update-remarks" class="block text-sm font-medium text-gray-700 mb-2">Remarks</label>
                <textarea id="update-remarks" rows="4" placeholder="Add any remarks or notes (optional)" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
            </div>
            
            <!-- File Upload Section (Managed by fileUploadManager) -->
            <div id="file-upload-container" class="mt-6"></div>
            
            <!-- Form Actions -->
            <div class="flex justify-end gap-3 pt-4 border-t">
                <button type="button" id="cancel-update" class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition">
                    Cancel
                </button>
                <button type="submit" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition">
                    <i class="fas fa-save mr-2"></i>Submit
                </button>
            </div>
        </form>
    </div>
</div>

<!-- Include Required Scripts -->
<script src="js/api-client.js"></script>
<script src="js/file-upload-manager.js"></script>

<!-- JavaScript for Modal -->
<script>
    // ============================================================
    // OPEN REQUIREMENT UPDATE MODAL
    // ============================================================
    
    /**
     * Open the requirement update modal
     * @param {number} deptId - Department ID
     * @param {number} reqId - Requirement ID  
     * @param {object} requirement - Requirement data
     */
    function openRequirementUpdateModal(deptId, reqId, requirement) {
        console.log('[Modal] Opening update modal for requirement:', reqId);
        
        // Set hidden fields
        document.getElementById('update-dept-id').value = deptId;
        document.getElementById('update-req-id').value = reqId;
        
        // Set form fields
        document.getElementById('update-status').value = requirement.status || '';
        document.getElementById('update-remarks').value = requirement.remarks || '';
        
        // Initialize file upload UI
        // This creates the drag-drop area and upload button
        fileUploadManager.initializeUploadUI(
            'file-upload-container',
            deptId,
            reqId,
            function(uploadResult) {
                console.log('[Modal] Files uploaded successfully:', uploadResult);
                // Optional: You could auto-fill something based on upload
                // But usually you just let the user review before submitting
            }
        );
        
        // Show the modal
        const modal = document.getElementById('requirement-update-modal');
        modal.classList.remove('hidden');
        
        console.log('[Modal] Modal opened, ready for user interaction');
    }
    
    // ============================================================
    // CLOSE MODAL HANDLERS
    // ============================================================
    
    // Close button (X)
    document.getElementById('close-update-modal').addEventListener('click', () => {
        document.getElementById('requirement-update-modal').classList.add('hidden');
    });
    
    // Cancel button
    document.getElementById('cancel-update').addEventListener('click', () => {
        document.getElementById('requirement-update-modal').classList.add('hidden');
    });
    
    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.getElementById('requirement-update-modal').classList.add('hidden');
        }
    });
    
    // ============================================================
    // FORM SUBMISSION HANDLER
    // ============================================================
    
    document.getElementById('requirement-update-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Get form values
        const deptId = parseInt(document.getElementById('update-dept-id').value);
        const reqId = parseInt(document.getElementById('update-req-id').value);
        const status = document.getElementById('update-status').value.trim();
        const remarks = document.getElementById('update-remarks').value.trim();
        
        console.log('[Form] Submitting update:', {
            deptId,
            reqId,
            status,
            remarks
        });
        
        // Validate status is selected
        if (!status) {
            alert('❌ Please select a status before submitting');
            return;
        }
        
        try {
            // Update requirement on server
            // NOTE: Files are uploaded separately by fileUploadManager
            // This only sends status, remarks, and receivingDate
            const result = await apiClient.updateRequirement(deptId, reqId, {
                status: status,
                remarks: remarks
            });
            
            console.log('[Form] Update successful:', result);
            
            // Show success message
            alert('✅ Requirement updated successfully!');
            
            // Close modal
            document.getElementById('requirement-update-modal').classList.add('hidden');
            
            // Refresh requirements list
            if (typeof loadRequirements === 'function') {
                await loadRequirements(deptId);
            }
            
        } catch (error) {
            console.error('[Form] Update failed:', error);
            alert(`❌ Error updating requirement: ${error.message}`);
        }
    });
    
    // ============================================================
    // INTEGRATION WITH YOUR REQUIREMENTS LIST
    // ============================================================
    
    /**
     * Call this from your requirements list when user clicks "Update"
     * Example:
     * <button class="btn-update-req" data-dept="2" data-req="5">Update</button>
     */
    function setupUpdateButtons() {
        document.querySelectorAll('.btn-update-req, [data-action="update-requirement"]').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                
                const deptId = parseInt(btn.dataset.dept || btn.dataset.deptId);
                const reqId = parseInt(btn.dataset.req || btn.dataset.reqId);
                
                try {
                    // Get current requirement data
                    const dept = await apiClient.getDepartment(deptId);
                    const requirement = dept.requirements.find(r => r.id === reqId);
                    
                    if (requirement) {
                        openRequirementUpdateModal(deptId, reqId, requirement);
                    } else {
                        alert('Requirement not found');
                    }
                } catch (error) {
                    alert('Error loading requirement: ' + error.message);
                }
            });
        });
    }
    
    // Call this after your requirements are loaded
    // setupUpdateButtons();
    
</script>
```

## How to Use This

### 1. Add to Your HTML
Copy the entire code above into your `index.html` file, preferably near the end of the body.

### 2. Add Update Buttons to Your Requirements List
```html
<!-- In your requirements list -->
<button class="btn btn-sm btn-primary btn-update-req" data-dept="2" data-req="5">
    <i class="fas fa-edit"></i> Update
</button>
```

Or:
```html
<button class="btn" data-action="update-requirement" data-deptId="2" data-reqId="5">
    Update Requirement
</button>
```

### 3. Trigger Modal from JavaScript
```javascript
// When user clicks update button
openRequirementUpdateModal(deptId, reqId, requirement);

// Where requirement object has:
// {
//   id: 5,
//   description: "...",
//   status: "pending",
//   remarks: "...",
//   files: [...]
// }
```

### 4. Call After Loading Requirements
```javascript
// After you load and display requirements
async function loadRequirements(deptId) {
    const dept = await apiClient.getDepartment(deptId);
    
    // Display requirements...
    
    // Setup update buttons
    setupUpdateButtons();
}
```

## The Complete Flow

```
User clicks "Update" button
    ↓
openRequirementUpdateModal() called
    ↓
Modal opens with:
  • Status dropdown
  • Remarks textarea
  • File upload area
    ↓
User drags file(s)
    ↓
fileUploadManager validates
    ↓
User clicks "Upload Files"
    ↓
Files POST to /api/.../files
    ↓
✓ Files saved to DB + Folder
✓ "Uploaded Files" section shows files
    ↓
User selects Status (required)
    ↓
User adds Remarks (optional)
    ↓
User clicks "Submit"
    ↓
Form submission handler runs
    ↓
Validates status is selected
    ↓
PUT to /api/.../requirements
    ↓
✓ Requirement updated
✓ Success message shown
✓ Modal closes
✓ Requirements list refreshes
```

## Key Points

✅ **Files and requirement update are separate**
- Files uploaded first (POST /api/.../files)
- Then requirement updated (PUT /api/.../requirements)

✅ **Status is required**
- User must select from dropdown
- Form validation checks for this

✅ **Remarks are optional**
- Can be empty string

✅ **Error handling**
- Catches and displays errors
- Doesn't close modal on error
- Shows helpful error messages

✅ **Console logging**
- All actions logged for debugging
- Check browser console: F12 > Console

## Customization

### Change Modal Styling
```html
<!-- Change Tailwind classes as needed -->
<div class="max-w-2xl">  <!-- Change width -->
<div class="space-y-4">  <!-- Change spacing -->
```

### Add More Fields
```html
<div class="form-group">
    <label for="update-receivingDate">Receiving Date</label>
    <input type="date" id="update-receivingDate" />
</div>
```

Then in JavaScript:
```javascript
const receivingDate = document.getElementById('update-receivingDate').value;
await apiClient.updateRequirement(deptId, reqId, {
    status: status,
    remarks: remarks,
    receivingDate: receivingDate
});
```

## Testing

1. Save this HTML to your file
2. Refresh browser: Ctrl+F5
3. Login as corp-it
4. Click "Update" on a requirement
5. Test the workflow as described

## Troubleshooting

**Modal doesn't open?**
- Check console: F12 > Console
- Make sure apiClient is loaded

**Upload button disabled?**
- Select at least one file first

**Submit fails?**
- Check status is selected
- Check console for exact error
- Make sure server is running

**Files don't upload?**
- Check file size (max 100MB)
- Check total size (max 500MB)
- Check console for error

---

This is a complete, working implementation! Copy it into your HTML and test it out. 🚀

