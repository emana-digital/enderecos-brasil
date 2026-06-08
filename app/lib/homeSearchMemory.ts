// Lembra o que estava digitado na busca da home, por aba (sessionStorage), para
// que ao voltar (botão voltar / histórico) o input reapareça no estado anterior
// em vez de vazio. Clicar na logo limpa, voltando a home "do zero".

const KEY = "eb:home-search:v1";

const isBrowser = (): boolean =>
  typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";

export function readHomeSearch(): string {
  if (!isBrowser()) return "";
  try {
    return window.sessionStorage.getItem(KEY) ?? "";
  } catch {
    return "";
  }
}

export function writeHomeSearch(value: string): void {
  if (!isBrowser()) return;
  try {
    if (value) window.sessionStorage.setItem(KEY, value);
    else window.sessionStorage.removeItem(KEY);
  } catch {
    // best effort
  }
}

export function clearHomeSearch(): void {
  if (!isBrowser()) return;
  try {
    window.sessionStorage.removeItem(KEY);
  } catch {
    // best effort
  }
}
