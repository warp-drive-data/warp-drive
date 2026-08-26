import fs from 'node:fs';
import path from 'node:path';

import { classify, getRelativePath } from './strings.ts';

export type EntityKind = 'adapter' | 'serializer';

export interface BaseClassResult {
  importStatement: string;
  baseClass: string;
}

/**
 * Computes the import statement + class name to extend from for a generated
 * adapter or serializer, mirroring the historical ember-cli blueprint
 * behavior: if the project already has an `application` adapter/serializer,
 * new (non-application) files default to extending it instead of the
 * package's own base class.
 */
export function extendFromApplicationEntity(
  kind: EntityKind,
  defaultBaseClass: string,
  options: {
    cwd: string;
    entityName: string;
    isAddon: boolean;
    baseClass?: string;
    relativePath?: string;
  }
): BaseClassResult {
  const entityName = options.entityName;
  const relativePath = options.relativePath ?? getRelativePath(entityName);
  let baseClass = defaultBaseClass;
  let baseClassOption = options.baseClass;

  const applicationEntityPath = path.join(options.cwd, 'app', `${kind}s`, 'application.js');
  const hasApplicationEntity = fs.existsSync(applicationEntityPath);

  if (!options.isAddon && !baseClassOption && entityName !== 'application' && hasApplicationEntity) {
    baseClassOption = 'application';
  }

  if (baseClassOption === entityName) {
    throw new Error(
      `${classify(kind)}s cannot extend from themself. To resolve this, remove the --base-class option or change to a different base-class.`
    );
  }

  let importStatement: string;

  if (baseClassOption) {
    baseClass = classify(baseClassOption.replace('/', '-')) + classify(kind);
    importStatement = `import ${baseClass} from '${relativePath}${baseClassOption}';`;
  } else {
    let baseClassPath = `@ember-data/${kind}`;

    if (baseClass.startsWith('JSONAPI')) {
      baseClassPath += '/json-api';
    }
    if (baseClass.startsWith('REST')) {
      baseClassPath += '/rest';
    }

    importStatement = `import ${baseClass} from '${baseClassPath}';`;
  }

  return { importStatement, baseClass };
}

/**
 * Best-effort detection of whether the project being generated into is an
 * ember-addon (as opposed to an app), based on the `keywords`/`ember-addon`
 * fields in its package.json -- the same signal ember-cli's own
 * `Project#isEmberCLIAddon()` used.
 */
export function isAddonProject(cwd: string): boolean {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(cwd, 'package.json'), 'utf-8')) as {
      keywords?: string[];
      'ember-addon'?: unknown;
    };
    return Boolean(pkg['ember-addon']) || Boolean(pkg.keywords?.includes('ember-addon'));
  } catch {
    return false;
  }
}
