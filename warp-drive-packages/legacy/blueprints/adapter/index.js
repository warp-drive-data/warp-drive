const path = require('path');

module.exports = {
  description: 'Generates an ember-data Adapter.',

  availableOptions: [{ name: 'base-class', type: String }],

  async locals(options) {
    const { generateAdapterSource } = await import('warp-drive/generators/adapter');

    const isAddon = options.inRepoAddon || options.project.isEmberCLIAddon();

    return {
      content: generateAdapterSource(options.entity.name, {
        cwd: options.project.root,
        isAddon,
        baseClass: options.baseClass,
        packageName: this.packageName ?? '@warp-drive/legacy/adapter',
        importStyle: this.importStyle ?? 'named',
      }),
    };
  },

  filesPath() {
    return path.join(__dirname, 'files');
  },
};
