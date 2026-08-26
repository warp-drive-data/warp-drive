import getChannelURL from 'ember-source-channel-url';

const [releaseUrl, betaUrl, canaryUrl] = await Promise.all([
  getChannelURL('release'),
  getChannelURL('beta'),
  getChannelURL('canary'),
]);

export default {
  scenarios: [
    // this app builds through @embroider/vite's native (non-compat) pipeline,
    // which resolves ember-source's own classic module names (`ember-testing`,
    // `@ember/*`, etc.) via the v2-addon `exports`/`renamed-modules` metadata
    // that ember-source itself only started shipping around 6.x. Versions
    // below that have no such metadata, so nothing under `@ember/*` resolves
    // at all -- there is no lts scenario below 6.12 to test here.
    {
      name: 'ember-lts-6.12',
      npm: {
        devDependencies: {
          'ember-source': '~6.12.0',
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
