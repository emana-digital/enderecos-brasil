# Deploy (produção)

Deploy **baseado apenas em tags**: dar push numa tag `v*` dispara a GitHub Action
[`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml), que conecta no
VPS via SSH e roda [`scripts/deploy.sh`](../scripts/deploy.sh) (deps → build → pm2).

```
git tag v1.0.0
git push origin v1.0.0
   │
   └─► GitHub Action ──ssh──► VPS:
          git checkout da tag → bun install → react-router build → pm2 startOrReload
```

No VPS o **react-router-serve** roda o app SSR escutando só em `127.0.0.1:3146`. O
**Caddy** faz o reverse-proxy com SSL para `enderecosbrasil.emana.digital`. O **pm2**
mantém o processo online (restart on crash + start no boot).

> A `VITE_API_BASE_URL` é embutida **no build** a partir de [`.env.production`](../.env.production)
> (hoje `https://api.enderecosbrasil.emana.digital`). Mudou a URL da API? Edite o
> `.env.production`, faça commit e empurre uma nova tag.

## 1. Secrets no GitHub

`Settings > Secrets and variables > Actions > New repository secret`:

| Secret     | Conteúdo |
|------------|----------|
| `SSH_HOST` | IP ou hostname do VPS |
| `SSH_USER` | usuário SSH dono de `/var/www/enderecosbrasil.emana.digital` |
| `SSH_KEY`  | chave **privada** SSH completa (ex.: conteúdo de `~/.ssh/id_ed25519`) |
| `SSH_PORT` | porta SSH (opcional; default `22`) |

Gere um par de chaves dedicado ao deploy e autorize a pública no VPS:

```bash
# na sua máquina
ssh-keygen -t ed25519 -C "github-deploy" -f deploy_key
# copie deploy_key.pub para ~/.ssh/authorized_keys do usuário no VPS
# cole o conteúdo de deploy_key (privada) no secret SSH_KEY
```

> Se a API já roda no mesmo VPS com o mesmo usuário, você pode reaproveitar a
> mesma chave/secrets — só lembre que os secrets são por repositório.

## 2. Setup único do VPS

Feito **uma vez**, antes do primeiro deploy.

```bash
# 1) Node, bun, pm2 e git instalados e no PATH do usuário do deploy.
#    ATENÇÃO: o pm2 é uma app Node e PRECISA de `node` no PATH — mesmo o app
#    rodando sob o bun (interpreter:"none" + `bun run start`). Sem node:
#    "/usr/bin/env: 'node': No such file or directory" + exit 127.

# Node via NodeSource (system-wide → vai pra /usr/bin, que JÁ está no PATH da
# sessão SSH não-interativa; evita o problema de PATH enxuto do bun/pm2):
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs

curl -fsSL https://bun.sh/install | bash      # bun em ~/.bun
bun install -g pm2                              # ou: npm i -g pm2 (agora que há node)

# 2) clonar o projeto na pasta de produção
sudo mkdir -p /var/www/enderecosbrasil.emana.digital
sudo chown "$USER" /var/www/enderecosbrasil.emana.digital
git clone <URL_DO_REPO> /var/www/enderecosbrasil.emana.digital

# 3) primeiro build + subir no pm2 (a partir da pasta do projeto)
cd /var/www/enderecosbrasil.emana.digital
bash scripts/deploy.sh   # ou faça o primeiro deploy empurrando uma tag

# 4) pm2 sobe no boot do servidor
pm2 startup    # rode o comando que ele imprimir (com sudo)
pm2 save
```

> Repositório privado? O VPS precisa conseguir `git fetch` do GitHub — configure
> uma deploy key (read-only) no usuário ou use clone via HTTPS com token.

> `node`, `bun` e `pm2` precisam estar no `PATH` da sessão SSH **não-interativa**.
> O Node via NodeSource cai em `/usr/bin` (já no PATH). Se você instalou o Node via
> **nvm**, o `scripts/deploy.sh` já faz `source ~/.nvm/nvm.sh` automaticamente — mas
> exige um **`nvm alias default <versão>`** definido, senão o nvm não ativa nenhum
> node ao ser sourçado. O script também adiciona `~/.bun/bin` e o `ecosystem.config.cjs`
> chama o bun pelo caminho absoluto. O `deploy.sh` aborta com mensagem clara se não
> achar o `node`.

## 3. Caddy

`/etc/caddy/Caddyfile`:

```caddy
enderecosbrasil.emana.digital {
    reverse_proxy 127.0.0.1:3146
}
```

```bash
sudo systemctl reload caddy
```

## 4. Fazer um deploy

```bash
git tag v1.0.1
git push origin v1.0.1
```

Acompanhe em `Actions` no GitHub. Para reverter, dê push numa tag que aponte para
um commit anterior. Logs do serviço no VPS: `pm2 logs enderecos-brasil`.
