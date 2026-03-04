import type { Filename } from '../codemod.js';
import type { TransformOptions } from '../config';
import type { ModelAnalysisResult } from '../processors/model';
import type { ParsedFile } from './file-parser.js';
import { toPascalCase } from './path-utils';

interface ResourceArtifactIdentifiers {
  /**
   * The name of the generated schema, e.g. `UserSchema`
   */
  schema: `${string}Schema`;
  /**
   * The name of the primary interface containing
   * all "own" and trait-inherited schema fields.
   *
   * e.g. `UserResource`.
   *
   * `null` if no type should be generated
   */
  fieldsInterface: `${string}Resource` | null;
  /**
   * The name of the importable type representing
   * just the fields in `fieldsInterface` together
   * with the proper cabilities exposed by the mode.
   *
   * e.g `User` defined like `WithLegacy<UserResource>`
   * or `UserSetting` defined like `WithLegacy<UserSettingResource>`
   *
   * `null` if no type should be generated
   */
  type: string | null;
  /**
   * The name of the extracted extension, if one
   * is required. e.g. `UserExtension`.
   *
   * `null` if no extension is required and thus no extension artifact will be generated.
   */
  extension: `${string}Extension` | null;
  /**
   * A "nice name" alias for the full type with all traits,
   * extensions etc applied.
   *
   * `null` if no extensionAlias should be generated.
   */
  extensionAlias: `${string}WithExtensions` | null;
}

interface TraitArtifactIdentifiers {
  /**
   * The name of the generated schema, e.g. `TimestampedTraitSchema`
   */
  schema: `${string}TraitSchema`;
  /**
   * The name of the primary interface containing
   * all "own" and trait-inherited schema fields.
   *
   * e.g. `TimestampedTrait`.
   *
   * `null` if no type should be generated
   */
  fieldsInterface: `${string}Trait` | null;
  /**
   * The name of the importable type representing
   * just the fields in `fieldsInterface` together
   * with the proper cabilities exposed by the mode
   * acting as "if" the trait itself were a resource
   * - useful for typing polymorphics.
   *
   * e.g `Timestamped` defined like `WithLegacy<TimestampedTrait>`
   * or `SoftDeleteable` defined like `WithLegacy<SoftDeleteableTrait>`
   *
   * `null` if no type should be generated
   */
  type: string | null;
  /**
   * The name of the extracted extension, if one
   * is required. e.g. `TimestampedTraitExtension`.
   *
   * `null` if no extension is required and thus no extension artifact will be generated.
   */
  extension: `${string}TraitExtension` | null;
  /**
   * A "nice name" alias for the full type with all traits,
   * extensions etc applied.
   *
   * `null` if no extensionAlias should be generated.
   */
  extensionAlias: `${string}TraitWithExtensions` | null;
}

/**
 * A configuration object containing information about a
 * resource to be generated.
 */
interface BaseArtifactConfig {
  /**
   * The name of the resource or trait, typically derived from the model
   * or mixin name.
   *
   * AKA 'user' for `models/user.ts` or 'site-setting' for `models/site-setting.ts`
   * or 'timestamped' for `mixins/timestamped.js`
   */
  name: string;
  /**
   * Whether we should generate types for the artifact
   */
  hasTypes: boolean;
  /**
   * Whether the resource/trait schema should be typed
   */
  schemaIsTyped: boolean;
  /**
   * Whether the extension should be typed (if an extension is required)
   */
  extensionIsTyped: boolean;
  /**
   * Whether this artifact requires use of an extension
   */
  hasExtension: boolean;

  /**
   * If the Model or Mixin has mixins/base-class traits, this will be an
   * Ordered mapping of the traits to use.
   */
  traits: Array<{
    /**
     * The name of the trait, typically derived from the mixin name. e.g. `timestamped` for `mixins/timestamped.js`
     *
     * Used for the registered trait name.
     */
    name: string;
    /**
     * The names of the various interfaces and variables
     * that might be required when generating types for
     * the resource that use this trait.
     */
    identifiers: {
      /**
       * The name of the importable type representing
       * just the fields in trait / any sub-traits.
       *
       * e.g. `TimestampedTrait`.
       *
       * This will match the `fieldsInterface` of the trait artifact,
       * and should be composed with the fieldInterface of this
       * trait or resource.
       *
       * `null` if no type should be generated
       */
      fieldsInterface: `${string}Trait` | null;
      /**
       * The name of the extracted extension, if one
       * is required. e.g. `TimestampedTraitExtension`.
       *
       * `null` if no extension is required and thus no extension artifact will be generated.
       */
      extension: `${string}Extension` | null;
    };
  }>;
}

interface ResourceArtifactConfig extends BaseArtifactConfig {
  /**
   * The type of artifact being generated
   *
   * 'resource' for resource schemas, 'trait' for trait schemas
   */
  type: 'resource';

  /**
   * The names of the various interfaces and variables
   * that will be generated for this resource.
   */
  identifiers: ResourceArtifactIdentifiers;
}
interface TraitArtifactConfig extends BaseArtifactConfig {
  /**
   * The type of artifact being generated
   *
   * 'resource' for resource schemas, 'trait' for trait schemas
   */
  type: 'trait';

  /**
   * The names of the various interfaces and variables
   * that will be generated for this trait.
   */
  identifiers: TraitArtifactIdentifiers;
}
export type ArtifactConfig = ResourceArtifactConfig | TraitArtifactConfig;

export function createTraitArtifactConfig(
  options: TransformOptions,
  name: string,
  classified: string,
  traits: string[],
  hasExtensionProperties: boolean,
  isTypeScript: boolean
): ArtifactConfig {
  const hasTypes = isTypeScript || !options.disableMissingTypeAutoGen;
  const schemaIsTyped = (hasTypes && options.combineSchemasAndTypes) || !options.disableTypescriptSchemas;
  const extensionIsTyped = isTypeScript;
  const hasExtension = hasExtensionProperties;

  return {
    type: 'trait',
    name,
    hasTypes,
    schemaIsTyped,
    extensionIsTyped,
    hasExtension,
    identifiers: {
      schema: deriveTraitSchemaName(name),
      fieldsInterface: hasTypes ? deriveTraitInterfaceName(name) : null,
      type: hasTypes ? classified : null,
      extension: hasExtension ? deriveTraitExtensionName(name) : null,
      extensionAlias: hasTypes && hasExtension ? `${classified}TraitWithExtensions` : null,
    },
    traits: traits.map((trait) => ({
      name: trait,
      identifiers: {
        fieldsInterface: hasTypes ? deriveTraitInterfaceName(trait) : null,
        extension: hasTypes ? deriveTraitExtensionName(trait) : null,
      },
    })),
  };
}

/**
 * @param options the TransformOptions
 * @param resource the resource name (aka baseName, e.g. 'user' or 'site-setting')
 * @param classified the classified name (e.g. 'User' or 'SiteSetting')
 * @returns a ResourceArtifact configuration object
 */
export function createResourceArtifactConfig(
  options: TransformOptions,
  analysis: ModelAnalysisResult,
  modelWasTyped: boolean
): ArtifactConfig {
  const name = analysis.baseName;
  const classified = analysis.modelName;

  /**
   * types are required IF the model was typed OR
   * the options don't disable automatic type generation
   * for untyped models
   */
  const hasTypes = modelWasTyped || !options.disableMissingTypeAutoGen;
  const schemaIsTyped = (hasTypes && options.combineSchemasAndTypes) || !options.disableTypescriptSchemas;
  const extensionIsTyped = modelWasTyped;

  /**
   * an extension is required IF
   * we have a trait OR we have our own extension
   */
  const hasExtension =
    analysis.mixinTraits.length > 0 || analysis.mixinExtensions.length > 0 || analysis.extensionProperties.length > 0;

  return {
    type: 'resource',
    name,
    hasTypes,
    schemaIsTyped,
    extensionIsTyped,
    hasExtension,
    identifiers: {
      schema: deriveResourceSchemaName(name),
      fieldsInterface: hasTypes ? `${classified}Resource` : null,
      type: hasTypes ? classified : null,
      extension: hasExtension ? deriveResourceExtensionName(name) : null,
      extensionAlias: hasTypes && hasExtension ? `${classified}WithExtensions` : null,
    },
    traits: analysis.mixinTraits.map((trait) => ({
      name: trait,
      identifiers: {
        fieldsInterface: hasTypes ? deriveTraitInterfaceName(trait) : null,
        extension: hasTypes ? deriveTraitExtensionName(trait) : null,
      },
    })),
  };
}

export type ArtifactKind = 'model' | 'mixin' | 'intermediate-model';

export class SchemaArtifact {
  readonly parsedFile: ParsedFile;
  readonly kind: ArtifactKind;
  private _traits: SchemaArtifact[] = [];

  constructor(parsedFile: ParsedFile, kind: ArtifactKind) {
    this.parsedFile = parsedFile;
    this.kind = kind;
  }

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

  get isTrait(): boolean {
    return this.kind === 'mixin';
  }

  get schemaName(): string {
    return this.isTrait ? deriveTraitSchemaName(this.baseName) : deriveResourceSchemaName(this.baseName);
  }

  get extensionName(): string {
    return this.isTrait ? deriveTraitExtensionName(this.baseName) : deriveResourceExtensionName(this.baseName);
  }

  get interfaceName(): string {
    return this.pascalName;
  }

  get traitInterfaceName(): string {
    return deriveTraitInterfaceName(this.baseName);
  }

  get hasExtension(): boolean {
    return this.parsedFile.hasExtension;
  }

  get extensionNameIfNeeded(): string | undefined {
    return this.hasExtension ? this.extensionName : undefined;
  }

  get traits(): readonly SchemaArtifact[] {
    return this._traits;
  }

  addTrait(entity: SchemaArtifact): void {
    this._traits.push(entity);
  }

  get traitBaseNames(): string[] {
    return this._traits.map((t) => t.baseName);
  }

  get traitExtensionNames(): string[] {
    return this._traits.filter((t) => t.hasExtension).map((t) => t.extensionName);
  }

  static fromParsedFile(parsed: ParsedFile, kind?: ArtifactKind): SchemaArtifact {
    const resolvedKind = kind ?? (parsed.fileType === 'mixin' ? 'mixin' : 'model');
    return new SchemaArtifact(parsed, resolvedKind);
  }
}

export function deriveTraitInterfaceName(name: string): `${string}Trait` {
  return `${toPascalCase(name)}Trait`;
}

export function deriveTraitExtensionName(name: string): `${string}TraitExtension` {
  return `${toPascalCase(name)}TraitExtension`;
}

export function deriveResourceExtensionName(name: string): `${string}Extension` {
  return `${toPascalCase(name)}Extension`;
}

export function deriveTraitSchemaName(name: string): `${string}TraitSchema` {
  return `${toPascalCase(name)}TraitSchema`;
}

export function deriveResourceSchemaName(name: string): `${string}Schema` {
  return `${toPascalCase(name)}Schema`;
}

export type SchemaArtifactRegistry = Map<string, SchemaArtifact>;

export function buildEntityRegistry(
  parsedModels: Map<Filename, ParsedFile>,
  parsedMixins: Map<Filename, ParsedFile>
): SchemaArtifactRegistry {
  const registry: SchemaArtifactRegistry = new Map();

  for (const [filePath, parsed] of parsedModels) {
    registry.set(filePath, SchemaArtifact.fromParsedFile(parsed, 'model'));
  }

  for (const [filePath, parsed] of parsedMixins) {
    registry.set(filePath, SchemaArtifact.fromParsedFile(parsed, 'mixin'));
  }

  return registry;
}

export function isConnectedToModel(registry: SchemaArtifactRegistry, mixinPath: string): boolean {
  for (const entity of registry.values()) {
    if (entity.kind === 'model' && entity.traits.some((t) => t.path === mixinPath)) return true;
  }
  return false;
}

export function findEntityByBaseName(
  registry: SchemaArtifactRegistry,
  baseName: string,
  kind?: ArtifactKind
): SchemaArtifact | undefined {
  for (const entity of registry.values()) {
    if (entity.baseName === baseName && (!kind || entity.kind === kind)) return entity;
  }
  return undefined;
}

export function linkEntities(registry: SchemaArtifactRegistry, modelToMixinsMap: Map<string, Set<string>>): void {
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
