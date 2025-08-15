#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

// Post-generation script for TypeScript OpenAPI code generation
// Adds constants, processes import mappings, and modifies generated interfaces

// File paths
const indexPath = path.join(__dirname, '../generated/typescript/src/models/index.ts')
const constantsPath = path.join(__dirname, 'constants.ts')
const openapiConfigPath = path.join(__dirname, '../openapitools.json')

// Validate required files exist
if (!fs.existsSync(constantsPath)) {
    console.error('Error: constants.ts file not found')
    process.exit(1)
}

if (!fs.existsSync(indexPath)) {
    console.error('Error: Generated index.ts file not found')
    process.exit(1)
}

if (!fs.existsSync(openapiConfigPath)) {
    console.error('Error: openapitools.json file not found')
    process.exit(1)
}

// Process import mappings from OpenAPI configuration
function processImportMappings() {
    let config
    try {
        const configContent = fs.readFileSync(openapiConfigPath, 'utf8')
        config = JSON.parse(configContent)
    } catch (error) {
        console.error('Error parsing openapitools.json:', error.message)
        return { statements: '', totalMappings: 0, processedMappings: 0, importStatements: 0 }
    }

    const generators = config['generator-cli']?.generators
    const typescriptGenerator = generators?.typescript
    const importMappings = typescriptGenerator?.importMappings

    const totalMappings = importMappings ? Object.keys(importMappings).length : 0

    if (!importMappings || totalMappings === 0) {
        return { statements: '', totalMappings, processedMappings: 0, importStatements: 0 }
    }

    // Group imports by their source file to avoid duplicate import statements
    const fileGroups = {}
    Object.entries(importMappings).forEach(([importName, sourcePath]) => {
        if (!fileGroups[sourcePath]) {
            fileGroups[sourcePath] = []
        }
        fileGroups[sourcePath].push(importName)
    })

    // Create properly formatted ES6 import statements
    const importStatements = Object.entries(fileGroups).map(([filePath, imports]) => {
        const sortedImports = imports.sort()
        return `import { ${sortedImports.join(', ')} } from '${filePath}'`
    })

    return {
        statements: importStatements.join('\n') + '\n',
        totalMappings,
        processedMappings: totalMappings,
        importStatements: importStatements.length,
    }
}

// Read the constants file and process import mappings
const constants = fs.readFileSync(constantsPath, 'utf8')
const importResult = processImportMappings()

// Read the generated index.ts file
let indexContent = fs.readFileSync(indexPath, 'utf8')

// Find the position after existing imports
const importEndPos = indexContent.lastIndexOf('import')
let insertPos = 0

if (importEndPos !== -1) {
    insertPos = indexContent.indexOf('\n', importEndPos) + 1
}

// Insert import statements and constants after existing imports
const contentToInsert = importResult.statements + (importResult.statements ? '\n' : '') + constants + '\n'
const newContent = indexContent.substring(0, insertPos) + '\n' + contentToInsert + indexContent.substring(insertPos)

// Modify PartialResultParams interface visibility
const originalContent = newContent
let modifiedContent = newContent.replace(
    /export\s+interface\s+PartialResultParams\s*\{/g,
    'interface PartialResultParams {'
)

// Write the updated content back to the file
fs.writeFileSync(indexPath, modifiedContent)

// Log import mapping results
if (importResult.totalMappings === 0) {
    console.log('Import mappings: 0 mappings found in openapitools.json')
} else {
    console.log(
        `Import mappings: processed ${importResult.processedMappings}/${importResult.totalMappings} mappings into ${importResult.importStatements} import statements`
    )

    // Warning if numbers don't match
    if (importResult.processedMappings !== importResult.totalMappings) {
        console.warn(
            `Warning: Only ${importResult.processedMappings} out of ${importResult.totalMappings} import mappings were processed`
        )
    }
}

console.log('Constants added to generated index.ts file')

if (originalContent !== modifiedContent) {
    console.log('PartialResultParams interface modified')
}
