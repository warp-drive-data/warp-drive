export class Widget extends EventTarget {
  #options;
  constructor(options) {
    super();
    this.#options = options;
    this.label = options.label;
  }
  get size() {
    return this.#options.size ?? 1;
  }
  static create(options = {}) {
    return new Widget({ label: 'widget', ...options });
  }
  render(target, mode = 'replace') {
    if (mode === 'replace') target.textContent = '';
    target.append(this.label);
  }
}

export function makeWidget(options) {
  return new Widget(options);
}
