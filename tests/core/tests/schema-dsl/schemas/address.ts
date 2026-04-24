import { field, hash, ObjectSchema } from '@warp-drive/schema-dsl';

@ObjectSchema
export class Address {
  @hash({ type: '@identity' }) declare addressHash: string;
  @field declare street: string;
  @field declare city: string;
}
