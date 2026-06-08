import { data, Link, useLocation } from "react-router";

import type { Route } from "./+types/cep";
import { DetailLayout, Field, type NavFrom } from "~/components/detailLayout";
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

// Tudo carregado no servidor: o CEP é dado estático e totalmente reconstruível
// a partir da URL, então não há fetch no cliente aqui.
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

  // CEPs vizinhos da mesma rua (drill-down final).
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

export default function CepRoute({ loaderData }: Route.ComponentProps) {
  const location = useLocation();
  if (!loaderData.found) {
    const masked = maskCep(loaderData.cep);
    return (
      <DetailLayout badge="CEP" title={masked} subtitle="CEP não encontrado">
        <p className="detail-status">
          Não encontramos esse CEP na base. Confira os dígitos e tente de novo.
        </p>
      </DetailLayout>
    );
  }

  const { detail, siblings } = loaderData;
  const masked = maskCep(detail.cep);
  const self: NavFrom = { href: location.pathname, label: masked };

  // Breadcrumb: caminho até a rua (links prontos) + o próprio CEP (atual).
  const crumbs = [
    ...(detail.path ?? []).map((segment) => ({
      label: segment.nome,
      href: segment.href,
    })),
    { label: masked },
  ];

  return (
    <DetailLayout
      badge="CEP"
      title={masked}
      subtitle={detail.logradouro ?? undefined}
      breadcrumb={crumbs}
      self={self}
    >
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

      {siblings.length > 0 && (
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
      )}
    </DetailLayout>
  );
}
