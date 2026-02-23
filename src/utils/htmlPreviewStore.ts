// Simple in-memory store for HTML preview content.
// Windows reference previews by ID via the appId `preview:{id}`.

const store = new Map<string, { html: string; title: string }>();

let counter = 0;

export function storeHtmlPreview(html: string, title: string): string {
  const id = `html-${++counter}-${Date.now()}`;
  store.set(id, { html, title });
  return id;
}

export function getHtmlPreview(id: string): { html: string; title: string } | undefined {
  return store.get(id);
}

export function removeHtmlPreview(id: string): void {
  store.delete(id);
}
