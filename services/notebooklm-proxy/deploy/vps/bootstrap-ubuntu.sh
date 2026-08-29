#!/usr/bin/env bash
# Bootstrap completo en Ubuntu 22.04/24.04 (ejecutar como root en el VPS).
#
# Uso:
#   sudo bash bootstrap-ubuntu.sh
#   sudo NLM_PROXY_DOMAIN=nlm-proxy.tudominio.com bash bootstrap-ubuntu.sh
#
# Tras el script: sincronizar auth nlm desde Mac O ejecutar `nlm login` como usuario pineda.

set -euo pipefail

PINEDA_USER="${PINEDA_USER:-pineda}"
INSTALL_DIR="/opt/pineda/notebooklm-proxy"
ENV_FILE="/etc/pineda/notebooklm-proxy.env"
NOTEBOOK_ID="${NOTEBOOKLM_NOTEBOOK_ID:-6189a2da-d3f1-4450-8abb-c28aeb438272}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

if [[ $EUID -ne 0 ]]; then
  echo "Ejecute con sudo"
  exit 1
fi

echo "▶ Actualizando paquetes base…"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq curl ca-certificates gnupg ufw git python3 openssl

echo "▶ Usuario del servicio: $PINEDA_USER"
if ! id "$PINEDA_USER" &>/dev/null; then
  useradd -m -s /bin/bash "$PINEDA_USER"
fi

echo "▶ Node.js 22…"
if ! command -v node >/dev/null || [[ "$(node -v | cut -d. -f1 | tr -d v)" -lt 22 ]]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y -qq nodejs
fi
node -v

echo "▶ uv + nlm (notebooklm-mcp-cli) para $PINEDA_USER…"
if ! command -v uv >/dev/null; then
  curl -fsSL https://astral.sh/uv/install.sh | env UV_INSTALL_DIR=/usr/local/bin sh
fi
su - "$PINEDA_USER" -c 'uv tool install notebooklm-mcp-cli'
NLM_BIN="/home/$PINEDA_USER/.local/bin/nlm"
if [[ ! -x "$NLM_BIN" ]]; then
  echo "❌ nlm no instalado en $NLM_BIN"
  exit 1
fi

echo "▶ Proxy NotebookLM…"
mkdir -p "$INSTALL_DIR" /etc/pineda
if [[ ! -f "$SCRIPT_DIR/server.mjs" ]]; then
  echo "❌ Falta server.mjs en $SCRIPT_DIR — ejecute copy-to-server.sh desde el Mac primero."
  exit 1
fi
cp "$SCRIPT_DIR/server.mjs" "$SCRIPT_DIR/package.json" "$INSTALL_DIR/"

API_KEY="$(openssl rand -hex 32)"
cat > "$ENV_FILE" <<EOF
NOTEBOOKLM_NOTEBOOK_ID=$NOTEBOOK_ID
NOTEBOOKLM_PROXY_API_KEY=$API_KEY
PORT=8787
CHAT_NOTEBOOKLM_TIMEOUT_MS=180000
NLM_BIN=$NLM_BIN
EOF
chmod 600 "$ENV_FILE"

NODE_BIN="$(command -v node)"
cat > /etc/systemd/system/notebooklm-proxy.service <<EOF
[Unit]
Description=NotebookLM proxy — chat público Pineda y Asociados
After=network.target

[Service]
Type=simple
User=$PINEDA_USER
Group=$PINEDA_USER
WorkingDirectory=$INSTALL_DIR
Environment=HOME=/home/$PINEDA_USER
Environment=PATH=/home/$PINEDA_USER/.local/bin:/usr/local/bin:/usr/bin:/bin
EnvironmentFile=$ENV_FILE
ExecStart=$NODE_BIN server.mjs
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

chown -R "$PINEDA_USER:$PINEDA_USER" /opt/pineda
systemctl daemon-reload
systemctl enable notebooklm-proxy

echo "▶ Firewall (UFW)…"
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

DOMAIN="${NLM_PROXY_DOMAIN:-}"
if [[ -n "$DOMAIN" ]]; then
  echo "▶ Caddy + HTTPS para $DOMAIN…"
  apt-get install -y -qq debian-keyring debian-archive-keyring apt-transport-https
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
  apt-get update -qq
  apt-get install -y -qq caddy
  cat > /etc/caddy/Caddyfile <<EOF
$DOMAIN {
  reverse_proxy 127.0.0.1:8787
}
EOF
  systemctl enable caddy
  systemctl restart caddy
  PUBLIC_URL="https://$DOMAIN/query"
else
  PUBLIC_URL="(configure NLM_PROXY_DOMAIN y Caddy después)"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "⚠️  FALTA AUTENTICACIÓN GOOGLE (nlm)"
echo ""
echo "Opción A — desde tu Mac (recomendada, ya tienes nlm login):"
echo "  bash services/notebooklm-proxy/deploy/vps/sync-nlm-auth-to-server.sh $PINEDA_USER@\$(hostname -I | awk '{print \$1}')"
echo ""
echo "Opción B — en este servidor como usuario $PINEDA_USER:"
echo "  sudo -u $PINEDA_USER -H $NLM_BIN login"
echo ""
echo "Luego arranque:"
echo "  sudo systemctl start notebooklm-proxy"
echo "  curl http://127.0.0.1:8787/health"
echo ""
echo "Variables Vercel (Production):"
echo "  CHAT_NOTEBOOKLM_ENABLED=true"
echo "  NOTEBOOKLM_PROXY_URL=${PUBLIC_URL}"
echo "  NOTEBOOKLM_PROXY_API_KEY=$API_KEY"
echo "  CHAT_NOTEBOOKLM_TIMEOUT_MS=180000"
echo ""
echo "API key guardada en: $ENV_FILE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
