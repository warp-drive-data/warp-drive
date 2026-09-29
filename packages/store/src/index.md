# @ember-data/store

This package provides [*Ember***Data**](https://github.com/warp-drive-data/warp-drive/)'s `Store` class.

A {@link @warp-drive/core!Store | Store} coordinates interaction between your application, a [Cache](/api/@warp-drive/core/types/cache/types/Cache),
and sources of data (such as your API or a local persistence layer) accessed via a {@link @warp-drive/core!RequestManager | RequestManager}.
Optionally, a Store can be configured to hydrate the response data into rich presentation classes.
[How the Pieces Connect](/api/@warp-drive/core/#how-the-pieces-connect) diagrams both.

It re-exports the `Store` from [`@warp-drive/core`](/api/@warp-drive/core/). To configure a Store with
these packages, see [Configure the Store](/guides/configuration/legacy-package-setup/setup/universal.md#configure-the-store).
