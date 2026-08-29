import { version } from '../package.json';

// The `as string` here is redundant for full-program type-checking (which is
// why the lint rule flags it), but isolatedDeclarations' per-file analysis
// can't resolve the value's type from a re-exported `../package.json` import
// without it -- omitting it makes tsdown/rolldown-plugin-dts's oxc generator
// try to parse package.json itself as TS source and fail.
export default version as string;
