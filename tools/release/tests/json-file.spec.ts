import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { after, describe, it } from 'node:test';

import { getFile, JSONFile } from '../utils/json-file.ts';
import { makeTempDir, writeFile, writeJson } from './helpers.ts';

describe('utils/json-file', () => {
  const dir = makeTempDir('json-file');
  after(() => fs.rmSync(dir, { recursive: true, force: true }));

  function fixture(name: string, data: unknown) {
    const filePath = path.join(dir, name);
    writeJson(filePath, data);
    return filePath;
  }

  it('reads and caches the parsed contents until invalidated', async () => {
    const filePath = fixture('read.json', { name: 'a', version: '1.0.0' });
    const file = getFile<{ name: string; version: string }>(filePath);
    assert.ok(file instanceof JSONFile);

    const first = await file.read();
    assert.deepEqual(first, { name: 'a', version: '1.0.0' });

    writeJson(filePath, { name: 'b', version: '2.0.0' });
    assert.equal(await file.read(), first, 'serves the cached contents');

    await file.invalidate();
    assert.deepEqual(await file.read(), { name: 'b', version: '2.0.0' });
  });

  it('writes updated contents as 2-space JSON with a trailing newline', async () => {
    const filePath = fixture('write.json', { name: 'a', version: '1.0.0' });
    const file = getFile<{ name: string; version: string }>(filePath);
    const data = await file.read();
    data.version = '1.0.1';
    await file.write();
    assert.equal(fs.readFileSync(filePath, 'utf8'), `{\n  "name": "a",\n  "version": "1.0.1"\n}\n`);
  });

  it('refuses a write that would not change the contents, unless allowed', async () => {
    const filePath = fixture('noop.json', { version: '1.0.0' });
    const file = getFile<{ version: string }>(filePath);
    const data = await file.read();
    data.version = '1.0.1';
    await file.write();

    await assert.rejects(file.write(), /Should not write when not updating contents/);

    // an allowed no-op returns without touching the file
    fs.writeFileSync(filePath, 'sentinel');
    await file.write(true);
    assert.equal(fs.readFileSync(filePath, 'utf8'), 'sentinel');
  });

  it('refuses to write before anything was read', async () => {
    const file = getFile(fixture('unread.json', {}));
    await assert.rejects(file.write(), /Cannot write before updating contents/);
  });

  it('rejects when the file does not exist', async () => {
    const file = getFile(path.join(dir, 'missing.json'));
    await assert.rejects(file.read(), /missing\.json.* does not exist!/);
  });

  it('rejects with the parse error on invalid JSON', async () => {
    const filePath = path.join(dir, 'invalid.json');
    writeFile(filePath, '{ nope');
    await assert.rejects(getFile(filePath).read(), SyntaxError);
  });
});
