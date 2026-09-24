import { assert } from '@ember/debug';

import QUnit from 'qunit';

import AsyncIterator from './async-iterator.js';
import { filterTestModules } from './filter-test-modules.js';
import getUrlParams from './get-url-params.js';
import splitTestModules from './split-test-modules.js';
import weightTestModules from './weight-test-modules.js';

/**
 * ExamTestLoader loads test modules from an explicit `{ modulePath: () =>
 * import(modulePath) }` map (built via `import.meta.glob()`) rather than the
 * classic AMD `requirejs.entries` registry, which nothing under a native
 * @embroider/vite pipeline populates. It supports the same split/partition/
 * load-balance/filter query params ember-exam's browser-side loader did.
 */
export default class ExamTestLoader {
  constructor(testem, urlParams, qunit = QUnit) {
    this._testModules = [];
    this._testem = testem;
    this._qunit = qunit;
    this._urlParams = urlParams || getUrlParams();
  }

  get urlParams() {
    return this._urlParams;
  }

  /**
   * @param {{availableModules: Record<string, unknown>}} options
   */
  async loadModules({ availableModules } = {}) {
    const loadBalance = this._urlParams.get('loadBalance');
    const browserId = this._urlParams.get('browser');
    const modulePath = this._urlParams.get('modulePath');
    const filePath = this._urlParams.get('filePath');
    let partitions = this._urlParams.get('partition');
    let split = parseInt(this._urlParams.get('split'), 10);

    split = isNaN(split) ? 1 : split;

    if (partitions === undefined) {
      partitions = [1];
    } else if (!Array.isArray(partitions)) {
      partitions = [partitions];
    }

    assert(`Available modules must be an object.`, typeof availableModules === 'object' && availableModules !== null);
    this._availableModules = availableModules;
    this._testModules = Object.keys(availableModules);

    this.setupModuleMetadataHandler();

    if (modulePath || filePath) {
      this._testModules = filterTestModules(this._testModules, modulePath, filePath);
    }

    if (loadBalance && this._testem) {
      this.setupLoadBalanceHandlers();
      this._testModules = splitTestModules(weightTestModules(this._testModules), split, partitions);

      this._testem.emit('testem:set-modules-queue', this._testModules, browserId);
    } else {
      this._testModules = splitTestModules(this._testModules, split, partitions);
      await this.loadAvailableModules();
    }
  }

  async loadAvailableModules() {
    await Promise.all(
      this._testModules.map(async (moduleName) => {
        const loader = this._availableModules[moduleName];
        // If it's not a function, it's already loaded
        if (typeof loader === 'function') {
          await loader();
        }
      })
    );
  }

  /**
   * Loads a single module, used by the load-balance next-module handler.
   *
   * @param {string} moduleName
   */
  async loadIndividualModule(moduleName) {
    if (moduleName === undefined) {
      throw new Error('Failed to load a test module. `moduleName` is undefined in `loadIndividualModule`.');
    }

    const loader = this._availableModules[moduleName];
    if (typeof loader === 'function') {
      await loader();
    }
  }

  setupModuleMetadataHandler() {
    this._qunit.testDone((metadata) => {
      if (typeof this._testem !== 'undefined' && this._testem !== null) {
        // metadata contains name, module, failed, passed, total, duration, skipped, and todo.
        // https://api.qunitjs.com/callbacks/QUnit.testDone
        this._testem.emit('testem:test-done-metadata', metadata);
      }
    });
  }

  setupLoadBalanceHandlers() {
    // nextModuleAsyncIterator handles the async testem events; it returns an
    // element of {value: <moduleName>, done: boolean}
    const nextModuleAsyncIterator = new AsyncIterator(this._testem, {
      request: 'testem:next-module-request',
      response: 'testem:next-module-response',
      timeout: this._urlParams.get('asyncTimeout'),
      browserId: this._urlParams.get('browser'),
      emberExamExitOnError: this._urlParams.get('_emberExamExitOnError'),
    });

    const nextModuleHandler = () => {
      // if there are already tests queued up, don't request next module
      // this is possible if a test file has multiple qunit modules
      if (this._qunit.config.queue.length > 0) {
        return;
      }

      return nextModuleAsyncIterator
        .next()
        .then(async (response) => {
          if (!response.done) {
            const moduleName = response.value;
            await this.loadIndividualModule(moduleName);

            // if no tests were added, request the next module
            if (this._qunit.config.queue.length === 0) {
              return nextModuleHandler();
            }
          }
        })
        .catch((e) => {
          if (typeof e === 'object' && e !== null && typeof e.message === 'string') {
            e.message = `ExamTestLoader: Failed to get next test module: ${e.message}`;
          }
          throw new Error(`ExamTestLoader: Failed to get next test module: ${e}`);
        });
    };

    // ask for a next test module to execute when the test suite begins, and
    // after each module completes (since `setupEmberOnerrorValidation: false`
    // disables ember-qunit's own moduleDone-triggered continuation).
    this._qunit.begin(() => {
      return nextModuleHandler();
    });

    this._qunit.moduleDone(() => {
      return nextModuleHandler();
    });
  }
}
