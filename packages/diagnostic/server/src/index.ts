/* eslint-disable @typescript-eslint/require-await */
import type { ServerType } from '@hono/node-server';
import { serve } from '@hono/node-server';
import { createNodeWebSocket } from '@hono/node-ws';
import type { Context } from 'hono';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import type { ChildProcess } from 'node:child_process';
import fs from 'node:fs';
import { createServer as createHttpServer } from 'node:http';
import { createSecureServer } from 'node:http2';
import { homedir } from 'node:os';
import path from 'node:path';
import { styleText } from 'node:util';

import type { LaunchConfig } from './-private/default-setup.ts';
import { launchDefaults } from './-private/default-setup.ts';
import { handleFetch } from './-private/serve/fetch.ts';
import { launchBrowsers } from './-private/serve/launch-browser.ts';
import { buildHandler } from './-private/serve/socket-handler.ts';
import { addCloseHandler } from './-private/serve/watch.ts';
import { startWatchdog } from './-private/serve/watchdog.ts';
import { debug, error, loggingIsEnabled, print } from './-private/utils/debug.ts';
import { getPort } from './-private/utils/port.ts';

async function getCertInfo() {
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

export interface LaunchState {
  browserId: number;
  lastBrowserId: number | null;
  windowId: number;
  lastWindowId: number | null;
  port: number;
  hostname: string;
  protocol: string;
  started: boolean;
  browsers: Map<
    string,
    {
      launcher: string;
      proc: ChildProcess;
    }
  >;
  completed: number;
  expected: number;
  closeHandlers: Array<() => void | Promise<void>>;
  safeCleanup: () => Promise<void>;
  server: ServerType;
  lastMessageAt: number | null;
}

export interface ServeOptions {
  port: number;
  hostname: string;
  tls?: {
    key: string;
    cert: string;
  };
}

export async function launch(config: Partial<LaunchConfig>) {
  const resolvedConfig = launchDefaults(config);

  const { checkPort } = await import('./-private/serve/port.ts');
  const hostname = resolvedConfig.hostname ?? 'localhost';
  const protocol = resolvedConfig.protocol ?? 'https';
  let { port, release } = await getPort(resolvedConfig, checkPort);
  // Belt-and-suspenders: if the process dies without running through
  // state.safeCleanup (uncaught exception, hard kill, etc.), still release
  // the port lock synchronously on exit so it doesn't leak as "stale" for
  // longer than necessary (port-lock.ts also self-heals via PID liveness
  // checks, but there's no reason to wait on that when we can clean up
  // eagerly).
  process.on('exit', () => release());

  const serveOptions: ServeOptions = {
    port,
    hostname,
  };

  const state = {
    browserId: 42,
    lastBrowserId: null,
    windowId: 0,
    lastWindowId: null,
    port,
    hostname,
    protocol,
    started: false,
    browsers: new Map(),
    completed: 0,
    expected: resolvedConfig.parallel ?? 1,
    closeHandlers: [],
    safeCleanup: () => Promise.resolve(),
    server: null as unknown as ServerType,
    lastMessageAt: null,
  } as LaunchState;

  async function runCloseHandler(handler: () => void | Promise<void>) {
    try {
      await handler();
    } catch (e) {
      error(`Error in close handler: ${String(e instanceof Error ? e.message : e)}`);
    }
  }

  state.safeCleanup = async () => {
    debug(`Running close handlers`);
    const promises = [];
    for (const handler of state.closeHandlers) {
      promises.push(runCloseHandler(handler));
    }
    await Promise.allSettled(promises);
    debug(`All close handlers completed`);
  };

  // Ensure a SIGINT/SIGTERM/SIGQUIT actually terminates the process. The
  // per-handler listeners registered via addCloseHandler (see serve/watch.ts)
  // run their individual cleanup callbacks but never call process.exit(),
  // so without this an external `timeout`/SIGTERM can leave the process
  // (and any still-open handles) running indefinitely.
  let terminating = false;
  async function handleTerminationSignal(signal: string) {
    if (terminating) return;
    terminating = true;
    error(`Received ${signal}, cleaning up and exiting`);
    await state.safeCleanup();
    // eslint-disable-next-line n/no-process-exit
    process.exit(1);
  }
  process.on('SIGINT', () => void handleTerminationSignal('SIGINT'));
  process.on('SIGTERM', () => void handleTerminationSignal('SIGTERM'));
  process.on('SIGQUIT', () => void handleTerminationSignal('SIGQUIT'));

  addCloseHandler(state, () => release());

  if (protocol === 'https') {
    if (!resolvedConfig.key && !resolvedConfig.cert) {
      const info = await getCertInfo();
      resolvedConfig.key = info.KEY_PATH;
      resolvedConfig.cert = info.CERT_PATH;
      serveOptions.tls = {
        key: info.KEY,
        cert: info.CERT,
      };
    } else {
      serveOptions.tls = {
        key: fs.readFileSync(resolvedConfig.key!, 'utf8'),
        cert: fs.readFileSync(resolvedConfig.cert!, 'utf8'),
      };
    }

    if (!resolvedConfig.key) throw new Error(`Missing key for https protocol`);
    if (!resolvedConfig.cert) throw new Error(`Missing cert for https protocol`);
  }

  try {
    const app = new Hono();
    if (loggingIsEnabled()) {
      app.use(logger());
    }
    if (resolvedConfig.useCors) {
      app.use(
        '*',
        cors({
          origin: (origin) =>
            origin.startsWith('http://localhost:') || origin.startsWith('https://localhost:') ? origin : '*',
          allowHeaders: ['Accept', 'Content-Type'],
          allowMethods: ['GET', 'HEAD', 'OPTIONS', 'PUT', 'POST', 'DELETE', 'PATCH'],
          exposeHeaders: ['Content-Length', 'Content-Type'],
          maxAge: 60_000,
          credentials: false,
        })
      );
    }

    // setup Diagnostic's WebSocket channel
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app });
    app.get('/ws', upgradeWebSocket(buildHandler(resolvedConfig, state)));

    // setup the static asset server and proxy
    app.all('*', (req: Context) => {
      return handleFetch(resolvedConfig, state, req);
    });

    // The lock in port-lock.ts prevents two of our own processes from
    // racing for the same pair, but it can't account for a port held by
    // something outside that convention (a leftover process from a prior
    // run that hasn't exited yet, an unrelated local service, etc). Retry
    // against a fresh, freshly-locked port pair a few times before giving
    // up, rather than crashing on the first collision.
    //
    // Unlike Bun.serve() (which throws synchronously on EADDRINUSE),
    // @hono/node-server's serve() wraps node's http(2) server, whose
    // .listen() reports a bind failure asynchronously via an 'error' event,
    // so the retry loop has to await that event rather than a thrown error.
    function bindServer(bindPort: number, bindHostname: string): Promise<ServerType> {
      return new Promise<ServerType>((resolve, reject) => {
        const s =
          protocol === 'https'
            ? serve(
                {
                  overrideGlobalObjects: true,
                  fetch: app.fetch,
                  serverOptions: {
                    ...serveOptions.tls,
                    // Allow HTTP/1.1 fallback for ALPN negotiation
                    allowHTTP1: true,
                  },
                  createServer: createSecureServer,
                  port: bindPort,
                  hostname: bindHostname,
                },
                () => resolve(s)
              )
            : serve(
                {
                  overrideGlobalObjects: true,
                  fetch: app.fetch,
                  createServer: createHttpServer,
                  port: bindPort,
                  hostname: bindHostname,
                },
                () => resolve(s)
              );
        s.once('error', reject);
      });
    }

    const MAX_BIND_ATTEMPTS = 5;
    let server: ServerType;
    for (let attempt = 1; ; attempt++) {
      try {
        server = await bindServer(port, hostname);
        break;
      } catch (e) {
        if ((e as NodeJS.ErrnoException).code !== 'EADDRINUSE' || attempt >= MAX_BIND_ATTEMPTS) {
          throw e;
        }
        debug(`Port ${port} became unavailable before bind, picking a new port pair (attempt ${attempt})`);
        release();
        ({ port, release } = await getPort({ ...resolvedConfig, port: 0, defaultPort: port + 2 }, checkPort));
        state.port = port;
        serveOptions.port = port;
      }
    }
    injectWebSocket(server);

    state.server = server;

    addCloseHandler(state, () => {
      debug(`Diagnostic Shutting Down`);
      state.browsers?.forEach((browser) => {
        browser.proc.kill();
      });
      state.server.close();
      debug(`Diagnostic Complete`);
    });

    resolvedConfig.reporter.serverConfig = {
      port,
      hostname,
      protocol,
      url: `${protocol}://${hostname}:${port}`,
    };

    if (resolvedConfig.setup) {
      print(
        styleText(
          'magenta',
          `Preparing Server on ${styleText('white', protocol + '://' + hostname + ':')}${styleText('magenta', String(port))}`
        )
      );

      debug(`Running configured setup hook`);

      const additionalConfig = await resolvedConfig.setup({
        port,
        hostname,
        protocol,
      });
      if (additionalConfig?.proxy) {
        resolvedConfig.proxy = {
          ...resolvedConfig.proxy,
          ...additionalConfig.proxy,
        };
      }
      debug(`Configured setup hook completed`);
    }
    if (resolvedConfig.cleanup) {
      addCloseHandler(state, async () => {
        debug(`Running configured cleanup hook`);
        await resolvedConfig.cleanup();
        debug(`Configured cleanup hook completed`);
      });
    }

    print(
      styleText(
        'magenta',
        `🚀 Serving Diagnostic Tests on ${styleText('white', protocol + '://' + hostname + ':')}${styleText('yellow', String(port))}`
      )
    );

    if (resolvedConfig.proxy) {
      print(styleText('white', `   Proxy Configuration:`));
      for (const [context, target] of Object.entries(resolvedConfig.proxy)) {
        print(`\t${styleText('cyan', context)} => ${styleText('green', target)}`);
      }
    }
    print('\n');

    if (!resolvedConfig.noLaunch) {
      await launchBrowsers(resolvedConfig, state);

      // `config.serve` is the long-running dev-server/watch mode, where a
      // browser sitting idle between edits is expected, not a hang.
      if (!resolvedConfig.serve) {
        startWatchdog(resolvedConfig, state);
      }
    }
  } catch (e) {
    error(`Error: ${String(e instanceof Error ? e.message : e)}`);
    await state.safeCleanup();
    throw e;
  }
}
