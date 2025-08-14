#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

// Path to the generated index.ts file
const indexPath = path.join(__dirname, 'generated/typescript/src/models/index.ts')
const constantsPath = path.join(__dirname, 'constants.ts')

// Check if files exist
if (!fs.existsSync(constantsPath)) {
    console.error('Error: constants.ts file not found')
    process.exit(1)
}

if (!fs.existsSync(indexPath)) {
    console.error('Error: Generated index.ts file not found')
    process.exit(1)
}

// Read the constants file
const constants = fs.readFileSync(constantsPath, 'utf8')

// Read the generated index.ts file
let indexContent = fs.readFileSync(indexPath, 'utf8')

// Find the position after the imports
const importEndPos = indexContent.lastIndexOf('import')
let insertPos = 0

if (importEndPos !== -1) {
    insertPos = indexContent.indexOf('\n', importEndPos) + 1
}

// Insert the constants after the imports (or at the top if no imports)
const newContent = indexContent.substring(0, insertPos) + '\n' + constants + '\n' + indexContent.substring(insertPos)

// Modify PartialResultParams interface
let modifiedContent = newContent.replace(
    /export\s+interface\s+PartialResultParams\s*\{/g,
    'interface PartialResultParams {'
)

// Write the updated content back to the file
fs.writeFileSync(indexPath, modifiedContent)

console.log('Constants added to generated index.ts file')
console.log('PartialResultParams interface modified')
