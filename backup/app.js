const app = document.getElementById("app");
const graphEl = document.getElementById("graph");
const detail = document.getElementById("detail");

const filterTipo = document.getElementById("filter-tipo");
const filterRol = document.getElementById("filter-rol");
const filterUniverso = document.getElementById("filter-universo");
const toggleFocusBtn = document.getElementById("toggle-focus");
const toggleGraphBtn = document.getElementById("toggle-graph");

let activeItemId = null;
let focusMode = false;
let graphView = false;

/* URL STATE */

function readStateFromURL() {
  const p = new URLSearchParams(location.search);
  return {
    item: p.get("item"),
    tipo: p.get("tipo") || "",
    rol: p.get("rol") || "",
    universo: p.get("universo") || "",
    focus: p.get("focus") === "1",
    graph: p.get("graph") === "1"
  };
}

function writeStateToURL() {
  const p = new URLSearchParams();
  if (activeItemId) p.set("item", activeItemId);
  if (filterTipo.value) p.set("tipo", filterTipo.value);
  if (filterRol.value) p.set("rol", filterRol.value);
  if (filterUniverso.value) p.set("universo", filterUniverso.value);
  if (focusMode) p.set("focus", "1");
  if (graphView) p.set("graph", "1");
  history.replaceState(null, "", `${location.pathname}?${p}`);
}

/* UTILS */

const unique = k => [...new Set(corpus.map(i => i[k]).filter(Boolean))];

function populateFilters() {
  unique("tipo").forEach(v => filterTipo.innerHTML += `<option>${v}</option>`);
  unique("rol").forEach(v => filterRol.innerHTML += `<option>${v}</option>`);
  unique("universo").forEach(v => filterUniverso.innerHTML += `<option>${v}</option>`);
}

function applyFilters(data) {
  return data.filter(i =>
    (!filterTipo.value || i.tipo === filterTipo.value) &&
    (!filterRol.value || i.rol === filterRol.value) &&
    (!filterUniverso.value || i.universo === filterUniverso.value)
  );
}

function groupByTipo(data) {
  return data.reduce((a, i) => {
    (a[i.tipo] ||= []).push(i);
    return a;
  }, {});
}

function clearStates() {
  document.querySelectorAll(".item").forEach(el =>
    el.classList.remove("active", "parent", "child", "hidden")
  );
}

/* DETAIL */

function renderDetail(item) {
  detail.innerHTML = `
    <h3>${item.titulo}</h3>
    <div class="detail-row"><div class="detail-label">Tipo</div>${item.tipo}</div>
    <div class="detail-row"><div class="detail-label">Rol</div>${item.rol}</div>
    <div class="detail-row"><div class="detail-label">Universo</div>${item.universo ?? "—"}</div>
    <div class="detail-row"><div class="detail-label">Depende de</div>
      ${item.dependeDe ? `<a href="#" data-nav="${item.dependeDe}">${item.dependeDe}</a>` : "—"}
    </div>
  `;

  detail.querySelectorAll("[data-nav]").forEach(a =>
    a.onclick = e => {
      e.preventDefault();
      activateItemById(a.dataset.nav);
    }
  );
}

/* CORE */

function activateItemById(id) {
  const item = corpus.find(i => i.id === id);
  if (!item) return;

  activeItemId = id;
  clearStates();

  const current = document.querySelector(`.item[data-id="${id}"]`);
  current?.classList.add("active");

  const visible = new Set([id]);

  if (item.dependeDe) {
    visible.add(item.dependeDe);
    document.querySelector(`.item[data-id="${item.dependeDe}"]`)?.classList.add("parent");
  }

  corpus.forEach(o => {
    if (o.dependeDe === id) {
      visible.add(o.id);
      document.querySelector(`.item[data-id="${o.id}"]`)?.classList.add("child");
    }
  });

  if (focusMode) {
    document.querySelectorAll(".item").forEach(el => {
      if (!visible.has(el.dataset.id)) el.classList.add("hidden");
    });
  }

  renderDetail(item);
  writeStateToURL();
  current?.scrollIntoView({ block: "center", behavior: "smooth" });
}

/* LIST */

function renderList() {
  const filtered = applyFilters(corpus);
  const grouped = groupByTipo(filtered);
  app.innerHTML = "";

  Object.entries(grouped).forEach(([tipo, items]) => {
    const s = document.createElement("section");
    s.innerHTML = `<h2>${tipo.toUpperCase()}</h2>`;
    items.forEach(i => {
      const d = document.createElement("div");
      d.className = "item";
      d.dataset.id = i.id;
      d.innerHTML = `
        <div class="item-title">${i.titulo}</div>
        <div class="item-meta">
          ${i.rol}
          ${i.dependeDe ? ` → <a href="#" data-nav="${i.dependeDe}">${i.dependeDe}</a>` : ""}
          ${i.universo ? ` · ${i.universo}` : ""}
        </div>`;
      d.onclick = () => activateItemById(i.id);
      d.querySelectorAll("[data-nav]").forEach(a =>
        a.onclick = e => {
          e.stopPropagation();
          e.preventDefault();
          activateItemById(a.dataset.nav);
        }
      );
      s.appendChild(d);
    });
    app.appendChild(s);
  });
}

/* GRAPH */

function renderGraph() {
  const data = applyFilters(corpus);
  graphEl.innerHTML = "";
  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");

  const byTipo = groupByTipo(data);
  const tipos = Object.keys(byTipo);
  const width = graphEl.clientWidth || 800;
  const col = width / (tipos.length + 1);

  const pos = {};
  tipos.forEach((t, i) =>
    byTipo[t].forEach((it, j) =>
      pos[it.id] = { x: col * (i + 1), y: 50 + j * 70 }
    )
  );

  data.forEach(i => {
    if (i.dependeDe && pos[i.id] && pos[i.dependeDe]) {
      const l = document.createElementNS(svgNS, "line");
      l.setAttribute("x1", pos[i.id].x);
      l.setAttribute("y1", pos[i.id].y);
      l.setAttribute("x2", pos[i.dependeDe].x);
      l.setAttribute("y2", pos[i.dependeDe].y);
      l.setAttribute("class", "edge");
      svg.appendChild(l);
    }
  });

  data.forEach(i => {
    const g = document.createElementNS(svgNS, "g");
    g.setAttribute("transform", `translate(${pos[i.id].x},${pos[i.id].y})`);

    const c = document.createElementNS(svgNS, "circle");
    c.setAttribute("r", 8);
    c.setAttribute("class", "node");
    if (i.id === activeItemId) c.classList.add("active");
    c.onclick = () => activateItemById(i.id);

    const t = document.createElementNS(svgNS, "text");
    t.setAttribute("x", 12);
    t.setAttribute("y", 4);
    t.setAttribute("class", "label");
    t.textContent = i.titulo;

    g.appendChild(c);
    g.appendChild(t);
    svg.appendChild(g);
  });

  graphEl.appendChild(svg);
}

/* EVENTS */

[filterTipo, filterRol, filterUniverso].forEach(s =>
  s.onchange = () => {
    activeItemId = null;
    detail.innerHTML = `<p class="placeholder">Seleccioná un texto</p>`;
    render();
    writeStateToURL();
  }
);

toggleFocusBtn.onclick = () => {
  focusMode = !focusMode;
  toggleFocusBtn.setAttribute("aria-pressed", focusMode);
  if (activeItemId) activateItemById(activeItemId);
};

toggleGraphBtn.onclick = () => {
  graphView = !graphView;
  toggleGraphBtn.setAttribute("aria-pressed", graphView);
  app.hidden = graphView;
  graphEl.hidden = !graphView;
  if (graphView) renderGraph();
  writeStateToURL();
};

function render() {
  renderList();
  if (graphView) renderGraph();
}

/* INIT */

populateFilters();
const st = readStateFromURL();

filterTipo.value = st.tipo;
filterRol.value = st.rol;
filterUniverso.value = st.universo;
focusMode = st.focus;
graphView = st.graph;

toggleFocusBtn.setAttribute("aria-pressed", focusMode);
toggleGraphBtn.setAttribute("aria-pressed", graphView);

render();

if (st.item) activateItemById(st.item);
