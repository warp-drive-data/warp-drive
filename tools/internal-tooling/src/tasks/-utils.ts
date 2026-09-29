import { findWorkspaceDir } from '@pnpm/find-workspace-dir';
import { findWorkspacePackagesNoCheck, type Project } from '@pnpm/find-workspace-packages';
import type { CommentObject } from 'comment-json';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

export async function getMonorepoRoot() {
  const workspaceDir = await findWorkspaceDir(process.cwd());

  if (workspaceDir) {
    return workspaceDir;
  }

  const MAX_DEPTH = 10;
  // are we in the root?
  let currentDir = process.cwd();
  let depth = 0;
  while (depth < MAX_DEPTH) {
    const lockfileFile = path.join(currentDir, 'pnpm-lock.yaml');
    if (existsSync(lockfileFile)) {
      return currentDir;
    }
    currentDir = path.join(currentDir, '../');
    depth++;
  }

  throw new Error(`Could not find monorepo root from cwd ${process.cwd()}`);
}

export async function runPrettier() {
  const root = await getMonorepoRoot();
  const childProcess = spawn('pnpm', ['lint:prettier:fix'], {
    env: process.env,
    cwd: root,
    stdio: ['ignore', 'inherit', 'inherit'],
    // resolves pnpm.cmd on Windows
    shell: process.platform === 'win32',
  });
  // rejects if pnpm cannot be spawned; like before, a failing prettier run is not an error here
  await once(childProcess, 'close');
}

type PkgJsonFile = {
  name: string;
  version: string;
  files?: string[];
  license?: string;
  private?: boolean;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  scripts?: Record<string, string>;
  main?: string;
  peerDependenciesMeta?: Record<string, { optional: boolean }>;
};

export type TsConfigFile = {
  include?: string[];
  compilerOptions?: {
    lib?: string[];
    module?: string;
    target?: string;
    moduleResolution?: string;
    moduleDetection?: string;
    erasableSyntaxOnly?: boolean;
    allowImportingTsExtensions?: boolean;
    verbatimModuleSyntax?: boolean;
    isolatedModules?: boolean;
    isolatedDeclarations?: boolean;
    pretty?: boolean;
    strict?: boolean;
    experimentalDecorators?: boolean;
    allowJs?: boolean;
    checkJs?: boolean;
    rootDir?: string;
    baseUrl?: string;
    declarationMap?: boolean;
    inlineSourceMap?: boolean;
    inlineSources?: boolean;
    skipLibCheck?: boolean;
    declaration?: boolean;
    declarationDir?: string;
    incremental?: boolean;
    composite?: boolean;
    emitDeclarationOnly?: boolean;
    noEmit?: boolean;
    paths?: Record<string, string[]>;
    types?: string[];
  };
  references?: { path: string }[];
};

interface BaseProjectPackage {
  project: Project;
  packages: Map<string, Project>;
  pkgPath: string;
  tsconfigPath: string;
  isRoot: boolean;
  isPrivate: boolean;
  isTooling: boolean;
  isConfig: boolean;
  isTest: boolean;
  pkg: PkgJsonFile;
  save: (editStatus: { pkgEdited: boolean; configEdited: Boolean }) => Promise<void>;
}

export interface ProjectPackageWithTsConfig extends BaseProjectPackage {
  tsconfig: CommentObject & TsConfigFile;
  hasTsConfig: true;
}

interface ProjectPackageWithoutTsConfig extends BaseProjectPackage {
  tsconfig: null;
  hasTsConfig: false;
}

export type ProjectPackage = ProjectPackageWithTsConfig | ProjectPackageWithoutTsConfig;

async function collectAllPackages(dir: string) {
  // The NoCheck variant skips pnpm's `engines` check, which only reads the pnpm
  // version from `npm_package_*` env vars that `pnpm <bin>` does not set, and so
  // fails on the root's `engines.pnpm` even under the right pnpm.
  const packages = await findWorkspacePackagesNoCheck(dir);
  const pkgMap = new Map<string, Project>();
  for (const pkg of packages) {
    if (!pkg.manifest.name) {
      throw new Error(`Package at ${pkg.dir} does not have a name`);
    }
    pkgMap.set(pkg.manifest.name, pkg);
  }

  return pkgMap;
}

export async function walkPackages(
  cb: (pkg: ProjectPackage, projects: Map<string, ProjectPackage>) => void | Promise<void>,
  options: {
    excludeTests?: boolean;
    excludePrivate?: boolean;
    excludeRoot?: boolean;
    excludeTooling?: boolean;
    excludeConfig?: boolean;
  } = {}
) {
  const config = Object.assign(
    { excludeTests: false, excludePrivate: false, excludeRoot: true, excludeTooling: true, excludeConfig: true },
    options
  );
  const JSONC = await import('comment-json');
  const dir = await getMonorepoRoot();
  const packages = await collectAllPackages(dir);
  const projects = new Map<string, ProjectPackageWithTsConfig>();
  const TestDir = path.join(dir, 'tests');

  for (const [name, project] of packages) {
    if (config.excludeRoot && name === 'root') continue;
    if (config.excludePrivate && project.manifest.private) continue;
    if (config.excludeTooling && name === '@warp-drive/internal-tooling') continue;
    if (config.excludeConfig && name === '@warp-drive/config') continue;
    if (config.excludeTests && project.dir.startsWith(TestDir)) continue;

    const pkgPath = path.join(project.dir, 'package.json');
    const tsconfigPath = path.join(project.dir, 'tsconfig.json');
    const pkg = JSON.parse(await readFile(pkgPath, 'utf8')) as PkgJsonFile;
    const hasTsConfig = existsSync(tsconfigPath);
    const tsconfig = hasTsConfig
      ? (JSONC.parse(await readFile(tsconfigPath, 'utf8')) as CommentObject & TsConfigFile)
      : null;

    const pkgObj = {
      project,
      packages,
      pkgPath,
      hasTsConfig,
      tsconfigPath,
      isRoot: name === 'root',
      isPrivate: project.manifest.private ?? false,
      isTooling: name === '@warp-drive/internal-tooling',
      isConfig: name === '@warp-drive/config',
      isTest: project.dir.startsWith(TestDir),
      pkg,
      tsconfig,
      save: async ({ pkgEdited, configEdited }: { pkgEdited: boolean; configEdited: Boolean }) => {
        if (pkgEdited) await writeFile(pkgPath, JSON.stringify(pkg, null, 2));
        if (configEdited) await writeFile(tsconfigPath, JSONC.stringify(tsconfig, null, 2));
      },
    } as ProjectPackageWithTsConfig;

    projects.set(name, pkgObj);
  }

  for (const project of projects.values()) {
    await cb(project, projects);
  }
}
