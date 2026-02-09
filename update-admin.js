const { query, run } = require('./database');

(async () => {
    try {
        // Show current admin user
        console.log('\n=== Current Admin User ===\n');
        const currentAdmin = await query('SELECT * FROM users WHERE role = "admin"');
        console.log(JSON.stringify(currentAdmin, null, 2));

        // Update admin user - MODIFY THESE VALUES AS NEEDED
        const newUsername = 'admin';  // Change this
        const newPassword = 'Admin123';        // Change this
        const newFullName = 'System Administrator';  // Change this
        const newEmail = 'afeky@tasheer.com';     // Change this

        console.log('\n=== Updating Admin User ===\n');
        
        await run(`
            UPDATE users 
            SET username = ?,
                password = ?,
                fullName = ?,
                email = ?
            WHERE role = 'admin'
        `, [newUsername, newPassword, newFullName, newEmail]);

        console.log('✓ Admin user updated successfully!');

        // Show updated admin user
        console.log('\n=== Updated Admin User ===\n');
        const updatedAdmin = await query('SELECT * FROM users WHERE role = "admin"');
        console.log(JSON.stringify(updatedAdmin, null, 2));

        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
})();
