const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'index.html');
const content = fs.readFileSync(filePath, 'utf8');

// Extract script content
const scriptMatch = content.match(/<script[^>]*>([\s\S]*?)<\/script>/);
if (!scriptMatch) {
    console.error('No script tag found');
    process.exit(1);
}

const scriptContent = scriptMatch[1];

// Count braces
let braceCount = 0;
let braceErrors = [];
let lineNum = 1;

for (let i = 0; i < scriptContent.length; i++) {
    const char = scriptContent[i];
    
    if (char === '{') {
        braceCount++;
    } else if (char === '}') {
        braceCount--;
        if (braceCount < 0) {
            braceErrors.push(`Line ~${lineNum}: Unexpected closing brace - brace count went negative`);
        }
    }
    
    if (char === '\n') {
        lineNum++;
    }
}

console.log(`\nBrace Analysis:`);
console.log(`Total opening braces: ${scriptContent.match(/{/g)?.length || 0}`);
console.log(`Total closing braces: ${scriptContent.match(/}/g)?.length || 0}`);
console.log(`Final brace count: ${braceCount}`);

if (braceCount !== 0) {
    console.error(`\n❌ ERROR: Mismatched braces! Difference: ${braceCount}`);
}

if (braceErrors.length > 0) {
    console.error(`\n❌ Brace errors:`);
    braceErrors.forEach(err => console.error(`  - ${err}`));
}

if (braceCount === 0 && braceErrors.length === 0) {
    console.log(`\n✅ Script braces are balanced!`);
}
