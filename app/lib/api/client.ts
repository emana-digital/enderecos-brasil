// Cliente HTTP fino para a enderecos-brasil-api.
//
// A chave de cache do SWR é sempre a URL completa (string), por isso este módulo
// expõe construtores de URL (`endpoints`) + um `fetcher` único. Assim toda a
// aplicação compartilha o mesmo cache: a mesma URL só é buscada uma vez.

const DEFAULT_BASE_URL = "https://api.enderecosbrasil.emana.digital";

export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || DEFAULT_BASE_URL
).replace(/\/+$/, "");

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly body?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** Indica entrada do usuário inválida (ex.: `q` vazio). Fluxo normal de UI. */
export const isValidationError = (error: unknown): error is ApiError =>
  error instanceof ApiError && error.status === 422;

/** Indica recurso inexistente (ex.: CEP não cadastrado). Fluxo normal de UI. */
export const isNotFound = (error: unknown): error is ApiError =>
  error instanceof ApiError && error.status === 404;

/**
 * Fetcher global do SWR. A `key` é a URL (relativa à `API_BASE_URL`).
 * Lança {@link ApiError} para status não-2xx, preservando status + corpo.
 */
export async function fetcher<T>(path: string): Promise<T> {
  const url = path.startsWith("http") ? path : `${API_BASE_URL}${path}`;

  const response = await fetch(url, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => undefined);
    const message =
      (body && typeof body === "object" && "error" in body
        ? String((body as { error: unknown }).error)
        : undefined) ?? `Erro ${response.status} ao consultar a API`;
    throw new ApiError(response.status, message, body);
  }

  return response.json() as Promise<T>;
}

const qs = (params: Record<string, string | number | undefined | null>) => {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, String(value));
    }
  }
  const query = search.toString();
  return query ? `?${query}` : "";
};

export interface SearchParams {
  q: string;
  tipo?: "estado" | "cidade" | "bairro" | "rua";
  uf?: string;
  limit?: number;
}

/** Construtores de path — também servem como chaves de cache do SWR. */
export const endpoints = {
  search: ({ q, tipo, uf, limit }: SearchParams) =>
    `/locations/search${qs({ q, tipo, uf, limit })}`,

  cep: (cep: string) => `/locations/cep/${cep.replace(/\D/g, "")}`,

  // `path` é o caminho de slugs já montado (ex.: "sao_paulo/sao_paulo/centro").
  resolve: (path: string) => `/locations/resolve/${path.replace(/^\/+/, "")}`,

  states: () => `/locations/states`,

  cities: (params: { uf?: string; stateId?: number; limit?: number; offset?: number }) =>
    `/locations/cities${qs(params)}`,

  neighborhoods: (params: { cityId: number; limit?: number; offset?: number }) =>
    `/locations/neighborhoods${qs(params)}`,

  streets: (params: {
    cityId?: number;
    neighborhoodId?: number;
    limit?: number;
    offset?: number;
  }) => `/locations/streets${qs(params)}`,

  ceps: (params: {
    cityId?: number;
    neighborhoodId?: number;
    streetId?: number;
    limit?: number;
    offset?: number;
  }) => `/locations/ceps${qs(params)}`,

  stats: () => `/locations/stats`,
} as const;
