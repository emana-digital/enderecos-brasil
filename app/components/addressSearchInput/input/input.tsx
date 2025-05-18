import {
  memo,
  startTransition,
  useCallback,
  useState,
  type ChangeEventHandler,
  type FC,
} from "react";

import "./input.css";

export const Input: FC<{
  onChangeText: (text: string) => void;
  onFocus: () => void;
  onBlur: () => void;
}> = memo(
  ({ onChangeText, onFocus, onBlur }) => {
    const [inputText, setInputText] = useState<string>("");

    const onChangeTextInput = useCallback<ChangeEventHandler<HTMLInputElement>>(
      (event) => {
        const inputValue = event.target.value;
        setInputText(inputValue);
        startTransition(() => {
          onChangeText(inputValue);
        });
      },
      [onChangeText]
    );

    const onFocusInput = useCallback(() => {
      onFocus();
    }, [onFocus]);

    const onBlurInput = useCallback(() => {
      onBlur();
    }, [onBlur]);

    return (
      <input
        type="text"
        value={inputText}
        onChange={onChangeTextInput}
        onFocus={onFocusInput}
        onBlur={onBlurInput}
        autoComplete="off"
        spellCheck="false"
      />
    );
  },
  () => true
);

Input.displayName = "Input";
