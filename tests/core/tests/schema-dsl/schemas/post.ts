import { field, id, Resource } from '@warp-drive/schema-dsl';

@Resource
export class Post {
  @id declare uuid: string;
  @field declare title: string;
  @field({ type: 'date-time' }) declare createdAt: Date;
}
