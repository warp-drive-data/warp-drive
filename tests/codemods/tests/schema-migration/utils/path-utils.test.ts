import { describe, expect, it } from 'vitest';

import {
  mixinNameToTraitName,
  replaceWildcardPattern,
  wildcardPatternToRegex,
} from '../../../../../packages/codemods/src/schema-migration/utils/path-utils.js';

describe('wildcardPatternToRegex', () => {
  it('escapes regex special characters in patterns', () => {
    const regex = wildcardPatternToRegex('my-app/models/*.ts');
    expect(regex.test('my-app/models/user.ts')).toBe(true);
    expect(regex.test('my-appXmodelsXuserXts')).toBe(false);
  });

  it('matches wildcard correctly', () => {
    const regex = wildcardPatternToRegex('app/models/*');
    expect(regex.test('app/models/user')).toBe(true);
    expect(regex.test('app/models/')).toBe(true);
    expect(regex.test('app/controllers/user')).toBe(false);
  });
});

describe('mixinNameToTraitName', () => {
  it('strips PascalCase Mixin suffix', () => {
    expect(mixinNameToTraitName('FileableMixin')).toBe('fileable');
  });

  it('strips lowercase mixin suffix from path-derived names', () => {
    expect(mixinNameToTraitName('app/mixins/testmixin.js')).toBe('test');
  });

  it('preserves names without mixin suffix', () => {
    expect(mixinNameToTraitName('Fileable')).toBe('fileable');
  });
});

describe('replaceWildcardPattern', () => {
  it('replaces wildcards with matched values', () => {
    const result = replaceWildcardPattern('my-app/models/*', 'my-app/models/user', './app/models/*');
    expect(result).toBe('./app/models/user');
  });

  it('handles multiple wildcards', () => {
    const result = replaceWildcardPattern('a/*/b/*', 'a/x/b/y', 'c/*/d/*');
    expect(result).toBe('c/x/d/y');
  });
});
