---
title: Holodeck Through the Vite Dev Server
description: Forward holodeck's requests through the Vite dev server with a small plugin, so the test page and the mock server share one origin without CORS, preflights, or an extra tool.
---

# Holodeck through the Vite dev server

An app that mocks with [holodeck](/guides/the-manual/testing/index.md) serves its test page from
Vite at `http://localhost:4200`, while holodeck answers at `https://localhost:7358`. Every mocked
request is cross-origin, and one outside the CORS
["simple request" category](/guides/the-manual/testing/client-setup.md#what-the-handler-does), such
as a `DELETE`, costs a preflight `OPTIONS` first.

This recipe forwards holodeck's requests through the dev server itself, so the page and the mock
share the dev server's origin. Nothing new to install, and no change to holodeck. The page stays
on plain HTTP. To serve it over HTTPS as well, use
[Holodeck behind a reverse proxy](/guides/the-manual/cookbook/holodeck-behind-a-reverse-proxy.md)
instead.

## Before you start

This page assumes holodeck already works under `pnpm test`, and that you followed
[Holodeck in dev mode](/guides/the-manual/cookbook/holodeck-in-dev-mode.md), so `pnpm test:dev`
starts holodeck next to Vite. The examples use `4200` for Vite and `7358` for holodeck. The plugin
below was tested on Node 26.10 and Vite 8.3. The two `tls` functions it calls exist from Node
24.21, the oldest Node holodeck runs on.

The recipe changes the lines in `tests/test-helper.js` that point requests at the mock server:

```js
import { setConfig } from '@warp-drive/holodeck';
import { setBuildURLConfig } from '@warp-drive/utilities';

const MOCK_HOST = 'https://localhost:7358';

setBuildURLConfig({ host: MOCK_HOST, namespace: 'api' });
setConfig({ host: MOCK_HOST });
```

## Why `server.proxy` is not enough

Vite's `server.proxy` uses `http-proxy-3`, which opens the upstream connection with Node's
`https.request`. That speaks HTTP/1.1, and holodeck accepts only HTTP/2. Every proxied request
comes back as `403 Forbidden` with a body that starts with
``Missing ALPN Protocol, expected `h2` to be available.``, and each test fails with
`Holodeck failed to record GET api/users (403 )`.

Node's own `fetch` negotiates HTTP/2, so the plugin below forwards with `fetch` from a dev-server
middleware instead.

## Add the plugin

Add this function to your Vite config, `vite.config.mjs` in an app from Ember's blueprint, and
put `holodeck()` first in the `plugins` array you already have.

```js
import tls from 'node:tls';

function holodeck({ host = 'https://localhost:7358' } = {}) {
  return {
    name: 'holodeck',
    apply: 'serve',
    configureServer(server) {
      tls.setDefaultCACertificates(tls.getCACertificates('system'));
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url, host);
        if (url.pathname !== '/__record' && !url.searchParams.has('__xTestId')) {
          return next();
        }
        const chunks = [];
        for await (const chunk of req) chunks.push(chunk);
        let upstream;
        try {
          upstream = await fetch(url, {
            method: req.method,
            headers: {
              accept: req.headers.accept ?? '*/*',
              'content-type': req.headers['content-type'] ?? '',
            },
            body: chunks.length ? Buffer.concat(chunks) : undefined,
          });
        } catch (error) {
          return next(error);
        }
        res.statusCode = upstream.status;
        upstream.headers.forEach((value, name) => {
          if (!['content-encoding', 'content-length', 'transfer-encoding'].includes(name)) {
            res.setHeader(name, value);
          }
        });
        res.end(Buffer.from(await upstream.arrayBuffer()));
      });
    },
  };
}
```

Three parts carry the decisions.

The `tls` line makes Node trust the certificate holodeck serves. `mkcert -install` put its root
into the operating system's store, and the browser and `curl` read that store, but Node does not.
Without the line, `fetch` fails with `UNABLE_TO_VERIFY_LEAF_SIGNATURE`. Starting Vite with
`NODE_EXTRA_CA_CERTS="$(mkcert -CAROOT)/rootCA.pem"` does the same job from outside the plugin.

The `if` forwards only the requests that are holodeck's. Holodeck's `MockServerHandler`, the one
[client setup](/guides/the-manual/testing/client-setup.md) adds to the request chain, appends
`__xTestId` to every mocked request, and the mock helpers post each fixture to `/__record`.
Everything else, including an existing `server.proxy` entry for your real API under `/api`, is
untouched. If holodeck is not running, the forwarded request fails with a 500 and Vite prints
`Internal server error: fetch failed` in its terminal.

The header filter drops `content-encoding`, `content-length`, and `transfer-encoding`. Holodeck
replays fixtures brotli-compressed, `fetch` decodes them on the way through, and the browser
would otherwise try to decode the plain body a second time.

## Point the tests at the page's origin

Change the top of `tests/test-helper.js`. The two `set*Config` calls stay as they are.

```js
const MOCK_HOST = import.meta.hot ? '' : 'https://localhost:7358';

setBuildURLConfig({ host: MOCK_HOST, namespace: 'api' });
setConfig({ host: MOCK_HOST });
```

Vite defines `import.meta.hot` only when its dev server serves the page. There, `MOCK_HOST` is
`''`, so `setBuildURLConfig` builds root-relative `/api/...` URLs and `setConfig` posts recordings
to `/__record`, and the plugin forwards both. In the build that `pnpm test` runs under testem,
`import.meta.hot` is `undefined` and the direct host stays.

## Run it

1. Run `pnpm test:dev`.
2. Open `http://localhost:4200/tests`.

The suite passes. In the browser's network panel, every request goes to `http://localhost:4200`,
and there is no `OPTIONS` request. In a test app with 17 tests and one `DELETE`, the page made 208
requests through the plugin, none of them a preflight. Cross-origin, the same page makes 209, one
of them the preflight for that `DELETE`.

## Things to know

- The first load after you change the Vite config can sit at `0 / N tests completed` while Vite
  re-optimizes dependencies. Reload the page.
- A run through the plugin records fixtures exactly like a
  [dev run](/guides/the-manual/cookbook/holodeck-in-dev-mode.md#things-to-know). Fixture names come
  from the request path alone, so fixtures replay the same with or without it.
- If a test calls `setBuildURLConfig` with its own `host`, its requests go to that host, not
  through the plugin.

## Related

- [Holodeck behind a reverse proxy](/guides/the-manual/cookbook/holodeck-behind-a-reverse-proxy.md)
  does the same with Caddy and serves the page over HTTPS.
- [Holodeck in dev mode](/guides/the-manual/cookbook/holodeck-in-dev-mode.md) starts holodeck next
  to the dev server.
- [Test framework integration](/guides/the-manual/testing/test-framework-integration.md) sets the
  mock host.
- [Client setup](/guides/the-manual/testing/client-setup.md) adds the request handler.
