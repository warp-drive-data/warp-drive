export function dasherize(value) {
  return value.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`);
}
export function camelize(value) {
  return value.replace(/-(.)/g, (_, char) => char.toUpperCase());
}
