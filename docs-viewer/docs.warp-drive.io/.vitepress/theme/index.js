import 'virtual:group-icons.css';
import './custom.css';

import { enhanceAppWithTabs } from 'vitepress-plugin-tabs/client';
import DefaultTheme from 'vitepress/theme';

import KindBadge from './KindBadge.vue';
import ModuleBadge from './ModuleBadge.vue';
import SinceBadge from './SinceBadge.vue';
import StatusBadge from './StatusBadge.vue';

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    enhanceAppWithTabs(app);
    app.component('ModuleBadge', ModuleBadge);
    app.component('SinceBadge', SinceBadge);
    app.component('KindBadge', KindBadge);
    app.component('StatusBadge', StatusBadge);
  },
};
