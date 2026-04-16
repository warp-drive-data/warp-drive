import prettier from 'prettier';
import { expect, test as vitest } from 'vitest';

import type { TransformOptions } from '@ember-data/codemods/schema-migration/config.js';
import { toArtifacts as toTraitArtifacts } from '@ember-data/codemods/schema-migration/processors/mixin.js';
import { toArtifacts as toResourceArtifacts } from '@ember-data/codemods/schema-migration/processors/model.js';
import type { SchemaArtifact, SchemaArtifactRegistry } from '@ember-data/codemods/schema-migration/utils/artifact.js';
import { buildEntityRegistry, linkEntities } from '@ember-data/codemods/schema-migration/utils/artifact.js';
import type { ParsedFile } from '@ember-data/codemods/schema-migration/utils/file-parser.js';
import { parseFile } from '@ember-data/codemods/schema-migration/utils/file-parser.js';
import type { TransformArtifact } from '@ember-data/codemods/schema-migration/utils/schema-generation.js';

import { createTestOptions } from '../test-helpers.ts';

function transformEntity(entity: SchemaArtifact, options: TransformOptions, registry: SchemaArtifactRegistry) {
  switch (entity.parsedFile.fileType) {
    case 'mixin':
      return toTraitArtifacts(entity, options, registry);
    case 'model':
      return toResourceArtifacts(entity, options, registry);
    default:
      throw new Error(`Unknown file type for path: ${entity.path}`);
  }
}

function buildTestRegistry(parsedFiles: Map<string, ParsedFile>): {
  registry: SchemaArtifactRegistry;
  modelToMixinsMap: Map<string, Set<string>>;
} {
  const parsedModels = new Map<string, ParsedFile>();
  const parsedMixins = new Map<string, ParsedFile>();

  for (const [filePath, parsed] of parsedFiles) {
    if (parsed.fileType === 'mixin') {
      parsedMixins.set(filePath, parsed);
    } else {
      parsedModels.set(filePath, parsed);
    }
  }

  const registry = buildEntityRegistry(parsedModels, parsedMixins, undefined, new Map());

  const modelToMixinsMap = new Map<string, Set<string>>();
  for (const [modelPath, parsed] of parsedModels) {
    if (parsed.traits.length > 0) {
      const mixinPaths = new Set<string>();
      for (const traitBaseName of parsed.traits) {
        for (const [mixinPath, mixinParsed] of parsedMixins) {
          if (mixinParsed.baseName === traitBaseName) {
            mixinPaths.add(mixinPath);
          }
        }
      }
      if (mixinPaths.size > 0) {
        modelToMixinsMap.set(modelPath, mixinPaths);
      }
    }
  }

  linkEntities(registry, modelToMixinsMap);

  return { registry, modelToMixinsMap };
}

interface BaseTransformationTest {
  /**
   * A list of files to transform, where the key is the file path
   * and the value is the file content.
   */
  input: Record<string, string>;

  /**
   * Optional codemod config
   */
  config?: Partial<TransformOptions>;
}

interface SuccessfulTransformationTest extends BaseTransformationTest {
  /**
   * A list of expected transformed files, where the key is the
   * file path and the value is the expected file content after
   * transformation.
   */
  output: Record<string, string>;
}

interface ErrorTransformationTest extends BaseTransformationTest {
  error: string | RegExp;
}

function isErrorTransformationTest(
  t: SuccessfulTransformationTest | ErrorTransformationTest
): t is ErrorTransformationTest {
  return 'error' in t && t.error !== undefined;
}

export function trim(str: string) {
  const lines = str.split('\n');

  while (lines.length && lines[0].trim() === '') {
    lines.shift();
  }

  if (lines.length === 0) {
    throw new Error('String must contain at least one non-empty line');
  }

  const indentationMatch = lines[0].match(/^\s*/);

  // get the indentation of the first line
  const indent = indentationMatch ? indentationMatch[0].length : 0;

  // remove the indentation from the start of each line
  return lines.map((line) => line.slice(indent)).join('\n');
}

export function format(filePath: string, source: string) {
  const parser = filePath.endsWith('.ts') ? 'babel-ts' : 'babel';
  return prettier.format(source, { parser, singleQuote: true, printWidth: 120 });
}

async function applyTransform(
  input: Record<string, string>,
  config: TransformOptions
): Promise<{ files: Record<string, string> }> {
  const parsedFiles = new Map<string, ParsedFile>();
  for (const [fileName, content] of Object.entries(input)) {
    parsedFiles.set(fileName, parseFile(fileName, content, config));
  }

  const { registry } = buildTestRegistry(parsedFiles);

  const files = {} as Record<string, string>;
  for (const entity of registry.values()) {
    const output = transformEntity(entity, config, registry);
    for (const artifact of output.artifacts) {
      const prefixedFileName = prefixFile(artifact, config);
      if (files[prefixedFileName]) {
        throw new Error(`Multiple artifacts generated for the same path: ${prefixedFileName}`);
      }
      files[prefixedFileName] = await format(prefixedFileName, artifact.code);
    }
  }

  return {
    files,
  };
}

function prefixFile(artifact: TransformArtifact, config: TransformOptions): string {
  return `app/data/${artifact.suggestedFileName}`;
}

export function skip(_name: string, _options: SuccessfulTransformationTest | ErrorTransformationTest) {}

export function test(name: string, options: SuccessfulTransformationTest | ErrorTransformationTest) {
  vitest(name, async function () {
    const input = {} as Record<string, string>;
    for (const [fileName, content] of Object.entries(options.input)) {
      input[fileName] = trim(content);
    }
    const config = createTestOptions(options.config);
    const result = await applyTransform(input, config);

    if (isErrorTransformationTest(options)) {
      throw new Error('Error test checks not implemented yet');
      return;
    }

    const expected = {} as Record<string, string>;
    for (const [fileName, content] of Object.entries(options.output)) {
      expected[fileName] = trim(content);
    }

    // check files match
    const resultingFiles = Object.keys(result.files).sort();
    const expectedFiles = Object.keys(expected).sort();
    expect(resultingFiles, 'Transformed files do not match expected files').toEqual(expectedFiles);

    for (const fileName of expectedFiles) {
      const expectedContent = expected[fileName];
      const resultContent = result.files[fileName];
      const formattedExpectedContent = await format(fileName, expectedContent);
      expect(resultContent, `Transformed content of ${fileName} does not match expected content`).toEqual(
        formattedExpectedContent
      );
    }
  });
}

export const F = {
  jsmodel(name: string) {
    return `app/models/${name}.js`;
  },
  tsmodel(name: string) {
    return `app/models/${name}.ts`;
  },
  jsmixin(name: string) {
    return `app/mixins/${name}.js`;
  },
  tsmixin(name: string) {
    return `app/mixins/${name}.ts`;
  },
  resource(name: string, ext: 'ts' | 'js' = 'ts') {
    return `app/data/${name}.schema.${ext}`;
  },
  trait(name: string) {
    return `app/traits/${name}.ts`;
  },
  extension(name: string, ext: 'ts' | 'js' = 'ts') {
    return `app/data/${name}.ext.${ext}`;
  },
  traitExtension(name: string) {
    return `app/traits/${name}/index.ts`;
  },
  resourceType(name: string) {
    return `app/data/${name}.type.ts`;
  },
  extensionType(name: string) {
    return `app/data/${name}.ext.type.ts`;
  },
  traitType(name: string) {
    return `app/traits/${name}/index.ts`;
  },
  traitExtensionType(name: string) {
    return `app/traits/${name}/index.ts`;
  },
};

/**
 * A helper function that enables getting syntax highlighting for test input
 * and output strings in editors that support it. This function does not do
 * anything at runtime, but allows us to write test cases like this:
 *
 * test('example test', {
 *   input: {
 *     [F.jsmodel('user')]: js`
 *       // JavaScript code here will have syntax highlighting in supporting editors
 *     `,
 *   },
 *   output: {
 *     [F.resource('user')]: ts`
 *       // TypeScript code here will have syntax highlighting in supporting editors
 *     `,
 *   },
 * });
 */
export function js(strings: TemplateStringsArray, ...values: string[]): string {
  return strings.reduce((result, str, i) => result + str + (values[i] ?? ''), '');
}

/**
 * A helper function that enables getting syntax highlighting for test input
 * and output strings in editors that support it. This function does not do
 * anything at runtime, but allows us to write test cases like this:
 *
 * test('example test', {
 *   input: {
 *     [F.jsmodel('user')]: js`
 *       // JavaScript code here will have syntax highlighting in supporting editors
 *     `,
 *   },
 *   output: {
 *     [F.resource('user')]: ts`
 *       // TypeScript code here will have syntax highlighting in supporting editors
 *     `,
 *   },
 * });
 */
export const javascript = js;

/**
 * A helper function that enables getting syntax highlighting for test input
 * and output strings in editors that support it. This function does not do
 * anything at runtime, but allows us to write test cases like this:
 *
 * test('example test', {
 *   input: {
 *     [F.jsmodel('user')]: js`
 *       // JavaScript code here will have syntax highlighting in supporting editors
 *     `,
 *   },
 *   output: {
 *     [F.resource('user')]: ts`
 *       // TypeScript code here will have syntax highlighting in supporting editors
 *     `,
 *   },
 * });
 */
export const typescript = js;

/**
 * A helper function that enables getting syntax highlighting for test input
 * and output strings in editors that support it. This function does not do
 * anything at runtime, but allows us to write test cases like this:
 *
 * test('example test', {
 *   input: {
 *     [F.jsmodel('user')]: js`
 *       // JavaScript code here will have syntax highlighting in supporting editors
 *     `,
 *   },
 *   output: {
 *     [F.resource('user')]: ts`
 *       // TypeScript code here will have syntax highlighting in supporting editors
 *     `,
 *   },
 * });
 */
export const ts = js;
