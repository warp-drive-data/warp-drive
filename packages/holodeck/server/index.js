/* global Bun */
import path from 'path';
const isBun = typeof Bun !== 'undefined';
let closeHandler = () => {};

export default {
  async launchProgram(config = {}) {
    const projectRoot = process.cwd();
    const name = await import(path.join(projectRoot, 'package.json'), { with: { type: 'json' } }).then(
      (pkg) => pkg.name
    );
    const options = { name, projectRoot, ...config };

    // the server only runs on node, so under bun we spawn it in a child process
    if (isBun) {
      const compatImpl = await import('./compat-shim.js');
      const program = await compatImpl.launchProgram(options);
      closeHandler = program.endProgram;
      return program.config;
    }

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
