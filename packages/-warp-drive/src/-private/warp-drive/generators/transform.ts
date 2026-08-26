import { classify } from './strings.ts';

/**
 * Generates the source for an `@ember-data/serializer` Transform class.
 */
export function generateTransformSource(name: string): string {
  return `export default class ${classify(name)}Transform {
  deserialize(serialized) {
    return serialized;
  }

  serialize(deserialized) {
    return deserialized;
  }

  static create() {
    return new this();
  }
}
`;
}
