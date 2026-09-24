import fs from 'fs-extra';
import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);

const potentialConfigFiles = ['testem.js', 'testem.json', 'testem.cjs'];

/**
 * Given an array of file paths (relative to cwd), returns the first one that
 * exists and is accessible.
 *
 * @param {string[]} files
 * @return {string | undefined}
 */
function findValidFile(files) {
  for (let i = 0; i < files.length; i++) {
    const file = path.join(process.cwd(), files[i]);
    try {
      fs.accessSync(file, fs.constants.F_OK);
      return file;
    } catch {
      continue;
    }
  }
}

/**
 * Reads a file according to its extension. Note: for `.js`/`.cjs` files that
 * export a function (testem supports config files exporting an async
 * factory), this returns the function itself, not its resolved config --
 * matching upstream ember-exam's behavior. testem's own config loading (used
 * for the actual test run, not this convenience read) awaits it correctly.
 *
 * @param {string} file
 */
function readFileByType(file) {
  const fileType = file.split('.').pop();
  switch (fileType) {
    case 'js':
    case 'cjs':
      return require(file);
    case 'json':
      return fs.readJsonSync(file);
    default:
      throw new Error(`Unrecognized file extension for: ${file}`);
  }
}

/**
 * Gets the app's testem config by trying a custom file first, then defaulting
 * to testem.js/testem.json/testem.cjs.
 *
 * @param {string} [file]
 */
export default function readTestemConfig(file) {
  const potentialFiles = file ? [file, ...potentialConfigFiles] : potentialConfigFiles;
  const configFile = findValidFile(potentialFiles);

  return configFile && readFileByType(configFile);
}
