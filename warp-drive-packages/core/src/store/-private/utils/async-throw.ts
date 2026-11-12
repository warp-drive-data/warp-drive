/**
 * Throws `error` from a microtask so that it surfaces as an uncaught error
 * (reaching `window.onerror` / error reporters and failing tests) without
 * interrupting the synchronous work that detected the problem.
 *
 * Used for "you should not be doing this" conditions where aborting the
 * operation would leave state half-applied, e.g. a relationship payload
 * exceeding {@link Store.maxCollectionRelationshipSize}.
 *
 * @private
 */
export function asyncThrow(error: Error): void {
  queueMicrotask(() => {
    throw error;
  });
}
