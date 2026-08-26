import { dasherize } from './strings.ts';

/**
 * Destination paths (relative to a project's root) for each generator type,
 * matching the paths ember-cli's blueprints have historically generated into.
 */
export const DESTINATIONS = {
  model: (name: string): string => `app/models/${dasherize(name)}.js`,
  'model-test': (name: string): string => `tests/unit/models/${dasherize(name)}-test.js`,
  adapter: (name: string): string => `app/adapters/${dasherize(name)}.js`,
  'adapter-test': (name: string): string => `tests/unit/adapters/${dasherize(name)}-test.js`,
  serializer: (name: string): string => `app/serializers/${dasherize(name)}.js`,
  'serializer-test': (name: string): string => `tests/unit/serializers/${dasherize(name)}-test.js`,
  transform: (name: string): string => `app/transforms/${dasherize(name)}.js`,
  'transform-test': (name: string): string => `tests/unit/transforms/${dasherize(name)}-test.js`,
} as const;

export type GeneratorType = keyof typeof DESTINATIONS;

export const GENERATOR_TYPES = Object.keys(DESTINATIONS) as GeneratorType[];
