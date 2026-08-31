import type { HelperContext } from './-helper-context.ts';
import { isDocument, isElement } from './-target.ts';
import { withHooks } from './helper-hooks.ts';

const MOUSE_EVENT_CONSTRUCTOR = (() => {
  try {
    new MouseEvent('test');
    return true;
  } catch {
    return false;
  }
})();
const DEFAULT_EVENT_OPTIONS = { bubbles: true, cancelable: true };

export const KEYBOARD_EVENT_TYPES = ['keydown', 'keypress', 'keyup'] as const;
export type KeyboardEventType = (typeof KEYBOARD_EVENT_TYPES)[number];

export function isKeyboardEventType(eventType: unknown): eventType is KeyboardEventType {
  return KEYBOARD_EVENT_TYPES.includes(eventType as KeyboardEventType);
}

const MOUSE_EVENT_TYPES = [
  'click',
  'mousedown',
  'mouseup',
  'dblclick',
  'mouseenter',
  'mouseleave',
  'mousemove',
  'mouseout',
  'mouseover',
] as const;
export type MouseEventType = (typeof MOUSE_EVENT_TYPES)[number];

export function isMouseEventType(eventType: unknown): eventType is MouseEventType {
  return MOUSE_EVENT_TYPES.includes(eventType as MouseEventType);
}

const FILE_SELECTION_EVENT_TYPES = ['change'] as const;
export type FileSelectionEventType = (typeof FILE_SELECTION_EVENT_TYPES)[number];

export function isFileSelectionEventType(eventType: unknown): eventType is FileSelectionEventType {
  return FILE_SELECTION_EVENT_TYPES.includes(eventType as FileSelectionEventType);
}

export function isFileSelectionInput(element: unknown): element is HTMLInputElement {
  return !!(element as HTMLInputElement).files;
}

export function fireEvent(
  scope: HelperContext,
  element: Element | Document | Window,
  eventType: KeyboardEventType,
  // oxlint-disable-next-line typescript/no-explicit-any
  options?: any
): Promise<Event>;
export function fireEvent(
  scope: HelperContext,
  element: Element | Document | Window,
  eventType: MouseEventType,
  // oxlint-disable-next-line typescript/no-explicit-any
  options?: any
): Promise<Event | void>;

export function fireEvent(
  scope: HelperContext,
  element: Element | Document | Window,
  eventType: string,
  // oxlint-disable-next-line typescript/no-explicit-any
  options?: any
): Promise<Event>;
/**
  Internal helper used to build and dispatch events throughout the other DOM helpers.

  @private
  @param {Element} element the element to dispatch the event to
  @param {string} eventType the type of event
  @param {Object} [options] additional properties to be set on the event
  @returns {Event} the event that was dispatched
*/
export function fireEvent(
  scope: HelperContext,
  element: Element | Document | Window,
  eventType: string,
  options = {}
): Promise<Event | void> {
  return withHooks({
    scope,
    name: `fireEvent:${eventType}`,
    render: false,
    args: [element],
    cb: () => {
      if (!element) {
        throw new Error('Must pass an element to `fireEvent`');
      }

      let event;
      if (isKeyboardEventType(eventType)) {
        event = _buildKeyboardEvent(eventType, options);
      } else if (isMouseEventType(eventType)) {
        let rect;
        if (element instanceof Window && element.document.documentElement) {
          rect = element.document.documentElement.getBoundingClientRect();
        } else if (isDocument(element)) {
          rect = element.documentElement.getBoundingClientRect();
        } else if (isElement(element)) {
          rect = element.getBoundingClientRect();
        } else {
          return;
        }

        const x = rect.left + 1;
        const y = rect.top + 1;
        const simulatedCoordinates = {
          screenX: x + 5, // Those numbers don't really mean anything.
          screenY: y + 95, // They're just to make the screenX/Y be different of clientX/Y..
          clientX: x,
          clientY: y,
          ...options,
        };

        event = buildMouseEvent(eventType, simulatedCoordinates);
      } else if (isFileSelectionEventType(eventType) && isFileSelectionInput(element)) {
        event = buildFileEvent(eventType, element, options);
      } else {
        event = buildBasicEvent(eventType, options);
      }

      element.dispatchEvent(event);
      return event;
    },
  });
}

// oxlint-disable-next-line typescript/no-explicit-any
function buildBasicEvent(type: string, options: any = {}): Event {
  const event = document.createEvent('Events');

  // oxlint-disable-next-line typescript/no-unsafe-assignment, typescript/no-unsafe-member-access
  const bubbles = options.bubbles !== undefined ? options.bubbles : true;
  // oxlint-disable-next-line typescript/no-unsafe-assignment, typescript/no-unsafe-member-access
  const cancelable = options.cancelable !== undefined ? options.cancelable : true;

  // oxlint-disable-next-line typescript/no-unsafe-member-access
  delete options.bubbles;
  // oxlint-disable-next-line typescript/no-unsafe-member-access
  delete options.cancelable;

  // bubbles and cancelable are readonly, so they can be
  // set when initializing event
  // oxlint-disable-next-line typescript/no-unsafe-argument
  event.initEvent(type, bubbles, cancelable);
  for (const prop in options) {
    /* oxlint-disable typescript/no-unsafe-assignment, typescript/no-unsafe-member-access */
    /* oxlint-disable typescript/no-explicit-any */
    (event as any)[prop] = options[prop];
    /* oxlint-enable typescript/no-explicit-any */
    /* eslint-enable typescript/no-unsafe-assignment, typescript/no-unsafe-member-access */
  }
  return event;
}

// oxlint-disable-next-line typescript/no-explicit-any
function buildMouseEvent(type: MouseEventType, options: any = {}) {
  let event;
  /* oxlint-disable typescript/no-unsafe-assignment */
  /* oxlint-disable typescript/no-explicit-any */
  const eventOpts: any = { view: window, ...DEFAULT_EVENT_OPTIONS, ...options };
  /* oxlint-enable typescript/no-explicit-any */
  /* eslint-enable typescript/no-unsafe-assignment */
  if (MOUSE_EVENT_CONSTRUCTOR) {
    // oxlint-disable-next-line typescript/no-unsafe-argument
    event = new MouseEvent(type, eventOpts);
  } else {
    try {
      event = document.createEvent('MouseEvents');
      event.initMouseEvent(
        type,
        // oxlint-disable-next-line typescript/no-unsafe-argument, typescript/no-unsafe-member-access
        eventOpts.bubbles,
        // oxlint-disable-next-line typescript/no-unsafe-argument, typescript/no-unsafe-member-access
        eventOpts.cancelable,
        window,
        // oxlint-disable-next-line typescript/no-unsafe-argument, typescript/no-unsafe-member-access
        eventOpts.detail,
        // oxlint-disable-next-line typescript/no-unsafe-argument, typescript/no-unsafe-member-access
        eventOpts.screenX,
        // oxlint-disable-next-line typescript/no-unsafe-argument, typescript/no-unsafe-member-access
        eventOpts.screenY,
        // oxlint-disable-next-line typescript/no-unsafe-argument, typescript/no-unsafe-member-access
        eventOpts.clientX,
        // oxlint-disable-next-line typescript/no-unsafe-argument, typescript/no-unsafe-member-access
        eventOpts.clientY,
        // oxlint-disable-next-line typescript/no-unsafe-argument, typescript/no-unsafe-member-access
        eventOpts.ctrlKey,
        // oxlint-disable-next-line typescript/no-unsafe-argument, typescript/no-unsafe-member-access
        eventOpts.altKey,
        // oxlint-disable-next-line typescript/no-unsafe-argument, typescript/no-unsafe-member-access
        eventOpts.shiftKey,
        // oxlint-disable-next-line typescript/no-unsafe-argument, typescript/no-unsafe-member-access
        eventOpts.metaKey,
        // oxlint-disable-next-line typescript/no-unsafe-argument, typescript/no-unsafe-member-access
        eventOpts.button,
        // oxlint-disable-next-line typescript/no-unsafe-argument, typescript/no-unsafe-member-access
        eventOpts.relatedTarget
      );
    } catch {
      event = buildBasicEvent(type, options);
    }
  }

  return event;
}

// oxlint-disable-next-line typescript/no-explicit-any
export function _buildKeyboardEvent(type: KeyboardEventType, options: any = {}): Event {
  /* oxlint-disable typescript/no-unsafe-assignment */
  /* oxlint-disable typescript/no-explicit-any */
  const eventOpts: any = { ...DEFAULT_EVENT_OPTIONS, ...options };
  /* oxlint-enable typescript/no-explicit-any */
  /* eslint-enable typescript/no-unsafe-assignment */
  let event: Event | undefined;
  let eventMethodName: 'initKeyboardEvent' | 'initKeyEvent' | undefined;

  try {
    // oxlint-disable-next-line typescript/no-unsafe-argument
    event = new KeyboardEvent(type, eventOpts);

    // Property definitions are required for B/C for keyboard event usage
    // If this properties are not defined, when listening for key events
    // keyCode/which will be 0. Also, keyCode and which now are string
    // and if app compare it with === with integer key definitions,
    // there will be a fail.
    //
    // https://w3c.github.io/uievents/#interface-keyboardevent
    // https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent
    Object.defineProperty(event, 'keyCode', {
      get() {
        // oxlint-disable-next-line typescript/no-unsafe-argument, typescript/no-unsafe-member-access
        return parseInt(eventOpts.keyCode);
      },
    });

    Object.defineProperty(event, 'which', {
      get() {
        // oxlint-disable-next-line typescript/no-unsafe-argument, typescript/no-unsafe-member-access
        return parseInt(eventOpts.which);
      },
    });

    return event;
  } catch {
    // left intentionally blank
  }

  try {
    event = document.createEvent('KeyboardEvents');
    eventMethodName = 'initKeyboardEvent';
  } catch {
    // left intentionally blank
  }

  if (!event) {
    try {
      event = document.createEvent('KeyEvents');
      eventMethodName = 'initKeyEvent';
    } catch {
      // left intentionally blank
    }
  }

  if (event && eventMethodName) {
    /* oxlint-disable typescript/no-unsafe-call, typescript/no-unsafe-member-access */
    /* oxlint-disable typescript/no-explicit-any */
    (event as any)[eventMethodName](
      /* oxlint-enable typescript/no-explicit-any */
      /* eslint-enable typescript/no-unsafe-call, typescript/no-unsafe-member-access */
      type,
      // oxlint-disable-next-line typescript/no-unsafe-member-access
      eventOpts.bubbles,
      // oxlint-disable-next-line typescript/no-unsafe-member-access
      eventOpts.cancelable,
      window,
      // oxlint-disable-next-line typescript/no-unsafe-member-access
      eventOpts.ctrlKey,
      // oxlint-disable-next-line typescript/no-unsafe-member-access
      eventOpts.altKey,
      // oxlint-disable-next-line typescript/no-unsafe-member-access
      eventOpts.shiftKey,
      // oxlint-disable-next-line typescript/no-unsafe-member-access
      eventOpts.metaKey,
      // oxlint-disable-next-line typescript/no-unsafe-member-access
      eventOpts.keyCode,
      // oxlint-disable-next-line typescript/no-unsafe-member-access
      eventOpts.charCode
    );
  } else {
    event = buildBasicEvent(type, options);
  }

  return event;
}

// oxlint-disable-next-line typescript/no-explicit-any
function buildFileEvent(type: FileSelectionEventType, element: HTMLInputElement, options: any = {}): Event {
  const event = buildBasicEvent(type);
  // oxlint-disable-next-line typescript/no-unsafe-assignment, typescript/no-unsafe-member-access
  const files = options.files;

  if (Array.isArray(options)) {
    throw new Error(
      'Please pass an object with a files array to `triggerEvent` instead of passing the `options` param as an array to.'
    );
  }

  if (Array.isArray(files)) {
    Object.defineProperty(files, 'item', {
      value(index: number) {
        // oxlint-disable-next-line typescript/no-unsafe-return, typescript/no-unsafe-member-access
        return typeof index === 'number' ? this[index] : null;
      },
      configurable: true,
    });
    Object.defineProperty(element, 'files', {
      value: files,
      configurable: true,
    });

    // oxlint-disable-next-line typescript/no-unsafe-assignment
    const elementProto = Object.getPrototypeOf(element);
    const valueProp = Object.getOwnPropertyDescriptor(elementProto, 'value');
    Object.defineProperty(element, 'value', {
      configurable: true,
      get() {
        // oxlint-disable-next-line typescript/no-unsafe-return
        return valueProp!.get!.call(element);
      },
      set(value) {
        valueProp!.set!.call(element, value);

        // We are sure that the value is empty here.
        // For a non-empty value the original setter must raise an exception.
        Object.defineProperty(element, 'files', {
          configurable: true,
          value: [],
        });
      },
    });
  }

  Object.defineProperty(event, 'target', {
    value: element,
  });

  return event;
}
