#!/usr/bin/env bash
# Aplica la remediación SEO 2026-08-16 (plan-implementacion-final-2026-08-16.md).
# No IndexNow real. No merge. No deploy. No toca archivos fuera de la lista blanca.
#
# Uso:
#   chmod +x scripts/apply-remediacion.sh
#   ./scripts/apply-remediacion.sh --create-branch
#   ./scripts/apply-remediacion.sh
#   ./scripts/apply-remediacion.sh --dry-run
#   ./scripts/apply-remediacion.sh --lighthouse
#   ./scripts/apply-remediacion.sh --push          # commit + push; PR si hay gh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

BRANCH="feat/remediacion-seo-2026-08"
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m'

CREATE_BRANCH=0
DRY_RUN=0
DO_PUSH=0
DO_LIGHTHOUSE=0
SKIP_VALIDATE=0

for arg in "$@"; do
  case "$arg" in
    --create-branch) CREATE_BRANCH=1 ;;
    --dry-run) DRY_RUN=1 ;;
    --push) DO_PUSH=1 ;;
    --lighthouse) DO_LIGHTHOUSE=1 ;;
    --skip-validate) SKIP_VALIDATE=1 ;;
    -h|--help)
      sed -n '2,14p' "$0"
      exit 0
      ;;
    *)
      echo -e "${RED}[ERROR]${NC} Flag desconocido: $arg"
      exit 1
      ;;
  esac
done

log_info() { echo -e "${GREEN}[INFO]${NC} $*"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $*"; }
log_error() { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

ALLOWED_FILES=(
  "data/blog/blog-metadata-overrides.ts"
  "app/(public)/despacho/page.tsx"
  "app/(public)/preguntas-frecuentes/page.tsx"
  "data/landings-locales.ts"
  "tests/fase2-arquitectura-publica.test.ts"
  "components/blog/blog-toc.tsx"
  "components/marketing/public-footer.tsx"
  "lib/legal-content.ts"
  "app/(public)/politica-privacidad/page.tsx"
  "app/robots.ts"
  "scripts/seo-live-collect.mjs"
  "scripts/google-search-console-live.mjs"
  "scripts/google-analytics-live.mjs"
  "scripts/bing-webmaster-live.mjs"
)

is_allowed_noise() {
  local f="$1"
  [[ "$f" == docs/audits/* ]] && return 0
  [[ "$f" == scripts/apply-remediacion.sh ]] && return 0
  [[ "$f" == scripts/patch-utils.js ]] && return 0
  local a
  for a in "${ALLOWED_FILES[@]}"; do
    [[ "$f" == "$a" ]] && return 0
  done
  return 1
}

check_preconditions() {
  log_info "Verificando precondiciones..."
  [[ -d .git ]] || log_error "No es un repo Git"
  command -v git >/dev/null || log_error "Falta git"
  command -v node >/dev/null || log_error "Falta node"
  command -v npm >/dev/null || log_error "Falta npm"

  if [[ "$CREATE_BRANCH" -eq 1 ]]; then
    git fetch origin
    git branch backup/pre-remediacion-seo-2026-08 origin/main 2>/dev/null || true
    if git show-ref --verify --quiet "refs/heads/${BRANCH}"; then
      git switch "$BRANCH"
    else
      git switch -c "$BRANCH" origin/main
    fi
  fi

  local current
  current="$(git rev-parse --abbrev-ref HEAD)"
  [[ "$current" == "$BRANCH" ]] || log_error "Rama actual '$current'. Cambia a $BRANCH o pasa --create-branch"

  local line status path
  while IFS= read -r line; do
    [[ -z "$line" ]] && continue
    status="${line:0:2}"
    path="${line:3}"
    path="${path#\"}"
    path="${path%\"}"
    if [[ "$path" == *" -> "* ]]; then
      path="${path##* -> }"
    fi
    is_allowed_noise "$path" && continue
    log_error "Working tree sucio fuera de la lista blanca: $status $path"
  done < <(git status --porcelain)

  if [[ ! -d node_modules ]]; then
    log_info "Instalando node_modules (npm ci)..."
    npm ci
  fi
  [[ -f .env.local ]] || log_error "Falta .env.local"
  [[ -f scripts/patch-utils.js ]] || log_error "Falta scripts/patch-utils.js"
  log_info "Precondiciones OK"
}

apply_patches() {
  log_info "Aplicando parches (Node, reemplazos literales)..."
  if [[ "$DRY_RUN" -eq 1 ]]; then
    node scripts/patch-utils.js --dry-run
  else
    node scripts/patch-utils.js
  fi
}

run_validations() {
  [[ "$SKIP_VALIDATE" -eq 1 ]] && { log_warn "Validaciones omitidas (--skip-validate)"; return 0; }
  [[ "$DRY_RUN" -eq 1 ]] && { log_warn "Dry-run: no se ejecutan lint/tsc/vitest"; return 0; }
  log_info "npm run lint"
  npm run lint
  log_info "npx tsc --noEmit"
  npx tsc --noEmit
  log_info "vitest (fase2, crawl-contract, blog-metadata-only)"
  npx vitest run tests/fase2-arquitectura-publica.test.ts tests/crawl-contract.test.ts tests/blog-metadata-only.test.ts
}

wait_for_local() {
  local i
  for i in $(seq 1 90); do
    if curl -sf -o /dev/null --max-time 2 "http://127.0.0.1:3100/" 2>/dev/null; then
      return 0
    fi
    sleep 2
  done
  return 1
}

run_lighthouse() {
  [[ "$DO_LIGHTHOUSE" -eq 1 ]] || return 0
  [[ "$DRY_RUN" -eq 1 ]] && { log_warn "Dry-run: Lighthouse omitido"; return 0; }
  log_info "Lighthouse móvil local (build + start :3100). LCP se anota; no es gate."
  local log="/tmp/jv-e2e-start-remediacion.log"
  PORT=3100 npm run e2e:start:public >"$log" 2>&1 &
  local pid=$!
  cleanup_server() { kill "$pid" 2>/dev/null || true; }
  trap cleanup_server EXIT
  wait_for_local || { tail -n 40 "$log" || true; log_error "localhost:3100 no respondió"; }
  npx lighthouse "http://127.0.0.1:3100/" \
    --preset=perf --form-factor=mobile --screenEmulation.mobile=true \
    --screenEmulation.width=390 --screenEmulation.height=844 --screenEmulation.deviceScaleFactor=2 \
    --throttling-method=simulate --only-categories=performance,accessibility \
    --output=json --output-path="/tmp/jv-lh-local-home" --chrome-flags="--headless --no-sandbox" --quiet
  npx lighthouse "http://127.0.0.1:3100/blog/derecho-de-familia/pension-alimenticia-porcentaje-honduras-2026" \
    --form-factor=mobile --screenEmulation.mobile=true --only-categories=performance \
    --output=json --output-path="/tmp/jv-lh-local-pension" --chrome-flags="--headless --no-sandbox" --quiet
  npx lighthouse "http://127.0.0.1:3100/solicitar-consulta" \
    --form-factor=mobile --screenEmulation.mobile=true --only-categories=performance \
    --output=json --output-path="/tmp/jv-lh-local-consulta" --chrome-flags="--headless --no-sandbox" --quiet
  node -e "
    for (const n of ['home','pension','consulta']) {
      const j = require('/tmp/jv-lh-local-' + n);
      const ms = Math.round(j.audits['largest-contentful-paint'].numericValue);
      console.log('LCP_' + n + '_ms=' + ms);
    }
  "
  cleanup_server
  trap - EXIT
}

maybe_push() {
  [[ "$DO_PUSH" -eq 1 ]] || {
    log_info "Sin --push: no hay commit ni push. Revisa git diff y haz commit manual si el titular lo autoriza."
    git diff --stat -- "${ALLOWED_FILES[@]}"
    return 0
  }
  [[ "$DRY_RUN" -eq 1 ]] && { log_warn "Dry-run: no commit/push"; return 0; }

  git add -- "${ALLOWED_FILES[@]}"
  if git diff --cached --quiet; then
    log_warn "Nada nuevo para commitear (¿ya aplicado?)."
  else
    git commit -m "$(cat <<'EOF'
fix(seo): remediación on-page, Bingbot crawlDelay y collector dotenv

EOF
)"
  fi

  git push -u origin HEAD

  if command -v gh >/dev/null 2>&1; then
    if gh pr view >/dev/null 2>&1; then
      log_info "PR ya existe: $(gh pr view --json url -q .url)"
    else
      gh pr create --base main --title "fix(seo): remediación on-page 2026-08-16" --body "$(cat <<'EOF'
## Summary
- Aplica el paquete docs/audits/paquete-ejecucion-tecnica-2026-08-16.md
- Titles/metas, TOC button, footer Nacaome, robots Bingbot, privacidad, collector override:false
- Test fase2: heroTitle Nacaome actualizado

## Test plan
- [ ] curl titles FAQ, despacho, divorcio, detención, nacionalidad
- [ ] TOC prescripción: button, no href #
- [ ] Footer: «No tenemos oficina en Tegucigalpa»
- [ ] robots.txt Bingbot Crawl-delay: 2
- [ ] /politica-privacidad sin «Ley de Protección de Datos de Honduras»
- [ ] lint + tsc + vitest citados

EOF
)"
    fi
  else
    log_warn "gh no está en PATH: push hecho, PR manual."
  fi
}

print_report() {
  echo
  log_info "Implementación local lista."
  echo "  Rama:        $(git rev-parse --abbrev-ref HEAD)"
  echo "  IndexNow:    no ejecutado (solo dry-run manual si el titular lo pide)"
  echo "  Deploy:      no ejecutado"
  echo "  Producción:  requiere aprobación del titular (plan Fase 4)"
}

check_preconditions
apply_patches
run_validations
run_lighthouse
maybe_push
print_report
