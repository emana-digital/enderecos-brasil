import type { SearchParams } from "./api";
import { normalize } from "./text";

// UF -> nome do estado. Usado para reconhecer refinamentos por estado escritos
// tanto pela sigla ("SP") quanto pelo nome ("São Paulo") em segmentos da busca.
export const UF_TO_ESTADO: Record<string, string> = {
  AC: "Acre",
  AL: "Alagoas",
  AP: "Amapá",
  AM: "Amazonas",
  BA: "Bahia",
  CE: "Ceará",
  DF: "Distrito Federal",
  ES: "Espírito Santo",
  GO: "Goiás",
  MA: "Maranhão",
  MT: "Mato Grosso",
  MS: "Mato Grosso do Sul",
  MG: "Minas Gerais",
  PA: "Pará",
  PB: "Paraíba",
  PR: "Paraná",
  PE: "Pernambuco",
  PI: "Piauí",
  RJ: "Rio de Janeiro",
  RN: "Rio Grande do Norte",
  RS: "Rio Grande do Sul",
  RO: "Rondônia",
  RR: "Roraima",
  SC: "Santa Catarina",
  SP: "São Paulo",
  SE: "Sergipe",
  TO: "Tocantins",
};

const ESTADO_TO_UF: Record<string, string> = Object.fromEntries(
  Object.entries(UF_TO_ESTADO).map(([uf, nome]) => [normalize(nome), uf])
);

const UF_SET = new Set(Object.keys(UF_TO_ESTADO));

/** Reconhece um segmento como UF (sigla de 2 letras ou nome do estado). */
const matchUf = (segment: string): string | null => {
  const trimmed = segment.trim();
  const upper = trimmed.toUpperCase();
  if (upper.length === 2 && UF_SET.has(upper)) return upper;
  const byName = ESTADO_TO_UF[normalize(trimmed)];
  return byName ?? null;
};

export interface ParsedQuery extends SearchParams {
  /** Termo principal já limpo (primeiro segmento, sem o refinamento de UF). */
  q: string;
  /** UF detectada num segmento separado por vírgula (ex.: "Avenida, SP"). */
  uf?: string;
}

/**
 * Interpreta o que o usuário digitou em parâmetros de `/locations/search`.
 *
 * O usuário pode refinar separando por vírgulas: o último segmento que for uma
 * UF/estado vira o filtro `uf`; o restante vira o termo `q`. Ex.:
 *   "Avenida Brasil, Maringá, PR" → { q: "Avenida Brasil, Maringá", uf: "PR" }
 *   "Rua das Flores"              → { q: "Rua das Flores" }
 */
export function parseQuery(input: string, limit = 8): ParsedQuery {
  const segments = input
    .split(",")
    .map((segment) => segment.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  if (segments.length === 0) return { q: "", limit };

  let uf: string | undefined;
  // Só o último segmento é candidato a UF, para não "comer" "São Paulo" cidade.
  const last = segments[segments.length - 1];
  const matchedUf = matchUf(last);
  if (matchedUf && segments.length > 1) {
    uf = matchedUf;
    segments.pop();
  }

  return { q: segments.join(", "), uf, limit };
}
