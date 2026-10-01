declare module '@fixture/kit/ambient' {
  export * from '@fixture/kit/ambient/inner';
  export type Pong = 'pong';
}
declare module '@fixture/kit/ambient/inner' {
  export function ping(): void;
}
