# @ember-data/rest

:::warning ⚠️ This package only exists for backwards compatibility
Newer apps should use {@link @warp-drive/utilities! | @warp-drive/utilities} instead.
:::

This package provides request builders for working with **REST**ful APIs when using the older
EmberData package setup.

Request builders are functions that produce [Fetch Options](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API).
They take a few contextual inputs about the request you want to make, abstracting away the
gnarlier details. The builders live in the [`@ember-data/rest/request`](/api/@ember-data/rest/request/)
entry point.
