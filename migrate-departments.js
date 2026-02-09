const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'kpmg_grc.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err);
        process.exit(1);
    }
});

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON');

// Departments data from JS files
const departments = [
    {
        name: 'Corporate IT',
        id: 'corporate-it',
        username: 'corp-it',
        password: 'corp-it123',
        fullName: 'Corporate IT Director',
        email: 'corp-it@kpmg.com'
    },
    {
        name: 'Data Analytics & Business Intelligence',
        id: 'data-analytics',
        username: 'data-analytics',
        password: 'data-analytics123',
        fullName: 'Data Analytics Director',
        email: 'data-analytics@kpmg.com'
    },
    {
        name: 'Infrastructure & Operations',
        id: 'infrastructure',
        username: 'infrastructure',
        password: 'infrastructure123',
        fullName: 'Infrastructure Director',
        email: 'infrastructure@kpmg.com'
    },
    {
        name: 'Platforms and IT Solution Operations',
        id: 'platforms',
        username: 'platforms',
        password: 'platforms123',
        fullName: 'Platforms Director',
        email: 'platforms@kpmg.com'
    },
    {
        name: 'Quality Assurance',
        id: 'quality-assurance',
        username: 'quality-assurance',
        password: 'quality-assurance123',
        fullName: 'Quality Assurance Director',
        email: 'quality-assurance@kpmg.com'
    },
    {
        name: 'Solution Development & Delivery',
        id: 'solution-dev',
        username: 'solution-dev',
        password: 'solution-dev123',
        fullName: 'Solution Development Director',
        email: 'solution-dev@kpmg.com'
    },
    {
        name: 'Tech Strategy & Enterprise Architecture',
        id: 'tech-strategy',
        username: 'tech-strategy',
        password: 'tech-strategy123',
        fullName: 'Tech Strategy Director',
        email: 'tech-strategy@kpmg.com'
    }
];

// Load requirements from department files
let allDepartmentsData = {};

function loadDepartmentData() {
    // Dynamically load all department files
    const deptFiles = [
        'departments-corporate-it',
        'departments-data-analytics',
        'departments-infrastructure',
        'departments-platforms',
        'departments-quality-assurance',
        'departments-solution-dev',
        'departments-tech-strategy'
    ];
    
    deptFiles.forEach(file => {
        try {
            const data = require(`./${file}.js`);
            const key = Object.keys(data)[0];
            allDepartmentsData[key] = data[key];
            console.log(`✓ Loaded ${data[key].name}`);
        } catch (e) {
            console.error(`Error loading ${file}:`, e.message);
        }
    });
}

loadDepartmentData();

// Function to insert data
async function insertData() {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            // Clear existing data
            db.run('DELETE FROM requirements');
            db.run('DELETE FROM users WHERE role = "director"');
            db.run('DELETE FROM departments WHERE id != 1'); // Keep the default one

            let completed = 0;
            const total = departments.length;

            departments.forEach((dept, index) => {
                // Get the actual department data with requirements
                let deptName = dept.name;
                let deptData = null;
                
                // Map to the loaded department data
                const deptMap = {
                    'Corporate IT': allDepartmentsData.corporateIT,
                    'Data Analytics & Business Intelligence': allDepartmentsData.dataAnalytics,
                    'Infrastructure & Operations': allDepartmentsData.infrastructure,
                    'Platforms and IT Solution Operations': allDepartmentsData.platforms,
                    'Quality Assurance': allDepartmentsData.qualityAssurance,
                    'Solution Development & Delivery': allDepartmentsData.solutionDev,
                    'Tech Strategy & Enterprise Architecture': allDepartmentsData.techStrategy
                };
                
                deptData = deptMap[deptName];
                
                // Insert department
                db.run(
                    'INSERT OR REPLACE INTO departments (id, name, description) VALUES (?, ?, ?)',
                    [index + 2, deptName, `${deptName} division`],
                    function(err) {
                        if (err) {
                            console.error(`Error inserting department ${deptName}:`, err);
                            return;
                        }
                        
                        const deptId = this.lastID || (index + 2);
                        
                        // Insert director user
                        db.run(
                            'INSERT INTO users (username, password, fullName, email, role, department, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
                            [dept.username, dept.password, dept.fullName, dept.email, 'director', deptId, 'active'],
                            (err) => {
                                if (err) {
                                    console.error(`Error inserting user ${dept.username}:`, err);
                                } else {
                                    console.log(`✓ Created user: ${dept.username}`);
                                }
                                
                                // Insert requirements
                                if (deptData && deptData.requirements) {
                                    deptData.requirements.forEach(req => {
                                        db.run(
                                            'INSERT INTO requirements (departmentId, description, requestDate, status) VALUES (?, ?, ?, ?)',
                                            [deptId, req.description, req.requestDate, req.status],
                                            (err) => {
                                                if (err) {
                                                    console.error(`Error inserting requirement:`, err);
                                                }
                                            }
                                        );
                                    });
                                    console.log(`✓ Added ${deptData.requirements.length} requirements for ${deptName}`);
                                }
                                
                                completed++;
                                if (completed === total) {
                                    console.log('\n✅ All departments and users created successfully!');
                                    resolve();
                                }
                            }
                        );
                    }
                );
            });
        });
    });
}

// Run the migration
insertData().then(() => {
    db.close(() => {
        console.log('Database connection closed');
        process.exit(0);
    });
}).catch(err => {
    console.error('Migration failed:', err);
    db.close(() => process.exit(1));
});
