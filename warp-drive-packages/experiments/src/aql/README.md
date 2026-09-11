<p align="center">
  <img
    class="project-logo"
    src="../../logos/warp-drive-logo-dark.svg#gh-light-mode-only"
    alt="WarpDrive"
    width="200px"
    title="WarpDrive" />
  <img
    class="project-logo"
    src="../../logos/warp-drive-logo-gold.svg#gh-dark-mode-only"
    alt="WarpDrive"
    width="200px"
    title="WarpDrive" />
</p>

<h3 align="center">AQL — Abstract Query Language</h3>

A terse `.aql` syntax for authoring JSON:API queries against the (proposed)
[`QUERY` extension](https://jsonapi.org/format/1.2/#extension-rules), compiling down to that
extension's persisted-query envelope (`q:id` / `q:type` / `q:search`).

> ⚠️ ***Experimental*** ⚠️
>
> This is a parser and a companion VS Code syntax highlighter for a query language, not a request
> integration. Nothing here wires the compiled query into `@warp-drive/json-api`'s request
> builders or fetch handlers yet — `parseAQL` only turns `.aql` text into the JSON body a server
> implementing the `QUERY` extension would expect.

## Install

```sh
pnpm add @warp-drive/experiments
```

```ts
import { parseAQL, type Schemas } from '@warp-drive/experiments/aql';
```

## At a Glance

Say we wanted to make the following query against the `/api/companies` endpoint

```json
{
  "q:search": {
    "include": "ceo",
    "fields": {
      "company": ["name", "ceo"],
      "employee": ["name", "profileImage"]
    },
    "filter": {
      "$size": "null,string"
    },
    "page": {
      "size": 10
    }
  },
  "q:defaults": {
    "filter": { "size": "large" }
  }
}
```

To define this query we create a `.aql` file

```aql
# /companies-query.aql
# This is a Comment
QUERY company { # we wrap our query definition in QUERY {} and specify the primary resource type
  data { # the graph of data we want back goes in data
    name
    ceo { # relationships with {} after them will be included
      name
      # if ceo is an employee and something else
      # also declares fields for an employee, the
      # field sets will be merged
      profileImage
    }
  }
  filter {
    # @arg declares a variable for use by persisted queries.
    # The argument type is inferred from the initializer value
    # unless overridden by supplying a type list in parens.
    # The initializer is kept as the value a caller falls back
    # to when a persisted query is invoked without a `q:args[size]`.
    @arg(null,string) size = "large"
  }
  # statements may be ended by a `;`, `#`, `}` or newline
  page { size = 10 }
}
```

Without comments for terseness

```aql
QUERY company {
  data {
    name
    ceo { name; profileImage }
  }
  filter {
    @arg(null,string) size = "large"
  }
  page { size = 10 }
}
```

## Grammar

- `QUERY <type> { <sections> }` — every file has exactly one `QUERY` block naming the primary
  resource type being queried. The type must be present in the `Schemas` map passed to `parseAQL`.
- `data { <selection> }` — the graph of fields (and, transitively, relationships) to select.
  - A bare field name (e.g. `name`) selects an attribute.
  - A relationship field followed by `{ <selection> }` (e.g. `ceo { name }`) both selects and
    includes that relationship, recursively. Only fields whose schema `kind` is `'resource'` or
    `'collection'` may be followed by `{}`; anything else throws.
  - If the same related type is reached through more than one path, the field sets requested for
    it are merged into a single `fields[type]` entry.
- `filter { <assignments> }` / `page { <assignments> }` — flat key/value assignments compiled onto
  `q:search.filter` / `q:search.page`. Each assignment is either:
  - `key = value` — a literal value (string, number, boolean, or `null`), baked directly into the
    compiled query.
  - `@arg[(type[,type...])] key = value` — declares `key` as a persisted-query **variable**: the
    compiled query gets `"$key": "type,type"` (per the `QUERY` extension's `$`-prefixed variable
    convention) instead of a literal, and `value` is recorded as its default under a sibling
    `q:defaults.<section>.<key>` so a caller invoking the query without a matching `q:args[key]`
    still gets a sensible result. Servers that don't recognize `q:defaults` can ignore it safely —
    it lives outside the `q:search` object the base extension defines.
  - `filter`/`page` in AQL only describe filtering the **primary result set** — the base `QUERY`
    extension does not yet define how to disambiguate a filter that should apply to the primary
    result set from one that applies to a related collection nested within it, so AQL does not
    attempt to guess at that syntax on its own.
- `#` starts a line comment, terminated by the next newline.
- Statements are terminated by a newline, `;`, or the `}` that closes their enclosing block —
  whichever comes first. Whitespace between tokens is otherwise insignificant.
- String literals use double quotes and support `\"` to escape a literal quote.

## API

```ts
import { parseAQL, type Schemas, type Schema, type FieldSchema } from '@warp-drive/experiments/aql';

const schemas: Schemas = new Map([
  ['company', new Map<string, FieldSchema>([
    ['name', { type: null, name: 'name', kind: 'attribute' }],
    ['ceo', { type: 'employee', name: 'ceo', kind: 'resource' }],
  ])],
  ['employee', new Map<string, FieldSchema>([
    ['name', { type: null, name: 'name', kind: 'attribute' }],
    ['profileImage', { type: null, name: 'profileImage', kind: 'attribute' }],
  ])],
]);

const query = await parseAQL(aqlSourceText, schemas);
```

`parseAQL` throws a descriptive `Error` (naming the offending token and its position in the source
text) for unknown fields, non-relationship fields used with a `{}` selection, unterminated string
literals, or malformed `@arg` declarations.

## VS Code Syntax Highlighting

[`./vscode`](./vscode) is a standalone (unpublished) VS Code extension providing syntax
highlighting for standalone `.aql` files and for `` aql`...` `` tagged template literals embedded
in `.js`/`.ts`/`.jsx`/`.tsx`/`.svelte` source. See its own README for how to build and install it
locally.
