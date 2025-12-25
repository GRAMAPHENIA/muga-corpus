import "dotenv/config";
import express from "express";
import multer from "multer";
import cors from "cors";
import { env } from "./config/env";
import { ingestDocx } from "./ingestion/ingestDocx";
import { fetchTextById, fetchTextNodes, closeDriver } from "./persistence/neo4j";

const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

app.use(cors());
app.use(express.json());

app.post("/api/ingest/docx", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Archivo requerido" });
    }
    if (!req.file.originalname.toLowerCase().endsWith(".docx")) {
      return res.status(400).json({ error: "Solo se aceptan archivos .docx" });
    }

    const textNode = await ingestDocx(req.file);
    res.status(201).json(textNode);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al procesar el archivo" });
  }
});

app.get("/api/texts", async (_req, res) => {
  try {
    const { texts, graph } = await fetchTextNodes();
    res.json({ texts, graph });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al leer textos" });
  }
});

app.get("/api/texts/:id", async (req, res) => {
  try {
    const text = await fetchTextById(req.params.id);
    if (!text) return res.status(404).json({ error: "Texto no encontrado" });
    res.json(text);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al leer texto" });
  }
});

const server = app.listen(env.port, () => {
  console.log(`Backend corriendo en http://localhost:${env.port}`);
});

process.on("SIGINT", async () => {
  await closeDriver();
  server.close(() => process.exit(0));
});
