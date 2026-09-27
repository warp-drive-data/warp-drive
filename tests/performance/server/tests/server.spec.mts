#!/usr/bin/env node
/**
 * Black-box spec for the static server tracerbench boots in `perf-check.yml`:
 *
 *   pnpm --filter performance-test-app start dist-experiment -p 4201
 *
 * The server is started through the package's own `start` script, so this spec
 * checks whatever runtime that script uses.
 */
import assert from 'node:assert/strict';
import { type ChildProcess, spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { type AddressInfo, createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { dirname, join, relative } from 'node:path';
import { after, before, describe, test } from 'node:test';
import { brotliCompressSync, brotliDecompressSync } from 'node:zlib';

const PACKAGE_DIR = join(import.meta.dirname, '../..');
const FIXTURES_DIR = join(PACKAGE_DIR, 'fixtures/generated');
const STARTUP_TIMEOUT = 30_000;

const FILES = {
  'index.html': '<!doctype html><html><head><title>perf</title></head><body>perf app</body></html>',
  'assets/app.js': 'console.log("the perf app");\n'.repeat(50),
  'assets/style.css': 'body { color: rebeccapurple; }\n'.repeat(50),
};

function writeDist(): string {
  const dist = mkdtempSync(join(tmpdir(), 'perf-server-dist-'));
  for (const [name, content] of Object.entries(FILES)) {
    const file = join(dist, `${name}.br`);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, brotliCompressSync(content));
  }
  return dist;
}

function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const probe = createServer();
    probe.on('error', reject);
    probe.listen(0, () => {
      const { port } = probe.address() as AddressInfo;
      probe.close(() => resolve(port));
    });
  });
}

function startServer(distArg: string, port: number): Promise<ChildProcess> {
  // `pnpm start` runs the server behind a shell, so start it in its own process
  // group and signal the whole group when stopping it.
  const child = spawn('pnpm', ['start', distArg, '-p', String(port)], {
    cwd: PACKAGE_DIR,
    detached: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  return new Promise((resolve, reject) => {
    let output = '';
    const timer = setTimeout(() => {
      stopServer(child);
      reject(new Error(`server did not report it was running within ${STARTUP_TIMEOUT}ms:\n${output}`));
    }, STARTUP_TIMEOUT);
    const onData = (chunk: Buffer) => {
      output += chunk.toString();
      if (output.includes('Application running')) {
        clearTimeout(timer);
        resolve(child);
      }
    };
    child.stdout!.on('data', onData);
    child.stderr!.on('data', onData);
    child.once('exit', (code, signal) => {
      clearTimeout(timer);
      reject(new Error(`server exited early (code ${code}, signal ${signal}):\n${output}`));
    });
  });
}

function stopServer(child: ChildProcess): Promise<void> {
  if (child.exitCode !== null || child.signalCode !== null) return Promise.resolve();
  const exited = new Promise<void>((resolve) => child.once('exit', () => resolve()));
  try {
    process.kill(-child.pid!, 'SIGTERM');
  } catch {
    child.kill('SIGTERM');
  }
  return exited;
}

describe('performance-test-app static server', () => {
  let dist: string;
  let server: ChildProcess | undefined;
  let origin: string;

  before(async () => {
    dist = writeDist();
    const port = await freePort();
    origin = `http://localhost:${port}`;
    // the server resolves its first argument relative to the package directory
    server = await startServer(relative(PACKAGE_DIR, dist), port);
  });

  after(async () => {
    if (server) await stopServer(server);
    rmSync(dist, { recursive: true, force: true });
  });

  async function assertServes(
    path: string,
    file: string,
    contentType: string,
    expectedBody: string | Buffer
  ): Promise<void> {
    const response = await fetch(`${origin}${path}`);
    assert.equal(response.status, 200, `${path} status`);
    assert.equal(response.headers.get('content-type'), contentType, `${path} content-type`);
    assert.equal(response.headers.get('content-encoding'), 'br', `${path} content-encoding`);
    assert.equal(response.headers.get('cache-control'), 'max-age=31536000, public', `${path} cache-control`);
    assert.equal(response.headers.get('content-length'), String(statSync(file).size), `${path} content-length`);
    // fetch transparently decodes `Content-Encoding: br`
    assert.equal(await response.text(), expectedBody.toString(), `${path} body`);
  }

  test('serves index.html for /', async () => {
    await assertServes('/', join(dist, 'index.html.br'), 'text/html', FILES['index.html']);
  });

  test('serves compressed javascript', async () => {
    await assertServes(
      '/assets/app.js',
      join(dist, 'assets/app.js.br'),
      'application/javascript',
      FILES['assets/app.js']
    );
  });

  test('serves compressed css', async () => {
    await assertServes('/assets/style.css', join(dist, 'assets/style.css.br'), 'text/css', FILES['assets/style.css']);
  });

  test('serves generated fixtures from fixtures/generated', async () => {
    const file = join(FIXTURES_DIR, 'example-car.json.br');
    await assertServes(
      '/fixtures/example-car.json',
      file,
      'application/json',
      brotliDecompressSync(readFileSync(file))
    );
  });

  test('falls back to index.html for unknown routes', async () => {
    await assertServes('/some/route', join(dist, 'index.html.br'), 'text/html', FILES['index.html']);
  });

  test('responds 404 for missing scripts and stylesheets', async () => {
    for (const path of ['/missing.js', '/assets/missing.css']) {
      const response = await fetch(`${origin}${path}`);
      assert.equal(response.status, 404, `${path} status`);
      await response.arrayBuffer();
    }
  });
});
