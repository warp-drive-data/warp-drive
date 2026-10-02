/**
 * Fixtures for the history and diff tests: a hand-written pair of surfaces 1.0.0 -> 1.1.0 with the
 * history and the diff between them, and two `git diff --name-status` samples from this repository.
 */
import type { Tree } from './tree.mts';

export const tree: Tree = {
  'diff-1.0.0-1.1.0.json': {
    declarations: {
      'external:rsvp#Promise': null,
      'packages/old/src/index.ts#oldThing': null,
      'packages/store/src/cache.ts#peekCache': null,
      'packages/store/src/coerce-id.ts#default': 'packages/store/src/coerce-id.ts#coerceId',
      'packages/store/src/flags.ts#FLAG': null,
      'packages/store/src/gone.ts#gone': null,
      'packages/store/src/graph.ts#Graph': 'warp-drive-packages/core/src/graph.ts#Graph',
      'packages/store/src/identifier.ts#Identifier': 'packages/store/src/identifier.ts#ResourceKey',
      'packages/store/src/identifier.ts#isStableIdentifier': 'packages/store/src/identifier.ts#isResourceKey',
      'packages/store/src/ids.ts#OldA': null,
      'packages/store/src/ids.ts#OldB': null,
      'packages/store/src/legacy.ts#legacyHelper': null,
      'packages/store/src/manager.ts#Manager': null,
      'packages/store/src/normalize.ts#normalizeModelName': null,
      'packages/store/src/record-array.ts#default': 'packages/store/src/record-array.ts#LiveArray',
      'packages/store/src/record.ts#Record': 'warp-drive-packages/core/src/record.ts#Record',
      'packages/store/src/request.js#request': 'packages/store/src/request.ts#request',
      'packages/store/src/schema.ts#Schema': 'warp-drive-packages/core/src/schema.ts#Schema',
      'packages/store/src/snapshot.ts#default': 'warp-drive-packages/legacy/src/snapshot.ts#Snapshot',
      'packages/store/src/store.ts#default': 'warp-drive-packages/core/src/store.ts#Store',
      'packages/store/src/types.ts#*ns': 'warp-drive-packages/core/src/types.ts#*ns',
    },
    exports: {
      '@acme/core': {
        added: {
          Graph: { decl: 'warp-drive-packages/core/src/graph.ts#Graph', kind: 'value' },
          Record: { decl: 'warp-drive-packages/core/src/record.ts#Record', kind: 'value' },
          RecordOptions: { decl: 'warp-drive-packages/core/src/record.ts#RecordOptions', kind: 'type' },
          Schema: { decl: 'warp-drive-packages/core/src/schema.ts#Schema', kind: 'value' },
          Store: { decl: 'warp-drive-packages/core/src/store.ts#Store', kind: 'value' },
          StoreOptions: { decl: 'warp-drive-packages/core/src/store.ts#StoreOptions', kind: 'type' },
          assert: { decl: 'warp-drive-packages/core/src/utils.ts#assert', kind: 'value' },
          types: { decl: 'warp-drive-packages/core/src/types.ts#*ns', kind: 'value' },
        },
      },
      '@acme/store': {
        added: {
          LiveArray: { decl: 'packages/store/src/record-array.ts#LiveArray', kind: 'value' },
          ResourceKey: { decl: 'packages/store/src/identifier.ts#ResourceKey', kind: 'type' },
          isResourceKey: { decl: 'packages/store/src/identifier.ts#isResourceKey', kind: 'value' },
        },
        changed: {
          Cache: { deprecated: true },
          EmberObject: { deprecated: null },
          Graph: { decl: 'warp-drive-packages/legacy/src/graph.ts#Graph' },
          Record: { decl: 'warp-drive-packages/core/src/record.ts#Record' },
          Schema: { decl: 'warp-drive-packages/core/src/schema.ts#Schema', kind: 'type' },
          Snapshot: { decl: 'warp-drive-packages/legacy/src/snapshot.ts#Snapshot' },
          coerceId: { decl: 'packages/store/src/coerce-id.ts#coerceId' },
          default: { decl: 'warp-drive-packages/core/src/store.ts#Store' },
          normalizeModelName: { decl: 'packages/store/src/compat.ts#normalizeModelName' },
          request: { decl: 'packages/store/src/request.ts#request' },
        },
        removed: ['Identifier', 'RecordArray', 'isStableIdentifier', 'peekCache', 'types'],
      },
      '@acme/store/-private': {
        added: {
          FlagType: { decl: 'packages/store/src/flags.ts#FlagType', kind: 'type' },
          ManagerA: { decl: 'packages/store/src/manager-a.ts#ManagerA', kind: 'value' },
          ManagerB: { decl: 'packages/store/src/manager-b.ts#ManagerB', kind: 'value' },
          NewId: { decl: 'packages/store/src/ids.ts#NewId', kind: 'type' },
          compatHelper: { decl: 'packages/store/src/compat.ts#compatHelper', kind: 'value' },
        },
        changed: { Snapshot: { decl: 'warp-drive-packages/legacy/src/snapshot.ts#LegacySnapshot' } },
        removed: ['FLAG', 'Manager', 'OldA', 'OldB', 'gone', 'legacyHelper'],
      },
      '@acme/store/compat': {
        added: { compatHelper: { decl: 'packages/store/src/compat.ts#compatHelper', kind: 'value' } },
      },
      '@acme/store/legacy': {
        added: { Store: { decl: 'warp-drive-packages/core/src/store.ts#Store', kind: 'value' } },
        removed: ['legacyHelper'],
      },
    },
    from: '1.0.0',
    kind: 'diff',
    modules: {
      added: {
        '@acme/core': { entry: 'warp-drive-packages/core/src/index.ts', forward: null, package: '@acme/core' },
        '@acme/store/compat': { entry: 'packages/store/src/compat.ts', forward: null, package: '@acme/store' },
      },
      changed: {
        '@acme/store/-private': { entry: 'packages/store/src/-private/index.ts' },
        '@acme/store/legacy': { forward: '@acme/core' },
      },
      removed: ['@acme/old'],
    },
    packages: {
      added: { '@acme/core': { dir: 'warp-drive-packages/core', modules: ['@acme/core'] } },
      changed: {
        '@acme/store': { modules: ['@acme/store', '@acme/store/-private', '@acme/store/compat', '@acme/store/legacy'] },
      },
      removed: ['@acme/old'],
    },
    schema: 1,
    to: '1.1.0',
  },
  'history-1.0.0-1.1.0.json': {
    schema: 1,
    kind: 'history',
    from: '1.0.0',
    to: '1.1.0',
    files: {
      'packages/old/src/index.ts': [],
      'packages/store/src/graph.ts': [
        'warp-drive-packages/core/src/graph.ts',
        'warp-drive-packages/legacy/src/graph.ts',
      ],
      'packages/store/src/gone.ts': [],
      'packages/store/src/manager.ts': [],
      'packages/store/src/normalize.ts': [],
      'packages/store/src/record.ts': [],
      'packages/store/src/request.js': ['packages/store/src/request.ts'],
      'packages/store/src/schema.ts': ['packages/store/src/schema.ts', 'warp-drive-packages/core/src/schema.ts'],
      'packages/store/src/snapshot.ts': ['warp-drive-packages/legacy/src/snapshot.ts'],
      'packages/store/src/store.ts': ['warp-drive-packages/core/src/store.ts'],
      'packages/store/src/types.ts': ['warp-drive-packages/core/src/types.ts'],
      'packages/store/src/utils.ts': ['packages/store/src/utils.ts', 'warp-drive-packages/core/src/utils.ts'],
    },
    symbols: {
      'packages/old/src/index.ts#oldThing': { commit: '1111111111', subject: 'chore: remove @acme/old', added: [] },
      'packages/store/src/store.ts#default': {
        commit: '2222222222',
        subject: 'refactor: export Store by name',
        added: ['warp-drive-packages/core/src/store.ts#Store', 'warp-drive-packages/core/src/store.ts#StoreOptions'],
      },
      'packages/store/src/record.ts#Record': {
        commit: '3333333333',
        subject: 'feat: move Record to @acme/core',
        added: [
          'warp-drive-packages/core/src/record.ts#Record',
          'warp-drive-packages/core/src/record.ts#RecordOptions',
          'warp-drive-packages/core/src/record.ts#helper',
        ],
      },
      'packages/store/src/identifier.ts#Identifier': {
        commit: '4444444444',
        subject: 'refactor: rename identifiers to resource keys',
        added: ['packages/store/src/identifier.ts#ResourceKey', 'packages/store/src/identifier.ts#isResourceKey'],
      },
      'packages/store/src/identifier.ts#isStableIdentifier': {
        commit: '4444444444',
        subject: 'refactor: rename identifiers to resource keys',
        added: ['packages/store/src/identifier.ts#ResourceKey', 'packages/store/src/identifier.ts#isResourceKey'],
      },
      'packages/store/src/legacy.ts#legacyHelper': {
        commit: '5555555555',
        subject: 'feat: compat helpers',
        added: ['packages/store/src/compat.ts#compatHelper', 'packages/store/src/compat.ts#internal'],
      },
      'packages/store/src/flags.ts#FLAG': {
        commit: '6666666666',
        subject: 'refactor: flags become a type',
        added: ['packages/store/src/flags.ts#FlagType'],
      },
      'packages/store/src/ids.ts#OldA': {
        commit: '7777777777',
        subject: 'refactor: one id type',
        added: ['packages/store/src/ids.ts#NewId'],
      },
      'packages/store/src/ids.ts#OldB': {
        commit: '7777777777',
        subject: 'refactor: one id type',
        added: ['packages/store/src/ids.ts#NewId'],
      },
      'packages/store/src/manager.ts#Manager': {
        commit: '8888888888',
        subject: 'refactor: split Manager',
        added: ['packages/store/src/manager-a.ts#ManagerA', 'packages/store/src/manager-b.ts#ManagerB'],
      },
      'packages/store/src/record-array.ts#default': {
        commit: '9999999999',
        subject: 'refactor: name the record array LiveArray',
        added: ['packages/store/src/record-array.ts#LiveArray'],
      },
      'packages/store/src/snapshot.ts#default': {
        commit: 'aaaaaaaaaa',
        subject: 'feat: a snapshot for legacy adapters',
        added: ['warp-drive-packages/legacy/src/snapshot.ts#LegacySnapshot'],
      },
    },
  },
  'name-status-5.0.1-5.4.1.txt': `D	packages/-ember-data/.npmignore
D	packages/-ember-data/addon/adapter.ts
D	packages/-ember-data/addon/index.js
A	packages/-ember-data/src/adapter.ts
A	packages/-ember-data/src/index.ts
R057	packages/-ember-data/addon-test-support/index.js	packages/-ember-data/src/test-support/index.ts
R052	packages/private-build-infra/src/transforms/babel-plugin-transform-deprecations/index.js	packages/build-config/cjs-src/transforms/babel-plugin-transform-deprecations.js
C048	packages/store/src/-private/managers/cache-manager.ts	packages/core-types/src/cache.ts
C051	packages/store/src/-private/managers/cache-manager.ts	packages/experiments/src/persisted-cache/cache.ts
R100	packages/graph/src/-private/graph/-state.ts	packages/graph/src/-private/-state.ts
D	packages/graph/src/-private/graph/index.ts
D	packages/model/src/-private/attr.js
A	packages/model/src/-private/attr.ts
A	packages/request/src/-private/promise-cache.ts
M	packages/store/src/-private/managers/cache-manager.ts
M	packages/store/src/-private/store-service.ts
`,
  'name-status-5.5.0-5.6.0.txt': `D	packages/build-config/src/env.ts
M	packages/graph/src/-private.ts
D	packages/request/src/-private/manager.ts
M	packages/store/package.json
C048	packages/graph/src/-private.ts	warp-drive-packages/core/src/graph/-private.ts
C100	packages/ember/src/.gitkeep	warp-drive-packages/core/src/index.md
A	warp-drive-packages/core/src/reactive/-private/fields/extension.ts
R092	packages/store/src/-private/store-service.ts	warp-drive-packages/core/src/store/-private/store-service.ts
R099	packages/store/src/-private/store-service.type-test.ts	warp-drive-packages/core/src/store/-private/store-service.type-test.ts
C100	packages/ember/src/.gitkeep	warp-drive-packages/ember/src/.gitkeep
C100	packages/ember/src/.gitkeep	warp-drive-packages/experiments/src/.gitkeep
C100	packages/ember/src/.gitkeep	warp-drive-packages/legacy/src/compat/.gitkeep
R090	packages/model/src/-private/attr.ts	warp-drive-packages/legacy/src/model/-private/attr.ts
R100	packages/ember/src/.gitkeep	warp-drive-packages/legacy/src/serializer/.gitkeep
`,
  'surface-1.0.0.json': {
    schema: 1,
    kind: 'surface',
    version: '1.0.0',
    tag: 'v1.0.0',
    packages: {
      '@acme/old': { dir: 'packages/old', modules: ['@acme/old'] },
      '@acme/store': { dir: 'packages/store', modules: ['@acme/store', '@acme/store/-private', '@acme/store/legacy'] },
    },
    modules: {
      '@acme/old': {
        package: '@acme/old',
        entry: 'packages/old/src/index.ts',
        forward: null,
        exports: {
          oldThing: { kind: 'value', decl: 'packages/old/src/index.ts#oldThing' },
          Promise: { kind: 'value', decl: 'external:rsvp#Promise' },
        },
      },
      '@acme/store': {
        package: '@acme/store',
        entry: 'packages/store/src/index.ts',
        forward: null,
        exports: {
          default: { kind: 'value', decl: 'packages/store/src/store.ts#default' },
          Cache: { kind: 'type', decl: 'packages/store/src/cache.ts#Cache' },
          peekCache: { kind: 'value', decl: 'packages/store/src/cache.ts#peekCache', deprecated: true },
          request: { kind: 'value', decl: 'packages/store/src/request.js#request' },
          Schema: { kind: 'value', decl: 'packages/store/src/schema.ts#Schema' },
          assert: { kind: 'value', decl: 'packages/store/src/utils.ts#assert' },
          Graph: { kind: 'value', decl: 'packages/store/src/graph.ts#Graph' },
          Record: { kind: 'value', decl: 'packages/store/src/record.ts#Record' },
          RecordArray: { kind: 'value', decl: 'packages/store/src/record-array.ts#default' },
          coerceId: { kind: 'value', decl: 'packages/store/src/coerce-id.ts#default' },
          normalizeModelName: { kind: 'value', decl: 'packages/store/src/normalize.ts#normalizeModelName' },
          Snapshot: { kind: 'value', decl: 'packages/store/src/snapshot.ts#default' },
          isStableIdentifier: { kind: 'value', decl: 'packages/store/src/identifier.ts#isStableIdentifier' },
          Identifier: { kind: 'type', decl: 'packages/store/src/identifier.ts#Identifier' },
          types: { kind: 'value', decl: 'packages/store/src/types.ts#*ns' },
          EmberObject: { kind: 'value', decl: 'external:@ember/object#default', deprecated: true },
        },
      },
      '@acme/store/-private': {
        package: '@acme/store',
        entry: 'packages/store/src/-private.ts',
        forward: null,
        exports: {
          gone: { kind: 'value', decl: 'packages/store/src/gone.ts#gone' },
          legacyHelper: { kind: 'value', decl: 'packages/store/src/legacy.ts#legacyHelper' },
          FLAG: { kind: 'value', decl: 'packages/store/src/flags.ts#FLAG' },
          OldA: { kind: 'type', decl: 'packages/store/src/ids.ts#OldA' },
          OldB: { kind: 'type', decl: 'packages/store/src/ids.ts#OldB' },
          Manager: { kind: 'value', decl: 'packages/store/src/manager.ts#Manager' },
          Snapshot: { kind: 'value', decl: 'packages/store/src/snapshot.ts#default' },
        },
      },
      '@acme/store/legacy': {
        package: '@acme/store',
        entry: 'packages/store/src/legacy.ts',
        forward: null,
        exports: { legacyHelper: { kind: 'value', decl: 'packages/store/src/legacy.ts#legacyHelper' } },
      },
    },
  },
  'surface-1.1.0.json': {
    schema: 1,
    kind: 'surface',
    version: '1.1.0',
    tag: 'v1.1.0',
    packages: {
      '@acme/core': { dir: 'warp-drive-packages/core', modules: ['@acme/core'] },
      '@acme/store': {
        dir: 'packages/store',
        modules: ['@acme/store', '@acme/store/-private', '@acme/store/compat', '@acme/store/legacy'],
      },
    },
    modules: {
      '@acme/core': {
        package: '@acme/core',
        entry: 'warp-drive-packages/core/src/index.ts',
        forward: null,
        exports: {
          Store: { kind: 'value', decl: 'warp-drive-packages/core/src/store.ts#Store' },
          StoreOptions: { kind: 'type', decl: 'warp-drive-packages/core/src/store.ts#StoreOptions' },
          Schema: { kind: 'value', decl: 'warp-drive-packages/core/src/schema.ts#Schema' },
          assert: { kind: 'value', decl: 'warp-drive-packages/core/src/utils.ts#assert' },
          Graph: { kind: 'value', decl: 'warp-drive-packages/core/src/graph.ts#Graph' },
          Record: { kind: 'value', decl: 'warp-drive-packages/core/src/record.ts#Record' },
          RecordOptions: { kind: 'type', decl: 'warp-drive-packages/core/src/record.ts#RecordOptions' },
          types: { kind: 'value', decl: 'warp-drive-packages/core/src/types.ts#*ns' },
        },
      },
      '@acme/store': {
        package: '@acme/store',
        entry: 'packages/store/src/index.ts',
        forward: null,
        exports: {
          default: { kind: 'value', decl: 'warp-drive-packages/core/src/store.ts#Store' },
          Cache: { kind: 'type', decl: 'packages/store/src/cache.ts#Cache', deprecated: true },
          request: { kind: 'value', decl: 'packages/store/src/request.ts#request' },
          Schema: { kind: 'type', decl: 'warp-drive-packages/core/src/schema.ts#Schema' },
          assert: { kind: 'value', decl: 'packages/store/src/utils.ts#assert' },
          Graph: { kind: 'value', decl: 'warp-drive-packages/legacy/src/graph.ts#Graph' },
          Record: { kind: 'value', decl: 'warp-drive-packages/core/src/record.ts#Record' },
          LiveArray: { kind: 'value', decl: 'packages/store/src/record-array.ts#LiveArray' },
          coerceId: { kind: 'value', decl: 'packages/store/src/coerce-id.ts#coerceId' },
          normalizeModelName: { kind: 'value', decl: 'packages/store/src/compat.ts#normalizeModelName' },
          Snapshot: { kind: 'value', decl: 'warp-drive-packages/legacy/src/snapshot.ts#Snapshot' },
          isResourceKey: { kind: 'value', decl: 'packages/store/src/identifier.ts#isResourceKey' },
          ResourceKey: { kind: 'type', decl: 'packages/store/src/identifier.ts#ResourceKey' },
          EmberObject: { kind: 'value', decl: 'external:@ember/object#default' },
        },
      },
      '@acme/store/-private': {
        package: '@acme/store',
        entry: 'packages/store/src/-private/index.ts',
        forward: null,
        exports: {
          compatHelper: { kind: 'value', decl: 'packages/store/src/compat.ts#compatHelper' },
          FlagType: { kind: 'type', decl: 'packages/store/src/flags.ts#FlagType' },
          NewId: { kind: 'type', decl: 'packages/store/src/ids.ts#NewId' },
          ManagerA: { kind: 'value', decl: 'packages/store/src/manager-a.ts#ManagerA' },
          ManagerB: { kind: 'value', decl: 'packages/store/src/manager-b.ts#ManagerB' },
          Snapshot: { kind: 'value', decl: 'warp-drive-packages/legacy/src/snapshot.ts#LegacySnapshot' },
        },
      },
      '@acme/store/compat': {
        package: '@acme/store',
        entry: 'packages/store/src/compat.ts',
        forward: null,
        exports: { compatHelper: { kind: 'value', decl: 'packages/store/src/compat.ts#compatHelper' } },
      },
      '@acme/store/legacy': {
        package: '@acme/store',
        entry: 'packages/store/src/legacy.ts',
        forward: '@acme/core',
        exports: { Store: { kind: 'value', decl: 'warp-drive-packages/core/src/store.ts#Store' } },
      },
    },
  },
};
