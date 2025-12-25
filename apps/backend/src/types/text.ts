export type TextNode = {
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

export type GraphResponse = {
  nodes: Array<{ id: string; label: string; kind: "text" | "universe" }>;
  edges: Array<{ id: string; source: string; target: string; type: string }>;
};
