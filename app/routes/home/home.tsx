import type { Route } from "./+types/home";
import { AddressSearchInput } from "~/components/addressSearchInput";
import { HeroSection } from "~/components/heroSection";

import "./home.css";
import { Header } from "./header";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Endereços Brasil" },
    {
      name: "description",
      content:
        "Serviço de busca de endereços com base aberta para uso público.",
    },
  ];
}

export default function Home() {
  return (
    <>
      <Header />
      <HeroSection className="search-hero">
        <div className="hero-text-block">
          <h1>Dados de endereços do Brasil</h1>
          <p>
            Atualizado em tempo real com dados públicos, editado e conferido
            pela comunidade.
          </p>
          <p>
            Consulte informações sobre endereços. Consuma os dados como quiser.
          </p>
        </div>
        <div className="hero-input-block">
          <AddressSearchInput />
        </div>
      </HeroSection>
    </>
  );
}
