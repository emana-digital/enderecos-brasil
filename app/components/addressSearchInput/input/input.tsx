import {
  forwardRef,
  type ChangeEventHandler,
  type FocusEventHandler,
  type KeyboardEventHandler,
} from "react";

import "./input.css";

export interface InputProps {
  value: string;
  /** Cauda da sugestão inline (ghost text) exibida após o texto digitado. */
  ghostTail: string;
  placeholder?: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
  onKeyDown: KeyboardEventHandler<HTMLInputElement>;
  onFocus: FocusEventHandler<HTMLInputElement>;
  onBlur: FocusEventHandler<HTMLInputElement>;
  ariaControls?: string;
  ariaActiveDescendant?: string;
}

/**
 * Campo controlado com autocomplete inline. A camada `ghost` fica exatamente
 * sobre o input: o texto digitado é renderizado transparente (só pra ocupar a
 * largura certa) e a cauda sugerida aparece em cinza logo após o cursor.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    value,
    ghostTail,
    placeholder,
    onChange,
    onKeyDown,
    onFocus,
    onBlur,
    ariaControls,
    ariaActiveDescendant,
  },
  ref
) {
  return (
    <div className="address-input">
      <div className="address-input-ghost" aria-hidden="true">
        <span className="ghost-typed">{value}</span>
        <span className="ghost-tail">{ghostTail}</span>
      </div>
      <input
        ref={ref}
        type="text"
        className="address-input-field"
        value={value}
        placeholder={placeholder}
        onChange={onChange}
        onKeyDown={onKeyDown}
        onFocus={onFocus}
        onBlur={onBlur}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        role="combobox"
        aria-expanded={Boolean(ariaControls)}
        aria-autocomplete="list"
        aria-controls={ariaControls}
        aria-activedescendant={ariaActiveDescendant}
      />
    </div>
  );
});
