import { derived, field, local, Resource, schemaObject } from '@warp-drive/schema-dsl';

import type { Address } from './address.ts';

@Resource
export class User {
  @field declare firstName: string;
  @field declare lastName: string;
  @field declare email: string;
  @local declare isEditing: boolean;
  @local({ defaultValue: 0 }) declare dirtyCount: number;
  @derived({ type: '@concat' }) declare displayName: string;
  @schemaObject({ type: 'address' }) declare address: Address;
}
