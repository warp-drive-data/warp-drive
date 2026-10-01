export default class Store {
  peekRecord(type: string, id: string): unknown {
    return { type, id };
  }
}
