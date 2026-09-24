'use strict';

const fs = require('node:fs');
const path = require('node:path');

/**
 * Reads a fixture file relative to `tests/blueprints/fixtures`.
 */
module.exports = function fixture(relativePath) {
  return fs.readFileSync(path.join(__dirname, '../../fixtures', relativePath), 'utf-8');
};
