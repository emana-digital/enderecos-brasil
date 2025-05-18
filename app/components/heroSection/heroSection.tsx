import type { FC, ReactNode } from "react";

import "./heroSection.css";

export const HeroSection: FC<{ children: ReactNode; className?: string }> = ({
  children,
  className,
}) => (
  <section className={`hero-section${className ? ` ${className}` : ""}`}>
    {children}
  </section>
);
