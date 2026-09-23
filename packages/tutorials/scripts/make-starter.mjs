#!/usr/bin/env node
/**
 * Generates each tutorial's `starter/` from its `solution/`.
 *
 *   node packages/tutorials/scripts/make-starter.mjs                  # write every starter/
 *   node packages/tutorials/scripts/make-starter.mjs todomvc-ember    # write one
 *   node packages/tutorials/scripts/make-starter.mjs --check          # fail if any starter/ is stale
 *
 * A tutorial is any directory here with both `solution/` and `starter/`. The
 * solution says how its starter differs, next to the code it affects:
 *
 *   // #replace-region-in-starter TODO (chapter 4): send the create request
 *   // #region create-todo
 *   await this.store.request(createTodo(attributes));
 *   // #endregion create-todo
 *
 * - `// #replace-region-in-starter <text>` replaces the region directly below it,
 *   markers and all, with `// <text>`.
 * - `// #remove-region-from-starter` removes the region directly below it.
 * - In templates, write either as `{{! … }}` above `<!-- #region … -->`.
 * - `// #omit-file-from-starter` as a file's first line leaves the file out.
 * - Other region markers are for the guides' snippet includes, so the starter
 *   keeps their code and drops the markers.
 * - The starter's package.json swaps `solution` for `starter` in its name and
 *   `repository.directory`, and `Completed` for `Starter` in its description.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const REGION_START = /^\s*(?:\/\/\s*#region|<!--\s*#region)\s+(\S+?)(?:\s*-->)?\s*$/;
const REGION_END = /^\s*(?:\/\/\s*#endregion|<!--\s*#endregion)\s+(\S+?)(?:\s*-->)?\s*$/;
const REPLACE = /^(\s*)(?:\/\/ #replace-region-in-starter (\S.*?)|\{\{! #replace-region-in-starter (\S.*?) \}\})\s*$/;
const REMOVE = /^\s*(?:\/\/ #remove-region-from-starter|\{\{! #remove-region-from-starter \}\})\s*$/;
const OMIT = /^\s*\/\/ #omit-file-from-starter\s*$/;
// Any line naming a directive, so a misspelled or malformed one fails instead of being ignored.
const DIRECTIVE = /#(?:replace-region-in-starter|remove-region-from-starter|omit-file-from-starter)\b/;
const TRANSFORMED = /\.(m?[jt]s|gts|gjs|html)$/;

const args = process.argv.slice(2);
const check = args.includes('--check');
const tutorialsDir = dirname(dirname(fileURLToPath(import.meta.url)));
const named = args.filter((arg) => !arg.startsWith('--'));
const tutorials = named.length
  ? named
  : readdirSync(tutorialsDir).filter(
      (dir) => existsSync(join(tutorialsDir, dir, 'solution')) && existsSync(join(tutorialsDir, dir, 'starter'))
    );

function transform(file, source) {
  const lines = source.split('\n');
  const out = [];
  const open = [];
  // Set by a replace or remove line: what replaces the region starting on the next line.
  let pending = null;
  // Depth of `open` at which the region being cut started, or -1 when not cutting.
  let cutDepth = -1;
  for (const [i, line] of lines.entries()) {
    const where = `${file}:${i + 1}`;
    if (pending) {
      if (!REGION_START.test(line)) throw new Error(`${where}: ${pending.directive} must be directly above a #region`);
      if (pending.text) out.push(pending.text);
      pending = null;
      cutDepth = open.length;
    }
    const replace = REPLACE.exec(line);
    const remove = REMOVE.test(line);
    if (replace || remove) {
      const directive = replace ? '#replace-region-in-starter' : '#remove-region-from-starter';
      if (cutDepth !== -1) throw new Error(`${where}: ${directive} inside a region that is already cut`);
      let text = null;
      if (replace) {
        const [, indent, comment, templateComment] = replace;
        text = comment !== undefined ? `${indent}// ${comment}` : `${indent}{{! ${templateComment} }}`;
      }
      pending = { directive, text };
      continue;
    }
    if (OMIT.test(line)) throw new Error(`${where}: #omit-file-from-starter must be the file's first line`);
    if (DIRECTIVE.test(line)) throw new Error(`${where}: malformed starter directive: ${line.trim()}`);
    const start = REGION_START.exec(line);
    if (start) {
      open.push(start[1]);
      continue;
    }
    const end = REGION_END.exec(line);
    if (end) {
      if (open.at(-1) !== end[1]) throw new Error(`${where}: #endregion ${end[1]} does not close ${open.at(-1)}`);
      open.pop();
      if (open.length === cutDepth) cutDepth = -1;
      continue;
    }
    if (cutDepth === -1) out.push(line);
  }
  if (pending) throw new Error(`${file}: ${pending.directive} on the last line`);
  if (open.length) throw new Error(`${file}: unclosed #region ${open.join(', ')}`);
  return out.join('\n');
}

function starterPackageJson(source) {
  const pkg = JSON.parse(source);
  const swap = (value, from, to, field) => {
    if (!value?.includes(from)) throw new Error(`solution/package.json: ${field} must contain "${from}"`);
    return value.replace(from, to);
  };
  pkg.name = swap(pkg.name, 'solution', 'starter', 'name');
  pkg.description = swap(pkg.description, 'Completed', 'Starter', 'description');
  pkg.repository.directory = swap(pkg.repository?.directory, 'solution', 'starter', 'repository.directory');
  return `${JSON.stringify(pkg, null, 2)}\n`;
}

// Writes the starter into outDir and returns its files, relative to starter/.
function generate(solutionDir, outDir) {
  // Tracked and new (untracked but not ignored) files, so build output is skipped.
  const files = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], {
    cwd: solutionDir,
    encoding: 'utf8',
  })
    .split('\n')
    .filter(Boolean);
  const written = [];
  for (const file of files) {
    let source = readFileSync(join(solutionDir, file), 'utf8');
    if (TRANSFORMED.test(file)) {
      if (OMIT.test(source.split('\n', 1)[0])) continue;
      source = transform(file, source);
    }
    if (file === 'package.json') source = starterPackageJson(source);
    mkdirSync(dirname(join(outDir, file)), { recursive: true });
    writeFileSync(join(outDir, file), source);
    written.push(file);
  }
  return written;
}

function readOrNull(path) {
  try {
    return readFileSync(path, 'utf8');
  } catch {
    return null;
  }
}

for (const tutorial of tutorials) {
  const tutorialDir = join(tutorialsDir, tutorial);
  const starterDir = join(tutorialDir, 'starter');
  const outDir = mkdtempSync(join(tmpdir(), 'starter-'));
  try {
    const expected = generate(join(tutorialDir, 'solution'), outDir);
    // Tracked files in starter/ that the generator no longer produces.
    const tracked = execFileSync('git', ['ls-files', '.'], { cwd: starterDir, encoding: 'utf8' })
      .split('\n')
      .filter(Boolean);
    const extra = tracked.filter((file) => !expected.includes(file));
    const changed = expected.filter((file) => readOrNull(join(outDir, file)) !== readOrNull(join(starterDir, file)));

    if (check) {
      if (changed.length || extra.length) {
        console.error(`${tutorial}/starter is out of date. These files differ from what the generator produces:`);
        for (const file of [...changed, ...extra]) console.error(`  ${file}`);
        console.error(
          `\nstarter/ is generated from solution/, so don't edit it directly. Make the change in` +
            ` solution/, then run:\n  node packages/tutorials/scripts/make-starter.mjs ${tutorial}`
        );
        process.exitCode = 1;
      } else {
        console.log(`${tutorial}/starter is up to date.`);
      }
    } else {
      for (const file of changed) {
        mkdirSync(dirname(join(starterDir, file)), { recursive: true });
        writeFileSync(join(starterDir, file), readFileSync(join(outDir, file)));
      }
      for (const file of extra) rmSync(join(starterDir, file));
      console.log(`${tutorial}/starter: ${changed.length} written, ${extra.length} removed.`);
    }
  } finally {
    rmSync(outDir, { recursive: true, force: true });
  }
}
