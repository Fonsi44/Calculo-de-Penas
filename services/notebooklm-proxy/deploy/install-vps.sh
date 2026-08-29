#!/usr/bin/env bash
# Instala el proxy NotebookLM en un VPS (Ubuntu 22.04+).
# Requisitos previos en el servidor: Node 22, `nlm login` completado.
#
# Uso:
#   scp -r services/notebooklm-proxy user@servidor:/tmp/notebooklm-proxy
#   ssh user@servidor 'sudo bash /tmp/notebooklm-proxy/deploy/install-vps.sh'

set -euo pipefail

INSTALL_DIR="/opt/pineda/notebooklm-proxy"
ENV_FILE="/etc/pineda/notebooklm-proxy.env"
SERVICE="notebooklm-proxy"

if [[ $EUID -ne 0 ]]; then
  echo "Ejecute con sudo"
  exit 1
fi

mkdir -p /opt/pineda /etc/pineda
id -u notebooklm &>/dev/null || useradd --system --home /opt/pineda --shell /usr/sbin/nologin notebooklm

SRC="$(cd "$(dirname "$0")/.." && pwd)"
rm -rf "$INSTALL_DIR"
mkdir -p "$INSTALL_DIR"
cp "$SRC/server.mjs" "$INSTALL_DIR/"
cp "$SRC/package.json" "$INSTALL_DIR/"

if [[ ! -f "$ENV_FILE" ]]; then
  cat > "$ENV_FILE" <<'EOF'
# Editar antes de arrancar:
NOTEBOOKLM_NOTEBOOK_ID=
NOTEBOOKLM_PROXY_API_KEY=
PORT=8787
CHAT_NOTEBOOKLM_TIMEOUT_MS=90000
NLM_BIN=/usr/local/bin/nlm
EOF
  chmod 600 "$ENV_FILE"
  echo "Creado $ENV_FILE — complételo y ejecute: sudo systemctl restart $SERVICE"
fi

cp "$(dirname "$0")/systemd/notebooklm-proxy.service" "/etc/systemd/system/${SERVICE}.service"
chown -R notebooklm:notebooklm /opt/pineda

systemctl daemon-reload
systemctl enable "$SERVICE"
echo "Instalado. Pasos:"
echo "  1. nlm login (como usuario con acceso a nlm)"
echo "  2. Editar $ENV_FILE"
echo "  3. sudo systemctl start $SERVICE"
echo "  4. Configurar Nginx/Caddy con HTTPS → :8787"
echo "  5. En Vercel: NOTEBOOKLM_PROXY_URL=https://su-dominio/query"
