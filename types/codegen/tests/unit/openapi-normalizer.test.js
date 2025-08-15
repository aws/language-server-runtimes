#!/usr/bin/env node

// OpenAPI Normalizer Tests for OpenAPI Code Generation
//
// To inspect generated output files, run with:
//   KEEP_TEST_OUTPUT=1 npm run test:unit
//
// Files will be preserved in: tests/fixtures/openapi-normalizer/temp-generated/

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

describe('OpenAPI Normalizer Tests', function () {
    this.timeout(30000) // Increase timeout to 30 seconds for code generation
    const testDir = path.join(__dirname, '../fixtures/openapi-normalizer')
    const tempOutputDir = path.join(testDir, 'temp-generated')
    const allOfSchemaPath = path.join(testDir, 'allof-schema.json')

    before(() => {
        createTestDirectory(testDir)

        // Create a schema that uses allOf to test REF_AS_PARENT_IN_ALLOF
        const allOfSchema = createBaseSchema({
            BaseModel: {
                type: 'object',
                required: ['id'],
                properties: {
                    id: {
                        type: 'string',
                        description: 'Base identifier',
                    },
                },
            },
            TestModel: {
                allOf: [
                    { $ref: '#/components/schemas/BaseModel' },
                    {
                        type: 'object',
                        required: ['name'],
                        properties: {
                            name: {
                                type: 'string',
                                description: 'Display name',
                            },
                        },
                    },
                ],
            },
        })

        // Write test schema
        fs.writeFileSync(allOfSchemaPath, JSON.stringify(allOfSchema, null, 2))
    })

    after(() => {
        cleanupTestFiles(testDir)
    })

    // Note: We don't clean up between tests since each test generates its own code

    it('REF_AS_PARENT_IN_ALLOF normalizer works correctly', () => {
        // Generate code using helper function
        try {
            generateCodeWithConfig(allOfSchemaPath, testDir, tempOutputDir)
        } catch (error) {
            console.error('Generation failed for REF_AS_PARENT_IN_ALLOF test:', error.message)
            throw error
        }

        // Read the configuration to check if REF_AS_PARENT_IN_ALLOF is enabled
        const originalConfigPath = path.join(__dirname, '../../openapitools.json')
        const originalConfig = JSON.parse(fs.readFileSync(originalConfigPath, 'utf8'))

        const tsNormalizer = originalConfig['generator-cli']?.generators?.typescript?.['openapi-normalizer']
        const hasRefAsParent = tsNormalizer?.REF_AS_PARENT_IN_ALLOF === true

        // Verify TypeScript generation handles allOf correctly
        const tsModelPath = path.join(tempOutputDir, 'typescript/src/models/index.ts')
        assert.strictEqual(fs.existsSync(tsModelPath), true)

        const tsContent = fs.readFileSync(tsModelPath, 'utf8')

        if (hasRefAsParent) {
            // With REF_AS_PARENT_IN_ALLOF: true, TestModel should extend BaseModel
            assert(tsContent.includes('interface BaseModel'))
            assert(tsContent.includes('interface TestModel extends BaseModel'))

            // BaseModel should have its own properties
            assert(tsContent.includes('id: string'))

            // TestModel should only have its additional properties (not duplicated base properties)
            assert(tsContent.includes('name: string'))

            // TestModel should NOT duplicate the id property from BaseModel
            const testModelSection = tsContent.split('interface TestModel extends BaseModel')[1]
            if (testModelSection) {
                assert(!testModelSection.split('interface')[0].includes('id: string'))
            }
        } else {
            // Without REF_AS_PARENT_IN_ALLOF, properties should be flattened
            assert(tsContent.includes('interface TestModel'))
            assert(tsContent.includes('id: string'))
            assert(tsContent.includes('name: string'))
            // Should not have inheritance
            assert(!tsContent.includes('extends BaseModel'))
        }
    })

    it('Java flattens allOf schemas into single record (no inheritance)', () => {
        // Generate code using helper function
        try {
            generateCodeWithConfig(allOfSchemaPath, testDir, tempOutputDir)
        } catch (error) {
            console.error('Generation failed for Java allOf flattening test:', error.message)
            throw error
        }

        // Verify Java generation handles allOf correctly
        const javaModelPath = path.join(
            tempOutputDir,
            'java/src/main/java/org/openapitools/client/model/TestModel.java'
        )
        assert.strictEqual(fs.existsSync(javaModelPath), true)

        const javaContent = fs.readFileSync(javaModelPath, 'utf8')

        // Verify it's still using records from custom templates
        assert(javaContent.includes('public record TestModel'))
        assert(!javaContent.includes('public class TestModel'))

        // Java records don't support inheritance, so allOf should always flatten all properties
        // regardless of REF_AS_PARENT_IN_ALLOF setting
        assert(javaContent.includes('String id')) // From BaseModel
        assert(javaContent.includes('String name')) // From TestModel

        // Should not have separate BaseModel record (Java flattens allOf)
        const javaModelDir = path.join(tempOutputDir, 'java/src/main/java/org/openapitools/client/model')
        const javaFiles = fs.readdirSync(javaModelDir).filter(f => f.endsWith('.java'))
        assert.deepStrictEqual(javaFiles, ['TestModel.java']) // Only TestModel, no BaseModel

        // Verify both properties are in the same record with proper annotations
        assert(javaContent.includes('@JsonProperty("id")'))
        assert(javaContent.includes('@JsonProperty("name")'))
        assert(javaContent.includes('@Nonnull String id'))
        assert(javaContent.includes('@Nonnull String name'))
    })
})
