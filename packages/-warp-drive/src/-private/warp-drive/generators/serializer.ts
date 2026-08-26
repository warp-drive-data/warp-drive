import { extendFromApplicationEntity } from './shared.ts';
import { classify } from './strings.ts';

export interface SerializerOptions {
  cwd: string;
  isAddon: boolean;
  baseClass?: string;
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
  });

  return `${importStatement}

export default class ${classify(name)}Serializer extends ${baseClass} {
}
`;
}
