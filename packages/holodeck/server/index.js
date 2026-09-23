import path from 'node:path';
import { pathToFileURL } from 'node:url';

let closeHandler = () => {};

export default {
  async launchProgram(config = {}) {
    const projectRoot = process.cwd();
    const pkg = await import(pathToFileURL(path.join(projectRoot, 'package.json')).href, {
      with: { type: 'json' },
    });
    const { name } = pkg.default ?? pkg;
    const options = { name, projectRoot, ...config };

    // @ts-expect-error
    options.useWorker = config.useWorker ?? true;
    const nodeImpl = await import('./node.js');
    const program = await nodeImpl.launchProgram(options);
    closeHandler = program.endProgram;
    return program.config;
  },
  async endProgram() {
    closeHandler();
  },
};
