import { array, field, id, object, Resource } from '@warp-drive/schema-dsl';

@Resource
export class Post {
  @id declare uuid: string;
  @field declare title: string;
  @field declare createdAt: string;
  @object declare metadata: Record<string, unknown>;
  @array declare tags: string[];
}
