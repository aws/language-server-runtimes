const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

/**
 * Shared test utilities for OpenAPI code generation tests
 */

/**
 * Generate code using openapitools.json config with test-specific paths
 * @param {string} schemaPath - Path to the OpenAPI schema file
 * @param {string} testDir - Test directory for output
 * @param {string} tempOutputDir - Temporary output directory
 * @param {Object} options - Optional configuration overrides
 * @param {string} options.javaModels - Models to generate for Java (default: 'TestModel')
 */
function generateCodeWithConfig(schemaPath, testDir, tempOutputDir, options = {}) {
    const originalConfigPath = path.join(__dirname, '../../openapitools.json')
    const testConfigPath = path.join(testDir, 'openapitools.json')

    try {
        // Read the original openapitools.json
        const originalConfig = JSON.parse(fs.readFileSync(originalConfigPath, 'utf8'))

        // Modify the config to use our test schema and output directories
        const codegenDir = path.join(__dirname, '../..')
        const testConfig = {
            ...originalConfig,
            'generator-cli': {
                ...originalConfig['generator-cli'],
                generators: {
                    typescript: {
                        ...originalConfig['generator-cli'].generators.typescript,
                        inputSpec: schemaPath,
                        output: path.join(tempOutputDir, 'typescript'),
                        templateDir: path.join(codegenDir, 'custom-templates/typescript'),
                    },
                    java: {
                        ...originalConfig['generator-cli'].generators.java,
                        inputSpec: schemaPath,
                        output: path.join(tempOutputDir, 'java'),
                        templateDir: path.join(codegenDir, 'custom-templates/java'),
                        'global-property': {
                            ...originalConfig['generator-cli'].generators.java['global-property'],
                            models: options.javaModels || 'TestModel',
                        },
                    },
                },
            },
        }

        // Write the test config
        fs.writeFileSync(testConfigPath, JSON.stringify(testConfig, null, 2))

        // Run the same command as your package.json: "openapi-generator-cli generate"
        execSync('npx openapi-generator-cli generate', {
            stdio: 'pipe', // Suppress output for cleaner test runs
            cwd: testDir,
        })
    } catch (error) {
        console.error('Generation failed:', error.message)
        throw error
    }
}

/**
 * Create a test directory structure
 * @param {string} testDir - Base test directory
 */
function createTestDirectory(testDir) {
    if (!fs.existsSync(testDir)) {
        fs.mkdirSync(testDir, { recursive: true })
    }
}

/**
 * Clean up test files (respects KEEP_TEST_OUTPUT env var)
 * @param {string} testDir - Directory to clean up
 */
function cleanupTestFiles(testDir) {
    if (!process.env.KEEP_TEST_OUTPUT && fs.existsSync(testDir)) {
        fs.rmSync(testDir, { recursive: true, force: true })
    }
}

/**
 * Clean up temp output directory (respects KEEP_TEST_OUTPUT env var)
 * @param {string} tempOutputDir - Directory to clean up
 */
function cleanupTempOutput(tempOutputDir) {
    if (!process.env.KEEP_TEST_OUTPUT && fs.existsSync(tempOutputDir)) {
        fs.rmSync(tempOutputDir, { recursive: true, force: true })
    }
}

/**
 * Create a basic OpenAPI schema with the given models
 * @param {Object} models - Schema models to include
 * @returns {Object} Complete OpenAPI schema
 */
function createBaseSchema(models) {
    return {
        openapi: '3.0.0',
        info: {
            title: 'Test Schema',
            version: '1.0.0',
        },
        paths: {},
        components: {
            schemas: models,
        },
    }
}

module.exports = {
    generateCodeWithConfig,
    createTestDirectory,
    cleanupTestFiles,
    cleanupTempOutput,
    createBaseSchema,
}
