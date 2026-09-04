import { array, field, id, object, Resource, schemaArray, schemaObject } from '@warp-drive/schema-dsl';

import type { Address } from './address.ts';
import type { TextContent, VideoContent } from './content.ts';

@Resource
export class Post {
  @id declare uuid: string;
  @field declare title: string;
  @field({ type: 'date-time' }) declare createdAt: string;
  @object declare metadata: Record<string, unknown>;
  @array declare tags: string[];
  @schemaArray({ type: 'address', key: '@index', defaultValue: true }) declare locations: Address[];
  @schemaObject({ polymorphic: true, typeField: 'type' }) declare content: TextContent | VideoContent;
}
