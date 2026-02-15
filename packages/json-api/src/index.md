# @ember-data/json-api

:::warning ⚠️ Legacy Package
**This package only exists for backwards compatibility.**

**For new projects:** Use {@link @warp-drive/json-api! | @warp-drive/json-api} for the cache and {@link @warp-drive/utilities! | @warp-drive/utilities} for the request builders.
:::

## Overview

This package provides an in-memory [{json:api}](https://jsonapi.org/) document and resource {@link @warp-drive/core-types!cache.Cache | Cache} implementation for use with the older EmberData package setup.

**Why it's legacy:** This package was created when EmberData and WarpDrive were tightly coupled. Modern WarpDrive has:
- Moved the cache implementation to {@link @warp-drive/json-api! | @warp-drive/json-api}
- Moved the request builders to {@link @warp-drive/utilities! | @warp-drive/utilities}
- Improved type safety and tree shaking

**Modern alternative:** Use {@link @warp-drive/json-api! | @warp-drive/json-api} for the cache and {@link @warp-drive/utilities! | @warp-drive/utilities} for request builders.

**When you still need this:** Only use this package if you're maintaining an existing Ember application that hasn't migrated to the modern WarpDrive packages.

For guidance on migration, see the [Migration Guide](/guides/migrating/).

## Installation

Install using your javascript package manager of choice. For instance with [pnpm](https://pnpm.io/)

```sh
pnpm add @ember-data/json-api
```

## Setup

> **Note:** When using [ember-data](https://github.com/warp-drive-data/warp-drive/blob/main/packages/-ember-data) the below configuration is handled for you automatically.

```ts
import Store from '@ember-data/store';
import Cache from '@ember-data/json-api';

export default class extends Store {
  createCache(wrapper) {
    return new Cache(wrapper);
  }
}
```

## Usage

Usually you will directly interact with the cache only if implementing a presentation class. Below we give an example of a read-only record (mutations never written back to the cache). More typically cache interactions are something that the `Store` coordinates as part of the `request/response` lifecycle.

```ts
import Store, { recordIdentifierFor } from '@ember-data/store';
import Cache from '@ember-data/json-api';
import { TrackedObject } from 'tracked-built-ins';

class extends Store {
  createCache(wrapper) {
    return new Cache(wrapper);
  }

  instantiateRecord(identifier) {
    const { cache, notifications } = this;
    const { type, id } = identifier;

    // create a TrackedObject with our attributes, id and type
    const attrs = cache.peek(identifier).attributes;
    const data = Object.assign({}, attrs, { type, id });
    const record = new TrackedObject(data);

    // update the TrackedObject whenever attributes change
    const token = notifications.subscribe(identifier, (_, change) => {
      if (change === 'attributes') {
        Object.assign(record, cache.peek(identifier).attributes);
      }
    });

    // setup the ability to teardown the subscription when the
    // record is no longer needed
    record.destroy = () => {
      this.notifications.unsubscribe(token);
    };

    return record;
  }

  teardownRecord(record: FakeRecord) {
    record.destroy();
  }
}
```

For the full list of APIs, see the documentation for {@link Cache}.
