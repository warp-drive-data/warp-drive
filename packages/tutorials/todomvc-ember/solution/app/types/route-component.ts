import type { TOC } from '@ember/component/template-only';
import type Route from '@ember/routing/route';

import type { ModelFrom } from './model-from.ts';

export type RouteComponent<R extends Route> = TOC<RouteSignature<R>>;

export interface RouteSignature<R extends Route> {
  Args: {
    model: ModelFrom<R>;
  };
}
