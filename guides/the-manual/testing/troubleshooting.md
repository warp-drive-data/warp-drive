---
title: Troubleshooting
---

# Troubleshooting

Each section starts with what holodeck prints. Search this page for the text you have.

## A mocked request failed and the log does not say why

A missing or mismatched fixture produces one of two shapes in the terminal, and which one you get
depends on the test rather than on holodeck.

A test that lets the request error escape prints the request.

```
💥 Fail Unexpected Test Failure: [400 Bad Request] POST (cors) - https://localhost:7358/api/user/ops/bulk.create
```

A test that catches the error and asserts against it prints only the assertions that failed.

```
💥 Failed: 0ms #56 Integration | json-api Cache.put(<ErrorDocument>):Useful errors are propagated
	✅ Pass The error is an AggregateError
	💥 Fail The error message is correct
	💥 Fail The error status is correct
```

:::warning The useful message never reaches the terminal
Holodeck answers a missing fixture with a `MOCK_NOT_FOUND` payload naming the exact file it looked
for. That payload is an HTTP response body. It does not appear in the terminal, and it does not
appear in CI logs. Searching a failed CI run for `MOCK_NOT_FOUND` finds nothing.
:::

Use the test id instead. Diagnostic prints it with every failure.

```
open test locally: https://localhost:7357?testId=546c9e3a
```

That id is the fixture directory. Look in `.mock-cache/546c9e3a/` and you are in the right place.
Open the printed URL to run the one test in a browser, then read the failed request in the network
panel to get the full explanation.

```
{"errors":[{"status":"400","code":"MOCK_NOT_FOUND","title":"Mock not found",
"detail":"No meta was found for GET https://localhost:7358/users/999?__xTestId=deadbeef&__xTestRequestNumber=0.
The expected cacheKey was /path/to/tests/json-api/.mock-cache/deadbeef/GET::users_999::0/res.
You may need to record a mock for this request."}]}
```

Compare the `cacheKey` in that message against what is on disk. The part that differs tells you
which half of the mock is wrong.

- The directory is missing entirely. The fixture was never committed, or you are running in replay
  mode against a test you have not recorded yet.
- The URL segment differs. The mock URL and the request URL are not the same string. Query
  encoding is the usual cause. See
  [Write the URL the way the server will see it](./writing-mocks.md#write-the-url-the-way-the-server-will-see-it).
- The trailing number differs. The test made more requests to that URL than it declared mocks for,
  or declared them in a different order.
- The file name is a hash rather than `res`, and no file of that name exists. The `body` option and
  the real request body are not the same string. Open the recorded `.meta.json` and look at
  `requestBody`. A correctly recorded body-matched mock stores an escaped JSON **string**. An
  object there means someone passed an object literal to the mock.

## The test id is missing

```
MockServerHandler is not configured with a testId. Use setTestId to set the testId for each test
```

Holodeck looks the test up by object identity, and it was handed an object it does not know.

Check three things in this order. The global hooks that call `setTestId` are installed. The object
passed to `new MockServerHandler(...)` is the same test context `setTestId` received. The test body
is a `function` rather than an arrow function, so `this` is the test context at all.

```
Cannot call "mock" before configuring a testId. Use setTestId to set the testId for each test
```

Same cause, reported from a mock helper instead of from the request handler.

```
MockServerHandler is already configured with a testId.
```

`setTestId` ran twice for one test context. A second `setupGlobalHooks` block or a stray per-test
call is the usual reason.

## The request never reached the handler

```
MISSING_X_TEST_ID_HEADER
```

The server received a request carrying no test id, which means the request did not go through
`MockServerHandler`.

The message names a header. Holodeck sends the test id as the `__xTestId` query parameter instead,
so adding a header does not help. Put the handler in the chain ahead of `Fetch`, and check that the
code under test goes through that `RequestManager` rather than calling `fetch` directly.

## The certificate is missing

```
error: SSL certificate or key not found, you may need to run `pnpm dlx @warp-drive/holodeck ensure-cert`
      at getCertInfo (.../@warp-drive/diagnostic/server/index.js:41:17)
```

Both `@warp-drive/diagnostic` and holodeck serve over TLS, and both read the same certificate.
Diagnostic starts first, so this is usually the first thing a machine without a certificate hits,
and holodeck's banner never prints. Run the certificate step from
[Setting up holodeck](./setup.md#trust-a-local-certificate).

Holodeck looks for `HOLODECK_SSL_CERT_PATH` and `HOLODECK_SSL_KEY_PATH`, and falls back to
`$HOME/holodeck-localhost.pem` and `$HOME/holodeck-localhost-key.pem` when they are unset. The
fallback is announced, not an error.

```
HOLODECK_SSL_CERT_PATH was not found in the current environment. Setting it to default value of /Users/you/holodeck-localhost.pem
```

A run that prints those two lines and then serves normally is fine. Set the variables only when
the certificate lives somewhere other than your home directory.

```
Unable to determine configuration file for shell: /usr/bin/zsh. Manual SSL Cert Setup Required for Holodeck.
```

`ensure-cert` writes its variables into a shell profile, and it recognises `bash`, `zsh`, and
`fish` at a fixed set of paths only. Anything else stops here, including a Homebrew shell, most
Linux shell paths, and Windows. Do the same work by hand.

```sh
mkcert -install
mkcert -key-file "$HOME/holodeck-localhost-key.pem" -cert-file "$HOME/holodeck-localhost.pem" localhost
```

Because holodeck falls back to those two paths, writing the pair there is enough on its own. Export
the variables only if you put the files elsewhere.

A failure from `mkcert` itself, rather than from holodeck, means `mkcert` is not installed.
`ensure-cert` does not check for it first.

## The suite starts and then times out

```
ENOENT: no such file or directory, open '/path/to/tests/json-api/dist-test/index.html'
⚠️  Diagnostic Watchdog: No browser reported in within 45s of launch. Assuming a hung browser and exiting.
```

The test bundle was never built. The watchdog message arrives 45 seconds later and describes a
symptom, so read upward for the `ENOENT` line. Run the suite through the command that builds
first, which at this repository's root is `pnpm test`.

## The server did not start

```
Holodeck server failed to start
Could not determine Holodeck server port
```

Under Bun, holodeck starts the Node server as a child process and reads the port back out of that
child's output. Both messages mean the child never printed the line carrying it. Run again with the
child's output visible. A crash on startup, a certificate error, or an occupied port all surface
there.

## The port was taken

Holodeck binds the port it is given and never picks another, because the browser works out the mock
server's URL by adding one to the test server's port. A conflict retries the same port a few times
and then fails.

Stop whatever holds the port. A test run that was killed rather than shut down is the usual
culprit.

## Launched from the wrong directory

```
Package name not found in package.json
```

`launchProgram` reads `package.json` from the current working directory, and writes `.mock-cache`
there too. Start the test runner from the test app's own directory.

## Related

- [Setting up holodeck](./setup.md)
- [Recording and replaying](./record-and-replay.md)
