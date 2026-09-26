// markdown-title ships no type declarations.
declare module 'markdown-title' {
  /** Returns the text of the first `# ` heading in a markdown string, if there is one. */
  export default function markdownTitle(markdown: string): string | undefined;
}
