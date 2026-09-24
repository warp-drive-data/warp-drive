import { Glob } from 'bun';
import { styleText } from 'node:util';
import path from 'path';

import { SchemaModule, parseSchemaFile } from '../utils/process-file';
import { write } from '../utils/utils';
import { SchemaConfig } from './get-config';

export async function gatherSchemaFiles(config: SchemaConfig) {
  const { fullSchemaDirectory, relativeSchemaDirectory } = config;
  write(`\n\t\tParsing schema files from ${styleText('bold', styleText('cyan', relativeSchemaDirectory))}`);
  const modules = new Map<string, SchemaModule>();

  const glob = new Glob(`**/*.ts`);
  for await (const filePath of glob.scan(fullSchemaDirectory)) {
    write(`\n\t\tParsing ${styleText('bold', styleText('cyan', filePath))}`);
    const fullPath = path.join(fullSchemaDirectory, filePath);
    const file = Bun.file(fullPath);
    const contents = await file.text();
    const schemaModule = await parseSchemaFile(filePath, contents);
    modules.set(filePath, schemaModule);
  }

  return modules;
}
