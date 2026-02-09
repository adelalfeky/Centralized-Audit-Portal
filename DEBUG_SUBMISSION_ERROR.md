# Debug Guide: Invalid Files Date Error

## What's Happening

The error "Error submitting requirement: Invalid files date" appears even though files should be uploaded separately. This suggests the form is sending unexpected data.

## How to Debug

### Step 1: Check Browser Console
1. **Open F12** (Developer Tools)
2. Go to **Console** tab
3. Try to submit the form
4. Look for any error messages
5. Copy the exact error text

### Step 2: Check Network Tab
1. **Open F12**
2. Go to **Network** tab
3. Click **Update** on a requirement
4. **Drag a file** and upload it
5. Watch for the upload request:
   - Should see: `POST /api/departments/2/requirements/5/files`
   - Should show status: `200` (success)
6. **Select status and click Submit**
7. Watch for the update request:
   - Should see: `PUT /api/departments/2/requirements/5`
   - Look at the **Request** tab to see what data is being sent
   - Should show:
   ```json
   {
     "status": "completed",
     "remarks": "some text"
   }
   ```

### Step 3: Check Server Logs
Look at the terminal running `node server.js`. You should see logs like:
```
[PUT Requirement] DeptID: 2, ReqID: 5, Body: { status: 'completed', remarks: '' }
```

If you see extra fields in the Body, that's the problem!

## Common Issues

### Issue: Form includes file input data
**Problem:** The form might be including the file input element, which adds unexpected data

**Solution:** Use the simplified update function in `/js/simple-update.js`:
```html
<script src="js/simple-update.js"></script>

<button onclick="submitRequirementUpdate(2, 5, 'completed', 'remarks text')">
    Submit
</button>
```

### Issue: FormData being sent instead of JSON
**Problem:** The form might be using `enctype="multipart/form-data"` which causes issues

**Solution:** Change to:
```html
<form id="requirement-update-form">
    <!-- Remove enctype attribute -->
</form>
```

### Issue: Extra hidden fields being submitted
**Problem:** Form might have extra hidden inputs from file upload manager

**Solution:** Explicitly specify what to send:
```javascript
const data = {
    status: document.getElementById('update-status').value,
    remarks: document.getElementById('update-remarks').value
};

await apiClient.updateRequirement(deptId, reqId, data);
```

## Quick Test

Open browser console and run:
```javascript
submitRequirementUpdate(2, 5, 'completed', 'Test remarks');
```

Should return `true` and show success message.

## If Still Failing

### Check the exact error in server logs:
Terminal should show:
```
[PUT Requirement] DeptID: 2, ReqID: 5, Body: { ... }
```

Copy this exact output and share it.

### Check what's in the form:
```javascript
// In browser console
const form = document.getElementById('requirement-update-form');
const formData = new FormData(form);
for (let [key, value] of formData) {
    console.log(key + ' = ' + value);
}
```

This will show all fields being submitted. Should only show `status` and `remarks`.

## The Correct Flow

```
1. User opens requirement
   ↓
2. Clicks "Update"
   ↓
3. Modal opens with:
   - Status dropdown (NOT file input)
   - Remarks textarea
   - File upload area (separate component)
   ↓
4. User drags file
   ↓
5. Clicks "Upload Files"
   ↓
6. POST to /api/.../files ✓
   ↓
7. User selects status
   ↓
8. Clicks "Submit"
   ↓
9. PUT to /api/.../requirements
   ↓
10. Should succeed ✓
```

## Test with Simple Function

Instead of using a complex form, use this simple function:

```html
<script src="js/api-client.js"></script>
<script src="js/simple-update.js"></script>

<div id="test-section">
    <h3>Test Requirement Update</h3>
    <input type="text" id="test-deptid" placeholder="Dept ID" value="2" />
    <input type="text" id="test-reqid" placeholder="Req ID" value="5" />
    <select id="test-status">
        <option>pending</option>
        <option>in-progress</option>
        <option>completed</option>
    </select>
    <textarea id="test-remarks" placeholder="Remarks"></textarea>
    <button onclick="
        const deptId = document.getElementById('test-deptid').value;
        const reqId = document.getElementById('test-reqid').value;
        const status = document.getElementById('test-status').value;
        const remarks = document.getElementById('test-remarks').value;
        submitRequirementUpdate(deptId, reqId, status, remarks);
    ">Test Submit</button>
</div>
```

If this works, the issue is with your form. If it doesn't, the issue is with the server/API.

## Next Steps

1. **Open browser F12**
2. **Go to Network tab**
3. **Try to submit requirement**
4. **Look at the PUT request details**
5. **Check what data is being sent**
6. **Share the exact data being sent and the error response**

---

Once you identify what extra data is being sent, I can fix it!

