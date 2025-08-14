# Code Generation

This directory contains OpenAPI code generation configuration and post-processing scripts for language server runtime types.

## Structure

- `schema/` - OpenAPI schema definitions
- `custom-templates/` - Custom Mustache templates for code generation sorted by langauage
- `generated/` - Generated output directory where TypeScript and Java types will be located post generation
- `post-generate.js` - Post-processing script
- `openapitools.json` - OpenAPI Generator configuration

## Configuration

### openapitools.json

OpenAPI Generator configuration defining code generation settings for TypeScript and Java:

**Common Configuration:**
- `generatorName` - Specifies the generator type (typescript-fetch, java)
- `disabled` - Allows selective turning off of generators during development. By default, all generators run. New languages/input specs can be added with their own customization
- `output` - Target directory for generated code
- `inputSpec` - Source OpenAPI schema file
- `templateDir` - Points to custom Mustache templates that overwrite canonical templates from [OpenAPI Generator templates](https://openapi-generator.tech/docs/templating)

**TypeScript Configuration:**
- `additionalProperties` - Language-specific options from the [typescript-fetch generator](https://openapi-generator.tech/docs/generators/typescript-fetch/). Notable settings:
  - `stringEnums` - Generates string enums instead of numeric
  - `withoutRuntimeChecks` - Reduces unnecessary generated code by removing runtime validation
  - `supportsES6` - Enables ES6 features
  - `modelPropertyNaming`/`enumPropertyNaming` - Sets camelCase naming conventions
- `global-property` - [Global properties](https://openapi-generator.tech/docs/globals) for debugging and selective model generation (alternative to .openapi-generator-ignore file)
- `openapi-normalizer` - [Normalizers](https://openapi-generator.tech/docs/customization/#openapi-normalizer) shape input before generation:
  - `REF_AS_PARENT_IN_ALLOF` - Enables traditional inheritance (extends) via allOf instead of including all parent fields in child, resulting in cleaner code
- `reservedWordsMappings` - Overcomes generator renaming of reserved words. Forces `export` field to remain `export` instead of being renamed to `_export`
- `typeMappings` - Overcomes generator quirks where `Date` gets converted to `string` or `ModelDate`. Forces generator to use proper `Date` type

**Java Configuration:** TODO TODO TODO
- `additionalProperties` - Java-specific settings including Java 21 compatibility, validation options, and serialization settings
- `global-property.models` - Specifies exact models to generate (CursorPosition, FileParams, etc.) for selective generation
- `importMappings` - Maps external types to LSP4J classes for seamless integration with Language Server Protocol

## Post-Processing

The `post-generate.js` script runs after OpenAPI code generation to customize the generated TypeScript types:

- **Adds constants**: Adds protocol method constants from `constants.ts` to the generated index file. This is due to a limitation of the OpenAPI generator which ignores type alias constants in generation.
- **Modifies interfaces**: Changes `PartialResultParams` from exported to internal interface. This is because `PartialResultParams` is only used internally and causes conflicts with VS Code LSP protocol type of the same name if exported. This interface is not exported in the current `chat.ts` either.   
- **Extensible**: Other post-processing steps should be added here.

This ensures the generated types integrate properly with the language server runtime while maintaining clean separation between generated and hand-written code.