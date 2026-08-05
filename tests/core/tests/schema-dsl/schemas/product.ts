import { field, Resource } from '@warp-drive/schema-dsl';

@Resource
export class Product {
  @field({ sourceKey: 'product_name' }) declare name: string;
  @field({ type: 'number', sourceKey: 'unit_price' }) declare price: number;
}
