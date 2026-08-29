#!/usr/bin/env bash
# Copia la sesión nlm desde tu Mac al VPS (evita nlm login en servidor).
# Uso: bash services/notebooklm-proxy/deploy/vps/sync-nlm-auth-to-server.sh pineda@IP_DEL_VPS

set -euo pipefail

TARGET="${1:-}"
if [[ -z "$TARGET" ]]; then
  echo "Uso: $0 pineda@ip-del-vps"
  exit 1
fi

SSH_OPTS=(-o StrictHostKeyChecking=accept-new)
if [[ -n "${SSH_IDENTITY:-}" ]]; then
  SSH_OPTS+=(-i "$SSH_IDENTITY")
fi

AUTH_DIR="$HOME/.notebooklm-mcp-cli"
if [[ ! -d "$AUTH_DIR" ]]; then
  echo "❌ No existe $AUTH_DIR en este Mac. Ejecute primero: nlm login"
  exit 1
fi

echo "▶ Copiando credenciales nlm a $TARGET …"
ssh "${SSH_OPTS[@]}" "$TARGET" "rm -rf ~/.notebooklm-mcp-cli && mkdir -p ~/.notebooklm-mcp-cli && chmod 700 ~/.notebooklm-mcp-cli"
tar czf - -C "$HOME" .notebooklm-mcp-cli | ssh "${SSH_OPTS[@]}" "$TARGET" 'tar xzf - -C ~'
ssh "${SSH_OPTS[@]}" "$TARGET" "chmod -R go-rwx ~/.notebooklm-mcp-cli 2>/dev/null || true"

echo "▶ Reiniciando proxy…"
ssh "${SSH_OPTS[@]}" "$TARGET" "sudo systemctl restart notebooklm-proxy && sleep 2 && curl -fsS http://127.0.0.1:8787/health"

echo ""
echo "✅ Auth sincronizada. Prueba en el VPS:"
echo "   ssh $TARGET 'sudo -u pineda -H /home/pineda/.local/bin/nlm notebook list'"
