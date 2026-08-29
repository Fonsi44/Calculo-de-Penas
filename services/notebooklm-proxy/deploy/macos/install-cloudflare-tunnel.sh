#!/usr/bin/env bash
# Configura Cloudflare Tunnel hacia el proxy NotebookLM local (:8787).
#
# Uso interactivo:
#   bash services/notebooklm-proxy/deploy/macos/install-cloudflare-tunnel.sh
#
# Requisitos: brew install cloudflared && cloudflared tunnel login

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
TEMPLATE="$SCRIPT_DIR/cloudflared-config.yml.template"
CONFIG_DIR="$HOME/.config/pineda"
CONFIG_FILE="$CONFIG_DIR/cloudflared-notebooklm.yml"
PLIST_DST="$HOME/Library/LaunchAgents/com.pineda.cloudflared-notebooklm.plist"

if ! command -v cloudflared >/dev/null 2>&1; then
  echo "❌ cloudflared no instalado. Ejecute: brew install cloudflared"
  exit 1
fi

read -r -p "ID del túnel Cloudflare (ej. abcd1234-…): " TUNNEL_ID
read -r -p "Hostname público (ej. nlm-proxy.tudominio.com): " HOSTNAME

if [[ -z "$TUNNEL_ID" || -z "$HOSTNAME" ]]; then
  echo "❌ Túnel y hostname son obligatorios."
  exit 1
fi

CREDS="$HOME/.cloudflared/${TUNNEL_ID}.json"
if [[ ! -f "$CREDS" ]]; then
  echo "❌ No existe $CREDS"
  echo "   Cree el túnel: cloudflared tunnel create pineda-notebooklm"
  exit 1
fi

mkdir -p "$CONFIG_DIR"
sed \
  -e "s|__TUNNEL_ID__|$TUNNEL_ID|g" \
  -e "s|__HOSTNAME__|$HOSTNAME|g" \
  -e "s|__HOME_DIR__|$HOME|g" \
  "$TEMPLATE" > "$CONFIG_FILE"

CLOUDFLARED_BIN="$(command -v cloudflared)"

cat > "$PLIST_DST" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.pineda.cloudflared-notebooklm</string>
  <key>ProgramArguments</key>
  <array>
    <string>$CLOUDFLARED_BIN</string>
    <string>tunnel</string>
    <string>--config</string>
    <string>$CONFIG_FILE</string>
    <string>run</string>
  </array>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>StandardOutPath</key>
  <string>/tmp/cloudflared-notebooklm.log</string>
  <key>StandardErrorPath</key>
  <string>/tmp/cloudflared-notebooklm.err</string>
</dict>
</plist>
EOF

launchctl bootout "gui/$(id -u)/com.pineda.cloudflared-notebooklm" 2>/dev/null || true
launchctl bootstrap "gui/$(id -u)" "$PLIST_DST"

echo "✅ Cloudflare Tunnel configurado."
echo ""
echo "En Vercel (Production):"
echo "  NOTEBOOKLM_PROXY_URL=https://${HOSTNAME}/query"
echo ""
echo "Compruebe DNS: cloudflared tunnel route dns ${TUNNEL_ID} ${HOSTNAME}"
echo "Logs: /tmp/cloudflared-notebooklm.log"
