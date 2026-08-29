# Proxy NotebookLM en macOS

Manual operativo (copia versionada). La copia extendida vive en `docs/ops/notebooklm-proxy.md` (local).

## Instalación rápida

```bash
# 1. Autenticación Google (una vez)
nlm login

# 2. Proxy local :8787 (LaunchAgent, arranque al iniciar sesión)
bash services/notebooklm-proxy/deploy/macos/install-launchagent.sh

# 3. Prueba opcional con consulta real
bash services/notebooklm-proxy/deploy/macos/install-launchagent.sh --smoke

# 4. Túnel HTTPS para Vercel (Cloudflare)
brew install cloudflared
cloudflared tunnel login
cloudflared tunnel create pineda-notebooklm
cloudflared tunnel route dns pineda-notebooklm nlm-proxy.tudominio.com
bash services/notebooklm-proxy/deploy/macos/install-cloudflare-tunnel.sh
```

## Vercel (Production)

```
CHAT_NOTEBOOKLM_ENABLED=true
NOTEBOOKLM_PROXY_URL=https://nlm-proxy.tudominio.com/query
NOTEBOOKLM_PROXY_API_KEY=<ver ~/.config/pineda/notebooklm-proxy.env>
CHAT_NOTEBOOKLM_TIMEOUT_MS=180000
```

## Archivos

| Archivo | Uso |
|---------|-----|
| `notebooklm-proxy.env.example` | Plantilla de `~/.config/pineda/notebooklm-proxy.env` |
| `install-launchagent.sh` | Instala/actualiza el proxy |
| `install-cloudflare-tunnel.sh` | Expone el proxy por HTTPS |
| `cloudflared-config.yml.template` | Config del túnel |

## Logs

- Proxy: `/tmp/notebooklm-proxy.log`, `/tmp/notebooklm-proxy.err`
- Túnel: `/tmp/cloudflared-notebooklm.log`
