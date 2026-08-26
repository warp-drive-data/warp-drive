import { getState, info } from '@actions/core';
import { States } from './constants';

function pidIsRunning(pid) {
  try {
    process.kill(+pid, 0);
    return true;
  } catch {
    return false;
  }
}

export function stopServer() {
  const serverPID = getState(States.TURBO_LOCAL_SERVER_PID);

  info(`Found server pid: ${serverPID}`);

  if (serverPID && pidIsRunning(serverPID)) {
    info(`Killing server pid: ${serverPID}`);
    process.kill(+serverPID);
  } else {
    info(`Server with pid: ${serverPID} is not running`);
  }
}
