import readTestemConfig from './config-reader.js';
import { addToUrl } from './query-helper.js';

/**
 * Adds split/loadBalance/partition params to a base url if the options call for it.
 *
 * @param {object} commandOptions
 * @param {string} baseUrl
 */
function appendParamToBaseUrl(commandOptions, baseUrl) {
  if (commandOptions.parallel || commandOptions.split) {
    baseUrl = addToUrl(baseUrl, 'split', commandOptions.split);
  }
  if (commandOptions.loadBalance) {
    baseUrl = addToUrl(baseUrl, 'loadBalance', true);
  }

  return baseUrl;
}

/**
 * Parses an optionValue that may be e.g. '1,2', '3..5', or '1,3..5' (where
 * '3..5' is a number sequence) into a flat array.
 *
 * @param {string} optionValue
 * @return {number[]}
 */
function formatStringOptionValue(optionValue) {
  let valueArray = [];

  optionValue.split(',').forEach(function (val) {
    if (val.indexOf('..') > 0) {
      const arr = val.split('..');
      const filledArray = getFilledArray(arr.shift(), arr.pop());
      valueArray = valueArray.concat(filledArray);
    } else {
      valueArray.push(val);
    }
  });

  return valueArray;
}

/**
 * For a given baseUrl, appends the partition/browser id as a query param for
 * each browserId, generating one test page url per browser.
 *
 * @param {string} customBaseUrl
 * @param {string} appendingParam
 * @param {number[]} browserIds
 * @return {string[]}
 */
function generateTestPages(customBaseUrl, appendingParam, browserIds) {
  const testPages = [];
  for (let i = 0; i < browserIds.length; i++) {
    const url = addToUrl(customBaseUrl, appendingParam, browserIds[i]);
    testPages.push(url);
  }

  return testPages;
}

/**
 * @param {number} start
 * @param {number} end
 * @return {number[]}
 */
function getFilledArray(start, end) {
  const length = end - start + 1;
  return Array.from({ length }, (_, i) => i + Number(start));
}

/**
 * Returns an array of numeric values represented by optionValue,
 * e.g. [1, '2,3'] => [1, 2, 3], [1, '3..6'] => [1, 3, 4, 5, 6].
 *
 * @param {unknown} optionValue
 * @return {number[]}
 */
export function combineOptionValueIntoArray(optionValue) {
  if (!optionValue) return [];

  const optionArray = Array.isArray(optionValue) ? optionValue : [optionValue];

  return optionArray.reduce((result, element) => {
    if (typeof element === 'string') {
      return result.concat(formatStringOptionValue(element));
    }
    return result.concat(element);
  }, []);
}

/**
 * Returns the browserId of a testem launcher.
 *
 * @param {object} launcher
 * @return {string | number}
 */
export function getBrowserId(launcher) {
  try {
    const testPage = launcher.settings.test_page;
    const browserIdMatch = /browser=\s*([0-9]*)/.exec(testPage);

    if (browserIdMatch !== null) {
      return browserIdMatch[1];
    }
  } catch (err) {
    console.warn(`${err.message} \n${err.stack} \nLauncher Settings: ${JSON.stringify(launcher.settings, null, 2)}`);
  }
  return 0;
}

/**
 * Gets the configured test_page from testem config, falling back to a default.
 *
 * @param {string} [configFile]
 * @return {string}
 */
export function getTestUrlFromTestemConfig(configFile) {
  const testemConfig = readTestemConfig(configFile);
  let testPage = testemConfig && testemConfig.test_page;

  if (!testPage) {
    console.warn('No test_page value found in the config. Defaulting to "tests/index.html?hidepassed"');
    testPage = 'tests/index.html?hidepassed';
  }

  return testPage;
}

/**
 * @param {object} commandOptions
 * @param {string | string[]} baseUrl
 */
function getCustomBaseUrl(commandOptions, baseUrl) {
  if (Array.isArray(baseUrl)) {
    return baseUrl.map((currentUrl) => appendParamToBaseUrl(commandOptions, currentUrl));
  } else {
    return appendParamToBaseUrl(commandOptions, baseUrl);
  }
}

/**
 * Generates one test page url per browser needed to satisfy `--parallel`/
 * `--split`/`--load-balance`, for testem's `test_page` config.
 *
 * @param {object} config
 * @param {object} commandOptions
 * @return {string[]}
 */
export function getMultipleTestPages(config, commandOptions) {
  let testPages = [];
  let browserIds = combineOptionValueIntoArray(commandOptions.partition);
  let appendingParam = 'partition';

  if (commandOptions.loadBalance) {
    appendingParam = 'browser';
    browserIds = getFilledArray(1, commandOptions.parallel);
  } else if (commandOptions.parallel === 1 && browserIds.length === 0) {
    browserIds = getFilledArray(1, commandOptions.split);
  }

  const baseUrl = config.testPage || getTestUrlFromTestemConfig(commandOptions.configFile);
  const customBaseUrl = getCustomBaseUrl(commandOptions, baseUrl);

  if (Array.isArray(customBaseUrl)) {
    testPages = customBaseUrl.reduce(function (testPages, customBaseUrl) {
      return testPages.concat(generateTestPages(customBaseUrl, appendingParam, browserIds));
    }, []);
  } else {
    testPages = generateTestPages(customBaseUrl, appendingParam, browserIds);
  }

  return testPages;
}
