#!/usr/bin/env bash
# ===========================================================================
# run-blog-lotes.sh — Wrapper autónomo para procesar el blog por lotes
#
# Versión POSIX de run-blog-lotes.cmd. Ver cabecera de run-blog-lotes.cmd.
#
# USO:
#   bash scripts/run-blog-lotes.sh                          # posts 41-159, --aplicar --ctr-only
#   bash scripts/run-blog-lotes.sh --offset 40 --limit 16
#   bash scripts/run-blog-lotes.sh --no-ctr   # sin --ctr-only (body completo)
#   bash scripts/run-blog-lotes.sh --dry-run  # dry-run (no escribe DB)
#   bash scripts/run-blog-lotes.sh --end 159  # tope de offset (default 159)
#
# REQUISITOS:
#   - DATABASE_URL y DEEPSEEK_API_KEY en .env.local
#   - Node.js + tsx (npm install)
# ===========================================================================
set -u

OFFSET=40
LIMIT=16
END=159
CTR_ONLY="--ctr-only"
APLICAR_FLAG="--aplicar"
LOG="auditoria-blog/run-blog-lotes.log"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --no-ctr)   CTR_ONLY="" ;;
    --dry-run)  APLICAR_FLAG="" ;;
    --offset)   OFFSET="$2"; shift ;;
    --limit)    LIMIT="$2"; shift ;;
    --end)      END="$2"; shift ;;
    *) echo "arg desconocido: $1" ;;
  esac
  shift
done

mkdir -p auditoria-blog
echo "[$(date '+%F %T')] INICIO wrapper (offset=$OFFSET limit=$LIMIT end=$END ctr_only=$CTR_ONLY aplicar=$APLICAR_FLAG)" > "$LOG"

LOTE=$OFFSET
while [[ "$LOTE" -lt "$END" ]]; do
  LIMITE_REAL=$LIMIT
  NEXT_OFFSET=$((LOTE + LIMIT))
  if [[ "$NEXT_OFFSET" -gt "$END" ]]; then LIMITE_REAL=$((END - LOTE)); fi
  if [[ "$LIMITE_REAL" -le 0 ]]; then break; fi

  echo ""
  echo "[$(date '+%F %T')] === LOTE offset=$LOTE limit=$LIMITE_REAL ==="
  echo "[$(date '+%F %T')] === LOTE offset=$LOTE limit=$LIMITE_REAL ===" >> "$LOG"

  npx tsx scripts/blog-verify-fix.ts -- $APLICAR_FLAG $CTR_ONLY --offset "$LOTE" --limit "$LIMITE_REAL" --reset-checkpoint >> "$LOG" 2>&1
  EXITCODE=$?
  if [[ "$EXITCODE" -ne 0 ]]; then
    echo "[$(date '+%F %T')] LOTE offset=$LOTE FALLO (exit $EXITCODE). Reintentando una sola vez..."
    echo "[$(date '+%F %T')] LOTE offset=$LOTE FALLO. Reintento #1 (exit $EXITCODE)" >> "$LOG"
    npx tsx scripts/blog-verify-fix.ts -- $APLICAR_FLAG $CTR_ONLY --offset "$LOTE" --limit "$LIMITE_REAL" --reset-checkpoint >> "$LOG" 2>&1
    EXITCODE=$?
    if [[ "$EXITCODE" -ne 0 ]]; then
      echo "[$(date '+%F %T')] Reintento tambien fallo (exit $EXITCODE). Abortando wrapper."
      echo "[$(date '+%F %T')] Reintento fallo. Abortando." >> "$LOG"
      exit "$EXITCODE"
    fi
  fi
  LOTE=$((LOTE + LIMITE_REAL))
done

echo ""
echo "[$(date '+%F %T')] WRAPPER COMPLETADO. Procesados hasta offset $LOTE."
echo "[$(date '+%F %T')] WRAPPER COMPLETADO hasta offset $LOTE." >> "$LOG"