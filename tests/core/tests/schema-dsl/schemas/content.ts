import { field, ObjectSchema } from '@warp-drive/schema-dsl';

@ObjectSchema
export class TextContent {
  @field declare type: string;
  @field declare text: string;
}

@ObjectSchema
export class VideoContent {
  @field declare type: string;
  @field declare url: string;
}
