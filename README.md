# GRAMAPHENIA MVP

MVP funcional para validar el flujo extremo a extremo:

1. Subir `.docx` por drag & drop.
2. Parsear con Mammoth.js a Markdown editorial (sin reescrituras).
3. Crear `Text` en Neo4j y relacionarlo con `(:Universe {name: "Gramaphenia"})` vía `BELONGS_TO`.
4. Mostrar el nodo en el grafo (Cytoscape) y leer el texto en modo solo lectura.

## Estructura
- `apps/backend`: API Node.js + TypeScript (Express, Mammoth, Neo4j).
- `apps/frontend`: Next.js + TypeScript + Tailwind (sin bordes redondeados, sin sombras suaves).
- `scripts/gen-sample-docx.js`: genera `sample/sample.docx` (documento de prueba) sin almacenar binarios en el repo.
- `docs/GRAMAPHENIA.md`: documentación arquitectónica.

## Requisitos previos
- Node.js 18+
- Neo4j en `bolt://localhost:7687` (puede usarse Docker: `docker run --rm -p7687:7687 -p7474:7474 -e NEO4J_AUTH=neo4j/neo4j neo4j:5`)

## Configuración
Crea un archivo `.env` en la raíz (usado por el backend):
```
NEO4J_URI=bolt://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=neo4j
PORT=4000
```

Instala dependencias (usa el proxy/registro que corresponda a tu entorno):
```
npm install
```

Genera el docx de prueba:
```
node scripts/gen-sample-docx.js
```

Frontend (opcional): define `NEXT_PUBLIC_API_BASE` si el backend no corre en el mismo origen que el frontend (por ejemplo, en desarrollo Next en `3000` y backend en `4000`):
```
NEXT_PUBLIC_API_BASE=http://localhost:4000
```

## Ejecución
En dos terminales separadas:
```
# Backend
npm run dev:backend

# Frontend
npm run dev:frontend
```

Backend: http://localhost:4000
Frontend: http://localhost:3000

## Uso del flujo
1. Genera el archivo de prueba: `node scripts/gen-sample-docx.js`.
2. Abre el frontend y arrastra `sample/sample.docx` (o cualquier `.docx`).
2. El backend valida extensión, parsea con Mammoth y persiste en Neo4j.
3. El nodo aparece en el grafo unido a `Gramaphenia` y en la lista lateral.
4. Haz click en el nodo para leer el Markdown en el panel inferior (solo lectura).

## Endpoints clave (backend)
- `POST /api/ingest/docx` — recibe `file` (.docx), devuelve `Text` creado.
- `GET /api/texts` — lista textos + datos mínimos del grafo.
- `GET /api/texts/:id` — obtiene un texto por id.

## Notas
- Sin autenticación ni filtros avanzados.
- El texto es inmutable: no se reescribe, no se resume, no se interpreta.
- Sin WYSIWYG: se renderiza Markdown plano.
