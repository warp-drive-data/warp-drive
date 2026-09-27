#!/usr/bin/env node
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { styleText } from 'node:util';

function write($text: string) {
  console.log(styleText('gray', $text));
}

const Scaffolds = ['resource', 'trait', 'field', 'derivation', 'transform'];

function fileExists($path: string): Promise<boolean> {
  return fs.access($path).then(
    () => true,
    () => false
  );
}

function getRelativePathToRoot($path: string) {
  return `~/${path.relative(os.homedir(), $path)}`;
}

async function loadOrCreateConfig(): Promise<Record<string, unknown> & { DID_GENERATE: boolean }> {
  const configPath = path.join(process.cwd(), './schema.json');

  if (await fileExists(configPath)) {
    const config = JSON.parse(await fs.readFile(configPath, 'utf8'));
    config.DID_GENERATE = false;
    return config;
  }

  const config: Record<string, unknown> = {
    schemas: './schemas',
    dest: './dist',
  };

  write(
    `\n\t🔨 Generating new ${styleText('yellow', 'schema.json')} configuration file in ${styleText('cyan', getRelativePathToRoot(process.cwd()))}`
  );

  await fs.writeFile(configPath, JSON.stringify(config, null, 2));
  config.DID_GENERATE = true;
  return config as Record<string, unknown> & { DID_GENERATE: true };
}

function classify($name: string) {
  let str = $name
    .split('-')
    .map((word) => {
      return word[0].toUpperCase() + word.slice(1);
    })
    .join('');
  str = str
    .split('_')
    .map((word) => {
      return word[0].toUpperCase() + word.slice(1);
    })
    .join('');
  str = str[0].toUpperCase() + str.slice(1);
  return str;
}

function singularize($name: string) {
  if ($name.endsWith('ies')) {
    return $name.slice(0, -3) + 'y';
  } else if ($name.endsWith('es')) {
    return $name.slice(0, -2);
  } else if ($name.endsWith('s')) {
    return $name.slice(0, -1);
  } else {
    return $name;
  }
}

function generateFirstResource($type: string) {
  const className = classify(singularize($type));

  return `import { collection, createonly, derived, field, optional, readonly, resource, Resource } from '@warp-drive/schema-decorators';

@Resource // Resource is a default "Trait" that provides the "id" and "$type" fields used by @warp-drive/schema-record
class ${className} {
  // @optional - An optional field is one that may be omitted during create.
  // @readonly - A readonly field is one that may never be created or edited.
  // @createonly - A createonly field is one that may only be set during create.

  // We use declare to tell TypeScript that this field exists
  // We use the declared type to set the "cache" type for the field (what the API returns)
  // declare myField: string;

  // We use the field decorator to provide a "Transform" function for the field.
  // The transform's return type will be used as the "UI" type for the field.
  // e.g. "Date" instead of "string"
  // @field('luxon') declare someDateField: string;

  // We use the collection decorator to create a linkage to a collection of other resources
  // @collection('comment', { inverse: 'post' }) declare comments: Comment[];

  // We use the resource decorator to create a linkage to another resource
  // if the related resource will not always be present use \`| null\` with the type
  // @resource('user', { inverse: 'posts' }) declare author: User;

  // We use the derived decorator to create a field that is derived from other fields
  // Note your project can provide its own decorators that can simplify this.
  // @derived('concat', { fields: ['firstName', 'lastName'], separator: ' ' }) declare fullName: string;
}

export { ${className} };
`;
}

function generateResource($type: string) {
  const className = classify(singularize($type));

  return `import { Resource } from '@warp-drive/schema-decorators';

@Resource
class ${className} {
  // ...
}

export { ${className} };
`;
}

export async function main(args: string[]) {
  const [resource, name] = args;

  write(
    `\n\t $ ${styleText('bold', styleText('greenBright', '@warp-drive/') + styleText('magentaBright', 'schema'))} ${styleText('bold', 'scaffold')} ${resource ?? styleText('red', '<mising type>')} ${name ?? styleText('red', '<missing name>')}`
  );

  if (!resource || !Scaffolds.includes(resource)) {
    write(
      `\n\t${styleText('bold', '💥 Error')} ${styleText('white', resource ?? '<missing type>')} is not a valid scaffold.`
    );
    write(`\n\t${styleText('bold', 'Available Scaffolds')}\n\t\t◆ ${Scaffolds.join(',\n\t\t◆ ')}\n`);
    process.exitCode = 1;
    return;
  }

  if (!name) {
    write(
      `\n\t${styleText('bold', '💥 Error')} Please supply a name for the ${styleText('white', resource)} to scaffold!\n`
    );
    process.exitCode = 1;
    return;
  }

  if (resource !== 'resource') {
    write(
      `\n\t${styleText('bold', '💥 Error')} The ${styleText('white', resource)} scaffold is not implemented yet. Only ${styleText('white', 'resource')} is available.\n`
    );
    process.exitCode = 1;
    return;
  }

  const config = await loadOrCreateConfig();
  const relativeWritePath = `${config.schemas}/${name}.ts`;
  const filePath = path.join(process.cwd(), relativeWritePath);

  if (await fileExists(filePath)) {
    write(
      `\n\t${styleText('bold', '💥 Error')} ${styleText('white', relativeWritePath)} already exists! Skipping Scaffold.\n`
    );
    process.exitCode = 1;
    return;
  }

  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, config.DID_GENERATE ? generateFirstResource(name) : generateResource(name));

  write(
    `\n\t🔨 Scaffolding new ${styleText('bold', styleText('cyan', name))} ${styleText('bold', styleText('white', resource))} in ${relativeWritePath}...`
  );
  console.log(args);
}

if (import.meta.main) {
  await main(process.argv.slice(2));
}
