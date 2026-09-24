import { build, type Plugin, type Rolldown } from 'vite';

const ENTRY = 'api-worker/sw.ts';
const FILE_NAME = 'sw.js';

interface Res {
  setHeader(name: string, value: string): void;
  end(body: string): void;
}

/**
 * Bundles the API worker into a single classic script, served from the site
 * root. It has to live at `/sw.js`: a service worker only controls pages at or
 * below its own path, so a worker under `/assets/` could not see `/api` calls
 * made from `/`.
 */
async function bundleWorker(root: string): Promise<string> {
  const result = (await build({
    configFile: false,
    root,
    logLevel: 'warn',
    build: {
      write: false,
      minify: false,
      emptyOutDir: false,
      lib: { entry: `${root}/${ENTRY}`, formats: ['iife'], name: 'TodoMvcApi', fileName: () => FILE_NAME },
    },
  })) as Rolldown.RolldownOutput | Rolldown.RolldownOutput[];
  const [output] = Array.isArray(result) ? result : [result];
  const chunk = output?.output[0];
  if (!chunk) throw new Error('API worker build produced no output');
  return chunk.code;
}

export function apiWorker(): Plugin {
  let root = '';
  return {
    name: 'todomvc-api-worker',
    configResolved(config) {
      root = config.root;
    },
    configureServer(server) {
      server.middlewares.use(`/${FILE_NAME}`, (_req, res: Res, next: (error: unknown) => void) => {
        bundleWorker(root).then((code) => {
          res.setHeader('Content-Type', 'text/javascript');
          res.setHeader('Cache-Control', 'no-cache');
          res.end(code);
        }, next);
      });
    },
    async generateBundle() {
      this.emitFile({ type: 'asset', fileName: FILE_NAME, source: await bundleWorker(root) });
    },
  };
}
