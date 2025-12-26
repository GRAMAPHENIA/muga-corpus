export function generateSlug(titulo: string): string {
  return titulo.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function unique<T>(corpus: T[], key: keyof T): string[] {
  return [...new Set(corpus.map(i => i[key]).filter(Boolean))] as string[];
}