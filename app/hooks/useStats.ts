import useSWR from "swr";

import { endpoints, type Stats } from "~/lib";

export interface UseStatsResult {
  stats: Stats | undefined;
  isLoading: boolean;
  error: unknown;
}

/**
 * Busca `/locations/stats` via SWR. A key é a URL, então o resultado fica em
 * cache global e é compartilhado por toda a aplicação (uma só requisição).
 */
export function useStats(): UseStatsResult {
  const { data, error, isLoading } = useSWR<Stats>(endpoints.stats());

  return { stats: data, isLoading, error };
}
