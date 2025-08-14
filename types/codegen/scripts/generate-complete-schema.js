#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

// Pre-generation script for all generators
// Combines all schema files in the schema directory and creates complete-schema.json with OpenAPI wrapper

const schemaDir = path.join(__dirname, '../schema')
const completeSchemaPath = path.join(__dirname, '../schema/complete-schema.json')
const openapiConfigPath = path.join(__dirname, '../openapitools.json')

// Validate required directories and files exist
if (!fs.existsSync(schemaDir)) {
    console.error('Error: schema directory not found')
    process.exit(1)
}

if (!fs.existsSync(openapiConfigPath)) {
    console.error('Error: openapitools.json file not found')
    process.exit(1)
}

// get version from openapitools.json
function getVersionFromConfig() {
    try {
        const configContent = fs.readFileSync(openapiConfigPath, 'utf8')
        const config = JSON.parse(configContent)

        const typescriptGenerator = config['generator-cli']?.generators?.typescript
        const npmVersion = typescriptGenerator?.additionalProperties?.npmVersion

        if (!npmVersion) {
            console.warn('Warning: npmVersion not found in typescript generator config, using default "0.0.1"')
            return '0.0.1'
        }

        return npmVersion
    } catch (error) {
        console.error('Error reading openapitools.json:', error.message)
        console.warn('Using default version "0.0.1"')
        return '0.0.1'
    }
}

// get the version dynamically
const version = getVersionFromConfig()

// prepend new file with OpenAPI header structure
const openApiHeader = {
    openapi: '3.0.0',
    info: {
        title: 'Chat Types',
        version: version,
        description: 'Chat Types Definitions for FLARE',
    },
    paths: {},
    components: {
        schemas: {
            // this will be populated with the actual schemas
        },
    },
}

// Process all JSON files in the schema directory
function processSchemaFiles() {
    const allSchemas = {}
    const processedFiles = []
    const skippedFiles = []
    const errors = []

    try {
        const files = fs.readdirSync(schemaDir)

        // Filter for JSON files, excluding complete-schema.json
        const jsonFiles = files.filter(file => file.endsWith('.json') && file !== 'complete-schema.json')

        if (jsonFiles.length === 0) {
            console.error('Error: No JSON schema files found in schema directory')
            process.exit(1)
        }

        // Process each JSON file
        for (const file of jsonFiles) {
            const filePath = path.join(schemaDir, file)

            try {
                const fileContent = fs.readFileSync(filePath, 'utf8')

                // Validate file is not empty
                if (!fileContent.trim()) {
                    console.warn(`Warning: Skipping empty file ${file}`)
                    skippedFiles.push({ file, reason: 'empty file' })
                    continue
                }

                const parsedContent = JSON.parse(fileContent)

                // Extract schemas from the file
                let fileSchemas
                if (parsedContent.components?.schemas) {
                    // If it has OpenAPI wrapper, extract the schemas
                    fileSchemas = parsedContent.components.schemas
                } else if (parsedContent && typeof parsedContent === 'object') {
                    // If it's raw schemas, use content directly
                    fileSchemas = parsedContent
                } else {
                    console.warn(`Warning: Skipping ${file} - no valid schema structure found`)
                    skippedFiles.push({ file, reason: 'no valid schema structure' })
                    continue
                }

                // Validate that we have actual schemas
                if (!fileSchemas || typeof fileSchemas !== 'object' || Object.keys(fileSchemas).length === 0) {
                    console.warn(`Warning: Skipping ${file} - no schemas found`)
                    skippedFiles.push({ file, reason: 'no schemas found' })
                    continue
                }

                // Merge schemas into the combined object with conflict detection
                const fileSchemaKeys = Object.keys(fileSchemas)
                const conflicts = []

                // Check for naming conflicts
                for (const schemaName of fileSchemaKeys) {
                    if (allSchemas[schemaName]) {
                        conflicts.push(schemaName)
                    }
                }

                if (conflicts.length > 0) {
                    console.warn(
                        `Warning: Schema name conflicts in ${file}: ${conflicts.join(', ')} (will overwrite previous definitions)`
                    )
                }

                // Merge the schemas
                Object.assign(allSchemas, fileSchemas)
                processedFiles.push(file)
                console.log(`Processed ${fileSchemaKeys.length} schemas from ${file}`)
            } catch (error) {
                // Handle different types of errors more gracefully
                if (error instanceof SyntaxError) {
                    errors.push({ file, error: 'Invalid JSON', details: error.message })
                } else if (error.code === 'ENOENT') {
                    errors.push({ file, error: 'File not found', details: error.message })
                } else if (error.code === 'EACCES') {
                    errors.push({ file, error: 'Permission denied', details: error.message })
                } else {
                    errors.push({ file, error: 'Processing error', details: error.message })
                }

                // Continue processing other files instead of exiting
                skippedFiles.push({ file, reason: `error: ${error.message}` })
            }
        }

        // Summary of processing results
        if (skippedFiles.length > 0) {
            console.warn(`\nSkipped ${skippedFiles.length} files:`)
            skippedFiles.forEach(({ file, reason }) => {
                console.warn(`  - ${file}: ${reason}`)
            })
        }

        if (errors.length > 0) {
            console.error(`\nEncountered ${errors.length} errors during processing:`)
            errors.forEach(({ file, error, details }) => {
                console.error(`  - ${file}: ${error} (${details})`)
            })
        }

        return { schemas: allSchemas, files: processedFiles, skipped: skippedFiles.length, errors: errors.length }
    } catch (error) {
        console.error('Error reading schema directory:', error.message)
        process.exit(1)
    }
}

// Process all schema files
const { schemas, files, skipped, errors } = processSchemaFiles()

if (!schemas || Object.keys(schemas).length === 0) {
    console.error('Error: No schemas found in any files')
    process.exit(1)
}

// create the complete schema with header + schemas + footer
const completeSchema = {
    ...openApiHeader,
    components: {
        schemas: schemas,
    },
}

// write full OpenAPI spec to complete-schema.json
try {
    fs.writeFileSync(completeSchemaPath, JSON.stringify(completeSchema, null, 4))

    console.log(`\nComplete OpenAPI structure created in complete-schema.json (version: ${version})`)
    console.log(`Combined ${Object.keys(schemas).length} total schemas from ${files.length} files: ${files.join(', ')}`)

    if (skipped > 0 || errors > 0) {
        console.log(`Processing summary: ${files.length} successful, ${skipped} skipped, ${errors} errors`)
    }
} catch (error) {
    console.error('Error writing complete-schema.json:', error.message)
    process.exit(1)
}
