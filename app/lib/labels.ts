import type { LocationTipo } from "./api";

/** Rótulo do badge por nível (estado/cidade/bairro/rua). */
export const TIPO_BADGE: Record<LocationTipo, string> = {
  estado: "Estado",
  cidade: "Cidade",
  bairro: "Bairro",
  rua: "Rua",
};

/** Título da seção de drill-down: o que vem abaixo de cada nível. */
export const CHILD_TITLE: Record<LocationTipo, string> = {
  estado: "Cidades",
  cidade: "Bairros",
  bairro: "Ruas",
  rua: "Trechos por bairro",
};

/** Nível dos filhos de cada nível (para badge/preview do destino do drill-down). */
export const CHILD_LEVEL: Record<LocationTipo, LocationTipo> = {
  estado: "cidade",
  cidade: "bairro",
  bairro: "rua",
  rua: "rua",
};
