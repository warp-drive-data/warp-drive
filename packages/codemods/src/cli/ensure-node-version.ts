// Must stay dependency-free: it is the first module evaluated by the CLI so it
// can fail with a friendly message on Node versions older than the one this
// package supports. Keep it in sync with `engines.node` in package.json.
const [major = 0, minor = 0] = process.versions.node.split('.').map(Number);

if (major < 24 || (major === 24 && minor < 21)) {
  // oxlint-disable-next-line no-console
  console.error(
    `@ember-data/codemods requires Node.js >= 24.21.0. You are running Node.js ${process.versions.node}. Please upgrade Node.js and try again.`
  );
  process.exit(1);
}

export {};
