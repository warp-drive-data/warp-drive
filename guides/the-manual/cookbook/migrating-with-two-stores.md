# Migrating with two stores

- ⮐ [Cookbook](./index.md)

An app can run more than one store at once. Each store owns its own cache, its own schemas, and
its own request pipeline, so a second store is a place to put the setup you are moving toward
while the first one keeps serving the code you have not touched yet. You migrate a region at a
time instead of landing one enormous change.

Two migrations fit this shape.

- **A new major version of WarpDrive.** When both versions publish packages under the same names,
  the second store runs the [mirror packages](/upgrading/v5/two-store-migration.md), which let two
  versions of the library live in one app. Coming from `ember-data` 4.12 or earlier, the names
  don't overlap and you skip the mirrors, as
  [Coming from ember-data 4.12 or earlier](#coming-from-ember-data-4-12-or-earlier) explains.
- **A new version of your API, or a store configuration you want to start clean.** Both stores run
  the same WarpDrive version with different handlers, schemas, or caches.

Moving from `Model` to `ReactiveResource` does not need a second store on its own.
`useLegacyStore`'s `schemas` option lets both live in one store, and
[LegacyMode](/guides/the-manual/schemas/resources/legacy-mode.md#migration) is the recommended
path. Reach for two stores when you also want to change versions or drop adapters and serializers.

## Before you start

Configure the second store first. Mirror packages only matter when the two stores run different
versions of the same packages, but a second store always needs a full configuration of its own,
covering presentation hooks, schemas, the request manager, and the cache.
[Step 4 of the upgrade guide](/upgrading/v5/index.md#step-4-configure-the-store) shows that
configuration, and applies to the same-version case too.
[Migrating Between Versions Using The Two Store Approach](/upgrading/v5/two-store-migration.md)
covers what a mirror package is and what running two copies of the library costs you.

The rest of this guide assumes two registered services. `store` is your existing setup and
`v2-store` is the new one, matching the naming the upgrade guide uses.

::: warning ⚠️ Records never cross the boundary
A record from one store cannot be set as a relationship value on a record from the other, because
each store has its own cache. Loading the same resource into both stores is fine. Linking across
them is not. See [Caveat Emptor](/upgrading/v5/two-store-migration.md#caveat-emptor) for the rest
of the constraints.
:::

That constraint is what decides the order of the work. Move a vertical slice at a time, such as one
route and everything below it, so every record in a single render comes from one store.

## Coming from ember-data 4.12 or earlier

An app on any `ember-data` release from 1.x through 4.12 can move straight to the latest WarpDrive
this way, without stopping at the versions in between. WarpDrive is what EmberData is called from
5.x on, and 5.x is the current major version.

Those older releases publish only `ember-data` and `@ember-data/*` packages. The latest WarpDrive
publishes `@warp-drive/*` packages. No package name appears on both sides, so the two versions
install side by side and the second store uses `@warp-drive/*` directly. You don't need the mirror
packages.

Set up the second store with the [Migration](/upgrading/v5/index.md#migration) steps of the 4.x
to 5.x upgrade guide. That guide is written for mirror packages, so wherever it names a
`@warp-drive-mirror/*` package, in an install command, an import, or the build config, use the
matching `@warp-drive/*` package instead. The existing `ember-data` install keeps providing the
`store` service, and the new store is the `v2-store` service you configure yourself.

::: warning ⚠️ 4.13 is the exception
`ember-data` 4.13 shipped only as canary and alpha releases, so this only affects an app that
installed one of those. Unlike 4.12, it already depends on `@warp-drive/core-types` and
`@warp-drive/build-config`, and those names collide with the latest WarpDrive. An app on 4.13 gives
the second store the `@warp-drive-mirror/*` packages, exactly as the upgrade guide shows.
:::

## Move one route at a time

A route that already encapsulates its slice needs one line changed. Swap which store it injects.

```diff
// app/routes/authenticated/logs.js
 export default class LogsRoute extends Route {
-  @service store;
+  @service('v2-store') store;

   async model() {
     // unchanged
   }
 }
```

Everything the route loads now comes from the new store. Pick slices whose records stay inside the
slice. A route whose model is linked into a sidebar rendered by the rest of the app is the wrong
place to start.

## Push the boundary down with contexts

Injecting `v2-store` works until a component below the route needs the same store. Rewriting every
descendant to inject `v2-store` by name means rewriting them again when the old store is gone.

[ember-provide-consume-context](https://github.com/customerio/ember-provide-consume-context) solves
this. Provide `store` once at the top of the slice and let descendants consume it under that name,
so the descendants never encode which store they are on. Kevin Kucharczyk's EmberConf 2024 talk
[Contextualizing State](https://www.youtube.com/watch?v=ptCNK4ICxJ0) covers the pattern in depth.

Install `ember-provide-consume-context@^0.10.0` or later. Earlier releases depend on
`@glimmer/component` 1.x directly, which collides with the 2.x an Ember 6.4 or later app uses and
fails the build.

```js
// app/components/logs-section.js
import Component from '@glimmer/component';
import { service } from '@ember/service';
import { provide } from 'ember-provide-consume-context';

export default class LogsSectionComponent extends Component {
  @service('v2-store') v2Store;

  @provide('store')
  get store() {
    return this.v2Store;
  }
}
```

If the slice has no component of its own, provide the value inline instead. The template reads the
service from its controller.

```js
// app/controllers/authenticated/logs.js
import Controller from '@ember/controller';
import { service } from '@ember/service';

export default class LogsController extends Controller {
  @service('v2-store') v2Store;
}
```

```hbs
{{! app/templates/authenticated/logs.hbs }}
<ContextProvider @key="store" @value={{this.v2Store}}>
  <LogsList />
</ContextProvider>
```

Descendants then consume the store rather than injecting it.

```diff
// app/components/logs-list.js
 import { consume } from 'ember-provide-consume-context';

 export default class LogsListComponent extends Component {
   @service session;
-  @service store;
+  @consume('store') store;

   get groupedEntries() {
     // unchanged
   }
 }
```

`@consume` returns `undefined` when nothing above the component provides that key, so a component
rewritten this way only works inside a provider. Convert a component once every one of its render
trees provides `store`, or give it a fallback as shown in the next section. When the old store is
gone, delete the provider and change `@consume('store')` back to `@service store`.

## Shared components that serve both sides

A leaf component used from migrated and unmigrated parts of the app is the hard case. It gets a
record from whichever store its context provides, and it may have to hand that record to a caller
living in the other store.

Give the component a fallback for the unmigrated side, then translate at that one point.

```js
// app/components/stateful-button.js
import Component from '@glimmer/component';
import { service } from '@ember/service';
import { cacheKeyFor } from '@warp-drive/core';
import { consume } from 'ember-provide-consume-context';
import { createRecord, findRecord } from '@warp-drive/utilities/json-api';

export default class StatefulButtonComponent extends Component {
  @service('store') v1Store;
  @service('v2-store') v2Store;
  @consume('store') contextStore;

  get store() {
    return this.contextStore ?? this.v1Store;
  }

  get needsV1Record() {
    return this.store === this.v2Store;
  }

  async createEntry(params) {
    const record = this.store.createRecord('log-entry', params);

    // the mutation builders set the url and method but leave the body to the app,
    // so that only the data you intend to send goes over the wire
    const init = createRecord(record);
    init.body = JSON.stringify({ data: this.store.cache.peek(cacheKeyFor(record)) });
    await this.store.request(init);

    let result = record;

    if (this.needsV1Record) {
      // `onCreate` belongs to unmigrated code, which only understands v1 records
      const { content } = await this.v1Store.request(findRecord('log-entry', record.id));
      result = content.data;
    }

    await this.args.onCreate(result);
  }
}
```

That second request fetches data you already hold. It is the cost of translating across the
boundary, which is the argument for moving the boundary instead. Treat this pattern as an escape
hatch, and prefer reshaping the slice so the whole interaction lands in one store.

## Finishing the migration

Once the last slice moves, delete the old store service and the packages only it used, then rename
`v2-store` to `store` so injections and providers collapse back to the default.
[Post Migration](/upgrading/v5/index.md#post-migration) covers the version-upgrade case.

Because each store is configured independently, the second store is also where you drop what you
no longer want. Adapters, serializers, and `Model` can stay in the old store and never be installed
in the new one.

---

- ⮐ [Cookbook](./index.md)
