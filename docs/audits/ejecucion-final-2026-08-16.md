---
status: current
owner: seo
created: 2026-08-16
last_reviewed: 2026-08-16
review_due: 2026-08-17
supersedes: null
---

# EJECUCIÓN FINAL DE LA REMEDIACIÓN - 2026-08-16

**Orden al desarrollador:** ejecutar el Paso 1 ahora. Detalle: `docs/audits/instrucciones-go-live-2026-08-16.md`.  
**No** `./scripts/apply-remediacion.sh --push`. **No** mezclar con `fix/allow-production-editorial-upsert`. Si un paso falla: parar y reportar.

## Estado actual

| Artefacto | Estado |
|-----------|--------|
| Producción `pinedayasociadoshn.com` | Pre-remediación (**0/10** parches; 0/9 curls 2026-08-16) |
| Auditoría | `docs/audits/auditoria-sitio-completa-2026-08-15.md` |
| Plan / paquete / implementación | `plan-remediacion-…`, `paquete-ejecucion-tecnica-…`, `plan-implementacion-final-…` |
| Script | `scripts/apply-remediacion.sh` + `patch-utils.js` — dry-run **14/14 PASS** (`validacion-script-automatizacion-2026-08-16.md`) |
| Go-live | `instrucciones-go-live-2026-08-16.md` |
| Impacto 7/14d | Bloqueado hasta T0 (`informe-impacto-remediacion-2026-08-16.md`) |

## Acción inmediata (desarrollador)

```bash
cd "/Users/fonsi/Documents/Justicia Verdadera"
chmod +x scripts/apply-remediacion.sh scripts/patch-utils.js

# 1a. Dry-run (no escribe). PASS = failed:false
./scripts/apply-remediacion.sh --create-branch --dry-run

# 1b. Escribe los 14 archivos + lint/tsc/vitest. SIN --push
./scripts/apply-remediacion.sh --create-branch

git rev-parse --abbrev-ref HEAD
# PASS: feat/remediacion-seo-2026-08
```

## Verificación post-ejecución (local)

El wrapper ya corre lint/tsc/vitest. Confirmar a mano:

- [ ] `npm run lint` PASS
- [ ] `npx tsc --noEmit` PASS
- [ ] `npx vitest run tests/fase2-arquitectura-publica.test.ts tests/crawl-contract.test.ts tests/blog-metadata-only.test.ts` PASS
- [ ] Rama `feat/remediacion-seo-2026-08`; `git diff --stat` = **solo 14** archivos de producto

Con `PORT=3100 npm run e2e:start:public` (otra terminal), `LOCAL=http://127.0.0.1:3100`:

- [ ] FAQ: `<title>Honorarios y primera consulta | FAQ</title>`
- [ ] Despacho: `Abogados colegiados en Nacaome, Valle | Equipo`
- [ ] Divorcio: «mutuo acuerdo, causal y plazos»
- [ ] Detención: «derechos, 24 h»
- [ ] Nacionalidad: «hondureños: plazos»
- [ ] Footer: «No tenemos oficina en Tegucigalpa»
- [ ] TOC prescripción: `<button type="button">`, no `<a href="#`
- [ ] `robots.txt` Bingbot: `Crawl-delay: 2`
- [ ] `/politica-privacidad`: 0× «Ley de Protección de Datos de Honduras» (si ≥1: hero en DB; anotar, no más código)

## Creación del PR

- [ ] `git add` **solo** los 14 paths (lista en `instrucciones-go-live-2026-08-16.md`)
- [ ] `git commit -m "fix(seo): remediación on-page y Bingbot crawlDelay"` — solo con autorización
- [ ] `git push -u origin HEAD` — solo con autorización
- [ ] `gh pr create --base main --title "fix(seo): remediación on-page 2026-08-16"`
- [ ] **No mergear** sin «sí» del titular

## Despliegue a producción

- [ ] Aprobación explícita del titular
- [ ] Merge del PR (GitHub UI; historial = merge commit)
- [ ] Vercel Production Ready
- [ ] Mismos curls contra `https://www.pinedayasociadoshn.com/`
- [ ] Anotar T0 (SHA + hora)

## Monitoreo posterior

- Día 7 y día 14: GSC/GA4 vs línea base (`verificacion-post-deploy-2026-08-16.md` / `informe-impacto-…`)
- Éxito 14–28d: CTR divorcio **> 1,5 %**; detención **> 1,0 %**; hashes `prescripcion-deudas-plazos-honduras#` **&lt; 50 imp** en 28d
- 7d = estable/monitorear; no causalidad con muestra chica
- GA4 UI: comparación «Público canónico»; marcar `email_click`

## Rollback (si es necesario)

- Vercel Instant Rollback (&lt; 2 min)
- `git revert -m 1 <SHA>` del merge (PR; no force-push; no `reset --hard`)

## Responsables

- Ejecución: desarrollador (Paso 1 **ahora**)
- Aprobación merge/producción: titular del despacho
- Monitoreo T0+7 / T0+14: equipo SEO
