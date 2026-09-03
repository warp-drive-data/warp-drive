import { expectTypeOf } from 'expect-type';

import { useRecommendedStore } from '../../index.ts';
import type { DefaultCachePolicy } from '../../store.ts';
import type { CacheCapabilitiesManager } from '../../types.ts';
import type { Cache } from '../../types/cache.ts';

declare const TestCache: new (capabilities: CacheCapabilitiesManager) => Cache;

//////////////////////////////////
//////////////////////////////////
// useRecommendedStore
//////////////////////////////////
//////////////////////////////////
{
  const Store = useRecommendedStore({
    cache: TestCache,
  });

  type Store = InstanceType<typeof Store>;

  expectTypeOf<Store['lifetimes']>().toEqualTypeOf<DefaultCachePolicy>();
}
