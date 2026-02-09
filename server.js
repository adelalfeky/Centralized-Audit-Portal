const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs').promises;
require('dotenv').config();
const { pool, initializeDatabase } = require('./database');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const isProduction = process.env.NODE_ENV === 'production';

// Middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files
app.use(express.static(path.join(__dirname)));
app.use('/img', express.static(path.join(__dirname, 'img')));
app.use('/js', express.static(path.join(__dirname, 'js')));

// Logging middleware for production
if (isProduction) {
    app.use((req, res, next) => {
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
        next();
    });
}


// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }
    
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ error: 'Invalid token' });
        }
        req.user = decoded;
        next();
    });
};

// ==================== Authentication Routes ====================

app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const connection = await pool.getConnection();
        
        const [users] = await connection.execute(
            'SELECT * FROM users WHERE username = ? AND password = ?',
            [username, password]
        );
        
        if (users.length === 0) {
            await connection.release();
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        const user = users[0];
        
        // Update last login
        const now = new Date().toISOString();
        await connection.execute(
            'UPDATE users SET lastLogin = ? WHERE id = ?',
            [now, user.id]
        );
        
        await connection.release();
        
        // Generate JWT token
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role, department: user.department },
            JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
                department: user.department,
                status: user.status
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Test endpoint
app.get('/api/test', (req, res) => {
    res.json({ status: 'ok', message: 'API is working', timestamp: new Date().toISOString() });
});

// Debug endpoint for requirement submission
app.post('/api/debug/requirement-submit', verifyToken, (req, res) => {
    console.log('[DEBUG] Requirement submit attempt');
    console.log('[DEBUG] Headers:', req.headers);
    console.log('[DEBUG] Body:', req.body);
    console.log('[DEBUG] User:', req.user);
    res.json({
        received: true,
        bodyReceived: req.body,
        userReceived: req.user,
        timestamp: new Date().toISOString()
    });
});

// Seed requirements from department files
app.post('/api/seed-requirements', async (req, res) => {
    try {
        const connection = await pool.getConnection();
        
        // Load department files
        const departments = [
            { id: 2, file: './departments-corporate-it.js' },
            { id: 3, file: './departments-data-analytics.js' },
            { id: 4, file: './departments-infrastructure.js' },
            { id: 5, file: './departments-platforms.js' },
            { id: 6, file: './departments-quality-assurance.js' },
            { id: 7, file: './departments-solution-dev.js' },
            { id: 8, file: './departments-tech-strategy.js' }
        ];
        
        let totalInserted = 0;
        
        for (const dept of departments) {
            try {
                // Dynamically require the department file
                delete require.cache[require.resolve(dept.file)];
                const deptData = require(dept.file);
                const deptObj = Object.values(deptData)[0];
                
                if (deptObj && deptObj.requirements && Array.isArray(deptObj.requirements)) {
                    // Insert requirements
                    for (const req of deptObj.requirements) {
                        await connection.execute(
                            'INSERT INTO requirements (departmentId, description, requestDate, status) VALUES (?, ?, ?, ?)',
                            [dept.id, req.description, req.requestDate || '2026-02-02', req.status || 'pending']
                        );
                    }
                    totalInserted += deptObj.requirements.length;
                    console.log(`✓ Seeded ${deptObj.requirements.length} requirements for department ${dept.id}`);
                }
            } catch (error) {
                console.error(`Error seeding department ${dept.id}:`, error.message);
            }
        }
        
        await connection.release();
        
        res.json({ 
            status: 'success', 
            message: `Seeded ${totalInserted} requirements`,
            count: totalInserted
        });
    } catch (error) {
        console.error('Seed error:', error);
        res.status(500).json({ error: 'Failed to seed requirements', details: error.message });
    }
});

// ==================== User Routes ====================

app.get('/api/users', async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied' });
        }
        
        const connection = await pool.getConnection();
        const [users] = await connection.execute('SELECT * FROM users');
        await connection.release();
        
        res.json(users);
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Failed to get users' });
    }
});

app.post('/api/users', async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied' });
        }
        
        const { username, password, fullName, email, role, department, status } = req.body;
        const connection = await pool.getConnection();
        
        // Check if user exists
        const [existingUser] = await connection.execute(
            'SELECT id FROM users WHERE username = ?',
            [username]
        );
        
        if (existingUser.length > 0) {
            await connection.release();
            return res.status(400).json({ error: 'User already exists' });
        }
        
        const deptValue = role === 'director' ? department : null;
        
        const [result] = await connection.execute(
            'INSERT INTO users (username, password, fullName, email, role, department, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [username, password, fullName, email, role, deptValue, status]
        );
        
        // Add activity
        await addActivity(`Added new user ${username} (${fullName})`, 'system', connection);
        
        await connection.release();
        
        res.status(201).json({
            id: result.insertId,
            username,
            fullName,
            email,
            role,
            department: deptValue,
            status
        });
    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ error: 'Failed to create user' });
    }
});

app.put('/api/users/:id', async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied' });
        }
        
        const userId = parseInt(req.params.id);
        const { username, password, fullName, email, role, department, status } = req.body;
        
        const connection = await pool.getConnection();
        
        const [existingUser] = await connection.execute(
            'SELECT id FROM users WHERE id = ?',
            [userId]
        );
        
        if (existingUser.length === 0) {
            await connection.release();
            return res.status(404).json({ error: 'User not found' });
        }
        
        const deptValue = role === 'director' ? department : null;
        
        const updateQuery = password 
            ? 'UPDATE users SET username = ?, password = ?, fullName = ?, email = ?, role = ?, department = ?, status = ? WHERE id = ?'
            : 'UPDATE users SET username = ?, fullName = ?, email = ?, role = ?, department = ?, status = ? WHERE id = ?';
        
        const updateParams = password
            ? [username, password, fullName, email, role, deptValue, status, userId]
            : [username, fullName, email, role, deptValue, status, userId];
        
        await connection.execute(updateQuery, updateParams);
        
        await addActivity(`Updated user ${username}`, 'system', connection);
        
        const [updatedUser] = await connection.execute(
            'SELECT * FROM users WHERE id = ?',
            [userId]
        );
        
        await connection.release();
        
        res.json(updatedUser[0]);
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ error: 'Failed to update user' });
    }
});

app.delete('/api/users/:id', async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied' });
        }
        
        const userId = parseInt(req.params.id);
        
        if (userId === 1) {
            return res.status(400).json({ error: 'Cannot delete default admin user' });
        }
        
        const connection = await pool.getConnection();
        
        const [user] = await connection.execute(
            'SELECT username FROM users WHERE id = ?',
            [userId]
        );
        
        if (user.length === 0) {
            await connection.release();
            return res.status(404).json({ error: 'User not found' });
        }
        
        await connection.execute('DELETE FROM users WHERE id = ?', [userId]);
        
        await addActivity(`Deleted user ${user[0].username}`, 'system', connection);
        
        await connection.release();
        
        res.json({ message: 'User deleted' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

// ==================== Department Routes ====================

app.get('/api/departments', async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [departments] = await connection.execute('SELECT * FROM departments');
        
        // Get requirements for each department
        for (let dept of departments) {
            const [requirements] = await connection.execute(
                'SELECT * FROM requirements WHERE departmentId = ?',
                [dept.id]
            );
            
            // Get files for each requirement
            for (let req of requirements) {
                const [files] = await connection.execute(
                    'SELECT id, name, type, size, uploaded FROM files WHERE requirementId = ?',
                    [req.id]
                );
                req.files = files;
            }
            
            dept.requirements = requirements;
        }
        
        await connection.release();
        res.json(departments);
    } catch (error) {
        console.error('Get departments error:', error);
        res.status(500).json({ error: 'Failed to get departments' });
    }
});

app.get('/api/departments/:id', verifyToken, async (req, res) => {
    try {
        const deptId = parseInt(req.params.id);
        const connection = await pool.getConnection();
        
        const [departments] = await connection.execute(
            'SELECT * FROM departments WHERE id = ?',
            [deptId]
        );
        
        if (departments.length === 0) {
            await connection.release();
            return res.status(404).json({ error: 'Department not found' });
        }
        
        const dept = departments[0];
        
        // Get requirements
        const [requirements] = await connection.execute(
            'SELECT * FROM requirements WHERE departmentId = ?',
            [deptId]
        );
        
        // Get files for each requirement
        for (let req of requirements) {
            const [files] = await connection.execute(
                'SELECT id, name, type, size, uploaded FROM files WHERE requirementId = ?',
                [req.id]
            );
            req.files = files;
        }
        
        await connection.release();
        
        dept.requirements = requirements;
        res.json(dept);
    } catch (error) {
        console.error('Get department error:', error);
        res.status(500).json({ error: 'Failed to get department' });
    }
});

// ==================== Requirements Routes ====================

app.put('/api/departments/:deptId/requirements/:reqId', verifyToken, async (req, res) => {
    try {
        const deptId = parseInt(req.params.deptId);
        const reqId = parseInt(req.params.reqId);
        
        console.log(`[PUT Requirement] DeptID: ${deptId}, ReqID: ${reqId}, Body:`, req.body);
        
        // Check if user has access to this department
        if (req.user.role === 'director' && req.user.department !== deptId) {
            return res.status(403).json({ error: 'Access denied' });
        }
        
        const connection = await pool.getConnection();
        
        // Check if department exists
        const [depts] = await connection.execute(
            'SELECT id, name FROM departments WHERE id = ?',
            [deptId]
        );
        
        if (depts.length === 0) {
            await connection.release();
            return res.status(404).json({ error: 'Department not found' });
        }
        
        // Check if requirement exists
        const [requirements] = await connection.execute(
            'SELECT * FROM requirements WHERE id = ? AND departmentId = ?',
            [reqId, deptId]
        );
        
        if (requirements.length === 0) {
            await connection.release();
            return res.status(404).json({ error: 'Requirement not found' });
        }
        
        const oldStatus = requirements[0].status;
        
        // Only extract valid fields - ignore files since they're uploaded separately
        let { status, remarks, receivingDate } = req.body;
        
        // Sanitize inputs
        status = status ? String(status).trim() : null;
        remarks = remarks ? String(remarks).trim() : '';
        receivingDate = receivingDate ? String(receivingDate).trim() : null;
        
        console.log(`[PUT Requirement] Sanitized - Status: ${status}, Remarks: ${remarks}, ReceivingDate: ${receivingDate}`);
        
        const updateQuery = 'UPDATE requirements SET ';
        const updates = [];
        const params = [];
        
        if (status) {
            updates.push('status = ?');
            params.push(status);
        }
        if (remarks) {
            updates.push('remarks = ?');
            params.push(remarks);
        }
        if (receivingDate) {
            updates.push('receivingDate = ?');
            params.push(receivingDate);
        }
        
        // Always update timestamp
        updates.push('updatedAt = datetime("now")');
        
        if (updates.length > 0) {
            params.push(reqId);
            params.push(deptId);
            
            const sql = updateQuery + updates.join(', ') + ' WHERE id = ? AND departmentId = ?';
            console.log(`[PUT Requirement] Executing SQL:`, sql, 'with params:', params);
            
            await connection.execute(sql, params);
            console.log(`[PUT Requirement] Update successful`);
        }
        
        if (oldStatus !== status && status) {
            await addActivity(`Updated requirement #${reqId} from ${oldStatus} to ${status}`, deptId, connection);
        }
        
        // Get updated requirement
        const [updatedReq] = await connection.execute(
            'SELECT * FROM requirements WHERE id = ? AND departmentId = ?',
            [reqId, deptId]
        );
        
        // Get files for this requirement
        const [files] = await connection.execute(
            'SELECT id, name, type, size, uploaded FROM files WHERE requirementId = ?',
            [reqId]
        );
        
        const responseData = updatedReq[0] || {};
        responseData.files = files;
        
        await connection.release();
        
        console.log(`[PUT Requirement] Response:`, responseData);
        res.json(responseData);
    } catch (error) {
        console.error('Update requirement error:', error);
        res.status(500).json({ error: 'Failed to update requirement: ' + error.message });
    }
});

// ==================== Activity Routes ====================

app.get('/api/activities', verifyToken, async (req, res) => {
    try {
        const { departmentId } = req.query;
        const connection = await pool.getConnection();
        
        let query = 'SELECT * FROM activities ORDER BY timestamp DESC LIMIT 100';
        let params = [];
        
        if (departmentId) {
            const deptId = parseInt(departmentId);
            query = 'SELECT * FROM activities WHERE departmentId = ? OR type = "system" ORDER BY timestamp DESC LIMIT 100';
            params = [deptId];
        }
        
        const [activities] = await connection.execute(query, params);
        await connection.release();
        
        res.json(activities);
    } catch (error) {
        console.error('Get activities error:', error);
        res.status(500).json({ error: 'Failed to get activities' });
    }
});

// ==================== Folder Configuration Routes ====================

app.get('/api/folder-config', async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [configs] = await connection.execute('SELECT * FROM folder_config');
        await connection.release();
        
        const folderConfig = {};
        configs.forEach(config => {
            folderConfig[config.departmentId] = config;
        });
        
        res.json(folderConfig);
    } catch (error) {
        console.error('Get folder config error:', error);
        res.status(500).json({ error: 'Failed to get folder configuration' });
    }
});

app.put('/api/folder-config/:deptId', verifyToken, async (req, res) => {
    try {
        const deptId = parseInt(req.params.deptId);
        const { path, sharedUrl } = req.body;
        const connection = await pool.getConnection();
        
        // Check if config exists
        const [existing] = await connection.execute(
            'SELECT id FROM folder_config WHERE departmentId = ?',
            [deptId]
        );
        
        const configured = (path !== '' && path !== undefined) || (sharedUrl !== '' && sharedUrl !== undefined);
        
        if (existing.length > 0) {
            // Update existing
            const updates = [];
            const params = [];
            
            if (path !== undefined) {
                updates.push('path = ?');
                params.push(path);
            }
            if (sharedUrl !== undefined) {
                updates.push('sharedUrl = ?');
                params.push(sharedUrl);
            }
            
            updates.push('configured = ?');
            params.push(configured);
            params.push(deptId);
            
            await connection.execute(
                'UPDATE folder_config SET ' + updates.join(', ') + ' WHERE departmentId = ?',
                params
            );
        } else {
            // Insert new
            await connection.execute(
                'INSERT INTO folder_config (departmentId, path, sharedUrl, configured) VALUES (?, ?, ?, ?)',
                [deptId, path || '', sharedUrl || '', configured]
            );
        }
        
        const [updated] = await connection.execute(
            'SELECT * FROM folder_config WHERE departmentId = ?',
            [deptId]
        );
        
        await connection.release();
        
        res.json(updated[0]);
    } catch (error) {
        console.error('Update folder config error:', error);
        res.status(500).json({ error: 'Failed to update folder configuration' });
    }
});

// ==================== File Upload Routes ====================

app.post('/api/departments/:deptId/requirements/:reqId/files', verifyToken, async (req, res) => {
    try {
        const deptId = parseInt(req.params.deptId);
        const reqId = parseInt(req.params.reqId);
        
        // Check if user has access to this department
        if (req.user.role === 'director' && req.user.department !== deptId) {
            return res.status(403).json({ error: 'Access denied' });
        }
        
        const connection = await pool.getConnection();
        
        // Check if department exists
        const [depts] = await connection.execute(
            'SELECT id, name FROM departments WHERE id = ?',
            [deptId]
        );
        
        if (depts.length === 0) {
            await connection.release();
            return res.status(404).json({ error: 'Department not found' });
        }
        
        // Check if requirement exists
        const [requirements] = await connection.execute(
            'SELECT id FROM requirements WHERE id = ? AND departmentId = ?',
            [reqId, deptId]
        );
        
        if (requirements.length === 0) {
            await connection.release();
            return res.status(404).json({ error: 'Requirement not found' });
        }
        
        const { files } = req.body;
        
        console.log(`[File Upload] DeptID: ${deptId}, ReqID: ${reqId}, Files received:`, files ? files.length : 0);
        
        if (!files || !Array.isArray(files)) {
            await connection.release();
            console.log(`[File Upload Error] Invalid files data:`, { files, isArray: Array.isArray(files) });
            return res.status(400).json({ error: 'Invalid files data' });
        }
        
        // Get folder configuration from database (admin-configured path)
        const [folderConfig] = await connection.execute(
            'SELECT path FROM folder_config WHERE departmentId = ?',
            [deptId]
        );
        
        // Determine base path based on admin configuration
        let baseDir;
        
        if (folderConfig.length > 0 && folderConfig[0].path) {
            // Use admin-configured path
            const configuredPath = folderConfig[0].path;
            baseDir = path.join(configuredPath, String(reqId));
            console.log(`[File Upload] Using configured path: ${baseDir}`);
        } else {
            // Fallback to default paths if not configured
            const departmentName = depts[0].name || `department_${deptId}`;
            const safeDepartmentName = departmentName
                .replace(/[<>:"/\\|?*\x00-\x1F]/g, '')
                .trim()
                .replace(/\s+/g, '_');
            baseDir = path.join('C:\\', safeDepartmentName, String(reqId));
            console.log(`[File Upload] Using default path: ${baseDir}`);
        }
        
        await fs.mkdir(baseDir, { recursive: true });
        console.log(`[File Upload] Created directory: ${baseDir}`);

        const uploadedFiles = [];
        
        for (const file of files) {
            console.log(`[File Upload] Processing file:`, { name: file?.name, type: file?.type, size: file?.size, hasData: !!file?.data });
            
            const fileId = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            if (!file || !file.name || !file.data) {
                await connection.release();
                console.log(`[File Upload Error] Invalid file data:`, { hasFile: !!file, hasName: !!file?.name, hasData: !!file?.data });
                return res.status(400).json({ error: 'Invalid files data' });
            }

            const safeFileName = path.basename(file.name);
            const filePath = path.join(baseDir, safeFileName);

            const base64Data = String(file.data).includes(',')
                ? String(file.data).split(',')[1]
                : String(file.data);
            const buffer = Buffer.from(base64Data, 'base64');

            console.log(`[File Upload] Writing file: ${filePath}, size: ${buffer.length} bytes`);
            await fs.writeFile(filePath, buffer);

            await connection.execute(
                'INSERT INTO files (id, requirementId, departmentId, name, type, size, data, path) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [fileId, reqId, deptId, safeFileName, file.type, file.size, null, filePath]
            );
            
            uploadedFiles.push({
                id: fileId,
                name: file.name,
                type: file.type,
                size: file.size,
                path: filePath,
                uploaded: new Date().toISOString()
            });
        }
        
        await addActivity(`Uploaded ${files.length} file(s) for requirement #${reqId}`, deptId, connection);
        
        await connection.release();
        
        res.json(uploadedFiles);
    } catch (error) {
        console.error('Upload files error:', error);
        res.status(500).json({ error: 'Failed to upload files' });
    }
});

app.delete('/api/departments/:deptId/requirements/:reqId/files/:fileId', verifyToken, async (req, res) => {
    try {
        const deptId = parseInt(req.params.deptId);
        const reqId = parseInt(req.params.reqId);
        const fileId = req.params.fileId;
        
        // Check if user has access to this department
        if (req.user.role === 'director' && req.user.department !== deptId) {
            return res.status(403).json({ error: 'Access denied' });
        }
        
        const connection = await pool.getConnection();
        
        // Check if file exists
        const [files] = await connection.execute(
            'SELECT name FROM files WHERE id = ? AND requirementId = ? AND departmentId = ?',
            [fileId, reqId, deptId]
        );
        
        if (files.length === 0) {
            await connection.release();
            return res.status(404).json({ error: 'File not found' });
        }
        
        const fileName = files[0].name;
        
        await connection.execute(
            'DELETE FROM files WHERE id = ? AND requirementId = ? AND departmentId = ?',
            [fileId, reqId, deptId]
        );
        
        await addActivity(`Deleted file "${fileName}" from requirement #${reqId}`, deptId, connection);
        
        await connection.release();
        
        res.json({ message: 'File deleted' });
    } catch (error) {
        console.error('Delete file error:', error);
        res.status(500).json({ error: 'Failed to delete file' });
    }
});

// ==================== Statistics Routes ====================

app.get('/api/statistics', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied' });
        }
        
        const connection = await pool.getConnection();
        
        const [pendingResult] = await connection.execute(
            'SELECT COUNT(*) as count FROM requirements WHERE status = "pending"'
        );
        
        const [completedResult] = await connection.execute(
            'SELECT COUNT(*) as count FROM requirements WHERE status = "completed"'
        );
        
        const [userResult] = await connection.execute(
            'SELECT COUNT(*) as count FROM users'
        );
        
        const [directorResult] = await connection.execute(
            'SELECT COUNT(*) as count FROM users WHERE role = "director"'
        );
        
        await connection.release();
        
        res.json({
            totalUsers: userResult[0].count,
            directorCount: directorResult[0].count,
            totalPending: pendingResult[0].count,
            totalCompleted: completedResult[0].count
        });
    } catch (error) {
        console.error('Get statistics error:', error);
        res.status(500).json({ error: 'Failed to get statistics' });
    }
});

// ==================== Helper Functions ====================

async function addActivity(message, departmentId, connection) {
    try {
        const deptId = departmentId === 'system' ? null : departmentId;
        const type = departmentId === 'system' ? 'system' : 'department';
        
        await connection.execute(
            'INSERT INTO activities (message, departmentId, type) VALUES (?, ?, ?)',
            [message, deptId, type]
        );
    } catch (error) {
        console.error('Error adding activity:', error);
    }
}

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal server error' });
});

// Admin endpoint: Test file save
app.post('/api/admin/test-file-save', async (req, res) => {
    try {
        const { path: filePath, content } = req.body;
        
        if (!filePath) {
            return res.status(400).json({ error: 'File path is required' });
        }
        
        // Ensure directory exists
        const dir = path.dirname(filePath);
        await fs.mkdir(dir, { recursive: true });
        
        // Write file
        await fs.writeFile(filePath, content || 'Test file content');
        
        // Get file stats
        const stats = await fs.stat(filePath);
        
        res.json({
            success: true,
            path: filePath,
            size: stats.size,
            created: stats.birthtime
        });
    } catch (error) {
        console.error('File save error:', error);
        res.status(500).json({ 
            error: error.message,
            details: error.code === 'EACCES' ? 'Permission denied - check folder access' : 
                     error.code === 'ENOENT' ? 'Invalid path' : 
                     'Failed to save file'
        });
    }
});

// Admin endpoint: Save folder configuration
app.post('/api/admin/folder-config', async (req, res) => {
    try {
        const { folders } = req.body;
        
        if (!folders || typeof folders !== 'object') {
            return res.status(400).json({ error: 'Invalid folders configuration' });
        }
        
        const connection = await pool.getConnection();
        
        // Insert or update config for each department
        for (const [deptId, folderPath] of Object.entries(folders)) {
            // Check if config exists
            const [existing] = await connection.execute(
                'SELECT id FROM folder_config WHERE departmentId = ?',
                [parseInt(deptId)]
            );
            
            if (existing.length > 0) {
                // Update existing
                await connection.execute(
                    'UPDATE folder_config SET path = ?, configured = 1, updatedAt = CURRENT_TIMESTAMP WHERE departmentId = ?',
                    [folderPath, parseInt(deptId)]
                );
            } else {
                // Insert new
                await connection.execute(
                    'INSERT INTO folder_config (departmentId, path, configured) VALUES (?, ?, 1)',
                    [parseInt(deptId), folderPath]
                );
            }
        }
        
        await connection.release();
        
        res.json({ success: true, configured: Object.keys(folders).length });
    } catch (error) {
        console.error('Folder config error:', error);
        res.status(500).json({ error: 'Failed to save folder configuration' });
    }
});

// Start server
async function startServer() {
    try {
        await initializeDatabase();
        console.log('Database initialized');
        
        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();
