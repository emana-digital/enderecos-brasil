import type { FC } from "react";
import { Link } from "react-router";
import { Logo } from "~/components/logo";
import { clearHomeSearch } from "~/lib";

import "./header.css";
// TODO: reativar junto com o nav.
// import { UserArea } from "./userArea";

export const Header: FC = () => {
  return (
    <header className="header">
      <div className="header-content">
        {/* Logo volta pra home "do zero" (limpa a busca lembrada). */}
        <Link to="/" className="logo-container" onClick={clearHomeSearch}>
          <Logo />
        </Link>
        {/* TODO: reativar quando as seções existirem (contribuir, últimas
            atualizações, preços, minha conta). */}
        {/* <nav>
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
        </nav> */}
      </div>
    </header>
  );
};
