#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

// Post-test script to validate generated models against schema definitions
// Compares models in final-output.json with generated TypeScript and Java models
// Usage: node post-test.js [--verbose]

// Parse command line arguments
const args = process.argv.slice(2)
const verbose = args.includes('--verbose') || args.includes('-v')

// File paths
const finalOutputPath = path.join(__dirname, '../schema/final-output.json')
const typescriptModelsPath = path.join(__dirname, '../generated/typescript/src/models/index.ts')
const javaModelsDir = path.join(__dirname, '../generated/java/src/main/java/org/openapitools/client/model')
const openapiConfigPath = path.join(__dirname, '../openapitools.json')

console.log('Starting model validation...\n')

// Check if final-output.json exists
if (!fs.existsSync(finalOutputPath)) {
    console.error('Error: final-output.json not found in schema directory')
    console.error('   Run "npm run generate-schema" first to create the schema file')
    process.exit(1)
}

// Load and parse OpenAPI configuration
let openapiConfig = null
let typescriptFilteredModels = null
let javaFilteredModels = null

try {
    openapiConfig = JSON.parse(fs.readFileSync(openapiConfigPath, 'utf8'))

    // Check for TypeScript global-property models filter
    const tsGenerator = openapiConfig['generator-cli']?.generators?.typescript
    if (tsGenerator?.['global-property']?.models) {
        typescriptFilteredModels = new Set(tsGenerator['global-property'].models.split(':'))
    }

    // Check for Java global-property models filter
    const javaGenerator = openapiConfig['generator-cli']?.generators?.java
    if (javaGenerator?.['global-property']?.models) {
        javaFilteredModels = new Set(javaGenerator['global-property'].models.split(':'))
    }
} catch (error) {
    console.warn('Warning: Could not read OpenAPI configuration:', error.message)
}

// Load and parse final-output.json
let schemaModels = new Set()
try {
    const finalOutput = JSON.parse(fs.readFileSync(finalOutputPath, 'utf8'))

    if (!finalOutput.components || !finalOutput.components.schemas) {
        console.error('Error: Invalid OpenAPI structure in final-output.json')
        console.error('   Missing components.schemas section')
        process.exit(1)
    }

    schemaModels = new Set(Object.keys(finalOutput.components.schemas))
    console.log(`Found ${schemaModels.size} models in schema\n`)
} catch (error) {
    console.error('Error parsing final-output.json:', error.message)
    process.exit(1)
}

// Extract TypeScript models
let typescriptModels = new Set()
if (fs.existsSync(typescriptModelsPath)) {
    try {
        const typescriptContent = fs.readFileSync(typescriptModelsPath, 'utf8')

        // Match interface and type declarations
        const interfaceMatches = typescriptContent.match(/(?:export\s+)?(?:interface|type)\s+(\w+)/g) || []
        const enumMatches = typescriptContent.match(/export\s+(?:const\s+)?(\w+)\s*=\s*{[^}]*}\s*as\s+const/g) || []

        interfaceMatches.forEach(match => {
            const modelName = match.replace(/(?:export\s+)?(?:interface|type)\s+/, '')
            typescriptModels.add(modelName)
        })

        enumMatches.forEach(match => {
            const modelName = match.match(/export\s+(?:const\s+)?(\w+)/)[1]
            typescriptModels.add(modelName)
        })

        if (typescriptFilteredModels) {
            console.log(`TypeScript generator has model filter: ${typescriptFilteredModels.size} models`)
        }
        console.log(`Found ${typescriptModels.size} TypeScript models\n`)
    } catch (error) {
        console.error('Warning: Error reading TypeScript models:', error.message)
    }
} else {
    console.warn('Warning: TypeScript models file not found at:', typescriptModelsPath)
}

// Extract Java models
let javaModels = new Set()
if (fs.existsSync(javaModelsDir)) {
    try {
        const javaFiles = fs.readdirSync(javaModelsDir).filter(file => file.endsWith('.java'))

        javaFiles.forEach(file => {
            const modelName = file.replace('.java', '')
            javaModels.add(modelName)
        })

        if (javaFilteredModels) {
            console.log(`Java generator has model filter: ${javaFilteredModels.size} models`)
        }
        console.log(`Found ${javaModels.size} Java models\n`)
    } catch (error) {
        console.error('Warning: Error reading Java models:', error.message)
    }
} else {
    console.warn('Warning: Java models directory not found at:', javaModelsDir)
}

// Validation results
let hasErrors = false
const results = {
    typescript: {
        missing: [],
        extra: [],
    },
    java: {
        missing: [],
        extra: [],
    },
}

// Check TypeScript models
if (typescriptModels.size > 0) {
    // Determine expected models based on configuration
    const expectedTypescriptModels = typescriptFilteredModels || schemaModels

    // Find missing models (expected but not in TypeScript)
    expectedTypescriptModels.forEach(model => {
        if (!typescriptModels.has(model)) {
            results.typescript.missing.push(model)
        }
    })

    // Find extra models (in TypeScript but not expected)
    typescriptModels.forEach(model => {
        if (!expectedTypescriptModels.has(model)) {
            results.typescript.extra.push(model)
        }
    })
}

// Check Java models
if (javaModels.size > 0) {
    // Determine expected models based on configuration
    const expectedJavaModels = javaFilteredModels || schemaModels

    // Find missing models (expected but not in Java)
    expectedJavaModels.forEach(model => {
        if (!javaModels.has(model)) {
            results.java.missing.push(model)
        }
    })

    // Find extra models (in Java but not expected)
    javaModels.forEach(model => {
        if (!expectedJavaModels.has(model)) {
            results.java.extra.push(model)
        }
    })
}

// Report results
console.log('VALIDATION RESULTS')
console.log('='.repeat(50))

// TypeScript results
if (typescriptModels.size > 0) {
    console.log('\nTypeScript Models:')
    if (typescriptFilteredModels) {
        console.log(`   Note: Only ${typescriptFilteredModels.size} models expected (global-property filter active)`)
    }

    if (results.typescript.missing.length === 0 && results.typescript.extra.length === 0) {
        console.log('   All models match perfectly!')
    } else {
        if (results.typescript.missing.length > 0) {
            console.log(`   Missing models (${results.typescript.missing.length}):`)
            results.typescript.missing.sort().forEach(model => {
                console.log(`      - ${model}`)
            })
            hasErrors = true
        }

        if (verbose && results.typescript.extra.length > 0) {
            console.log(`   Extra/Intermediate models (${results.typescript.extra.length}):`)
            results.typescript.extra.sort().forEach(model => {
                console.log(`      + ${model}`)
            })
        }
    }
} else {
    console.log('\nTypeScript Models: Not found or not generated')
}

// Java results
if (javaModels.size > 0) {
    console.log('\nJava Models:')
    if (javaFilteredModels) {
        console.log(`   Note: Only ${javaFilteredModels.size} models expected (global-property filter active)`)
    }

    if (results.java.missing.length === 0 && results.java.extra.length === 0) {
        console.log('   All models match perfectly!')
    } else {
        if (results.java.missing.length > 0) {
            console.log(`   Missing models (${results.java.missing.length}):`)
            results.java.missing.sort().forEach(model => {
                console.log(`      - ${model}`)
            })
            hasErrors = true
        }

        if (verbose && results.java.extra.length > 0) {
            console.log(`   Extra/Intermediate models (${results.java.extra.length}):`)
            results.java.extra.sort().forEach(model => {
                console.log(`      + ${model}`)
            })
        }
    }
} else {
    console.log('\nJava Models: Not found or not generated')
}

// Summary
console.log('\nSUMMARY')
console.log('='.repeat(50))
console.log(`Schema models: ${schemaModels.size}`)
console.log(`TypeScript models: ${typescriptModels.size}`)
console.log(`Java models: ${javaModels.size}`)

const totalMissing = results.typescript.missing.length + results.java.missing.length
const totalExtra = results.typescript.extra.length + results.java.extra.length

if (totalMissing === 0 && totalExtra === 0 && typescriptModels.size > 0 && javaModels.size > 0) {
    console.log('\nSUCCESS: All models are properly generated!')
} else {
    if (totalMissing > 0) {
        console.log(`\n${totalMissing} missing model(s) found`)
    }
    if (totalExtra > 0) {
        console.log(`\n${totalExtra} extra/intermediate model(s) found`)
    }
    if (typescriptModels.size === 0 || javaModels.size === 0) {
        console.log('\nSome generators may not have run successfully')
    }
}

if (totalExtra > 0 && !verbose) {
    console.log('\nTIP: Use --verbose flag to see extra/intermediate models')
}

// Exit with error code if there are missing models
if (hasErrors) {
    console.log('\nTIP: Add model as a constant to the post processing script if type alias or an empty model')
    process.exit(1)
}

process.exit(0)
