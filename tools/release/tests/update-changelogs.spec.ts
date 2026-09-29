import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { after, before, describe, it } from 'node:test';

import {
  Committers,
  type Entry,
  type LernaChangeset,
  type LernaOutput,
} from '../core/release-notes/steps/get-changes.ts';
import { buildText, findInsertionPoint, updateChangelogs } from '../core/release-notes/steps/update-changelogs.ts';
import { getFile } from '../utils/json-file.ts';
import { Package, type PACKAGEJSON, type RawStrategyConfig } from '../utils/package.ts';
import { makeTempDir, writeFile } from './helpers.ts';

const strategy: RawStrategyConfig = {
  packageRoots: ['packages/*'],
  changelog: {
    labelOrder: [':boom: Breaking Change', ':bug: Bug Fix'],
    mappings: {},
  },
};

function entry(pr: number, committer: string, title: string): [string, Entry] {
  return [
    `#${pr}`,
    {
      packages: [],
      committer,
      description: `[#${pr}](https://github.com/warp-drive-data/warp-drive/pull/${pr}) ${title} ([@${committer}](https://github.com/${committer}))`,
    },
  ];
}

const committerStrings = new Map([
  ['alice', '* [@alice](https://github.com/alice)'],
  ['bob', '* [@bob](https://github.com/bob)'],
]);

const bugFixes = new Map([entry(2, 'bob', 'fix a thing'), entry(3, 'alice', 'fix another thing')]);
const enhancements = new Map([entry(4, 'alice', 'add a thing')]);
const breaking = new Map([entry(1, 'alice', 'remove a thing')]);

describe('update-changelogs', () => {
  describe('findInsertionPoint', () => {
    it('returns the line of the heading for the given version', () => {
      const lines = ['# Changelog', '', '## v1.1.0 (2024-02-01)', '', '## v1.0.0 (2024-01-01)'];
      assert.equal(findInsertionPoint(lines, 'v1.1.0'), 2);
      assert.equal(findInsertionPoint(lines, 'v1.0.0'), 4);
    });

    it('falls back to the line after the title', () => {
      assert.equal(findInsertionPoint(['# Changelog', '', 'text'], 'v9.9.9'), 2);
    });
  });

  describe('buildText', () => {
    it('emits configured sections first, then the rest, then the committers', () => {
      const lines = buildText(
        'v1.2.0',
        '2024-03-01',
        strategy,
        { ':rocket: Enhancement': enhancements, ':bug: Bug Fix': bugFixes, ':boom: Breaking Change': breaking },
        committerStrings
      );
      assert.deepEqual(lines, [
        '## v1.2.0 (2024-03-01)',
        '',
        '#### :boom: Breaking Change',
        '',
        '* ' + breaking.get('#1')!.description,
        '',
        '#### :bug: Bug Fix',
        '',
        '* ' + bugFixes.get('#2')!.description,
        '* ' + bugFixes.get('#3')!.description,
        '',
        '#### :rocket: Enhancement',
        '',
        '* ' + enhancements.get('#4')!.description,
        '',
        '#### Committers: (2)',
        '',
        '* [@alice](https://github.com/alice)',
        '* [@bob](https://github.com/bob)',
        '',
      ]);
    });
  });

  describe('updateChangelogs', () => {
    let cwd: string;
    let originalCwd: string;
    let result: string[];

    before(async () => {
      originalCwd = process.cwd();
      cwd = makeTempDir('changelogs');
      writeFile(path.join(cwd, 'CHANGELOG.md'), '# WarpDrive Changelog\n\n## v1.1.0 (2024-02-01)\n\n* older entry\n');
      writeFile(
        path.join(cwd, 'packages/a/CHANGELOG.md'),
        '# @scope/a Changelog\n\nintro\n\n## v1.1.0 (2024-02-01)\n\n* older a entry\n'
      );
      fs.mkdirSync(path.join(cwd, 'packages/b'), { recursive: true });

      const pkg = (dir: string, name: string) =>
        new Package(`packages/${dir}/package.json`, getFile<PACKAGEJSON>(`packages/${dir}/package.json`), {
          name,
          version: '1.2.0',
          private: false,
        });
      const packages = new Map([
        ['@scope/a', pkg('a', '@scope/a')],
        ['@scope/b', pkg('b', '@scope/b')],
      ]);

      const data = {
        ':bug: Bug Fix': bugFixes,
        ':rocket: Enhancement': enhancements,
        [Committers]: committerStrings,
      } as unknown as LernaOutput;
      const changes: LernaChangeset = {
        data,
        byPackage: {
          root: { ':bug: Bug Fix': bugFixes },
          '@scope/a': { ':bug: Bug Fix': new Map([entry(2, 'bob', 'fix a thing')]) },
          '@scope/b': { ':rocket: Enhancement': enhancements },
        },
      };

      process.chdir(cwd);
      result = await updateChangelogs('v1.1.0', 'v1.2.0', '2024-03-01', changes, new Map(), strategy, packages);
    });

    after(() => {
      process.chdir(originalCwd);
      fs.rmSync(cwd, { recursive: true, force: true });
    });

    it('returns the paths it wrote', () => {
      assert.deepEqual(result, ['./CHANGELOG.md', 'packages/a/CHANGELOG.md', 'packages/b/CHANGELOG.md']);
    });

    it('inserts the release above the previous one in the root changelog', () => {
      assert.equal(
        fs.readFileSync(path.join(cwd, 'CHANGELOG.md'), 'utf8'),
        [
          '# WarpDrive Changelog',
          '',
          '## v1.2.0 (2024-03-01)',
          '',
          '#### :bug: Bug Fix',
          '',
          '* ' + bugFixes.get('#2')!.description,
          '* ' + bugFixes.get('#3')!.description,
          '',
          '#### :rocket: Enhancement',
          '',
          '* ' + enhancements.get('#4')!.description,
          '',
          '#### Committers: (2)',
          '',
          '* [@bob](https://github.com/bob)',
          '* [@alice](https://github.com/alice)',
          '',
          '## v1.1.0 (2024-02-01)',
          '',
          '* older entry',
          '',
        ].join('\n')
      );
    });

    it('updates an existing package changelog', () => {
      assert.equal(
        fs.readFileSync(path.join(cwd, 'packages/a/CHANGELOG.md'), 'utf8'),
        [
          '# @scope/a Changelog',
          '',
          'intro',
          '',
          '## v1.2.0 (2024-03-01)',
          '',
          '#### :bug: Bug Fix',
          '',
          '* ' + bugFixes.get('#2')!.description,
          '',
          '#### Committers: (1)',
          '',
          '* [@bob](https://github.com/bob)',
          '',
          '## v1.1.0 (2024-02-01)',
          '',
          '* older a entry',
          '',
        ].join('\n')
      );
    });

    it('creates a changelog for a package that has none', () => {
      assert.equal(
        fs.readFileSync(path.join(cwd, 'packages/b/CHANGELOG.md'), 'utf8'),
        [
          '# @scope/b Changelog',
          '',
          'For the full project changelog see [https://github.com/warp-drive-data/warp-drive/blob/main/CHANGELOG.md](https://github.com/warp-drive-data/warp-drive/blob/main/CHANGELOG.md)',
          '',
          '## v1.2.0 (2024-03-01)',
          '',
          '#### :rocket: Enhancement',
          '',
          '* ' + enhancements.get('#4')!.description,
          '',
          '#### Committers: (1)',
          '',
          '* [@alice](https://github.com/alice)',
          '',
          '',
        ].join('\n')
      );
    });
  });
});
