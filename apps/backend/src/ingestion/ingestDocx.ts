import { v4 as uuid } from "uuid";
import { docxBufferToMarkdown } from "../parsing/parseDocx";
import { saveTextNode } from "../persistence/neo4j";
import { TextNode } from "../types/text";

export async function ingestDocx(file: Express.Multer.File): Promise<TextNode> {
  const markdown = await docxBufferToMarkdown(file.buffer);
  const now = new Date().toISOString();
  const title = (file.originalname || "Texto").replace(/\.docx$/i, "");

  const node: TextNode = {
    id: uuid(),
    title,
    type: "hibrido",
    role: "voz_autoral",
    universe: "Gramaphenia",
    version: "v1",
    source: "docx",
    content_markdown: markdown,
    created_at: now
  };

  await saveTextNode(node);
  return node;
}
