import { extendFromApplicationEntity } from './shared.ts';
import { classify } from './strings.ts';

export interface AdapterOptions {
  cwd: string;
  isAddon: boolean;
  baseClass?: string;
  /** The package to import the default base class from. Defaults to `@ember-data/adapter`. */
  packageName?: string;
  /** Whether the package exports the default base class as a named or default export. Defaults to `default`. */
  importStyle?: 'default' | 'named';
}

/**
 * Generates the source for an `@ember-data/adapter` Adapter class.
 */
export function generateAdapterSource(name: string, options: AdapterOptions): string {
  const { importStatement, baseClass } = extendFromApplicationEntity('adapter', 'JSONAPIAdapter', {
    cwd: options.cwd,
    entityName: name,
    isAddon: options.isAddon,
    baseClass: options.baseClass,
    packageName: options.packageName,
    importStyle: options.importStyle,
  });

  return `${importStatement}

export default class ${classify(name)}Adapter extends ${baseClass} {
}
`;
}
