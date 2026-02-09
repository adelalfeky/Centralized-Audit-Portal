const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'kpmg_grc.db');
const db = new sqlite3.Database(dbPath);

// Department file mappings
const departmentFiles = [
    { id: 2, file: 'departments-corporate-it.js', variable: 'corporateIT' },
    { id: 3, file: 'departments-data-analytics.js', variable: 'dataAnalytics' },
    { id: 4, file: 'departments-infrastructure.js', variable: 'infrastructure' },
    { id: 5, file: 'departments-platforms.js', variable: 'platforms' },
    { id: 6, file: 'departments-quality-assurance.js', variable: 'qualityAssurance' },
    { id: 7, file: 'departments-solution-dev.js', variable: 'solutionDev' },
    { id: 8, file: 'departments-tech-strategy.js', variable: 'techStrategy' }
];

// Extract requirements from JS files
function extractRequirements(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Use regex to extract the requirements array
        const requirementsMatch = content.match(/requirements:\s*\[([\s\S]*?)\n\s*\]/);
        
        if (!requirementsMatch) {
            console.log(`No requirements found in ${filePath}`);
            return [];
        }
        
        const requirementsStr = requirementsMatch[1];
        
        // Extract individual requirement objects
        const reqMatches = requirementsStr.matchAll(/\{\s*id:\s*\d+,\s*description:\s*'([^']*(?:\\'[^']*)*)',\s*requestDate:\s*'([^']*)',\s*status:\s*'([^']*)'/g);
        
        const requirements = [];
        for (const match of reqMatches) {
            requirements.push({
                description: match[1].replace(/\\'/g, "'"), // Unescape single quotes
                requestDate: match[2],
                status: match[3]
            });
        }
        
        return requirements;
    } catch (error) {
        console.error(`Error reading ${filePath}:`, error.message);
        return [];
    }
}

db.serialize(() => {
    db.run('pragma foreign_keys = on');
    
    console.log('Deleting existing requirements...');
    db.run('DELETE FROM requirements', (err) => {
        if (err) console.error('Error deleting requirements:', err);
    });
    
    let totalInserted = 0;
    
    // Process each department file
    departmentFiles.forEach(dept => {
        const filePath = path.join(__dirname, dept.file);
        const requirements = extractRequirements(filePath);
        
        console.log(`\nProcessing ${dept.file}: Found ${requirements.length} requirements`);
        
        requirements.forEach((req, idx) => {
            db.run(
                'INSERT INTO requirements (departmentId, description, requestDate, status) VALUES (?, ?, ?, ?)',
                [dept.id, req.description, req.requestDate, req.status],
                function(err) {
                    if (err) {
                        console.error(`  Error inserting requirement ${idx + 1} for dept ${dept.id}:`, err.message);
                    } else {
                        totalInserted++;
                    }
                }
            );
        });
    });
    
    setTimeout(() => {
        console.log(`\n✅ Successfully inserted ${totalInserted} requirements from all department files`);
        
        // Verify counts
        db.all('SELECT departmentId, COUNT(*) as count FROM requirements GROUP BY departmentId ORDER BY departmentId', (err, rows) => {
            if (!err) {
                console.log('\nRequirements per department:');
                rows.forEach(row => {
                    const dept = departmentFiles.find(d => d.id === row.departmentId);
                    console.log(`  Dept ${row.departmentId} (${dept?.file}): ${row.count} requirements`);
                });
            }
            
            db.all('SELECT COUNT(*) as total FROM requirements', (err, rows) => {
                if (!err) {
                    console.log(`\nTotal requirements in database: ${rows[0].total}`);
                }
                db.close();
            });
        });
    }, 2000);
});
