import type { Context } from 'hono';
import type { WSContext, WSEvents } from 'hono/ws';
import { styleText } from 'node:util';

import type { LaunchState } from '../../index.ts';
import type { LaunchConfig } from '../default-setup.ts';
import type { ReportMessage } from '../reporters/default.ts';
import { debug, info } from '../utils/debug.ts';
import { sinceStart } from '../utils/time.ts';
import { watchAssets } from './watch.ts';

export function buildHandler(config: LaunchConfig, state: LaunchState): (c: Context) => WSEvents {
  const Connections = new Set<WSContext>();
  if (config.serve && !config.noWatch) {
    watchAssets(state, config.assets, () => {
      Connections.forEach((ws) => {
        ws.send(JSON.stringify({ name: 'reload' }));
      });
    });
  }

  return (_c: Context) => {
    return {
      onOpen(_evt, ws) {
        Connections.add(ws);
        debug(`WebSocket opened`);
      },

      async onMessage(evt, ws) {
        state.lastMessageAt = Date.now();
        // tsgolint (oxlint's type-aware checker) fails to resolve hono/ws's
        // generic `MessageEvent<WSMessageReceive>` here and falls back to an
        // error type, even though this type-checks cleanly under real tsc.
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const msg = JSON.parse(evt.data as string) as ReportMessage;
        msg.launcher = state.browsers.get(msg.browserId)?.launcher ?? '<unknown>';

        info(
          `${styleText('green', '➡')} [${styleText('cyan', String(msg.browserId))}/${styleText('cyan', String(msg.windowId))}] ${styleText('green', msg.name)}`
        );

        switch (msg.name) {
          case 'suite-start':
            if (!state.started) {
              state.started = true;
              config.reporter.onRunStart(msg);
            }
            config.reporter.onSuiteStart(msg);
            break;
          case 'test-start':
            config.reporter.onTestStart(msg);
            break;
          case 'test-finish':
            config.reporter.onTestFinish(msg);
            break;
          case 'suite-finish':
            config.reporter.onSuiteFinish();

            if (!config.serve) {
              ws.send(JSON.stringify({ name: 'close' }));
              ws.close();
            }
            state.completed++;
            debug(
              `${styleText('green', '✅ [Complete]')} ${styleText('cyan', String(msg.browserId))}/${styleText('cyan', String(msg.windowId))} ${styleText(
                'yellow',
                '@' + sinceStart()
              )}`
            );
            if (state.completed === state.expected) {
              const exitCode = config.reporter.onRunFinish(msg);
              debug(`${styleText('green', '✅ [All Complete]')} ${styleText('yellow', '@' + sinceStart())}`);

              if (!config.serve) {
                await state.safeCleanup();
                debug(`\n\nExiting with code ${exitCode}`);
                // 1. We expect all cleanup to have happened after
                //    config.cleanup(), so exiting here should be safe.
                // 2. We also want to forcibly exit with a success code in this
                //    case.
                // eslint-disable-next-line n/no-process-exit
                process.exit(exitCode);
              } else {
                state.completed = 0;
              }
            } else {
              console.log(`Waiting for ${state.expected - state.completed} more browsers to finish`);
            }

            break;
        }
      },

      onClose(_evt, ws) {
        Connections.delete(ws);
        debug(`WebSocket closed`);
      },

      onError(evt) {
        debug(`WebSocket error: ${String(evt)}`);
      },
    };
  };
}
