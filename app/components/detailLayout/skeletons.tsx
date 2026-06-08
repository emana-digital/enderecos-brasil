import { clsx } from "clsx";
import type { CSSProperties, FC } from "react";

/** Bloco de shimmer com largura/altura arbitrárias (uma "linha" de placeholder). */
export const SkeletonLine: FC<{
  width?: string;
  height?: string;
  className?: string;
  style?: CSSProperties;
}> = ({ width = "100%", height = "1rem", className, style }) => (
  <span
    className={clsx("skeleton", className)}
    style={{ width, height, ...style }}
    aria-hidden="true"
  />
);

// Larguras variadas (determinísticas) para os cards parecerem texto real.
const CARD_WIDTHS = ["62%", "48%", "73%", "55%", "67%", "44%", "70%", "58%"];

/**
 * Seção de drill-down em loading: título + grade de cards no mesmo grid do
 * `.detail-list`, para a troca pelo conteúdo real não mexer no layout.
 */
export const DetailSkeletonList: FC<{ count?: number }> = ({ count = 10 }) => (
  <section className="detail-section" aria-hidden="true">
    <h2 className="detail-section-title">
      <SkeletonLine width="9rem" height="1.25rem" />
    </h2>
    <ul className="detail-list">
      {Array.from({ length: count }).map((_, index) => (
        <li key={index}>
          <div className="detail-skeleton-card">
            <SkeletonLine
              width={CARD_WIDTHS[index % CARD_WIDTHS.length]}
              height="1.0625rem"
            />
          </div>
        </li>
      ))}
    </ul>
  </section>
);

/** Grade de campos (CEP) em loading, reusando `.detail-grid`/`.detail-field`. */
export const DetailSkeletonFields: FC<{ count?: number }> = ({ count = 6 }) => (
  <div className="detail-grid" aria-hidden="true">
    {Array.from({ length: count }).map((_, index) => (
      <div key={index} className="detail-field">
        <SkeletonLine width="4.5rem" height="0.75rem" />
        <SkeletonLine width="9rem" height="1.0625rem" />
      </div>
    ))}
  </div>
);
