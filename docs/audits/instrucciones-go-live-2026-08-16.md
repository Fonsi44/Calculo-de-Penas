---
status: current
owner: seo
created: 2026-08-16
last_reviewed: 2026-08-16
review_due: 2026-08-30
supersedes: null
---

# INSTRUCCIONES DE GO-LIVE - 2026-08-16

Prohibido: `sudo`, `rm -rf`, `git reset --hard`, `git push --force`, IndexNow real, merge sin el titular, mezcla con `fix/allow-production-editorial-upsert`.  
No uses `./scripts/apply-remediacion.sh --push` (no hay prompt). Commit/push manuales, abajo.

14 archivos de producto (lista blanca):

```
data/blog/blog-metadata-overrides.ts
app/(public)/despacho/page.tsx
app/(public)/preguntas-frecuentes/page.tsx
data/landings-locales.ts
tests/fase2-arquitectura-publica.test.ts
components/blog/blog-toc.tsx
components/marketing/public-footer.tsx
lib/legal-content.ts
app/(public)/politica-privacidad/page.tsx
app/robots.ts
scripts/seo-live-collect.mjs
scripts/google-search-console-live.mjs
scripts/google-analytics-live.mjs
scripts/bing-webmaster-live.mjs
```

---

## Precondiciones

- [ ] Acceso GitHub al repo y `gh` autenticado
- [ ] Acceso Vercel al proyecto (Preview + Production)
- [ ] `.env.local` presente; `node_modules` instalado
- [ ] Titular disponible para aprobar el PR **antes** del merge
- [ ] Working tree de **código** limpio (los `docs/audits/*.md` pueden quedar fuera de este PR)

---

## Paso 1: Ejecutar script en desarrollo

```bash
# Ir a la raíz del repo
cd "/Users/fonsi/Documents/Justicia Verdadera"

# Si git switch falla por docs/audits rastreados sucios:
# git stash push -m "audits-live" -- docs/audits/bing-live-report.md docs/audits/seo-live-summary.md

chmod +x scripts/apply-remediacion.sh scripts/patch-utils.js

# Crear/cambiar a feat/remediacion-seo-2026-08 desde origin/main (NO desde el PR editorial)
./scripts/apply-remediacion.sh --create-branch --dry-run
# PASS: JSON failed:false, 14 archivos ok, written:false
# FAIL: parar. No continuar.

# Aplicar parches + lint + tsc + vitest (sin commit, sin push)
./scripts/apply-remediacion.sh --create-branch
# PASS: lint/tsc/vitest exit 0
# FAIL: parar. git diff --stat y reportar el comando que falló.

git rev-parse --abbrev-ref HEAD
# PASS: feat/remediacion-seo-2026-08

git diff --stat -- \
  data/blog/blog-metadata-overrides.ts \
  "app/(public)/despacho/page.tsx" \
  "app/(public)/preguntas-frecuentes/page.tsx" \
  data/landings-locales.ts \
  tests/fase2-arquitectura-publica.test.ts \
  components/blog/blog-toc.tsx \
  components/marketing/public-footer.tsx \
  lib/legal-content.ts \
  "app/(public)/politica-privacidad/page.tsx" \
  app/robots.ts \
  scripts/seo-live-collect.mjs \
  scripts/google-search-console-live.mjs \
  scripts/google-analytics-live.mjs \
  scripts/bing-webmaster-live.mjs
# PASS: solo esos 14 paths con cambios
# FAIL: archivo extra → no add; revertir lo ajeno
```

---

## Paso 2: Validación local

```bash
# Arrancar app de producción local (otra terminal). Esperar a que escuche.
PORT=3100 npm run e2e:start:public

LOCAL=http://127.0.0.1:3100

curl -s "$LOCAL/preguntas-frecuentes" | grep -o '<title>[^<]*</title>'
# PASS: <title>Honorarios y primera consulta | FAQ</title>

curl -s "$LOCAL/despacho" | grep -o '<title>[^<]*</title>'
# PASS: <title>Abogados colegiados en Nacaome, Valle | Equipo</title>

curl -s "$LOCAL/blog/derecho-de-familia/divorcio-honduras-guia-completa" | grep -o '<title>[^<]*</title>'
# PASS: contiene «mutuo acuerdo, causal y plazos»

curl -s "$LOCAL/blog/derecho-penal/que-hacer-si-me-detienen-en-honduras" | grep -o '<title>[^<]*</title>'
# PASS: contiene «Detención en Honduras: derechos, 24 h»

curl -s "$LOCAL/blog/hondurenos-en-espana/nacionalidad-espanola-para-hondurenos-residencia-plazos" | grep -o '<title>[^<]*</title>'
# PASS: contiene «Nacionalidad española para hondureños: plazos»

curl -s "$LOCAL/" | grep -c "No tenemos oficina en Tegucigalpa"
# PASS: ≥ 1

curl -s "$LOCAL/blog/derecho-civil/prescripcion-deudas-plazos-honduras" | grep -A2 'aria-label="Tabla de contenidos"' | head -20
# PASS: <button type="button"
# FAIL: <a href="#

curl -s "$LOCAL/robots.txt" | sed -n '/User-Agent: Bingbot/,/User-Agent:/p'
# PASS: Crawl-delay: 2 (o Crawl-Delay)

curl -s "$LOCAL/politica-privacidad" | grep -c "Ley de Protección de Datos de Honduras"
# PASS: 0
# FAIL ≥1: hero en page_content (admin). No más código. Anotar; no bloquea el PR de git si el default de lib/legal-content.ts ya cambió.

curl -s "$LOCAL/abogados-en-nacaome" | grep -oE '<h1[^>]*>[^<]+</h1>' | head -1
# PASS: Sede en Nacaome: dirección, horario y visita
```

Lint/tests (redundante si el wrapper ya pasó; repetir si se editó a mano):

```bash
npm run lint
npx tsc --noEmit
npx vitest run tests/fase2-arquitectura-publica.test.ts tests/crawl-contract.test.ts tests/blog-metadata-only.test.ts
```

IndexNow: solo dry-run.

```bash
npm run indexnow:dry
```

LCP: no es gate. Opcional: `./scripts/apply-remediacion.sh --lighthouse` (lento).

---

## Paso 3: Crear PR

**STOP si Paso 2 tiene FAIL** (salvo hero DB de privacidad, anotado).

```bash
# Añadir SOLO los 14 archivos de producto
git add -- \
  data/blog/blog-metadata-overrides.ts \
  "app/(public)/despacho/page.tsx" \
  "app/(public)/preguntas-frecuentes/page.tsx" \
  data/landings-locales.ts \
  tests/fase2-arquitectura-publica.test.ts \
  components/blog/blog-toc.tsx \
  components/marketing/public-footer.tsx \
  lib/legal-content.ts \
  "app/(public)/politica-privacidad/page.tsx" \
  app/robots.ts \
  scripts/seo-live-collect.mjs \
  scripts/google-search-console-live.mjs \
  scripts/google-analytics-live.mjs \
  scripts/bing-webmaster-live.mjs

git diff --cached --stat
# PASS: 14 files. FAIL si aparece docs/audits o el PR editorial.

# Solo con autorización de commit
git commit -m "$(cat <<'EOF'
fix(seo): remediación on-page y Bingbot crawlDelay

EOF
)"

# Solo con autorización de push
git push -u origin HEAD

gh pr create --base main --title "fix(seo): remediación on-page 2026-08-16" --body "$(cat <<'EOF'
## Summary
- Remediación on-page 2026-08-16: titles/metas, TOC button, footer Nacaome, robots Bingbot, privacidad, collector dotenv.
- Test fase2: heroTitle Nacaome operativo (no canibaliza home).

## Test plan
- [ ] Titles FAQ, despacho, divorcio, detención, nacionalidad
- [ ] TOC: button, no href #
- [ ] Footer Tegucigalpa
- [ ] robots.txt Bingbot Crawl-delay: 2
- [ ] /politica-privacidad sin «Ley de Protección de Datos de Honduras»
- [ ] lint + tsc + vitest citados

**No mergear hasta aprobación explícita del titular.**
EOF
)"
```

No `gh pr merge`. Enviar la URL del PR al titular.

---

## Paso 4: Preview (opcional)

Sustituir `PREVIEW` por la URL de Vercel del PR.

```bash
PREVIEW="https://REEMPLAZAR.vercel.app"

curl -s "$PREVIEW/preguntas-frecuentes" | grep -o '<title>[^<]*</title>'
curl -s "$PREVIEW/despacho" | grep -o '<title>[^<]*</title>'
curl -s "$PREVIEW/blog/derecho-de-familia/divorcio-honduras-guia-completa" | grep -o '<title>[^<]*</title>'
curl -s "$PREVIEW/blog/derecho-penal/que-hacer-si-me-detienen-en-honduras" | grep -o '<title>[^<]*</title>'
curl -s "$PREVIEW/blog/hondurenos-en-espana/nacionalidad-espanola-para-hondurenos-residencia-plazos" | grep -o '<title>[^<]*</title>'
curl -s "$PREVIEW/" | grep -c "No tenemos oficina en Tegucigalpa"
curl -s "$PREVIEW/robots.txt" | sed -n '/User-Agent: Bingbot/,/User-Agent:/p'
curl -s "$PREVIEW/politica-privacidad" | grep -c "Ley de Protección de Datos de Honduras"
curl -s "$PREVIEW/blog/derecho-civil/prescripcion-deudas-plazos-honduras" | grep -A2 'aria-label="Tabla de contenidos"' | head -15
```

Criterio: mismos PASS que Paso 2. Cualquier FAIL de title/footer/TOC/robots → **no pedir merge**.

---

## Paso 5: Despliegue a producción

**Solo después de «sí» explícito del titular.**

```bash
# Merge vía GitHub UI (preferido) o, con autorización:
# gh pr merge --merge
# (el historial del repo usa merge commits, no squash, salvo que el titular pida otra cosa)

# Esperar Vercel Production = Ready (dashboard). No hay migrate.

npx vercel ls --prod
# PASS: deployment Ready del SHA del merge
```

---

## Paso 6: Verificación post-deploy

```bash
BASE="https://www.pinedayasociadoshn.com"

curl -s "$BASE/preguntas-frecuentes" | grep -o '<title>[^<]*</title>'
# PASS: Honorarios y primera consulta | FAQ

curl -s "$BASE/despacho" | grep -o '<title>[^<]*</title>'
# PASS: Abogados colegiados en Nacaome, Valle | Equipo

curl -s "$BASE/blog/derecho-de-familia/divorcio-honduras-guia-completa" | grep -o '<title>[^<]*</title>'
curl -s "$BASE/blog/derecho-penal/que-hacer-si-me-detienen-en-honduras" | grep -o '<title>[^<]*</title>'
curl -s "$BASE/blog/hondurenos-en-espana/nacionalidad-espanola-para-hondurenos-residencia-plazos" | grep -o '<title>[^<]*</title>'

curl -s "$BASE/" | grep -c "No tenemos oficina en Tegucigalpa"
# PASS: ≥ 1

curl -s "$BASE/robots.txt" | sed -n '/User-Agent: Bingbot/,/User-Agent:/p'
# PASS: Crawl-delay: 2

curl -s "$BASE/politica-privacidad" | grep -c "Ley de Protección de Datos de Honduras"
# PASS: 0

curl -s "$BASE/blog/derecho-civil/prescripcion-deudas-plazos-honduras" | grep -A2 'aria-label="Tabla de contenidos"' | head -15
# PASS: button

curl -sI -o /dev/null -w "%{http_code} %{redirect_url}\n" \
  "$BASE/blog/proceso-penal/sobreseimiento-definitivo-provisional-diferencias-honduras"
# PASS: 308 (preexistente; no debe romperse)
```

Si title, footer, TOC o robots **FAIL** → Rollback inmediato. No esperar caché.

---

## Paso 7: Monitoreo (7–14 días)

Baseline 28d (2026-07-19→2026-08-16): divorcio 14/1845 CTR 0.76% pos 7.7; detención 3/772 CTR 0.39% pos 6.4; despacho 1/121 CTR 0.83% pos 5.9; nacionalidad 0/137 CTR 0% pos 8.2; FAQ 0/35 CTR 0% pos 7.1.

A los **7 días**: no interpretar tendencia. Etiqueta **estable / monitorear**.  
A los **14–28 días**: éxito si CTR divorcio y detención **> 1,5 %** o anotar si la posición empeoró.

```bash
# Doctor (0 ERROR). Collect opcional: pisa docs/audits/seo-live-summary.md
npm run seo:doctor
npm run seo:gsc:live -- --days 7
npm run seo:ga4:live -- --days 7
# Si ERR_OSSL_UNSUPPORTED: residual SA JWT; extraer vía ADC (mismo método que verificacion-post-deploy). No ampliar C.2 en un hotfix de emergencia.
```

Comparar en los JSON (gitignored `data/google/`): clics, impresiones, CTR, posición de las 5 URLs vs tabla de arriba.

GA4 property `541022095`:

- Comparación UI «Público canónico» (host `www.pinedayasociadoshn.com`, excluir `/intranet` y `/preview`): `NOT_VERIFIED` hasta que el titular la cree.
- `email_click`: marcar evento clave en UI (Editor). Éxito operativo = el evento existe; el recuento puede ser 0.
- `(not set)` landing: anotar; 7d no es veredicto.
- `contact_form_submit` / `whatsapp_click`: no deben caer a cero de forma anómala (muestra chica).

Editorial fuera de git: enlaces pensión % ↔ guía en DB; GBP Nacaome.

---

## Rollback (si es necesario)

Prohibido: `git reset --hard`, force-push a `main`, `git clean -fd`.

```bash
# A) Vercel (< 2 min): Deployments → Production anterior → Promote / Instant Rollback
# Luego repetir curls del Paso 6. PASS = titles vuelven al estado 2026-08-16.

# B) Git, si hay que dejar main coherente (con autorización)
git fetch origin
git log origin/main -5 --oneline
git switch -c revert/remediacion-seo-2026-08 origin/main
git revert -m 1 <SHA_DEL_MERGE>
# PR + merge con autorización. No force-push.

# C) Archivos a mano desde backup
git checkout backup/pre-remediacion-seo-2026-08 -- \
  data/blog/blog-metadata-overrides.ts \
  "app/(public)/despacho/page.tsx" \
  "app/(public)/preguntas-frecuentes/page.tsx" \
  data/landings-locales.ts \
  tests/fase2-arquitectura-publica.test.ts \
  components/blog/blog-toc.tsx \
  components/marketing/public-footer.tsx \
  lib/legal-content.ts \
  "app/(public)/politica-privacidad/page.tsx" \
  app/robots.ts \
  scripts/seo-live-collect.mjs \
  scripts/google-search-console-live.mjs \
  scripts/google-analytics-live.mjs \
  scripts/bing-webmaster-live.mjs
```

308: no revertir `next.config.ts` (este PR no lo toca).

---

## Checklist de aprobación final

### Titular (antes del merge)

- [ ] Preview (o local) : 5 titles, footer, TOC button, Bingbot Crawl-delay, privacidad
- [ ] Sin «consulta gratuita» en los diffs
- [ ] H1 Nacaome sigue operativo (no «Abogados en Nacaome»)
- [ ] **Apruebo el merge a producción** (sí/no explícito)

### Después del merge

- [ ] Paso 6 PASS en `www.pinedayasociadoshn.com`
- [ ] 308 de sobreseimiento sigue 308
- [ ] IndexNow real no ejecutado
- [ ] Calendario: GSC/GA4 a 7 días y a 14–28 días
- [ ] Admin privacidad si el hero DB aún cita la ley innominada
- [ ] GA4: comparación Público canónico + `email_click` (UI)
