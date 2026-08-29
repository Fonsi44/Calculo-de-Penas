#!/usr/bin/env bash
# Muestra variables para pegar en Vercel (ejecutar en el VPS como root).
set -euo pipefail
ENV_FILE="/etc/pineda/notebooklm-proxy.env"
DOMAIN="${NLM_PROXY_DOMAIN:-}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "❌ No existe $ENV_FILE — ejecute bootstrap-ubuntu.sh primero."
  exit 1
fi
# shellcheck disable=SC1090
source "$ENV_FILE"

URL="https://${DOMAIN:-SU-DOMINIO}/query"
if [[ -z "$DOMAIN" ]]; then
  URL="https://nlm-proxy.TU-DOMINIO/query"
fi

cat <<EOF

Pegar en Vercel → Settings → Environment Variables → Production:

CHAT_NOTEBOOKLM_ENABLED=true
NOTEBOOKLM_PROXY_URL=$URL
NOTEBOOKLM_PROXY_API_KEY=$NOTEBOOKLM_PROXY_API_KEY
CHAT_NOTEBOOKLM_TIMEOUT_MS=180000

Después: Redeploy de Production.

EOF
