---
status: current
owner: seo
created: 2026-08-16
last_reviewed: 2026-08-16
review_due: 2026-08-17
supersedes: null
---

# PLAN DE IMPLEMENTACIÓN FINAL - 2026-08-16

Fuentes: `docs/audits/paquete-ejecucion-tecnica-2026-08-16.md` (diffs), `docs/audits/verificacion-post-deploy-2026-08-16.md` (0/10 en producción).

## Resumen

- Duración estimada: **1 h 15 min** de trabajo local (Fases 0–2). Preview y producción extra, solo con orden del titular.
- Riesgo: **BAJO** (metadatos, TOC, footer, robots, scripts; sin migraciones DB, sin rediseño visual).
- Rollback: **&lt; 5 min** (Instant Rollback en Vercel o `git revert` del merge).
- **No** mezclar con `fix/allow-production-editorial-upsert`.
- **No** IndexNow real. **No** HTML de pensión en DB. **No** push / merge / deploy sin confirmación del titular (Fase 4).
- LCP &lt; 2500 ms: **medir y anotar**. Los parches no tocan LCP. En producción (2026-08-16) ya falla (3391 / 3158 / 5078 ms). **No bloquear** el merge por LCP.

Archivo extra obligatorio (si no se toca, Fase 2 FAIL): `tests/fase2-arquitectura-publica.test.ts`.

---

## Fase 0: Preparación

**Criterio de paso:** rama nueva desde `origin/main`, working tree de código limpio, `node_modules` presente.

```bash
cd "/Users/fonsi/Documents/Justicia Verdadera"

git status --short --branch
git fetch origin

# Conservar informes de auditoría fuera del commit de código.
# No hacer git stash --include-untracked de docs/audits (se perderían del disco si se aplica mal).
# Si hay cambios de CÓDIGO no relacionados, parar y preguntar al titular.

git switch -c feat/remediacion-seo-2026-08 origin/main

node -v
test -d node_modules || npm ci
test -f .env.local && echo "OK .env.local" || echo "FAIL: falta .env.local"

git rev-parse --abbrev-ref HEAD
# Esperado: feat/remediacion-seo-2026-08
```

Backup (puntero Git, no copiar archivos):

```bash
git branch backup/pre-remediacion-seo-2026-08 origin/main
```

| Check | Pass | Fail |
|-------|------|------|
| Rama `feat/remediacion-seo-2026-08` | Continuar | No crear desde `fix/allow-production-editorial-upsert` |
| `node_modules` | Continuar | `npm ci` |
| `.env.local` existe | Continuar | No inventar secretos; pedir al titular |

---

## Fase 1: Aplicar parches

**Método:** edición manual. No `sed`. No `git apply` desde el Markdown (falla el encabezado unificado).

Diffs canónicos: `docs/audits/paquete-ejecucion-tecnica-2026-08-16.md` §§1.1–1.10.

Orden: metadatos → páginas → UI → legal → robots → test → scripts.

Tras cada archivo: `git diff -- <ruta>` y confirmar que solo cambia lo listado.

### 1.1 `data/blog/blog-metadata-overrides.ts`

Buscar `'pension-alimenticia-honduras-guia-completa'` y dejar:

```ts
  'pension-alimenticia-honduras-guia-completa': {
    title: 'Pensión alimenticia Honduras: requisitos y pasos',
    description: 'Cómo solicitar pensión alimenticia en Honduras: documentos, demanda, plazos y cobro ante incumplimiento. Guía de procedimiento. Nacaome.',
  },
```

**Antes** de `'poder-legal-honduras-cuando-se-necesita'` insertar (si las claves no existen):

```ts
  'pension-alimenticia-porcentaje-honduras-2026': {
    title: 'Pensión alimenticia Honduras 2026: porcentaje',
    description: 'Cómo estima el juez el porcentaje de pensión alimenticia en Honduras en 2026: ingresos, necesidades del menor y tope de embargo. Nacaome.',
  },
  'divorcio-honduras-guia-completa': {
    title: 'Divorcio en Honduras: mutuo acuerdo, causal y plazos',
    description: 'Tres vías de divorcio en Honduras: mutuo consentimiento, causal y separación. Documentos, hijos y pensión. Bufete en Nacaome.',
  },
  'nacionalidad-espanola-para-hondurenos-residencia-plazos': {
    title: 'Nacionalidad española para hondureños: plazos',
    description: 'Requisitos generales de nacionalidad española por residencia. El bufete en Nacaome orienta trámites hondureños; no ejerce derecho español.',
  },
```

En `'que-hacer-si-me-detienen-en-honduras'` dejar:

```ts
    title: 'Detención en Honduras: derechos, 24 h y qué no firmar',
    description: 'Si lo detienen en Honduras: pida el motivo, no declare sin defensor y no firme lo que no entienda. Plazo de 24 horas ante el juez.',
```

**Pass:** `rg "mutuo acuerdo, causal y plazos" data/blog/blog-metadata-overrides.ts` encuentra 1 línea.

### 1.2 `app/(public)/despacho/page.tsx`

En `buildMetadata({` reemplazar title y description por:

```ts
  title: 'Abogados colegiados en Nacaome, Valle | Equipo',
  description: 'Equipo del bufete en Nacaome, Valle, no Tegucigalpa: áreas de práctica, método de atención y evaluación inicial confidencial.',
```

No tocar el H1 visible / `page_content`.

**Pass:** el title interpolado `Bufete de Abogados en ${site.address.city}` ya no existe en ese `buildMetadata`.

### 1.3 `app/(public)/preguntas-frecuentes/page.tsx`

En `generateMetadata`, reemplazar:

- `title: 'Preguntas frecuentes sobre consultas y honorarios'` → `title: { absolute: 'Honorarios y primera consulta | FAQ' }`
- description: añadir ` en Nacaome.` al final (después de `${site.name}`)
- `twitter.title` y `openGraph.title` → `'Honorarios y primera consulta | FAQ'`

**Pass:** hay exactamente un `absolute:` en ese archivo; no queda el title largo de FAQ.

### 1.4 `data/landings-locales.ts` (entrada `nacaome`)

```ts
    heroTitle: 'Sede en Nacaome: dirección, horario y visita',
```

Añadir al **final** del string `intro` (sin JSX; `landing-local.tsx` renderiza texto plano):

```
 Indicaciones de ruta, mapa y accesos desde Tegucigalpa, Choluteca y San Lorenzo están en /como-llegar. Para contratar defensa o asesoría, use la página principal / o solicite una evaluación inicial confidencial.
```

**Pass:** `heroTitle` Nacaome ya no es `Cómo visitar nuestra oficina en Nacaome`.

### 1.5 `tests/fase2-arquitectura-publica.test.ts` (obligatorio)

```ts
    expect(landing?.heroTitle).toBe('Sede en Nacaome: dirección, horario y visita');
```

No cambiar el expect que prohíbe `^Abogados en Nacaome`.

### 1.6 `components/blog/blog-toc.tsx`

Sustituir el `<a href={...}>` + `history.pushState` por el `<button>` del paquete §1.4. Quitar `pushState`. Conservar `id` en headings (no editar `lib/blog-toc.ts`).

**Pass:** `rg "history.pushState" components/blog/blog-toc.tsx` → 0. `rg "<button" components/blog/blog-toc.tsx` → ≥1.

### 1.7 `components/marketing/public-footer.tsx`

Inmediatamente **después** del párrafo que termina en `juzgados del sur de Honduras.` insertar:

```tsx
            <p className="text-xs text-text-inverse/70 leading-relaxed mt-2 text-pretty">
              Sede en {site.address.city}, {site.address.department}. No tenemos oficina en
              Tegucigalpa ni relación con despachos homónimos.
            </p>
```

**Pass:** `rg "despachos homónimos" components/marketing/public-footer.tsx` → 1.

### 1.8 `lib/legal-content.ts`

En `DEFAULTS['politica-privacidad']`:

```ts
    subtitle: 'Protección de datos personales conforme a la Constitución de Honduras (Arts. 76 a 80).',
    version: '0.6',
    lastUpdated: 'Agosto 2026',
```

**Pass:** `rg "Ley de Protección de Datos de Honduras" lib/legal-content.ts` → 0.

### 1.9 `app/(public)/politica-privacidad/page.tsx`

Sustituir el segundo `<p>` de la sección 1 por el del paquete §1.8 (CAH + Código Civil; sin «Ley de Protección de Datos»).

**Pass:** `rg "Ley Orgánica del Colegio de Abogados" app/\(public\)/politica-privacidad/page.tsx` → 1.

### 1.10 `app/robots.ts`

En `buildRobots` (rama no-noindex):

```ts
      ...ALLOWED_CRAWLER_USER_AGENTS.filter((userAgent) => userAgent !== 'Bingbot').map((userAgent) => ({
        userAgent,
        allow: '/',
        disallow: [...PUBLIC_CRAWLER_DISALLOW_PATHS],
      })),
      {
        userAgent: 'Bingbot',
        allow: '/',
        disallow: [...PUBLIC_CRAWLER_DISALLOW_PATHS],
        crawlDelay: 2,
      },
```

No aplicar `crawlDelay` a Googlebot. Tipo Next: `crawlDelay?: number` existe.

**Pass:** `rg "crawlDelay: 2" app/robots.ts` → 1.

### 1.11 Scripts C.2 (cuatro archivos)

En cada uno, **una** ocurrencia:

| Archivo | Cambio |
|---------|--------|
| `scripts/seo-live-collect.mjs` | `override: true` → `override: false` **y** `timeout: 120_000` → `timeout: 180_000` |
| `scripts/google-search-console-live.mjs` | `override: true` → `override: false` |
| `scripts/google-analytics-live.mjs` | `override: true` → `override: false` |
| `scripts/bing-webmaster-live.mjs` | `override: true` → `override: false` |

No tocar otros scripts con `override: true`. No commitear `.env.local`.

**Pass:**

```bash
rg "override: true" scripts/seo-live-collect.mjs scripts/google-search-console-live.mjs scripts/google-analytics-live.mjs scripts/bing-webmaster-live.mjs
# Esperado: 0
rg "timeout: 180_000" scripts/seo-live-collect.mjs
# Esperado: 1
```

### Cierre Fase 1

```bash
git status --short
git diff --stat
```

Esperado: 11 archivos de código/test (10 del paquete + test fase2). Si `docs/audits/*` aparece, **no** añadirlo a este commit.

| Check | Pass | Fail |
|-------|------|------|
| 11 archivos de código/test | Continuar Fase 2 | Completar el archivo que falte |
| Diff ajeno (auth, schema, `app/(public)` visual no listado) | Parar | Revertir ese archivo |

---

## Fase 2: Validación local

**Stop si lint, tsc o vitest fallan.**

```bash
npm run lint
npx tsc --noEmit
npx vitest run tests/fase2-arquitectura-publica.test.ts tests/crawl-contract.test.ts tests/blog-metadata-only.test.ts
```

| Comando | Pass | Fail |
|---------|------|------|
| `npm run lint` | exit 0 | Corregir solo errores introducidos |
| `npx tsc --noEmit` | exit 0 | Si `crawlDelay` type error: parar (no castear a `any`) |
| vitest 3 archivos | exit 0 | Si fase2: revisar `heroTitle` |

App local (otra terminal):

```bash
PORT=3100 npm run e2e:start:public
# Esperar a que Next escuche en 127.0.0.1:3100
```

Comprobar titles (con el servidor arriba):

```bash
curl -s http://127.0.0.1:3100/preguntas-frecuentes | grep -o '<title>[^<]*</title>'
# Esperado: <title>Honorarios y primera consulta | FAQ</title>

curl -s http://127.0.0.1:3100/despacho | grep -o '<title>[^<]*</title>'
# Esperado: <title>Abogados colegiados en Nacaome, Valle | Equipo</title>

curl -s http://127.0.0.1:3100/blog/derecho-de-familia/divorcio-honduras-guia-completa | grep -o '<title>[^<]*</title>'
# Debe contener: Divorcio en Honduras: mutuo acuerdo, causal y plazos

curl -s http://127.0.0.1:3100/blog/derecho-penal/que-hacer-si-me-detienen-en-honduras | grep -o '<title>[^<]*</title>'
# Debe contener: Detención en Honduras: derechos, 24 h y qué no firmar

curl -s http://127.0.0.1:3100/blog/hondurenos-en-espana/nacionalidad-espanola-para-hondurenos-residencia-plazos | grep -o '<title>[^<]*</title>'
# Debe contener: Nacionalidad española para hondureños: plazos

curl -s http://127.0.0.1:3100/abogados-en-nacaome | grep -oE '<h1[^>]*>[^<]+</h1>' | head -1
# Esperado: Sede en Nacaome: dirección, horario y visita

curl -s http://127.0.0.1:3100/ | grep -c "No tenemos oficina en Tegucigalpa"
# Esperado: ≥ 1

curl -s http://127.0.0.1:3100/blog/derecho-civil/prescripcion-deudas-plazos-honduras | grep -A2 'aria-label="Tabla de contenidos"' | head -20
# Esperado: <button type="button"  — no <a href="#

curl -s http://127.0.0.1:3100/robots.txt | sed -n '/User-Agent: Bingbot/,/User-Agent:/p'
# Esperado: Crawl-delay: 2 (o Crawl-Delay, según serialización de Next)

curl -s http://127.0.0.1:3100/politica-privacidad | grep -c "Ley de Protección de Datos de Honduras"
# Esperado: 0  — si es ≥1, el hero viene de page_content en DB: editar en admin (no en más código)
```

Lighthouse (anotar; **no** es gate de merge):

```bash
npx lighthouse "http://127.0.0.1:3100/" \
  --preset=perf --form-factor=mobile --screenEmulation.mobile=true \
  --screenEmulation.width=390 --screenEmulation.height=844 --screenEmulation.deviceScaleFactor=2 \
  --throttling-method=simulate --only-categories=performance,accessibility \
  --output=json --output-path="/tmp/jv-lh-local-home" --chrome-flags="--headless --no-sandbox"

npx lighthouse "http://127.0.0.1:3100/blog/derecho-de-familia/pension-alimenticia-porcentaje-honduras-2026" \
  --form-factor=mobile --screenEmulation.mobile=true --only-categories=performance \
  --output=json --output-path="/tmp/jv-lh-local-pension" --chrome-flags="--headless --no-sandbox"

npx lighthouse "http://127.0.0.1:3100/solicitar-consulta" \
  --form-factor=mobile --screenEmulation.mobile=true --only-categories=performance \
  --output=json --output-path="/tmp/jv-lh-local-consulta" --chrome-flags="--headless --no-sandbox"

node -e "for (const n of ['home','pension','consulta']) { const j=require('/tmp/jv-lh-local-'+n); const a=j.audits['largest-contentful-paint']; console.log(n, Math.round(a.numericValue)); }"
```

Collector:

```bash
npm run seo:doctor
# Pass: ERROR: 0

npm run indexnow:dry
# Pass: dry-run; no envía. Prohibido ENABLE_INDEXNOW_SUBMIT=true

npm run seo:collect
```

| `seo:collect` | Acción |
|---------------|--------|
| 6/6 | Pass |
| Timeout 120 s | Fail C.2 (revisar `timeout: 180_000`) |
| `ERR_OSSL_UNSUPPORTED` en GSC/GA4 | **Residual conocido** (SA JWT). No bloquea el merge de frontend. Anotar. No ampliar C.2 en este PR |

Commit **solo con autorización expresa**:

```bash
git add \
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

git commit -m "$(cat <<'EOF'
fix(seo): remediación on-page, Bingbot crawlDelay y collector dotenv

EOF
)"
```

No `git push` aquí.

---

## Fase 3: Preview Vercel

**Solo con orden expresa de push.**

```bash
git push -u origin HEAD
gh pr create --base main --title "fix(seo): remediación on-page 2026-08-16" --body "$(cat <<'EOF'
## Summary
- Aplica el paquete docs/audits/paquete-ejecucion-tecnica-2026-08-16.md (0/10 en producción el 2026-08-16).
- Titles/metas, TOC button, footer Nacaome, robots Bingbot, privacidad, collector override:false.
- Test fase2: heroTitle Nacaome actualizado.

## Test plan
- [ ] curl titles FAQ, despacho, divorcio, detención, nacionalidad
- [ ] TOC prescripción: button, no href #
- [ ] Footer: «No tenemos oficina en Tegucigalpa»
- [ ] robots.txt Bingbot Crawl-delay: 2
- [ ] /politica-privacidad sin «Ley de Protección de Datos de Honduras»
- [ ] lint + tsc + vitest citados

EOF
)"
```

Sustituir `PREVIEW` por la URL de Vercel del PR:

```bash
PREVIEW="https://JUSTICIA-VERDADERA-git-feat-remediacion-seo-2026-08.vercel.app"

curl -s "$PREVIEW/preguntas-frecuentes" | grep -o '<title>[^<]*</title>'
curl -s "$PREVIEW/despacho" | grep -o '<title>[^<]*</title>'
curl -s "$PREVIEW/" | grep -c "No tenemos oficina en Tegucigalpa"
curl -s "$PREVIEW/robots.txt" | sed -n '/User-Agent: Bingbot/,/User-Agent:/p'
curl -s "$PREVIEW/politica-privacidad" | grep -c "Ley de Protección de Datos de Honduras"
curl -s "$PREVIEW/blog/derecho-civil/prescripcion-deudas-plazos-honduras" | grep -A2 'aria-label="Tabla de contenidos"' | head -15
```

| Check Preview | Pass | Fail |
|---------------|------|------|
| 5 titles esperados | Continuar | No mergear |
| Footer ≥1 | Continuar | Revisar 1.7 |
| Crawl-delay Bingbot | Continuar | Revisar 1.10 + rebuild |
| Ley de Protección = 0 | Continuar | Admin `page_content` hero.subtitle |
| TOC `<button>` | Continuar | Revisar 1.6 |

Sin preview: no saltar a producción; pedir al titular Preview o merge consciente.

---

## Fase 4: Producción

**STOP. Confirmación manual del titular (sí/no).**

No ejecutar lo siguiente sin ese «sí»:

- `gh pr merge`
- `git push` a `main`
- Promote en Vercel
- IndexNow real

Cuando el titular apruebe:

1. Merge del PR a `main` (GitHub UI o `gh pr merge --squash` / merge commit según la norma del repo: **ramas cortas + PR**, no push directo a `main`).
2. Vercel Production: esperar Ready.
3. Anotar el deployment ID en el checklist.

```bash
# Solo lectura: comprobar que Production apunta al SHA del merge
npx vercel ls --prod
```

No migraciones. No variables de entorno nuevas.

| Check | Pass | Fail |
|-------|------|------|
| Titular dijo «desplegar» | Merge | Detenerse |
| Deploy Production Ready | Fase 5 | Rollback Fase 6 |

---

## Fase 5: Verificación post-deploy rápida

```bash
BASE="https://www.pinedayasociadoshn.com"

curl -s "$BASE/preguntas-frecuentes" | grep -o '<title>[^<]*</title>'
# PASS: <title>Honorarios y primera consulta | FAQ</title>

curl -s "$BASE/despacho" | grep -o '<title>[^<]*</title>'
# PASS: <title>Abogados colegiados en Nacaome, Valle | Equipo</title>

curl -s "$BASE/blog/derecho-de-familia/divorcio-honduras-guia-completa" | grep -o '<title>[^<]*</title>'
# PASS: contiene «mutuo acuerdo, causal y plazos»

curl -s "$BASE/blog/derecho-penal/que-hacer-si-me-detienen-en-honduras" | grep -o '<title>[^<]*</title>'
# PASS: contiene «Detención en Honduras: derechos, 24 h»

curl -s "$BASE/blog/hondurenos-en-espana/nacionalidad-espanola-para-hondurenos-residencia-plazos" | grep -o '<title>[^<]*</title>'
# PASS: contiene «Nacionalidad española para hondureños: plazos»

curl -s "$BASE/" | grep -c "No tenemos oficina en Tegucigalpa"
# PASS: ≥ 1

curl -s "$BASE/robots.txt"
# PASS: bloque Bingbot con Crawl-delay: 2

curl -s "$BASE/politica-privacidad" | grep -c "Ley de Protección de Datos de Honduras"
# PASS: 0

curl -sI -o /dev/null -w "%{http_code} %{redirect_url}\n" \
  "$BASE/blog/proceso-penal/sobreseimiento-definitivo-provisional-diferencias-honduras"
# PASS: 308 + destino corto
```

Si **cualquiera** de titles / footer / robots / ley falla → Fase 6 inmediata. No «esperar cache».

Tras PASS: copiar resultados a una nueva pasada de `verificacion-post-deploy` (otro archivo, otra fecha) o reejecutar el prompt de verificación.

Editorial (fuera de git, no bloquea rollback de código):

- Admin: `page_content` privacidad `hero.subtitle` si el curl de ley sigue ≥1.
- Enlaces HTML pensión % ↔ guía (DB `blog_posts`).

GA4/Bing UI (A.3, A.4, C.1): no son este deploy; seguir el paquete §3 cuando el titular tenga acceso Editor.

---

## Fase 6: Plan de rollback

Usar si Fase 5 FAIL o regresión visible (layout roto, 5xx, robots que bloquea Googlebot).

**Prohibido:** `git reset --hard`, `git push --force` a `main`, `git clean -fd`.

### A. Vercel Instant Rollback (primero, &lt; 2 min)

1. Vercel → proyecto → Deployments → Production anterior a este merge → **Promote** / Instant Rollback.
2. Repetir curls de Fase 5 contra producción.
3. Pass: titles vuelven al estado 2026-08-16 (pre-parche). Anotar.

### B. Revert Git (si hay que dejar `main` coherente)

```bash
git fetch origin
git log origin/main -5 --oneline
# Identificar el merge/squash SHA de feat/remediacion-seo-2026-08

git switch -c revert/remediacion-seo-2026-08 origin/main
git revert <SHA> --no-edit
# Si es squash de un commit: un revert. Si es merge commit: git revert -m 1 <SHA>
```

PR de revert → merge **con autorización**. No force-push.

### C. Restaurar archivos a mano (si el revert falla)

Los originales están en `backup/pre-remediacion-seo-2026-08` / `origin/main` pre-merge:

```bash
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

Luego PR + deploy. No editar producción a mano en Vercel.

308: **no revertir** `next.config.ts` (este paquete no lo toca).

---

## Checklist de aprobación final

- [ ] Rama `feat/remediacion-seo-2026-08` desde `origin/main` (no desde el PR editorial)
- [ ] 11 archivos de código/test aplicados; diffs = paquete
- [ ] `npm run lint` exit 0
- [ ] `npx tsc --noEmit` exit 0
- [ ] Vitest fase2 + crawl-contract + blog-metadata-only exit 0
- [ ] Curls localhost: 5 titles, footer, TOC button, robots Bingbot, privacidad sin esa ley
- [ ] Lighthouse 3 URLs **anotado** (LCP no es gate)
- [ ] `seo:doctor` 0 ERROR; IndexNow solo dry-run
- [ ] `seo:collect` anotado (timeout 120s = FAIL C.2; OpenSSL SA = residual)
- [ ] Preview Vercel PASS en titles/footer/robots/privacidad/TOC
- [ ] **El titular ha aprobado el despliegue a producción**
- [ ] Production Fase 5: 5 titles + footer + Crawl-delay + sin ley innominada
- [ ] 308 siguen 308 (sin cambio)
- [ ] Enlaces pensión DB y GBP: fuera de este PR
