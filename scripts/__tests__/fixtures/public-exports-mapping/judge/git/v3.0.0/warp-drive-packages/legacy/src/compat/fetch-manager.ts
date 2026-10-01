export class FetchManager {
  pending = new Map<string, Promise<unknown>>();
}
