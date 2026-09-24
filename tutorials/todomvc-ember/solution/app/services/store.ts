import { useRecommendedStore } from '@warp-drive/core';
import { JSONAPICache } from '@warp-drive/json-api';

export default useRecommendedStore({
  cache: JSONAPICache,
  schemas: [],
});
