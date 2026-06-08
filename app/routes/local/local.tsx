import { useEffect } from "react";
import { data, Link, useLocation } from "react-router";
import useSWR from "swr";

import type { Route } from "./+types/local";
import {
  DetailLayout,
  DetailSkeletonList,
  SkeletonLine,
  type Crumb,
  type DetailPreview,
  type NavFrom,
} from "~/components/detailLayout";
import {
  CHILD_LEVEL,
  CHILD_TITLE,
  endpoints,
  fetcher,
  isNotFound,
  maskCep,
  TIPO_BADGE,
  type LocationTipo,
  type ResolveChild,
  type ResolveResponse,
} from "~/lib";

export function meta({ data: loaderData }: Route.MetaArgs) {
  const nome =
    loaderData && "node" in loaderData ? loaderData.node.nome : "Localização";
  return [{ title: `${nome} — Endereços Brasil` }];
}

// SSR (1º load): resolve o caminho de slugs no backend (fonte da verdade) para
// entregar HTML completo (SEO / link direto).
export async function loader({ params }: Route.LoaderArgs) {
  const path = params["*"];
  if (!path) return data({ ok: false as const }, { status: 404 });

  try {
    const resolved = await fetcher<ResolveResponse>(endpoints.resolve(path));
    return { ok: true as const, ...resolved };
  } catch (error) {
    if (isNotFound(error)) return data({ ok: false as const }, { status: 404 });
    throw error;
  }
}

// Navegação client-side não bloqueia: o componente busca via SWR (instantâneo)
// e mostra skeleton enquanto carrega. `hydrate` fica desligado, então no 1º load
// o React Router usa o dado do `loader` (sem refetch nem mismatch).
export async function clientLoader() {
  return null;
}

export default function LocalRoute({ loaderData, params }: Route.ComponentProps) {
  const location = useLocation();
  const path = params["*"] ?? "";

  // No 1º load (SSR) `loaderData` traz o resolve; em navegação client-side é null.
  const ssr =
    loaderData && "ok" in loaderData && loaderData.ok ? loaderData : null;
  const preview = (location.state as { preview?: DetailPreview } | null)
    ?.preview;

  const { data: resolved, error } = useSWR<ResolveResponse>(
    path ? endpoints.resolve(path) : null,
    // `keepPreviousData: false` (override do global): trocar de página dá
    // `data: undefined` → cai no skeleton, em vez de mostrar o nó anterior.
    { fallbackData: ssr ?? undefined, keepPreviousData: false }
  );

  // meta() só enxerga o loader; em navegação client-side atualizamos o título aqui.
  useEffect(() => {
    if (resolved) document.title = `${resolved.node.nome} — Endereços Brasil`;
  }, [resolved]);

  if (error) {
    const notFound = isNotFound(error);
    return (
      <DetailLayout title={notFound ? "Localização não encontrada" : "Erro"}>
        <p className="detail-status detail-status-error">
          {notFound
            ? "Não encontramos esse endereço na base."
            : "Não foi possível carregar agora. Tente novamente."}
        </p>
      </DetailLayout>
    );
  }

  // Loading (cache miss): cabeçalho do preview quando houver (mínimo shift), só a
  // lista entra em shimmer; sem preview, o cabeçalho também vira skeleton.
  if (!resolved) {
    return (
      <DetailLayout
        badge={preview?.badge}
        title={preview?.title ?? <SkeletonLine width="16rem" height="2.75rem" />}
        subtitle={
          preview?.subtitle ?? <SkeletonLine width="7rem" height="1.125rem" />
        }
        breadcrumb={preview?.breadcrumb}
        self={
          preview ? { href: location.pathname, label: preview.title } : undefined
        }
      >
        <DetailSkeletonList />
      </DetailLayout>
    );
  }

  const { level, node, breadcrumb, children, ceps } = resolved;
  const isRua = level === "rua";
  // Página atual: vai no state dos links pra o "voltar" do destino voltar pra cá.
  const self: NavFrom = { href: location.pathname, label: node.nome };

  const crumbs = breadcrumb.map((segment, index) => ({
    label: segment.nome,
    href: index < breadcrumb.length - 1 ? segment.href : undefined,
  }));

  // Base do breadcrumb dos filhos: todos os ancestrais + o nó atual, agora como
  // links (o filho é que será o "atual"). Reusado nos previews do drill-down.
  const crumbBase: Crumb[] = breadcrumb.map((segment) => ({
    label: segment.nome,
    href: segment.href,
  }));

  return (
    <DetailLayout
      badge={TIPO_BADGE[level]}
      title={node.nome}
      subtitle={`${node.ceps.toLocaleString("pt-BR")} ${node.ceps === 1 ? "CEP" : "CEPs"}`}
      breadcrumb={crumbs}
      self={self}
    >
      {(!isRua || children.length > 0) && (
        <DrillSection
          title={CHILD_TITLE[level]}
          items={children}
          from={self}
          childLevel={CHILD_LEVEL[level]}
          crumbBase={crumbBase}
        />
      )}

      {isRua && (
        <section className="detail-section">
          <h2 className="detail-section-title">
            CEPs
            {ceps.length > 0 && <span className="detail-count">{ceps.length}</span>}
          </h2>
          {ceps.length === 0 ? (
            <p className="detail-status">Sem CEPs cadastrados.</p>
          ) : (
            <ul className="detail-list">
              {ceps.map((item) => {
                const masked = maskCep(item.cep);
                // Preview do CEP: breadcrumb = caminho até a rua (já linkado) + o CEP.
                const cepPreview: DetailPreview = {
                  badge: "CEP",
                  title: masked,
                  breadcrumb: [...crumbBase, { label: masked }],
                };
                return (
                  <li key={item.cep}>
                    <Link
                      to={`/cep/${item.cep}`}
                      state={{ from: self, preview: cepPreview }}
                    >
                      <span className="detail-list-name">{masked}</span>
                      {item.complemento && (
                        <span className="detail-list-count">{item.complemento}</span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}
    </DetailLayout>
  );
}

function DrillSection({
  title,
  items,
  from,
  childLevel,
  crumbBase,
}: {
  title: string;
  items: ResolveChild[];
  from: NavFrom;
  childLevel: LocationTipo;
  crumbBase: Crumb[];
}) {
  return (
    <section className="detail-section">
      <h2 className="detail-section-title">
        {title}
        {items.length > 0 && <span className="detail-count">{items.length}</span>}
      </h2>
      {items.length === 0 ? (
        <p className="detail-status">Nada por aqui ainda.</p>
      ) : (
        <ul className="detail-list">
          {items.map((child) => {
            const childTitle = child.nome ?? child.bairro_nome ?? "—";
            // Dado já em mãos → o destino pinta o cabeçalho na hora (só a lista
            // dele entra em shimmer).
            const preview: DetailPreview = {
              badge: TIPO_BADGE[childLevel],
              title: childTitle,
              subtitle: `${child.ceps.toLocaleString("pt-BR")} ${child.ceps === 1 ? "CEP" : "CEPs"}`,
              breadcrumb: [...crumbBase, { label: childTitle }],
            };
            return (
              <li key={child.href}>
                <Link to={child.href} state={{ from, preview }}>
                  <span className="detail-list-name">{childTitle}</span>
                  <span className="detail-list-count">
                    {child.ceps} {child.ceps === 1 ? "CEP" : "CEPs"}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
