import { UF_TO_ESTADO } from "./parseQuery";
import { normalize } from "./text";

// Vocabulário base para o autocomplete inline (ghost text). São as palavras com
// que endereços costumam começar/ser compostos. Peso alto = sugere primeiro.
// A grafia aqui é a "bonita" (com acento/caixa) — é o que aparece ao aceitar.
const LOGRADOURO_TYPES = [
  "Rua",
  "Avenida",
  "Travessa",
  "Alameda",
  "Praça",
  "Rodovia",
  "Estrada",
  "Largo",
  "Viela",
  "Ladeira",
  "Beco",
  "Via",
  "Servidão",
  "Passarela",
  "Quadra",
  "Conjunto",
  "Viaduto",
  "Vila",
  "Parque",
  "Jardim",
  "Loteamento",
  "Distrito",
  "Núcleo",
  "Trevo",
  "Marginal",
];

export interface VocabEntry {
  /** Palavra na grafia de exibição (com acento/caixa). */
  word: string;
  /** Forma normalizada (para casar prefixo). */
  key: string;
  /** Peso: maior aparece primeiro. */
  weight: number;
}

const baseVocabulary: VocabEntry[] = [
  ...LOGRADOURO_TYPES.map((word, index) => ({
    word,
    key: normalize(word),
    // Tipos mais comuns (Rua, Avenida...) pesam mais por estarem no topo.
    weight: 1000 - index,
  })),
  ...Object.values(UF_TO_ESTADO).map((word) => ({
    word,
    key: normalize(word),
    weight: 300,
  })),
];

/**
 * Encontra a melhor palavra que completa `token` (o que o usuário está
 * digitando agora). Candidatos vêm de 3 fontes, somadas e ranqueadas:
 *
 *  - `dynamic`: palavras presentes nos resultados atuais da API (mais relevante,
 *    pois reflete o que existe de verdade para o que já foi digitado);
 *  - `learned`: termos que o usuário já selecionou antes (peso = frequência);
 *  - vocabulário base (tipos de logradouro + estados).
 *
 * Retorna a palavra na grafia de exibição, ou `null` se nada começa com `token`
 * (ou se o token já é a palavra inteira — aí não há o que completar).
 */
export function suggestWordCompletion(
  token: string,
  options: { dynamic?: VocabEntry[]; learned?: VocabEntry[] } = {}
): string | null {
  const key = normalize(token);
  if (key.length < 2) return null; // 1 letra é ambíguo demais

  const pools: VocabEntry[] = [
    ...(options.dynamic ?? []),
    ...(options.learned ?? []),
    ...baseVocabulary,
  ];

  let best: VocabEntry | null = null;
  for (const entry of pools) {
    if (entry.key.length <= key.length) continue; // precisa ter cauda a sugerir
    if (!entry.key.startsWith(key)) continue;
    if (!best || entry.weight > best.weight) best = entry;
  }

  return best?.word ?? null;
}

/**
 * Extrai um vocabulário dinâmico a partir das palavras que aparecem nos labels
 * dos resultados (logradouro, bairro, cidade...). Palavras que se repetem entre
 * resultados ganham mais peso.
 */
export function vocabularyFromLabels(labels: string[]): VocabEntry[] {
  const counts = new Map<string, { word: string; count: number }>();

  for (const label of labels) {
    // O label vem como "Avenida Paulista, Bela Vista, São Paulo, ...".
    const words = label
      .replace(/[,—-]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 1 && !/^\d/.test(w));

    for (const word of words) {
      const key = normalize(word);
      if (!key) continue;
      const current = counts.get(key);
      if (current) current.count += 1;
      else counts.set(key, { word, count: 1 });
    }
  }

  return [...counts.entries()].map(([key, { word, count }]) => ({
    word,
    key,
    // Acima do vocabulário base (1000) para refletir o que a API retornou agora.
    weight: 1500 + count,
  }));
}
