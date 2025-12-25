# GRAMAPHENIA — Arquitectura y Diseño del Sistema

## Principios Rectores
- **Texto sagrado:** no se reescribe, resume ni interpreta. La app solo ingiere, estructura y relaciona.
- **Grafo como pensamiento:** el grafo es la vista primaria para navegar; las listas son auxiliares.
- **Separación de capas estricta:** ingestión (I/O), parsing (transformación), almacenamiento (Neo4j), visualización (Next.js + Cytoscape/Sigma) desacopladas mediante colas/eventos.
- **Identidad editorial:** estética sobria, áspera, sin bordes redondeados ni sombras suaves; tipografía con carácter, alto contraste y uso deliberado del espacio en blanco.

## Arquitectura General
```
┌──────────────────────────────────────────────────────────────────┐
│                            Frontend (Next.js + TS)               │
│                                                                  │
│  • App Shell (layout editorial)                                  │
│  • Drag & Drop DOCX (zona de carga)                              │
│  • Panel de Texto (markdown render fijo, sin edición)            │
│  • Grafo (Cytoscape.js/Sigma.js)                                 │
│  • Panel de Relaciones (inspectar/crear)                         │
│  • Estado y colas via React Query/SWR                            │
└──────────────────────────────────────────────────────────────────┘
                  ⇅ HTTPS (REST/GraphQL) + WebSockets/SSE
┌──────────────────────────────────────────────────────────────────┐
│                  Backend (Node.js + TS / Express)               │
│                                                                  │
│  • API de ingestión (upload DOCX)                                │
│  • Servicio de parsing (Mammoth.js → Markdown plano)             │
│  • Servicio de GraphOps (crear nodos, relaciones, consultas)     │
│  • Jobs asíncronos (BullMQ/RabbitMQ) para procesar cargas masivas│
│  • Webhook/Events -> notificar frontend de nodos/edges nuevos    │
└──────────────────────────────────────────────────────────────────┘
                          ⇅ Bolt/HTTPS
┌──────────────────────────────────────────────────────────────────┐
│                          Neo4j (DB grafo)                        │
│  • Nodos: TextNode                                              │
│  • Relaciones: PERTENECE_A, DIALOGA_CON, DERIVA_DE, VERSION_DE   │
│  • Constraints e índices por id, título, universo, estado        │
└──────────────────────────────────────────────────────────────────┘
```

## Estructura de Carpetas Propuesta
```
repo/
├─ apps/
│  ├─ frontend/ (Next.js 14 + TS + Tailwind)
│  │  ├─ app/ (rutas, layouts, server components)
│  │  ├─ components/ (sin bordes redondeados)
│  │  ├─ lib/ (hooks, clientes API)
│  │  ├─ styles/ (tokens, tailwind.config)
│  │  └─ public/ (assets tipográficos, íconos)
│  └─ backend/ (Express/Fastify + TS)
│     ├─ src/
│     │  ├─ api/ (rutas REST/GraphQL)
│     │  ├─ ingestion/ (upload + validación)
│     │  ├─ parsing/ (adaptadores Mammoth.js → Markdown)
│     │  ├─ graph/ (servicios Neo4j, cypher)
│     │  ├─ jobs/ (BullMQ/RabbitMQ workers)
│     │  ├─ events/ (SSE/WebSocket emitters)
│     │  └─ config/ (env, logging, tracing)
├─ packages/
│  ├─ domain/ (tipos compartidos: TextNode, relaciones, DTOs)
│  ├─ ui/ (componentes estilísticos reutilizables)
│  └─ utils/ (markdown, validaciones, formateos)
├─ infra/
│  ├─ docker/ (compose: frontend, backend, neo4j, redis)
│  └─ k8s/ (charts/manifests opcionales)
├─ docs/ (arquitectura, flujos, ADRs)
└─ scripts/ (bootstrap, seeds, linters)
```

## Modelo de Datos (Neo4j)
- **Nodo: `TextNode`**
  - `id` (UUID, constraint UNIQUE)
  - `titulo` (string, index)
  - `tipo` (enum: `poesia`, `narrativa`, `ensayo`, `hibrido`)
  - `rol` (string: `voz_autoral`, `narrador`, etc.)
  - `universo` (string, ej. `Gramaphenia`, index)
  - `version` (string/semver, ej. `v1.0.0`)
  - `fuente` (enum: `docx`, `txt`, `manuscrito`, `audio`)
  - `contenido_markdown` (string largo, almacenado íntegro)
  - `fecha_ingreso` (datetime)
  - `estado` (enum: `borrador`, `archivado`, `publicado`)
  - `checksum` (hash SHA para evitar duplicados exactos)

- **Relaciones (directed, con propiedades)**
  - `(:TextNode)-[:PERTENECE_A {contexto}]->(:TextNode|:Coleccion)`
  - `(:TextNode)-[:DIALOGA_CON {notas}]->(:TextNode)`
  - `(:TextNode)-[:DERIVA_DE {justificacion}]->(:TextNode)`
  - `(:TextNode)-[:VERSION_DE {numero_version}]->(:TextNode)`
  - Props comunes: `creado_en`, `creado_por`, `nivel_confianza`

- **Índices y restricciones**
  - `CREATE CONSTRAINT textnode_id IF NOT EXISTS FOR (t:TextNode) REQUIRE t.id IS UNIQUE;`
  - Índices compuestos: `(universo, estado)`, `(titulo)` para búsqueda rápida.

## Pipeline DOCX → Markdown → Entidad → Grafo
1. **Upload** (frontend): zona drag & drop acepta múltiples `.docx`; valida extensión y tamaño; muestra estado de cola.
2. **Ingestión** (backend):
   - Guarda archivo temporalmente (storage local/S3) con checksum.
   - Encola job `ParseDocx` con metadata (nombre, usuario, universo destino).
3. **Parsing** (worker):
   - Usa Mammoth.js con configuración conservadora (sin estilos decorativos) → HTML intermedio.
   - Convierte HTML a Markdown editorial plano, preservando párrafos, saltos de línea y versos (detectar `<p>` y `<br>` tal cual; no autocompletar).
   - No aplica correcciones ortográficas ni reflow de texto.
   - Genera `contenido_markdown` + `titulo` inferido del archivo o del primer encabezado.
4. **Persistencia** (graph service):
   - Crea nodo `TextNode` con propiedades obligatorias; estado inicial `borrador`.
   - Crea relaciones automáticas mínimas: `PERTENECE_A` al universo Gramaphenia; opcional `VERSION_DE` si checksum coincide con otro nodo.
5. **Emisión de evento**: notifica vía WebSocket/SSE al frontend para refrescar grafo y panel.
6. **Visualización**: frontend consume query al Graph API para mostrar nodos recién creados; clic abre panel de texto con markdown render fijo (sin edición).

### Detalles adicionales del pipeline
- **Validaciones duras**: rechazar archivos sin extensión `.docx`, tamaño máximo configurable, y documentos vacíos; registrar auditoría mínima (nombre de archivo, usuario, timestamp).
- **Normalización mínima**: solo limpieza de caracteres invisibles problemáticos y preservación de saltos; nunca reflow de párrafos.
- **Detección de duplicados**: checksum SHA del archivo y del `contenido_markdown`; si coincide, marcar relación `VERSION_DE` y evitar nodos duplicados.
- **Errores y reintentos**: jobs con reintentos acotados; captura de stack, estado `failed`, y evento de error para UI.
- **Trazabilidad**: cada `TextNode` conserva referencia al archivo fuente (URI) y al job de ingestión; logs estructurados por ingestionId.

## API Surface (resumen)
- `POST /api/ingest` → recibe archivos DOCX, retorna `ingestionId`.
- `GET /api/ingest/:id/status` → estado de jobs.
- `GET /api/texts/:id` → TextNode completo (markdown incluido).
- `GET /api/graph` → subgrafo filtrable por universo/estado.
- `POST /api/relations` → crear relación explícita entre nodos.
- `WS/SSE /events` → eventos `textnode.created`, `relation.created`.

## UI / Identidad Visual
- **Layout**: grilla de dos columnas rígidas; panel izquierdo fijo para grafo, derecho dividido en cabecera (meta) y cuerpo (markdown). Sin tarjetas redondeadas.
- **Tipografía**: serif con carácter para títulos (ej. `Editorial New`), mono/neo-grotesk para meta; interlineado amplio, espaciado generoso.
- **Colores**: fondo gris cálido #f5f3ef, texto en negro profundo; acentos en rojo óxido #b0172f y azul tinta #0f2f55. Bordes de 1px rectos.
- **Componentes clave**:
  - Header minimal con logotipo tipográfico “GRAMAPHENIA”.
  - **Zona Drag & Drop**: bloque rectangular con borde 1px, iconografía lineal, estado de progreso por archivo.
  - **Grafo**: panel de fondo neutro; nodos como círculos duros (sin borde redondo extra), aristas rectas; controles de zoom/focus alineados verticalmente; búsqueda para centrar nodo.
  - **Panel de Texto**: render Markdown sin edición; conserva saltos y versos; scroll vertical sobrio.
  - **Inspector de Relaciones**: lista tipográfica con labels de tipo; botones planos para agregar relaciones.
  - **Filtros**: barra vertical u horizontal con chips duros (sin pill-rounded) para estado, universo, tipo; feedback inmediato sobre el grafo.
  - **Estados vacíos**: mensajes tipográficos breves, sin ilustraciones “friendly”; instruyen a arrastrar DOCX o a crear relaciones.

## Flujo de Usuario
1. Arrastra uno o varios `.docx` al dropzone.
2. Ve progreso por archivo; al finalizar, cada texto aparece como nodo nuevo en el grafo.
3. Clic en un nodo → se fija foco, se cargan detalles y el markdown íntegro.
4. Desde el inspector puede crear relaciones explícitas (ej. `DERIVA_DE` otro texto) que se reflejan en el grafo en vivo.
5. Puede filtrar por universo, tipo o estado para reducir el subgrafo.

## Qué se Hace / Qué No
- **Se hace**: ingestión por drag & drop de DOCX con Mammoth.js; conversión fiel a Markdown plano; creación automática de nodos y relaciones base; visualización grafo interactiva; separación total de capas.
- **No se hace**: edición de texto en la app; reescritura, resumen o “mejora” de estilo; almacenamiento en bases relacionales; estilos “friendly” (bordes redondos, sombras suaves, glassmorphism); gamificación o feeds sociales.

## Estrategias de Evolución
- ADRs en `docs/` para decisiones clave (p. ej., Cytoscape vs Sigma).
- Feature flags para modos de visualización del grafo.
- Versionado de parsing configs (mapear cambios de Mammoth a versiones de pipeline).
- Observabilidad: logs estructurados + métricas de latencia de parseo y tamaño de textos.

## Tests y Validación (alto nivel)
- **Parsing**: snapshot de Markdown para casos de poesía (versos), narrativa (párrafos) y ensayo (secciones con subtítulos).
- **Integración**: upload múltiple → job queue → creación de nodos en Neo4j → evento SSE.
- **UI**: pruebas de accesibilidad básica (teclado/contraste) y funcionalidad de grafo (zoom, focus, click abre panel).
- **Resiliencia**: tests de reintentos de jobs y persistencia idempotente en Neo4j cuando se reciben duplicados.
- **Seguridad**: lint de dependencias y scanning de archivos subidos para extensiones no permitidas.
