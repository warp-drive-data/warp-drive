import { setFailed } from '@actions/core';
import { printServerLogs } from './utils/printServerLogs';
import { stopServer } from './utils/stopServer';
import { uploadArtifacts } from './utils/uploadArtifacts';

async function post() {
  stopServer();

  try {
    await uploadArtifacts();
  } finally {
    printServerLogs();
  }
}

post().catch((error) => {
  setFailed(error);
});
