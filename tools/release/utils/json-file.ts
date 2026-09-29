import { access, readFile, writeFile } from 'node:fs/promises';
import { styleText } from 'node:util';

const EOL = '\n';
export class JSONFile<T extends object = Record<string, unknown>> {
  declare contents: T | null;
  declare filePath: string;
  /** the file path, once it has been confirmed to exist */
  declare handle: string;

  #lastKnown: string | null = null;

  constructor(filePath: string) {
    this.contents = null;
    this.filePath = filePath;
  }

  async #getHandle() {
    if (!this.handle) {
      const fileHandle = this.filePath;
      const exists = await access(fileHandle).then(
        () => true,
        () => false
      );

      if (!exists) {
        throw new Error(`The file ${styleText('white', this.filePath)} does not exist!`);
      }

      this.handle = fileHandle;
    }

    return this.handle;
  }

  async invalidate() {
    this.contents = null;
  }

  async read(logRaw: boolean = false): Promise<T> {
    if (this.contents === null) {
      const fileHandle = await this.#getHandle();
      const strData = await readFile(fileHandle, 'utf8');
      let data: T;
      try {
        data = JSON.parse(strData) as T;
      } catch (e) {
        console.log(e);
        console.log(strData);
        throw e;
      }
      this.contents = data;
      this.#lastKnown = JSON.stringify(data, null, 2);
    }

    return this.contents as T;
  }

  async write(allowNoop?: boolean): Promise<void> {
    if (this.contents === null) {
      throw new Error(`Cannot write before updating contents`);
    }
    const strData = JSON.stringify(this.contents, null, 2) + EOL;
    if (this.#lastKnown === strData) {
      if (allowNoop) {
        return;
      }
      console.log(strData);
      throw new Error(`Should not write when not updating contents`);
    }
    this.#lastKnown = strData;
    const fileHandle = await this.#getHandle();
    await writeFile(fileHandle, strData);
  }
}

const FILES: Map<string, JSONFile> = new Map();

export function getFile<T extends object = object>(filePath: string): JSONFile<T> {
  let file: JSONFile<T> | undefined = FILES.get(filePath) as JSONFile<T>;
  if (!file) {
    file = new JSONFile<T>(filePath);
  }
  return file;
}
