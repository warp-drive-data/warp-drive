#!/usr/bin/env node
/**
 * Generates each tutorial's `starter/` from its `solution/`.
 *
 *   node packages/tutorials/scripts/make-starter.mjs                  # write every starter/
 *   node packages/tutorials/scripts/make-starter.mjs todomvc-ember    # write one
 *   node packages/tutorials/scripts/make-starter.mjs --check          # fail if any starter/ is stale
 *
 * A tutorial is any directory here with a `solution/`; its `starter/` is created
 * if missing. The solution says how its starter differs, next to the code it affects:
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
 * - Every text file is transformed, and binary files are copied as they are.
 *   Line endings are written as LF.
 * - The starter's package.json swaps `solution` for `starter` in its name and
 *   `repository.directory`, and `Completed` for `Starter` in its description.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const REGION_START = /^\s*(?:\/\/\s*#region|<!--\s*#region)\s+(\S+?)(?:\s*-->)?\s*$/;
const REGION_END = /^\s*(?:\/\/\s*#endregion|<!--\s*#endregion)\s+(\S+?)(?:\s*-->)?\s*$/;
const REPLACE = /^(\s*)(?:\/\/ #replace-region-in-starter (\S.*?)|\{\{! #replace-region-in-starter (\S.*?) \}\})\s*$/;
const REMOVE = /^\s*(?:\/\/ #remove-region-from-starter|\{\{! #remove-region-from-starter \}\})\s*$/;
const OMIT = /^\s*\/\/ #omit-file-from-starter\s*$/;
// Any line naming a directive, so a misspelled or malformed one fails instead of being ignored.
const DIRECTIVE = /#(?:replace-region-in-starter|remove-region-from-starter|omit-file-from-starter)\b/;
// Any line naming a region marker, so one REGION_START/REGION_END can't read (a name with a
// space, say) fails instead of leaking into the starter.
const MARKER = /#(?:end)?region\b/;

const args = process.argv.slice(2);
const check = args.includes('--check');
const tutorialsDir = dirname(dirname(fileURLToPath(import.meta.url)));
const named = args.filter((arg) => !arg.startsWith('--'));
const known = readdirSync(tutorialsDir).filter((dir) => existsSync(join(tutorialsDir, dir, 'solution')));
const unknown = named.filter((name) => !known.includes(name));
if (unknown.length) {
  console.error(`Unknown tutorial: ${unknown.join(', ')}. Tutorials: ${known.join(', ') || 'none'}`);
  process.exit(1);
}
if (!known.length) {
  console.error(`No tutorials found: no directory in packages/tutorials has a solution/.`);
  process.exit(1);
}
const tutorials = named.length ? named : known;

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
    if (DIRECTIVE.test(line)) throw new Error(`${where}: malformed tutorial starter directive: ${line.trim()}`);
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
    if (MARKER.test(line))
      throw new Error(`${where}: malformed region marker (names can't contain spaces): ${line.trim()}`);
    if (cutDepth === -1) out.push(line);
  }
  if (pending) throw new Error(`${file}: ${pending.directive} on the last line`);
  if (open.length) throw new Error(`${file}: unclosed #region ${open.join(', ')}`);
  return out.join('\n');
}

// Edits the raw text rather than re-serializing, so the solution's formatting carries over.
function starterPackageJson(source) {
  const pkg = JSON.parse(source);
  const swaps = [
    ['name', pkg.name, 'solution', 'starter'],
    ['description', pkg.description, 'Completed', 'Starter'],
    ['repository.directory', pkg.repository?.directory, 'solution', 'starter'],
  ];
  for (const [field, value, from, to] of swaps) {
    if (!value?.includes(from)) throw new Error(`solution/package.json: ${field} must contain "${from}"`);
    source = source.replace(JSON.stringify(value), JSON.stringify(value.replace(from, to)));
  }
  return source;
}

// Tracked and new (untracked but not ignored) files that exist on disk, so build output and
// unstaged deletions are skipped.
function listFiles(dir, ...flags) {
  if (!existsSync(dir)) return [];
  return execFileSync('git', ['ls-files', ...flags], { cwd: dir, encoding: 'utf8' })
    .split('\n')
    .filter((file) => file && existsSync(join(dir, file)));
}

// git's heuristic: a file with a NUL byte in its first 8000 bytes is binary.
const isText = (buffer) => !buffer.subarray(0, 8000).includes(0);

// Reads a file for comparison, with CRLF line endings normalized to LF in text files.
function readNormalized(path) {
  if (!existsSync(path)) return null;
  const buffer = readFileSync(path);
  return isText(buffer) ? Buffer.from(buffer.toString('utf8').replaceAll('\r\n', '\n')) : buffer;
}

// Returns the starter's files, relative to starter/, and their contents.
function generate(solutionDir) {
  const untracked = listFiles(solutionDir, '--others', '--exclude-standard');
  if (untracked.length) console.error(`Including untracked files from solution/: ${untracked.join(', ')}`);
  const files = new Map();
  for (const file of listFiles(solutionDir, '--cached', '--others', '--exclude-standard')) {
    const buffer = readFileSync(join(solutionDir, file));
    if (!isText(buffer)) {
      files.set(file, buffer);
      continue;
    }
    let source = buffer.toString('utf8').replaceAll('\r\n', '\n');
    if (OMIT.test(source.split('\n', 1)[0])) continue;
    source = transform(file, source);
    if (file === 'package.json') source = starterPackageJson(source);
    files.set(file, Buffer.from(source));
  }
  return files;
}

for (const tutorial of tutorials) {
  const tutorialDir = join(tutorialsDir, tutorial);
  const starterDir = join(tutorialDir, 'starter');
  const expected = generate(join(tutorialDir, 'solution'));
  // Files in starter/ that the generator no longer produces, tracked or not.
  const extra = listFiles(starterDir, '--cached', '--others', '--exclude-standard').filter(
    (file) => !expected.has(file)
  );
  const changed = [...expected.keys()].filter(
    (file) => !readNormalized(join(starterDir, file))?.equals(expected.get(file))
  );

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
      writeFileSync(join(starterDir, file), expected.get(file));
    }
    for (const file of extra) rmSync(join(starterDir, file), { force: true });
    console.log(`${tutorial}/starter: ${changed.length} written, ${extra.length} removed.`);
  }
}
