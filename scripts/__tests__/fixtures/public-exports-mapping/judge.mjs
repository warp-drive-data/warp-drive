/**
 * Fixtures for the judge tests. `data/` is a contract-shaped data directory for a made-up release line
 * 1.0.0 -> 2.0.0 -> 3.0.0 with a six-token residue; the `diffs/` carry the change sets of the real
 * surfaces and hand-written `declarations` for the judge scenarios. `git/` stands in for the
 * repository: `v<version>/` holds what `git show <tag>:<file>` returns, `commits/` the diffs of
 * `git show --format= <sha>`, and `log.json` the answers of `git log -S`.
 */

/** @type {import('./tree.mjs').Tree} */
export const tree = {
  // the data directory
  'data/decisions/1.0.0.json': { entries: [], from: '1.0.0', kind: 'decisions', schema: 1, to: '3.0.0' },
  'data/diffs/1.0.0-2.0.0.json': {
    declarations: {
      'packages/adapter/src/error.js#default': 'packages/adapter/src/error.ts#AdapterError',
      'packages/adapter/src/error.js#errorsArrayToHash': null,
      'packages/eslint-plugin-warp-drive/src/index.js#rules': null,
      'packages/store/src/fetch-manager.ts#fetchManager': null,
      'packages/store/src/identifier-array.ts#IdentifierArray':
        'packages/store/src/identifier-array.ts#IdentifierArray',
      'packages/store/src/identifiers.ts#setIdentifierGenerationMethod': null,
      'packages/store/src/store-service.ts#default': 'packages/store/src/store-service.ts#default',
      'packages/store/src/types.ts#StoreRequestInput': 'packages/store/src/types.ts#StoreRequestInput',
      'packages/store/src/utils.ts#normalizeModelName': null,
      'packages/store/src/utils.ts#peekRecords': null,
    },
    exports: {
      '@ember-data/adapter/error': {
        added: { InvalidError: { decl: 'packages/adapter/src/error.ts#InvalidError', kind: 'value' } },
        changed: { default: { decl: 'packages/adapter/src/error.ts#AdapterError' } },
        removed: ['errorsArrayToHash'],
      },
      '@ember-data/request-utils/string': {
        added: {
          dasherize: { decl: 'packages/request-utils/src/string.ts#dasherize', kind: 'value' },
          normalizeModelName: { decl: 'packages/request-utils/src/string.ts#normalizeModelName', kind: 'value' },
        },
        changed: {},
        removed: [],
      },
      '@ember-data/store': {
        added: { peekRecord: { decl: 'packages/store/src/peek.ts#peekRecord', kind: 'value' } },
        changed: {},
        removed: ['normalizeModelName', 'peekRecords', 'setIdentifierGenerationMethod'],
      },
      '@ember-data/store/-private': { added: {}, changed: {}, removed: ['fetchManager'] },
    },
    from: '1.0.0',
    kind: 'diff',
    modules: {
      added: {
        '@ember-data/request-utils/string': {
          entry: 'packages/request-utils/src/string.ts',
          forward: null,
          package: '@ember-data/request-utils',
        },
      },
      changed: { '@ember-data/adapter/error': { entry: 'packages/adapter/src/error.ts' } },
      removed: ['eslint-plugin-warp-drive'],
    },
    packages: {
      added: {
        '@ember-data/request-utils': { dir: 'packages/request-utils', modules: ['@ember-data/request-utils/string'] },
      },
      changed: {},
      removed: ['eslint-plugin-warp-drive'],
    },
    schema: 1,
    to: '2.0.0',
  },
  'data/diffs/2.0.0-3.0.0.json': {
    declarations: {
      'packages/adapter/src/error.ts#AdapterError': 'warp-drive-packages/legacy/src/adapter/error.ts#AdapterError',
      'packages/adapter/src/error.ts#InvalidError': 'warp-drive-packages/legacy/src/adapter/error.ts#InvalidError',
      'packages/request-utils/src/string.ts#dasherize': 'warp-drive-packages/utilities/src/string.ts#dasherize',
      'packages/request-utils/src/string.ts#normalizeModelName':
        'warp-drive-packages/utilities/src/string.ts#normalizeModelName',
      'packages/store/src/caches.ts#recordIdentifierFor': 'warp-drive-packages/core/src/caches.ts#recordIdentifierFor',
      'packages/store/src/identifier-array.ts#IdentifierArray': null,
      'packages/store/src/peek.ts#peekRecord': 'warp-drive-packages/core/src/peek.ts#peekRecord',
      'packages/store/src/store-service.ts#default': 'warp-drive-packages/core/src/store-service.ts#Store',
      'packages/store/src/types.ts#StoreRequestInput': 'warp-drive-packages/core/src/types.ts#StoreRequestInput',
    },
    exports: {
      '@ember-data/store': {
        added: {
          setIdentifierGenerationMethod: {
            decl: 'packages/store/src/identifiers.ts#setIdentifierGenerationMethod',
            kind: 'value',
          },
        },
        changed: {
          default: { decl: 'warp-drive-packages/core/src/store-service.ts#Store' },
          recordIdentifierFor: { decl: 'warp-drive-packages/core/src/caches.ts#recordIdentifierFor', deprecated: true },
        },
        removed: ['IdentifierArray', 'StoreRequestInput', 'peekRecord'],
      },
      '@warp-drive/core': {
        added: {
          Store: { decl: 'warp-drive-packages/core/src/store-service.ts#Store', kind: 'value' },
          cacheKeyFor: { decl: 'warp-drive-packages/core/src/caches.ts#recordIdentifierFor', kind: 'value' },
          peekRecord: { decl: 'warp-drive-packages/core/src/peek.ts#peekRecord', kind: 'value' },
          recordIdentifierFor: { decl: 'warp-drive-packages/core/src/caches.ts#recordIdentifierFor', kind: 'value' },
        },
        changed: {},
        removed: [],
      },
      '@warp-drive/core/store/-private': {
        added: {
          LiveArray: { decl: 'warp-drive-packages/core/src/live-array.ts#LiveArray', kind: 'value' },
          createLiveArray: { decl: 'warp-drive-packages/core/src/live-array.ts#createLiveArray', kind: 'value' },
        },
        changed: {},
        removed: [],
      },
      '@warp-drive/core/types': {
        added: { LiveArray: { decl: 'warp-drive-packages/core/src/live-array.ts#LiveArray', kind: 'type' } },
        changed: {},
        removed: [],
      },
      '@warp-drive/legacy/adapter/error': {
        added: {
          AdapterError: { decl: 'warp-drive-packages/legacy/src/adapter/error.ts#AdapterError', kind: 'value' },
          InvalidError: { decl: 'warp-drive-packages/legacy/src/adapter/error.ts#InvalidError', kind: 'value' },
        },
        changed: {},
        removed: [],
      },
      '@warp-drive/legacy/compat/-private': {
        added: {
          FetchManager: { decl: 'warp-drive-packages/legacy/src/compat/fetch-manager.ts#FetchManager', kind: 'value' },
        },
        changed: {},
        removed: [],
      },
      '@warp-drive/utilities/string': {
        added: {
          dasherize: { decl: 'warp-drive-packages/utilities/src/string.ts#dasherize', kind: 'value' },
          normalizeModelName: { decl: 'warp-drive-packages/utilities/src/string.ts#normalizeModelName', kind: 'value' },
        },
        changed: {},
        removed: [],
      },
      'warp-drive/types': {
        added: { LiveArray: { decl: 'warp-drive-packages/core/src/live-array.ts#LiveArray', kind: 'type' } },
        changed: {},
        removed: [],
      },
    },
    from: '2.0.0',
    kind: 'diff',
    modules: {
      added: {
        '@warp-drive/core': {
          entry: 'warp-drive-packages/core/src/index.ts',
          forward: null,
          package: '@warp-drive/core',
        },
        '@warp-drive/core/store/-private': {
          entry: 'warp-drive-packages/core/src/store/-private.ts',
          forward: null,
          package: '@warp-drive/core',
        },
        '@warp-drive/core/types': {
          entry: 'warp-drive-packages/core/src/types.ts',
          forward: null,
          package: '@warp-drive/core',
        },
        '@warp-drive/legacy/adapter/error': {
          entry: 'warp-drive-packages/legacy/src/adapter/error.ts',
          forward: null,
          package: '@warp-drive/legacy',
        },
        '@warp-drive/legacy/compat/-private': {
          entry: 'warp-drive-packages/legacy/src/compat/-private.ts',
          forward: null,
          package: '@warp-drive/legacy',
        },
        '@warp-drive/utilities/string': {
          entry: 'warp-drive-packages/utilities/src/string.ts',
          forward: null,
          package: '@warp-drive/utilities',
        },
        'warp-drive/types': { entry: 'packages/-warp-drive/src/types.ts', forward: null, package: 'warp-drive' },
      },
      changed: {},
      removed: ['@ember-data/adapter/error', '@ember-data/request-utils/string', '@ember-data/store/-private'],
    },
    packages: {
      added: {
        '@warp-drive/core': {
          dir: 'warp-drive-packages/core',
          modules: ['@warp-drive/core', '@warp-drive/core/store/-private', '@warp-drive/core/types'],
        },
        '@warp-drive/legacy': {
          dir: 'warp-drive-packages/legacy',
          modules: ['@warp-drive/legacy/adapter/error', '@warp-drive/legacy/compat/-private'],
        },
        '@warp-drive/utilities': { dir: 'warp-drive-packages/utilities', modules: ['@warp-drive/utilities/string'] },
        'warp-drive': { dir: 'packages/-warp-drive', modules: ['warp-drive/types'] },
      },
      changed: { '@ember-data/store': { modules: ['@ember-data/store'] } },
      removed: ['@ember-data/adapter', '@ember-data/request-utils'],
    },
    schema: 1,
    to: '3.0.0',
  },
  'data/history/1.0.0-2.0.0.json': {
    files: {
      'packages/adapter/src/error.js': ['packages/adapter/src/error.ts'],
      'packages/store/src/fetch-manager.ts': [],
    },
    from: '1.0.0',
    kind: 'history',
    schema: 1,
    symbols: {
      'packages/adapter/src/error.js#default': {
        added: ['packages/adapter/src/error.ts#AdapterError'],
        commit: '1111111111',
        subject: 'feat: name the adapter error (#8001)',
      },
      'packages/adapter/src/error.js#errorsArrayToHash': {
        added: [],
        commit: '2222222222',
        subject: 'chore: remove 4.x deprecations (#8550)',
      },
      'packages/store/src/utils.ts#normalizeModelName': {
        added: [
          'packages/request-utils/src/string.ts#dasherize',
          'packages/request-utils/src/string.ts#normalizeModelName',
        ],
        commit: '3333333333',
        subject: 'chore: move string utilities to request-utils (#9000)',
      },
      'packages/store/src/utils.ts#peekRecords': {
        added: [],
        commit: '4444444444',
        subject: 'refactor: drop peekRecords (#9100)',
      },
    },
    to: '2.0.0',
  },
  'data/history/2.0.0-3.0.0.json': {
    files: {
      'packages/adapter/src/error.ts': ['warp-drive-packages/legacy/src/adapter/error.ts'],
      'packages/request-utils/src/string.ts': ['warp-drive-packages/utilities/src/string.ts'],
      'packages/store/src/caches.ts': ['warp-drive-packages/core/src/caches.ts'],
      'packages/store/src/identifier-array.ts': ['warp-drive-packages/core/src/live-array.ts'],
      'packages/store/src/peek.ts': ['warp-drive-packages/core/src/peek.ts'],
      'packages/store/src/store-service.ts': ['warp-drive-packages/core/src/store-service.ts'],
      'packages/store/src/types.ts': ['warp-drive-packages/core/src/types.ts'],
    },
    from: '2.0.0',
    kind: 'history',
    schema: 1,
    symbols: {
      'packages/store/src/identifier-array.ts#IdentifierArray': {
        added: [
          'warp-drive-packages/core/src/live-array.ts#LiveArray',
          'warp-drive-packages/core/src/live-array.ts#createLiveArray',
        ],
        commit: '6666666666',
        subject: 'feat: universal reactivity hooks (#9965)',
      },
      'packages/store/src/store-service.ts#default': {
        added: [
          'warp-drive-packages/core/src/peek.ts#peekRecord',
          'warp-drive-packages/core/src/store-service.ts#Store',
        ],
        commit: '5555555555',
        subject: 'feat: extract @ember-data/store => @warp-drive/core (#9998)',
      },
    },
    to: '3.0.0',
  },
  'data/preferences.json': {
    audience: 'ember',
    ignorePackages: ['eslint-plugin-warp-drive', '@ember-data/codemods', 'warp-drive'],
    report: {},
    schema: 1,
    tieBreak: ['@warp-drive/ember'],
  },
  'data/releases.json': { baseline: '1.0.0', releases: ['1.0.0', '2.0.0', '3.0.0'], schema: 1 },
  'data/shapes/3.0.0.json': {
    kind: 'shapes',
    schema: 1,
    shapes: {
      'warp-drive-packages/core/src/live-array.ts#LiveArray':
        'class LiveArray<T = unknown> { readonly type: string; length: number; constructor(options: { type: string; identifiers: string[] }) }',
      'warp-drive-packages/core/src/live-array.ts#createLiveArray':
        'function createLiveArray<T>(options: { type: string; identifiers: string[] }): LiveArray<T>',
    },
    version: '3.0.0',
  },
  'data/surface.1.0.0.json': {
    kind: 'surface',
    modules: {
      '@ember-data/adapter/error': {
        entry: 'packages/adapter/src/error.js',
        exports: {
          default: { decl: 'packages/adapter/src/error.js#default', kind: 'value' },
          errorsArrayToHash: { decl: 'packages/adapter/src/error.js#errorsArrayToHash', kind: 'value' },
        },
        forward: null,
        package: '@ember-data/adapter',
      },
      '@ember-data/store': {
        entry: 'packages/store/src/index.ts',
        exports: {
          IdentifierArray: { decl: 'packages/store/src/identifier-array.ts#IdentifierArray', kind: 'value' },
          StoreRequestInput: { decl: 'packages/store/src/types.ts#StoreRequestInput', kind: 'type' },
          default: { decl: 'packages/store/src/store-service.ts#default', kind: 'value' },
          normalizeModelName: {
            decl: 'packages/store/src/utils.ts#normalizeModelName',
            deprecated: true,
            kind: 'value',
          },
          peekRecords: { decl: 'packages/store/src/utils.ts#peekRecords', kind: 'value' },
          recordIdentifierFor: { decl: 'packages/store/src/caches.ts#recordIdentifierFor', kind: 'value' },
          setIdentifierGenerationMethod: {
            decl: 'packages/store/src/identifiers.ts#setIdentifierGenerationMethod',
            kind: 'value',
          },
        },
        forward: null,
        package: '@ember-data/store',
      },
      '@ember-data/store/-private': {
        entry: 'packages/store/src/-private.ts',
        exports: {
          IdentifierArray: { decl: 'packages/store/src/identifier-array.ts#IdentifierArray', kind: 'value' },
          fetchManager: { decl: 'packages/store/src/fetch-manager.ts#fetchManager', kind: 'value' },
        },
        forward: null,
        package: '@ember-data/store',
      },
      'eslint-plugin-warp-drive': {
        entry: 'packages/eslint-plugin-warp-drive/src/index.js',
        exports: { rules: { decl: 'packages/eslint-plugin-warp-drive/src/index.js#rules', kind: 'value' } },
        forward: null,
        package: 'eslint-plugin-warp-drive',
      },
    },
    packages: {
      '@ember-data/adapter': { dir: 'packages/adapter', modules: ['@ember-data/adapter/error'] },
      '@ember-data/store': { dir: 'packages/store', modules: ['@ember-data/store', '@ember-data/store/-private'] },
      'eslint-plugin-warp-drive': { dir: 'packages/eslint-plugin-warp-drive', modules: ['eslint-plugin-warp-drive'] },
    },
    schema: 1,
    tag: 'v1.0.0',
    version: '1.0.0',
  },
  'data/surfaces/2.0.0.json': {
    kind: 'surface',
    modules: {
      '@ember-data/adapter/error': {
        entry: 'packages/adapter/src/error.ts',
        exports: {
          InvalidError: { decl: 'packages/adapter/src/error.ts#InvalidError', kind: 'value' },
          default: { decl: 'packages/adapter/src/error.ts#AdapterError', kind: 'value' },
        },
        forward: null,
        package: '@ember-data/adapter',
      },
      '@ember-data/request-utils/string': {
        entry: 'packages/request-utils/src/string.ts',
        exports: {
          dasherize: { decl: 'packages/request-utils/src/string.ts#dasherize', kind: 'value' },
          normalizeModelName: { decl: 'packages/request-utils/src/string.ts#normalizeModelName', kind: 'value' },
        },
        forward: null,
        package: '@ember-data/request-utils',
      },
      '@ember-data/store': {
        entry: 'packages/store/src/index.ts',
        exports: {
          IdentifierArray: { decl: 'packages/store/src/identifier-array.ts#IdentifierArray', kind: 'value' },
          StoreRequestInput: { decl: 'packages/store/src/types.ts#StoreRequestInput', kind: 'type' },
          default: { decl: 'packages/store/src/store-service.ts#default', kind: 'value' },
          peekRecord: { decl: 'packages/store/src/peek.ts#peekRecord', kind: 'value' },
          recordIdentifierFor: { decl: 'packages/store/src/caches.ts#recordIdentifierFor', kind: 'value' },
        },
        forward: null,
        package: '@ember-data/store',
      },
      '@ember-data/store/-private': {
        entry: 'packages/store/src/-private.ts',
        exports: { IdentifierArray: { decl: 'packages/store/src/identifier-array.ts#IdentifierArray', kind: 'value' } },
        forward: null,
        package: '@ember-data/store',
      },
    },
    packages: {
      '@ember-data/adapter': { dir: 'packages/adapter', modules: ['@ember-data/adapter/error'] },
      '@ember-data/request-utils': { dir: 'packages/request-utils', modules: ['@ember-data/request-utils/string'] },
      '@ember-data/store': { dir: 'packages/store', modules: ['@ember-data/store', '@ember-data/store/-private'] },
    },
    schema: 1,
    tag: 'v2.0.0',
    version: '2.0.0',
  },
  'data/surfaces/3.0.0.json': {
    kind: 'surface',
    modules: {
      '@ember-data/store': {
        entry: 'packages/store/src/index.ts',
        exports: {
          default: { decl: 'warp-drive-packages/core/src/store-service.ts#Store', kind: 'value' },
          recordIdentifierFor: {
            decl: 'warp-drive-packages/core/src/caches.ts#recordIdentifierFor',
            deprecated: true,
            kind: 'value',
          },
          setIdentifierGenerationMethod: {
            decl: 'packages/store/src/identifiers.ts#setIdentifierGenerationMethod',
            kind: 'value',
          },
        },
        forward: null,
        package: '@ember-data/store',
      },
      '@warp-drive/core': {
        entry: 'warp-drive-packages/core/src/index.ts',
        exports: {
          Store: { decl: 'warp-drive-packages/core/src/store-service.ts#Store', kind: 'value' },
          cacheKeyFor: { decl: 'warp-drive-packages/core/src/caches.ts#recordIdentifierFor', kind: 'value' },
          peekRecord: { decl: 'warp-drive-packages/core/src/peek.ts#peekRecord', kind: 'value' },
          recordIdentifierFor: { decl: 'warp-drive-packages/core/src/caches.ts#recordIdentifierFor', kind: 'value' },
        },
        forward: null,
        package: '@warp-drive/core',
      },
      '@warp-drive/core/store/-private': {
        entry: 'warp-drive-packages/core/src/store/-private.ts',
        exports: {
          LiveArray: { decl: 'warp-drive-packages/core/src/live-array.ts#LiveArray', kind: 'value' },
          createLiveArray: { decl: 'warp-drive-packages/core/src/live-array.ts#createLiveArray', kind: 'value' },
        },
        forward: null,
        package: '@warp-drive/core',
      },
      '@warp-drive/core/types': {
        entry: 'warp-drive-packages/core/src/types.ts',
        exports: { LiveArray: { decl: 'warp-drive-packages/core/src/live-array.ts#LiveArray', kind: 'type' } },
        forward: null,
        package: '@warp-drive/core',
      },
      '@warp-drive/legacy/adapter/error': {
        entry: 'warp-drive-packages/legacy/src/adapter/error.ts',
        exports: {
          AdapterError: { decl: 'warp-drive-packages/legacy/src/adapter/error.ts#AdapterError', kind: 'value' },
          InvalidError: { decl: 'warp-drive-packages/legacy/src/adapter/error.ts#InvalidError', kind: 'value' },
        },
        forward: null,
        package: '@warp-drive/legacy',
      },
      '@warp-drive/legacy/compat/-private': {
        entry: 'warp-drive-packages/legacy/src/compat/-private.ts',
        exports: {
          FetchManager: { decl: 'warp-drive-packages/legacy/src/compat/fetch-manager.ts#FetchManager', kind: 'value' },
        },
        forward: null,
        package: '@warp-drive/legacy',
      },
      '@warp-drive/utilities/string': {
        entry: 'warp-drive-packages/utilities/src/string.ts',
        exports: {
          dasherize: { decl: 'warp-drive-packages/utilities/src/string.ts#dasherize', kind: 'value' },
          normalizeModelName: { decl: 'warp-drive-packages/utilities/src/string.ts#normalizeModelName', kind: 'value' },
        },
        forward: null,
        package: '@warp-drive/utilities',
      },
      'warp-drive/types': {
        entry: 'packages/-warp-drive/src/types.ts',
        exports: { LiveArray: { decl: 'warp-drive-packages/core/src/live-array.ts#LiveArray', kind: 'type' } },
        forward: null,
        package: 'warp-drive',
      },
    },
    packages: {
      '@ember-data/store': { dir: 'packages/store', modules: ['@ember-data/store'] },
      '@warp-drive/core': {
        dir: 'warp-drive-packages/core',
        modules: ['@warp-drive/core', '@warp-drive/core/store/-private', '@warp-drive/core/types'],
      },
      '@warp-drive/legacy': {
        dir: 'warp-drive-packages/legacy',
        modules: ['@warp-drive/legacy/adapter/error', '@warp-drive/legacy/compat/-private'],
      },
      '@warp-drive/utilities': { dir: 'warp-drive-packages/utilities', modules: ['@warp-drive/utilities/string'] },
      'warp-drive': { dir: 'packages/-warp-drive', modules: ['warp-drive/types'] },
    },
    schema: 1,
    tag: 'v3.0.0',
    version: '3.0.0',
  },

  // the repository, as the fake git of the spec answers for it
  'git/commits/2222222222.diff': `diff --git a/packages/adapter/src/error.js b/packages/adapter/src/error.js
index 1a2b3c4..5d6e7f8 100644
--- a/packages/adapter/src/error.js
+++ b/packages/adapter/src/error.js
@@ -10,26 +10,3 @@ function AdapterError(errors, message = 'Adapter operation failed') {
 }
 
 export default AdapterError;
-
-/**
-  Converts an array of JSON:API errors into an object keyed by attribute.
-
-  \`\`\`javascript
-  import { errorsArrayToHash } from '@ember-data/adapter/error';
-
-  errorsArrayToHash([{ source: { pointer: '/data/attributes/name' }, detail: 'is invalid' }]);
-  // => { name: ['is invalid'] }
-  \`\`\`
-
-  @method errorsArrayToHash
-  @deprecated use the errors of the request instead
-  @public
-*/
-export function errorsArrayToHash(errors) {
-  const out = {};
-  for (const error of errors) {
-    const key = error.source.pointer.split('/').at(-1);
-    (out[key] ??= []).push(error.detail);
-  }
-  return out;
-}
`,
  'git/commits/7777777777.diff': `diff --git a/packages/store/src/fetch-manager.ts b/packages/store/src/fetch-manager.ts
deleted file mode 100644
index 9a8b7c6..0000000
--- a/packages/store/src/fetch-manager.ts
+++ /dev/null
@@ -1,8 +0,0 @@
-class FetchManagerImpl {
-  pending = new Map<string, Promise<unknown>>();
-}
-
-/**
- * The store's shared fetch manager.
- */
-export const fetchManager = new FetchManagerImpl();
`,
  'git/log.json': {
    'StoreRequestInput v1.0.0..v3.0.0 packages/store/src/types.ts':
      '8888888888	refactor: move the request types to @warp-drive/core (#9500)',
    'fetchManager v1.0.0..v2.0.0 packages/store/src/fetch-manager.ts':
      '7777777777	chore: drop the fetch manager (#8700)',
  },
  'git/v1.0.0/packages/adapter/src/error.js': `/**
  A base class for the errors an adapter raises.

  @class AdapterError
  @public
*/
function AdapterError(errors, message = 'Adapter operation failed') {
  this.isAdapterError = true;
  this.errors = errors || [{ title: 'Adapter Error', detail: message }];
}

export default AdapterError;

/**
  Converts an array of JSON:API errors into an object keyed by attribute.

  \`\`\`javascript
  import { errorsArrayToHash } from '@ember-data/adapter/error';

  errorsArrayToHash([{ source: { pointer: '/data/attributes/name' }, detail: 'is invalid' }]);
  // => { name: ['is invalid'] }
  \`\`\`

  @method errorsArrayToHash
  @deprecated use the errors of the request instead
  @public
*/
export function errorsArrayToHash(errors) {
  const out = {};
  for (const error of errors) {
    const key = error.source.pointer.split('/').at(-1);
    (out[key] ??= []).push(error.detail);
  }
  return out;
}
`,
  'git/v1.0.0/packages/store/src/caches.ts': `export function recordIdentifierFor(record: object): string {
  return String(record);
}
`,
  'git/v1.0.0/packages/store/src/fetch-manager.ts': `class FetchManagerImpl {
  pending = new Map<string, Promise<unknown>>();
}

/**
 * The store's shared fetch manager.
 */
export const fetchManager = new FetchManagerImpl();
`,
  'git/v1.0.0/packages/store/src/identifier-array.ts': `/**
 * A live array of the records of one type.
 */
export class IdentifierArray<T = unknown> {
  declare type: string;
  declare records: T[];
  length = 0;

  constructor(options: { type: string; identifiers: string[] }) {
    this.type = options.type;
    this.length = options.identifiers.length;
  }
}
`,
  'git/v1.0.0/packages/store/src/identifiers.ts': `export function setIdentifierGenerationMethod(method: () => string): void {
  void method;
}
`,
  'git/v1.0.0/packages/store/src/store-service.ts': `export default class Store {
  peekRecord(type: string, id: string): unknown {
    return { type, id };
  }
}
`,
  'git/v1.0.0/packages/store/src/types.ts': `export interface StoreRequestInput {
  url?: string;
  op?: string;
}
`,
  'git/v1.0.0/packages/store/src/utils.ts': `/**
 * @deprecated use dasherize from @ember-data/request-utils/string
 */
export function normalizeModelName(name: string): string {
  return name.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

export function peekRecords(type: string): unknown[];
export function peekRecords(type: string, ids: string[]): unknown[];
export function peekRecords(type: string, ids?: string[]): unknown[] {
  return ids ? ids.map((id) => ({ type, id })) : [];
}
`,
  'git/v3.0.0/packages/store/src/identifiers.ts': `export function setIdentifierGenerationMethod(method: () => string): void {
  void method;
}
`,
  'git/v3.0.0/warp-drive-packages/core/src/caches.ts': `export function recordIdentifierFor(record: object): string {
  return String(record);
}
`,
  'git/v3.0.0/warp-drive-packages/core/src/live-array.ts': `/**
 * A reactive array of the resources of one type.
 */
export class LiveArray<T = unknown> {
  declare readonly type: string;
  declare records: T[];
  length = 0;

  constructor(options: { type: string; identifiers: string[] }) {
    this.type = options.type;
    this.length = options.identifiers.length;
  }
}

export function createLiveArray<T>(options: { type: string; identifiers: string[] }): LiveArray<T> {
  return new LiveArray<T>(options);
}
`,
  'git/v3.0.0/warp-drive-packages/core/src/peek.ts': `export function peekRecord(type: string, id: string): unknown {
  return { type, id };
}
`,
  'git/v3.0.0/warp-drive-packages/core/src/store-service.ts': `export class Store {
  peekRecord(type: string, id: string): unknown {
    return { type, id };
  }
}
`,
  'git/v3.0.0/warp-drive-packages/legacy/src/adapter/error.ts': `export class AdapterError extends Error {
  isAdapterError = true;
  errors: Array<{ title: string; detail: string }>;

  constructor(errors?: Array<{ title: string; detail: string }>, message = 'Adapter operation failed') {
    super(message);
    this.errors = errors ?? [{ title: 'Adapter Error', detail: message }];
  }
}

export class InvalidError extends AdapterError {
  isInvalidError = true;
}
`,
  'git/v3.0.0/warp-drive-packages/legacy/src/compat/fetch-manager.ts': `export class FetchManager {
  pending = new Map<string, Promise<unknown>>();
}
`,
  'git/v3.0.0/warp-drive-packages/utilities/src/string.ts': `export function dasherize(text: string): string {
  return text.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

export function normalizeModelName(name: string): string {
  return dasherize(name);
}
`,
};
