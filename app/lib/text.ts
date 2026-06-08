/**
 * Normaliza texto para comparação: minúsculas, sem acentos, espaços colapsados.
 * "São Paulo " → "sao paulo". A API ignora acentos; aqui replicamos isso para
 * casar sugestões locais (vocabulário, histórico) com o que o usuário digita.
 */
export const normalize = (text: string): string =>
  text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");

/** Colapsa espaços duplicados sem alterar caixa/acentos (para exibir). */
export const collapseSpaces = (text: string): string =>
  text.replace(/\s{2,}/g, " ");

/** Quebra em palavras (sem vazios). Usado para tokenizar labels da API. */
export const tokenize = (text: string): string[] =>
  normalize(text)
    .replace(/[,]/g, " ")
    .split(" ")
    .filter(Boolean);

/**
 * Separa o valor digitado em "tudo antes da palavra atual" + "palavra atual".
 * A palavra atual é o trecho após o último espaço/vírgula. Se o valor termina
 * com separador, não há palavra atual (token vazio) — não sugerimos nada.
 *
 * "Avenida Pau" → { prefix: "Avenida ", token: "Pau" }
 * "Avenida "    → { prefix: "Avenida ", token: "" }
 */
export const splitActiveToken = (
  value: string
): { prefix: string; token: string } => {
  const match = value.match(/[^\s,]*$/);
  const token = match ? match[0] : "";
  const prefix = value.slice(0, value.length - token.length);
  return { prefix, token };
};

/**
 * Caixa título para nomes de logradouro/cidade ("avenida paulista" →
 * "Avenida Paulista"), mantendo conectores comuns em minúsculo.
 */
const LOWER_CASE_WORDS = new Set(["de", "da", "do", "das", "dos", "e"]);

export const titleCase = (text: string): string =>
  text
    .toLowerCase()
    .split(" ")
    .map((word, index) =>
      index > 0 && LOWER_CASE_WORDS.has(word)
        ? word
        : word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join(" ");
