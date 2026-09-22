# WarpDrive Skills — Agent Index

You are an AI agent looking for WarpDrive knowledge. Find the single row below that matches
your task and read **only** that file. Do not read other skill files, do not list or read whole
directories, and do not read this package's `overview.md` — none of that is necessary to
complete a task.

| If you need to... | Read exactly |
| --- | --- |
| Define a resource's shape — fields, relationships, identity — for the `Store` | `schemas/define-a-resource-schema.md` |
| Fetch or query remote data through the `Store` so it's cached and reactive | `requests/fetch-and-cache-data.md` |
| Re-record one holodeck mock, or review a test that sets `RECORD` | `holodeck/using-record.md` |
| Set up HTTP mocking for a test suite with `@warp-drive/holodeck` | `testing/set-up-holodeck.md` |
| Mock a request in a test, or fix a mock that stopped matching | `testing/mock-http-requests-in-tests.md` |
| You're contributing to WarpDrive itself, not just consuming it as a dependency | `contributors/index.md` |

Each skill file is self-contained for its task and links out to any other skill file it
genuinely depends on — follow a link only if you hit the specific case it describes.

If nothing above matches, the skill you need doesn't exist yet in this package.
