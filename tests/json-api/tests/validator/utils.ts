export function captureLoggedReport() {
  // oxlint-disable-next-line no-console
  const originalLog = console.log;
  const seen: unknown[][] = [];

  // oxlint-disable-next-line no-console
  console.log = function (...args: unknown[]) {
    seen.push(args);
    originalLog(...args);
  };

  return {
    seen,
    restore() {
      // oxlint-disable-next-line no-console
      console.log = originalLog;
    },
  };
}
