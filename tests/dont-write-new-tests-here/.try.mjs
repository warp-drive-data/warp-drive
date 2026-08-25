import getChannelURL from 'ember-source-channel-url';

const [releaseUrl, betaUrl, canaryUrl] = await Promise.all([
  getChannelURL('release'),
  getChannelURL('beta'),
  getChannelURL('canary'),
]);

export default {
  scenarios: [
    {
      name: 'ember-lts-4.12',
      npm: {
        devDependencies: {
          'ember-source': '~4.12.3',
        },
      },
    },
    {
      name: 'ember-lts-5.12',
      npm: {
        devDependencies: {
          'ember-source': '~5.12.0',
        },
      },
    },
    {
      name: 'ember-lts-6.12',
      npm: {
        devDependencies: {
          'ember-source': '~6.12.0',
        },
      },
    },
    {
      name: 'ember-lts-3.28',
      npm: {
        devDependencies: {
          'ember-cli': '~4.12.3',
          'ember-source': '~3.28.12',
          '@glimmer/component': '^1.1.2',
        },
      },
    },
    {
      name: 'ember-release',
      npm: {
        devDependencies: {
          'ember-source': releaseUrl,
        },
      },
    },
    {
      name: 'ember-beta',
      npm: {
        devDependencies: {
          'ember-source': betaUrl,
        },
      },
    },
    {
      name: 'ember-canary',
      npm: {
        devDependencies: {
          'ember-source': canaryUrl,
        },
      },
    },
  ],
};
