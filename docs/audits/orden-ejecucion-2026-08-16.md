---
status: current
owner: seo
created: 2026-08-16
last_reviewed: 2026-08-16
review_due: 2026-08-16
supersedes: null
---

# ORDEN DE EJECUCIÓN - REMEDIACIÓN SEO 2026-08-16

**Para:** desarrollador y titular del despacho  
**Detalle:** `docs/audits/instrucciones-go-live-2026-08-16.md`  
**Prohibido:** `--push` del wrapper, mezcla con `fix/allow-production-editorial-upsert`, IndexNow real, merge sin el titular.

## Estado actual

- Producción `https://www.pinedayasociadoshn.com/`: **pre-remediación** (0/9 checks, `verificacion-post-deploy-2026-08-16-go-live.md`)
- Script: `scripts/apply-remediacion.sh` — dry-run **14/14 PASS**
- Artefactos: auditoría, plan, paquete, validación, go-live, ejecución final — listos

## Acción inmediata (ejecutar ahora)

```bash
cd "/Users/fonsi/Documents/Justicia Verdadera"
chmod +x scripts/apply-remediacion.sh scripts/patch-utils.js

# 1. Dry-run (no escribe). PASS = failed:false. FAIL → parar.
./scripts/apply-remediacion.sh --create-branch --dry-run

# 2. Aplica 14 archivos + lint/tsc/vitest. SIN --push. FAIL → parar.
./scripts/apply-remediacion.sh --create-branch

git rev-parse --abbrev-ref HEAD
# PASS: feat/remediacion-seo-2026-08

# 3. App local (otra terminal). Esperar a que escuche.
PORT=3100 npm run e2e:start:public

LOCAL=http://127.0.0.1:3100
curl -s "$LOCAL/preguntas-frecuentes" | grep -o '<title>[^<]*</title>'
curl -s "$LOCAL/despacho" | grep -o '<title>[^<]*</title>'
curl -s "$LOCAL/blog/derecho-de-familia/divorcio-honduras-guia-completa" | grep -o '<title>[^<]*</title>'
curl -s "$LOCAL/blog/derecho-penal/que-hacer-si-me-detienen-en-honduras" | grep -o '<title>[^<]*</title>'
curl -s "$LOCAL/blog/hondurenos-en-espana/nacionalidad-espanola-para-hondurenos-residencia-plazos" | grep -o '<title>[^<]*</title>'
curl -s "$LOCAL/" | grep -c "No tenemos oficina en Tegucigalpa"
curl -s "$LOCAL/robots.txt" | sed -n '/User-Agent: Bingbot/,/User-Agent:/p'
curl -s "$LOCAL/blog/derecho-civil/prescripcion-deudas-plazos-honduras" | grep -A8 'aria-label="Tabla de contenidos"' | head -20
curl -s "$LOCAL/politica-privacidad" | grep -c "Ley de Protección de Datos de Honduras"
```

Si **todos** los checks locales PASS (privacidad DB: anotar si ≥1, no bloquear el PR de git):

```bash
# 4. PR — commit/push solo con autorización. No usar el --push del script.
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

git commit -m "$(cat <<'EOF'
fix(seo): remediación on-page y Bingbot crawlDelay

EOF
)"
git push -u origin HEAD
gh pr create --base main --title "fix(seo): remediación on-page 2026-08-16" --body "$(cat <<'EOF'
## Summary
- Remediación on-page 2026-08-16 (paquete técnico + script validado).
- Titles/metas, TOC button, footer, robots Bingbot, privacidad, collector dotenv.
- Test fase2: heroTitle Nacaome operativo.

## Test plan
- [ ] 9 checks locales y Preview
- [ ] No mergear sin el titular

EOF
)"
```

5. Titular aprueba el PR (**no mergear sin ese sí**).  
6. Merge en GitHub UI → Vercel Production Ready. Anotar T0 (SHA + hora).  
7. Equipo SEO: mismos curls contra `https://www.pinedayasociadoshn.com/` y el prompt de verificación post-deploy.

## Checklist (local y producción)

- [ ] FAQ: `Honorarios y primera consulta | FAQ`
- [ ] Despacho: `Abogados colegiados en Nacaome, Valle | Equipo`
- [ ] Divorcio: «mutuo acuerdo, causal y plazos»
- [ ] Detención: «derechos, 24 h»
- [ ] Nacionalidad: «hondureños: plazos»
- [ ] Footer: «No tenemos oficina en Tegucigalpa»
- [ ] `robots.txt` Bingbot: `Crawl-delay: 2`
- [ ] TOC: `<button type="button">`, no `<a href="#`
- [ ] Privacidad: 0× «Ley de Protección de Datos de Honduras»

## Plazo

**Hoy, 2026-08-16, antes de las 18:00 hora de Honduras (UTC-6).**  
(18:00 UTC ya pasó; el corte operativo es el cierre del día local.)

## Protocolo de seguimiento

1. Desarrollador confirma: rama, PR URL, checks locales.  
2. Titular: sí/no al merge.  
3. Tras Production Ready: SEO ejecuta verificación post-deploy (nuevo archivo con fecha T0). APROBADO solo si 9/9 en vivo.  
4. T0+7 y T0+14: informe de impacto vs línea base.

## Responsables

- Ejecución: desarrollador  
- Aprobación merge/producción: titular del despacho  
- Verificación post-deploy: equipo SEO

## En caso de fallo

Detener. No merge. No `--push` del wrapper. No force-push. Reportar el comando y la salida. Rollback solo si ya hubo Production: Instant Rollback o `git revert -m 1 <SHA>`.
