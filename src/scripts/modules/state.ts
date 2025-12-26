export interface TextItem {
  id: string;
  titulo: string;
  tipo: string;
  rol: string;
  universo?: string | null;
  dependeDe?: string | null;
  slug: string;
  parrafos?: string[] | null;
}

interface StateFromURL {
  slug: string | null;
  tipo: string;
  rol: string;
  universo: string;
  focus: boolean;
  graph: boolean;
}

export let corpus: TextItem[] = [];
export let activeItemId: string | null = null;
export let focusMode: boolean = false;
export let graphView: boolean = false;

export function setCorpus(value: TextItem[]) {
  corpus = value;
}

export function setActiveItemId(value: string | null) {
  activeItemId = value;
}

export function setFocusMode(value: boolean) {
  focusMode = value;
}

export function setGraphView(value: boolean) {
  graphView = value;
}

export function readStateFromURL(): StateFromURL {
  const p = new URLSearchParams(location.search);
  const pathParts = location.pathname.split('/').filter(Boolean);
  const slug = pathParts[pathParts.length - 1];
  return {
    slug: slug || null,
    tipo: p.get("tipo") || "",
    rol: p.get("rol") || "",
    universo: p.get("universo") || "",
    focus: p.get("focus") === "1",
    graph: p.get("graph") === "1"
  };
}

export function writeStateToURL() {
  const p = new URLSearchParams();
  const tipo = (document.getElementById("filter-tipo") as HTMLElement).getAttribute('data-value') || '';
  const rol = (document.getElementById("filter-rol") as HTMLElement).getAttribute('data-value') || '';
  const universo = (document.getElementById("filter-universo") as HTMLElement).getAttribute('data-value') || '';
  if (tipo) p.set("tipo", tipo);
  if (rol) p.set("rol", rol);
  if (universo) p.set("universo", universo);
  if (focusMode) p.set("focus", "1");
  if (graphView) p.set("graph", "1");
  const slug = activeItemId ? corpus.find(i => i.id === activeItemId)?.slug : '';
  const path = slug ? `/${slug}` : '/';
  const query = p.toString();
  const url = query ? `${path}?${query}` : path;
  history.replaceState(null, "", url);
}

export function applyFilters(): TextItem[] {
  const tipo = (document.getElementById("filter-tipo") as HTMLElement).getAttribute('data-value') || '';
  const rol = (document.getElementById("filter-rol") as HTMLElement).getAttribute('data-value') || '';
  const universo = (document.getElementById("filter-universo") as HTMLElement).getAttribute('data-value') || '';
  return corpus.filter(i =>
    (!tipo || i.tipo === tipo) &&
    (!rol || i.rol === rol) &&
    (!universo || i.universo === universo)
  );
}

export function groupByTipo(data: TextItem[]): Record<string, TextItem[]> {
  return data.reduce((a, i) => {
    (a[i.tipo] ||= []).push(i);
    return a;
  }, {} as Record<string, TextItem[]>);
}

export function clearStates() {
  document.querySelectorAll(".item").forEach(el =>
    el.classList.remove("active", "parent", "child", "hidden")
  );
}