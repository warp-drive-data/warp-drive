import { macroCondition } from '@embroider/macros';

import D from './d';
// oxlint-disable-next-line typescript/consistent-type-imports -- a value import re-exported by `export type` is the case under test
import { G } from './g';

export type { G };
export { D, macroCondition };
export { field, legacyField } from '@fx/core-types/schema/fields';
export { default as Thing } from './thing';
export * from './star-a';
export type * from './star-b';
