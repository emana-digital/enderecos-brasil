import type { FC } from "react";
import { Link } from "react-router";
import { Logo } from "~/components/logo";

import "./header.css";
import { UserArea } from "./userArea";

export const Header: FC = () => {
  return (
    <header className="header">
      <div className="header-content">
        <Link to="/" className="logo-container">
          <Logo />
        </Link>
        <nav>
          <ul>
            <li>
              <Link to="/contribuir">contribuir</Link>
            </li>
            <li>
              <Link to="/ultimas-atualizacoes">ultimas atualizações</Link>
            </li>
            <li>
              <Link to="/precos">preços</Link>
            </li>
            <li>
              <Link to="/minha-conta">
                <UserArea />
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};
