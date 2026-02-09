const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'index.html');
let content = fs.readFileSync(filePath, 'utf8');

// Extract the script content between <script> tags
const scriptStart = content.indexOf('<script');
const firstScriptEnd = content.indexOf('>', scriptStart) + 1;
const scriptContentStart = firstScriptEnd;
const scriptContentEnd = content.indexOf('</script>', scriptContentStart);

const scriptContent = content.substring(scriptContentStart, scriptContentEnd);

// Write to temp file
fs.writeFileSync('temp-script.js', scriptContent);

console.log('Script extracted to temp-script.js');
console.log(`Script length: ${scriptContent.length} characters`);
console.log(`Approximate lines: ${scriptContent.split('\n').length}`);

// Try to parse it
try {
    new Function(scriptContent);
    console.log('✅ Script is syntactically valid!');
} catch (error) {
    console.error('❌ Syntax Error Found:');
    console.error(error.message);
    console.error(error.stack);
}
