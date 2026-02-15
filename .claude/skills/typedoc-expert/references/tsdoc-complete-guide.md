# Complete TSDoc and TypeDoc Guide for WarpDrive

This document contains comprehensive details about TSDoc syntax and TypeDoc configuration used in WarpDrive.

## TSDoc Comment Syntax in Detail

### Valid Documentation Comments

Only double-star comments are compiled:

```ts
/**
 * This IS a documentation comment
 * - Will be compiled into docs
 * - Must start with /**
 * - Every line should have *
 */
```

```ts
/*
 * This is NOT a documentation comment
 * - Will be ignored by TypeDoc
 * - Only single star
 */
```

### Why Every Line Needs an Asterisk

Without `*` on every line, the parser can misinterpret content:

**Problem Example:**
```ts
/**
 Example without asterisks

 @decorator might be parsed as @decorator tag
 Some text might be truncated

 @public
*/
```

**Correct:**
```ts
/**
 * Example with asterisks
 *
 * @decorator is just text in a code example
 * Nothing gets truncated
 *
 * @public
 */
```

The asterisk pattern tells the parser "this is still part of the comment" and prevents false tag detection.

## Symbol Documentation Placement

### Classes

```ts
/**
 * Represents a user in the system.
 *
 * @since 2.0.0
 * @public
 */
class User {
  /**
   * The user's display name
   *
   * @since 2.0.0
   */
  name: string;

  /**
   * Creates a new user instance
   *
   * @param name - The user's display name
   * @since 2.0.0
   */
  constructor(name: string) {
    this.name = name;
  }

  /**
   * Updates the user's name
   *
   * @param newName - The new name to set
   * @since 2.0.0
   */
  updateName(newName: string): void {
    this.name = newName;
  }
}
```

### Interfaces and Types

```ts
/**
 * Configuration options for the Store
 *
 * @since 1.0.0
 * @public
 */
interface StoreOptions {
  /**
   * The adapter to use for network requests
   */
  adapter?: Adapter;

  /**
   * Whether to enable debug mode
   */
  debug?: boolean;
}

/**
 * Represents an identifier that can be a string or symbol
 *
 * @since 1.5.0
 * @public
 */
type Identifier = string | symbol;
```

### Functions

```ts
/**
 * Normalizes a resource identifier
 *
 * Converts various identifier formats to a canonical form
 * used throughout the system.
 *
 * @param id - The identifier to normalize
 * @param type - The resource type
 * @return The normalized identifier
 * @since 1.8.0
 * @public
 */
function normalizeId(id: string | number, type: string): string {
  return `${type}:${id}`;
}
```

### Variables and Constants

```ts
/**
 * The current version of WarpDrive
 *
 * @since 1.0.0
 * @public
 */
export const VERSION = '4.0.0';

/**
 * Symbol used to mark legacy records
 *
 * @since 2.0.0
 * @internal
 */
export const LEGACY_MARKER = Symbol('legacy');
```

## Tags Reference

### @since (Required for Public APIs)

**Required for all non-type public APIs.** Indicates the version when API was introduced:

```ts
/**
 * Fetches a record by ID
 *
 * @since 2.5.0
 * @public
 */
function findRecord() {}
```

### @internal (Required for Private APIs)

Excludes from public documentation. Use for private utilities:

```ts
/**
 * Internal helper for cache management
 *
 * Not part of public API surface.
 *
 * @internal
 */
function clearInternalCache() {}
```

### @module

Defines module-level documentation. Place at top of entry point file.


Preferred: Use `@mergeModuleWith` plus an `index.md` file for richer module documentation:
```ts
/**
 * @module
 * @mergeModuleWith <project>
 */
```

Alternatively, for simple module descriptions only:
```ts
/**
 * Core types and symbols for WarpDrive packages.
 *
 * This package provides the foundational type definitions
 * used across all WarpDrive packages.
 *
 * @module
 */
export * from './types';
```

### @hideconstructor

Hides constructor from documentation. Use when users don't directly instantiate:

```ts
/**
 * Manages reactive resources
 *
 * Instances are created by the framework, not by users directly.
 *
 * @hideconstructor
 * @since 3.0.0
 */
class ReactiveResource {
  constructor() {
    // Hidden from docs
  }
}
```

### @param

Describes function/method parameters. **Don't include type** (TypeScript provides it):

```ts
/**
 * Merges two objects
 *
 * @param target - The object to merge into
 * @param source - The object to merge from
 * @param deep - Whether to perform deep merge
 */
function merge(target: object, source: object, deep: boolean = false) {}
```

### @return / @returns

Describes return value. **Don't include type**:

```ts
/**
 * Computes the sum of an array
 *
 * @param numbers - Array of numbers to sum
 * @return The total sum of all numbers
 */
function sum(numbers: number[]): number {}
```

### @typeParam

Describes generic type parameters:

```ts
/**
 * A container for values of type T
 *
 * @typeParam T - The type of value stored
 * @since 3.0.0
 */
class Container<T> {}
```

### @deprecated

Marks APIs as deprecated:

```ts
/**
 * Old method for fetching data
 *
 * @deprecated Use `findRecord()` instead
 * @since 1.0.0
 */
function fetchData() {}
```

Always provide an alternative when deprecating.

### @example

Provides usage examples:

```ts
/**
 * Formats a date string
 *
 * @param date - The date to format
 * @return Formatted date string
 *
 * @example
 * ```ts
 * formatDate(new Date()) // "2024-01-15"
 * ```
 *
 * @since 2.0.0
 */
function formatDate(date: Date): string {}
```

## No Longer Needed: Auto-Associated Tags

TypeDoc automatically determines these from TypeScript:
- `@module` (except for module overviews)
- `@class`
- `@method`
- `@static`
- `@property`
- `@interface`
- `@type`

**Don't use these tags** - they're redundant and may cause issues.

## Markdown Features

### Headers

```ts
/**
 * ## Overview
 *
 * This section provides an overview.
 *
 * ### Details
 *
 * More specific details here.
 */
```

### Code Blocks

Use language tags for syntax highlighting:

```ts
/**
 * Example usage:
 *
 * ```ts
 * const store = new Store();
 * await store.findRecord('user', '1');
 * ```
 */
```

### Lists

```ts
/**
 * Supported formats:
 * - JSON:API
 * - REST
 * - GraphQL
 *
 * Configuration steps:
 * 1. Install the package
 * 2. Configure the adapter
 * 3. Initialize the store
 */
```

### Links

**Cross-references (TypeDoc links):**
```ts
/**
 * See {@link Store} for the main interface.
 * See {@link Store.findRecord} for the method.
 * Check {@link Store#adapter} for the property.
 */
```

**External links (standard markdown):**
```ts
/**
 * External link: [TypeDoc Documentation](https://typedoc.org/)
 */
```

### VitePress Extensions

#### Code Groups

Show multiple versions/languages:

```ts
/**
 * ::: code-group
 *
 * ```ts [TypeScript]
 * const user: User = { id: '1', name: 'Alice' };
 * ```
 *
 * ```js [JavaScript]
 * const user = { id: '1', name: 'Alice' };
 * ```
 *
 * :::
 */
```

#### Callouts

```ts
/**
 * ::: tip
 * Use the cache for better performance
 * :::
 *
 * ::: warning
 * This method is deprecated
 * :::
 *
 * ::: danger
 * Do not call this directly
 * :::
 */
```

#### Line Highlighting

```ts
/**
 * ```ts {2,4-6}
 * function example() {
 *   const x = 1;  // highlighted
 *   const y = 2;
 *   const z = 3;  // highlighted
 *   const a = 4;  // highlighted
 *   const b = 5;  // highlighted
 * }
 * ```
 */
```

## Module Documentation with index.md

In addition to TSDoc comments, add `index.md` files in package `src/` directories for additional module documentation:

**Location:** `packages/your-package/src/index.md`

**Purpose:** Provides landing page content for the package's API docs. Gets integrated into TypeDoc output.

**Format:** Standard markdown (not TSDoc)

**Example:**
```markdown
# @warp-drive/active-record

Active Record pattern implementation for WarpDrive.

## Overview

This package provides...

## Installation

\`\`\`bash
npm install @warp-drive/active-record
\`\`\`

## Quick Start

\`\`\`ts
import { ActiveRecord } from '@warp-drive/active-record';
\`\`\`
```

## Common Patterns

### Documenting Generic Types

```ts
/**
 * A container for values of type T
 *
 * @typeParam T - The type of value stored
 * @since 3.0.0
 */
class Container<T> {
  /**
   * Stores a value
   *
   * @param value - The value to store
   */
  store(value: T): void {}
}
```

### Documenting Async Methods

```ts
/**
 * Fetches a record from the API
 *
 * @param type - The resource type
 * @param id - The resource ID
 * @return Promise resolving to the record
 * @since 2.0.0
 */
async function findRecord(type: string, id: string): Promise<Record> {}
```

### Documenting Overloaded Functions

Document the implementation signature with all overloads:

```ts
function process(value: string): string;
function process(value: number): number;

/**
 * Processes a value and returns it
 *
 * @param value - The value to process (string or number)
 * @return The processed value
 * @since 1.0.0
 */
function process(value: string | number): string | number {
  return value;
}
```

### Documenting Decorators

```ts
/**
 * Marks a property as an attribute
 *
 * Attributes are synchronized with the backend and
 * tracked for changes.
 *
 * @param target - The class prototype
 * @param propertyKey - The property name
 * @since 1.0.0
 */
export function attr(target: any, propertyKey: string) {}
```

## Troubleshooting

### Documentation Not Appearing

**Symptom:** Doc comment exists but doesn't show in generated docs

**Possible Causes:**
1. Using `/*` instead of `/**`
2. Has `@internal` tag
3. Symbol not exported from public entrypoint
4. Missing asterisks on some lines
5. TypeDoc configuration excludes it

**Solution:**
- Verify `/**` syntax
- Remove `@internal` if should be public
- Check export path
- Add `*` to every line
- Rebuild with `pnpm typedoc`

### Truncated Documentation

**Symptom:** Documentation cuts off unexpectedly

**Cause:** Missing asterisks on lines, causing parser to stop

**Solution:**
```ts
// Bad - missing asterisks
/**
 * First line
 Second line - gets truncated!
 */

// Good - all lines have asterisks
/**
 * First line
 * Second line - works correctly!
 */
```

### Tag Not Working

**Symptom:** `@decorator` in code example becomes a tag

**Cause:** Missing asterisks on code block lines

**Solution:**
```ts
/**
 * Example:
 * ```ts
 * class User {
 *   @attr name;
 * }
 * ```
 */
```

Every line, including code blocks, needs the asterisk.

## Best Practices Summary

✅ **DO:**
- Use `/**` (double-star) for all doc comments
- Put `*` on every line (including blank lines and code blocks)
- Place comments directly above symbols
- Add `@since` for public APIs
- Use `@internal` for private APIs
- Use `@hideconstructor` for non-user-facing constructors
- Use markdown for formatting
- Include practical examples
- Describe the "why" not just "what"
- Preview before committing

❌ **DON'T:**
- Use `/*` (single-star) for documentation
- Skip asterisks on lines
- Add redundant tags (@class, @method, @static, @property, @interface)
- Include types in @param/@return (TypeScript provides them)
- Document internal implementation details in public APIs
- Forget to rebuild docs after changes
