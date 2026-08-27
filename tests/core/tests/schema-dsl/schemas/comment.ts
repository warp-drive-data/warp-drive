import { attribute, belongsTo, field, hasMany, Resource, trait } from '@warp-drive/schema-dsl';

import { Timestamped } from './timestamped.ts';

@Resource({ legacy: true })
@trait(Timestamped)
export class Comment {
  @field declare body: string;
  @attribute({ type: 'string' }) declare author: string;
  @belongsTo({ type: 'post', inverse: 'comments', async: true }) declare post: unknown;
  @hasMany({ type: 'comment', inverse: null, async: false }) declare replies: unknown[];
}
