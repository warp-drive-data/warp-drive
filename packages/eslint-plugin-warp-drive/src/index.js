/**
 * @summary ESLint plugin with rules that catch WarpDrive anti-patterns such as legacy request methods and imports,
 * invalid IDs and types, and unhandled request errors.
 * @module
 * @mergeModuleWith <project>
 */
'use strict';

const requireIndex = require('requireindex');
const pkg = require('../package.json');

module.exports = {
  meta: {
    name: pkg.name,
    version: pkg.version,
  },
  rules: requireIndex(`${__dirname}/rules`),
};
