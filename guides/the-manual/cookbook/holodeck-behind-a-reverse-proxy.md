---
title: Holodeck Behind a Reverse Proxy
description: Serve an app's test page and the holodeck mock server from one HTTPS origin with Caddy, so mocked requests are same-origin and send no CORS preflight.
---

# Holodeck behind a reverse proxy

An app that mocks with [holodeck](/guides/the-manual/testing/index.md) serves its test page from
Vite at `http://localhost:4200`, while holodeck answers at `https://localhost:7358`. Every mocked
request is cross-origin, and one outside the CORS
["simple request" category](/guides/the-manual/testing/client-setup.md#what-the-handler-does), such
as a `DELETE`, costs a preflight `OPTIONS` first.

This recipe puts a reverse proxy in front of both, so the page and the mock share one HTTPS origin.
The browser sends no preflight, and the app itself runs over HTTPS with holodeck's certificate
instead of plain HTTP.

Caddy is the worked example. Any reverse proxy that speaks HTTP/2 to its upstream can do the same
job. If you only want one origin and not HTTPS,
[Holodeck through the Vite dev server](/guides/the-manual/cookbook/holodeck-through-the-vite-dev-server.md)
does it from `vite.config.mjs` with nothing to install.

## Before you start

This page assumes holodeck already works under `pnpm test`. Holodeck serves over TLS only, so a
passing suite means `ensure-cert` already wrote `holodeck-localhost.pem` and
`holodeck-localhost-key.pem` into your home directory, as
[Trust a local certificate](/guides/the-manual/testing/server-setup.md#trust-a-local-certificate)
describes. The recipe also builds on
[Holodeck in dev mode](/guides/the-manual/cookbook/holodeck-in-dev-mode.md), which starts holodeck
next to Vite with a `test:dev` script. Set that up first. The examples use fixed ports: `4200` for
Vite, `7358` for holodeck, and `8443` for Caddy.

Install a [Caddy](https://caddyserver.com/docs/install) build that speaks HTTP/2 to its
upstreams. Holodeck accepts nothing else, and [Run it](#run-it) shows how to confirm it once
Caddy is up. Caddy's reverse proxy quick start is at
https://caddyserver.com/docs/quick-starts/reverse-proxy.

The recipe changes the lines in `tests/test-helper.js` that point requests at the mock server:

```js
import { setConfig } from '@warp-drive/holodeck';
import { setBuildURLConfig } from '@warp-drive/utilities';

const MOCK_HOST = 'https://localhost:7358';

setBuildURLConfig({ host: MOCK_HOST, namespace: 'api' });
setConfig({ host: MOCK_HOST });
```

## Write the Caddyfile

Save this as `Caddyfile` in the app's root, next to `testem.js`.

```caddyfile
https://localhost:8443 {
	tls {$HOME}/holodeck-localhost.pem {$HOME}/holodeck-localhost-key.pem

	@holodeck path /api/* /__record*
	handle @holodeck {
		reverse_proxy https://localhost:7358
	}

	handle {
		reverse_proxy localhost:4200
	}
}
```

The `tls` line serves holodeck's own certificate. Caddy fills in `{$HOME}` when it reads the
file. If `ensure-cert` wrote the pair somewhere other than your home directory, put those paths
here instead. `ensure-cert` installed its certificate authority with `mkcert -install`, so the
browser already trusts the proxy. Caddy trusts the same authority, so it reaches holodeck without
being told to skip certificate checks.

The `@holodeck` matcher names the two paths that go to holodeck. `/api` is the `namespace` from
`setBuildURLConfig`, so if yours differs, change it here. `/__record` is where each mock helper
posts the fixture it records. Without it, Vite answers `/__record` with a 404, and every test that
records fails with
`MockError: Holodeck failed to record GET api/comments/1 (404 ). The mock server gave no explanation.`
The last `handle` sends everything else to Vite.

The blocks use `handle` rather than `handle_path` because `handle` keeps the `/api` prefix, and
fixture names include it, for example `GET::api_users::0`.

A Caddy build that negotiates HTTP/2 needs no transport settings here, and a build that cannot is
not fixed by `transport http { versions 2 }` either. Any proxy that speaks HTTP/1.1 to holodeck,
such as Vite's `server.proxy` or testem's `proxies` option, gets a `403 Forbidden` on every
request. The body starts with ``Missing ALPN Protocol, expected `h2` to be available.``

## Point the tests at the page's origin

Change the top of `tests/test-helper.js`. The `setBuildURLConfig` and `setConfig` calls stay as
they are.

```js
const THROUGH_PROXY = window.location.port === '8443';
const MOCK_HOST = THROUGH_PROXY ? '' : 'https://localhost:7358';

setBuildURLConfig({ host: MOCK_HOST, namespace: 'api' });
setConfig({ host: MOCK_HOST });
```

On the proxy's port, `MOCK_HOST` is `''`, so `setBuildURLConfig` builds root-relative `/api/...`
URLs and `setConfig` posts recordings to `/__record`. Anywhere else, under testem or at
`http://localhost:4200`, the switch keeps the direct host. If you give Caddy another port, change
it here too.

## Run it

1. Start holodeck and Vite with the `test:dev` script from
   [Holodeck in dev mode](/guides/the-manual/cookbook/holodeck-in-dev-mode.md#run-it-with-the-dev-server).
2. In a second terminal, start Caddy from the app's root. It reads the `Caddyfile` there and
   logs `server running`.

   ```sh
   caddy run
   ```

3. Confirm that Caddy reached holodeck over HTTP/2. Holodeck answers this probe with a 400, which
   is fine. The `via` header is what matters.

   ```sh
   curl -s -D - -o /dev/null 'https://localhost:8443/api/users?__xTestId=probe&__xTestRequestNumber=0' | grep -i via
   ```

   `via: 2.0 Caddy` means HTTP/2. `via: 1.1 Caddy` means this build speaks HTTP/1.1 to the
   upstream, and the suite will fail with `Holodeck failed to record GET api/users (403 )`.
   Install a build that speaks HTTP/2, restart Caddy, and probe again.

4. Open `https://localhost:8443/tests`.

The suite passes. In the browser's network panel, every request goes to `https://localhost:8443`,
and there is no `OPTIONS` request. In a test app with 17 tests and one `DELETE`, the direct page
made 209 requests, one of them the preflight for that `DELETE`. The proxied page made 208, with no
preflight.

## Things to know

- The certificate names only `localhost`, so keep `localhost` as the site address. To use another
  name, such as `app.localhost`, first issue a certificate with `mkcert app.localhost`.
- Caddy writes `~/.config/caddy/autosave.json`. On macOS it also creates
  `~/Library/Application Support/Caddy`.
- A proxied run records fixtures exactly like a
  [dev run](/guides/the-manual/cookbook/holodeck-in-dev-mode.md#things-to-know). Fixture names come
  from the request path alone, so fixtures replay the same with or without the proxy.
- `pnpm test` is unchanged and still runs cross-origin. Testem's page is not on port `8443`, so
  the switch keeps the direct host there.

## Related

- [Holodeck through the Vite dev server](/guides/the-manual/cookbook/holodeck-through-the-vite-dev-server.md)
  forwards the same requests from Vite with `fetch`, on plain HTTP.
- [Holodeck in dev mode](/guides/the-manual/cookbook/holodeck-in-dev-mode.md) runs the suite from
  the dev server.
- [Server setup](/guides/the-manual/testing/server-setup.md) installs holodeck.
- [Test framework integration](/guides/the-manual/testing/test-framework-integration.md) sets the
  mock host.
- [Client setup](/guides/the-manual/testing/client-setup.md) adds the request handler.
