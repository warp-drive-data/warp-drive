import fs from 'node:fs';
import path from 'node:path';
import { styleText } from 'node:util';

import { generateAdapterSource } from '../generators/adapter.ts';
import { generateModelSource } from '../generators/model.ts';
import { DESTINATIONS, GENERATOR_TYPES } from '../generators/paths.ts';
import { generateSerializerSource } from '../generators/serializer.ts';
import { isAddonProject } from '../generators/shared.ts';
import { generateUnitTestSource } from '../generators/tests.ts';
import { generateTransformSource } from '../generators/transform.ts';
import type { GeneratorType } from '../generators/paths.ts';

const TEST_KIND_FOR_TYPE = {
  'model-test': 'Model',
  'adapter-test': 'Adapter',
  'serializer-test': 'Serializer',
  'transform-test': 'Transform',
} as const;

function readModulePrefix(cwd: string): string {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(cwd, 'package.json'), 'utf-8')) as { name?: string };
    return pkg.name ?? 'app';
  } catch {
    return 'app';
  }
}

function generateContent(type: GeneratorType, name: string, rest: string[], cwd: string): string {
  const baseClassArg = rest.find((arg) => arg.startsWith('--base-class='));
  const baseClass = baseClassArg?.slice('--base-class='.length);
  const isAddon = isAddonProject(cwd);

  switch (type) {
    case 'model':
      return generateModelSource(
        name,
        rest.filter((arg) => !arg.startsWith('--'))
      );
    case 'adapter':
      return generateAdapterSource(name, { cwd, isAddon, baseClass });
    case 'serializer':
      return generateSerializerSource(name, { cwd, isAddon, baseClass });
    case 'transform':
      return generateTransformSource(name);
    default:
      return generateUnitTestSource(TEST_KIND_FOR_TYPE[type], name, readModulePrefix(cwd));
  }
}

/**
 * Implements `warp-drive generate <type> <name> [...args]`, the in-process
 * replacement for what used to require `ember generate` + this repo's
 * ember-cli blueprints. Supports the same generator types the blueprints did:
 * model, model-test, adapter, adapter-test, serializer, serializer-test,
 * transform, transform-test.
 *
 * Does not support ember-cli's classic (`Model.extend(...)`) output or pods
 * -- both are legacy Ember conventions with no real usage left in modern
 * (octane-and-later) apps.
 */
export async function generate(): Promise<void> {
  const argv = process.argv.slice(3); // strip `node warp-drive generate`
  const [type, name, ...rest] = argv;

  if (!type || !GENERATOR_TYPES.includes(type as GeneratorType)) {
    console.error(
      `Usage: warp-drive generate <type> <name> [...args]\n\nAvailable types: ${GENERATOR_TYPES.join(', ')}`
    );
    throw new Error(`Unknown generator type: ${type ?? '<none>'}`);
  }

  if (!name) {
    throw new Error(`Usage: warp-drive generate ${type} <name> [...args]`);
  }

  const cwd = process.cwd();
  const generatorType = type as GeneratorType;
  const content = generateContent(generatorType, name, rest, cwd);
  const relativePath = DESTINATIONS[generatorType](name);
  const destPath = path.join(cwd, relativePath);
  const force = rest.includes('--force');

  if (fs.existsSync(destPath) && !force) {
    throw new Error(`${relativePath} already exists. Pass --force to overwrite it.`);
  }

  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.writeFileSync(destPath, content);

  console.log(`${styleText('green', '✓')} ${styleText('bold', relativePath)}`);
}
