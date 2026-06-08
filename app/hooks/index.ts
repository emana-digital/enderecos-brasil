// Hooks de client. Só o autocomplete da home roda no cliente; o resto dos dados
// (CEP, drill-down) vem de loaders server-side.
export { useAddressSearch, type UseAddressSearchResult } from "./useAddressSearch";
export { useDebouncedValue } from "./useDebouncedValue";
export { useSearchHistory, type UseSearchHistory } from "./useSearchHistory";
export { useStats, type UseStatsResult } from "./useStats";
