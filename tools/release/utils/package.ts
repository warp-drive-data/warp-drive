import { JSONFile, getFile } from './json-file.ts';
import { NPM_DIST_TAG, SEMVER_VERSION, STRATEGY_TYPE, TYPE_STRATEGY } from './channel.ts';
import { Glob } from 'bun';
import path from 'path';
export class Package {
  declare projectPath: string;
  declare filePath: string;
  declare file: JSONFile<PACKAGEJSON>;
  declare pkgData: PACKAGEJSON;
  declare tarballPath: string;
  declare mirrorTarballPath: string;
  declare typesTarballPath: string;

  constructor(filePath: string, file: JSONFile<PACKAGEJSON>, pkgData: PACKAGEJSON) {
    this.projectPath = path.dirname(filePath);
    this.filePath = filePath;
    this.file = file;
    this.pkgData = pkgData;
    this.tarballPath = '';
    this.mirrorTarballPath = '';
    this.typesTarballPath = '';
  }

  async refresh() {
    await this.file.invalidate();
    this.pkgData = await this.file.read(true);
  }
}

/**
 * A valid package.json file can go up to 3 levels deep
 * when defining the exports field. 4 levels for unpkg
 *
 * ```
 * {
 *  "exports": {
 *    ".": "./index.js",
 *    "main": {
 *      "import": "./index.js",
 *      "require": "./index.js"
 *      "browser": {
 *         "import": "./index.js",
 *         "require": "./index.js"
 *      }
 *     }
 *   }
 * }
 * ```
 *
 * @internal
 */
type ExportConfig = Record<string, string | Record<string, string | Record<string, string | Record<string, string>>>>;

export type PACKAGEJSON = {
  name: string;
  version: SEMVER_VERSION;
  private: boolean;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  scripts?: Record<string, string>;
  files?: string[];
  exports?: ExportConfig;
  keywords?: string[];
  typesVersions?: { [tsVersion: string]: { [relativeImportPath: string]: string[] } };
  'ember-addon'?: {
    main?: 'addon-main.js' | 'addon-main.cjs';
    type?: 'addon';
    version?: 1 | 2;
  };
  author?: string;
  license?: string;
  repository?: {
    type: string;
    url: string;
    directory?: string;
  };
};

export type APPLIED_STRATEGY = {
  name: string;
  private: boolean;
  stage: STRATEGY_TYPE;
  types: TYPE_STRATEGY;
  mirrorPublish: boolean;
  mirrorPublishTo: string;
  typesPublish: boolean;
  unpkgPublish: boolean;
  typesPublishTo: string;
  fromVersion: SEMVER_VERSION;
  toVersion: SEMVER_VERSION;
  distTag: NPM_DIST_TAG;
  pkgDir: string;
  new: boolean;
};

export interface ChangelogStrategy {
  /**
   * Merges multiple PR label sections into a single section in the generated changelog.
   *
   * When lerna-changelog produces output, it groups PRs under headings derived from their
   * labels. `collapseLabels.labels` lists the headings to fold together, and `title` is
   * the single heading that replaces all of them.
   *
   * Example: collapsing ":shower: Deprecation Removal", ":goal_net: Test", and
   * ":house: Internal" under the title ":house: Internal" so they appear as one section.
   *
   * Implemented in `keyForLabel()` in `steps/get-changes.ts`.
   */
  collapseLabels?: {
    labels: string[];
    title: string;
  };
  /**
   * Controls the order in which label sections appear in the final changelog markdown.
   *
   * `buildText()` in `steps/update-changelogs.ts` emits sections in this order first,
   * then appends any remaining sections (not listed here) afterward. Labels absent from
   * this array are not suppressed — they just appear at the end in an unspecified order.
   *
   * Typical convention: Breaking Changes → Deprecations → Docs → Enhancements →
   * Bug Fixes → Performance → Internal, putting the most impactful changes first.
   */
  labelOrder?: string[];
  /**
   * Routes changelog entries from a source path or label to a specific package changelog.
   *
   * Keys are the sub-path names or label names that lerna-changelog uses as sources.
   * Values are either a package name (entries go to that package's CHANGELOG) or `null`
   * (entries go to the root changelog).
   *
   * Example: `{ "mock-server": "@warp-drive/diagnostic", "Other": null }`
   * — entries from the `mock-server` folder are attributed to `@warp-drive/diagnostic`,
   * and entries labeled "Other" land in the root changelog.
   *
   * Consumed by `packagesBySubPath()` in `steps/get-changes.ts`.
   */
  mappings: Record<string, string | null>;
}

export interface RawStrategyConfig {
  packageRoots: string[];
  changelogRoots?: string[];
  changelog?: ChangelogStrategy;
}

export interface STRATEGY {
  config: RawStrategyConfig;
  defaults: {
    stage: STRATEGY_TYPE;
    types: TYPE_STRATEGY;
    mirrorPublish?: boolean;
    typesPublish?: boolean;
    unpkgPublish?: boolean;
  };
  rules: Record<
    string,
    {
      stage: STRATEGY_TYPE;
      types: TYPE_STRATEGY;
      mirrorPublish?: boolean;
      typesPublish?: boolean;
      unpkgPublish?: boolean;
    }
  >;
}

function buildGlob(dirPath: string) {
  return `${dirPath}/package.json`;
}

export async function gatherPackages(config: STRATEGY['config'], cwd: string = process.cwd()) {
  const packages: Map<string, Package> = new Map();

  // add root
  const rootFilePath = `${cwd}/package.json`;
  const rootFile = getFile<PACKAGEJSON>(rootFilePath);
  const rootPkgData = await rootFile.read();
  packages.set('root', new Package(rootFilePath, rootFile, rootPkgData));

  // add other packages
  for (const dirPath of config.packageRoots) {
    const glob = new Glob(buildGlob(dirPath));

    // Scans the current working directory and each of its sub-directories recursively
    for await (const filePath of glob.scan(cwd)) {
      const file = getFile<PACKAGEJSON>(path.join(cwd, filePath));
      const pkgData = await file.read();
      packages.set(pkgData.name, new Package(filePath, file, pkgData));
    }
  }

  return packages;
}

export async function loadStrategy(cwd: string = process.cwd()) {
  const file = getFile<STRATEGY>(`${cwd}/tools/release/strategy.json`);
  const data = await file.read();
  return data;
}
