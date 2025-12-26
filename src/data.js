const corpus = [
  {
    id: "muga",
    titulo: "MUGA (anātman)",
    tipo: "Narrativa",
    rol: "Raíz",
    universo: "MUGA",
    dependeDe: null
  },
  {
    id: "demiurgo-completo",
    titulo: "Demiurgo completo",
    tipo: "Narrativa",
    rol: "Raíz",
    universo: null,
    dependeDe: null
  },
  {
    id: "demiurgo",
    titulo: "Demiurgo",
    tipo: "Narrativa",
    rol: "Versión",
    universo: null,
    dependeDe: "demiurgo-completo"
  },
  {
    id: "assez-doux",
    titulo: "Assez doux, mais d’une sonorité large",
    tipo: "Narrativa",
    rol: "Raíz",
    universo: "Ettore-Margot",
    dependeDe: null
  },
  {
    id: "un-peu-plus-lent",
    titulo: "Un peu plus lent",
    tipo: "Narrativa",
    rol: "Módulo",
    universo: "Ettore-Margot",
    dependeDe: "assez-doux"
  },
  {
    id: "al-filo-del-pensar",
    titulo: "Al filo del pensar",
    tipo: "Ensayo",
    rol: "Raíz",
    universo: null,
    dependeDe: null
  },
  {
    id: "ontologia",
    titulo: "Ontología",
    tipo: "Ensayo",
    rol: "Raíz",
    universo: null,
    dependeDe: null
  }
];
