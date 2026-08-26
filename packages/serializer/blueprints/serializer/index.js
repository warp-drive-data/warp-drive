module.exports = {
  description: 'Generates an ember-data Serializer.',

  availableOptions: [{ name: 'base-class', type: String }],

  root: __dirname,

  async locals(options) {
    const { generateSerializerSource } = await import('warp-drive/generators/serializer');

    const isAddon = options.inRepoAddon || options.project.isEmberCLIAddon();

    return {
      content: generateSerializerSource(options.entity.name, {
        cwd: options.project.root,
        isAddon,
        baseClass: options.baseClass,
      }),
    };
  },
};
