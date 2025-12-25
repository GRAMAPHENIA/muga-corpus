export const env = {
  port: process.env.PORT ? Number(process.env.PORT) : 4000,
  neo4jUri: process.env.NEO4J_URI ?? "bolt://localhost:7687",
  neo4jUser: process.env.NEO4J_USERNAME ?? "neo4j",
  neo4jPassword: process.env.NEO4J_PASSWORD ?? "neo4j"
};
