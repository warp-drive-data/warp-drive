/** How a widget is built. */
export interface WidgetOptions {
  /** What the widget shows. */
  label: string;
  size?: number;
}
/** A widget. */
export declare class Widget extends EventTarget {
  // tsc prints a class's private fields as one `#private` member
  // oxlint-disable-next-line no-unused-private-class-members
  #private;
  constructor(options: WidgetOptions);
  readonly label: string;
  get size(): number;
  static create(options?: Partial<WidgetOptions>): Widget;
  render(target: HTMLElement, mode?: 'replace' | 'append'): void;
}
export declare function makeWidget(options: WidgetOptions): Widget;
