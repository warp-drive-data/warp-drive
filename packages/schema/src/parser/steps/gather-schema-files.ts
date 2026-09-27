import fs from 'node:fs/promises';
import path from 'node:path';
import { styleText } from 'node:util';

import { type SchemaModule, parseSchemaFile } from '../utils/process-file.ts';
import { write } from '../utils/utils.ts';
import type { SchemaConfig } from './get-config.ts';

export async function gatherSchemaFiles(config: SchemaConfig) {
  const { fullSchemaDirectory, relativeSchemaDirectory } = config;
  write(`\n\t\tParsing schema files from ${styleText('bold', styleText('cyan', relativeSchemaDirectory))}`);
  const modules = new Map<string, SchemaModule>();

  // fs.glob also yields directories whose name matches the pattern, e.g. `foo.ts/`
  for await (const entry of fs.glob('**/*.ts', { cwd: fullSchemaDirectory, withFileTypes: true })) {
    if (!entry.isFile()) {
      continue;
    }
    const filePath = path.relative(fullSchemaDirectory, path.join(entry.parentPath, entry.name));
    write(`\n\t\tParsing ${styleText('bold', styleText('cyan', filePath))}`);
    const fullPath = path.join(fullSchemaDirectory, filePath);
    const contents = await fs.readFile(fullPath, 'utf8');
    const schemaModule = await parseSchemaFile(filePath, contents);
    modules.set(filePath, schemaModule);
  }

  return modules;
}
