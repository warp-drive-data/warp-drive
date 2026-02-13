---
categoryTitle: Migrating
title: Introduction
outline:
  level: 2,3
categoryOrder: 4
---

# Migrating from Model to Schema 

In existing Ember apps relying on EmberData Model, we recommend migrating from Model to Schema in [LegacyMode](../the-manual/schemas/resources/legacy-mode.md) before exploring [PolarisMode](../the-manual/schemas/resources/polaris-mode.md). LegacyMode allows you to use WarpDrive the same way you used EmberData, and it enables migrating Model to Schema incrementally.

Starting in 5.7, `@warp-drive/legacy` enables restoring features deprecated in 4.x and removed in 5.0 - including Model behaviors when using LegacyMode. This means that LegacyMode provides an avenue to enable Schema in apps that still rely on Ember 3.x or 4.x.

A codemod is currently being tested that will perform this migration for you. Meanwhile, you can follow a migration path to enable Schema in your application:

- [The Two Store Approach](./two-store-migration/index.md). This approach enables migrating while also upgrading versions and starting relatively fresh. This enables the same ResourceType (for instance `user`) to be used as a Model in some areas of the app and via Schema in others by sourcing data from separately configured store instances.
