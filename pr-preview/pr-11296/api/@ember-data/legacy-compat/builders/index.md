---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11296/api/@ember-data/legacy-compat/builders.md
description: >-
  Deprecated request builders (`findAll`, `findRecord`, `query`, `queryRecord`,
  `saveRecord`) that move store method calls onto `store.request` while keeping
  adapter behavior.
---

&#x20;

Builders for migrating from `store` methods to `store.request`.

These builders enable you to migrate your codebase to using the correct syntax for `store.request` while temporarily preserving legacy behaviors.
This is useful for quickly upgrading an entire app to a unified syntax while a longer incremental migration is made to shift off of adapters and serializers.
To that end, these builders are deprecated and will be removed in a future version of Ember Data.

## Deprecated
