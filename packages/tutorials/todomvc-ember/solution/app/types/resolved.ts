/**
 * Get the resolved type of an item.
 *
 * - If the item is a promise, the result will be the resolved value type
 * - If the item is not a promise, the result will just be the type of the item
 */
export type Resolved<P> = P extends Promise<infer T> ? T : P;
