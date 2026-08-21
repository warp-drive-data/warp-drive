import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { debug } from './debug.js';

// Every test app's client-side test-helper derives holodeck's URL as
// `window.location.port + 1` (see e.g. tests/*/tests/test-helper.{js,ts}),
// so a diagnostic server on port N always needs its holodeck companion on
// port N + 1. A bare TCP check-then-bind for N is not enough to make that
// pairing safe: many packages' test suites start concurrently (turbo running
// multiple packages' `test` tasks at once), and the gap between diagnostic
// binding N and holodeck binding N + 1 (which happens later, after cert
// setup) is wide enough for a sibling process's own port discovery to see
// "N + 1 is free" and claim it as *its* diagnostic port first.
//
// This lock closes that gap with a filesystem-based mutex: before any
// process attempts to bind a port pair, it must atomically reserve both
// ports here. Only one process can hold a given port's lock file at a time
// (`fs.openSync(path, 'wx')` is atomic create-if-not-exists), so no two
// concurrent processes can ever be handed overlapping port pairs.
const LOCK_DIR = path.join(os.tmpdir(), 'warp-drive-diagnostic-port-locks');

function lockPathFor(port) {
  return path.join(LOCK_DIR, `${port}.lock`);
}

function isPidAlive(pid) {
  if (!Number.isInteger(pid)) return false;
  try {
    // signal 0 does not kill the process, it just probes whether it exists
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

/** Reclaim a lock file left behind by a process that died without cleanup. */
function clearIfStale(lockPath) {
  let heldBy;
  try {
    heldBy = Number(fs.readFileSync(lockPath, 'utf8').trim());
  } catch {
    // lock file vanished between our EEXIST and this read -- treat as cleared
    return true;
  }
  if (isPidAlive(heldBy)) {
    return false;
  }
  try {
    fs.rmSync(lockPath, { force: true });
    debug(`Reclaimed stale port lock at ${lockPath} (owning pid ${heldBy} is no longer running)`);
    return true;
  } catch {
    return false;
  }
}

function tryAcquireOne(port) {
  fs.mkdirSync(LOCK_DIR, { recursive: true });
  const lockPath = lockPathFor(port);

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const fd = fs.openSync(lockPath, 'wx');
      fs.writeSync(fd, String(process.pid));
      fs.closeSync(fd);
      return true;
    } catch (e) {
      if (e.code !== 'EEXIST') throw e;
      if (attempt === 0 && clearIfStale(lockPath)) {
        continue; // stale lock cleared, try to claim it once more
      }
      return false;
    }
  }
  return false;
}

function releaseOne(port) {
  const lockPath = lockPathFor(port);
  try {
    const heldBy = Number(fs.readFileSync(lockPath, 'utf8').trim());
    if (heldBy === process.pid) {
      fs.rmSync(lockPath, { force: true });
    }
  } catch {
    // already gone -- nothing to release
  }
}

/**
 * Attempts to atomically reserve the pair [port, port + 1] for this process.
 * Returns true on success. On failure (either port already locked by a live
 * process), releases any partial reservation and returns false so the caller
 * can move on to the next candidate port.
 */
export function acquirePortPair(port) {
  if (!tryAcquireOne(port)) {
    return false;
  }
  if (!tryAcquireOne(port + 1)) {
    releaseOne(port);
    return false;
  }
  return true;
}

export function releasePortPair(port) {
  releaseOne(port);
  releaseOne(port + 1);
}
