import os from 'os';
import path from 'path';

export const DEFAULT_PORT = 9080

export const cacheDir = path.join(
  process.env.RUNNER_TEMP || os.tmpdir(),
  'turbo-cache'
);

export const newArtifactsDirName = 'new-artifacts'

export const States = {
  TURBO_LOCAL_SERVER_PID: 'TURBO_LOCAL_SERVER_PID',
} as const;

export type States = typeof States[keyof typeof States];

export const Inputs = {
  SERVER_TOKEN: 'server-token',
  REPO_TOKEN: 'repo-token',
} as const

export type Inputs = typeof Inputs[keyof typeof Inputs]
