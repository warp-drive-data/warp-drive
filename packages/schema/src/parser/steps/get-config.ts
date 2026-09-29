import fs from 'node:fs/promises';
import path from 'node:path';
import { styleText } from 'node:util';

import { write } from '../utils/utils.ts';

export type SchemaConfig = Awaited<ReturnType<typeof getSchemaConfig>>;

export async function getSchemaConfig() {
  const args = process.argv.slice(2);
  const [schemaPath] = args;

  write(
    `\n\t ${styleText('yellow', '$')} ${styleText('bold', styleText('greenBright', '@warp-drive/') + styleText('magentaBright', 'schema'))} ${styleText('cyan', styleText('bold', 'parse'))} ${schemaPath ?? styleText('red', '<missing path>')}`
  );

  if (!schemaPath) {
    write(`\n\t${styleText('bold', '💥 Error')} Please supply a path to the schema file to parse!\n`);
    process.exit(1);
  }

  const schemaFileExists = await fs.access(schemaPath).then(
    () => true,
    () => false
  );

  if (!schemaFileExists) {
    write(`\n\t${styleText('bold', '💥 Error')} ${styleText('white', schemaPath)} does not exist!`);
    process.exit(1);
  }

  const config = JSON.parse(await fs.readFile(schemaPath, 'utf8')) as Record<string, unknown>;

  for (const key of ['schemas', 'dest'] as const) {
    if (typeof config[key] !== 'string') {
      write(
        `\n\t${styleText('bold', '💥 Error')} ${styleText('white', schemaPath)} must set ${styleText('white', `"${key}"`)} to a path string!\n`
      );
      process.exit(1);
    }
  }

  const schemaDirectory = path.resolve(path.dirname(schemaPath), config.schemas as string);
  const schemaDestination = path.resolve(path.dirname(schemaPath), config.dest as string);

  return {
    _config: config,
    schemaPath,
    relativeSchemaDirectory: path.relative(process.cwd(), schemaDirectory),
    relativeSchemaDestination: path.relative(process.cwd(), schemaDestination),
    fullSchemaDirectory: schemaDirectory,
    fullSchemaDestination: schemaDestination,
  };
}
