#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

// Path to the generated index.ts file
const indexPath = path.join(__dirname, 'generated/src/models/index.ts')

// Read the constants file
const constants = fs.readFileSync(path.join(__dirname, 'constants.ts'), 'utf8')

// Read the generated index.ts file
let indexContent = fs.readFileSync(indexPath, 'utf8')

// Find the position after the imports
const importEndPos = indexContent.lastIndexOf('import')
const importEndLinePos = indexContent.indexOf('\n', importEndPos) + 1

// Insert the constants after the imports
const newContent =
    indexContent.substring(0, importEndLinePos) +
    '\n// Constants\n' +
    constants +
    '\n' +
    indexContent.substring(importEndLinePos)

// Modify PartialResultParams interface
let modifiedContent = newContent.replace(
    /export\s+interface\s+PartialResultParams\s*\{/g,
    'interface PartialResultParams {'
)

// Write the updated content back to the file
fs.writeFileSync(indexPath, modifiedContent)

console.log('Constants added to generated index.ts file')
console.log('PartialResultParams interface modified')
