import { expectTypeOf } from 'expect-type';

import { type CachePolicy, type StoreSetupOptions, useRecommendedStore } from '../../index.ts';
import type { DefaultCachePolicy } from '../../store.ts';
import type { CacheCapabilitiesManager } from '../../types.ts';
import type { Cache } from '../../types/cache.ts';

declare const TestCache: new (capabilities: CacheCapabilitiesManager) => Cache;
declare const StoreOptions: StoreSetupOptions;

class CustomCachePolicy implements CachePolicy {
  readonly custom = true;

  isHardExpired(): boolean {
    return false;
  }

  isSoftExpired(): boolean {
    return false;
  }
}

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

//////////////////////////////////
//////////////////////////////////
// useRecommendedStore with a custom cache policy
//////////////////////////////////
//////////////////////////////////
{
  const Store = useRecommendedStore({
    cache: TestCache,
    policy: new CustomCachePolicy(),
  });

  type Store = InstanceType<typeof Store>;

  expectTypeOf<Store['lifetimes']>().toEqualTypeOf<CustomCachePolicy>();
}

//////////////////////////////////
//////////////////////////////////
// useRecommendedStore with widened options
//////////////////////////////////
//////////////////////////////////
{
  const Store = useRecommendedStore(StoreOptions);

  type Store = InstanceType<typeof Store>;

  expectTypeOf<Store['lifetimes']>().toEqualTypeOf<CachePolicy>();
}
