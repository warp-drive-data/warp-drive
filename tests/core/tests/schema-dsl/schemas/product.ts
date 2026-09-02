import { alias, field, Resource, schemaObject } from '@warp-drive/schema-dsl';

@Resource
export class Product {
  @field({ sourceKey: 'product_name' }) declare name: string;
  @field({ type: 'number', sourceKey: 'unit_price' }) declare price: number;
  @alias({ kind: 'field', name: 'name' }) declare productName: string;
  @schemaObject({ type: '@computeKind', polymorphic: true, typeField: '@hash', sourceKey: 'kind_data' })
  declare kind: unknown;
}
