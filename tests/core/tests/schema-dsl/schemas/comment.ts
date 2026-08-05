import { field, Resource } from '@warp-drive/schema-dsl';

@Resource({ legacy: true })
export class Comment {
  @field declare body: string;
}
