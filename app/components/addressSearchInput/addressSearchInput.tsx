import { MagnifyingGlass } from "@phosphor-icons/react/dist/ssr";
import { Form } from "react-router";
import { clsx } from "clsx";
import {
  startTransition,
  useCallback,
  useEffect,
  useState,
  type ChangeEventHandler,
} from "react";

import { Input } from "./input";

import "./addressSearchInput.css";

export function AddressSearchInput() {
  const [isOnFocus, setIsOnFocus] = useState<boolean>(false);

  const hasHistory = useState(false);

  const suggestions = [
    "Rua Mitsuzo Taguchi",
    "Avenida Guedner",
    "Rua Dom João VI",
    "Maringá, PR",
  ];

  const [suggestion, setSuggestion] = useState(0);

  /**
   * Placeholder
   */
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    const changeSuggestion = () => {
      timeoutId = setTimeout(() => {
        setSuggestion((prevSuggestion) => {
          const nextSuggestion = prevSuggestion + 1;

          if (nextSuggestion > suggestions.length - 1) {
            return 0;
          }

          return nextSuggestion;
        });

        changeSuggestion();
      }, 3000);
    };

    changeSuggestion();

    return () => {
      clearTimeout(timeoutId);
    };
  }, [suggestions.length]);

  const onBlur = useCallback(() => {
    setIsOnFocus(false);
  }, []);

  const onFocus = useCallback(() => {
    setIsOnFocus(true);
  }, []);

  const [debugContainerText, setDebugContainerText] = useState("");

  const parseInput = useCallback((input: string) => {
    /* substitui 2 espaços ou mais por 1 espaço */
    const whiteSpaceNormalized = input.trim().replace(/[ ]{2,}/gi, " ");
    const words: string[] = whiteSpaceNormalized.split(" ");

    console.log(words);

    const firstWord = words[0];

    let locationType:
      | "not_defined"
      | "building"
      | "street"
      | "neighbourhood"
      | "city"
      | "state" = "not_defined";

    if (firstWord === "rua") {
      locationType = "street";
    }

    const parsedInput = {
      searchType: locationType,
      words: words.length,
      input,
    };

    return parsedInput;
  }, []);

  const onChangeText = useCallback(
    (inputValue: string) => {
      const parsedInput = parseInput(inputValue);
      setDebugContainerText(JSON.stringify(parsedInput));
    },
    [parseInput]
  );

  return (
    <div className={clsx("search-container", { "is-on-focus": isOnFocus })}>
      <Form className="input-container">
        <Input onBlur={onBlur} onChangeText={onChangeText} onFocus={onFocus} />
        <div className="search-divider" />
        <button type="submit" className="submit-search" title="Pesquisar">
          <MagnifyingGlass size={24} color="rgba(255, 255, 255, 0.33)" />
        </button>
      </Form>
      <div className="debug-container">{debugContainerText}</div>
    </div>
  );
}
