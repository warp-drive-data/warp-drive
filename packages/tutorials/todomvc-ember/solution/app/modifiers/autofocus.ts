import { modifier } from 'ember-modifier';

export const autofocus = modifier(function autofocus(element: HTMLElement) {
  element.focus();
});
