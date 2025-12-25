import neo4j from "neo4j-driver";
import { env } from "../config/env";
import { TextNode, GraphResponse } from "../types/text";

const driver = neo4j.driver(env.neo4jUri, neo4j.auth.basic(env.neo4jUser, env.neo4jPassword));

const toTextNode = (props: any): TextNode => ({
  id: props.id,
  title: props.title,
  type: props.type,
  role: props.role,
  universe: props.universe,
  version: props.version,
  source: props.source,
  content_markdown: props.content_markdown,
  created_at: typeof props.created_at === "string" ? props.created_at : props.created_at.toString()
});

export async function ensureUniverse(session: neo4j.Session) {
  await session.run(`MERGE (u:Universe {name: $name}) RETURN u`, { name: "Gramaphenia" });
}

export async function saveTextNode(node: TextNode): Promise<TextNode> {
  const session = driver.session();
  try {
    await ensureUniverse(session);
    await session.run(
      `CREATE (t:Text {
        id: $id,
        title: $title,
        type: $type,
        role: $role,
        universe: $universe,
        version: $version,
        source: $source,
        content_markdown: $content_markdown,
        created_at: datetime($created_at)
      })
      WITH t
      MATCH (u:Universe {name: $universe})
      MERGE (t)-[:BELONGS_TO]->(u)
      RETURN t` ,
      node
    );
    return node;
  } finally {
    await session.close();
  }
}

export async function fetchTextNodes(): Promise<{ texts: TextNode[]; graph: GraphResponse }> {
  const session = driver.session();
  try {
    const result = await session.run(
      `MATCH (t:Text)-[:BELONGS_TO]->(u:Universe)
       RETURN t AS text, u AS universe`
    );

    const texts: TextNode[] = result.records.map(r => toTextNode(r.get("text").properties));

    const nodes: GraphResponse["nodes"] = [];
    const edges: GraphResponse["edges"] = [];
    const universeNodes = new Map<string, boolean>();

    result.records.forEach(r => {
      const text = r.get("text");
      const universe = r.get("universe");
      const textId: string = text.properties.id;
      const uniName: string = universe.properties.name;

      nodes.push({ id: textId, label: text.properties.title, kind: "text" });

      if (!universeNodes.has(uniName)) {
        universeNodes.set(uniName, true);
        nodes.push({ id: uniName, label: uniName, kind: "universe" });
      }

      edges.push({ id: `${textId}->${uniName}`, source: textId, target: uniName, type: "BELONGS_TO" });
    });

    return { texts, graph: { nodes, edges } };
  } finally {
    await session.close();
  }
}

export async function fetchTextById(id: string): Promise<TextNode | null> {
  const session = driver.session();
  try {
    const result = await session.run(
      `MATCH (t:Text {id: $id})-[:BELONGS_TO]->(:Universe)
       RETURN t AS text`,
      { id }
    );
    if (result.records.length === 0) return null;
    return toTextNode(result.records[0].get("text").properties);
  } finally {
    await session.close();
  }
}

export async function closeDriver() {
  await driver.close();
}
