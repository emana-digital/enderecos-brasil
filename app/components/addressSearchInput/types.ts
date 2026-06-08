import type { LocationResult } from "~/lib";

/** Uma linha do dropdown de sugestões. `source` separa as seções visuais. */
export interface Suggestion {
  result: LocationResult;
  source: "recent" | "api";
}
