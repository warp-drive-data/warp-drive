import { describe, expect, it } from 'vitest';

import { isModelImportPath } from '../../../../../packages/codemods/src/schema-migration/utils/import-utils.js';
import { createTestOptions } from '../test-helpers.js';

describe('isModelImportPath', () => {
  it('does not false-positive on prefix matches', () => {
    const opts = createTestOptions({ modelImportSource: '@my-app/model' });
    expect(isModelImportPath('@my-app/model-utils', opts)).toBe(false);
    expect(isModelImportPath('@my-app/model', opts)).toBe(true);
    expect(isModelImportPath('@my-app/model/user', opts)).toBe(true);
  });

  it('does not false-positive on additional source prefix matches', () => {
    const opts = createTestOptions({
      modelImportSource: 'test-app/models',
      additionalModelSources: [{ pattern: '@custom/models', dir: 'external/models/' }],
    });
    expect(isModelImportPath('@custom/models-shared/user', opts)).toBe(false);
    expect(isModelImportPath('@custom/models', opts)).toBe(true);
    expect(isModelImportPath('@custom/models/user', opts)).toBe(true);
  });
});
