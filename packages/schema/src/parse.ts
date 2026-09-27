#!/usr/bin/env node
import { compileJSONSchemas } from './parser/compile/json.ts';
import { gatherSchemaFiles } from './parser/steps/gather-schema-files.ts';
import { getSchemaConfig } from './parser/steps/get-config.ts';

async function main() {
  const config = await getSchemaConfig();

  const modules = await gatherSchemaFiles(config);
  const compiledJson = await compileJSONSchemas(modules);

  console.log(compiledJson);
}

await main();
