'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

/**
 * Creates a scratch directory standing in for a project root, for tests that
 * exercise the "extend from an existing application adapter/serializer"
 * file-presence check.
 */
function makeTmpProject() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'warp-drive-blueprints-'));
}

function withApplicationEntity(cwd, kind) {
  const dir = path.join(cwd, 'app', `${kind}s`);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'application.js'), '');
}

function cleanup(cwd) {
  fs.rmSync(cwd, { recursive: true, force: true });
}

module.exports = { makeTmpProject, withApplicationEntity, cleanup };
