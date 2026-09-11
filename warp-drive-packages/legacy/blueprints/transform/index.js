module.exports = {
  description: 'Generates an ember-data Transform.',
  root: __dirname,

  async locals(options) {
    const { generateTransformSource } = await import('warp-drive/generators/transform');

    return {
      content: generateTransformSource(options.entity.name),
    };
  },
};
