import { describe, expect, it } from 'vitest';

import type { TransformOptions } from '@ember-data/codemods/schema-migration/config.js';
import { toArtifacts as toTraitArtifacts } from '@ember-data/codemods/schema-migration/processors/mixin.js';
import { toArtifacts as toResourceArtifacts } from '@ember-data/codemods/schema-migration/processors/model.js';
import type { SchemaArtifact, SchemaArtifactRegistry } from '@ember-data/codemods/schema-migration/utils/artifact.js';
import { buildEntityRegistry, linkEntities } from '@ember-data/codemods/schema-migration/utils/artifact.js';
import type { ParsedFile } from '@ember-data/codemods/schema-migration/utils/file-parser.js';
import { parseFile } from '@ember-data/codemods/schema-migration/utils/file-parser.js';

import { createTestOptions } from '../test-helpers.ts';

function buildRegistry(parsedFiles: Map<string, ParsedFile>) {
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

  return registry;
}

describe('mixin baseName collision with model baseName', () => {
  it('model is NOT marked isUsedAsTrait when a mixin shares the same baseName', () => {
    const options = createTestOptions();

    const input: Record<string, string> = {
      'app/models/file.js': `
import Model, { attr } from '@ember-data/model';
import FileMixin from '../mixins/nested/file';

export default class FileModel extends Model.extend(FileMixin) {
  @attr('string') name;
}`,
      'app/models/document.js': `
import Model, { attr } from '@ember-data/model';
import FileMixin from '../mixins/nested/file';

export default class DocumentModel extends Model.extend(FileMixin) {
  @attr('string') title;
}`,
      'app/mixins/nested/file.js': `
import Mixin from '@ember/object/mixin';
import { attr } from '@ember-data/model';

export default Mixin.create({
  fileType: attr('string'),
});`,
    };

    const parsedFiles = new Map<string, ParsedFile>();
    for (const [fileName, content] of Object.entries(input)) {
      parsedFiles.set(fileName, parseFile(fileName, content, options));
    }

    const registry = buildRegistry(parsedFiles);

    const fileEntity = registry.get('app/models/file.js')!;
    expect(fileEntity).toBeDefined();
    expect(fileEntity.baseName).toBe('file');
    expect(fileEntity.kind).toBe('model');

    // The bug: FileModel gets incorrectly marked as isUsedAsTrait
    // because the mixin at mixins/nested/file.js has baseName "file"
    // which collides with the model's baseName.
    expect(fileEntity.isUsedAsTrait).toBe(false);

    // FileModel should produce resource artifacts (schema + type), not trait artifacts
    const result = toResourceArtifacts(fileEntity, options, registry);
    const artifactTypes = result.artifacts.map((a) => a.type).sort();
    expect(artifactTypes).toContain('schema');
    expect(artifactTypes).not.toContain('trait');
  });
});
