import { extendFromApplicationEntity } from './shared.ts';
import { classify } from './strings.ts';

export interface AdapterOptions {
  cwd: string;
  isAddon: boolean;
  baseClass?: string;
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
  });

  return `${importStatement}

export default class ${classify(name)}Adapter extends ${baseClass} {
}
`;
}
