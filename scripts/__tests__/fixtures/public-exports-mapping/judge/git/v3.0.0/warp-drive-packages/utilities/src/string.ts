export function dasherize(text: string): string {
  return text.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

export function normalizeModelName(name: string): string {
  return dasherize(name);
}
