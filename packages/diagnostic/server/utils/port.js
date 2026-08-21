import { DEFAULT_PORT, MAX_PORT_TRIES } from './const.js';
import { debug } from './debug.js';
import { acquirePortPair, releasePortPair } from './port-lock.js';

/**
 * Verifies (via the supplied TCP-level `checkPort`) that both `port` and
 * `port + 1` are free. This is a secondary, best-effort check on top of the
 * filesystem lock in port-lock.js -- it catches ports held by processes that
 * aren't participating in our lock convention (e.g. an unrelated local dev
 * server), but on its own it is not race-free, since checking a port and
 * binding to it are two separate operations. The lock is what actually
 * prevents two of *our* concurrently-starting processes from colliding.
 */
async function pairIsFree(port, checkPort) {
  return (await checkPort(port)) && (await checkPort(port + 1));
}

async function discoverPortPair(defaultPort, checkPort) {
  debug(`Discovering an available port pair starting from default port of ${defaultPort}`);
  let port = defaultPort;

  for (let i = 0; i < MAX_PORT_TRIES; i++) {
    if (acquirePortPair(port)) {
      if (await pairIsFree(port, checkPort)) {
        return port;
      }
      // TCP-level check failed even though we hold the lock -- something
      // outside our lock convention is using one of these ports. Release
      // and keep searching.
      releasePortPair(port);
    }
    port++;
  }

  throw new Error(`Could not find an available port pair in the range ${defaultPort} to ${port}`);
}

/**
 * Resolves the port a diagnostic server should bind to, returning both the
 * chosen port and a `release()` callback the caller must invoke once the
 * server (and its holodeck companion on port + 1, if any) are done with it.
 */
export async function getPort(config, checkPort) {
  if (typeof config.port === 'number') {
    if (config.port < 0 || config.port > 65535) {
      throw new Error(`Invalid port number: ${config.port}`);
    } else if (config.port === 0) {
      debug('Port is set to 0, discovering available port pair');
      const port = await discoverPortPair(config.defaultPort || DEFAULT_PORT, checkPort);
      return { port, release: () => releasePortPair(port) };
    } else {
      if (!acquirePortPair(config.port) || !(await pairIsFree(config.port, checkPort))) {
        releasePortPair(config.port);
        throw new Error(`Port ${config.port} (or ${config.port + 1}) is not available`);
      }
      return { port: config.port, release: () => releasePortPair(config.port) };
    }
  } else {
    debug(`Port is not set, discovering available port pair`);
    const port = await discoverPortPair(config.defaultPort || DEFAULT_PORT, checkPort);
    return { port, release: () => releasePortPair(port) };
  }
}
