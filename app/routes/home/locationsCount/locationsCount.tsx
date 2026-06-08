import type { FC } from "react";

import { useStats } from "~/hooks";

import "./locationsCount.css";

const nf = new Intl.NumberFormat("pt-BR");

/**
 * Label da home com a quantidade de localizações únicas no banco. Usa o campo
 * `locations_busca` de `/locations/stats` (tabela de busca já deduplicada).
 * Reserva o espaço mesmo sem dado para não causar layout shift na hidratação.
 */
export const LocationsCount: FC = () => {
  const { stats } = useStats();

  const raw = stats?.totais.locations_busca;
  const count = raw != null ? Number(raw) : NaN;
  const hasCount = Number.isFinite(count);

  return (
    <p className="locations-count" aria-hidden={!hasCount}>
      {hasCount && (
        <>
          <strong>{nf.format(count)}</strong> localizações cadastradas
        </>
      )}
    </p>
  );
};
