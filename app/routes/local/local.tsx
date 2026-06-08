import { data, Link, useLocation } from "react-router";

import type { Route } from "./+types/local";
import { DetailLayout, type NavFrom } from "~/components/detailLayout";
import {
  endpoints,
  fetcher,
  isNotFound,
  maskCep,
  type LocationTipo,
  type ResolveChild,
  type ResolveResponse,
} from "~/lib";

const TIPO_BADGE: Record<LocationTipo, string> = {
  estado: "Estado",
  cidade: "Cidade",
  bairro: "Bairro",
  rua: "Rua",
};

const CHILD_TITLE: Record<LocationTipo, string> = {
  estado: "Cidades",
  cidade: "Bairros",
  bairro: "Ruas",
  rua: "Trechos por bairro",
};

export function meta({ data: loaderData }: Route.MetaArgs) {
  const nome =
    loaderData && "node" in loaderData ? loaderData.node.nome : "Localização";
  return [{ title: `${nome} — Endereços Brasil` }];
}

// Tudo server-side: o caminho de slugs da URL é resolvido pelo backend (fonte da
// verdade). Um fetch por página; breadcrumb e filhos já vêm com href prontos.
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

export default function LocalRoute({ loaderData }: Route.ComponentProps) {
  const location = useLocation();
  if (!loaderData.ok) {
    return (
      <DetailLayout title="Localização não encontrada">
        <p className="detail-status detail-status-error">
          Não encontramos esse endereço na base.
        </p>
      </DetailLayout>
    );
  }

  const { level, node, breadcrumb, children, ceps } = loaderData;
  const isRua = level === "rua";
  // Página atual: vai no state dos links pra o "voltar" do destino voltar pra cá.
  const self: NavFrom = { href: location.pathname, label: node.nome };

  const crumbs = breadcrumb.map((segment, index) => ({
    label: segment.nome,
    href: index < breadcrumb.length - 1 ? segment.href : undefined,
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
        <DrillSection title={CHILD_TITLE[level]} items={children} from={self} />
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
              {ceps.map((item) => (
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
}: {
  title: string;
  items: ResolveChild[];
  from: NavFrom;
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
          {items.map((child) => (
            <li key={child.href}>
              <Link to={child.href} state={{ from }}>
                <span className="detail-list-name">
                  {child.nome ?? child.bairro_nome ?? "—"}
                </span>
                <span className="detail-list-count">
                  {child.ceps} {child.ceps === 1 ? "CEP" : "CEPs"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
