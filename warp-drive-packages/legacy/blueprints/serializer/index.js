const path = require('path');

module.exports = {
  description: 'Generates an ember-data Serializer.',

  availableOptions: [{ name: 'base-class', type: String }],

  async locals(options) {
    const { generateSerializerSource } = await import('warp-drive/generators/serializer');

    const isAddon = options.inRepoAddon || options.project.isEmberCLIAddon();

    return {
      content: generateSerializerSource(options.entity.name, {
        cwd: options.project.root,
        isAddon,
        baseClass: options.baseClass,
        packageName: this.packageName ?? '@warp-drive/legacy/serializer',
        importStyle: this.importStyle ?? 'named',
      }),
    };
  },

  filesPath() {
    return path.join(__dirname, 'files');
  },
};
