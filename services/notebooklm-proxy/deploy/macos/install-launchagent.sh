#!/usr/bin/env bash
# Instala LaunchAgent para el proxy NotebookLM en macOS (Mac del despacho).
#
# Uso:
#   bash services/notebooklm-proxy/deploy/macos/install-launchagent.sh
#   bash services/notebooklm-proxy/deploy/macos/install-launchagent.sh --smoke
#
# Requisitos: Node 22+, nlm instalado y `nlm login` completado.

set -euo pipefail

SMOKE=false
for arg in "$@"; do
  case "$arg" in
    --smoke) SMOKE=true ;;
    -h|--help)
      echo "Uso: $0 [--smoke]"
      exit 0
      ;;
    *)
      echo "Opción desconocida: $arg"
      exit 1
      ;;
  esac
done

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../../.." && pwd)"
MACOS_DIR="$SCRIPT_DIR"
PLIST_SRC="$MACOS_DIR/com.pineda.notebooklm-proxy.plist.template"
PLIST_DST="$HOME/Library/LaunchAgents/com.pineda.notebooklm-proxy.plist"
ENV_DIR="$HOME/.config/pineda"
ENV_FILE="$ENV_DIR/notebooklm-proxy.env"
ENV_EXAMPLE="$MACOS_DIR/notebooklm-proxy.env.example"

NODE_BIN="$(command -v node || true)"
DETECTED_NLM_BIN="$(command -v nlm || true)"
NLM_BIN="$DETECTED_NLM_BIN"

if [[ -z "$NODE_BIN" ]]; then
  echo "❌ Node.js no encontrado. Instale Node 22+ (fnm, nvm o homebrew)."
  exit 1
fi

if [[ -z "$NLM_BIN" ]]; then
  for candidate in "$HOME/.local/bin/nlm" /opt/homebrew/bin/nlm /usr/local/bin/nlm; do
    if [[ -x "$candidate" ]]; then
      NLM_BIN="$candidate"
      break
    fi
  done
fi

if [[ -z "$NLM_BIN" || ! -x "$NLM_BIN" ]]; then
  echo "❌ nlm no encontrado. Instale el CLI de NotebookLM y ejecute: nlm login"
  exit 1
fi

mkdir -p "$ENV_DIR"
if [[ ! -f "$ENV_FILE" ]]; then
  cp "$ENV_EXAMPLE" "$ENV_FILE"
  API_KEY_GEN="$(openssl rand -hex 32)"
  # shellcheck disable=SC2016
  perl -i -pe "s/^NOTEBOOKLM_PROXY_API_KEY=.*/NOTEBOOKLM_PROXY_API_KEY=$API_KEY_GEN/" "$ENV_FILE"
  perl -i -pe "s|^NLM_BIN=.*|NLM_BIN=$NLM_BIN|" "$ENV_FILE"
  echo "✅ Creado $ENV_FILE con API key generada."
else
  if ! grep -q '^NLM_BIN=.' "$ENV_FILE"; then
    echo "NLM_BIN=$NLM_BIN" >> "$ENV_FILE"
  fi
fi

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

: "${NOTEBOOKLM_NOTEBOOK_ID:?Falta NOTEBOOKLM_NOTEBOOK_ID en $ENV_FILE}"
: "${NOTEBOOKLM_PROXY_API_KEY:?Falta NOTEBOOKLM_PROXY_API_KEY en $ENV_FILE}"
PORT="${PORT:-8787}"
CHAT_NOTEBOOKLM_TIMEOUT_MS="${CHAT_NOTEBOOKLM_TIMEOUT_MS:-180000}"
NLM_BIN="${NLM_BIN:-$DETECTED_NLM_BIN}"

if ! "$NLM_BIN" --version >/dev/null 2>&1; then
  echo "⚠️  nlm no responde. Ejecute: nlm login"
fi

escape_sed() {
  printf '%s' "$1" | sed -e 's/[\/&]/\\&/g'
}

REPO_ESC="$(escape_sed "$REPO_ROOT")"
NODE_ESC="$(escape_sed "$NODE_BIN")"
NLM_ESC="$(escape_sed "$NLM_BIN")"
HOME_ESC="$(escape_sed "$HOME")"
NB_ESC="$(escape_sed "$NOTEBOOKLM_NOTEBOOK_ID")"
KEY_ESC="$(escape_sed "$NOTEBOOKLM_PROXY_API_KEY")"
PORT_ESC="$(escape_sed "$PORT")"
TIMEOUT_ESC="$(escape_sed "$CHAT_NOTEBOOKLM_TIMEOUT_MS")"

sed \
  -e "s|__REPO_ROOT__|$REPO_ESC|g" \
  -e "s|__NODE_BIN__|$NODE_ESC|g" \
  -e "s|__NLM_BIN__|$NLM_ESC|g" \
  -e "s|__HOME_DIR__|$HOME_ESC|g" \
  -e "s|__NOTEBOOKLM_NOTEBOOK_ID__|$NB_ESC|g" \
  -e "s|__NOTEBOOKLM_PROXY_API_KEY__|$KEY_ESC|g" \
  -e "s|__PORT__|$PORT_ESC|g" \
  -e "s|__CHAT_NOTEBOOKLM_TIMEOUT_MS__|$TIMEOUT_ESC|g" \
  "$PLIST_SRC" > "$PLIST_DST"

launchctl bootout "gui/$(id -u)/com.pineda.notebooklm-proxy" 2>/dev/null || true
launchctl bootout "gui/$(id -u)" "$PLIST_DST" 2>/dev/null || true
launchctl bootstrap "gui/$(id -u)" "$PLIST_DST"

sleep 2

if curl -fsS "http://127.0.0.1:${PORT}/health" | grep -q '"status":"ok"'; then
  echo "✅ Proxy activo en http://127.0.0.1:${PORT}/health"
else
  echo "❌ El proxy no responde. Revise:"
  echo "   tail -20 /tmp/notebooklm-proxy.err"
  echo "   tail -20 /tmp/notebooklm-proxy.log"
  exit 1
fi

if [[ "$SMOKE" == true ]]; then
  echo "▶ Prueba de consulta (puede tardar 1–2 min)…"
  curl -fsS -X POST "http://127.0.0.1:${PORT}/query" \
    -H "Authorization: Bearer ${NOTEBOOKLM_PROXY_API_KEY}" \
    -H "Content-Type: application/json" \
    -d '{"question":"Responde solo: OK","sessionId":"macos-smoke"}' \
    | head -c 400
  echo ""
fi

MASKED_KEY="${NOTEBOOKLM_PROXY_API_KEY:0:6}…${NOTEBOOKLM_PROXY_API_KEY: -4}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Variables para Vercel (Production):"
echo "  CHAT_NOTEBOOKLM_ENABLED=true"
echo "  NOTEBOOKLM_PROXY_URL=https://<su-tunel-o-dominio>/query"
echo "  NOTEBOOKLM_PROXY_API_KEY=${MASKED_KEY}  (completa en $ENV_FILE)"
echo "  CHAT_NOTEBOOKLM_TIMEOUT_MS=${CHAT_NOTEBOOKLM_TIMEOUT_MS}"
echo ""
echo "API key completa: $ENV_FILE"
echo "Túnel Cloudflare: bash services/notebooklm-proxy/deploy/macos/install-cloudflare-tunnel.sh"
echo "Logs: /tmp/notebooklm-proxy.log"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
