import { deprecate } from '@ember/debug';

import { DEPRECATE_RELATIONSHIP_REMOTE_UPDATE_CLEARING_LOCAL_STATE } from '@warp-drive/core/build-config/deprecations';
import { DEBUG } from '@warp-drive/core/build-config/env';
import { assert } from '@warp-drive/core/build-config/macros';

import { checkIfNew, isBelongsTo, notifyChange } from '../-utils.ts';
import type { ResourceKey } from '../../../types.ts';
import type { ReplaceRelatedRecordOperation } from '../../../types/graph.ts';
import { assertPolymorphicType } from '../debug/assert-polymorphic-type.ts';
import type { Graph } from '../graph.ts';
import { addToInverse, notifyInverseOfPotentialMaterialization, removeFromInverse } from './replace-related-records.ts';

export default function replaceRelatedRecord(graph: Graph, op: ReplaceRelatedRecordOperation, isRemote = false): void {
  const relationship = graph.get(op.record, op.field);
  assert(
    `You can only '${op.op}' on a belongsTo relationship. ${op.record.type}.${op.field} is a ${relationship.definition.kind}`,
    isBelongsTo(relationship)
  );
  if (isRemote) {
    graph._addToTransaction(relationship);
  }
  const { definition, state } = relationship;
  const prop = isRemote ? 'remoteState' : 'localState';
  const existingState: ResourceKey | null = relationship[prop];

  /*
    case 1:1
    ========
    In a bi-directional graph with 1:1 edges, replacing a value
    results in up-to 4 discrete value transitions.

    If: A <-> B, C <-> D is the initial state,
    and: A <-> C, B, D is the final state

    then we would undergo the following 4 transitions.

    remove A from B
    add C to A
    remove C from D
    add A to C

    case 1:many
    ===========
    In a bi-directional graph with 1:Many edges, replacing a value
    results in up-to 3 discrete value transitions.

    If: A<->>B<<->D, C<<->D is the initial state (double arrows representing the many side)
    And: A<->>C<<->D, B<<->D is the final state

    Then we would undergo three transitions.

    remove A from B
    add C to A.
    add A to C

    case 1:?
    ========
    In a uni-directional graph with 1:? edges (modeled in WarpDrive with `inverse:null`) with
    artificial (implicit) inverses, replacing a value results in up-to 3 discrete value transitions.
    This is because a 1:? relationship is effectively 1:many.

    If: A->B, C->B is the initial state
    And: A->C, C->B is the final state

    Then we would undergo three transitions.

    Remove A from B
    Add C to A
    Add A to C
  */

  // nothing for us to do
  if (op.value === existingState) {
    // if we were empty before but now know we are empty this needs to be true
    state.hasReceivedData = true;

    // if this is a remote update we still sync
    if (isRemote) {
      state.hasReceivedRemoteData = true;

      const { localState } = relationship;
      // don't sync if localState is a new record and our remoteState is null
      if (localState && checkIfNew(graph._realStore, localState) && !existingState) {
        return;
      }
      if (existingState && localState === existingState) {
        notifyInverseOfPotentialMaterialization(graph, existingState, definition.inverseKey, op.record, isRemote);
      } else if (DEPRECATE_RELATIONSHIP_REMOTE_UPDATE_CLEARING_LOCAL_STATE) {
        // if localState does not match existingState then we know
        // we have a local mutation that has not been persisted yet
        if (localState !== op.value && relationship.definition.resetOnRemoteUpdate !== false) {
          relationship.localState = existingState;

          deprecate(
            `WarpDrive is changing the default semantics of updates to the remote state of relationships.\n\nThe following local state was cleared from the <${
              relationship.identifier.type
            }>.${
              relationship.definition.key
            } belongsTo relationship but will not be once this deprecation is resolved:\n\n\t${
              localState ? 'Added: ' + localState.lid + '\n\t' : ''
            }${existingState ? 'Removed: ' + existingState.lid : ''}`,
            false,
            {
              id: 'ember-data:deprecate-relationship-remote-update-clearing-local-state',
              for: 'ember-data',
              since: { enabled: '5.3', available: '4.13' },
              until: '6.0',
              url: 'https://deprecations.emberjs.com/v5.x#ember-data-deprecate-relationship-remote-update-clearing-local-state',
            }
          );

          // remote didn't change here (op.value === existingState); this is purely
          // clearing a stale local override, so remote-only readers don't need it.
          notifyChange(graph, relationship, 'local');
        }
      }
    }
    return;
  }

  // remove this value from the inverse if required
  if (existingState) {
    removeFromInverse(graph, existingState, definition.inverseKey, op.record, isRemote);
  }

  // update value to the new value
  relationship[prop] = op.value;

  state.hasReceivedData = true;
  /**
   * Local mutations never give us additional information about
   * whether the relationship has received *remote* data. This is
   * what `getRemoteRelationship` relies on to avoid reflecting
   * local-only edits.
   */
  if (isRemote) {
    state.hasReceivedRemoteData = true;
  }
  state.isEmpty = op.value === null;
  state.isStale = false;
  state.hasFailedLoadAttempt = false;

  if (op.value) {
    if (definition.type !== op.value.type) {
      // assert(
      //   `The '<${definition.inverseType}>.${op.field}' relationship expects only '${definition.type}' records since it is not polymorphic. Received a Record of type '${op.value.type}'`,
      //   definition.isPolymorphic
      // );

      // TODO this should now handle the deprecation warning if isPolymorphic is not set
      // but the record does turn out to be polymorphic
      // this should still assert if the user is relying on legacy inheritance/mixins to
      // provide polymorphic behavior and has not yet added the polymorphic flags
      if (DEBUG) {
        assertPolymorphicType(relationship.identifier, definition, op.value, graph.store);
      }

      graph.registerPolymorphicType(definition.type, op.value.type);
    }
    addToInverse(graph, op.value, definition.inverseKey, op.record, isRemote);
  }

  if (isRemote) {
    // Reaching here means `op.value !== existingState` (the prior remoteState),
    // so the remote value has definitely changed -- notify unconditionally,
    // regardless of how (or whether) local state below ends up reconciling.
    notifyChange(graph, relationship);

    const { localState, remoteState } = relationship;
    if (localState && checkIfNew(graph._realStore, localState) && !remoteState) {
      return;
    }
    // when localState does not match the new remoteState and
    // localState === existingState then we had no local mutation
    // and we can safely sync the new remoteState to local
    if (localState !== remoteState && localState === existingState) {
      relationship.localState = remoteState;
      // But when localState does not match the new remoteState and
      // and localState !== existingState then we know we have a local mutation
      // that has not been persisted yet.
    } else if (DEPRECATE_RELATIONSHIP_REMOTE_UPDATE_CLEARING_LOCAL_STATE) {
      if (
        localState !== remoteState &&
        localState !== existingState &&
        relationship.definition.resetOnRemoteUpdate !== false
      ) {
        relationship.localState = remoteState;

        deprecate(
          `WarpDrive is changing the default semantics of updates to the remote state of relationships.\n\nThe following local state was cleared from the <${
            relationship.identifier.type
          }>.${
            relationship.definition.key
          } belongsTo relationship but will not be once this deprecation is resolved:\n\n\t${
            localState ? 'Added: ' + localState.lid + '\n\t' : ''
          }${existingState ? 'Removed: ' + existingState.lid : ''}`,
          false,
          {
            id: 'ember-data:deprecate-relationship-remote-update-clearing-local-state',
            for: 'ember-data',
            since: { enabled: '5.3', available: '4.13' },
            until: '6.0',
            url: 'https://deprecations.emberjs.com/v5.x#ember-data-deprecate-relationship-remote-update-clearing-local-state',
          }
        );
      }
    }
  } else {
    // purely local mutation; remote-only readers have nothing to see here.
    notifyChange(graph, relationship, 'local');
  }
}
