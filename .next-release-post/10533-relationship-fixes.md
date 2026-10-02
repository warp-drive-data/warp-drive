---
releases: ["5.9"]
---
Relationship fixes:

- Reading a `hasMany` after a record on its inverse side was unloaded (for example, when a route
  reloads its model) no longer throws "Expected localState to be present".
- `splice(start)` with no delete count on a `hasMany` now removes every item from `start` to the
  end, the same as `Array.prototype.splice`.
- When two relationships on a type declare the same explicit `inverse`, development builds now
  throw an error naming both fields. Before, the relationship was silently corrupted.
