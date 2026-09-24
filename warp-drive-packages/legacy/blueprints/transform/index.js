const path = require('path');

module.exports = {
  description: 'Generates an ember-data Transform.',

  async locals(options) {
    const { generateTransformSource } = await import('warp-drive/generators/transform');

    return {
      content: generateTransformSource(options.entity.name),
    };
  },

  filesPath() {
    return path.join(__dirname, 'files');
  },
};
