import { computeLocalState } from '../-diff.ts';
import type { UpgradedMeta } from '../-edge-definition.ts';
import type { RelationshipState } from '../-state.ts';
import { createState } from '../-state.ts';
import type { CollectionRelationship } from '../../../types/cache/relationship.ts';
import type { ResourceKey } from '../../../types/identifier.ts';
import type { Links, Meta, PaginationLinks } from '../../../types/spec/json-api-raw.ts';

/**
 * Stores the graph's internal state for one side of a collection (`hasMany`) relationship.
 */
export interface CollectionEdge {
  /** The upgraded relationship definition (schema metadata) for this edge. */
  definition: UpgradedMeta;
  /** The resource this relationship belongs to. */
  identifier: ResourceKey;
  /** Bookkeeping flags describing what we know about this relationship's data. */
  state: RelationshipState;

  /** The set of members known to be part of the remote (server-provided) state, used for fast membership checks. */
  remoteMembers: Set<ResourceKey>;
  /** The ordered list of members that make up the remote (server-provided) state of the relationship. */
  remoteState: ResourceKey[];

  /** Members that have been locally added to the relationship but not yet reflected in remote state. */
  additions: Set<ResourceKey> | null;
  /** Members that have been locally removed from the relationship but not yet reflected in remote state. */
  removals: Set<ResourceKey> | null;

  /** The most recently received JSON:API `meta` for this relationship. */
  meta: Meta | null;
  /** The most recently received JSON:API `links` for this relationship. */
  links: Links | PaginationLinks | null;

  /** The computed local (client-side) ordering of members, incorporating any pending {@link CollectionEdge.additions} and {@link CollectionEdge.removals}. Cached until `isDirty` is set. */
  localState: ResourceKey[] | null;
  /**
   * Whether the localState for this edge is out-of-sync
   * with the remoteState.
   *
   * if state.hasReceivedData=false we are also
   * not dirty since there is nothing to sync with.
   *
   */
  isDirty: boolean;
  /** The transaction id of the last transaction that touched this relationship, used to detect stale/out-of-order remote updates. */
  transactionRef: number;
  /**
   * Whether data for this edge has been accessed at least once
   * via `graph.getData`
   *
   */
  accessed: boolean;

  /**
   * The most recently computed diff between the prior and new remote state, retained so that
   * consumers (e.g. a `ManyArray`) may patch themselves incrementally instead of recomputing
   * from scratch.
   */
  _diff?: {
    /** Members present in the new remote state that were not present previously. */
    add: Set<ResourceKey>;
    /** Members present in the previous remote state that are no longer present. */
    del: Set<ResourceKey>;
  };
}

/** Creates a new {@link CollectionEdge} for the given definition and identifier. */
export function createCollectionEdge(definition: UpgradedMeta, identifier: ResourceKey): CollectionEdge {
  return {
    definition,
    identifier,
    state: createState(),
    remoteMembers: new Set(),
    remoteState: [],
    additions: null,
    removals: null,

    meta: null,
    links: null,

    localState: null,
    isDirty: false,
    transactionRef: 0,
    accessed: false,
    _diff: undefined,
  };
}

const cp = structuredClone;

/**
 * Builds a legacy `{ data, links, meta }` {@link CollectionRelationship} payload for this edge,
 * using either the remote or the computed local state, and marks the edge as accessed.
 */
export function legacyGetCollectionRelationshipData(
  source: CollectionEdge,
  getRemoteState: boolean
): CollectionRelationship {
  source.accessed = true;
  const payload: CollectionRelationship = {};

  if (source.state.hasReceivedData) {
    // every access refreshes the edge's local-state tracking, remote-state reads
    // included: `computeLocalState` is the only place `isDirty` is cleared and the
    // `localState` snapshot re-derived, and `diffCollection` trusts that snapshot
    // as "what an up-to-date reader currently sees" when deciding whether the next
    // remote update changed anything. A reader that only ever consumes remote
    // state (e.g. a non-editable `linksMode` ManyArray syncing via
    // `getRemoteRelationship`) would otherwise leave the snapshot permanently
    // stale after the first remote change, making a later genuine membership
    // change diff as "unchanged" and never notify.
    const localState = computeLocalState(source);
    payload.data = getRemoteState ? source.remoteState.slice() : localState;
  }

  if (source.links) {
    payload.links = cp(source.links);
  }

  if (source.meta) {
    payload.meta = cp(source.meta);
  }

  return payload;
}
