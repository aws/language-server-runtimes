# OpenAPI Code Generation

This directory contains scripts and configuration for generating TypeScript and Java types from OpenAPI schema definitions using OpenAPI Generator CLI.

## Overview

The code generation process combines multiple schema files into a complete OpenAPI specification and generates both TypeScript and Java types with custom templates, import mappings, and validation.

**Running `npm run generate` will automatically generate:**
- **TypeScript types** in `generated/typescript/` - Complete type definitions
- **Java model classes** in `generated/java/` - Java model classes with custom templates

## Directory Structure

```
types/codegen/
├── schema/                           # Schema definition files
│   ├── chatTypes.json               # Main schema definitions
│   └── complete-schema.json         # Generated complete OpenAPI spec
├── scripts/                         # Generation and validation scripts
│   ├── generate-complete-schema.js  # Combines all schema files
│   ├── post-typescript.js          # TypeScript post-processing
│   ├── post-test.js                 # Model validation script
│   ├── clean.js                     # Cleanup utilities
│   └── constants.ts                 # Constants to inject
├── custom-templates/                # Custom Mustache templates
│   ├── typescript/                  # TypeScript-specific templates
│   └── java/                        # Java-specific templates
├── generated/                       # Generated output files
│   ├── typescript/                  # TypeScript types
│   └── java/                        # Java model classes
├── tests/                           # Test schemas and validation
└── openapitools.json               # Generator configuration
```

## Process Flow

### 1. Schema Generation (`generate-complete-schema.js`)
- Scans all JSON files in the `schema/` directory
- Combines schemas from multiple files into a single collection
- Creates `complete-schema.json` with complete OpenAPI 3.0.0 structure:
  - Dynamic version from `openapitools.json` TypeScript generator config
  - Combined schemas from all source files
  - Proper OpenAPI structure and formatting
  - Conflict detection and warnings for duplicate schema names

### 2. Code Generation (OpenAPI Generator CLI)
- **TypeScript Generator**: Generates complete TypeScript types
  - Uses `typescript-fetch` generator with custom templates
  - Generates interfaces, types, and enum unions
- **Java Generator**: Generates Java model classes
  - Uses custom templates for modern Java features
  - Targets Java 21 with modern features
  - Supports model filtering via `global-property.models` when needed

### 3. Post-Processing (`post-typescript.js`)
- Processes import mappings from `openapitools.json`
- Adds external library imports (e.g., `vscode-languageserver-types`)
- Injects constants from `constants.ts`
- Modifies interface visibility (e.g., makes `PartialResultParams` internal)

### 4. Validation (`post-test.js`)
- Validates generated models against schema definitions
- Checks for missing models (should be generated but aren't)
- Reports extra/intermediate models (generated but not in schema)
- Supports verbose mode for detailed analysis
- Respects `global-property.models` filters for accurate validation

## Available Scripts

```bash
# Generate complete schema from individual files
npm run generate-schema

# Full generation pipeline (schema + generation + post-processing + validation)
npm run generate

# Generation without post-processing
npm run generate:no-post

# Validate generated models (errors only)
npm run test
npm run validate

# Validate with detailed output (includes extra/intermediate models)
npm run test:verbose
```

## Configuration

### Generator Configuration (`openapitools.json`)

The main configuration file contains detailed settings for both TypeScript and Java generators:

#### TypeScript Generator Settings
- **Generator**: `typescript-fetch` - Generates TypeScript types
- **ES6 Support**: `supportsES6: true` - Modern JavaScript features
- **Property Naming**: `camelCase` for both models and enums
- **String Enums**: `stringEnums: true` - Generates union types instead of numeric enums
- **Runtime Checks**: `withoutRuntimeChecks: true` - Lighter generated code
- **Additional Properties**: `nullSafeAdditionalProps: false` - Flexible object handling
- **OpenAPI Normalizer**: `REF_AS_PARENT_IN_ALLOF: true` - Better inheritance handling

#### Java Generator Settings
- **Generator**: `java` - Standard Java model classes
- **Java Version**: Source and target compatibility set to Java 21
- **OneOf Interfaces**: `useOneOfInterfaces: true` - Union type handling using interfaces
- **Date Library**: `java8` - Uses modern Java time APIs
- **Validation**: Bean validation disabled for lighter models
- **Legacy Behavior**: `legacyDiscriminatorBehavior: false` - Modern discriminator handling

### Model Filtering (Optional)

Java generator supports selective model generation via `global-property.models` when needed:
```json
"global-property": {
  "models": "IconType:ContextCommandGroup:QuickActionCommand:ContextCommand"
}
```

When specified, this generates only the listed models. If omitted, all models are generated.

### Import Mappings

Both generators support external type imports, but handle them differently:

#### Java Import Mappings
```json
"importMappings": {
  "Position": "org.eclipse.lsp4j.Position",
  "Range": "org.eclipse.lsp4j.Range", 
  "TextDocumentIdentifier": "org.eclipse.lsp4j.TextDocumentIdentifier"
}
```

#### TypeScript Import Mappings
Handled by `post-typescript.js` for more flexible processing:
```json
"importMappings": {
  "Position": "vscode-languageserver-types",
  "Range": "vscode-languageserver-types",
  "TextDocumentIdentifier": "vscode-languageserver-types"
}
```

### Type Mappings

Custom type mappings for language-specific types:

#### Java Type Mappings
```json
"typeMappings": {
  "IconType": "String",
  "Uint8Array": "byte[]"
}
```

#### TypeScript Type Mappings
```json
"typeMappings": {
  "Date": "Date"
}
```

### Reserved Words

Handle language-specific reserved words:
```json
"reservedWordsMappings": {
  "export": "export"
}
```

## Output

### TypeScript Output (`generated/typescript/`)
- Complete type definitions for all schema models
- Proper import statements for external dependencies
- Injected constants and utilities
- NPM package ready for distribution

### Java Output (`generated/java/`)
- Java model classes with custom templates
- Java 21 compatible code
- LSP4J integration for language server types
- Maven/Gradle compatible structure

## Validation Results

The validation script provides detailed reporting:
- **Schema models**: Total models defined in schema files
- **TypeScript models**: Generated models (includes intermediate models)
- **Java models**: Generated models (filtered subset based on configuration)
- **Missing models**: Models that should be generated but aren't
- **Extra models**: Intermediate models created by OpenAPI generator

## Testing

The `tests/` directory contains comprehensive tests for the OpenAPI code generation pipeline. These tests validate that your `openapitools.json` configuration and custom templates work correctly.

### Running Tests

```bash
# Run all tests
npm run test:unit

# Inspect generated files for debugging
KEEP_TEST_OUTPUT=1 npm run test:unit

# Run specific test suites
npm run test:unit -- --testPathPattern="field-addition"
npm run test:unit -- --testPathPattern="openapi-normalizer"
```

### Test Coverage

- **Field Addition Tests (8 tests)**: Validates TypeScript interfaces and Java records for optional/required fields
- **Configuration Tests**: Ensures camelCase naming, ES6 exports, Java 21 compatibility, and custom templates  
- **OpenAPI Normalizer Tests (2 tests)**: Tests inheritance vs property flattening based on configuration

The tests use your actual `openapitools.json` configuration (not mocked) to ensure production validation and regression protection.

**Key Features:**
- Real configuration testing using your actual `openapitools.json`
- Custom template validation (Java records vs classes)
- Language-specific behavior testing (TypeScript inheritance, Java flattening)
- Configuration-aware tests that adapt to your settings

See [tests/README.md](tests/README.md) for detailed test documentation.

## Development Workflow

1. **Add/modify schemas** in `schema/chatTypes.json`
2. **Run generation**: `npm run generate`
3. **Review validation**: Check for missing or extra models
4. **Test integration**: Use generated types in your application
5. **Run tests**: `npm run test:unit` to validate configuration and templates
6. **Commit changes**: Only commit schema files, not generated files