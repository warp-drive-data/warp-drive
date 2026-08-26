// A regular expression to help parsing a string to verify regex.
const MODULE_PATH_REGEXP = /^(!?)\/(.*)\/(i?)$/;
const TEST_PATH_REGEX = /\/tests\/(.*?)$/;

/**
 * Returns the matched test, e.g. '!/weight/' -> ['!/weight/', '!', 'weight', ''].
 *
 * @param {string} modulePath
 */
function getRegexFilter(modulePath) {
  return MODULE_PATH_REGEXP.exec(modulePath);
}

/**
 * Determines if a given module path matches a module filter with a wildcard,
 * e.g. /tests/integration/* matches /tests/integration/foo and /tests/integration/bar.
 *
 * @param {string} module
 * @param {string} moduleFilter
 */
function wildcardFilter(module, moduleFilter) {
  const moduleFilterRule = ['^.*', moduleFilter.split('*').join('.*'), '$'].join('');
  return new RegExp(moduleFilterRule).test(module);
}

/**
 * Returns test modules that contain a given module path string.
 *
 * @param {string[]} modules
 * @param {string} moduleFilter
 */
function stringFilter(modules, moduleFilter) {
  return modules.filter((module) => module.includes(moduleFilter) || wildcardFilter(module, moduleFilter));
}

/**
 * Returns test modules that match a given regular expression.
 *
 * @param {string[]} modules
 * @param {RegExpExecArray} modulePathRegexFilter
 */
function regexFilter(modules, modulePathRegexFilter) {
  const re = new RegExp(modulePathRegexFilter[2], modulePathRegexFilter[3]);
  const exclude = modulePathRegexFilter[1];

  return modules.filter((module) => (!exclude && re.test(module)) || (exclude && !re.test(module)));
}

/**
 * Returns the module path mapped by a given test file path.
 *
 * @param {string} filePath
 */
function convertFilePathToModulePath(filePath) {
  const filePathWithNoExtension = filePath.replace(/\.[^/.]+$/, '');
  const testFilePathMatch = TEST_PATH_REGEX.exec(filePathWithNoExtension);
  if (typeof filePath !== 'undefined' && testFilePathMatch !== null) {
    return testFilePathMatch[0];
  }

  return filePathWithNoExtension;
}

/**
 * Returns test modules that match the given module path filter or test file path.
 *
 * @param {string[]} modules
 * @param {string} [modulePath]
 * @param {string} [filePath]
 */
export function filterTestModules(modules, modulePath, filePath) {
  const moduleFilters = (filePath || modulePath).split(',').map((value) => value.trim());

  const filteredTestModules = moduleFilters.reduce((result, moduleFilter) => {
    const modulePath = convertFilePathToModulePath(moduleFilter);
    const modulePathRegex = getRegexFilter(modulePath);

    if (modulePathRegex) {
      return result.concat(regexFilter(modules, modulePathRegex).filter((module) => result.indexOf(module) === -1));
    } else {
      return result.concat(stringFilter(modules, modulePath).filter((module) => result.indexOf(module) === -1));
    }
  }, []);

  if (filteredTestModules.length === 0) {
    throw new Error(`No tests matched with the filter: ${modulePath || filePath}.`);
  }
  return filteredTestModules;
}

export { convertFilePathToModulePath };
