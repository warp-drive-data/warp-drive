import { watch } from 'node:fs';

type CloseHandler = () => void | Promise<void>;

export function addCloseHandler(state: { closeHandlers: CloseHandler[] }, cb: CloseHandler) {
  state.closeHandlers.push(createCloseHandler(cb));
}

// The signal and exit paths cannot wait on a promise, but the returned
// handler is awaited by state.safeCleanup, so it must hand the promise back
// or an async callback's work after its first await is silently dropped.
function createCloseHandler(cb: CloseHandler): CloseHandler {
  let executed = false;

  process.on('SIGINT', () => {
    if (executed) return;
    executed = true;
    void cb();
  });

  process.on('SIGTERM', () => {
    if (executed) return;
    executed = true;
    void cb();
  });

  process.on('SIGQUIT', () => {
    if (executed) return;
    executed = true;
    void cb();
  });

  process.on('exit', () => {
    if (executed) return;
    executed = true;
    void cb();
  });

  return () => {
    if (executed) return;
    executed = true;
    return cb();
  };
}

export function watchAssets(
  state: { closeHandlers: CloseHandler[] },
  directory: string,
  onAssetChange: (event: string, filename: string | null) => void
) {
  const watcher = watch(directory, { recursive: true }, (event, filename) => {
    onAssetChange(event, filename);
  });

  addCloseHandler(state, () => {
    watcher.close();
  });
}
