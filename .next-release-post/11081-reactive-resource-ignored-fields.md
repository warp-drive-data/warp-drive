---
releases: ["5.10"]
---
Reading `unknownProperty` or `size` on a `ReactiveResource` that has no field by that name now
returns `undefined` instead of throwing "No field named ..." in development. This fixes passing a
SchemaRecord to Ember's `isEmpty` from `@ember/utils`, a common call in apps migrating from Model.
