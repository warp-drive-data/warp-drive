# Bail Early in Hot Paths

Use this skill when you're deciding where to put a guard, fallback, or early-return inside
WarpDrive's internals (`Store`, cache, graph, reactive signals, record arrays) — nearly all of
this codebase runs on a hot path, so this decision comes up constantly.

## Steps

1. Find the earliest point in the call chain where the fact you actually need — "is there new
   data to sync," "did anything change" — is already known or is a single cheap check away
   (an `undefined` check, a reference comparison, a boolean already on the object). That point
   is where the guard belongs, placed immediately in front of the expensive work it's saving you
   from.
2. Don't guard further upstream "just in case" — that adds a check to code that runs whether or
   not the expensive work would have happened. Don't guard downstream either, after the
   expensive work already ran.
3. Don't reach for a wider fix (a new state field, a broader notification path, a refactor of
   how staleness is tracked) when a narrow, local check does the job. Save the bigger change for
   when the narrow check is actually wrong somewhere else too.
4. Treat a fallback (`?? []`, `|| defaultValue`) that only exists to stop a crash as a smell, not
   a fix — it can silently produce a plausible-looking wrong result instead of a loud one. Prefer
   a guard that skips the unnecessary work entirely over a fallback that fabricates an input for
   it.

## Example

`ManyArrayManager#_syncArray` re-syncs a `ManyArray`'s membership whenever its relationship goes
stale. A relationship can go stale from a `links`-only update with no new `data` (e.g. a save
response that only changes a pagination link) — in that case there is no membership to sync at
all. The fix was a single `rawValue.data !== undefined` check placed directly in front of the
clear-and-refill, not a `?? []` fallback (which would silently empty an already-populated array
on an unrelated links-only change) and not a fix upstream in the graph layer (which would touch
every consumer of relationship state to fix a bug specific to this one array-sync path).
