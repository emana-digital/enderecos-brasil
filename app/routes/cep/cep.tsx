import { data, Link, useLocation } from "react-router";
import useSWR from "swr";

import type { Route } from "./+types/cep";
import {
  DetailLayout,
  DetailSkeletonFields,
  DetailSkeletonList,
  Field,
  SkeletonLine,
  type DetailPreview,
  type NavFrom,
} from "~/components/detailLayout";
import {
  endpoints,
  fetcher,
  isNotFound,
  maskCep,
  unmaskCep,
  type CepDetail,
  type CepListItem,
} from "~/lib";

export function meta({ params }: Route.MetaArgs) {
  const masked = maskCep(unmaskCep(params.cep));
  return [
    { title: `CEP ${masked} — Endereços Brasil` },
    { name: "description", content: `Endereço completo do CEP ${masked}.` },
  ];
}

// SSR (1º load): CEP + vizinhos da mesma rua, para HTML completo (SEO/link direto).
export async function loader({ params }: Route.LoaderArgs) {
  const cep = unmaskCep(params.cep);
  if (cep.length !== 8) {
    return data({ found: false as const, cep }, { status: 400 });
  }

  let detail: CepDetail;
  try {
    detail = await fetcher<CepDetail>(endpoints.cep(cep));
  } catch (error) {
    if (isNotFound(error)) {
      return data({ found: false as const, cep }, { status: 404 });
    }
    throw error;
  }

  const siblings = detail.streetId
    ? await fetcher<CepListItem[]>(
        endpoints.ceps({ streetId: detail.streetId, limit: 60 })
      )
    : [];

  return {
    found: true as const,
    detail,
    siblings: siblings.filter((item) => item.cep !== cep),
  };
}

// Navegação client-side não bloqueia: busca via SWR + skeletons (ver local.tsx).
export async function clientLoader() {
  return null;
}

export default function CepRoute({ loaderData, params }: Route.ComponentProps) {
  const location = useLocation();
  const cep = unmaskCep(params.cep);
  const masked = maskCep(cep);

  // No 1º load (SSR) `loaderData` traz CEP + vizinhos; em navegação é null.
  const ssr =
    loaderData && "found" in loaderData && loaderData.found ? loaderData : null;
  const ssrNotFound =
    loaderData && "found" in loaderData && !loaderData.found;
  const preview = (location.state as { preview?: DetailPreview } | null)
    ?.preview;

  const invalid = cep.length !== 8;
  const { data: detail, error } = useSWR<CepDetail>(
    invalid || ssrNotFound ? null : endpoints.cep(cep),
    { fallbackData: ssr?.detail, keepPreviousData: false }
  );

  const { data: siblingsData } = useSWR<CepListItem[]>(
    detail?.streetId
      ? endpoints.ceps({ streetId: detail.streetId, limit: 60 })
      : null,
    { fallbackData: ssr?.siblings, keepPreviousData: false }
  );

  if (invalid || ssrNotFound || (error && isNotFound(error))) {
    return (
      <DetailLayout badge="CEP" title={masked} subtitle="CEP não encontrado">
        <p className="detail-status">
          Não encontramos esse CEP na base. Confira os dígitos e tente de novo.
        </p>
      </DetailLayout>
    );
  }

  if (error) {
    return (
      <DetailLayout badge="CEP" title={masked} subtitle="Erro">
        <p className="detail-status detail-status-error">
          Não foi possível carregar agora. Tente novamente.
        </p>
      </DetailLayout>
    );
  }

  const self: NavFrom = { href: location.pathname, label: masked };
  const loading = !detail;
  const siblingsLoading = !!detail?.streetId && siblingsData === undefined;
  const siblings = (siblingsData ?? []).filter((item) => item.cep !== cep);

  // Breadcrumb: caminho até a rua (links prontos) + o próprio CEP (atual). Durante
  // o loading usa o preview do link (mesmo formato) → aparece na hora, sem shift.
  const crumbs = detail
    ? [
        ...(detail.path ?? []).map((segment) => ({
          label: segment.nome,
          href: segment.href,
        })),
        { label: masked },
      ]
    : preview?.breadcrumb;

  return (
    <DetailLayout
      badge="CEP"
      title={masked}
      subtitle={
        loading ? (
          <SkeletonLine width="13rem" height="1.125rem" />
        ) : (
          (detail.logradouro ?? undefined)
        )
      }
      breadcrumb={crumbs}
      self={self}
    >
      {loading ? (
        <DetailSkeletonFields />
      ) : (
        <div className="detail-grid">
          <Field label="CEP" value={masked} />
          <Field label="Logradouro" value={detail.logradouro} />
          <Field label="Complemento" value={detail.complemento} />
          <Field label="Bairro" value={detail.bairro} />
          <Field label="Cidade" value={detail.cidade} />
          <Field
            label="Estado"
            value={detail.estado ? `${detail.estado} (${detail.uf})` : detail.uf}
          />
        </div>
      )}

      {loading || siblingsLoading ? (
        <DetailSkeletonList count={6} />
      ) : siblings.length > 0 ? (
        <section className="detail-section">
          <h2 className="detail-section-title">
            Outros CEPs nesta rua
            <span className="detail-count">{siblings.length}</span>
          </h2>
          <ul className="detail-list">
            {siblings.map((item) => (
              <li key={item.cep}>
                <Link to={`/cep/${item.cep}`} state={{ from: self }}>
                  <span className="detail-list-name">{maskCep(item.cep)}</span>
                  {item.complemento && (
                    <span className="detail-list-count">{item.complemento}</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </DetailLayout>
  );
}
