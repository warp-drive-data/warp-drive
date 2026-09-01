// Must stay dependency-free: it is the first module evaluated by the CLI so it
// can fail with a friendly message on Node versions older than the features the
// bundle relies on (fs.glob with withFileTypes landed in 22.2.0).
const [major = 0, minor = 0] = process.versions.node.split('.').map(Number);

if (major < 22 || (major === 22 && minor < 2)) {
  // oxlint-disable-next-line no-console
  console.error(
    `@ember-data/codemods requires Node.js >= 22.2.0. You are running Node.js ${process.versions.node}. Please upgrade Node.js and try again.`
  );
  process.exit(1);
}

export {};
