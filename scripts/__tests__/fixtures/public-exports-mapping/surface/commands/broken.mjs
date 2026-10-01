// A command module that names itself wrongly, for the cli.mjs loader tests.
export const name = 'not-broken';
export const describe = 'exports the wrong name';

export async function run() {
  return 0;
}
