import { start as qunitStart } from 'ember-qunit';

import ExamTestLoader from './-private/exam-test-loader.js';
import { patchTestemOutput } from './-private/patch-testem-output.js';

let loaded = false;

/**
 * Sets up the ExamTestLoader singleton and, if running under testem, patches
 * its output to include browser/partition info in test names.
 *
 * @return {ExamTestLoader}
 */
function loadExamTestLoader() {
  if (loaded) {
    // eslint-disable-next-line no-console
    console.warn('Attempted to load the exam test loader more than once.');
    return;
  }

  loaded = true;

  const testLoader = new ExamTestLoader(window.Testem);

  if (window.Testem) {
    patchTestemOutput(testLoader.urlParams);
  }

  return testLoader;
}

/**
 * Sets up ExamTestLoader, loads tests, then calls ember-qunit's own start().
 *
 * @param {object} qunitOptions
 * @param {Record<string, () => Promise<unknown>>} qunitOptions.availableModules
 */
export default async function start(qunitOptions = {}) {
  const { availableModules, ...modifiedOptions } = qunitOptions || Object.create(null);

  modifiedOptions.loadTests = false;

  const testLoader = loadExamTestLoader();
  await testLoader.loadModules({ availableModules });
  qunitStart(modifiedOptions);
}
