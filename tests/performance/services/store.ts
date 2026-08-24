import { JSONAPICache } from '@warp-drive/json-api';
import type { Model } from '@warp-drive/legacy/model';
import { instantiateRecord, teardownRecord, buildSchema, modelFor } from '@warp-drive/legacy/model';
import { Store as DataStore, CacheHandler, RequestManager, Fetch } from '@warp-drive/core';
import type { CacheCapabilitiesManager, ModelSchema } from '@warp-drive/core/types';
import type { ResourceKey } from '@warp-drive/core/types';
import type { NextFn } from '@warp-drive/core/request';
import type { RequestContext } from '@warp-drive/core/types/request';

export default class Store extends DataStore {
  requestManager = new RequestManager()
    .use([
      {
        request<T>({ request }: RequestContext, next: NextFn<T>) {
          if (request.op === 'deleteRecord') {
            return Promise.resolve({ data: null }) as Promise<T>;
          }
          return next(request);
        },
      },
      Fetch,
    ])
    .useCache(CacheHandler);

  createSchemaService(): ReturnType<typeof buildSchema> {
    return buildSchema(this);
  }

  createCache(capabilities: CacheCapabilitiesManager) {
    return new JSONAPICache(capabilities);
  }

  instantiateRecord(identifier: ResourceKey, createRecordArgs: { [key: string]: unknown }) {
    return instantiateRecord.call(this, identifier, createRecordArgs);
  }

  teardownRecord(record: Model) {
    return teardownRecord.call(this, record);
  }

  modelFor(type: string): ModelSchema {
    return (modelFor.call(this, type) as ModelSchema) || super.modelFor(type);
  }
}
