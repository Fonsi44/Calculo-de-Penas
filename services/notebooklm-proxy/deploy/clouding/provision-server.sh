#!/usr/bin/env bash
# Crea un VPS en Clouding.io para el proxy NotebookLM.
#
# Uso (desde tu Mac):
#   export CLOUDING_API_KEY='...'
#   bash services/notebooklm-proxy/deploy/clouding/provision-server.sh

set -euo pipefail

API_BASE="https://api.clouding.io/v1"
SERVER_NAME="${CLOUDING_SERVER_NAME:-pineda-nlm-proxy}"
HOSTNAME="${CLOUDING_HOSTNAME:-pineda-nlm-proxy.local}"
FLAVOR="${CLOUDING_FLAVOR:-1x2}"
SSD_GB="${CLOUDING_SSD_GB:-20}"

if [[ -z "${CLOUDING_API_KEY:-}" ]]; then
  echo "❌ Defina CLOUDING_API_KEY (portal.clouding.io → API)."
  exit 1
fi

api_get() {
  curl -fsS -H "Content-Type: application/json" -H "X-API-KEY: $CLOUDING_API_KEY" "$@"
}

json_items() {
  python3 - <<'PY' "$1" "$2"
import json, sys
raw, key = sys.argv[1], sys.argv[2]
data = json.loads(raw)
items = data.get(key)
if items is None:
    items = data.get("data") or data.get("items") or []
if isinstance(items, dict):
    items = list(items.values())
print(json.dumps(items))
PY
}

echo "▶ Comprobando cuenta Clouding…"
api_get "$API_BASE/servers?page=1&pageSize=1" >/dev/null

echo "▶ Buscando imagen Ubuntu LTS…"
IMAGES_JSON="$(api_get "$API_BASE/images?page=1&pageSize=50")"
IMAGE_ID="$(python3 - <<'PY' "$IMAGES_JSON"
import json, sys
items = json.loads(sys.argv[1])
if isinstance(items, dict) and "images" in items:
    items = items["images"]
best = None
for img in items:
    name = (img.get("name") or "").lower()
    iid = img.get("id")
    if not iid or "ubuntu" not in name:
        continue
    if "22.04" in name or "24.04" in name:
        score = 20 if "24.04" in name else 15
        if best is None or score > best[0]:
            best = (score, iid, name)
if best:
    print(best[1])
PY
)"
if [[ -z "$IMAGE_ID" ]]; then
  echo "❌ No se encontró imagen Ubuntu LTS."
  exit 1
fi
echo "   Imagen: $IMAGE_ID"

echo "▶ Buscando firewall…"
FW_JSON="$(api_get "$API_BASE/firewalls?page=1&pageSize=20")"
FIREWALL_ID="$(python3 - <<'PY' "$FW_JSON"
import json, sys
data = json.loads(sys.argv[1])
items = data.get("values") or data.get("firewalls") or []
if items:
    print(items[0].get("id") or "")
PY
)"
if [[ -z "$FIREWALL_ID" ]]; then
  echo "❌ No hay firewall en la cuenta."
  exit 1
fi
echo "   Firewall: $FIREWALL_ID"

SSH_KEY_ID="${CLOUDING_SSH_KEY_ID:-}"
if [[ -z "$SSH_KEY_ID" ]]; then
  KEYS_JSON="$(api_get "$API_BASE/keypairs?page=1&pageSize=20")"
  SSH_KEY_ID="$(python3 - <<'PY' "$KEYS_JSON"
import json, sys
data = json.loads(sys.argv[1])
items = data.get("values") or []
if items:
    print(items[0].get("id") or "")
PY
)"
fi

ROOT_PASSWORD=""
if [[ -n "$SSH_KEY_ID" ]]; then
  ACCESS_JSON="$(python3 - <<PY
import json
print(json.dumps({"sshKeyId": "$SSH_KEY_ID", "password": None, "savePassword": False}))
PY
)"
  echo "   SSH key: $SSH_KEY_ID"
else
  ROOT_PASSWORD="$(openssl rand -base64 18 | tr -d '/+=' | head -c 20)"
  ACCESS_JSON="$(python3 - <<PY
import json
print(json.dumps({"password": "$ROOT_PASSWORD", "savePassword": True}))
PY
)"
  echo "   Sin clave SSH: contraseña root generada."
fi

PAYLOAD="$(python3 - <<PY
import json
print(json.dumps({
  "name": "$SERVER_NAME",
  "hostname": "$HOSTNAME",
  "flavorId": "$FLAVOR",
  "publicPortFirewallIds": ["$FIREWALL_ID"],
  "accessConfiguration": json.loads('''$ACCESS_JSON'''),
  "volume": {
    "source": "image",
    "id": "$IMAGE_ID",
    "ssdGb": int("$SSD_GB"),
  },
}))
PY
)"

echo "▶ Creando servidor ($FLAVOR, ${SSD_GB}GB)…"
CREATE_RESP="$(curl -fsS -X POST \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: $CLOUDING_API_KEY" \
  -d "$PAYLOAD" \
  "$API_BASE/servers")"

SERVER_ID="$(python3 - <<'PY' "$CREATE_RESP"
import json, sys
d = json.loads(sys.argv[1])
print(d.get("id") or (d.get("server") or {}).get("id") or "")
PY
)"

if [[ -z "$SERVER_ID" ]]; then
  echo "❌ Respuesta inesperada:"
  echo "$CREATE_RESP"
  exit 1
fi

echo "   ID: $SERVER_ID"
echo "▶ Esperando IP pública (hasta 5 min)…"

PUBLIC_IP=""
for _ in $(seq 1 60); do
  DETAIL="$(api_get "$API_BASE/servers/$SERVER_ID")"
  PUBLIC_IP="$(python3 - <<'PY' "$DETAIL"
import json, sys
d = json.loads(sys.argv[1])
if d.get("publicIp"):
    print(d["publicIp"]); raise SystemExit
for port in d.get("ports") or []:
    if port.get("publicIp"):
        print(port["publicIp"]); raise SystemExit
    for addr in port.get("addresses") or []:
        ip = addr.get("ipAddress") or addr.get("ip")
        if ip and not str(ip).startswith("10."):
            print(ip); raise SystemExit
PY
)"
  if [[ -n "$PUBLIC_IP" ]]; then
    break
  fi
  sleep 5
done

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
STATE_FILE="$SCRIPT_DIR/.last-provision.env"
cat > "$STATE_FILE" <<EOF
CLOUDING_SERVER_ID=$SERVER_ID
CLOUDING_PUBLIC_IP=$PUBLIC_IP
CLOUDING_SERVER_NAME=$SERVER_NAME
EOF
chmod 600 "$STATE_FILE"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ VPS creado"
echo "   IP:      ${PUBLIC_IP:-pendiente — ver panel Clouding}"
echo "   ID:      $SERVER_ID"
if [[ -n "${ROOT_PASSWORD:-}" ]]; then
  echo "   Usuario: root"
  echo "   Clave:   $ROOT_PASSWORD"
fi
echo ""
echo "Siguiente:"
echo "  bash services/notebooklm-proxy/deploy/vps/copy-to-server.sh root@${PUBLIC_IP:-IP}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
