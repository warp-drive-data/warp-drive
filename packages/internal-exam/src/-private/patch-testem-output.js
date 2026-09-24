/* globals Testem */

/**
 * Returns a modified test name including browser or partition information.
 *
 * @param {Map} urlParams
 * @param {string} testName
 * @return {string}
 */
export function updateTestName(urlParams, testName) {
  if (testName.includes('Exam Partition') || testName.includes('Browser Id')) {
    // The test name was already updated, e.g. by the `tests-start` event
    return testName;
  }

  const split = urlParams.get('split');
  const loadBalance = urlParams.get('loadBalance');

  const partition = urlParams.get('partition') || 1;
  const browser = urlParams.get('browser') || 1;

  const preserveTestName = !!urlParams.get('preserveTestName');

  if (preserveTestName) {
    return testName;
  } else if (split && loadBalance) {
    testName = `Exam Partition ${partition} - Browser Id ${browser} - ${testName}`;
  } else if (split) {
    testName = `Exam Partition ${partition} - ${testName}`;
  } else if (loadBalance) {
    testName = `Browser Id ${browser} - ${testName}`;
  }

  return testName;
}

/**
 * Sets up testem's tests-start/test-result events to update the test name
 * when a test starts and when it completes.
 *
 * @param {Map} urlParams
 */
export function patchTestemOutput(urlParams) {
  Testem.on('tests-start', (test) => {
    if (test?.name) {
      test.name = updateTestName(urlParams, test.name);
    }
  });
  Testem.on('test-result', (test) => {
    test.name = updateTestName(urlParams, test.name);
  });
}
