const { query, run } = require('./database');

async function configureCorporateITFolder() {
    try {
        // Get Corporate IT department ID
        const depts = await query('SELECT id, name FROM departments WHERE name LIKE ?', ['%Corporate IT%']);
        
        if (depts.length === 0) {
            console.log('Corporate IT department not found');
            return;
        }
        
        const deptId = depts[0].id;
        console.log(`Found Corporate IT department: ID=${deptId}, Name=${depts[0].name}`);
        
        // Check if folder config exists
        const existing = await query('SELECT * FROM folder_config WHERE departmentId = ?', [deptId]);
        
        if (existing.length > 0) {
            // Update existing
            await run(
                'UPDATE folder_config SET path = ?, configured = 1, updatedAt = CURRENT_TIMESTAMP WHERE departmentId = ?',
                ['D:\\shared2', deptId]
            );
            console.log('✓ Updated folder configuration for Corporate IT');
        } else {
            // Insert new
            await run(
                'INSERT INTO folder_config (departmentId, path, configured) VALUES (?, ?, 1)',
                [deptId, 'D:\\shared2']
            );
            console.log('✓ Created folder configuration for Corporate IT');
        }
        
        // Verify
        const config = await query('SELECT * FROM folder_config WHERE departmentId = ?', [deptId]);
        console.log('\nCurrent configuration:');
        console.log(config[0]);
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

configureCorporateITFolder();
