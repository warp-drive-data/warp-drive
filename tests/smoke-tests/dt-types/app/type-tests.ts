/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * These tests are more fro the out-of-monorepo tests,
 * as we'll sever the references links to the source of each of these packages
 *
 * Just need to make sure each module has types at publish.
 */
import { expectTypeOf } from 'expect-type';
import StoreX from 'ember-data/store';
import DS from 'ember-data';

// @ts-expect-error this exists in the real package, but not DT Types
import Adapter from '@ember-data/adapter/-private/build-url-mixin';

expectTypeOf<typeof StoreX>().not.toBeAny();

import Store from '@ember-data/store';
import RequestManager from '@ember-data/request';
import { BuildURLMixin } from '@ember-data/adapter';
import jsonapi from '@ember-data/json-api';
import { adapterFor } from '@ember-data/legacy-compat';
import Model from '@ember-data/model';
import { setBuildURLConfig } from '@ember-data/request-utils';
import Serializer from '@ember-data/serializer';

// Most of this is to assure thet above imports don't get optimized away
expectTypeOf<typeof DS>().not.toBeAny();
expectTypeOf<typeof import('ember-data')>().not.toBeAny();
expectTypeOf<typeof Store>().not.toBeAny();
expectTypeOf<typeof Model>().not.toBeAny();
expectTypeOf<typeof Model>().toHaveProperty('reopen');
expectTypeOf<typeof Serializer>().not.toBeAny();
expectTypeOf<typeof RequestManager>().not.toBeAny();
// @ts-expect-error @ember/object/mixin's DT types declare `Mixin<T, Base>` with
// no default for `T`, but this package's own `BuildURLMixin: Mixin` annotation
// is written against ember-source/types' non-generic `Mixin` -- the two ambient
// declarations have incompatible arity and can't both be satisfied at once.
expectTypeOf<typeof BuildURLMixin>().not.toBeAny();
expectTypeOf<typeof jsonapi>().not.toBeAny();
expectTypeOf<typeof setBuildURLConfig>().not.toBeAny();
expectTypeOf<typeof adapterFor>().not.toBeAny();
