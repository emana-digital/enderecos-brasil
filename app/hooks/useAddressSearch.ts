import useSWR from "swr";

import { endpoints, type LocationResult, type ParsedQuery } from "~/lib";

export interface UseAddressSearchResult {
  results: LocationResult[];
  /** true só na primeira carga de uma query nova (sem dado em cache ainda). */
  isLoading: boolean;
  /** true enquanto revalida mantendo o resultado anterior visível. */
  isValidating: boolean;
  error: unknown;
}

/**
 * Busca em `/locations/search` via SWR. A chave de cache é a URL completa, então
 * a mesma query nunca é refeita: apagar/reescrever letras volta instantâneo do
 * cache. `keepPreviousData` (global) evita o flicker entre uma letra e outra.
 *
 * Passe `null`/`q` vazio para não buscar (SWR ignora a key nula).
 */
export function useAddressSearch(
  query: ParsedQuery | null
): UseAddressSearchResult {
  const key = query && query.q.trim() ? endpoints.search(query) : null;

  const { data, error, isLoading, isValidating } = useSWR<LocationResult[]>(key);

  return {
    results: data ?? [],
    isLoading,
    isValidating,
    error,
  };
}
