import { corpus, activeItemId, focusMode, graphView, readStateFromURL, writeStateToURL, setCorpus, setActiveItemId, setFocusMode, setGraphView } from './state.ts';
import { loadCorpus, addTextAPI, updateTextAPI } from './api.ts';
import { populateFilters, renderDetail, activateItemById, renderList, renderGraph, render, showAddForm, hideAddForm, toggleTheme, setCustomSelectValue, initCustomSelects } from './ui.ts';
import { generateSlug } from './utils.ts';
import Toastify from 'toastify-js';

const filterTipo = document.getElementById("filter-tipo") as HTMLElement;
const filterRol = document.getElementById("filter-rol") as HTMLElement;
const filterUniverso = document.getElementById("filter-universo") as HTMLElement;
const toggleFocusBtn = document.getElementById("toggle-focus") as HTMLButtonElement;
const toggleGraphBtn = document.getElementById("toggle-graph") as HTMLButtonElement;

const showAddFormBtn = document.getElementById("show-add-form") as HTMLButtonElement;
const addForm = document.getElementById("add-form");
const addTitulo = document.getElementById("add-titulo") as HTMLInputElement;
const addTipo = document.getElementById("add-tipo") as HTMLSelectElement;
const addRol = document.getElementById("add-rol") as HTMLSelectElement;
const addUniverso = document.getElementById("add-universo") as HTMLInputElement;
const addDependeDe = document.getElementById("add-dependeDe") as HTMLInputElement;
const addParrafos = document.getElementById("add-parrafos") as HTMLTextAreaElement;
const addSubmit = document.getElementById("add-submit") as HTMLButtonElement;
const addCancel = document.getElementById("add-cancel") as HTMLButtonElement;

const toggleThemeBtn = document.getElementById("toggle-theme") as HTMLButtonElement;
const themeIcon = document.getElementById("theme-icon") as HTMLElement;

export async function submitText() {
  const titulo = addTitulo.value.trim();
  const tipo = addTipo.value;
  const rol = addRol.value;
  const universo = addUniverso.value.trim();
  const dependeDe = addDependeDe.value.trim();
  const parrafos = addParrafos.value.trim().split('\n').filter(p => p.trim());

  if (!titulo || !tipo || !rol) {
    Toastify({
      text: "Título, Tipo y Rol son obligatorios.",
      duration: 3000,
      gravity: "top",
      position: "right",
      backgroundColor: "var(--accent)",
    }).showToast();
    return;
  }

  const textData = {
    titulo,
    tipo,
    rol,
    universo: universo || null,
    dependeDe: dependeDe || null,
    parrafos: parrafos.length > 0 ? parrafos : null,
    slug: generateSlug(titulo)
  };

  const editId = addSubmit.dataset.editId;
  let result;
  if (editId) {
    result = await updateTextAPI(editId, textData);
    if (result) {
      const index = corpus.findIndex(t => t.id === editId);
      corpus[index] = result;
      Toastify({
        text: "Texto actualizado",
        duration: 3000,
        gravity: "top",
        position: "right",
        backgroundColor: "green",
      }).showToast();
    } else {
      Toastify({
        text: "Error al actualizar texto",
        duration: 3000,
        gravity: "top",
        position: "right",
        backgroundColor: "red",
      }).showToast();
      return;
    }
  } else {
    result = await addTextAPI(textData);
    if (result) {
      corpus.push(result);
      Toastify({
        text: "Texto agregado",
        duration: 3000,
        gravity: "top",
        position: "right",
        backgroundColor: "green",
      }).showToast();
    } else {
      Toastify({
        text: "Error al agregar texto",
        duration: 3000,
        gravity: "top",
        position: "right",
        backgroundColor: "red",
      }).showToast();
      return;
    }
  }

  populateFilters();
  render();
  hideAddForm();
}

export async function init() {
  setCorpus(await loadCorpus());
  populateFilters();
  initCustomSelects();
  const st = readStateFromURL();

  setCustomSelectValue(filterTipo, st.tipo);
  setCustomSelectValue(filterRol, st.rol);
  setCustomSelectValue(filterUniverso, st.universo);
  setFocusMode(st.focus);
  setGraphView(st.graph);

  toggleFocusBtn.setAttribute("aria-pressed", focusMode.toString());
  toggleGraphBtn.setAttribute("aria-pressed", graphView.toString());

  // Load theme
  const savedTheme = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  themeIcon.innerHTML = savedTheme === 'light' ?
    '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>' :
    '<circle cx="12" cy="12" r="5"></circle><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"></path>';

  render();

  if (st.slug) activateItemById(st.slug);

  // Event listeners
  [filterTipo, filterRol, filterUniverso].forEach(s =>
    s.addEventListener('change', () => {
      setActiveItemId(null);
      const detailEl = document.getElementById("detail");
      if (detailEl) detailEl.innerHTML = `<p class="placeholder">Seleccioná un texto</p>`;
      render();
      writeStateToURL();
    })
  );

  toggleFocusBtn.onclick = () => {
    setFocusMode(!focusMode);
    toggleFocusBtn.setAttribute("aria-pressed", focusMode.toString());
    if (activeItemId) activateItemById(corpus.find(i => i.id === activeItemId)?.slug);
  };

  toggleGraphBtn.onclick = () => {
    setGraphView(!graphView);
    toggleGraphBtn.setAttribute("aria-pressed", graphView.toString());
    const appEl = document.getElementById("app");
    const graphEl = document.getElementById("graph");
    if (appEl) appEl.hidden = graphView;
    if (graphEl) graphEl.hidden = !graphView;
    if (graphView) renderGraph();
    writeStateToURL();
  };

  showAddFormBtn.onclick = showAddForm;
  addSubmit.onclick = submitText;
  addCancel.onclick = hideAddForm;

  toggleThemeBtn.onclick = toggleTheme;
}