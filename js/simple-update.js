/**
 * Simple Requirement Update Function
 * Use this to replace your form submission handler
 */

// Add this to your page instead of a complex form

async function submitRequirementUpdate(deptId, reqId, status, remarks) {
    console.log('[SubmitUpdate] Starting with:', { deptId, reqId, status, remarks });
    
    // Validation
    if (!deptId || !reqId) {
        alert('❌ Error: Missing department or requirement ID');
        return false;
    }
    
    if (!status || status.trim() === '') {
        alert('❌ Please select a status');
        return false;
    }
    
    try {
        console.log('[SubmitUpdate] Calling API...');
        
        // Call the API
        const response = await fetch(`http://localhost:5000/api/departments/${deptId}/requirements/${reqId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiClient.getToken()}`
            },
            body: JSON.stringify({
                status: status.trim(),
                remarks: remarks ? remarks.trim() : ''
            })
        });
        
        console.log('[SubmitUpdate] Response status:', response.status);
        
        const result = await response.json();
        console.log('[SubmitUpdate] Response:', result);
        
        if (!response.ok) {
            throw new Error(result.error || 'Update failed');
        }
        
        console.log('[SubmitUpdate] Success!');
        alert('✅ Requirement updated successfully!');
        return true;
        
    } catch (error) {
        console.error('[SubmitUpdate] Error:', error);
        alert('❌ Error: ' + error.message);
        return false;
    }
}

// Usage example:
// submitRequirementUpdate(2, 5, 'completed', 'Received all documents');
