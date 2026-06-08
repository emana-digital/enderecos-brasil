import { type RouteConfig, index, route } from "@react-router/dev/routes";

// Home (autocomplete) + detalhe de CEP + caminho semântico por slug.
// O "*" captura /{estado}/{cidade?}/{bairro?}/{rua?} e resolve no backend.
export default [
  index("routes/home/home.tsx"),
  route("cep/:cep", "routes/cep/cep.tsx"),
  route("*", "routes/local/local.tsx"),
] satisfies RouteConfig;
