import fs from 'fs';
import { styleText } from 'node:util';
import path from 'path';
import { exit } from 'process';

const SLOW_TEST_COUNT = 50;
const DEFAULT_TIMEOUT = 8_000;
const TIMEOUT_BUFFER = 0;
const DEFAULT_TEST_TIMEOUT = 21_000;
const failedTestsFile = path.join(process.cwd(), './diagnostic-failed-test-log.txt');

function indent(text, width = 2) {
  return text
    .split('\n')
    .map((line) => {
      return new Array(width).join('\t') + line;
    })
    .join('\n');
}

const HEADER_STR = '===================================================================';

export default class CustomDotReporter {
  // serverConfig will be injected by the server
  constructor(config) {
    this.config = config;

    // what format to print
    this.isDotFormat = config.mode === 'dot';
    this.isCompactFormat = config.mode === 'compact';
    this.isVerboseFormat = config.mode === 'verbose';

    this.out = process.stdout;

    // launcher tracking
    this.launchers = {};
    this.tabs = new Map();
    this.idsToStartNumber = new Map();

    // run infos
    this.startNumber = 1;
    this.startTime = null;
    this.realStartTime = null;
    this.timeZero = 0;
    this.dateTimeZero = Date.now() - performance.now();

    // results
    this.results = [];
    this.failedTests = [];
    this.globalFailures = [];
    this.failedTestIds = new Set();
    this.total = 0;
    this.pass = 0;
    this.skip = 0;
    this.todo = 0;
    this.fail = 0;

    // display info
    this.shouldPrintHungTests = false;

    // dot display info
    this.lineFailures = [];
    this.currentLineChars = 0;
    this.maxLineChars = 60;
    this.totalLines = 0;
  }

  clearState() {
    this.launchers = {};
    this.tabs.clear();
    this.idsToStartNumber.clear();
    this.results = [];
    this.failedTests = [];
    this.globalFailures = [];
    this.failedTestIds.clear();
    this.total = 0;
    this.pass = 0;
    this.skip = 0;
    this.todo = 0;
    this.fail = 0;
    this.shouldPrintHungTests = false;
    this.lineFailures = [];
    this.currentLineChars = 0;
    this.totalLines = 0;
  }

  write(str) {
    this.out.write(str);
  }

  // Hooks
  // ==============
  onRunStart(runInfo) {
    this.startTime = performance.now();
    this.realStartTime = runInfo.timestamp;

    const runDelta = this.startTime - this.timeZero;
    const elapsed = this.realStartTime - this.dateTimeZero;

    this.write(
      `\n\n${HEADER_STR}\n  Test Run Initiated\n\tSuite Start: ${styleText(
        'cyan',
        new Date(this.realStartTime).toLocaleString('en-US')
      )} (elapsed ${styleText('cyan', elapsed.toLocaleString('en-US'))} ms)\n\tReporter Start: ${styleText(
        'cyan',
        new Date().toLocaleString('en-US')
      )} (elapsed ${styleText('cyan', runDelta.toLocaleString('en-US'))} ms)\n${HEADER_STR}\n\n`
    );
  }

  onSuiteStart(suiteInfo) {
    this.addLauncher(suiteInfo);
  }

  onTestStart(report) {
    this.getTab(report).running.set(report.data.testId, report);
    report.testNo = this.startNumber++;
    report._testStarted = this.now();
    this.idsToStartNumber.set(`${report.browserId}:${report.windowId}:${report.data.testId}`, report.testNo);
    this.ensureTimeoutCheck();
    report.launcherDescription = `${report.launcher}:${report.browserId}:${report.windowId}`;

    report.name = `${report.launcherDescription} #${report.testNo} ${styleText(
      'magenta',
      '@ ' + (Math.round(report._testStarted / 10) / 100).toLocaleString('en-US') + 's'
    )} ${report.data.name}`;

    if (process.env.DISPLAY_TEST_NAMES) {
      this.write(`\t\t⏱️ ${styleText('magenta', ' Started')}: ${report.name}\n`);
    }
  }

  onTestFinish(report) {
    const tab = this.getTab(report);
    const startNoKey = `${report.browserId}:${report.windowId}:${report.data.testId}`;
    const startNo = this.idsToStartNumber.get(startNoKey);

    report.testNo = startNo ?? '<UNKNOWN ID NO>';
    report.data.runDuration = report.data.runDuration ?? 0;
    report.launcherDescription = `${report.launcher}:${report.browserId}:${report.windowId}`;

    if (tab.running.has(report.data.testId)) tab.running.delete(report.data.testId);

    if (this.isCompactFormat) {
      this.displayFullResult(report, false);
    } else if (this.isDotFormat) {
      if (this.results.length === 0) this.displayDotLegend();
      this.displayDotResult(report);
    } else if (this.isVerboseFormat) {
      this.displayFullResult(report, true);
    } else {
      throw new Error(`Unknown Reporter Mode ${this.config.mode}. Please use one of 'dot', 'compact', or 'verbose'`);
    }

    const { data } = report;

    this.results.push(report);
    this.total++;
    let failed = false;
    if (data.skipped) {
      this.skip++;
    } else if (data.passed && !data.todo) {
      this.pass++;
    } else if (!data.passed && data.todo) {
      this.todo++;
    } else {
      // either a normal test failed, or a todo test unexpectedly passed
      // (which is itself a failure: the todo should be promoted to a real test)
      this.fail++;
      failed = true;
    }

    if (failed) {
      this.lineFailures.push(report);
      this.failedTests.push(report);
      this.failedTestIds.add(data.testId);
    }
  }

  onGlobalFailure(report) {
    this.globalFailures.push(report);
    this.fail++;
  }

  onSuiteFinish() {}

  onRunFinish(runReport) {
    if (this.failedTests.length) {
      this.write(
        styleText(
          'red',
          `\n\n\t${this.failedTests.length} Tests Failed. Complete stack traces for failures will print at the end.`
        )
      );
    }
    if (this.globalFailures.length) {
      this.write(
        styleText(
          'red',
          `\n\n\t${this.globalFailures.length} Global Failures were detected.. Complete stack traces for failures will print at the end.`
        )
      );
    }
    this.write(`\n\n`);

    this.reportPendingTests();
    this.reportSlowTests();
    this.reportFailedTests();

    this.summarizeResults();

    // Print run duration stats
    const { startTime, realStartTime } = this;
    const endTime = performance.now();
    const endDate = new Date();
    const fullElapsed = endTime - this.timeZero;
    const runElapsed = endTime - startTime;
    const realEndTime = runReport.timestamp;
    const suiteElapsed = realEndTime - realStartTime;
    const realEndDate = new Date(realEndTime);

    this.write(
      `\n\n${HEADER_STR}\n  Test Run Complete\n\tSuite End: ${styleText(
        'cyan',
        realEndDate.toLocaleString('en-US')
      )} (elapsed ${styleText('cyan', suiteElapsed.toLocaleString('en-US'))} ms)\n\tReporter End: ${styleText(
        'cyan',
        endDate.toLocaleString('en-US')
      )} (elapsed ${styleText('cyan', runElapsed.toLocaleString('en-US'))} ms)\n\tRun Duration ${styleText(
        'cyan',
        fullElapsed.toLocaleString('en-US')
      )} ms\n${HEADER_STR}\n\n`
    );

    const exitCode = this.globalFailures.length || this.failedTests.length ? 1 : 0;
    this.clearState();

    return exitCode;
  }

  addLauncher(data) {
    this.launchers = this.launchers || {};
    this.tabs = this.tabs || new Map();

    const { launcher, browserId, windowId } = data;
    this.launchers[launcher] = this.launchers[launcher] || {};
    const browser = (this.launchers[launcher][browserId] = this.launchers[launcher][browserId] || {
      launcher,
      id: browserId,
      tabs: new Set(),
    });

    const tabId = `${browserId}:${windowId}`;
    if (browser.tabs.has(tabId)) {
      return;
    }

    browser.tabs.add(tabId);
    this.tabs.set(tabId, {
      running: new Map(),
    });
  }

  getTab(test) {
    const { windowId, browserId } = test;
    const tabId = `${browserId}:${windowId}`;

    return this.tabs.get(tabId);
  }

  now() {
    return performance.now() - this.startTime;
  }

  displayDotLegend() {
    this.write('\n\tLegend\n\t=========');
    this.write(styleText('green', '\n\tPass:\t.'));
    this.write(styleText('cyan', '\n\tTodo:\tT'));
    this.write(styleText('yellow', '\n\tSkip:\t*'));
    this.write(styleText('bold', styleText('red', '\n\tFail:\tF')));
    this.write('\n\n\t');
  }

  displayDotResult(report) {
    // complete line
    if (this.currentLineChars > this.maxLineChars) {
      if (this.shouldPrintHungTests) {
        this.shouldPrintHungTests = false;
        this.reportHungTests();
      }

      this.totalLines++;
      this.currentLineChars = 0;
      const lineFailures = this.lineFailures;
      this.lineFailures = [];

      if (lineFailures.length) {
        this.write('\n\n');
        lineFailures.forEach((failure) => {
          this.displayFullResult(failure, false);
        });
      }

      if (this.totalLines % 5 === 0) {
        this.write(`\n${styleText('magenta', (this.totalLines * this.maxLineChars).toLocaleString('en-US'))}⎡\t`);
      } else {
        this.write('\n\t');
      }
    }

    const result = report.data;
    if (result.passed && !result.todo) {
      this.write(styleText('grey', '.'));
    } else if (!result.passed && result.todo) {
      this.write(styleText('cyan', 'T'));
    } else if (result.skipped) {
      this.write(styleText('yellow', '*'));
    } else {
      this.write(styleText('bold', styleText('red', 'F')));
    }
    this.currentLineChars += 1;
  }

  displayFullResult(report, verbose) {
    const result = report.data;
    const name = `${styleText('grey', result.runDuration.toLocaleString('en-US') + 'ms')} ${styleText(
      'white',
      '#' + report.testNo
    )} ${result.name} ${styleText('grey', report.launcherDescription)}`;
    if (result.passed && !result.todo) {
      this.write(`\t✅ ${styleText('green', 'Passed')}: ${name}\n`);
    } else if (!result.passed && result.todo) {
      this.write(styleText('cyan', `\t🛠️ TODO: ${name}\n`));
    } else if (result.skipped) {
      this.write(styleText('yellow', `\t⚠️ Skipped: ${name}\n`));
    } else {
      this.write(styleText('red', `\t💥 Failed: ${name}\n`));
      this.write(`\t\topen test locally: ${this.serverConfig.url}?testId=${result.testId}\n`);

      // TODO - print individual failures in verbose mode
    }
  }

  summarizeResults() {
    const lines = [
      'Result',
      '=========',
      'Total ' + this.total,
      styleText('green', '# pass  ' + this.pass),
      styleText('yellow', '# skip  ' + this.skip),
      styleText('cyan', '# todo  ' + this.todo),
      styleText('red', '# fail  ' + this.fail),
    ];

    if (this.pass + this.skipped + this.todo === this.total) {
      lines.push('');
      lines.push('# ok');
    }
    this.write('\n\n\t');
    this.write(lines.join('\n\t'));
    this.write('\n\n');
  }

  // special reporting functionality
  // ===============================

  /**
   * Periodically checks for hung tests and reports them
   */
  ensureTimeoutCheck() {
    if (this._timeoutId) {
      return;
    }
    this._timeoutId = setTimeout(() => {
      this.shouldPrintHungTests = true;
    }, DEFAULT_TEST_TIMEOUT / 3);
  }

  reportHungTests() {
    let hasRunningTests = false;
    this.tabs.forEach((tab) => {
      const running = tab.running;

      running.forEach((report) => {
        hasRunningTests = true;
        const duration = this.now() - report._testStarted;
        if (duration > DEFAULT_TEST_TIMEOUT) {
          this.write(
            styleText(
              'grey',
              `\n\n⚠️  ${styleText('yellow', 'Pending:')} ${styleText('white', report.name)} has been running for ${styleText(
                'yellow',
                duration.toLocaleString('en-US') + 'ms'
              )}, this is likely a bug.\n`
            )
          );
        }
      });
    });

    this._timeoutId = null;
    if (hasRunningTests) {
      this.ensureTimeoutCheck();
    }
  }

  /**
   * Same as `reportHungTests` but is for use to report everything
   * that is currently running when the test suite completes.
   */
  reportPendingTests() {
    if (this._timeoutId) {
      clearTimeout(this._timeoutId);
      this._timeoutId = null;
    }

    this.tabs.forEach((tab) => {
      const running = tab.running;
      let hasFoundPending = false;

      running.forEach((report) => {
        if (!hasFoundPending) {
          this.write(styleText('red', `\n\nStill Pending Tests:\n\n`));
          hasFoundPending = true;
        }

        const duration = this.now() - report._testStarted;

        this.write(
          styleText(
            'yellow',
            `\t⛔️ Stuck (${styleText('red', duration.toLocaleString('en-US') + ' ms')}): (${
              report.data.testId
            }) ${styleText('white', report.name)} ${styleText('grey', report.launcherDescription)}\n`
          )
        );
      });
    });
  }

  reportSlowTests() {
    const results = this.results;
    let totalDuration = 0;
    let testsToPrint = SLOW_TEST_COUNT;
    results.sort((a, b) => {
      return a.runDuration > b.runDuration ? -1 : 1;
    });

    this.write(
      `\n\n\t${styleText(
        'yellow',
        `${results.length < SLOW_TEST_COUNT ? results.length : SLOW_TEST_COUNT} Longest Running Tests`
      )}\n${HEADER_STR}\n`
    );
    for (let i = 0; i < results.length; i++) {
      const { name, runDuration } = results[i].data;

      if (i < testsToPrint) {
        // this test is a known offender
        if (runDuration > DEFAULT_TIMEOUT + TIMEOUT_BUFFER) {
          this.write(`\n\t${i + 1}.\t[S] ${styleText('yellow', runDuration.toLocaleString('en-US') + 'ms')}\t${name}`);
          testsToPrint++;
        } else {
          this.write(`\n\t${i + 1}.\t${styleText('yellow', runDuration.toLocaleString('en-US') + 'ms')}\t${name}`);
        }
      }
      totalDuration += runDuration;
    }
    this.write(
      styleText(
        'yellow',
        `\n\n\tAvg Duration of all ${results.length} tests: ${Math.round(totalDuration / results.length)}ms\n\n`
      )
    );
  }

  reportFailedTests() {
    if (this.failedTests.length) {
      this.write(
        styleText('red', `\n\n\tPrinting ${this.failedTests.length} Failed Tests\n\n\t====================\n\n`)
      );
    }
    this.failedTests.forEach((failure) => {
      const result = failure.data;
      this.write(styleText('red', `\n\t💥 Failed: ${result.runDuration.toLocaleString('en-US')}ms ${result.name}\n`));

      result.items.forEach((diagnostic) => {
        this.write(
          `\t\t${diagnostic.passed ? styleText('green', '✅ Pass') : styleText('red', '💥 Fail')} ${diagnostic.message}\n`
        );

        if (!diagnostic.passed && 'expected' in diagnostic && 'actual' in diagnostic) {
          this.write(
            `\n\t\texpected: ${printValue(diagnostic.expected, 3)}\n\t\tactual: ${printValue(diagnostic.actual, 3)}\n`
          );
        }

        if (!diagnostic.passed && diagnostic.stack) {
          this.write(`\n${indent(diagnostic.stack)}\n`);
        }
      });

      this.write('\n\n');
    });

    if (this.globalFailures.length) {
      this.write(styleText('red', `\n\n${this.globalFailures.length} Global Failures\n\n`));
    }

    this.globalFailures.forEach((failure) => {
      const result = failure.error;
      const label =
        result.name && result.message
          ? `[${result.name}] ${result.message}`
          : result.name || result.message || 'Unknown Error';
      this.write(styleText('red', `\n\t💥 Failed: ${label}\n`));

      if (result.stack) {
        this.write(`\n${indent(result.stack)}\n`);
      }

      this.write('\n\n');
    });
  }

  updateFailedTestCache() {
    const failedTestIds = [...this.failedTestIds.entries()];
    const allFailuresAccounted = this.globalFailures.length === 0;
    const cacheFile = failedTestsFile;

    if (allFailuresAccounted) {
      if (failedTestIds.length) {
        fs.writeFileSync(cacheFile, failedTestIds.join(','), { encoding: 'utf-8' });

        this.write(
          styleText(
            'yellow',
            `\n\nSaved ${styleText('white', String(failedTestIds.length))} Failed Tests for Retry with IDS ${styleText(
              'white',
              failedTestIds.join(',')
            )} in ${styleText('grey', cacheFile)}`
          )
        );

        this.write(
          `\n\nTo run failed tests locally, ${styleText('cyan', 'visit')} ${styleText(
            'white',
            `${this.serverConfig.url}?${failedTestIds.map((id) => `testId=${id}`).join('&')}`
          )}`
        );
      } else {
        remove(cacheFile);
      }
    } else {
      if (failedTestIds.length) {
        this.write(
          `\n\nTo run failed tests locally, ${styleText('cyan', 'visit')} ${styleText(
            'white',
            `${this.serverConfig.url}?${failedTestIds.map((id) => `testId=${id}`).join('&')}`
          )}`
        );
      }
      this.write(
        styleText('red', `\n\n⚠️ Unable to save failed tests for retry, not all failures had test IDs, cleaning up`)
      );
      remove(cacheFile);
    }
  }
}

// Instead of completely removing, we replace the contents with an empty string so that CI will still cache it.
// While this shouldn't ever really be necessary it's a bit more correct to make sure that the log gets cleared
// in the cache as well.
function remove(filePath) {
  fs.writeFileSync(filePath, '', { encoding: 'utf-8' });
}

function printValue(value, tabs = 0) {
  if (typeof value === 'string') {
    return value;
  } else if (typeof value === 'number') {
    return value;
  } else if (typeof value === 'boolean') {
    return String(value);
  } else if (value === null) {
    return 'null';
  } else if (value === undefined) {
    return 'undefined';
  } else if (Array.isArray(value)) {
    return indent(`[\n ${value.map((v) => printValue(v, tabs + 1)).join(',\n ')}\n]`, tabs);
  } else if (typeof value === 'object') {
    return JSON.stringify(value, null, tabs * 4);
  }
}
