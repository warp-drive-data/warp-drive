// oxfmt-ignore
import '@warp-drive/ember/install';

import { configure } from '@warp-drive/diagnostic/ember';
import { start } from '@warp-drive/diagnostic/runners/dom';

import.meta.glob('./tests/**/*-test.{js,ts,gjs,gts}', { eager: true });

configure();

void start({
  useDiagnostic: true,
});
