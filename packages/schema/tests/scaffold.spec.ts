import assert from 'node:assert/strict';
import fs from 'node:fs';
import { test } from 'node:test';

import { fileExists, readFile, runCli, setupProject } from './helpers.ts';

const SCAFFOLD = 'src/scaffold.ts';

function plainTemplate(className: string): string {
  return `import { Resource } from '@warp-drive/schema-decorators';

@Resource
class ${className} {
  // ...
}

export { ${className} };
`;
}

test('scaffold resource creates schema.json and the first-resource template', (t) => {
  const dir = setupProject(t);

  const result = runCli(SCAFFOLD, ['resource', 'user'], dir);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /@warp-drive\/schema scaffold resource user/);
  assert.match(result.stdout, /Generating new schema\.json configuration file/);
  assert.match(result.stdout, /Scaffolding new user resource in \.\/schemas\/user\.ts\.\.\./);

  assert.deepEqual(JSON.parse(readFile(dir, 'schema.json')), { schemas: './schemas', dest: './dist' });

  const user = readFile(dir, 'schemas/user.ts');
  assert.ok(
    user.startsWith(
      "import { collection, createonly, derived, field, optional, readonly, resource, Resource } from '@warp-drive/schema-decorators';\n"
    )
  );
  assert.match(user, /^@Resource \/\/ Resource is a default "Trait"/m);
  assert.match(user, /^class User \{$/m);
  assert.match(user, /^export \{ User \};$/m);
});

test('scaffold resource uses the plain template once schema.json exists', (t) => {
  const dir = setupProject(t);
  runCli(SCAFFOLD, ['resource', 'user'], dir);

  const result = runCli(SCAFFOLD, ['resource', 'comment'], dir);

  assert.equal(result.status, 0, result.stderr);
  assert.doesNotMatch(result.stdout, /Generating new schema\.json/);
  assert.match(result.stdout, /Scaffolding new comment resource in \.\/schemas\/comment\.ts\.\.\./);
  assert.equal(readFile(dir, 'schemas/comment.ts'), plainTemplate('Comment'));
});

test('scaffold resource writes into the schemas directory of an existing schema.json', (t) => {
  const dir = setupProject(t, {
    'schema.json': JSON.stringify({ schemas: './src/schemas', dest: './dist' }),
  });

  const result = runCli(SCAFFOLD, ['resource', 'post'], dir);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Scaffolding new post resource in \.\/src\/schemas\/post\.ts\.\.\./);
  assert.equal(readFile(dir, 'src/schemas/post.ts'), plainTemplate('Post'));
  assert.equal(fileExists(dir, 'schemas'), false);
});

test('scaffold resource skips a resource that already exists', (t) => {
  const dir = setupProject(t);
  runCli(SCAFFOLD, ['resource', 'user'], dir);
  const before = readFile(dir, 'schemas/user.ts');

  const result = runCli(SCAFFOLD, ['resource', 'user'], dir);

  assert.equal(result.status, 1, result.stderr);
  assert.match(result.stdout, /Error \.\/schemas\/user\.ts already exists! Skipping Scaffold\./);
  assert.doesNotMatch(result.stdout, /Scaffolding new/);
  assert.equal(readFile(dir, 'schemas/user.ts'), before);
});

test('scaffold rejects an unknown scaffold type', (t) => {
  const dir = setupProject(t);

  const result = runCli(SCAFFOLD, ['widget', 'foo'], dir);

  assert.equal(result.status, 1, result.stderr);
  assert.match(result.stdout, /Error widget is not a valid scaffold\./);
  assert.match(result.stdout, /Available Scaffolds/);
  for (const scaffold of ['resource', 'trait', 'field', 'derivation', 'transform']) {
    assert.match(result.stdout, new RegExp(`◆ ${scaffold}`));
  }
  assert.equal(fileExists(dir, 'schema.json'), false);
});

test('scaffold rejects a missing scaffold type', (t) => {
  const dir = setupProject(t);

  const result = runCli(SCAFFOLD, [], dir);

  assert.equal(result.status, 1, result.stderr);
  assert.match(result.stdout, /Error <missing type> is not a valid scaffold\./);
  assert.equal(fileExists(dir, 'schema.json'), false);
});

test('scaffold exits 1 for scaffold types that are not implemented yet', (t) => {
  const dir = setupProject(t);

  for (const scaffold of ['trait', 'field', 'derivation', 'transform']) {
    const result = runCli(SCAFFOLD, [scaffold, 'foo'], dir);

    assert.equal(result.status, 1, result.stderr);
    assert.match(result.stdout, new RegExp(`Error The ${scaffold} scaffold is not implemented yet\\.`));
    assert.doesNotMatch(result.stdout, /Scaffolding new/);
  }
  assert.deepEqual(fs.readdirSync(dir), []);
});

test('scaffold resource requires a name', (t) => {
  const dir = setupProject(t);

  const result = runCli(SCAFFOLD, ['resource'], dir);

  assert.equal(result.status, 1, result.stderr);
  assert.match(result.stdout, /scaffold resource <missing name>/);
  assert.match(result.stdout, /Error Please supply a name for the resource to scaffold!/);
  assert.equal(fileExists(dir, 'schema.json'), false);
});

test('scaffold resource derives a singular PascalCase class name from the resource name', (t) => {
  const dir = setupProject(t, {
    'schema.json': JSON.stringify({ schemas: './schemas', dest: './dist' }),
  });

  const cases = [
    ['blog-posts', 'BlogPost'],
    ['companies', 'Company'],
    ['boxes', 'Box'],
    ['user_profile', 'UserProfile'],
    ['person', 'Person'],
  ] as const;

  for (const [name, className] of cases) {
    const result = runCli(SCAFFOLD, ['resource', name], dir);

    assert.equal(result.status, 0, result.stderr);
    assert.equal(readFile(dir, `schemas/${name}.ts`), plainTemplate(className), `${name} -> ${className}`);
  }
});
