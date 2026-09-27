import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer, type OutgoingHttpHeaders } from 'node:http';
import type { AddressInfo } from 'node:net';
import { join, resolve } from 'node:path';
import { pipeline } from 'node:stream';
import { styleText } from 'node:util';

const FIXTURES_LOCATION = join(import.meta.dirname, '../fixtures/generated');

// usage: index.mts [dist] [-p <port>]
//   dist  directory holding the brotli-compressed build, resolved against the
//         package directory unless absolute (default: dist)
//   port  port to listen on; 0 picks a free one (default: 9999)
const args = process.argv.slice(2);
const portFlag = args.indexOf('-p');
const positional = args.filter((_arg, index) => portFlag === -1 || (index !== portFlag && index !== portFlag + 1));
const dist = resolve(import.meta.dirname, '..', positional[0] ?? 'dist');
const rawPort = portFlag === -1 ? '9999' : args[portFlag + 1];
const port = Number(rawPort);
if (rawPort === undefined || rawPort.trim() === '' || !Number.isInteger(port) || port < 0 || port > 65535) {
  console.error(
    styleText('red', `Invalid port for -p: ${rawPort ?? '(missing)'}. Expected an integer from 0 to 65535.`)
  );
  process.exit(1);
}

/**
 * Resolves the size of a regular file, or null if there is no such file.
 */
async function fileSize(filePath: string): Promise<number | null> {
  try {
    const stats = await stat(filePath);
    return stats.isFile() ? stats.size : null;
  } catch {
    return null;
  }
}

async function resolveFile(url: string): Promise<{ filePath: string; size: number } | null> {
  const { pathname } = new URL(url, 'http://localhost');
  let filePath = '';
  let fileName = '';

  if (pathname.includes('/fixtures/')) {
    fileName = pathname.split('/fixtures')[1];
    filePath = join(FIXTURES_LOCATION, fileName + '.br');
  } else {
    fileName = pathname;
    filePath = join(dist, fileName === '/' ? '/index.html.br' : fileName + '.br');
  }

  let size = await fileSize(filePath);
  // Missing scripts, stylesheets and fixtures are errors, not app routes: falling
  // back to index.html for them would let a benchmark measure a broken page.
  if (size === null && (fileName === '/' || /\.(js|css|json)$/.test(fileName))) {
    return null;
  } else if (size === null) {
    filePath = join(dist, '/index.html.br');
    size = await fileSize(filePath);
  }

  return size === null ? null : { filePath, size };
}

const server = createServer(async (request, response) => {
  try {
    const file = await resolveFile(request.url ?? '/');

    if (!file) {
      // console.log(styleText('red', `File not found: ${request.url}`));
      response.writeHead(404, { 'Content-Type': 'text/plain' });
      response.end('Not Found');
      return;
    }

    const { filePath, size } = file;
    // prettier-ignore
    const mimeType = filePath.endsWith('.html.br') ? 'text/html'
      : filePath.endsWith('.js.br') ? 'application/javascript'
      : filePath.endsWith('.css.br') ? 'text/css'
      : filePath.endsWith('.json.br') ? 'application/json'
      : filePath.endsWith('.svg.br') ? 'image/svg+xml'
      : filePath.endsWith('.png.br') ? 'image/png'
      : filePath.endsWith('.jpg.br') ? 'image/jpeg'
      : 'text/plain';

    const headers: OutgoingHttpHeaders = {
      // We always compress the response. It is streamed with a known length,
      // so no `Transfer-Encoding: chunked` (Node rejects it alongside Content-Length).
      'Content-Encoding': 'br',
      // we don't cache since tests will often reuse similar urls for different payload
      'Cache-Control': 'max-age=31536000, public',
      'Content-Length': String(size),
      'Content-Type': mimeType,
    };

    // console.log(styleText('green', `\tServing: ${filePath}`));
    response.writeHead(200, headers);
    // pipeline destroys the file stream when the client aborts, so aborted
    // requests don't leak file descriptors over a long benchmark run.
    pipeline(createReadStream(filePath), response, (error) => {
      if (error && (error as NodeJS.ErrnoException).code !== 'ERR_STREAM_PREMATURE_CLOSE') {
        console.error(styleText('red', `Failed to serve ${filePath}: ${error.message}`));
      }
    });
  } catch (error) {
    console.error(error);
    if (!response.headersSent) response.writeHead(500, { 'Content-Type': 'text/plain' });
    response.end('Internal Server Error');
  }
});

server.listen(port, () => {
  const { port: boundPort } = server.address() as AddressInfo;
  console.log(
    styleText(
      'gray',
      `Application running at ${styleText('yellow', 'http://') + styleText('cyan', 'localhost') + styleText('yellow', `:${boundPort}`)}`
    )
  );
});
