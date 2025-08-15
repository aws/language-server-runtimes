# OpenAPI Code Generation Tests

Comprehensive test suite validating OpenAPI code generation pipeline using your actual `openapitools.json` configuration and custom templates.

## Test Structure

```
tests/
├── utils/test-helpers.js              # Shared utilities
└── unit/
    ├── field-addition.test.js         # Field scenarios & configuration validation
    └── openapi-normalizer.test.js     # OpenAPI normalizer features
```

## Running Tests

```bash
# Normal test run
npm run test:unit

# Inspect generated files
KEEP_TEST_OUTPUT=1 npm run test:unit

# Run specific tests
npm run test:unit -- --testPathPattern="field-addition"
```

## Test Coverage

### Field Addition Tests (8 tests)
Validates field addition scenarios and configuration compliance:

- **Field Testing**: Base schema, optional fields (`field?: string`), required fields (`field: string`)
- **Configuration Validation**: 
  - TypeScript camelCase naming (`displayName` vs `display_name`)
  - ES6 exports (`export interface` vs `module.exports`)
  - Java 21 compatibility (no deprecated features)
  - Model filtering (`global-property models=TestModel`)
  - Custom templates (Java records vs classes)

### OpenAPI Normalizer Tests (2 tests)
Validates OpenAPI normalizer features with language-specific behavior:

- **REF_AS_PARENT_IN_ALLOF**: Configuration-aware testing
  - TypeScript: Tests inheritance (`extends BaseModel`) vs flattening
  - Java: Always flattens properties (records don't support inheritance)
- **Custom Template Compatibility**: Ensures normalizer works with custom templates

## Key Features

### Real Configuration Testing
- Uses your actual `openapitools.json` (not mocked)
- Tests adapt behavior based on your configuration
- Validates custom templates are actually used

### Language-Specific Validation
- TypeScript: Interfaces, optional fields, ES6 exports, inheritance
- Java: Records, annotations (`@Nonnull`, `@Nullable`), property flattening

### Robust Design
- Shared utilities prevent code duplication
- Configuration-aware tests adapt to changes
- Clean test isolation with conditional cleanup
- Clear failure points with specific test names

## Generated Validation Examples

**TypeScript**:
```typescript
export interface TestModel {
    id: string;
    displayName: string;        // camelCase naming
    optionalField?: string;     // Optional field syntax
}
```

**Java**:
```java
public record TestModel(        // Custom template (record vs class)
    @JsonProperty("id") @Nonnull String id,
    @JsonProperty("displayName") @Nonnull String displayName
) {}
```

## Adding New Tests

**Extend existing files** for simple checks fitting current themes.

**Create new files** for complex features deserving dedicated test suites:

```javascript
const { generateCodeWithConfig, createTestDirectory } = require('../utils/test-helpers')

describe('New Feature Tests', () => {
    // Use shared utilities for consistency
})
```

## Benefits

- **Production validation**: Tests your actual build pipeline
- **Regression protection**: Catches configuration and template breaks  
- **Maintainable**: Shared utilities, configuration-aware testing
- **Developer-friendly**: Clear test names, easy debugging with `KEEP_TEST_OUTPUT`