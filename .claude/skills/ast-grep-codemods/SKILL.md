---
name: ast-grep-codemods
description: ast-grep NAPI reference and patterns for the packages/codemods project. Use when working with @ast-grep/napi in schema-migration codemods or packages/codemods/ directory, writing AST queries, or debugging tree-sitter node matching.
user-invocable: false
---

# ast-grep NAPI Reference for Codemods

This skill provides the ast-grep rule system reference used by `packages/codemods/src/schema-migration/`.
The codemods use `@ast-grep/napi` (the Node.js binding) to parse and transform TypeScript/JavaScript ASTs.

## Parsing

```typescript
import { parse, Lang, type SgNode } from '@ast-grep/napi';

const ast = parse(Lang.TypeScript, sourceCode);
const root: SgNode = ast.root();
```

## SgNode Core Methods

### Search

```typescript
// Find first match (returns null if not found)
node.find(matcher: string | number | NapiConfig): SgNode | null

// Find all matches
node.findAll(matcher: string | number | NapiConfig): SgNode[]

// Boolean checks
node.matches(pattern: string): boolean
node.inside(pattern: string): boolean
node.has(pattern: string): boolean
```

### Traversal

```typescript
node.children(): SgNode[]           // Direct children
node.parent(): SgNode | null        // Parent node
node.child(nth: number): SgNode | null
node.field(name: string): SgNode | null  // Named field (e.g., 'name', 'body', 'source')
node.ancestors(): SgNode[]
node.next(): SgNode | null          // Next sibling
node.nextAll(): SgNode[]
node.prev(): SgNode | null          // Previous sibling
node.prevAll(): SgNode[]
```

### Inspection

```typescript
node.kind(): string       // Tree-sitter node type (e.g., 'field_definition', 'class_body')
node.text(): string       // Full source text
node.isLeaf(): boolean
node.isNamed(): boolean
node.range(): Range       // { start: Pos, end: Pos } (0-indexed)
```

### Meta-variable Extraction

```typescript
// After finding with a pattern containing $VAR or $$$VARS:
node.getMatch('VAR'): SgNode | null
node.getMultipleMatches('VARS'): SgNode[]
```

### Code Editing

```typescript
const edit = node.replace('newCode');  // Returns Edit object
const newSource = root.commitEdits([edit1, edit2]);  // Apply batch edits
```

## NapiConfig Rule Object

The `find` and `findAll` methods accept a `NapiConfig` object for complex queries:

```typescript
node.findAll({
  rule: { /* rule object */ },
  constraints?: { /* meta-variable constraints */ },
})
```

## Rule Types

### 1. Atomic Rules

Match individual nodes by their properties.

#### `kind` - Match by tree-sitter node type

```typescript
// Find all class declarations
root.findAll({ rule: { kind: 'class_declaration' } })

// Common TypeScript/JavaScript kinds:
// class_declaration, class_body, field_definition, method_definition,
// import_statement, identifier, property_identifier, decorator,
// call_expression, member_expression, string, template_string
```

**Gotcha:** Not all kind names are valid in all grammars. TypeScript uses `field_definition`,
some JavaScript grammars use `public_field_definition` or `class_field`. Wrap in try/catch
when iterating over multiple possible kinds.

#### `pattern` - Match by code pattern with meta-variables

```typescript
// Simple pattern
root.findAll({ rule: { pattern: 'console.log($ARG)' } })

// Pattern with context (for ambiguous syntax like class members)
root.findAll({
  rule: {
    pattern: {
      context: 'class A { $FIELD = $INIT }',
      selector: 'field_definition',
    }
  }
})
```

Meta-variables:
- `$NAME` - matches a single AST node
- `$$NAME` - matches zero or more nodes (non-greedy)
- `$$$NAME` - matches zero or more nodes (greedy)

#### `regex` - Match node text against regex

```typescript
// Match identifiers starting with underscore
root.findAll({ rule: { kind: 'identifier', regex: '^_' } })
```

### 2. Composite Rules

Combine rules with boolean logic.

#### `all` - Every rule must match (AND)

```typescript
root.findAll({
  rule: {
    all: [
      { kind: 'call_expression' },
      { pattern: '$OBJ.$METHOD($$$ARGS)' },
    ]
  }
})
```

#### `any` - At least one rule must match (OR)

```typescript
root.findAll({
  rule: {
    any: [
      { kind: 'field_definition' },
      { kind: 'public_field_definition' },
      { kind: 'class_field' },
    ]
  }
})
```

#### `not` - Negate a rule

```typescript
// Find all identifiers that aren't 'constructor'
root.findAll({
  rule: {
    kind: 'identifier',
    not: { regex: '^constructor$' },
  }
})
```

#### `matches` - Reference a utility rule by ID

```typescript
root.findAll({
  rule: { matches: 'is-ember-decorator' },
  utils: {
    'is-ember-decorator': {
      kind: 'decorator',
      has: { pattern: '@$NAME', inside: { kind: 'class_body' } },
    }
  }
})
```

### 3. Relational Rules

Filter nodes by their position relative to other nodes in the AST.

#### `inside` - Node is contained within a matching ancestor

```typescript
// Find field_definition nodes that are DIRECT children of class_body
root.findAll({
  rule: {
    kind: 'field_definition',
    inside: {
      kind: 'class_body',
      stopBy: 'neighbor',  // Only check immediate parent
    }
  }
})
```

#### `has` - Node contains a matching descendant

```typescript
// Find class declarations that have a decorator
root.findAll({
  rule: {
    kind: 'class_declaration',
    has: {
      kind: 'decorator',
      stopBy: 'neighbor',  // Only check direct children
    }
  }
})
```

#### `follows` - Node appears after a matching sibling

```typescript
// Find nodes that follow a decorator
root.findAll({
  rule: {
    kind: 'field_definition',
    follows: { kind: 'decorator' },
  }
})
```

#### `precedes` - Node appears before a matching sibling

```typescript
root.findAll({
  rule: {
    kind: 'decorator',
    precedes: { kind: 'method_definition' },
  }
})
```

### The `stopBy` Parameter (Critical)

Controls how far relational rules search. **This is the most important parameter for correct queries.**

| Value | Behavior |
|-------|----------|
| `'neighbor'` | **(Default)** Only checks one level (immediate parent for `inside`, direct children for `has`) |
| `'end'` | Searches all the way (all ancestors for `inside`, all descendants for `has`) |
| `{ rule }` | Stops when a node matching the rule is found (inclusive) |

**Common pattern: matching only direct class members**

```typescript
// WRONG: findAll with just kind searches ALL descendants recursively
classBody.findAll({ rule: { kind: 'field_definition' } })
// ^ This picks up nested properties inside object literals!

// RIGHT: Use inside rule with stopBy: 'neighbor' to match direct children only
classBody.findAll({
  rule: {
    kind: 'field_definition',
    inside: { kind: 'class_body', stopBy: 'neighbor' },
  }
})
```

### The `field` Parameter

Restricts matches to a specific named field position in the parent node.

```typescript
// Match only the KEY in a key-value pair, not values that happen to match
root.findAll({
  rule: {
    kind: 'pair',
    has: {
      field: 'key',         // Only match the 'key' field position
      regex: 'prototype',
    }
  }
})
```

Common tree-sitter fields: `name`, `body`, `source`, `key`, `value`, `left`, `right`,
`arguments`, `decorator`, `type_annotation`.

## Patterns Used in This Codebase

### Finding direct class members (not nested)

```typescript
import { NODE_KIND_CLASS_BODY, NODE_KIND_FIELD_DEFINITION, NODE_KIND_METHOD_DEFINITION } from './code-processing.js';

const DIRECT_CLASS_MEMBER = { inside: { kind: NODE_KIND_CLASS_BODY, stopBy: 'neighbor' } } as const;

// Properties - try multiple kinds since grammar varies
function findPropertyDefinitions(classBody: SgNode): SgNode[] {
  for (const nodeType of ['field_definition', 'public_field_definition', 'class_field']) {
    try {
      const props = classBody.findAll({ rule: { kind: nodeType, ...DIRECT_CLASS_MEMBER } });
      if (props.length > 0) return props;
    } catch {
      // Kind not valid in this grammar
    }
  }
  return [];
}

// Methods
function findMethodDefinitions(classBody: SgNode): SgNode[] {
  return classBody.findAll({ rule: { kind: NODE_KIND_METHOD_DEFINITION, ...DIRECT_CLASS_MEMBER } });
}
```

### Finding import statements and extracting source

```typescript
const imports = root.findAll({ rule: { kind: 'import_statement' } });
for (const imp of imports) {
  const source = imp.field('source');     // The string literal after 'from'
  const clause = imp.field('import');     // The import clause (specifiers)
  const sourcePath = source?.text();      // e.g., "'@ember-data/model'"
}
```

### Finding decorators preceding a node

```typescript
// Walk backwards through siblings collecting decorator nodes
function collectPrecedingDecorators(node: SgNode): string[] {
  const decorators: string[] = [];
  const siblings = node.parent()?.children() ?? [];
  const idx = siblings.indexOf(node);
  for (let i = idx - 1; i >= 0; i--) {
    const sib = siblings[i];
    if (!sib) continue;
    if (sib.kind() === 'decorator') decorators.unshift(sib.text());
    else if (sib.text().trim() !== '') break;
  }
  return decorators;
}
```

### Finding a class that extends a specific base

```typescript
// Find class with heritage clause
const classDecl = root.find({ rule: { kind: 'class_declaration' } });
const heritage = classDecl?.find({ rule: { kind: 'class_heritage' } });
const identifiers = heritage?.findAll({ rule: { kind: 'identifier' } }) ?? [];
const baseClasses = identifiers.map((id) => id.text());
```

### Pattern matching with context for class fields

```typescript
// Match decorated class fields like: @attr('string') name;
root.findAll({
  rule: {
    pattern: {
      context: 'class A { @$DECORATOR $FIELD = $VALUE }',
      selector: 'field_definition',
    }
  }
})
```

## Debugging Tips

1. **Use `node.kind()` liberally** - When a rule isn't matching, log the actual kinds: `classBody.children().map(c => c.kind())`
2. **Try/catch around `findAll` with rules** - Invalid kind names throw at runtime, not compile time
3. **Check `stopBy` behavior** - The default `'neighbor'` only searches one level. Use `'end'` for recursive search.
4. **Use the ast-grep playground** - https://ast-grep.github.io/playground.html to test rules interactively
