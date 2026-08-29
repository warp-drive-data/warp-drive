export function captureLoggedReport() {
  // eslint-disable-next-line no-console
  const originalLog = console.log;
  const seen: unknown[][] = [];

  // eslint-disable-next-line no-console
  console.log = function (...args: unknown[]) {
    seen.push(args);
    originalLog(...args);
  };

  return {
    seen,
    restore() {
      // eslint-disable-next-line no-console
      console.log = originalLog;
    },
  };
}
