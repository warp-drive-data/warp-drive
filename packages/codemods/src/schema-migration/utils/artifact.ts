import type { TransformOptions } from '../config';
import type { ModelAnalysisResult } from '../processors/model';
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
interface BaseSchemaArtifact {
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

interface ResourceSchemaArtifact extends BaseSchemaArtifact {
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
interface TraitSchemaArtifact extends BaseSchemaArtifact {
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
export type SchemaArtifact = ResourceSchemaArtifact | TraitSchemaArtifact;

export function createTraitArtifactConfig(
  options: TransformOptions,
  name: string,
  classified: string,
  traits: string[],
  hasExtensionProperties: boolean,
  isTypeScript: boolean
): SchemaArtifact {
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
      schema: `${classified}TraitSchema`,
      fieldsInterface: hasTypes ? `${classified}Trait` : null,
      type: hasTypes ? classified : null,
      extension: hasExtension ? `${classified}TraitExtension` : null,
      extensionAlias: hasTypes && hasExtension ? `${classified}TraitWithExtensions` : null,
    },
    traits: traits.map((trait) => {
      const pascl = toPascalCase(trait);
      return {
        name: trait,
        identifiers: {
          fieldsInterface: hasTypes ? `${pascl}Trait` : null,
          extension: hasTypes ? `${pascl}Extension` : null,
        },
      };
    }),
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
): SchemaArtifact {
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
      schema: `${classified}Schema`,
      fieldsInterface: hasTypes ? `${classified}Resource` : null,
      type: hasTypes ? classified : null,
      extension: hasExtension ? `${classified}Extension` : null,
      extensionAlias: hasTypes && hasExtension ? `${classified}WithExtensions` : null,
    },
    traits: analysis.mixinTraits.map((trait) => {
      const pascl = toPascalCase(trait);
      return {
        name: trait,
        identifiers: {
          fieldsInterface: hasTypes ? `${pascl}Trait` : null,
          extension: hasTypes ? `${pascl}Extension` : null,
        },
      };
    }),
  };
}
