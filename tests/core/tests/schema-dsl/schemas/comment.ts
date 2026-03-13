import { Resource, field } from '@warp-drive/schema-dsl';

@Resource({ legacy: true })
class Comment {
  @field declare body: string;
}
