import { useEffect, useState } from "react";

/**
 * Versão "atrasada" de um valor. Cada tecla atualiza o input na hora (UI
 * instantânea), mas o valor que dispara o fetch só muda após `delay` ms parado.
 * Junto com o cache do SWR, isso evita rajadas de requisições idênticas sem
 * perder a sensação de busca a cada letra.
 */
export function useDebouncedValue<T>(value: T, delay = 150): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
}
