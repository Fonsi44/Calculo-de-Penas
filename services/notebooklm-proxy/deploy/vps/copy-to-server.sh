#!/usr/bin/env bash
# Copia los scripts de despliegue al VPS vía SCP.
# Uso: bash services/notebooklm-proxy/deploy/vps/copy-to-server.sh root@IP

set -euo pipefail

TARGET="${1:-}"
if [[ -z "$TARGET" ]]; then
  echo "Uso: $0 usuario@ip"
  exit 1
fi

SSH_OPTS=(-o StrictHostKeyChecking=accept-new)
if [[ -n "${SSH_IDENTITY:-}" ]]; then
  SSH_OPTS+=(-i "$SSH_IDENTITY")
fi

REPO_ROOT="$(cd "$(dirname "$0")/../../../.." && pwd)"
REMOTE_DIR="/tmp/pineda-notebooklm-deploy"

echo "▶ Copiando a $TARGET:$REMOTE_DIR …"
ssh "${SSH_OPTS[@]}" "$TARGET" "mkdir -p $REMOTE_DIR"
scp "${SSH_OPTS[@]}" -r \
  "$REPO_ROOT/services/notebooklm-proxy/server.mjs" \
  "$REPO_ROOT/services/notebooklm-proxy/package.json" \
  "$REPO_ROOT/services/notebooklm-proxy/deploy/GUIA-INICIO.md" \
  "$REPO_ROOT/services/notebooklm-proxy/deploy/vps/bootstrap-ubuntu.sh" \
  "$REPO_ROOT/services/notebooklm-proxy/deploy/vps/sync-nlm-auth-to-server.sh" \
  "$REPO_ROOT/services/notebooklm-proxy/deploy/vps/print-vercel-env.sh" \
  "$REPO_ROOT/services/notebooklm-proxy/deploy/install-vps.sh" \
  "$REPO_ROOT/services/notebooklm-proxy/deploy/systemd/notebooklm-proxy.service" \
  "$TARGET:$REMOTE_DIR/"

echo "✅ Copiado. En el servidor ejecute:"
echo "   sudo bash $REMOTE_DIR/bootstrap-ubuntu.sh"
