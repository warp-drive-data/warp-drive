import { styleText } from 'node:util';

import { SchemaModule } from '../utils/process-file';
import { write } from '../utils/utils';
import { Schema } from './json-schema-spec';

export async function compileJSONSchemas(modules: Map<string, SchemaModule>) {
  const compiled: Schema[] = [];

  for (const [filePath, module] of modules) {
    if (module.exports.length === 0) {
      write(
        `\n\t\t${styleText('bold', styleText('yellow', '⚠️  caution: '))} No exported schemas found in ${styleText('bold', styleText('yellow', filePath))}`
      );
    }

    if (module.exports.length > 1) {
      write(
        `\n\t\t${styleText('bold', styleText('red', '❌  error: '))} Multiple exported schemas found in ${styleText('bold', styleText('red', filePath))}`
      );
      process.exit(1);
    }

    const klassSchema = module.exports[0];
    const { FullKlassType, KlassType, fullType } = module.$potentialPrimaryResourceType;

    if (klassSchema.name !== FullKlassType && klassSchema.name !== KlassType) {
      write(
        `\n\t\t${styleText('bold', styleText('yellow', '⚠️  caution: '))} Exported schema ${styleText('bold', klassSchema.name)} in ${fullType} does not seem to match the expected name of ${styleText('bold', FullKlassType)}`
      );
    }

    const schema: Partial<Schema> = {
      '@type': fullType,
    };

    // compile traits

    // compile fields
  }

  return compiled;
}
