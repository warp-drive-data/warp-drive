import { getConfig } from '@warp-drive/core/build-config/macros';

const VERSION: string = getConfig<{ tests: { VERSION: string } }>().tests.VERSION;
const COMPAT_VERSION: string = getConfig<{ compatWith: string }>().compatWith;

export default VERSION;

export { COMPAT_VERSION };
