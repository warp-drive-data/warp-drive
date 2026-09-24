import type { UpgradedMeta } from '../-edge-definition.ts';
import type { ResourceKey } from '../../../types/identifier.ts';

/**
 * The relationship definition (schema metadata) backing an {@link ImplicitEdge}, tagging
 * the {@link UpgradedMeta} as belonging to an implicit inverse relationship.
 */
export type ImplicitMeta = UpgradedMeta & {
  /** Always `'implicit'` for the definition of an {@link ImplicitEdge}. */
  kind: 'implicit';
  /** Always `true`, allowing this definition to be discriminated from `hasMany`/`belongsTo` definitions. */
  isImplicit: true;
};

/**
   Implicit relationships are relationships which have not been declared but the inverse side exists on
   another record somewhere

   For example consider the following two models

   ::: code-group

   ```js [./models/comment.js]
   import { Model, attr } from '@warp-drive/legacy/model';

   export default class Comment extends Model {
     @attr text;
   }
   ```

   ```js [./models/post.js]
    import { Model, attr, hasMany } from '@warp-drive/legacy/model';

   export default class Post extends Model {
     @attr title;
     @hasMany('comment', { async: true, inverse: null }) comments;
   }
   ```

   :::

   Then we would have a implicit 'post' relationship for the comment record in order
   to be do things like remove the comment from the post if the comment were to be deleted.
*/
export interface ImplicitEdge {
  /** The definition (schema metadata) for this implicit inverse relationship. */
  definition: ImplicitMeta;
  /** The resource this implicit relationship belongs to. */
  identifier: ResourceKey;
  /** Members added locally that have not yet been confirmed by a remote update. */
  localMembers: Set<ResourceKey>;
  /** Members known to be part of the relationship from remote (server-provided) state. */
  remoteMembers: Set<ResourceKey>;
}

/** Creates a new {@link ImplicitEdge} for the given definition and identifier. */
export function createImplicitEdge(definition: ImplicitMeta, identifier: ResourceKey): ImplicitEdge {
  return {
    definition,
    identifier,
    localMembers: new Set(),
    remoteMembers: new Set(),
  };
}
