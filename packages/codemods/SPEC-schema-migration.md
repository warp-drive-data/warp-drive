# Schema Migration Codemod Specification

## Overview
The schema-migration codemod is a comprehensive transformation tool designed to migrate EmberData applications from the classic Model/Mixin pattern to the modern WarpDrive schema-based pattern. This migration enables better type safety, improved performance, and alignment with WarpDrive's modern architecture.

## Purpose
Transform legacy EmberData models and mixins into WarpDrive's schema-based system, which separates data definitions (schemas), type definitions (interfaces), and behavioral extensions into distinct, composable artifacts.

## Core Concepts

### Input Patterns
1. **EmberData Models**: Classes extending `Model` from `@ember-data/model` with decorators like `@attr`, `@belongsTo`, `@hasMany`
2. **Ember Mixins**: Objects created with `Mixin.create()` that define shared attributes and behaviors
3. **Intermediate Models**: Base model classes that other models extend from (configured via `intermediateModelPaths`)

### Output Artifacts
1. **Schema Files** (`.schema.{js,ts}`): Data structure definitions using `LegacyResourceSchema` or `LegacyTrait`
   - Contains only import statements and the schema export
   - No utility functions, helper methods, or behavioral code
   - Utility functions remain in extension files where they belong
2. **Type Files** (`.schema.types.ts`): TypeScript interfaces for type safety
3. **Extension Files**: Behavioral code (methods, getters, setters, computed properties, utility functions)
4. **Trait Files**: Converted mixins that define reusable field sets

## Architecture

### Main Components

#### 1. migrate-to-schema.ts
- **Purpose**: Orchestrates the entire migration process
- **Key Functions**:
  - `runMigration()`: Main entry point for batch processing
  - `analyzeModelMixinUsage()`: Determines which mixins are used by models (directly or transitively)
  - `extractPolymorphicMixinReferences()`: Finds polymorphic relationships that reference mixins
  - `processIntermediateModelsToTraits()`: Handles intermediate model conversion in dependency order

#### 2. model-to-schema.ts
- **Purpose**: Transforms EmberData models into schema artifacts
- **Key Functions**:
  - `transform()`: Main transformation function for individual files
  - `toArtifacts()`: Generates multiple artifacts from a single model
  - `analyzeModelFile()`: Extracts model metadata and relationships
  - `generateRegularModelArtifacts()`: Creates schema, type, and extension artifacts
  - `generateSchemaCode()`: Generates clean schema files with only imports and schema export
  - `extractImportsOnly()`: Extracts import statements, excluding utility functions and comments

#### 3. mixin-to-schema.ts
- **Purpose**: Transforms Ember mixins into trait artifacts
- **Key Functions**:
  - `transform()`: Main transformation function for mixins
  - `toArtifacts()`: Generates trait and extension artifacts
  - `extractTraitFields()`: Identifies schema-relevant fields in mixins

#### 4. utils/ast-utils.ts
- **Purpose**: Provides AST parsing and manipulation utilities
- **Key Functions**:
  - AST navigation and analysis
  - Type extraction and conversion
  - Import management and resolution
  - Code generation helpers

## Configuration Options

### Core Settings
- `emberDataImportSource`: Source for EmberData imports (default: `@ember-data/model`)
- `intermediateModelPaths`: Array of intermediate model import paths to convert to traits
- `modelSourceDir`: Directory containing model files (default: `./app/models`)
- `mixinSourceDir`: Directory containing mixin files (default: `./app/mixins`)

### Output Directories
- `resourcesDir`: Output for resource schemas (default: `./app/data/resources`)
- `traitsDir`: Output for trait schemas (default: `./app/data/traits`)
- `extensionsDir`: Output for extensions (default: `./app/data/extensions`)

### Import Paths
- `resourcesImport`: Import path for generated resources
- `traitsImport`: Import path for generated traits
- `extensionsImport`: Import path for generated extensions
- `modelImportSource`: Base import path for existing models
- `mixinImportSource`: Base import path for existing mixins

### External Sources
- `additionalModelSources`: Array of `{pattern, dir}` for external model sources
- `additionalMixinSources`: Array of `{pattern, dir}` for external mixin sources
- `generateExternalResources`: Generate resources for external models (default: false)

### Processing Options
- `dryRun`: Preview changes without writing files
- `verbose`: Enable detailed logging
- `debug`: Enable debug output
- `modelsOnly`: Process only model files
- `mixinsOnly`: Process only mixin files
- `skipProcessed`: Skip already processed files

### Type System
- `typeMapping`: Custom type mappings (Record or JSON file path)
- `mirror`: Use @warp-drive-mirror imports

### Post-Processing
- `runPostTransformLinting`: Run ESLint after transformation
- `runPostTransformPrettier`: Run Prettier after transformation
- `eslintConfigPath`: Custom ESLint config path
- `prettierConfigPath`: Custom Prettier config path

## Transformation Process

### Phase 1: Discovery
1. Scan configured directories for model and mixin files
2. Parse files using AST to identify valid targets
3. Build dependency graph for mixins and models
4. Determine which mixins are "model-connected" (used by models directly or transitively)

### Phase 2: Analysis
1. For each model/mixin file:
   - Extract schema fields (@attr, @belongsTo, @hasMany)
   - Identify extension properties (methods, getters, computed)
   - Detect mixin usage and inheritance chains
   - Extract type information from TypeScript/JSDoc

### Phase 3: Generation
1. Process intermediate models first (in dependency order)
2. Generate artifacts for each file:
   - Schema artifact with field definitions
   - Type interface for TypeScript support
   - Extension module for behaviors
3. Transform imports to reference new artifact locations

### Phase 4: Output
1. Create necessary directory structure
2. Write generated artifacts to configured locations
3. Preserve file extensions (.js/.ts) from source files

## Field Transformations

### Attributes
```javascript
// Input
@attr('string') name;
@attr('date', { defaultValue: () => new Date() }) createdAt;

// Output Schema
fields: [
  { name: 'name', type: 'string', kind: 'attribute' },
  { name: 'createdAt', type: 'date', kind: 'attribute', options: { defaultValue: () => new Date() } }
]

// Output Type
interface User {
  name: string | null;
  createdAt: Date;
}
```

### Relationships
```javascript
// Input
@belongsTo('company', { async: false, inverse: 'users' }) company;
@hasMany('post', { async: true }) posts;

// Output Schema
fields: [
  { name: 'company', type: 'company', kind: 'belongsTo', options: { async: false, inverse: 'users' } },
  { name: 'posts', type: 'post', kind: 'hasMany', options: { async: true } }
]

// Output Type
interface User {
  company: Company;
  posts: AsyncHasMany<Post>;
}
```

## Mixin Usage Analysis

### Direct Usage
Models that explicitly import and use mixins via `.extend(MixinName)`

### Transitive Usage
Mixins that import other mixins, creating dependency chains

### Polymorphic References
Models with polymorphic relationships where the type matches a mixin name:
```javascript
@belongsTo('shareable', { polymorphic: true }) owner;
// If 'shareable' is a mixin, it's considered "connected"
```

## Extension Generation

### What Goes in Extensions
- Instance methods
- Getters and setters
- Computed properties
- Class methods (as static)
- Lifecycle hooks
- Utility functions (with updated relative imports)

### Relative Import Handling
When utility functions and helper code are moved from model files to extension files, relative import paths are automatically updated to reference their original package sources:

**Directory Import Mapping (Recommended)**:
Configure `directoryImportMapping` to map source directories to their import paths:
```json
{
  "directoryImportMapping": {
    "client-core/package/src": "@auditboard/client-core",
    "shared-lib/src": "@company/shared-lib"
  }
}
```

**Transformation Rules**:
- `./filename` imports become `{mappedImportPath}/filename` (same directory resolution)
- `../path/filename` imports are resolved relative to the mapped directory structure
- Absolute imports remain unchanged
- Falls back to `modelImportSource` for `./` imports if no directory mapping matches
- Falls back to relative path adjustment if no mapping is found

**Examples**:
- Source file: `client-core/package/src/models/translatable.js`
- Original import: `import type Translation from './translation'`
- Transformed: `import type Translation from '@auditboard/client-core/models/translation'`

- Source file: `client-core/package/src/models/translatable.js`
- Original import: `import type { TranslatableModel } from '../types/models/translatable-model'`
- Transformed: `import type { TranslatableModel } from '@auditboard/client-core/types/models/translatable-model'`

This preserves the original import structure while normalizing relative imports to point to their original packages when files are relocated from `/models/` to `/data/extensions/`. The transformation works for any type of import (models, utilities, types, etc.) and maintains the original file path structure within the target package.

### Extension Structure
```javascript
// Input model with behavior
export default class User extends Model {
  @attr('string') firstName;
  @attr('string') lastName;

  get fullName() {
    return `${this.firstName} ${this.lastName}`;
  }

  async sendEmail(subject) {
    // implementation
  }
}

// Output extension
export default {
  fullName: computed('firstName', 'lastName', function() {
    return `${this.firstName} ${this.lastName}`;
  }),

  async sendEmail(subject) {
    // implementation
  }
}
```

## Intermediate Model Processing

### Purpose
Convert base model classes (that other models extend) into traits for composition

### Process
1. Identify all intermediate model paths from configuration
2. Build dependency graph (which intermediate models extend others)
3. Process in topological order (dependencies first)
4. Generate trait artifacts that can be referenced by regular models
5. Write artifacts immediately so subsequent processing can reference them

### Example
```javascript
// Input: intermediate-models/base-model.js
export default class BaseModel extends Model {
  @attr('date') createdAt;
  @attr('date') updatedAt;
}

// Output: traits/base-model.schema.js
export const baseModelTrait = {
  fields: [
    { name: 'createdAt', type: 'date', kind: 'attribute' },
    { name: 'updatedAt', type: 'date', kind: 'attribute' }
  ]
};
```

## Import Resolution

### Pattern Matching
The codemod supports wildcard patterns for mapping import paths:
```json
{
  "additionalModelSources": [
    { "pattern": "@external/*/models/*", "dir": "./node_modules/@external/*/app/models/*" }
  ]
}
```

### Resolution Order
1. Check explicit pattern matches in additionalSources
2. Try relative path resolution
3. Fall back to local source directories

## Error Handling

### Validation
- Files must be parseable as valid JavaScript/TypeScript
- Models must extend from recognized base classes
- Mixins must use Mixin.create() pattern

### Recovery
- Skip files with parse errors
- Continue processing other files
- Log errors with file paths for debugging

### Reporting
- Summary statistics: processed, skipped, errors
- Verbose mode shows detailed transformation steps
- Debug mode outputs AST analysis details

## Usage Examples

### Basic Migration
```bash
npx @ember-data/codemods schema-migrate \
  --resources-dir ./app/data/resources \
  --traits-dir ./app/data/traits \
  --extensions-dir ./app/data/extensions
```

### With Configuration File
```bash
npx @ember-data/codemods schema-migrate --config ./schema-migration.json
```

### Dry Run with Verbose Output
```bash
npx @ember-data/codemods schema-migrate --dry-run --verbose
```

### Process Only Models
```bash
npx @ember-data/codemods schema-migrate --models-only
```

## Output Directory Structure
```
app/
  data/
    resources/        # Resource schemas and types
      user.schema.js
      user.schema.types.ts
      company.schema.js
      company.schema.types.ts
    traits/          # Trait schemas from mixins
      shareable.schema.js
      shareable.schema.types.ts
    extensions/      # Behavioral code
      user.js
      company.js
```

## Testing Considerations

The codemod includes comprehensive test coverage for:
- AST parsing and manipulation
- Field extraction and type conversion
- Mixin usage analysis
- Import resolution
- Artifact generation
- Edge cases and error conditions

## Future Enhancements

Potential improvements identified:
1. Support for GJS/GTS files
2. Automatic import optimization
3. Schema validation post-transformation
4. Incremental migration support
5. Custom transformation plugins
6. Better handling of complex computed properties
7. Support for additional decorator patterns