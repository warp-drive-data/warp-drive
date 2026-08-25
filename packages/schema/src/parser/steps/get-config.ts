import { styleText } from 'node:util';
import path from 'path';
import { write } from '../utils/utils';

export type SchemaConfig = Awaited<ReturnType<typeof getSchemaConfig>>;

export async function getSchemaConfig() {
  const args = Bun.argv.slice(2);
  const [schemaPath] = args;

  write(
    `\n\t ${styleText('yellow', '$')} ${styleText('bold', styleText('greenBright', '@warp-drive/') + styleText('magentaBright', 'schema'))} ${styleText('cyan', styleText('bold', 'parse'))} ${schemaPath ?? styleText('red', '<missing path>')}`
  );

  if (!schemaPath) {
    write(`\n\t${styleText('bold', '💥 Error')} Please supply a path to the schema file to parse!\n`);
    process.exit(1);
  }

  const schemaFile = Bun.file(schemaPath);
  const schemaFileExists = await schemaFile.exists();

  if (!schemaFileExists) {
    write(`\n\t${styleText('bold', '💥 Error')} ${styleText('white', schemaPath)} does not exist!`);
    process.exit(1);
  }

  const config = await schemaFile.json();
  const schemaDirectory = path.join(process.cwd(), path.dirname(schemaPath), config.schemas);
  const schemaDestination = path.join(process.cwd(), path.dirname(schemaPath), config.dest);

  return {
    _config: config,
    schemaPath,
    relativeSchemaDirectory: path.relative(process.cwd(), schemaDirectory),
    relativeSchemaDestination: path.relative(process.cwd(), schemaDestination),
    fullSchemaDirectory: schemaDirectory,
    fullSchemaDestination: schemaDestination,
  };
}
