import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'path';

import type { TransformOptions } from '../../../../packages/codemods/src/schema-migration/utils/ast-utils.js';

export function prepareFiles(baseDir: string, files: Record<string, string>) {
  for (const [key, content] of Object.entries(files)) {
    const withoutFile = key.split('/');
    withoutFile.pop();
    const path = join(...withoutFile);
    const fullPath = join(baseDir, path);

    if (!existsSync(fullPath)) {
      mkdirSync(fullPath, { recursive: true });
    }

    writeFileSync(join(baseDir, key), content);
  }
}

export function collectFilesSnapshot(baseDir: string, dir: string = baseDir): Record<string, string | null> {
  const result: Record<string, string | null> = {};

  try {
    const entries = readdirSync(dir);
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const relativePath = relative(baseDir, fullPath);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        result[relativePath + '/'] = '__dir__';
        Object.assign(result, collectFilesSnapshot(baseDir, fullPath));
      } else {
        result[relativePath] = '\n' + readFileSync(fullPath, 'utf-8');
      }
    }
  } catch {
    // Directory doesn't exist
  }

  return result;
}

export function collectFileStructure(baseDir: string, dir: string = baseDir): string[] {
  const result: string[] = [];

  try {
    const entries = readdirSync(dir).sort();
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const relativePath = relative(baseDir, fullPath);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        result.push(relativePath + '/');
        result.push(...collectFileStructure(baseDir, fullPath));
      } else {
        result.push(relativePath);
      }
    }
  } catch {
    // Directory doesn't exist
  }

  return result;
}

/**
 * Default test options that provide all required configuration
 * for testing transforms without hardcoded project-specific paths
 */
export const DEFAULT_TEST_OPTIONS: TransformOptions = {
  modelImportSource: 'test-app/models',
  resourcesImport: 'test-app/data/resources',
  verbose: false,
  debug: false,
  // For tests, assume all mixins are connected to models so they generate artifacts
  testMode: true,
  // Configure mixin sources for test patterns
  additionalMixinSources: [
    { pattern: 'app/mixins/', name: 'app mixins' },
    { pattern: '../mixins/', name: 'relative mixins' },
  ],
};

/**
 * Create test options with overrides for specific test cases
 */
export function createTestOptions(overrides: Partial<TransformOptions> = {}): TransformOptions {
  return {
    ...DEFAULT_TEST_OPTIONS,
    ...overrides,
  };
}
