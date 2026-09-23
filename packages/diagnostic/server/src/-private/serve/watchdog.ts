import type { LaunchState } from '../../index.ts';
import type { LaunchConfig } from '../default-setup.ts';
import { error } from '../utils/debug.ts';

// individual tests are only considered "hung" by the reporter after this long
// (see DEFAULT_TEST_TIMEOUT in reporters/default.ts), so the disconnect watchdog
// must stay well above it or it will kill legitimately slow (not hung) tests.
const MIN_DISCONNECT_TIMEOUT_MS = 63_000;

/**
 * Guards against a launched browser (or its underlying process) that never
 * reports in, or that stops reporting in entirely partway through a run.
 * Without this, a wedged browser process (e.g. one stuck on a native call
 * that never returns) hangs the parent process forever, since the only
 * normal exit path requires a `suite-finish` message from every browser.
 *
 * Returns a function that stops the watchdog once no longer needed.
 */
export function startWatchdog(config: LaunchConfig, state: LaunchState): () => void {
  const startTimeoutMs = config.browserStartTimeout * 1000;
  const disconnectTimeoutMs = Math.max(config.browserDisconnectTimeout * 1000, MIN_DISCONNECT_TIMEOUT_MS);
  const launchedAt = Date.now();

  const timer = setInterval(() => {
    const since = Date.now() - (state.lastMessageAt ?? launchedAt);
    const hasStarted = Boolean(state.started);
    const timeout = hasStarted ? disconnectTimeoutMs : startTimeoutMs;

    if (since > timeout) {
      stop();
      const reason = hasStarted
        ? `No messages received from any browser for over ${Math.round(disconnectTimeoutMs / 1000)}s`
        : `No browser reported in within ${Math.round(startTimeoutMs / 1000)}s of launch`;

      // use console.error directly: this must be visible in CI even when
      // the DEBUG env var isn't set, since the debug()/error() helpers are
      // silent unless their namespace is explicitly enabled.
      console.error(`\n\n⚠️  Diagnostic Watchdog: ${reason}. Assuming a hung browser and exiting.\n`);
      console.error(describeState(state));
      error(reason);

      void state.safeCleanup().finally(() => {
        // eslint-disable-next-line n/no-process-exit
        process.exit(1);
      });
    }
  }, 1000);
  timer.unref?.();

  function stop() {
    clearInterval(timer);
  }

  return stop;
}

export function describeState(state: LaunchState): string {
  const browsers = [...state.browsers.entries()].map(([id, b]) => {
    const status = b.exit
      ? `exited code=${b.exit.code} signal=${b.exit.signal}`
      : b.proc.exitCode === null && b.proc.signalCode === null
        ? 'running'
        : `exited code=${b.proc.exitCode} signal=${b.proc.signalCode}`;
    return `${b.launcher}#${id} pid=${b.proc.pid} ${status}`;
  });
  return [
    `   connections: ${state.connections} tcp, ${state.handshakes} tls handshakes`,
    `   requests served: ${state.requests}`,
    `   websocket connections: ${state.sockets}`,
    `   server events: ${state.serverEvents.length ? state.serverEvents.join('; ') : 'none'}`,
    `   browsers: ${browsers.join('; ') || 'none'}`,
  ].join('\n');
}
