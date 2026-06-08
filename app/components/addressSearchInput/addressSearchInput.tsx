import { MagnifyingGlass } from "@phosphor-icons/react/dist/ssr";
import { clsx } from "clsx";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
} from "react";
import { useNavigate } from "react-router";

import {
  useAddressSearch,
  useDebouncedValue,
  useSearchHistory,
} from "~/hooks";
import {
  matchHistory,
  parseQuery,
  readHomeSearch,
  resultIdentity,
  splitActiveToken,
  suggestWordCompletion,
  vocabularyFromLabels,
  writeHomeSearch,
} from "~/lib";

import { Input } from "./input";
import { Suggestions } from "./suggestions";
import type { Suggestion } from "./types";

import "./addressSearchInput.css";

const PLACEHOLDERS = [
  "Rua Mitsuzo Taguchi",
  "Avenida Guedner",
  "Rua Dom João VI",
  "Maringá, PR",
  "01310-100",
];

const MAX_RECENT = 4;
const MAX_RESULTS = 8;

export function AddressSearchInput() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  const [value, setValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [dropdownMaxHeight, setDropdownMaxHeight] = useState<number>();

  // Ao voltar (histórico), restaura o que estava digitado e reabre o dropdown
  // (resultados saem do cache do SWR). A logo limpa esse estado → home "do zero".
  // Feito em efeito (não no initializer) para não divergir do HTML do SSR.
  useEffect(() => {
    const saved = readHomeSearch();
    if (!saved) return;
    setValue(saved);
    requestAnimationFrame(() => inputRef.current?.focus());
  }, []);

  // Cada letra atualiza o input na hora; o fetch só dispara após o debounce.
  const debounced = useDebouncedValue(value, 150);
  const parsed = useMemo(() => parseQuery(debounced, MAX_RESULTS), [debounced]);
  const searchQuery = parsed.q.trim() ? parsed : null;

  const { results, isLoading, error } = useAddressSearch(searchQuery);
  const { history, learnedVocab, remember } = useSearchHistory();

  // Vocabulário "ao vivo": palavras dos resultados atuais alimentam o ghost text.
  const dynamicVocab = useMemo(
    () => vocabularyFromLabels(results.map((result) => result.label)),
    [results]
  );

  // --- Sugestão inline (ghost text) -----------------------------------------
  const { token } = splitActiveToken(value);
  const ghostWord =
    isFocused && activeIndex < 0
      ? suggestWordCompletion(token, {
          dynamic: dynamicVocab,
          learned: learnedVocab,
        })
      : null;
  const ghostTail = ghostWord ? ghostWord.slice(token.length) : "";

  // --- Lista de sugestões (recentes + resultados da API) --------------------
  const suggestions = useMemo<Suggestion[]>(() => {
    const recent = matchHistory(debounced, history, MAX_RECENT).map(
      (entry): Suggestion => ({ result: entry.result, source: "recent" })
    );
    const seen = new Set(recent.map((s) => resultIdentity(s.result)));
    const api = results
      .filter((result) => !seen.has(resultIdentity(result)))
      .slice(0, MAX_RESULTS)
      .map((result): Suggestion => ({ result, source: "api" }));
    return [...recent, ...api];
  }, [debounced, history, results]);

  const showDropdown =
    isFocused &&
    !dismissed &&
    (suggestions.length > 0 || parsed.q.trim().length > 0);

  // Mantém o índice ativo dentro dos limites quando a lista muda.
  useEffect(() => {
    setActiveIndex((index) =>
      index >= suggestions.length ? suggestions.length - 1 : index
    );
  }, [suggestions.length]);

  // Limita o dropdown ao espaço até o fim da tela: ele rola por dentro em vez de
  // empurrar/rolar a página.
  useEffect(() => {
    if (!showDropdown) return;
    const update = () => {
      const el = inputRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const available = window.innerHeight - rect.bottom - 24;
      setDropdownMaxHeight(Math.max(180, available));
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [showDropdown]);

  const moveCaretToEnd = useCallback(() => {
    requestAnimationFrame(() => {
      const input = inputRef.current;
      if (!input) return;
      input.focus();
      const end = input.value.length;
      input.setSelectionRange(end, end);
    });
  }, []);

  const acceptGhost = useCallback(() => {
    const split = splitActiveToken(value);
    const word = suggestWordCompletion(split.token, {
      dynamic: dynamicVocab,
      learned: learnedVocab,
    });
    if (!word) return false;
    const next = `${split.prefix}${word} `;
    setValue(next);
    writeHomeSearch(next);
    setActiveIndex(-1);
    setDismissed(false);
    moveCaretToEnd();
    return true;
  }, [value, dynamicVocab, learnedVocab, moveCaretToEnd]);

  const select = useCallback(
    (suggestion: Suggestion) => {
      const { result } = suggestion;
      // O backend entrega o destino pronto (slug ou /cep/x). Fallback p/ CEP
      // cobre itens "recentes" salvos antes do backend passar a mandar `href`.
      const href =
        result.href ??
        (result.tipo === "cep" && result.cep ? `/cep/${result.cep}` : null);
      if (!href) return;
      remember(result);
      setIsFocused(false);
      setDismissed(true);
      inputRef.current?.blur();
      // Veio da home: o "voltar" da página de destino volta pra cá.
      navigate(href, { state: { from: { href: "/", label: "a busca" } } });
    },
    [navigate, remember]
  );

  const onChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const next = event.target.value;
    setValue(next);
    writeHomeSearch(next);
    setActiveIndex(-1);
    setDismissed(false);
  }, []);

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      switch (event.key) {
        case "ArrowDown":
          if (suggestions.length === 0) break;
          event.preventDefault();
          setDismissed(false);
          setActiveIndex((index) =>
            Math.min(index + 1, suggestions.length - 1)
          );
          break;

        case "ArrowUp":
          if (suggestions.length === 0) break;
          event.preventDefault();
          setActiveIndex((index) => Math.max(index - 1, -1));
          break;

        case "Tab":
          if (ghostTail) {
            event.preventDefault();
            acceptGhost();
          }
          break;

        case "ArrowRight": {
          const input = event.currentTarget;
          const atEnd = input.selectionStart === input.value.length;
          if (ghostTail && atEnd) {
            event.preventDefault();
            acceptGhost();
          }
          break;
        }

        case "Enter":
          event.preventDefault();
          // Enter = ir para o resultado (o ativo, ou o primeiro). A palavra
          // fantasma se completa por Tab/→; só usa Enter se não há resultados.
          if (activeIndex >= 0 && suggestions[activeIndex]) {
            select(suggestions[activeIndex]);
          } else if (suggestions.length > 0) {
            select(suggestions[0]);
          } else if (ghostTail) {
            acceptGhost();
          }
          break;

        case "Escape":
          if (showDropdown) {
            event.preventDefault();
            setDismissed(true);
            setActiveIndex(-1);
          }
          break;
      }
    },
    [suggestions, ghostTail, acceptGhost, activeIndex, select, showDropdown]
  );

  // --- Placeholder rotativo (só quando vazio) -------------------------------
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  useEffect(() => {
    if (value) return;
    const id = setInterval(() => {
      setPlaceholderIndex((index) => (index + 1) % PLACEHOLDERS.length);
    }, 3000);
    return () => clearInterval(id);
  }, [value]);

  const activeDescendant =
    activeIndex >= 0 ? `${listId}-option-${activeIndex}` : undefined;

  return (
    <div className={clsx("search-container", { "is-on-focus": isFocused })}>
      <form
        className="input-container"
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          if (suggestions.length > 0) select(suggestions[activeIndex] ?? suggestions[0]);
        }}
      >
        <Input
          ref={inputRef}
          value={value}
          ghostTail={ghostTail}
          placeholder={`Ex.: ${PLACEHOLDERS[placeholderIndex]}`}
          onChange={onChange}
          onKeyDown={onKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          ariaControls={showDropdown ? listId : undefined}
          ariaActiveDescendant={activeDescendant}
        />
        <div className="search-divider" />
        <button type="submit" className="submit-search" title="Pesquisar">
          <MagnifyingGlass size={24} color="rgba(255, 255, 255, 0.5)" />
        </button>

        {showDropdown && (
          <Suggestions
            id={listId}
            suggestions={suggestions}
            activeIndex={activeIndex}
            query={parsed.q}
            isLoading={isLoading}
            error={error}
            maxHeight={dropdownMaxHeight}
            onSelect={select}
            onHover={setActiveIndex}
          />
        )}
      </form>

      {parsed.uf && (
        <p className="search-hint">
          Refinando por <strong>{parsed.uf}</strong>
        </p>
      )}
    </div>
  );
}
