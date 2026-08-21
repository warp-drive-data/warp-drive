import crypto from 'node:crypto';
import fs from 'node:fs';
import zlib from 'node:zlib';
import { homedir } from 'os';
import path from 'path';

export async function getCertInfo() {
  let CERT_PATH = process.env.HOLODECK_SSL_CERT_PATH;
  let KEY_PATH = process.env.HOLODECK_SSL_KEY_PATH;

  if (!CERT_PATH) {
    CERT_PATH = path.join(homedir(), 'holodeck-localhost.pem');
    process.env.HOLODECK_SSL_CERT_PATH = CERT_PATH;

    console.log(
      `HOLODECK_SSL_CERT_PATH was not found in the current environment. Setting it to default value of ${CERT_PATH}`
    );
  }

  if (!KEY_PATH) {
    KEY_PATH = path.join(homedir(), 'holodeck-localhost-key.pem');
    process.env.HOLODECK_SSL_KEY_PATH = KEY_PATH;

    console.log(
      `HOLODECK_SSL_KEY_PATH was not found in the current environment. Setting it to default value of ${KEY_PATH}`
    );
  }

  if (!fs.existsSync(CERT_PATH) || !fs.existsSync(KEY_PATH)) {
    throw new Error(
      'SSL certificate or key not found, you may need to run `pnpm dlx @warp-drive/holodeck ensure-cert`'
    );
  }

  return {
    CERT_PATH,
    KEY_PATH,
    CERT: fs.readFileSync(CERT_PATH, 'utf8'),
    KEY: fs.readFileSync(KEY_PATH, 'utf8'),
  };
}

export const DEFAULT_PORT = 1135;
export const BROTLI_OPTIONS = {
  params: {
    [zlib.constants.BROTLI_PARAM_MODE]: zlib.constants.BROTLI_MODE_TEXT,
    // brotli currently defaults to 11 but lets be explicit
    [zlib.constants.BROTLI_PARAM_QUALITY]: zlib.constants.BROTLI_MAX_QUALITY,
  },
};
export function compress(code) {
  return zlib.brotliCompressSync(code, BROTLI_OPTIONS);
}

/**
 * removes the protocol, host, and port from a url
 */
export function getNiceUrl(url) {
  const urlObj = new URL(url);
  urlObj.searchParams.delete('__xTestId');
  urlObj.searchParams.delete('__xTestRequestNumber');
  const params = urlObj.searchParams.toString();
  return (urlObj.pathname + (params ? `?${params}` : '')).slice(1);
}

/*
{
  projectRoot: string;
  testId: string;
  url: string;
  method: string;
  body: string;
  testRequestNumber: number
}
*/
export function generateFilepath(options) {
  const { body } = options;
  const bodyHash = body ? crypto.createHash('md5').update(JSON.stringify(body)).digest('hex') : null;
  const cacheDir = generateFileDir(options);
  return `${cacheDir}/${bodyHash ? bodyHash : 'res'}`;
}

/*
 Generate a human scannable file name for the test assets to be stored in,
 the `.mock-cache` directory should be checked-in to the codebase.
*/
export function generateFileDir(options) {
  const { projectRoot, testId, url, method, testRequestNumber } = options;
  const normalizedUrl = url.startsWith('/') ? url.slice(1) : url;
  // make path look nice but not be a sub-directory
  // using alternative `/`-like characters would be nice but results in odd encoding
  // on disk path
  const pathUrl = normalizedUrl.replaceAll('/', '_');
  return `${projectRoot}/.mock-cache/${testId}/${method}::${pathUrl}::${testRequestNumber}`;
}

export function createCloseHandler(cb) {
  let executed = false;

  process.on('SIGINT', () => {
    if (executed) return;
    executed = true;
    cb();
  });

  process.on('SIGTERM', () => {
    if (executed) return;
    executed = true;
    cb();
  });

  process.on('SIGQUIT', () => {
    if (executed) return;
    executed = true;
    cb();
  });

  process.on('exit', () => {
    if (executed) return;
    executed = true;
    cb();
  });

  return () => {
    if (executed) return;
    executed = true;
    cb();
  };
}

/**
 * Binds a server created by `createServerFn()`, retrying on the same port if
 * it's already in use.
 *
 * Holodeck's port is never renegotiated on conflict -- every test app's
 * client-side test-helper derives holodeck's URL as `window.location.port +
 * 1` (the diagnostic server's own port, plus one), so holodeck must bind
 * exactly the port it was asked for or the browser can never find it.
 * Instead, this retries the *same* port a few times with a short delay, to
 * ride out the narrow window where a concurrently-starting sibling process's
 * diagnostic server hasn't released this exact port yet (see
 * packages/diagnostic/server/utils/port-lock.js for the reservation scheme
 * that's supposed to prevent that from happening at all -- this is a
 * defense-in-depth fallback for anything outside that convention).
 *
 * `createServerFn` must synchronously create the server and start binding,
 * returning the server instance. Some implementations (Bun.serve) throw
 * synchronously on a bind failure; others (Node's http/http2 `.listen()`,
 * which is what @hono/node-server uses under the hood) bind asynchronously
 * and emit an 'error' event on the returned server instead of throwing. This
 * handles both.
 */
export async function bindWithRetry(createServerFn, { maxAttempts = 5, retryDelayMs = 150 } = {}) {
  for (let attempt = 1; ; attempt++) {
    try {
      const server = createServerFn();
      if (typeof server?.on !== 'function') {
        // no event emitter to observe an async bind failure on -- the
        // synchronous creation above already succeeded, so assume the bind
        // did too (this is the Bun.serve path, which throws synchronously
        // instead)
        return server;
      }
      const bindError = await new Promise((resolve) => {
        const onError = (e) => resolve(e);
        server.once('error', onError);
        setTimeout(() => {
          server.off('error', onError);
          resolve(null);
        }, retryDelayMs);
      });
      if (!bindError) {
        return server;
      }
      throw bindError;
    } catch (e) {
      if (e?.code !== 'EADDRINUSE' || attempt >= maxAttempts) {
        throw e;
      }
      console.log(`\tPort in use, retrying bind (attempt ${attempt}/${maxAttempts})...`);
      await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
    }
  }
}
