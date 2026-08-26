import path from 'node:path';

import Testem from 'testem';

import { addToQuery } from './query-helper.js';
import { getBrowserId, getMultipleTestPages } from './test-page-helper.js';
import TestemEvents from './testem-events.js';

const DEFAULT_PORT = 7357;

/**
 * Builds the testem options object (matching what `ember-cli/lib/tasks/
 * test.js`'s `transformOptions()` produces) directly, without needing
 * ember-cli's own Command/Task class hierarchy -- testem's `startCI`/
 * `startDev` are its own public API, not ember-cli-specific.
 *
 * @param {object} options
 */
function buildTransformOptions(options) {
  const transformed = {
    host: options.host,
    port: options.port,
    debug: options.testemDebug,
    reporter: options.reporter,
    middleware: [],
    launch: options.launch,
    file: options.configFile,
    test_page: options.testPage,
    query_params: options.queryString,
    custom_browser_socket_events: options.customBrowserSocketEvents,
  };

  if (options.loadBalance) {
    // testem's own `parallel` option is what actually boots browsers
    // simultaneously -- setting testPage to an array alone isn't enough,
    // its default behavior is one browser at a time.
    transformed.parallel = options.testPage.length;
  }

  return transformed;
}

/**
 * Builds testem's `custom_browser_socket_events`, wiring up the load-balance
 * module-queue protocol (`testem:set-modules-queue`/`testem:next-module-
 * request`/`testem:next-module-response`) and module-run metadata capture.
 *
 * @param {object} commandOptions
 * @param {TestemEvents} testemEvents
 */
function getBrowserSocketEvents(commandOptions, testemEvents) {
  const events = {};
  let init = false;

  const browserExitHandler = function () {
    const launcherId = this.launcher.id;
    if (commandOptions.loadBalance) {
      const browserId = getBrowserId(this.launcher);
      console.log(`Browser ${browserId} exiting.`);
    }

    const browserCount = Array.isArray(commandOptions.testPage) ? commandOptions.testPage.length : 1;
    testemEvents.completedBrowsersHandler(browserCount, launcherId);
  };

  const browserTerminationHandler = function () {
    if (this._examExitRecorded) {
      return;
    }
    this._examExitRecorded = true;
    browserExitHandler.call(this);
  };

  events['tests-start'] = function () {
    if (!init) {
      if (typeof this.process !== 'undefined' && this.process !== null) {
        this.process.on('processExit', browserTerminationHandler.bind(this));
        this.process.on('processError', browserTerminationHandler.bind(this));
      }
      init = true;
    }

    // Monkey-patch finish() -- testem exposes no event for "browser truly
    // done", and finish() is the one method all termination paths flow
    // through (clean exit, disconnect timeout, processExit timer). The
    // socket `disconnect` event fires on transient drops too, so it can't
    // be used. Microtask defers past after-tests-complete.
    if (!this._examFinishHooked) {
      this._examFinishHooked = true;
      const originalFinish = this.finish;
      const runner = this;
      this.finish = function () {
        const result = originalFinish.apply(this, arguments);
        Promise.resolve().then(() => browserTerminationHandler.call(runner));
        return result;
      };
    }

    if (typeof this.launcher !== 'undefined' && this.launcher !== null) {
      testemEvents.recordStartedLauncherId(this.launcher.id);
    }
  };

  events['after-tests-complete'] = function (...args) {
    this._examExitRecorded = true;
    return browserExitHandler.apply(this, args);
  };

  if (commandOptions.loadBalance) {
    events['testem:set-modules-queue'] = function (modules) {
      testemEvents.setModuleQueue(modules);
    };
    events['testem:next-module-request'] = function () {
      testemEvents.nextModuleResponse(this.socket);
    };
  }

  return events;
}

/**
 * Runs the test suite against a pre-built `--path` using testem directly,
 * supporting the same `--parallel`/`--load-balance`/`--random`/`--filter`/
 * `--module` options the `examine` script relies on.
 *
 * `--replay-execution`/`--write-execution-file`/`--write-module-metadata-
 * file` from upstream ember-exam are intentionally not ported: no script in
 * this repo passes them.
 *
 * @param {object} options
 * @param {string} options.path required, the pre-built test output directory
 * @param {number} [options.testPort]
 * @param {number} [options.parallel]
 * @param {boolean} [options.loadBalance]
 * @param {string} [options.random] seed, or '' to generate one
 * @param {string} [options.filter]
 * @param {string} [options.module]
 * @param {string} [options.configFile]
 * @param {boolean} [options.server]
 * @param {string} [options.launch]
 * @return {Promise<number>} exit code
 */
export async function run(options) {
  const outputPath = path.resolve(options.path);
  process.env.EMBER_CLI_TEST_OUTPUT = outputPath;

  let queryString = '';
  if (options.module) queryString = addToQuery(queryString, 'module', options.module);
  if (options.filter) queryString = addToQuery(queryString, 'filter', options.filter.toLowerCase());
  if (typeof options.random !== 'undefined') {
    const seed = options.random !== '' ? options.random : Math.random().toString(36).slice(2);
    console.log('Randomizing tests with seed: ' + seed);
    queryString = addToQuery(queryString, 'seed', seed);
  }
  if (options.loadBalance) {
    queryString = addToQuery(queryString, 'loadBalance', true);
  }

  const parallel = options.parallel ? parseInt(options.parallel, 10) : 1;
  const testemEvents = new TestemEvents();

  const commandOptions = {
    parallel,
    loadBalance: !!options.loadBalance,
    configFile: options.configFile,
  };

  let testPage;
  if (options.loadBalance || parallel > 1) {
    testPage = getMultipleTestPages(commandOptions, {
      ...commandOptions,
      configFile: options.configFile,
    });
  }
  commandOptions.testPage = testPage;

  const testem = new Testem();

  const transformOptions = buildTransformOptions({
    host: options.host,
    port: options.port ?? DEFAULT_PORT,
    testemDebug: options.testemDebug,
    reporter: options.reporter,
    launch: options.launch,
    configFile: options.configFile,
    testPage,
    queryString,
    loadBalance: options.loadBalance,
    customBrowserSocketEvents: getBrowserSocketEvents(commandOptions, testemEvents),
  });

  const defaultOptions = {
    ...transformOptions,
    cwd: outputPath,
    config_dir: process.cwd(),
  };

  return new Promise((resolve, reject) => {
    testem.setDefaultOptions(defaultOptions);
    const start = options.server ? testem.startDev.bind(testem) : testem.startCI.bind(testem);
    start(transformOptions, (exitCode, error) => {
      if (error) {
        reject(error);
      } else if (exitCode !== 0) {
        reject(new Error('Testem finished with non-zero exit code. Tests failed.'));
      } else {
        resolve(exitCode);
      }
    });
  });
}
