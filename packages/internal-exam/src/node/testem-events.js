/**
 * Coordinates testem browser-socket events to implement `--load-balance`:
 * the server holds one shared queue of test modules, and each browser asks
 * for the next module as it finishes the previous one.
 *
 * Upstream ember-exam also supports `--replay-execution`/`--write-execution-
 * file`/`--write-module-metadata-file`; none of those are used by any script
 * in this repo (confirmed: `examine` only ever passes `--parallel`/
 * `--load-balance`), so this port omits them.
 */
export default class TestemEvents {
  constructor() {
    this._startedLaunchers = new Set();
    this._testModuleQueue = null;
    this._completedBrowsers = new Map();
  }

  /**
   * Sets the shared module queue the first time it's requested; ignores
   * repeated requests from other browsers.
   *
   * @param {string[]} modules
   */
  setModuleQueue(modules) {
    if (!this._testModuleQueue) {
      this._testModuleQueue = modules;
    }
  }

  /**
   * Gets the next test module from the shared queue and emits it back to the
   * requesting browser.
   *
   * @param {object} socket
   */
  nextModuleResponse(socket) {
    const moduleQueue = this._testModuleQueue;
    if (!moduleQueue) {
      throw new Error('No moduleQueue was set.');
    }

    const moduleName = moduleQueue.shift();
    socket.emit('testem:next-module-response', {
      done: !moduleQueue.length && !moduleName,
      value: moduleName,
    });
  }

  recordStartedLauncherId(browserId) {
    this._startedLaunchers.add(browserId);
  }

  /**
   * Tracks how many browsers have completed; logs a summary once all
   * requested browsers finish.
   *
   * @param {number} browserCount
   * @param {number} launcherId
   */
  completedBrowsersHandler(browserCount, launcherId) {
    this._completedBrowsers.set(launcherId, true);
    const completedBrowser = this._completedBrowsers.size;

    if (completedBrowser === this._startedLaunchers.size) {
      console.log(
        `Out of requested ${browserCount} browser(s), ${this._startedLaunchers.size} browser(s) was launched & completed.`
      );
      if (browserCount !== this._startedLaunchers.size) {
        console.log('Waiting for remaining browsers to exit.');
      }
    }

    if (completedBrowser === browserCount) {
      console.log('All browsers exited.');
      return true;
    }
    return false;
  }
}
