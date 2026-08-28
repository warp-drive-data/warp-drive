import DefaultTheme from 'vitepress/theme';
import 'virtual:group-icons.css';
import './custom.css';
import { enhanceAppWithTabs } from 'vitepress-plugin-tabs/client';
import ModuleBadge from './ModuleBadge.vue';
import SinceBadge from './SinceBadge.vue';

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    enhanceAppWithTabs(app);
    app.component('ModuleBadge', ModuleBadge);
    app.component('SinceBadge', SinceBadge);
  },
};
