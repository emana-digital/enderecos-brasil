import type { FC } from "react";
import "./logo.css";

export const Logo: FC = () => (
  <div className="logo">
    <i className="symbol" />
    <span className="logo-text">
      Endereços <br />
      <span className="brasil">Brasil</span>
    </span>
  </div>
);
