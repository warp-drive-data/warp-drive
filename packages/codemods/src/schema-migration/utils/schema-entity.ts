import type { Filename } from '../codemod.js';
import type { ParsedFile } from './file-parser.js';
import { toPascalCase } from './path-utils.js';

export type EntityKind = 'model' | 'mixin' | 'intermediate-model';

export class SchemaEntity {
  readonly parsedFile: ParsedFile;
  readonly kind: EntityKind;
  private _traits: SchemaEntity[] = [];

  constructor(parsedFile: ParsedFile, kind: EntityKind) {
    this.parsedFile = parsedFile;
    this.kind = kind;
  }

  // Delegate base names from ParsedFile
  get pascalName(): string {
    return this.parsedFile.pascalName;
  }

  get baseName(): string {
    return this.parsedFile.baseName;
  }

  get camelName(): string {
    return this.parsedFile.camelName;
  }

  get path(): string {
    return this.parsedFile.path;
  }

  // Centralized derived names
  get schemaName(): string {
    return `${this.pascalName}Schema`;
  }

  get extensionName(): string {
    return `${this.pascalName}Extension`;
  }

  get interfaceName(): string {
    return this.pascalName;
  }

  get traitInterfaceName(): string {
    return `${this.pascalName}Trait`;
  }

  get hasExtension(): boolean {
    return this.parsedFile.hasExtension;
  }

  get extensionNameIfNeeded(): string | undefined {
    return this.hasExtension ? this.extensionName : undefined;
  }

  // Linking
  get traits(): readonly SchemaEntity[] {
    return this._traits;
  }

  addTrait(entity: SchemaEntity): void {
    this._traits.push(entity);
  }

  // Computed from linked traits
  get traitBaseNames(): string[] {
    return this._traits.map((t) => t.baseName);
  }

  get traitExtensionNames(): string[] {
    return this._traits.filter((t) => t.hasExtension).map((t) => t.extensionName);
  }

  static fromParsedFile(parsed: ParsedFile, kind?: EntityKind): SchemaEntity {
    const resolvedKind = kind ?? (parsed.fileType === 'mixin' ? 'mixin' : 'model');
    return new SchemaEntity(parsed, resolvedKind);
  }
}

export function deriveTraitInterfaceName(name: string): string {
  return `${toPascalCase(name)}Trait`;
}

export function deriveExtensionName(name: string): string {
  return `${toPascalCase(name)}Extension`;
}

export function deriveSchemaName(name: string): string {
  return `${toPascalCase(name)}Schema`;
}

// Registry: file path -> SchemaEntity
export type SchemaEntityRegistry = Map<string, SchemaEntity>;

export function buildEntityRegistry(
  parsedModels: Map<Filename, ParsedFile>,
  parsedMixins: Map<Filename, ParsedFile>
): SchemaEntityRegistry {
  const registry: SchemaEntityRegistry = new Map();

  for (const [filePath, parsed] of parsedModels) {
    registry.set(filePath, SchemaEntity.fromParsedFile(parsed, 'model'));
  }

  for (const [filePath, parsed] of parsedMixins) {
    registry.set(filePath, SchemaEntity.fromParsedFile(parsed, 'mixin'));
  }

  return registry;
}

export function isConnectedToModel(registry: SchemaEntityRegistry, mixinPath: string): boolean {
  for (const entity of registry.values()) {
    if (entity.kind === 'model' && entity.traits.some((t) => t.path === mixinPath)) return true;
  }
  return false;
}

export function findEntityByBaseName(
  registry: SchemaEntityRegistry,
  baseName: string,
  kind?: EntityKind
): SchemaEntity | undefined {
  for (const entity of registry.values()) {
    if (entity.baseName === baseName && (!kind || entity.kind === kind)) return entity;
  }
  return undefined;
}

export function linkEntities(registry: SchemaEntityRegistry, modelToMixinsMap: Map<string, Set<string>>): void {
  for (const [modelPath, mixinPaths] of modelToMixinsMap) {
    const modelEntity = registry.get(modelPath);
    if (!modelEntity) continue;

    for (const mixinPath of mixinPaths) {
      const mixinEntity = registry.get(mixinPath);
      if (mixinEntity) {
        modelEntity.addTrait(mixinEntity);
      }
    }
  }
}
