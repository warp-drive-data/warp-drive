import type Owner from '@ember/owner';
import { setOwner } from '@ember/owner';

import { useRecommendedStore } from '@warp-drive/core';
import { withDefaults } from '@warp-drive/core/reactive';
import type { Handler } from '@warp-drive/core/request';
import type { ObjectSchema, PolarisResourceSchema } from '@warp-drive/core/types/schema/fields';
import type { Type } from '@warp-drive/core/types/symbols';
import { JSONAPICache } from '@warp-drive/json-api';

export const UserSchema = withDefaults({
  type: 'user',
  fields: [
    {
      name: 'name',
      kind: 'field',
    },
  ],
});

export type User = Readonly<{
  id: string;
  name: string;
  $type: 'user';
  [Type]: 'user';
}>;

export type EditableUser = {
  readonly id: string;
  name: string;
  readonly $type: 'user';
  readonly [Type]: 'user';
};

export function createStore(
  owner: Owner,
  config?: {
    handlers?: Handler[];
    schemas?: Array<PolarisResourceSchema | ObjectSchema>;
  }
) {
  const Store = useRecommendedStore({
    cache: JSONAPICache,
    handlers: config?.handlers ?? [],
    schemas: config?.schemas ?? [UserSchema],
  });

  const store = new Store();
  setOwner(store, owner);
  owner.register('service:store', store, { instantiate: false });
  return store;
}
