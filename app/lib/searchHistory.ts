import type { LocationResult } from "./api";
import { normalize, tokenize } from "./text";
import type { VocabEntry } from "./vocabulary";

// "Aprendizado" local do input: cada seleção do usuário é guardada no
// localStorage com um contador de uso e o instante do último uso. Com isso
// conseguimos (1) rankear no topo das sugestões os endereços mais usados e
// (2) alimentar o autocomplete inline com as palavras que o cliente mais busca.
//
// Tudo é client-only e tolerante a falha (SSR, modo privativo, cota cheia).

// v2: entradas v1 não tinham `href`/`path` (o backend ainda não mandava) — o
// bump descarta as antigas para a seleção sempre ter destino.
const STORAGE_KEY = "eb:search-history:v2";
const MAX_ENTRIES = 60;

export interface HistoryEntry {
  result: LocationResult;
  count: number;
  lastUsedAt: number;
}

/** Identidade estável de um resultado — serve de key de lista e de dedupe. */
export const resultIdentity = (result: LocationResult): string =>
  result.tipo === "cep"
    ? `cep:${result.cep}`
    : `${result.tipo}:${result.id ?? result.label}`;

const identityOf = resultIdentity;

const isBrowser = (): boolean =>
  typeof window !== "undefined" && typeof window.localStorage !== "undefined";

export function readHistory(): HistoryEntry[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as HistoryEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeHistory(entries: HistoryEntry[]): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // cota/modo privativo — aprender é "best effort", então só ignoramos.
  }
}

/** Registra uma seleção, incrementando o uso. Retorna o histórico atualizado. */
export function rememberSelection(result: LocationResult): HistoryEntry[] {
  const id = identityOf(result);
  const entries = readHistory();
  const existing = entries.find((entry) => identityOf(entry.result) === id);

  if (existing) {
    existing.count += 1;
    existing.lastUsedAt = Date.now();
    existing.result = result; // mantém o label mais recente
  } else {
    entries.push({ result, count: 1, lastUsedAt: Date.now() });
  }

  entries.sort((a, b) => b.count - a.count || b.lastUsedAt - a.lastUsedAt);
  const trimmed = entries.slice(0, MAX_ENTRIES);
  writeHistory(trimmed);
  return trimmed;
}

/**
 * Filtra o histórico pelos itens que combinam com o que foi digitado, já
 * ordenados por uso. Vira o bloco "usados recentemente" no topo das sugestões.
 */
export function matchHistory(
  query: string,
  entries: HistoryEntry[],
  limit = 4
): HistoryEntry[] {
  const key = normalize(query);
  if (!key) {
    return entries.slice(0, limit);
  }
  const terms = key.split(" ").filter(Boolean);
  return entries
    .filter((entry) => {
      const haystack = normalize(entry.result.label);
      return terms.every((term) => haystack.includes(term));
    })
    .slice(0, limit);
}

/** Converte o histórico em vocabulário ponderado (palavras que o cliente usa). */
export function vocabularyFromHistory(entries: HistoryEntry[]): VocabEntry[] {
  const counts = new Map<string, { word: string; weight: number }>();

  for (const entry of entries) {
    // Usa logradouro/bairro/cidade/estado quando existem (grafia bonita).
    const sources = [
      entry.result.logradouro,
      entry.result.bairro,
      entry.result.cidade,
      entry.result.estado,
    ].filter((value): value is string => Boolean(value));

    for (const source of sources) {
      for (const word of source.split(/\s+/)) {
        if (word.length < 2 || /^\d/.test(word)) continue;
        const key = normalize(word);
        const current = counts.get(key);
        const weight = entry.count;
        if (current) current.weight += weight;
        else counts.set(key, { word, weight });
      }
    }
    // Garante que tokens normalizados também existam mesmo sem campos ricos.
    if (sources.length === 0) {
      for (const word of tokenize(entry.result.label)) {
        if (word.length < 2) continue;
        const current = counts.get(word);
        if (current) current.weight += entry.count;
        else counts.set(word, { word, weight: entry.count });
      }
    }
  }

  return [...counts.entries()].map(([key, { word, weight }]) => ({
    word,
    key,
    // Acima do vocabulário base, abaixo do dinâmico vindo da API atual.
    weight: 1200 + weight,
  }));
}
