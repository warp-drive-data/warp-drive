import type Route from '@ember/routing/route';

import type { Resolved } from './resolved.ts';

/** Get the resolved model value from a route. */
export type ModelFrom<R extends Route> = Resolved<ReturnType<R['model']>>;
