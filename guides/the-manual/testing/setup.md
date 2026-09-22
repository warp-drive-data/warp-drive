---
title: Setting Up Holodeck
---

# Setting up holodeck

Holodeck needs four things before a test can mock a request. A certificate, a running server, an
app that knows where that server is, and a request handler in the chain. This page sets up all
four.

## Before you start

Install [`mkcert`](https://github.com/FiloSottile/mkcert). Holodeck serves over TLS only, and
`mkcert` is what issues the certificate it serves with.

::: code-group

```sh [macOS]
brew install mkcert
brew install nss # only if you test in Firefox
```

```sh [Linux]
sudo apt install libnss3-tools
# then install mkcert from https://github.com/FiloSottile/mkcert/releases
```

```sh [Windows]
choco install mkcert
```

:::

You also need Node 24.21 or newer, and an app already built with ***Warp*Drive**'s build
configuration. Holodeck's browser build reads the same build-time flags as the rest of
***Warp*Drive**, so the pipeline that builds your tests has to supply them.

## Install the package

Holodeck publishes to the `canary` channel only. Pin an exact version.

::: code-group

```sh [pnpm]
pnpm add -E @warp-drive/holodeck@canary
```

```sh [npm]
npm add -E @warp-drive/holodeck@canary
```

```sh [yarn]
yarn add -E @warp-drive/holodeck@canary
```

```sh [bun]
bun add -E @warp-drive/holodeck@canary
```

:::

`@warp-drive/core` is a required peer dependency. Add `@warp-drive/legacy` as well if your tests go
through legacy adapters.

## Trust a local certificate

Run the bundled `ensure-cert` command once per machine.

```sh
pnpm dlx @warp-drive/holodeck ensure-cert
```

It installs a local certificate authority with `mkcert -install`, issues a certificate for
`localhost`, writes the pair into your home directory, and appends two environment variables to
your shell profile.

```sh
HOLODECK_SSL_CERT_PATH="$HOME/holodeck-localhost.pem"
HOLODECK_SSL_KEY_PATH="$HOME/holodeck-localhost-key.pem"
```

Those two paths are also the defaults. Holodeck finds the certificate without the variables as
long as the files are in your home directory, and announces the fallback when it starts. Set the
variables only when you keep the certificate somewhere else.

`ensure-cert` recognises `bash`, `zsh`, and `fish` at a fixed set of paths. On any other shell it
stops with `Manual SSL Cert Setup Required for Holodeck`, and
[Troubleshooting](./troubleshooting.md#the-certificate-is-missing) gives the two commands to run
instead.

If you also use `@warp-drive/diagnostic` to serve your tests, it reads the same certificate. A
machine without one fails there first, before holodeck starts at all.

## Start the mock server with your test server

Holodeck has no command line of its own. Start it from the script that starts your test server, and
give it a port one higher than the test server's.

```js
// diagnostic.js
import { launch } from '@warp-drive/diagnostic/server';
import holodeck from '@warp-drive/holodeck';

await launch({
  async setup(options) {
    await holodeck.launchProgram({
      port: options.port + 1,
    });
  },
  async cleanup() {
    await holodeck.endProgram();
  },
  entry: './dist-test/index.html',
});
```

The `+ 1` is a convention, not a default, and the browser side repeats it. Both halves have to
agree, because holodeck binds the port it is given and never falls back to another one.

Any runner that can run code before the suite works the same way. Under Testem, start holodeck
from the [async config](https://github.com/testem/testem/blob/master/docs/config_file.md#returning-a-promise-from-testemjs)
and shut it down on `beforeExit`.

```js
// testem.js
module.exports = async function () {
  const holodeck = (await import('@warp-drive/holodeck')).default;
  await holodeck.launchProgram({ port: 7373 });

  process.on('beforeExit', async () => {
    await holodeck.endProgram();
  });

  return {
    // ... testem config
  };
};
```

***Warp*Drive**'s own test apps use Diagnostic, so that is the path with test coverage behind it.

Run this script from the test app's own directory. `launchProgram` reads `package.json` from the
current working directory, and writes `.mock-cache` there too.

A correct start looks like this.

```
	@warp-drive/holodeck 🌅
	=================================

	Holodeck Access Granted
		program: json-api
		port: 7358

	Serving Holodeck HTTP Mocks from https://localhost:7358

🚀 Serving Diagnostic Tests on https://localhost:7357
```

## Point the app at the mock server

In the file that boots your test suite, work out the mock server's URL and hand it to both packages
that need it.

```ts
// start.ts
import { setupGlobalHooks } from '@warp-drive/diagnostic';
import { setConfig, setTestId } from '@warp-drive/holodeck';
import { setBuildURLConfig } from '@warp-drive/utilities';

const MockHost = `https://${window.location.hostname}:${Number(window.location.port) + 1}`;

setBuildURLConfig({ host: MockHost, namespace: '' });
setConfig({ host: MockHost });

setupGlobalHooks((hooks) => {
  hooks.beforeEach(function (assert) {
    setTestId(this, (assert as unknown as { test: { testId: string } }).test.testId);
  });
  hooks.afterEach(function () {
    setTestId(this, null);
  });
});
```

Both configuration calls are needed, and they do different jobs. `setBuildURLConfig` from
`@warp-drive/utilities` aims the requests your app makes. `setConfig` from `@warp-drive/holodeck`
aims only the internal request that records a fixture. Set the second and forget the first, and
your tests record fixtures that no request ever reads.

`setTestId` is what scopes a fixture to a test. Holodeck stores the id against the test context
object itself, so the object you pass here has to be the same one your tests pass to the mock
helpers.

The cast around `assert` is required today. `Diagnostic` does not expose `test` on its public type,
and the line does not compile without it.

Under QUnit, register the same two hooks through `QUnit.hooks`.

```ts
QUnit.hooks.beforeEach(function (assert) {
  setTestId(this, assert.test.testId);
});
QUnit.hooks.afterEach(function () {
  setTestId(this, null);
});
```

Holodeck keys the test id off the object you pass, so under QUnit `this` has to be the same test
context your tests see.

## Add the handler to your request chain

Put `MockServerHandler` in front of `Fetch`.

```ts
import { useRecommendedStore } from '@warp-drive/core';
import { MockServerHandler } from '@warp-drive/holodeck';
import { JSONAPICache } from '@warp-drive/json-api';

const TestStore = useRecommendedStore({
  handlers: [new MockServerHandler(this)],
  cache: JSONAPICache,
  schemas: [/* … */],
});
```

A bare `RequestManager` takes the same handler.

```ts
manager.use([new MockServerHandler(this), Fetch]);
```

The handler adds the test id to every outgoing request, which is how the server knows which
fixtures to answer from. `this` is the test context again, and it has to be the same object
`setTestId` received.

## Record your first test

Write a test that declares a mock and then makes the request.

```ts
import { module, test } from '@warp-drive/diagnostic';
import { GET } from '@warp-drive/holodeck/mock';
import { buildBaseURL } from '@warp-drive/utilities';

module('reading a user', function (hooks) {
  test('it fetches a user', async function (assert) {
    await GET(this, 'users/1', () => ({
      data: { id: '1', type: 'user', attributes: { name: 'Chris Thoburn' } },
    }));

    const { content } = await this.store.request({
      url: buildBaseURL({ resourcePath: 'users/1' }),
    });

    assert.strictEqual(content.data.attributes.name, 'Chris Thoburn');
  });
});
```

Build the test bundle, then run the suite. Recording is the default outside CI, so the run writes a
fixture under `.mock-cache/`.

Commit that fixture with the test. Then confirm the test passes against the committed file rather
than against a fresh recording, as
[Recording and replaying](./record-and-replay.md#prove-replay-works-before-you-push) describes.

## Related

- [Writing mocks](./writing-mocks.md)
- [Recording and replaying](./record-and-replay.md)
- [Troubleshooting](./troubleshooting.md)
