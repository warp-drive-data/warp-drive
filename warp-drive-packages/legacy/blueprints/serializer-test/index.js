const path = require('path');

module.exports = {
  description: 'Generates an EmberData Serializer unit test',
  supportsAddon() {
    return false;
  },

  root: __dirname,

  fileMapTokens() {
    return {
      __root__() {
        return 'tests';
      },
      __path__() {
        return path.join('unit', 'serializers');
      },
    };
  },

  async locals(options) {
    const { generateUnitTestSource } = await import('warp-drive/generators/tests');
    const { dasherize } = await import('warp-drive/generators/strings');
    const modulePrefix = dasherize(options.project.config().modulePrefix);

    return {
      content: generateUnitTestSource('Serializer', options.entity.name, modulePrefix),
    };
  },

  filesPath() {
    return path.join(__dirname, 'qunit-files');
  },
};
