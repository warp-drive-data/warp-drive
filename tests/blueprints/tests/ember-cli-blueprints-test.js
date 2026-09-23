'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { describe, it } = require('mocha');

const { installBlueprint } = require('./helpers/ember-cli.js');
const { makeTmpProject, cleanup } = require('./helpers/tmp-project.js');

const TEST_IMPORT = "import { setupTest } from 'my-app/tests/helpers';";

const EXPECTED = {
  model: {
    path: 'app/models/post.js',
    emberData: "import Model, { attr } from '@ember-data/model';",
    legacy: "import Model, { attr } from '@warp-drive/legacy/model';",
  },
  adapter: {
    path: 'app/adapters/post.js',
    emberData: "import JSONAPIAdapter from '@ember-data/adapter/json-api';",
    legacy: "import { JSONAPIAdapter } from '@warp-drive/legacy/adapter/json-api';",
  },
  serializer: {
    path: 'app/serializers/post.js',
    emberData: "import JSONAPISerializer from '@ember-data/serializer/json-api';",
    legacy: "import { JSONAPISerializer } from '@warp-drive/legacy/serializer/json-api';",
  },
  transform: {
    path: 'app/transforms/post.js',
    emberData: 'export default class PostTransform {',
    legacy: 'export default class PostTransform {',
  },
  'model-test': { path: 'tests/unit/models/post-test.js', emberData: TEST_IMPORT, legacy: TEST_IMPORT },
  'adapter-test': { path: 'tests/unit/adapters/post-test.js', emberData: TEST_IMPORT, legacy: TEST_IMPORT },
  'serializer-test': { path: 'tests/unit/serializers/post-test.js', emberData: TEST_IMPORT, legacy: TEST_IMPORT },
  'transform-test': { path: 'tests/unit/transforms/post-test.js', emberData: TEST_IMPORT, legacy: TEST_IMPORT },
};

const ALL_KINDS = Object.keys(EXPECTED);

const PACKAGES = [
  { pkg: 'ember-data', flavor: 'emberData', kinds: ALL_KINDS },
  { pkg: '@ember-data/model', flavor: 'emberData', kinds: ['model', 'model-test'] },
  { pkg: '@ember-data/adapter', flavor: 'emberData', kinds: ['adapter', 'adapter-test'] },
  {
    pkg: '@ember-data/serializer',
    flavor: 'emberData',
    kinds: ['serializer', 'serializer-test', 'transform', 'transform-test'],
  },
  { pkg: '@warp-drive/legacy', flavor: 'legacy', kinds: ALL_KINDS },
];

const CASES = PACKAGES.flatMap(({ pkg, flavor, kinds }) =>
  kinds.map((kind) => ({
    pkg,
    kind,
    expectedPath: EXPECTED[kind].path,
    expectedLine: EXPECTED[kind][flavor],
  }))
);

describe('ember-cli blueprints', function () {
  for (const { pkg, kind, expectedPath, expectedLine } of CASES) {
    it(`${pkg} ${kind} writes ${expectedPath}`, async function () {
      const target = makeTmpProject();
      try {
        await installBlueprint(pkg, kind, target);

        const file = path.join(target, expectedPath);
        assert.ok(fs.existsSync(file), `expected ${pkg} ${kind} to write ${expectedPath}`);

        const content = fs.readFileSync(file, 'utf-8');
        assert.ok(!content.includes('&#39;'), `expected ${expectedPath} to contain no HTML-escaped quotes`);
        assert.ok(content.includes(expectedLine), `expected ${expectedPath} to contain ${expectedLine}`);
      } finally {
        cleanup(target);
      }
    });
  }
});
