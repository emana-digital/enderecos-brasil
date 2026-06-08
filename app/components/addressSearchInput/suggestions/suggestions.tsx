import {
  Buildings,
  ClockCounterClockwise,
  MapPin,
  MapTrifold,
  Path,
  Signpost,
} from "@phosphor-icons/react/dist/ssr";
import { clsx } from "clsx";
import { Fragment, type FC } from "react";

import { resultIdentity, type ResultTipo } from "~/lib";
import type { Suggestion } from "../types";

import "./suggestions.css";

const TIPO_ICON: Record<ResultTipo, FC<{ size?: number }>> = {
  estado: MapTrifold,
  cidade: Buildings,
  bairro: Path,
  rua: Signpost,
  cep: MapPin,
};

const SECTION_LABEL: Record<Suggestion["source"], string> = {
  recent: "Usados recentemente",
  api: "Resultados",
};

export interface SuggestionsProps {
  id: string;
  suggestions: Suggestion[];
  activeIndex: number;
  query: string;
  isLoading: boolean;
  error: unknown;
  /** Altura máxima da lista (px) para não passar do fim da tela. */
  maxHeight?: number;
  onSelect: (suggestion: Suggestion) => void;
  onHover: (index: number) => void;
}

export const Suggestions: FC<SuggestionsProps> = ({
  id,
  suggestions,
  activeIndex,
  query,
  isLoading,
  error,
  maxHeight,
  onSelect,
  onHover,
}) => {
  const hasResults = suggestions.length > 0;

  return (
    <div className="suggestions" id={id} role="listbox" aria-label="Sugestões">
      {hasResults && (
        <ul
          className="suggestions-list"
          style={maxHeight ? { maxHeight } : undefined}
        >
          {suggestions.map((suggestion, index) => {
            const { result, source } = suggestion;
            const tipo = result.tipo;
            const Icon = source === "recent" ? ClockCounterClockwise : TIPO_ICON[tipo];

            const showHeader =
              index === 0 || suggestions[index - 1].source !== source;

            return (
              <Fragment key={`${source}:${resultIdentity(result)}`}>
                {showHeader && (
                  <li className="suggestions-section" role="presentation">
                    {SECTION_LABEL[source]}
                  </li>
                )}
                <li
                  id={`${id}-option-${index}`}
                  role="option"
                  aria-selected={index === activeIndex}
                  className={clsx("suggestion", {
                    "is-active": index === activeIndex,
                  })}
                  onMouseDown={(event) => {
                    // mousedown (não click) para selecionar antes do blur fechar.
                    event.preventDefault();
                    onSelect(suggestion);
                  }}
                  onMouseEnter={() => onHover(index)}
                >
                  <span className="suggestion-icon">
                    <Icon size={20} />
                  </span>
                  <span className="suggestion-label">{result.label}</span>
                </li>
              </Fragment>
            );
          })}
        </ul>
      )}

      {!hasResults && isLoading && (
        <div className="suggestions-status">Buscando…</div>
      )}

      {!hasResults && !isLoading && !error && query.trim() && (
        <div className="suggestions-status">
          Nenhum resultado para “{query.trim()}”.
        </div>
      )}

      {!hasResults && !isLoading && Boolean(error) && (
        <div className="suggestions-status suggestions-status-error">
          Não foi possível buscar agora. Tente novamente.
        </div>
      )}
    </div>
  );
};
