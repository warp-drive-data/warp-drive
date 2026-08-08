import AlwaysUseRequestContent from './rules/always-use-request-content.js';

/**
 * `ember-template-lint` rules for applications using WarpDrive or EmberData.
 *
 * See the [ember-template-lint plugin docs](https://github.com/ember-template-lint/ember-template-lint/blob/master/docs/plugins.md)
 * for how to register this plugin in a `.template-lintrc.js` config.
 *
 * @example
 * ```js
 * // .template-lintrc.js
 * import warpDrivePlugin from 'ember-template-lint-plugin-warp-drive';
 *
 * export default {
 *   plugins: [warpDrivePlugin],
 *   rules: {
 *     'always-use-request-content': true,
 *   },
 * };
 * ```
 *
 * @public
 */
const WarpDriveTemplateLintPlugin = {
  name: 'warp-drive',
  rules: {
    'always-use-request-content': AlwaysUseRequestContent,
  },
};

export default WarpDriveTemplateLintPlugin;
