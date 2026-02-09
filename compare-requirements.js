const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Department files mapping
const departments = [
    {
        name: 'Corporate IT',
        excelFile: 'Digitization & Technology - Corporate IT - LOR.xlsx',
        jsFile: 'departments-corporate-it.js'
    },
    {
        name: 'Data Analytics & Business Intelligence',
        excelFile: 'Digitization & Technology - Data Analytics & Business Intelligence - LOR.xlsx',
        jsFile: 'departments-data-analytics.js'
    },
    {
        name: 'Infrastructure & Operations',
        excelFile: 'Digitization & Technology - Infrastructure & Operations - LOR.xlsx',
        jsFile: 'departments-infrastructure.js'
    },
    {
        name: 'Platforms and IT Solution Operations',
        excelFile: 'Digitization & Technology - Platforms and IT Solution Operations - LOR.xlsx',
        jsFile: 'departments-platforms.js'
    },
    {
        name: 'Quality Assurance',
        excelFile: 'Digitization & Technology - Quality Assurance - LOR.xlsx',
        jsFile: 'departments-quality-assurance.js'
    },
    {
        name: 'Solution Development & Delivery',
        excelFile: 'Digitization & Technology - Solution Development & Delivery - LOR.xlsx',
        jsFile: 'departments-solution-dev.js'
    },
    {
        name: 'Tech Strategy & Enterprise Architecture',
        excelFile: 'Digitization & Technology - Tech Strategy & Enterprise Architecture - LOR.xlsx',
        jsFile: 'departments-tech-strategy.js'
    }
];

// Extract requirements from JS file
function extractJSRequirements(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const requirementsMatch = content.match(/requirements:\s*\[([\s\S]*?)\n\s*\]/);
        
        if (!requirementsMatch) return [];
        
        const requirementsStr = requirementsMatch[1];
        const reqMatches = requirementsStr.matchAll(/\{\s*id:\s*(\d+),\s*description:\s*'([^']*(?:\\'[^']*)*)',\s*requestDate:\s*'([^']*)',\s*status:\s*'([^']*)'/g);
        
        const requirements = [];
        for (const match of reqMatches) {
            requirements.push({
                id: parseInt(match[1]),
                description: match[2].replace(/\\'/g, "'")
            });
        }
        
        return requirements;
    } catch (error) {
        console.error(`Error reading ${filePath}:`, error.message);
        return [];
    }
}

// Extract requirements from Excel file
function extractExcelRequirements(filePath) {
    try {
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        const requirements = [];
        
        // Find the header row (looking for "Sr." or "Information Requested")
        let headerRow = -1;
        let srCol = -1;
        let infoCol = -1;
        
        for (let i = 0; i < Math.min(10, data.length); i++) {
            const row = data[i];
            for (let j = 0; j < row.length; j++) {
                const cell = String(row[j] || '').trim().toLowerCase();
                if (cell.includes('sr.') || cell === 'sr') {
                    headerRow = i;
                    srCol = j;
                }
                if (cell.includes('information requested') || cell.includes('information / document requested')) {
                    infoCol = j;
                }
            }
            if (headerRow >= 0 && srCol >= 0 && infoCol >= 0) break;
        }
        
        if (headerRow < 0 || infoCol < 0) {
            console.log(`  Warning: Could not find header row in ${path.basename(filePath)}`);
            console.log(`  Trying alternative approach...`);
            
            // Alternative: assume first column is Sr and second is description
            for (let i = 1; i < data.length; i++) {
                const row = data[i];
                if (row && row[0] && row[1]) {
                    const srValue = String(row[0]).trim();
                    const desc = String(row[1]).trim();
                    
                    // Check if it's a valid requirement row
                    if (desc && desc.length > 5 && !desc.toLowerCase().includes('sr.')) {
                        requirements.push({
                            id: requirements.length + 1,
                            description: desc
                        });
                    }
                }
            }
            
            return requirements;
        }
        
        // Extract requirements starting after header
        for (let i = headerRow + 1; i < data.length; i++) {
            const row = data[i];
            if (!row || !row[infoCol]) continue;
            
            const desc = String(row[infoCol]).trim();
            
            // Skip empty rows or rows with just header text
            if (!desc || desc.length < 5 || desc.toLowerCase().includes('information requested')) {
                continue;
            }
            
            requirements.push({
                id: requirements.length + 1,
                description: desc
            });
        }
        
        return requirements;
    } catch (error) {
        console.error(`Error reading Excel ${filePath}:`, error.message);
        return [];
    }
}

// Compare requirements
console.log('='.repeat(80));
console.log('COMPARING EXCEL FILES WITH JS FILES');
console.log('='.repeat(80));
console.log();

let totalExcel = 0;
let totalJS = 0;
let allMatch = true;

departments.forEach(dept => {
    console.log(`\n📊 ${dept.name}`);
    console.log('-'.repeat(80));
    
    const excelPath = path.join(__dirname, 'sheets', dept.excelFile);
    const jsPath = path.join(__dirname, dept.jsFile);
    
    const excelReqs = extractExcelRequirements(excelPath);
    const jsReqs = extractJSRequirements(jsPath);
    
    totalExcel += excelReqs.length;
    totalJS += jsReqs.length;
    
    console.log(`Excel file: ${excelReqs.length} requirements`);
    console.log(`JS file:    ${jsReqs.length} requirements`);
    
    if (excelReqs.length === jsReqs.length) {
        console.log(`✅ COUNT MATCHES`);
    } else {
        console.log(`❌ COUNT MISMATCH (Difference: ${Math.abs(excelReqs.length - jsReqs.length)})`);
        allMatch = false;
    }
    
    // Show first 3 requirements from each for comparison
    console.log(`\nFirst 3 requirements comparison:`);
    for (let i = 0; i < Math.min(3, Math.max(excelReqs.length, jsReqs.length)); i++) {
        console.log(`\n  [${i + 1}]`);
        if (excelReqs[i]) {
            console.log(`  Excel: ${excelReqs[i].description.substring(0, 70)}...`);
        } else {
            console.log(`  Excel: (missing)`);
        }
        if (jsReqs[i]) {
            console.log(`  JS:    ${jsReqs[i].description.substring(0, 70)}...`);
        } else {
            console.log(`  JS:    (missing)`);
        }
    }
});

console.log('\n' + '='.repeat(80));
console.log('SUMMARY');
console.log('='.repeat(80));
console.log(`Total Excel Requirements: ${totalExcel}`);
console.log(`Total JS Requirements:    ${totalJS}`);
console.log(`Status: ${allMatch ? '✅ ALL COUNTS MATCH' : '❌ SOME COUNTS DIFFER'}`);
console.log('='.repeat(80));
