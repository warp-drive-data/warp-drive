---
title: Documenting APIs
---

# Writing Documentation

There are two sources of documentation in this repository:

- [Guides](../../index.md) - markdown files that are compiled into the manual for the website
- inline code comments and types - from which the API Docs are compiled

Both are previewable by following the instructions in the [Docs Viewer](https://github.com/warp-drive-data/warp-drive/blob/main/docs-viewer/README.md)

Great documentation requires both guides and docs. We encourage updating any associated guides affected by code changes as you make them, and writing new guides when appropriate.


## API Documentation Infra Overview

API Documentation is generated from [TSDoc](https://tsdoc.org/) comments in the source code
compiled with [TypeDoc](https://typedoc.org/) and transformed for [Vitepress](https://vitepress.dev/) using [typedoc-plugin-markdown](https://www.typedoc-plugin-markdown.org/plugins/vitepress)

TSDoc syntax is similar to YUIDoc and JSDoc but there are occassional nuances where it becomes best to know the underlying grammar is TSDoc
and parser is TypeDoc.

TypeDoc is configured to follow our public package entrypoints to
auto-discover documentation. It documents everything reachable, public or private including properties and methods that have no associated
code docs. It uses typescript to understand the source-code and builds documentation from the combination of Type signatures and TSDoc comments.

This is great, but it means that its very easy to leak private APIs
into the docs. Use `/** @internal */` on things that should not be
put into the public docs.

While API Documentation lives with the source-code, the code itself plays no part in the documentation
that is generated: everything is compiled from comments alone.

The below guide will walk through best practices for writing doc comments, important
nuances and syntaxes to know, as well as how to test and preview the doc comments.

<br>

---

<br>

## Documentation Syntax

<br>

### What are Doc Comments

Only `**` comments are compiled as potential documentation, e.g.

```ts
/**
 * This is a potential documentation block
 */
```

Where as single star comment blocks are not considered documentation

```ts
/*
 * This is not a potential documentation block
 */
```

### Where to put Doc Comments

Documentation comments should be placed directly above the symbol they are documenting.

```ts
/**
 * Documents the class
 */
class Foo {
  /**
   * Documents the method
   */
  bar() {}

  /**
   * Documents the property
   */
  bar = '1';
}

/**
 * Documents the interface
 */
interface Foo {
  /**
   * Documents the key
   */
  bar: string;
}

/**
 * Documents the type
 */
type Foo = {
  /**
   * Documents the key
   */
  bar: string;
}

/**
 * Documents the variable
 */
const Foo = '1';

/**
 * Documents the function
 */
function foo() {}
```

<br>

### Ignored Doc Comments

When compiling the API documentation, comments using the `@internal` tag will be ignored:

For example, the below doc comment would be ignored. This is useful for documenting code
for fellow developers that shouldn't be exposed to end consumers.

```ts
/**
 * This is a private utility for updating the state
 * of a relationship.
 * 
 * @internal
 */
function somethingInside() {}
```

<br>

### Auto Association

TSDoc and TypeDoc will automatically place the documentation for a method inside
the class it is on, the class inside the package it is in and at the export path
it is exported from. Because it knows our entrypoints and our types, we don't need
to tell it much! It already knows when something is an interface vs a class, when
it extends something else, or that it implements a specific signature.

This means you no longer need to add redundant tags like `@module` `@class` `@method`
`@static` and `@property`.

### Doc Comments can be Markdown

Doc comments can contain most any valid markdown syntax, most markdown-valid html,
and can utilize code-highlighting via language prefix on a code block comment.

For instance

```ts
/**
 * ## Overview
 * 
 * Some details
 * 
 * ### An Example
 * 
 * ```ts
 * new Store();
 * ```
 * 
 * @public
 */
```

Additionally, the markdown parser in use by our docs understands documentation groups,
and [many other features](https://vitepress.dev/guide/markdown).

This means we can do code examples that toggle between files or formats.

```ts
/**
 * ::: code-group
 * 
 * ```ts [example.ts]
 * export function numberFromStrong(str: string): number {}
 * ```
 * 
 * ```js [example.js]
 * export function numberFromStrong(str) {}
 * ```
 * 
 * :::
 */
```

Highlighting, focus management and code groups are three features that combine
to enable crafting powerful examples in the documentation.

<br>

### Doc Comments should start every line with a `*`

While technically doc comments only need to start with `/**`, providing a `*` for
every line with matching indentation ensures correct parsing of all tags and documentation.

Without this, some decorators in code examples may be incorrectly parsed as documentation tags,
and some documentation may be unexpectedly truncated.

**Good**

```ts
/**
 * ## Overview
 * 
 * Some details
 * 
 * ### An Example
 * 
 * ```ts
 * class User extends Model {
 *   @attr name;
 * }
 * ```
 * 
 * @public
 */
```

**Bad**

```ts
/**
 ## Overview
 
 Some details
 
 ### An Example
 
 \```ts
 class User extends Model {
   @attr name;
 }
 \```
 
 @public
*/
```

### Documenting Packages and Subpackages

To create an overview for a module path e.g. `@warp-drive/core-types` or `@warp-drive/core-types/symbol` all that is needed is a doc comment at the top of the file with the tag `@module`.

For instance, to write documentation giving an overview of `@warp-drive/core-types`,
we would do the following in `packages/core-types/src/index.ts`

```ts
/**
 * This package provides essential types and symbols used
 * by all the other WarpDrive packages.
 * 
 * @module
 */
```

<br>

### Always specify `@since` on non-type public APIs


```ts
/**
 * @since 1.13.0
 * @public
*/
```

### Use `@hideconstructor` for classes that aren't directly instantiated by users

[@hideconstructor](https://typedoc.org/documents/Tags._hideconstructor.html#hideconstructor)

```ts
/**
 * @hideconstructor
 */
class ReactiveResource {}
```

Methods are documented with `@method` and attach to the most recent class the parser has
seen.

### Don't document types in @param and @return

Because types are parsed from the typescript, `@param` and `@return` should
be used to give a meaningful description only.

```ts
/**
 * Adds two numbers
 * 
 * @param a - the first number to add
 * @param b - the second number to add
 * @return the sum of the two numbers
 */
function add(a: number, b: number): number {}
```

<br>

---

<br>

## Content Standards

<br>

### Every Public API Should Have a Usage Example

Even a minimal example dramatically shortens the time it takes for a
consumer to understand how to use an API. Every doc comment for a
`@public` export should include at least one.

```ts
/**
 * Adds two numbers
 *
 * @example
 * ```ts
 * add(1, 2); // 3
 * ```
 *
 * @param a - the first number to add
 * @param b - the second number to add
 * @return the sum of the two numbers
 * @public
 */
function add(a: number, b: number): number {}
```

### Link the First Mention of Other Public APIs

The first time a doc comment mentions another documented, public token,
that mention should be a `{@link}` to it. This turns our docs into a
web that's easy to navigate instead of a pile of disconnected pages.

```ts
/**
 * Updates the {@link User.name | User's name} with the provided
 * value.
 *
 * @public
 */
function updateUserName(user: User, name: string): void {}
```

### Link Every Member of a Union or Object-as-Enum

Union types and object-as-enum types should link each of their
members so that readers can jump directly to whichever member is
relevant to them.

```ts
/**
 * See also:
 * - {@link PendingRequest}
 * - {@link ResolvedRequest}
 * - {@link RejectedRequest}
 * - {@link CancelledRequest}
 */
export type RequestState<
  RT = unknown,
  E extends Error = Error,
> = PendingRequest | ResolvedRequest<RT> | RejectedRequest<RT, E> | CancelledRequest<RT, E>;
```

### Cross-Link Within a Class, Interface, or Object

Cross-linking between the members of the same class, interface, or
object is highly encouraged. This makes it fast and easy to navigate
around the documentation for that class/object/interface.

```ts
/**
 * Additional properties exposed on errors thrown by the
 * {@link Fetch | Fetch Handler}.
 *
 * In the case of an Abort or system/browser level issue,
 * this extends {@link DOMException}.
 *
 * Else it extends from {@link AggregateError} if the
 * response includes an array of errors, falling back
 * to {@link Error} as its base.
 */
export interface FetchError extends DOMException {
  /**
   * Alias for {@link FetchError.status | status}.
   *
   * @privateRemarks
   * [MDN Reference](https://developer.mozilla.org/docs/Web/API/Response/status)
   */
  code: number;

  /**
   * The name associated to the {@link FetchError.status | status code}.
   *
   * Typically this will be of the formula `StatusTextError` for instance
   * a 404 status with status text of `Not Found` would have the name
   * `NotFoundError`.
   */
  name: string;

  /**
   * The http status code associated to the returned error.
   *
   * Browser/System level network errors will often have an error code of `0` or `5`.
   * Aborted requests will have an error code of `20`.
   *
   * @privateRemarks
   * [MDN Reference](https://developer.mozilla.org/docs/Web/API/Response/status)
   */
  status: number;

  /**
   * The Status Text associated to the {@link FetchError.status | status code}
   * for the error.
   *
   * @privateRemarks
   * [MDN Reference](https://developer.mozilla.org/docs/Web/API/Response/statusText)
   */
  statusText: string;

  /**
   * A property signifying that an Error uses the {@link FetchError}
   * interface.
   */
  isRequestError: true;
}
```

### Linking Symbols You Haven't Imported

`{@link}` can only resolve to symbols that TypeDoc can see referenced
in the file. To link a symbol you otherwise have no need to import,
import it as a type and suppress the resulting lint error:

```ts
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { Thing } from './thing.ts';
import { functionThatReturnsThing } from './thing.ts';

/**
 * Does stuff and returns a {@link Thing}
 */
function doStuff() {
  return functionThatReturnsThing();
}
```

> [!NOTE]
> We would like to improve the `@typescript-eslint/no-unused-vars` lint
> rule (or its config) so that type-only imports which exist solely for
> documentation linking purposes don't trigger this error. If you'd like
> to help investigate this, reach out!

### Linking a Module

Link an entire module (for instance, to point readers at a set of
related flags or utilities) by importing it as a type namespace:

```ts
import type * as FEATURES from './features.ts';

/**
 * see {@link FEATURES | features} for the available flags.
 *
 * @public
 */
```

### Linking to MDN

[typedoc-plugin-mdn-links](https://www.npmjs.com/package/typedoc-plugin-mdn-links)
automatically links the appropriate MDN page for web-platform types
(`Response`, `AbortController`, etc.) in published documentation, so
you don't need to (and shouldn't) manually link these in the main body
of a doc comment.

It can still be useful to include the MDN reference manually via
`@privateRemarks` for ease of navigation while reading the source:

```ts
/**
 * Cancel this request by firing the {@link AbortController}'s signal.
 *
 * @privateRemarks
 * [MDN Reference](https://developer.mozilla.org/docs/Web/API/AbortController/abort)
 *
 * @param reason - optional reason for aborting the request
 * @public
 */
```

The correct link to use can usually be found by jumping to the
TypeScript typedef for the token, which itself is documented with the
canonical MDN reference. For instance, this is (an excerpt of)
TypeScript's own type for `AbortController`:

```ts
/**
 * A controller object that allows you to abort one or more DOM requests as and when desired.
 *
 * [MDN Reference](https://developer.mozilla.org/docs/Web/API/AbortController)
 */
interface AbortController {
  /**
   * Returns the AbortSignal object associated with this object.
   *
   * [MDN Reference](https://developer.mozilla.org/docs/Web/API/AbortController/signal)
   */
  readonly signal: AbortSignal;

  /**
   * Invoking this method will set this object's AbortSignal's aborted flag and signal to any observers that the associated activity is to be aborted.
   *
   * [MDN Reference](https://developer.mozilla.org/docs/Web/API/AbortController/abort)
   */
  abort(reason?: any): void;
}
```

<br>

### The `@deprecated` Tag

`@deprecated` is a standard TSDoc tag. The description below is an
add-on to, not a replacement for, its standard meaning: it signals
that consumers should stop using the tagged function, component, or
object because it is actively being removed.

- Whenever possible, link the `@recommended` replacement.
- If the deprecation is tracked by [the deprecations guide](/api/@warp-drive/build-config/deprecations)
  (i.e. it has a deprecation id like `ember-data:deprecate-store-extends-ember-object`
  and a corresponding `DEPRECATE_*` flag), link both the guide and the
  specific deprecation id using `@id`.

```ts
/**
 * @deprecated use {@link ResourceKey} instead
 */
export type StableRecordIdentifier<T extends string = string> = ResourceKey<T>;
```

### The `@discouraged` Tag

`@discouraged` signals that a function, object, or class is an older,
but not-yet-deprecated, way of doing something. Unlike `@deprecated`,
something tagged `@discouraged` may still have valid use cases; it's
optional to describe those cases in the tag.

If a `@recommended` alternative exists, cross-link to it.

### The `@recommended` Tag

`@recommended` is a companion tag to `@deprecated` and `@discouraged`.
It marks a function, object, or class as the preferred way of doing
something. It's not mandatory to link back to the `@discouraged` or
`@deprecated` alternative(s), but doing so is encouraged. Since
`@recommended` implies the existence of a `@discouraged` and/or
`@deprecated` counterpart, it shouldn't be used on its own.

<br>

---

<br>

## Documentation Hygiene

<br>

### Troubleshooting

If you have added docs but are not seeing them when previewing locally, and if you
have confirmed the docs preview server is running (and has not crashed)

- The docs may have been excluded due to using an [ignored doc comment](#ignored-doc-comments)
- The docs may have been excluded due to not using the right [comment syntax](#what-are-doc-comments)
- The documented thing may not be accessible via any public API entrypoint
- TypeDoc may be configured to ignore it (extremely rare)

<br>

### Previewing Documentation

#### For `docs.warp-drive.io`

From inside the `docs-viewer` directory

- start sync for guides with `bun ./src/start-guides-sync.ts`
- build/rebuild the API docs with `pnpm typedoc` (rerun as needed)
- start the server with `pnpm dev`, visit the site url

#### For `api.emberjs.com`

> [!Caution]
> Ignore this section. Ember api docs are incompatible while we
> migrate to tsdoc and typedoc. Once the migration is nearing
> completion we will create a transform to restore these docs.

Run `bun preview-api-docs` from the project root or the `docs-viewer` directory. 

This will build and run the (external) api-docs app with the current state of the api docs in the repo.

Changes need to be manually rebuilt with `bun rebuild-api-docs`.

See the [Docs Viewer README](https://github.com/warp-drive-data/warp-drive/blob/main/docs-viewer/README.md) for more info.
