'use strict';

module.exports = {
  test_page: 'tests/index.html?hidepassed',
  cwd: 'dist-test',
  disable_watching: true,
  launch_in_ci: ['Chrome'],
  launch_in_dev: ['Chrome'],
  browser_start_timeout: 120,
  browser_args: {
    Chrome: {
      ci: [
        '--headless',
        // Managed Chrome can force-install extensions into the test profile, and
        // one may open a sign-in tab that hides the test page. <Request> doesn't
        // refetch on a hidden page, so the tests time out.
        '--disable-extensions',
        '--disable-dev-shm-usage',
        '--disable-software-rasterizer',
        '--mute-audio',
        '--remote-debugging-port=0',
        '--window-size=1440,900',
        '--no-sandbox',
      ],
    },
  },
};
