import { useCallback, useEffect, useMemo, useState } from "react";

import {
  type HistoryEntry,
  type LocationResult,
  type VocabEntry,
  readHistory,
  rememberSelection,
  vocabularyFromHistory,
} from "~/lib";

export interface UseSearchHistory {
  history: HistoryEntry[];
  /** Vocabulário ponderado pelo uso, para o autocomplete inline aprender. */
  learnedVocab: VocabEntry[];
  /** Registra uma seleção e re-rankeia o histórico. */
  remember: (result: LocationResult) => void;
}

/**
 * Expõe o "aprendizado" do input como estado React. Lê o localStorage só no
 * cliente (após hidratar), evitando divergência de SSR.
 */
export function useSearchHistory(): UseSearchHistory {
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    setHistory(readHistory());
  }, []);

  const remember = useCallback((result: LocationResult) => {
    setHistory(rememberSelection(result));
  }, []);

  const learnedVocab = useMemo(
    () => vocabularyFromHistory(history),
    [history]
  );

  return { history, learnedVocab, remember };
}
