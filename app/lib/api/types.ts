// Contrato da API enderecos-brasil-api.
// Fonte: docs/frontend-integration.md (enderecos-brasil-api).

export type LocationTipo = "estado" | "cidade" | "bairro" | "rua";
export type ResultTipo = LocationTipo | "cep";

/** Segmento do caminho semântico (breadcrumb). `href` já vem cumulativo. */
export interface PathSegment {
  level: LocationTipo;
  nome: string;
  slug: string;
  href: string;
}

// --- /locations/search ---
export interface LocationResult {
  id: number | null; // null quando tipo === "cep"
  tipo: ResultTipo;
  label: string; // pronto para exibir (CEP já mascarado)
  logradouro: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string;
  uf: string;
  stateId: number;
  cityId: number | null;
  neighborhoodId: number | null;
  streetId: number | null;
  cep: string | null; // 8 dígitos, sem máscara
  relevancia: number; // 0 para resultados de CEP
  path: PathSegment[] | null; // null quando tipo === "cep"
  href: string; // destino pronto (ex.: /sao_paulo/.../rua, ou /cep/x)
}

// --- /locations/cep/:cep ---
export interface CepDetail {
  cep: string; // 8 dígitos, sem máscara
  logradouro: string | null;
  complemento: string | null;
  bairro: string | null;
  stateId: number;
  uf: string;
  estado: string;
  cityId: number;
  cidade: string;
  neighborhoodId: number | null;
  streetId: number | null;
  path: PathSegment[]; // estado → cidade → bairro → rua (para breadcrumb)
  href: string; // "/cep/01310100"
}

// --- /locations/resolve/{estado}/{cidade?}/{bairro?}/{rua?} ---
export interface ResolveNode {
  id: number;
  nivel: LocationTipo;
  nome: string;
  slug: string;
  ceps: number;
}

/**
 * Filho do drill-down. Níveis estado/cidade/bairro usam `nome`/`slug`; a rua
 * agregada por cidade usa `bairro_nome`/`bairro_slug`/`rua_slug`. Sempre tem
 * `href` pronto e `ceps` (contagem).
 */
export interface ResolveChild {
  nome?: string;
  slug?: string;
  bairro_nome?: string;
  bairro_slug?: string;
  rua_slug?: string;
  ceps: number;
  href: string;
}

export interface ResolveCep {
  cep: string;
  complemento: string | null;
}

export interface ResolveResponse {
  level: LocationTipo;
  node: ResolveNode;
  breadcrumb: PathSegment[];
  children: ResolveChild[];
  ceps: ResolveCep[]; // preenchido quando level === "rua"
}

// --- /locations/states ---
export interface StateItem {
  id: number;
  nome: string;
  uf: string;
  cidades: number;
  ceps: number;
}

// --- /locations/cities ---
export interface CityItem {
  id: number;
  nome: string;
  stateId: number;
  uf: string;
  ceps: number;
}

// --- /locations/neighborhoods ---
export interface NeighborhoodItem {
  id: number;
  nome: string;
  cityId: number;
  ceps: number;
}

// --- /locations/streets ---
export interface StreetItem {
  id: number;
  nome: string;
  cityId: number;
  neighborhoodId: number | null;
  ceps: number;
}

// --- /locations/ceps ---
export interface CepListItem {
  cep: string; // 8 dígitos, sem máscara
  logradouro: string | null;
  complemento: string | null;
  bairro: string | null;
  cityId: number;
  neighborhoodId: number | null;
  streetId: number | null;
}

// --- /locations/stats ---
export interface Stats {
  totais: Record<string, string>; // valores são strings
  topCidades: { cidade: string; estado: string; uf: string; ceps: number }[];
  porEstado: { uf: string; estado: string; ceps: number }[];
}

// --- health check ---
export interface HealthCheck {
  up: boolean;
  uptime: { seconds: number };
}
