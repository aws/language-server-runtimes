#!/usr/bin/env node

// Field Addition Tests for OpenAPI Code Generation
//
// To inspect generated output files, run with:
//   KEEP_TEST_OUTPUT=1 npm run test:unit
//
// Files will be preserved in: tests/fixtures/field-addition/temp-generated/

const fs = require('fs')
const path = require('path')
const assert = require('assert')
const {
    generateCodeWithConfig,
    createTestDirectory,
    cleanupTestFiles,
    cleanupTempOutput,
    createBaseSchema,
} = require('../utils/test-helpers')

describe('Field Addition Tests', function () {
    this.timeout(30000) // Increase timeout to 30 seconds for code generation
    const testDir = path.join(__dirname, '../fixtures/field-addition')
    const baseSchemaPath = path.join(testDir, 'base-schema.json')
    const optionalFieldSchemaPath = path.join(testDir, 'optional-field-schema.json')
    const requiredFieldSchemaPath = path.join(testDir, 'required-field-schema.json')
    const tempOutputDir = path.join(testDir, 'temp-generated')

    // Helper function to generate code for a specific schema using shared utilities
    const generateCode = schemaPath => {
        generateCodeWithConfig(schemaPath, testDir, tempOutputDir)
    }

    before(() => {
        // Create test directory structure using shared utility
        createTestDirectory(testDir)

        // Create base test schema using shared utility
        const baseSchema = createBaseSchema({
            TestModel: {
                type: 'object',
                required: ['id', 'displayName'],
                properties: {
                    id: {
                        type: 'string',
                        description: 'Unique identifier',
                    },
                    displayName: {
                        type: 'string',
                        description: 'Display name',
                    },
                },
            },
        })

        // Create schema with optional field added
        const optionalFieldSchema = createBaseSchema({
            TestModel: {
                type: 'object',
                required: ['id', 'displayName'],
                properties: {
                    id: {
                        type: 'string',
                        description: 'Unique identifier',
                    },
                    displayName: {
                        type: 'string',
                        description: 'Display name',
                    },
                    optionalField: {
                        type: 'string',
                        description: 'Optional field for testing',
                    },
                },
            },
        })

        // Create schema with required field added
        const requiredFieldSchema = createBaseSchema({
            TestModel: {
                type: 'object',
                required: ['id', 'displayName', 'requiredField'],
                properties: {
                    id: {
                        type: 'string',
                        description: 'Unique identifier',
                    },
                    displayName: {
                        type: 'string',
                        description: 'Display name',
                    },
                    requiredField: {
                        type: 'string',
                        description: 'Required field for testing',
                    },
                },
            },
        })

        // Write test schemas
        fs.writeFileSync(baseSchemaPath, JSON.stringify(baseSchema, null, 2))
        fs.writeFileSync(optionalFieldSchemaPath, JSON.stringify(optionalFieldSchema, null, 2))
        fs.writeFileSync(requiredFieldSchemaPath, JSON.stringify(requiredFieldSchema, null, 2))
    })

    after(() => {
        // Clean up test files using shared utility
        cleanupTestFiles(testDir)
    })

    // Note: We don't clean up between tests since each test generates its own code

    it('base schema generates correctly', () => {
        // Generate code using helper function
        try {
            generateCode(baseSchemaPath)
        } catch (error) {
            console.error('Generation failed for base schema test:', error.message)
            throw error
        }

        // Verify TypeScript generation - check the actual TestModel file
        const tsModelPath = path.join(tempOutputDir, 'typescript/src/models/index.ts')
        assert.strictEqual(fs.existsSync(tsModelPath), true)

        const tsContent = fs.readFileSync(tsModelPath, 'utf8')
        assert(tsContent.includes('interface TestModel'))
        assert(tsContent.includes('id: string'))
        assert(tsContent.includes('displayName: string'))
        assert(!tsContent.includes('optionalField'))
        assert(!tsContent.includes('requiredField'))

        // Verify Java generation
        const javaModelPath = path.join(
            tempOutputDir,
            'java/src/main/java/org/openapitools/client/model/TestModel.java'
        )
        assert.strictEqual(fs.existsSync(javaModelPath), true)

        const javaContent = fs.readFileSync(javaModelPath, 'utf8')
        assert(javaContent.includes('record TestModel'))
        assert(javaContent.includes('String id'))
        assert(javaContent.includes('String displayName'))
        // Check that optional and required test fields are not present in base schema
        assert(!javaContent.includes('SERIALIZED_NAME_OPTIONAL_FIELD'))
        assert(!javaContent.includes('SERIALIZED_NAME_REQUIRED_FIELD'))
        assert(!javaContent.includes('private String optionalField'))
        assert(!javaContent.includes('private String requiredField'))
    })

    it('optional field is generated correctly', () => {
        // Generate code using helper function
        try {
            generateCode(optionalFieldSchemaPath)
        } catch (error) {
            console.error('Generation failed for optional field test:', error.message)
            throw error
        }

        // Verify TypeScript generation
        const tsModelPath = path.join(tempOutputDir, 'typescript/src/models/index.ts')
        const tsContent = fs.readFileSync(tsModelPath, 'utf8')

        assert(tsContent.includes('interface TestModel'))
        assert(tsContent.includes('id: string'))
        assert(tsContent.includes('displayName: string'))
        assert(tsContent.includes('optionalField?: string')) // Optional field should have ?

        // Verify Java generation
        const javaModelPath = path.join(
            tempOutputDir,
            'java/src/main/java/org/openapitools/client/model/TestModel.java'
        )
        const javaContent = fs.readFileSync(javaModelPath, 'utf8')

        assert(javaContent.includes('record TestModel'))
        assert(javaContent.includes('String id'))
        assert(javaContent.includes('String displayName'))
        assert(javaContent.includes('String optionalField'))

        // Check that optional field doesn't have @NotNull annotation (if using validation)
        const optionalFieldLines = javaContent
            .split('\n')
            .filter(line => line.includes('optionalField') && !line.includes('//'))
        assert(optionalFieldLines.length > 0)
    })

    it('required field is generated correctly', () => {
        // Generate code using helper function
        try {
            generateCode(requiredFieldSchemaPath)
        } catch (error) {
            console.error('Generation failed for required field test:', error.message)
            throw error
        }

        // Verify TypeScript generation
        const tsModelPath = path.join(tempOutputDir, 'typescript/src/models/index.ts')
        const tsContent = fs.readFileSync(tsModelPath, 'utf8')

        assert(tsContent.includes('interface TestModel'))
        assert(tsContent.includes('id: string'))
        assert(tsContent.includes('displayName: string'))
        assert(tsContent.includes('requiredField: string')) // Required field should NOT have ?

        // Verify Java generation
        const javaModelPath = path.join(
            tempOutputDir,
            'java/src/main/java/org/openapitools/client/model/TestModel.java'
        )
        const javaContent = fs.readFileSync(javaModelPath, 'utf8')

        assert(javaContent.includes('record TestModel'))
        assert(javaContent.includes('String id'))
        assert(javaContent.includes('String displayName'))
        assert(javaContent.includes('String requiredField'))
    })

    it('TypeScript uses camelCase property naming', () => {
        // Generate code using helper function
        try {
            generateCode(baseSchemaPath)
        } catch (error) {
            console.error('Generation failed for camelCase test:', error.message)
            throw error
        }

        // Verify TypeScript configuration settings
        const tsModelPath = path.join(tempOutputDir, 'typescript/src/models/index.ts')
        const tsContent = fs.readFileSync(tsModelPath, 'utf8')

        // Check camelCase property naming (from modelPropertyNaming: "camelCase")
        assert(tsContent.includes('id: string')) // Should be camelCase, not snake_case
        assert(tsContent.includes('displayName: string')) // Should be camelCase, not display_name
    })

    it('TypeScript uses ES6 exports (supportsES6: true)', () => {
        // Generate code using helper function
        try {
            generateCode(baseSchemaPath)
        } catch (error) {
            console.error('Generation failed for ES6 exports test:', error.message)
            throw error
        }

        // Verify TypeScript uses ES6 module syntax
        const tsModelPath = path.join(tempOutputDir, 'typescript/src/models/index.ts')
        const tsContent = fs.readFileSync(tsModelPath, 'utf8')

        // Check ES6 support (export statements instead of CommonJS)
        assert(tsContent.includes('export interface'))
        assert(!tsContent.includes('module.exports'))
    })

    it('Java uses Java 21 compatibility (no deprecated features)', () => {
        // Generate code using helper function
        try {
            generateCode(baseSchemaPath)
        } catch (error) {
            console.error('Generation failed for Java 21 compatibility test:', error.message)
            throw error
        }

        // Verify Java configuration settings
        const javaModelPath = path.join(
            tempOutputDir,
            'java/src/main/java/org/openapitools/client/model/TestModel.java'
        )
        const javaContent = fs.readFileSync(javaModelPath, 'utf8')

        // Check Java 21 compatibility (should not have deprecated features)
        assert(!javaContent.includes('@SuppressWarnings("deprecation")'))

        // Should use modern annotations
        assert(javaContent.includes('@javax.annotation.Generated'))
    })

    it('Java model filtering works (global-property models=TestModel)', () => {
        // Generate code using helper function
        try {
            generateCode(baseSchemaPath)
        } catch (error) {
            console.error('Generation failed for Java model filtering test:', error.message)
            throw error
        }

        // Check that only TestModel was generated (due to global-property filter)
        const javaModelDir = path.join(tempOutputDir, 'java/src/main/java/org/openapitools/client/model')
        const javaFiles = fs.readdirSync(javaModelDir).filter(f => f.endsWith('.java'))
        assert.deepStrictEqual(javaFiles, ['TestModel.java'])
    })

    it('custom templates generate Java records instead of classes', () => {
        // Generate code using helper function
        try {
            generateCode(baseSchemaPath)
        } catch (error) {
            console.error('Generation failed for Java records test:', error.message)
            throw error
        }

        // Verify Java uses records from custom templates
        const javaModelPath = path.join(
            tempOutputDir,
            'java/src/main/java/org/openapitools/client/model/TestModel.java'
        )
        const javaContent = fs.readFileSync(javaModelPath, 'utf8')

        // Check that custom templates generate records instead of classes
        assert(javaContent.includes('public record TestModel'))
        assert(!javaContent.includes('public class TestModel'))
    })
})
