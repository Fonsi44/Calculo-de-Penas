#!/usr/bin/env bash
# Instala LaunchAgent para arrancar el proxy al iniciar sesión en macOS.
# Útil para desarrollo/staging local. NO sustituye un VPS para producción 24/7.
#
# Uso: bash services/notebooklm-proxy/deploy/macos/install-launchagent.sh

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
NODE="$(command -v node)"
PLIST_SRC="$REPO_ROOT/services/notebooklm-proxy/deploy/macos/com.pineda.notebooklm-proxy.plist.template"
PLIST_DST="$HOME/Library/LaunchAgents/com.pineda.notebooklm-proxy.plist"

sed -e "s|REPO_ROOT|$REPO_ROOT|g" -e "s|/usr/local/bin/node|$NODE|g" "$PLIST_SRC" > "$PLIST_DST"
launchctl unload "$PLIST_DST" 2>/dev/null || true
launchctl load "$PLIST_DST"
echo "✅ Proxy configurado para arrancar al iniciar sesión."
echo "   Logs: /tmp/notebooklm-proxy.log"
echo "   Para producción sin Mac encendida, use VPS: deploy/install-vps.sh"
