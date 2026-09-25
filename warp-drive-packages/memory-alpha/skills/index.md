# WarpDrive Skills — Agent Index

You are an AI agent looking for WarpDrive knowledge. Find the single row below that matches
your task and read **only** that file. Do not read other skill files, do not list or read whole
directories, and do not read this package's `overview.md` — none of that is necessary to
complete a task.

| If you need to... | Read exactly |
| --- | --- |
| Define a resource's shape — fields, relationships, identity — for the `Store` | `schemas/define-a-resource-schema.md` |
| Fetch or query remote data through the `Store` so it's cached and reactive | `requests/fetch-and-cache-data.md` |
| Change a schema's `belongsTo`/`hasMany` field to `resource`/`collection` | `relationships/migrate-relationship-fields.md` |
| Move code that consumes an async `belongsTo`/`hasMany` implicitly (`#each` blocks, `.content`, getters reading through it) toward requests and `resource`/`collection` | `relationships/migrate-async-relationship-usage.md` |
| Re-record one holodeck mock, or review a test that sets `RECORD` | `holodeck/using-record.md` |
| Look up a guide, upgrade note, or API reference page that no row above covers — a concept, an option, a signature | `docs/read-the-docs-as-markdown.md` |
| You're contributing to WarpDrive itself, not just consuming it as a dependency | `contributors/index.md` |

Each skill file is self-contained for its task and links out to any other skill file it
genuinely depends on — follow a link only if you hit the specific case it describes.

If nothing above matches, the skill you need doesn't exist yet in this package.
