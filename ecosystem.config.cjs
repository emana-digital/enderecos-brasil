// Configuração do pm2 para o front (SSR) em produção no VPS.
//
// O pm2 é o responsável por manter o serviço online (restart on crash, start no
// boot via `pm2 startup` + `pm2 save`). O deploy roda `pm2 startOrReload` neste
// arquivo (ver scripts/deploy.sh).
//
// O servidor é o react-router-serve, iniciado via `bun run start`
// (= react-router-serve ./build/server/index.js). Usamos o bun pelo caminho
// absoluto ($HOME/.bun/bin/bun) porque a sessão do pm2 pode não ter o ~/.bun/bin
// no PATH. interpreter "none" => o pm2 executa o binário direto, sem passar por node.
//
// O front escuta só em 127.0.0.1 (HOST); o Caddy faz o reverse-proxy com SSL
// para enderecosbrasil.emana.digital.
module.exports = {
  apps: [
    {
      name: "enderecos-brasil",
      script: `${process.env.HOME}/.bun/bin/bun`,
      args: "run start",
      cwd: "/var/www/enderecosbrasil.emana.digital",
      interpreter: "none",
      instances: 1,
      autorestart: true,
      env: {
        NODE_ENV: "production",
        HOST: "127.0.0.1",
        PORT: "3146",
      },
    },
  ],
};
