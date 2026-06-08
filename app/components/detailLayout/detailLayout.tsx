import { ArrowLeft, CaretRight } from "@phosphor-icons/react/dist/ssr";
import { Fragment, type FC, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router";

import { Header } from "~/routes/home/header";

import "./detailLayout.css";

export interface Crumb {
  label: string;
  href?: string; // ausente = nível atual (negrito, sem link)
}

/** Descritor da página de origem, passado via state pra o "voltar" saber o destino. */
export interface NavFrom {
  href: string;
  label: string;
}

export interface DetailLayoutProps {
  badge?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  breadcrumb?: Crumb[];
  /** Página atual (href + rótulo) — vai no state dos links pra alimentar o voltar. */
  self?: NavFrom;
  children: ReactNode;
}

/**
 * Voltar = página anterior DE VERDADE quando dá. O `state.from` (de onde a pessoa
 * veio, gravado na navegação) é a fonte: ex.: home → rua mostra "Voltar para a
 * busca" e faz history-back pra home. Em link direto/refresh não há `from` (state
 * é nulo no SSR e no cliente — sem mismatch de hidratação), então cai pro pai do
 * breadcrumb e, por fim, pra home. Nunca usamos `location.key` (não é estável
 * entre servidor e cliente).
 */
const BackButton: FC<{ breadcrumb?: Crumb[] }> = ({ breadcrumb }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: NavFrom } | null)?.from;
  const parent =
    breadcrumb && breadcrumb.length > 1
      ? breadcrumb[breadcrumb.length - 2]
      : undefined;

  const label = from
    ? `Voltar para ${from.label}`
    : parent
      ? `Voltar para ${parent.label}`
      : "Voltar para a busca";

  const onClick = () => {
    if (from) navigate(-1); // página anterior real (de onde veio)
    else if (parent?.href) navigate(parent.href); // link direto: sobe um nível
    else navigate("/");
  };

  return (
    <button type="button" className="detail-back" onClick={onClick}>
      <ArrowLeft size={16} weight="bold" />
      {label}
    </button>
  );
};

/** Trilha de migalhas; o último item (sem href) é o nível atual, em negrito. */
const Breadcrumb: FC<{ crumbs: Crumb[]; self?: NavFrom }> = ({
  crumbs,
  self,
}) => (
  <nav className="detail-crumbs" aria-label="Caminho">
    {crumbs.map((crumb, index) => (
      <Fragment key={`${crumb.label}-${index}`}>
        {index > 0 && (
          <CaretRight size={12} weight="bold" className="detail-crumb-sep" />
        )}
        {crumb.href ? (
          <Link
            to={crumb.href}
            state={self ? { from: self } : undefined}
            className="detail-crumb"
          >
            {crumb.label}
          </Link>
        ) : (
          <span className="detail-crumb is-current" aria-current="page">
            {crumb.label}
          </span>
        )}
      </Fragment>
    ))}
  </nav>
);

/** Moldura das páginas de detalhe: header do site + cabeçalho + voltar. */
export const DetailLayout: FC<DetailLayoutProps> = ({
  badge,
  title,
  subtitle,
  breadcrumb,
  self,
  children,
}) => (
  <>
    <Header />
    <main className="detail">
      <div className="detail-content">
        <BackButton breadcrumb={breadcrumb} />

        {breadcrumb && breadcrumb.length > 0 && (
          <Breadcrumb crumbs={breadcrumb} self={self} />
        )}

        <header className="detail-head">
          {badge && <span className="detail-badge">{badge}</span>}
          <h1>{title}</h1>
          {subtitle && <p className="detail-subtitle">{subtitle}</p>}
        </header>

        {children}
      </div>
    </main>
  </>
);

/** Par rótulo/valor numa grade de campos estruturados. */
export const Field: FC<{ label: string; value: ReactNode }> = ({
  label,
  value,
}) => (
  <div className="detail-field">
    <span className="detail-field-label">{label}</span>
    <span className="detail-field-value">{value ?? "—"}</span>
  </div>
);
