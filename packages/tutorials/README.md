# @warp-drive/tutorials

The apps behind the [WarpDrive tutorials](https://docs.warp-drive.io/guides/tutorials/).
Each tutorial has a directory per framework, holding a `solution/` app and the
`starter/` app learners begin from.

| Tutorial        | Framework | Guide                                                            |
| --------------- | --------- | ---------------------------------------------------------------- |
| `todomvc-ember` | Ember     | [TodoMVC](https://docs.warp-drive.io/guides/tutorials/todomvc/) |

This package is private for now. It will be published so learners can create an
app with `npx @warp-drive/tutorials`.

## Updating a tutorial

**Edit `solution/` only.** `starter/` is generated from it, so changes made directly
in `starter/` are overwritten and fail CI.

```sh
node packages/tutorials/scripts/make-starter.mjs
```

Run this from the repo root after any change to `solution/`, and commit the
regenerated `starter/` with your change.

### How the starter is made

The generator copies `solution/` to `starter/`. The solution marks what the learner
writes, next to the code itself:

```ts
// #replace-region-in-starter TODO (chapter 4): send the create request
// #region create-todo
await this.store.request(createTodo(attributes));
// #endregion create-todo
```

| Marker | In the starter |
| --- | --- |
| `// #replace-region-in-starter <text>` above a `#region` | The region is replaced by `// <text>` |
| `// #remove-region-from-starter` above a `#region` | The region is removed, for example an import the learner adds |
| `{{! #replace-region-in-starter <text> }}` or `{{! #remove-region-from-starter }}` above `<!-- #region … -->` | The same, inside a `<template>` |
| `// #omit-file-from-starter` as a file's first line | The file is left out, because the learner writes it |
| A `#region` with neither directive above it | The code is kept and the markers are dropped |

Regions are named for the code they hold, not the chapter, so the guides can
include them by name: `<<< @/../../packages/tutorials/todomvc-ember/solution/app/components/todo-app/create-todo.gts#create-todo`.
Include finished code from `solution/`, and the starter's `TODO` stubs from
`starter/`. The code on the page is then the code CI tests.

### Common changes

| Change | What to do |
| --- | --- |
| Fix a bug, or update for a WarpDrive API change | Edit `solution/`, then regenerate |
| Change what a learner sees at a `TODO` | Edit the `#replace-region-in-starter` line, then regenerate |
| Move taught code to another chapter | Change the chapter number in its `#replace-region-in-starter` line, then regenerate |
| Add a dependency | Add it to `solution/package.json`, then regenerate |

If you changed code in a region the starter replaces, reread that chapter of the guide. The
snippets update themselves, but the prose around them doesn't.

### What CI checks

| Failure | Meaning |
| --- | --- |
| `starter is out of date` | `starter/` doesn't match the generator's output. Regenerate, or move a direct edit into `solution/`. |
| `… must be directly above a #region` | A replace or remove directive was separated from its region, or its region was removed. |
| `malformed tutorial starter directive` | A directive is misspelled, or `#replace-region-in-starter` has no text. |
| `#omit-file-from-starter must be the file's first line` | Move the directive to line 1. |
| Solution or starter tests fail | The app is broken. Both apps are type-checked and tested. |
