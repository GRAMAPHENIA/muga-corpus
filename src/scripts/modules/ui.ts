import { corpus, activeItemId, focusMode, graphView, writeStateToURL, applyFilters, groupByTipo, clearStates, setActiveItemId } from './state.ts';
import { unique } from './utils.ts';
import { deleteTextAPI } from './api.ts';
import Toastify from 'toastify-js';
import type { TextItem } from './state.ts';

const app = document.getElementById("app") as HTMLElement;
const graphEl = document.getElementById("graph") as HTMLElement;
const detail = document.getElementById("detail") as HTMLElement;

const filterTipo = document.getElementById("filter-tipo") as HTMLSelectElement;
const filterRol = document.getElementById("filter-rol") as HTMLSelectElement;
const filterUniverso = document.getElementById("filter-universo") as HTMLSelectElement;
const toggleFocusBtn = document.getElementById("toggle-focus") as HTMLButtonElement;
const toggleGraphBtn = document.getElementById("toggle-graph") as HTMLButtonElement;

const showAddFormBtn = document.getElementById("show-add-form") as HTMLButtonElement;
const modalBackdrop = document.getElementById("modal-backdrop") as HTMLElement;
const addModal = document.getElementById("add-modal") as HTMLElement;
const addTitulo = document.getElementById("add-titulo") as HTMLInputElement;
const addTipo = document.getElementById("add-tipo") as HTMLSelectElement;
const addRol = document.getElementById("add-rol") as HTMLSelectElement;
const addUniverso = document.getElementById("add-universo") as HTMLInputElement;
const addDependeDe = document.getElementById("add-dependeDe") as HTMLInputElement;
const addParrafos = document.getElementById("add-parrafos") as HTMLTextAreaElement;
const addSubmit = document.getElementById("add-submit") as HTMLButtonElement;
const addCancel = document.getElementById("add-cancel") as HTMLButtonElement;
const formatBold = document.getElementById("format-bold") as HTMLButtonElement;
const formatItalic = document.getElementById("format-italic") as HTMLButtonElement;
const formatUnderline = document.getElementById("format-underline") as HTMLButtonElement;

const toggleThemeBtn = document.getElementById("toggle-theme") as HTMLButtonElement;
const themeIcon = document.getElementById("theme-icon") as HTMLElement;

let initialFormValues: { [key: string]: string } = {};

export function populateFilters() {
  const tipoOptions = filterTipo.querySelector('.custom-select-options') as HTMLElement;
  const rolOptions = filterRol.querySelector('.custom-select-options') as HTMLElement;
  const universoOptions = filterUniverso.querySelector('.custom-select-options') as HTMLElement;

  tipoOptions.innerHTML = '<div class="custom-select-option" role="option" data-value="">Tipo (todos)</div>';
  unique(corpus, "tipo").forEach(v => tipoOptions.innerHTML += `<div class="custom-select-option" role="option" data-value="${v}">${v}</div>`);

  rolOptions.innerHTML = '<div class="custom-select-option" role="option" data-value="">Rol (todos)</div>';
  unique(corpus, "rol").forEach(v => rolOptions.innerHTML += `<div class="custom-select-option" role="option" data-value="${v}">${v}</div>`);

  universoOptions.innerHTML = '<div class="custom-select-option" role="option" data-value="">Universo (todos)</div>';
  unique(corpus, "universo").forEach(v => universoOptions.innerHTML += `<div class="custom-select-option" role="option" data-value="${v}">${v}</div>`);
}

export function renderDetail(item: TextItem) {
  let content = `
    <h3>${item.titulo}</h3>
    <div class="detail-row"><div class="detail-label">Tipo</div>${item.tipo}</div>
    <div class="detail-row"><div class="detail-label">Rol</div>${item.rol}</div>
    <div class="detail-row"><div class="detail-label">Universo</div>${item.universo ?? "—"}</div>
    <div class="detail-row"><div class="detail-label">Depende de</div>
      ${item.dependeDe ? `<a href="#" data-nav="${item.dependeDe}">${item.dependeDe}</a>` : "—"}
    </div>
  `;

  if (item.parrafos && item.parrafos.length > 0) {
    const formattedParrafos = item.parrafos.map(p =>
      p.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
       .replace(/\*(.*?)\*/g, '<em>$1</em>')
       .replace(/__(.*?)__/g, '<u>$1</u>')
    ).map(p => `<p>${p}</p>`).join('');
    content += `<div class="detail-parrafos"><h4>Párrafos</h4>${formattedParrafos}</div>`;
  }

  detail.innerHTML = content;

  detail.querySelectorAll("[data-nav]").forEach(a =>
    (a as HTMLElement).onclick = (e: Event) => {
      e.preventDefault();
      activateItemById((a as HTMLElement).dataset.nav!);
    }
  );
}

export function activateItemById(slug: string) {
  const item = corpus.find(i => i.slug === slug);
  if (!item) return;

  setActiveItemId(item.id);
  clearStates();

  const current = document.querySelector(`.item[data-slug="${slug}"]`) as HTMLElement;
  current?.classList.add("active");

  const visible = new Set([item.id]);

  if (item.dependeDe) {
    visible.add(item.dependeDe);
    const parentSlug = corpus.find(t => t.id === item.dependeDe)?.slug;
    document.querySelector(`.item[data-slug="${parentSlug}"]`)?.classList.add("parent");
  }

  corpus.forEach(o => {
    if (o.dependeDe === item.id) {
      visible.add(o.id);
      document.querySelector(`.item[data-slug="${o.slug}"]`)?.classList.add("child");
    }
  });

  if (focusMode) {
    document.querySelectorAll(".item").forEach(el => {
      if (!visible.has((el as HTMLElement).dataset.slug!)) el.classList.add("hidden");
    });
  }

  renderDetail(item);
  writeStateToURL();
  current?.scrollIntoView({ block: "center", behavior: "smooth" });
}

export function renderList() {
  const filtered = applyFilters();
  const grouped = groupByTipo(filtered);
  app.innerHTML = "";

  Object.entries(grouped).forEach(([tipo, items]) => {
    const s = document.createElement("section");
    s.innerHTML = `<h2>${tipo.toUpperCase()}</h2>`;
    items.forEach(i => {
      const d = document.createElement("div");
      d.className = "item";
      (d as HTMLElement).dataset.slug = i.slug;
      d.innerHTML = `
        <div class="item-title">${i.titulo}</div>
        <div class="item-meta">
          <span>
            ${i.rol}
            ${i.dependeDe ? ` → <a href="#" data-nav="${corpus.find(t => t.id === i.dependeDe)?.slug || i.dependeDe}">${i.dependeDe}</a>` : ""}
            ${i.universo ? ` · ${i.universo}` : ""}
          </span>
          <div class="item-actions">
            <button class="edit-btn" data-id="${i.id}" style="background: transparent; color: #53a7ff; border: none; padding: 2px; margin-right: 4px; font-size: 10px; cursor: pointer;" title="Editar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 16px; height: 16px;">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>
            <button class="delete-btn" data-id="${i.id}" style="background: transparent; color: var(--accent); border: none; padding: 2px; margin-right: 8px; font-size: 10px; cursor: pointer;" title="Eliminar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 16px; height: 16px;">
                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
              </svg>
            </button>
          </div>
        </div>`;
      d.onclick = () => activateItemById(i.slug);
      d.querySelectorAll("[data-nav]").forEach(a =>
        (a as HTMLElement).onclick = (e: Event) => {
          e.stopPropagation();
          (e as MouseEvent).preventDefault();
          activateItemById((a as HTMLElement).dataset.nav!);
        }
      );
      const deleteBtn = d.querySelector(".delete-btn") as HTMLButtonElement;
      deleteBtn.onclick = e => {
        e.stopPropagation();
        Toastify({
          text: `¿Eliminar "${i.titulo}"?`,
          duration: 5000,
          gravity: "top",
          position: "center",
          backgroundColor: "var(--accent)",
          close: true,
          onClick: () => {
            deleteTextAPI(i.id).then(success => {
              if (success) {
                corpus.splice(corpus.findIndex(t => t.id === i.id), 1);
                populateFilters();
                render();
                Toastify({
                  text: "Texto eliminado",
                  duration: 3000,
                  gravity: "top",
                  position: "right",
                  backgroundColor: "green",
                }).showToast();
              } else {
                Toastify({
                  text: "Error al eliminar",
                  duration: 3000,
                  gravity: "top",
                  position: "right",
                  backgroundColor: "red",
                }).showToast();
              }
            });
          }
        }).showToast();
      };
      const editBtn = d.querySelector(".edit-btn") as HTMLButtonElement;
      editBtn.onclick = e => {
        e.stopPropagation();
        showEditForm(i);
      };
      s.appendChild(d);
    });
    app.appendChild(s);
  });
}

export function renderGraph() {
  const data = applyFilters();
  graphEl.innerHTML = "";
  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");

  const byTipo = groupByTipo(data);
  const tipos = Object.keys(byTipo);
  const width = graphEl.clientWidth || 800;
  const col = width / (tipos.length + 1);

  const pos: Record<string, { x: number; y: number }> = {};
  tipos.forEach((t, i) =>
    byTipo[t].forEach((it, j) =>
      pos[it.id] = { x: col * (i + 1), y: 50 + j * 70 }
    )
  );

  data.forEach(i => {
    if (i.dependeDe && pos[i.id] && pos[i.dependeDe]) {
      const l = document.createElementNS(svgNS, "line");
      l.setAttribute("x1", pos[i.id].x.toString());
      l.setAttribute("y1", pos[i.id].y.toString());
      l.setAttribute("x2", pos[i.dependeDe].x.toString());
      l.setAttribute("y2", pos[i.dependeDe].y.toString());
      l.setAttribute("class", "edge");
      svg.appendChild(l);
    }
  });

  data.forEach(i => {
    const g = document.createElementNS(svgNS, "g");
    g.setAttribute("transform", `translate(${pos[i.id].x},${pos[i.id].y})`);

    const c = document.createElementNS(svgNS, "circle");
    c.setAttribute("r", "8");
    c.setAttribute("class", "node");
    if (i.id === activeItemId) c.classList.add("active");
    c.onclick = () => activateItemById(i.slug);

    const t = document.createElementNS(svgNS, "text");
    t.setAttribute("x", "12");
    t.setAttribute("y", "4");
    t.setAttribute("class", "label");
    t.textContent = i.titulo;

    g.appendChild(c);
    g.appendChild(t);
    svg.appendChild(g);
  });

  graphEl.appendChild(svg);
}

export function render() {
  renderList();
  if (graphView) renderGraph();
}

export function showAddForm() {
  const h3 = addModal.querySelector("h3") as HTMLElement;
  if (h3) h3.textContent = "Agregar nuevo texto";
  addSubmit.textContent = "Agregar";
  modalBackdrop.classList.remove("hidden");
  modalBackdrop.classList.add("flex");
  document.body.style.overflow = "hidden";
}

export function showEditForm(item: TextItem) {
  const h3 = addModal.querySelector("h3") as HTMLElement;
  if (h3) h3.textContent = "Editar texto";
  addSubmit.textContent = "Actualizar";
  addTitulo.value = item.titulo;
  addTipo.value = item.tipo;
  addRol.value = item.rol;
  addUniverso.value = item.universo || "";
  addDependeDe.value = item.dependeDe || "";
  addParrafos.value = item.parrafos ? item.parrafos.join("\n") : "";
  addSubmit.dataset.editId = item.id;

  // Guardar valores iniciales
  initialFormValues = {
    titulo: addTitulo.value,
    tipo: addTipo.value,
    rol: addRol.value,
    universo: addUniverso.value,
    dependeDe: addDependeDe.value,
    parrafos: addParrafos.value
  };

  // Resetear estilo del botón
  addSubmit.style.backgroundColor = "";
  addSubmit.style.color = "var(--accent)";
  addSubmit.style.border = "";
  addSubmit.style.fontWeight = "";
  addSubmit.style.transition = "all 0.3s ease";

  // Agregar event listeners para detectar cambios
  const checkChanges = () => {
    const hasChanges =
      addTitulo.value !== initialFormValues.titulo ||
      addTipo.value !== initialFormValues.tipo ||
      addRol.value !== initialFormValues.rol ||
      addUniverso.value !== initialFormValues.universo ||
      addDependeDe.value !== initialFormValues.dependeDe ||
      addParrafos.value !== initialFormValues.parrafos;

    if (hasChanges) {
      addSubmit.style.backgroundColor = "var(--accent)";
      addSubmit.style.color = "var(--bg)";
      addSubmit.style.border = "2px solid var(--accent)";
      addSubmit.style.fontWeight = "bold";
    } else {
      addSubmit.style.backgroundColor = "";
      addSubmit.style.color = "var(--accent)";
      addSubmit.style.border = "";
      addSubmit.style.fontWeight = "";
    }
  };

  addTitulo.addEventListener("input", checkChanges);
  addTipo.addEventListener("change", checkChanges);
  addRol.addEventListener("change", checkChanges);
  addUniverso.addEventListener("input", checkChanges);
  addDependeDe.addEventListener("input", checkChanges);
  addParrafos.addEventListener("input", checkChanges);

  modalBackdrop.classList.remove("hidden");
  modalBackdrop.classList.add("flex");
  document.body.style.overflow = "hidden";
}

export function hideAddForm() {
  modalBackdrop.classList.add("hidden");
  modalBackdrop.classList.remove("flex");
  document.body.style.overflow = "";
  addTitulo.value = "";
  addTipo.value = "";
  addRol.value = "";
  addUniverso.value = "";
  addDependeDe.value = "";
  addParrafos.value = "";
  delete addSubmit.dataset.editId;
}

modalBackdrop.addEventListener("click", (e) => {
  if (e.target === modalBackdrop) {
    hideAddForm();
  }
});

function wrapSelectedText(textarea: HTMLTextAreaElement, before: string, after: string) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selectedText = textarea.value.substring(start, end);
  const wrappedText = before + selectedText + after;
  textarea.value = textarea.value.substring(0, start) + wrappedText + textarea.value.substring(end);
  textarea.selectionStart = start + before.length;
  textarea.selectionEnd = start + before.length + selectedText.length;
  textarea.focus();
}

formatBold.addEventListener("click", () => {
  wrapSelectedText(addParrafos, "**", "**");
});

formatItalic.addEventListener("click", () => {
  wrapSelectedText(addParrafos, "*", "*");
});

formatUnderline.addEventListener("click", () => {
  wrapSelectedText(addParrafos, "__", "__");
});

export function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', newTheme);
  themeIcon.innerHTML = newTheme === 'light' ?
    '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>' :
    '<circle cx="12" cy="12" r="5"></circle><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"></path>';
  localStorage.setItem('theme', newTheme);
}

export function setCustomSelectValue(select: HTMLElement, value: string) {
  select.setAttribute('data-value', value);
  const valueSpan = select.querySelector('.custom-select-value') as HTMLElement;
  const options = select.querySelectorAll('.custom-select-option');
  let displayText = '';
  options.forEach(opt => {
    if ((opt as HTMLElement).dataset.value === value) {
      displayText = opt.textContent || '';
      opt.classList.add('selected');
    } else {
      opt.classList.remove('selected');
    }
  });
  if (!displayText && value === '') {
    displayText = options[0]?.textContent || '';
    options[0]?.classList.add('selected');
  }
  valueSpan.textContent = displayText;
}

export function initCustomSelects() {
  [filterTipo, filterRol, filterUniverso].forEach(select => {
    const trigger = select.querySelector('.custom-select-trigger') as HTMLElement;
    const options = select.querySelector('.custom-select-options') as HTMLElement;
    const valueSpan = select.querySelector('.custom-select-value') as HTMLElement;
    let activeIndex = -1;

    const close = () => {
      select.setAttribute('aria-expanded', 'false');
      options.hidden = true;
      activeIndex = -1;
      select.querySelectorAll('.custom-select-option.active').forEach(el => el.classList.remove('active'));
    };

    const open = () => {
      select.setAttribute('aria-expanded', 'true');
      options.hidden = false;
    };

    const selectOption = (option: HTMLElement) => {
      const value = option.dataset.value || '';
      setCustomSelectValue(select, value);
      close();
      // Trigger change
      const event = new Event('change', { bubbles: true });
      select.dispatchEvent(event);
    };

    trigger.addEventListener('click', () => {
      if (select.getAttribute('aria-expanded') === 'true') {
        close();
      } else {
        open();
      }
    });

    options.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains('custom-select-option')) {
        selectOption(target);
      }
    });

    select.addEventListener('keydown', (e) => {
      const opts = Array.from(options.querySelectorAll('.custom-select-option')) as HTMLElement[];
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (select.getAttribute('aria-expanded') === 'true') {
          if (activeIndex >= 0) {
            selectOption(opts[activeIndex]);
          }
        } else {
          open();
        }
      } else if (e.key === 'Escape') {
        close();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (select.getAttribute('aria-expanded') !== 'true') {
          open();
          activeIndex = 0;
        } else {
          activeIndex = (activeIndex + 1) % opts.length;
        }
        opts.forEach((opt, i) => opt.classList.toggle('active', i === activeIndex));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        activeIndex = activeIndex <= 0 ? opts.length - 1 : activeIndex - 1;
        opts.forEach((opt, i) => opt.classList.toggle('active', i === activeIndex));
      }
    });

    // Close on click outside
    document.addEventListener('click', (e) => {
      if (!select.contains(e.target as Node)) {
        close();
      }
    });
  });
}