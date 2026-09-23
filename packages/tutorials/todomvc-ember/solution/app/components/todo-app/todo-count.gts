import type { TOC } from '@ember/component/template-only';

import { Request } from '@warp-drive/ember';

import { HandleError } from '#app/components/design-system/error.gts';
// #remove-region-from-starter
// #region import-query
import { getActiveTodos } from '#app/data/builders/query.ts';
// #endregion import-query

/**
 * Displays the count of active (not completed) todos.
 * It fetches the active todos and displays the count.
 * If there are no active todos, it displays "0 items left".
 * If there is an error fetching the active todos,
 *   it displays a toast error message.
 * It automatically refreshes when the active todos change.
 */
export const TodoCount = <template>
  <span class="todo-count">
    {{! #replace-region-in-starter TODO (chapter 3): count the active todos }}
    <!-- #region active-count-request -->
    <Request @query={{(getActiveTodos)}} @autorefresh={{true}} @autorefreshBehavior="refresh">
      <:content as |content|>
        <Remaining @remaining={{content.data.length}} />
      </:content>
      <:error as |error|>
        <HandleError @error={{error}} @toast="Could not get active todos for Todo Remaining Count." />
      </:error>
    </Request>
    <!-- #endregion active-count-request -->
  </span>
</template>;

const Remaining = <template>
  <strong>{{@remaining}}</strong> {{itemLabel @remaining}} left
</template> satisfies TOC<{
  Args: { remaining: number };
}>;

function itemLabel(count: number) {
  if (count === 0 || count > 1) {
    return 'items';
  }

  return 'item';
}
