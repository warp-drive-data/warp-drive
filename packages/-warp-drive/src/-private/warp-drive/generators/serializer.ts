import { extendFromApplicationEntity } from './shared.ts';
import { classify } from './strings.ts';

export interface SerializerOptions {
  cwd: string;
  isAddon: boolean;
  baseClass?: string;
  /** The package to import the default base class from. Defaults to `@ember-data/serializer`. */
  packageName?: string;
  /** Whether the package exports the default base class as a named or default export. Defaults to `default`. */
  importStyle?: 'default' | 'named';
}

/**
 * Generates the source for an `@ember-data/serializer` Serializer class.
 */
export function generateSerializerSource(name: string, options: SerializerOptions): string {
  const { importStatement, baseClass } = extendFromApplicationEntity('serializer', 'JSONAPISerializer', {
    cwd: options.cwd,
    entityName: name,
    isAddon: options.isAddon,
    baseClass: options.baseClass,
    packageName: options.packageName,
    importStyle: options.importStyle,
  });

  return `${importStatement}

export default class ${classify(name)}Serializer extends ${baseClass} {
}
`;
}
