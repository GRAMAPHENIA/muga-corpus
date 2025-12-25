"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Cytoscape from "cytoscape";
import { useDropzone } from "react-dropzone";
import ReactMarkdown from "react-markdown";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:4000";

type TextNode = {
  id: string;
  title: string;
  type: string;
  role: string;
  universe: string;
  version: string;
  source: string;
  content_markdown: string;
  created_at: string;
};

type Graph = {
  nodes: Array<{ id: string; label: string; kind: "text" | "universe" }>;
  edges: Array<{ id: string; source: string; target: string; type: string }>;
};

type ApiResponse = { texts: TextNode[]; graph: Graph };

export default function Page() {
  const [texts, setTexts] = useState<TextNode[]>([]);
  const [graph, setGraph] = useState<Graph>({ nodes: [], edges: [] });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedText = useMemo(() => texts.find(t => t.id === selectedId) ?? null, [texts, selectedId]);

  const fetchTexts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/texts`);
      if (!res.ok) throw new Error(await res.text());
      const data: ApiResponse = await res.json();
      setTexts(data.texts);
      setGraph(data.graph);
      if (data.texts.length && !selectedId) {
        setSelectedId(data.texts[0].id);
      }
    } catch (e: any) {
      setError("No se pudieron cargar los textos");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [selectedId]);

  useEffect(() => {
    fetchTexts();
  }, [fetchTexts]);

  const handleSelect = useCallback((id: string) => {
    setSelectedId(id);
  }, []);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (!acceptedFiles.length) return;
      setUploading(true);
      setError(null);
      for (const file of acceptedFiles) {
        const form = new FormData();
        form.append("file", file);
        try {
          const res = await fetch(`${API_BASE}/api/ingest/docx`, {
            method: "POST",
            body: form
          });
          if (!res.ok) {
            const body = await res.json().catch(() => ({} as any));
            throw new Error(body.error || "Error al subir archivo");
          }
        } catch (e: any) {
          setError(e.message || "Error de parsing");
          console.error(e);
        }
      }
      await fetchTexts();
      setUploading(false);
    },
    [fetchTexts]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"] } });

  return (
    <main className="min-h-screen grid grid-cols-[2fr_1fr] border-t border-ink/20">
      <section className="border-r border-ink/20 min-h-screen flex flex-col">
        <header className="p-6 border-b border-ink/20">
          <h1 className="text-xl font-semibold tracking-tight">GRAMAPHENIA</h1>
          <p className="text-sm text-inkMuted">Archivo relacional de textos</p>
        </header>

        <div className="p-6 border-b border-ink/20" {...getRootProps()}>
          <input {...getInputProps()} />
          <div className={`border border-ink/40 text-sm px-4 py-6 uppercase tracking-wide ${isDragActive ? "bg-ink/5" : "bg-transparent"}`}>
            {uploading ? "Procesando…" : "Arrastrá uno o varios .docx"}
          </div>
        </div>

        <div className="flex-1 grid grid-rows-[320px_1fr]">
          <GraphView graph={graph} onSelect={handleSelect} selectedId={selectedId} />

          <div className="border-t border-ink/20 overflow-auto p-6">
            {loading && <p className="text-sm text-inkMuted">Cargando…</p>}
            {error && <p className="text-sm text-accent">{error}</p>}
            {!loading && !texts.length && !error && (
              <p className="text-sm text-inkMuted">Aún no hay textos. Subí un .docx.</p>
            )}
            {!loading && selectedText && (
              <article className="max-w-none space-y-3 leading-relaxed text-sm">
                <h2 className="text-lg font-semibold mb-2">{selectedText.title}</h2>
                <div className="text-xs text-inkMuted mb-4">
                  {selectedText.type} · {selectedText.role} · {selectedText.universe}
                </div>
                <ReactMarkdown className="whitespace-pre-wrap leading-relaxed text-sm">
                  {selectedText.content_markdown}
                </ReactMarkdown>
              </article>
            )}
          </div>
        </div>
      </section>

      <aside className="p-6">
        <h2 className="text-sm font-semibold uppercase mb-4">Textos</h2>
        <div className="space-y-3 overflow-auto max-h-[calc(100vh-80px)] pr-2">
          {texts.map(t => (
            <button
              key={t.id}
              onClick={() => setSelectedId(t.id)}
              className={`block w-full text-left border border-ink/20 px-3 py-2 text-sm ${selectedId === t.id ? "border-ink" : "border-ink/30"}`}
            >
              <div className="font-medium">{t.title}</div>
              <div className="text-xs text-inkMuted">{t.type} · {t.role}</div>
            </button>
          ))}
        </div>
      </aside>
    </main>
  );
}

type GraphViewProps = {
  graph: Graph;
  onSelect: (id: string) => void;
  selectedId: string | null;
};

function GraphView({ graph, onSelect, selectedId }: GraphViewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cyRef = useRef<Cytoscape.Core | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    cyRef.current?.destroy();

    const cy = Cytoscape({
      container: containerRef.current,
      elements: [
        ...graph.nodes.map(n => ({ data: { id: n.id, label: n.label, kind: n.kind } })),
        ...graph.edges.map(e => ({ data: { id: e.id, source: e.source, target: e.target, type: e.type } }))
      ],
      style: [
        { selector: "node[kind = 'text']", style: { "background-color": "#0a0a0a", "width": 12, "height": 12, "label": "data(label)", "font-size": 10, "color": "#0a0a0a", "text-margin-x": 8, "text-halign": "left", "text-valign": "center" } },
        { selector: "node[kind = 'universe']", style: { "background-color": "#b0172f", "width": 14, "height": 14, "shape": "rectangle", "label": "data(label)", "font-size": 10, "color": "#b0172f", "text-margin-x": 8, "text-halign": "left", "text-valign": "center" } },
        { selector: "edge", style: { "line-color": "#c2b9ad", "width": 1 } },
        { selector: "node:selected", style: { "border-width": 2, "border-color": "#b0172f" } }
      ],
      layout: { name: "breadthfirst", directed: true }
    });

    cy.on("tap", "node", evt => {
      const id = evt.target.id();
      const kind = evt.target.data("kind");
      if (kind === "text") onSelect(id);
    });

    cyRef.current = cy;
    return () => cy.destroy();
  }, [graph, onSelect]);

  useEffect(() => {
    if (!cyRef.current || !selectedId) return;
    cyRef.current.$("node").unselect();
    const n = cyRef.current.$(`#${selectedId}`);
    n.select();
    cyRef.current.center(n);
    cyRef.current.fit(n, 80);
  }, [selectedId]);

  return <div ref={containerRef} className="w-full h-full border-b border-ink/20" />;
}
