export function captureLoggedReport() {
  const originalLog = console.log;
  const seen: unknown[][] = [];

  console.log = function (...args: unknown[]) {
    seen.push(args);
    originalLog(...args);
  };

  return {
    seen,
    restore() {
      console.log = originalLog;
    },
  };
}
