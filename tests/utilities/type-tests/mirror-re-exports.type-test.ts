// Each `@ember-data/*` / `@warp-drive/core-types/*` subpath below is a barrel that
// `export *`s from a `@warp-drive/*` package. This file consumes their *built*
// `dist/*.d.ts` (not source), so it fails if the declaration bundler ever emits a
// barrel as `export type *` -- which erases every value binding for consumers and
// forces them into `import type` for things they call at runtime.
//
// Value bindings are referenced in value position (TS1362 if type-only); type
// bindings in type position. It lives outside `tests/` on purpose: `start.ts` globs
// `./tests/**/*-test.ts` into the browser bundle and `*.type-test.ts` matches.

import { graphFor, isBelongsTo, peekGraph } from '@ember-data/graph/-private';
import type {
  CollectionEdge,
  Graph,
  GraphEdge,
  ImplicitEdge,
  ResourceEdge,
  UpgradedMeta,
} from '@ember-data/graph/-private';
import {
  createRecord,
  deleteRecord,
  findRecord,
  postQuery,
  query,
  serializePatch,
  serializeResources,
  setBuildURLConfig,
  updateRecord,
} from '@ember-data/json-api/request';
import { FetchManager, SaveOp, Snapshot, SnapshotRecordArray, upgradeStore } from '@ember-data/legacy-compat/-private';
import {
  findAll as legacyFindAll,
  findRecord as legacyFindRecord,
  query as legacyQuery,
  queryRecord as legacyQueryRecord,
  saveRecord as legacySaveRecord,
} from '@ember-data/legacy-compat/builders';
import {
  configureAssertFn,
  configureMismatchReporter,
  configureTypeNormalization,
  expectId,
  formattedId,
  formattedType,
  isEquivId,
  isEquivType,
} from '@ember-data/legacy-compat/utils';
import {
  Errors,
  LEGACY_SUPPORT,
  lookupLegacySupport,
  PromiseBelongsTo,
  PromiseManyArray,
} from '@ember-data/model/-private';
import type {
  ManyArray,
  MaybeBelongsToFields,
  MaybeHasManyFields,
  MaybeRelationshipFields,
  MinimalLegacyRecord,
  ModelStore,
} from '@ember-data/model/-private';
import {
  DelegatingSchemaService,
  registerDerivations,
  withDefaults,
  withRestoredDeprecatedModelRequestBehaviors,
} from '@ember-data/model/migration-support';
import type { WithLegacy, WithLegacyDerivations } from '@ember-data/model/migration-support';
import RequestManager, {
  createDeferred,
  getPromiseResult,
  setPromiseResult,
  withBrand,
  withReactiveResponse,
  withResponseType,
} from '@ember-data/request';
import type {
  Awaitable,
  Context,
  Deferred,
  Future,
  Handler,
  NextFn,
  RequestContext,
  RequestInfo,
  StructuredDocument,
} from '@ember-data/request';
import {
  buildBaseURL,
  buildQueryParams,
  CachePolicy,
  filterEmpty,
  LifetimesService,
  parseCacheControl,
  setBuildURLConfig as setUtilsBuildURLConfig,
  sortQueryParams,
} from '@ember-data/request-utils';
import type {
  BuildURLConfig,
  CacheControlValue,
  PolicyConfig,
  QueryUrlOptions,
  UrlOptions,
} from '@ember-data/request-utils';
import {
  addTraceHeader,
  AutoCompress,
  Gate,
  MetaDocHandler,
  SupportsRequestStreams,
} from '@ember-data/request-utils/handlers';
import { camelize, capitalize, dasherize, pluralize, singularize, underscore } from '@ember-data/request-utils/string';
import {
  CacheHandler,
  coerceId,
  RecordArrayManager,
  recordIdentifierFor,
  Store,
  StoreMap,
  storeFor,
} from '@ember-data/store/-private';
import type {
  CachePolicy as StoreCachePolicy,
  CreateRecordProperties,
  InstanceCache,
  LegacyManyArray,
  StoreRequestInput,
} from '@ember-data/store/-private';
import { getOrSetGlobal, getOrSetUniversal, peekTransient, setTransient } from '@warp-drive/core-types/-private';
import {
  CACHE_OWNER,
  DEBUG_CLIENT_ORIGINATED,
  DEBUG_KEY_TYPE,
  DEBUG_STALE_CACHE_OWNER,
} from '@warp-drive/core-types/identifier';
import type {
  CacheKeyType,
  NewResourceKey,
  PersistedResourceKey,
  RequestKey,
  ResourceKey,
  StableRecordIdentifier,
} from '@warp-drive/core-types/identifier';
import { createIncludeValidator } from '@warp-drive/core-types/record';
import type {
  Includes,
  OpaqueRecordInstance,
  TypedRecordInstance,
  TypeFromInstance,
} from '@warp-drive/core-types/record';
import { EnableHydration, IS_FUTURE, SkipCache, STRUCTURED } from '@warp-drive/core-types/request';
import type {
  CacheOptions,
  HTTPMethod,
  ImmutableRequestInfo,
  RequestContext as CoreRequestContext,
  RequestInfo as CoreRequestInfo,
  StructuredDocument as CoreStructuredDocument,
} from '@warp-drive/core-types/request';
import { getRuntimeConfig, setIsMaybeMirage, setLogging } from '@warp-drive/core-types/runtime';
import {
  isLegacyResourceSchema,
  isResourceSchema,
  objectSchema,
  resourceSchema,
} from '@warp-drive/core-types/schema/fields';
import type {
  FieldSchema,
  LegacyResourceSchema,
  ObjectSchema,
  ResourceSchema,
  Trait,
} from '@warp-drive/core-types/schema/fields';
import { RecordStore, RequestSignature, ResourceType, TransformName, Type } from '@warp-drive/core-types/symbols';
import {
  ENFORCE_STRICT_RESOURCE_FINALIZATION,
  SAMPLE_FEATURE_FLAG,
} from '@warp-drive/core/build-config/canary-features';
import { LOG_CACHE, LOG_REQUESTS } from '@warp-drive/core/build-config/debugging';
import { DEPRECATE_NON_STRICT_ID, ENABLE_LEGACY_SCHEMA_SERVICE } from '@warp-drive/core/build-config/deprecations';

// ------------------------------
//              💚
// ==============================
//          Type Tests
// ==============================
//              🐹
// ⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇

// Referencing a binding as an argument is a value-position use: TS1362 if the
// declaration file only exports it as a type.
function assertValues(..._values: unknown[]): void {}

// @ember-data/model/-private
assertValues(Errors, LEGACY_SUPPORT, lookupLegacySupport, PromiseBelongsTo, PromiseManyArray);
// the classic factory must survive the ArrayProxy cast in errors.ts
export const createdErrors: Errors = Errors.create();
export type ModelPrivateTypes = [
  ManyArray,
  MaybeBelongsToFields<TypedRecordInstance>,
  MaybeHasManyFields<TypedRecordInstance>,
  MaybeRelationshipFields<TypedRecordInstance>,
  MinimalLegacyRecord,
  ModelStore,
];

// @ember-data/model/migration-support
assertValues(DelegatingSchemaService, registerDerivations, withDefaults, withRestoredDeprecatedModelRequestBehaviors);
export type MigrationSupportTypes = [WithLegacy<TypedRecordInstance>, WithLegacyDerivations<TypedRecordInstance>];

// @ember-data/store/-private
assertValues(CacheHandler, coerceId, RecordArrayManager, recordIdentifierFor, Store, StoreMap, storeFor);
export type StorePrivateTypes = [
  StoreCachePolicy,
  CreateRecordProperties<object>,
  InstanceCache,
  LegacyManyArray,
  StoreRequestInput,
];

// @ember-data/graph/-private
assertValues(graphFor, isBelongsTo, peekGraph);
export type GraphPrivateTypes = [CollectionEdge, Graph, GraphEdge, ImplicitEdge, ResourceEdge, UpgradedMeta];

// @ember-data/json-api/request (value-only module)
assertValues(
  createRecord,
  deleteRecord,
  findRecord,
  postQuery,
  query,
  serializePatch,
  serializeResources,
  setBuildURLConfig,
  updateRecord
);

// @ember-data/legacy-compat/-private
assertValues(FetchManager, SaveOp, Snapshot, SnapshotRecordArray, upgradeStore);
export type LegacyCompatPrivateTypes = [Snapshot, SnapshotRecordArray];

// @ember-data/legacy-compat/builders (value-only module)
assertValues(legacyFindAll, legacyFindRecord, legacyQuery, legacyQueryRecord, legacySaveRecord);

// @ember-data/legacy-compat/utils (value-only module)
assertValues(
  configureAssertFn,
  configureMismatchReporter,
  configureTypeNormalization,
  expectId,
  formattedId,
  formattedType,
  isEquivId,
  isEquivType
);

// @ember-data/request
assertValues(
  RequestManager,
  createDeferred,
  getPromiseResult,
  setPromiseResult,
  withBrand,
  withReactiveResponse,
  withResponseType
);
export type RequestTypes = [
  Awaitable<unknown>,
  Context,
  Deferred<unknown>,
  Future<unknown>,
  Handler,
  NextFn<unknown>,
  RequestContext,
  RequestInfo,
  StructuredDocument<unknown>,
];

// @ember-data/request-utils
assertValues(
  buildBaseURL,
  buildQueryParams,
  CachePolicy,
  filterEmpty,
  LifetimesService,
  parseCacheControl,
  setUtilsBuildURLConfig,
  sortQueryParams
);
export type RequestUtilsTypes = [BuildURLConfig, CacheControlValue, PolicyConfig, QueryUrlOptions, UrlOptions];

// @ember-data/request-utils/handlers (value-only module)
assertValues(addTraceHeader, AutoCompress, Gate, MetaDocHandler, SupportsRequestStreams);

// @ember-data/request-utils/string (value-only module)
assertValues(camelize, capitalize, dasherize, pluralize, singularize, underscore);

// @warp-drive/core-types/-private (value-only module)
assertValues(getOrSetGlobal, getOrSetUniversal, peekTransient, setTransient);

// @warp-drive/core-types/identifier
assertValues(CACHE_OWNER, DEBUG_CLIENT_ORIGINATED, DEBUG_KEY_TYPE, DEBUG_STALE_CACHE_OWNER);
export type CoreTypesIdentifierTypes = [
  CacheKeyType,
  NewResourceKey,
  PersistedResourceKey,
  RequestKey,
  ResourceKey,
  StableRecordIdentifier,
];

// @warp-drive/core-types/record
assertValues(createIncludeValidator);
export type CoreTypesRecordTypes = [
  Includes<TypedRecordInstance>,
  OpaqueRecordInstance,
  TypedRecordInstance,
  TypeFromInstance<TypedRecordInstance>,
];

// @warp-drive/core-types/request
assertValues(EnableHydration, IS_FUTURE, SkipCache, STRUCTURED);
export type CoreTypesRequestTypes = [
  CacheOptions,
  HTTPMethod,
  ImmutableRequestInfo,
  CoreRequestContext,
  CoreRequestInfo,
  CoreStructuredDocument<unknown>,
];

// @warp-drive/core-types/runtime (value-only module)
assertValues(getRuntimeConfig, setIsMaybeMirage, setLogging);

// @warp-drive/core-types/schema/fields
assertValues(isLegacyResourceSchema, isResourceSchema, objectSchema, resourceSchema);
export type CoreTypesFieldTypes = [FieldSchema, LegacyResourceSchema, ObjectSchema, ResourceSchema, Trait];

// @warp-drive/core-types/symbols (unique symbols: value and type at once)
assertValues(RecordStore, RequestSignature, ResourceType, TransformName, Type);
export type CoreTypesSymbolTypes = [
  typeof RecordStore,
  typeof RequestSignature,
  typeof ResourceType,
  typeof TransformName,
  typeof Type,
];

// @warp-drive/core/build-config/* (value-only modules)
assertValues(
  ENFORCE_STRICT_RESOURCE_FINALIZATION,
  SAMPLE_FEATURE_FLAG,
  LOG_CACHE,
  LOG_REQUESTS,
  DEPRECATE_NON_STRICT_ID,
  ENABLE_LEGACY_SCHEMA_SERVICE
);
