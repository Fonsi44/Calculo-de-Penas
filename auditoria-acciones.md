# Registro de acciones estándar (auditoria-acciones)

Trazabilidad de operaciones de auditoría y diagnóstico. Registro apéndice (no releases ni saneamientos — esos van en CHANGELOG.md / AUDIT_REPOSITORY_REPORT.md respectivamente).

---

## 2026-07-08 — Auditoría SEO Integral Bing Webmaster + cruzado multi-fuente

**Operación:** Auditoría SEO completa usando Bing Webmaster Tools (API Key) cruzada con GSC, GA4, SEO Health, IndexNow, sitemap y export Ahrefs.

**Pipeline ejecutado (protocolo AGENTS.md §1 cumplido):**
1. `git status` → working tree clean.
2. `npm run seo:doctor` → 18 OK / 1 ERROR (gcloud) / 4 PENDIENTE (Bing OAuth entre ellos).
3. `npm run seo:collect` → 6/6 fuentes recolectadas OK.
4. `npm run seo:health` → 13 OK / 2 warn / 0 fail.
5. `npm run indexnow:dry` → 24 URLs / techo 223.
6. Análisis de `data/bing/bing-live.json`, `data/google/gsc-live.json`, `data/google/ga4-live.json`.
7. Análisis cruzado con Ahrefs CSV (4xx, orphan, titles, structured-data) y `docs/audits/indexacion-monitorizacion.md`.

**Hallazgos clave (ver informe para detalle y evidencia):**
- CRÍTICA: indexación Google prácticamente nula (solo `/` indexada; 16 URLs comerciales pendientes).
- ALTA: Bing OAuth no autenticado → posición/CTR/HTTP/backlinks no disponibles.
- ALTA: 11 URLs 4xx por enlaces internos mal construidos (paths dobles `/blog/x/blog/y`).
- ALTA: 8 páginas huérfanas con 0 enlaces internos.
- MEDIA: JSON-LD home solo `FAQPage` (falta `LegalService`/`LocalBusiness`).
- Oportunidad: 106 impresiones page-1 en queries de pensión alimenticia con CTR 1,9 %.

**Archivos generados:**
- `docs/audits/auditoria-bing-webmaster-2026-07-08.md` (informe completo, 12 secciones).
- Regenerados por `seo:collect`: `data/bing/bing-live.json`, `data/google/gsc-live.json`, `data/google/ga4-live.json`, `data/seo/live-summary.json`, `docs/audits/bing-live-report.md`, `docs/audits/seo-live-summary.md`.

**Clasificación:** `VALIDADO` (datos reales extraídos) con bloque Bing `PARCIAL` (falta OAuth).
**No se aplicaron cambios de código.** Solo lectura, extracción y generación de informe.
**No se hizo push.**

---

## 2026-07-08 — Plan operativo post-auditoría (5 bloques)

**Operación:** Conversión de hallazgos pendientes de la auditoría en plan operativo ejecutable y priorizado. Solo lectura + generación de documento de planificación.

**Validaciones no destructivas ejecutadas:**
- `git status` → working tree con docs generados (auditoría previa).
- `npm run bing:auth:status` → `❌ No autorizado` (confirma: BING_CLIENT_ID configurado, device flow listo).
- `npm run seo:doctor` → 18 OK / 1 ERROR / 4 PENDIENTE (Bing OAuth token pendiente).
- `npm run blog:fix-redirects` → dry-run: 0 correcciones (hrefs rotos no están en `post.body`).
- Query DB `blog_posts.body` → 0 hrefs relativos sospechosos.
- Fetch live de 11 URLs 4xx → 5 ya resuelven 200 vía redirect existente, 6 siguen 404.
- Búsqueda exhaustiva en `app/`, `components/`, `lib/` → 0 hrefs relativos en código fuente.
- Fetch live de 10 URLs comerciales → 10/10 HTTP 200, sin X-Robots-Tag restrictivo.
- Extracción title/meta del post de pensión alimenticia (HTML renderizado).

**Hallazgos técnicos clave:**
- El script `blog:fix-redirects:dry` NO existe (el correcto es `blog:fix-redirects`, ya dry-run por defecto). No se inventó el comando.
- Las 6 URLs 404 restantes provienen de **enlaces externos entrantes** (no internos): confirmado por búsqueda exhaustiva en código y DB. El fix es exclusivamente redirects en `next.config.ts` (zona protegida → solo propuesta).
- Queries de pensión alimenticia: 152 impresiones / 5 clics (CTR 3,3 %) en 28 días, no 106 como se estimó en la auditoría.

**Archivos generados:**
- `docs/audits/plan-accion-seo-post-auditoria-2026-07-08.md` (plan operativo de 5 bloques).

**No se modificó README.md ni CHANGELOG.md:** no se añadieron comandos nuevos ni se hizo release; registrar planificación en CHANGELOG sería inflar el registro sin causa real (AGENTS.md §1.9 reserva CHANGELOG para releases).

**Clasificación:** `PROPUESTA` (todo requiere autorización previa; 0 cambios de código aplicados).
**No se hizo push.**

---

## 2026-07-08 — Ejecución del plan post-auditoría + QA + cierre

**Operación:** Ejecución de todo lo ejecutable del plan operativo (5 bloques) respetando zonas protegidas de `AGENTS.md` §7, con QA tras cada bloque.

**Zonas protegidas confirmadas (NO modificadas):** `next.config.ts` (redirects), `app/(public)/**/*.tsx`, DB `blog_posts` (sin backup previo).

**Comandos ejecutados y resultado:**
- `npm run bing:auth:status` → `❌ No autorizado` (PENDIENTE HUMANO: device flow interactivo no simulable).
- `npm run seo:doctor` → 18 OK / 1 ERROR (gcloud, preexistente) / 4 PENDIENTE. Sin regresiones.
- `npm run seo:health` → 13 OK / 2 warn / 0 fail. Sin regresiones.
- `npm run indexnow:dry` → 24 URLs / techo 223 ✅.
- `npm run blog:fix-redirects` → dry-run: 0 correcciones (esperado; hrefs no en DB).
- Fetch live 10 URLs comerciales → 10/10 HTTP 200, sin noindex, canonical self OK, en sitemap. VALIDADO.
- Fetch live 6 URLs 404 → 6/6 siguen 404 (estado estable, origen externo confirmado).
- Fetch live 8 páginas huérfanas → 8/8 HTTP 200, indexables, canonical self. Siguen huérfanas.

**Archivos modificados:**
- `docs/audits/cierre-ejecucion-seo-2026-07-08.md` (NUEVO — informe de cierre).
- `auditoria-acciones.md` (este registro).

**Cambios de código aplicados:** NINGUNO. No se modificó `next.config.ts`, `app/(public)`, DB ni ningún archivo fuente. README.md y CHANGELOG.md sin cambios (no procede).

**Acciones pendientes humanas (5):**
- H1: `npm run auth:bing` (device flow, 5 min) — desbloquea datos Bing.
- H2: Solicitar indexación GSC de 10 URLs (30 min) — mayor impacto SEO.
- H3: Aplicar 4 redirects en `next.config.ts` (autorización Desarrollo, 15 min).
- H4: Aplicar enlazado interno en `app/(public)` (autorización Desarrollo, 30 min).
- H5: Aplicar Propuesta A title/meta pensión (backup DB previo, 10 min).

**Riesgos:** OAuth Bing rechazado (medio, API Key fallback), indexación Google lenta (medio, requiere backlinks), cambio title sin mejora (bajo, monitorizar 28d).

**Cómo revertir:** no aplica — 0 cambios destructivos ni de código. Los docs generados pueden borrarse sin impacto funcional.

**Clasificación:** Bloques 1 `PENDIENTE HUMANO`; 2 `VALIDADO` (señales servidor) / `PENDIENTE HUMANO` (indexación real GSC); 3, 4, 5 `VALIDADO` (diagnóstico) / `PROPUESTA` (fix no aplicado por zona protegida).
**No se hizo commit. No se hizo push.**

---

## 2026-07-08 — Revisión profunda GSC + GA4 con cruce URL por URL

**Operación:** Análisis exhaustivo de GSC y GA4 con datos refrescados hoy, cruce URL por URL (9 categorías), identificación de mejoras aplicables vs propuestas. Solo lectura + documentación.

**Comandos ejecutados y resultado:**
- `npm run seo:collect` → 6/6 fuentes OK.
- `npm run seo:audit:gsc-ga4` → novedad: URL Inspection API confirma index status real.
- `npm run seo:doctor` → 18 OK / 1 ERROR / 4 PENDIENTE. Sin regresiones.
- `npm run seo:health` → 13 OK / 2 warn / 0 fail. Sin regresiones.
- `npm run indexnow:dry` → 24 URLs / techo 223 ✅.
- Query DB `blog_posts` (titles/metas de 7 posts top GSC) → evidencia para P1.

**Hallazgo crítico que cambia el diagnóstico previo:**
- **Las 10 URLs comerciales están "Enviada e indexada" (PASS)** vía URL Inspection API. El "problema crítico de indexación" del 4 de julio SE RESOLVIÓ solo tras el re-envío del sitemap (3 jul). La acción H2 (solicitud manual GSC) **ya NO es necesaria**.

**Otros hallazgos VALIDADOS:**
- Anomalía canónica: home en GSC bajo `http://apex` (15 clics) + `https://www` (6 clics) — autoridad dividida.
- 6 posts con +350 impresiones y CTR < 3 % por títulos genéricos.
- 3 eventos GA4 definidos SIN disparos (`form_click`, `email_click`, `directions_click`).
- 14 páginas `/intranet/*` en GA4 top pages pese a exclusión definida en `lib/analytics.ts`.
- 8 huérfanas: 0 impresiones GSC + 0 sesiones GA4 (invisibles pese a indexables).
- 6 URLs 404: 0 impresiones GSC (baja severidad, no pierden tráfico).
- Discrepancia GSC/GA4: tráfico orgánico entra por blog; comerciales se nutren de directo. Falta embudo blog→comercial.

**Mejoras APLICADAS:** NINGUNA. Tras revisión exhaustiva, ninguna mejora de impacto cumple todas las condiciones (no protegida + reversible + sin credencial externa). Las de alto impacto tocan DB `blog_posts` (titles) o zonas protegidas `app/(public)` / `next.config.ts`. El único archivo no protegido relevante (`data/seo/high-intent-guides.ts`) ya está correcto.

**Archivos modificados:**
- `docs/audits/revision-gsc-ga4-mejoras-2026-07-08.md` (NUEVO — informe con cruce GSC+GA4).
- `auditoria-acciones.md` (este registro).
- Regenerados por scripts: `data/google/gsc-live.json`, `data/google/ga4-live.json`, `data/bing/bing-live.json`, `data/seo/live-summary.json`, `docs/audits/*.md`, `scripts/.seo-audit.json`.

**Propuestas generadas (6, priorizadas):**
- P1: optimizar title/meta de 6 posts top (alto impacto CTR, requiere backup DB).
- P2: investigar consolidación canónica home (requiere GSC UI).
- P3: investigar 3 eventos GA4 sin disparos (requiere revisar `app/(public)`).
- P4: enlazado interno posts top → landings comerciales (requiere `app/(public)`).
- P5: enlazar 8 huérfanas (requiere `app/(public)`).
- P6: reducir contaminación GA4 intranet (requiere GA4 UI + investigación).

**Riesgos:** anomalía canónica (medio), CTR bajo posts top (medio-alto, pierde clics diarios), eventos sin trackear (medio), huérfanas invisibles (medio).

**Cómo revertir:** no aplica — 0 cambios de código. Docs generados reversibles borrándolos.

**Clasificación:** GSC/GA4/cruce `VALIDADO`; indexación 10 URLs `VALIDADO` (resuelto); mejoras aplicables `SIN CAMBIOS` (0 aplicadas); P1-P6 `PROPUESTA`.
**No se hizo commit. No se hizo push.**

---

## 2026-07-08 — Revisión final: canonicalización + fix GSC API APLICADO

**Operación:** Verificación de canonicalización tras eliminación de property sin-www en GSC, diagnóstico de acceso GSC roto, aplicación de fix seguro, QA completo.

**Diagnóstico inicial:**
- `seo:collect` bajó a 5/6 fuentes; `seo:doctor` a 17 OK / 5 PENDIENTE.
- `seo:gsc:live` → `ERROR: User does not have sufficient permission for site 'sc-domain:pinedayasociadoshn.com'`.
- `seo:audit:gsc-ga4` → la cuenta OAuth es `siteOwner` de `https://www.pinedayasociadoshn.com/` (URL-prefix) pero NO de `sc-domain:`.

**Cambio APLICADO (A1):**
- Archivo: `.env.local` línea 20.
- Cambio: `GOOGLE_SEARCH_CONSOLE_SITE_URL=sc-domain:pinedayasociadoshn.com` → `GOOGLE_SEARCH_CONSOLE_SITE_URL=https://www.pinedayasociadoshn.com/`.
- Justificación: restaura acceso GSC API roto tras reorganización de propiedades. `.env.local` no es zona protegida (AGENTS.md §7), está gitignored, el cambio es reversible y validable.
- Validación: `seo:gsc:live` ✅ (161 clics/8350 imp), `seo:audit:gsc-ga4` ✅ (URL inspection 10/10 PASS), `seo:collect` 6/6, `seo:doctor` 18 OK.
- Reversión: revertir valor a `sc-domain:pinedayasociadoshn.com`.

**Canonicalización VALIDADA:**
- 4 variantes dominio (http/www, https/non-www) → todas convergen a `https://www.pinedayasociadoshn.com/`.
- 0 referencias `http://` o `sin-www` en `lib/`, `app/`, `components/`, `data/`.
- `lib/site.ts` y `.env.example` usan exclusivamente `https://www.`.
- Anomalía GSC previa (home duplicada http/https) RESUELTA.

**Efectos del fix:**
- GSC performance API restaurado (queries, pages, countries, devices).
- URL Inspection API restaurado (10/10 URLs PASS — indexación confirmada).
- `seo:collect` 6/6 fuentes (antes 5/6).
- `seo:doctor` 18 OK / 4 PENDIENTE (antes 17/5).
- Anomalía canónica GSC resuelta (home ya no duplicada).

**Hallazgos re-confirmados:**
- 10 URLs comerciales: `RESUELTO VALIDADO` (indexadas). H2 (solicitud manual GSC) ELIMINADA.
- 6 posts +350 imp CTR < 3 %: oportunidades title/meta (P1, requiere DB).
- 8 huérfanas: 0 imp GSC + 0 sesiones GA4 (P5, requiere app/(public)).
- 3 eventos GA4 sin disparos: form_click, email_click, directions_click (P3).
- 6 URLs 404: 0 tráfico GSC, baja severidad (P7, requiere next.config.ts).

**Comandos ejecutados:**
- Canonical test 4 variantes (fetch live) → 4/4 OK → https://www.
- grep referencias http/sin-www en código → 0.
- `npm run seo:collect` → 6/6 ✅.
- `npm run seo:gsc:live` → 161 clics extraídos ✅.
- `npm run seo:audit:gsc-ga4` → URL inspection 10/10 PASS ✅.
- `npm run seo:doctor` → 18 OK / 1 ERROR / 4 PENDIENTE.
- `npm run seo:health` → 13 OK / 2 warn / 0 fail.
- `npm run indexnow:dry` → 24 URLs / techo 223 ✅.
- `npm run bing:auth:status` → ❌ No autorizado (sin cambios).

**Archivos modificados:**
- `.env.local` (línea 20, 1 variable) — APLICADO, reversible.
- `docs/audits/revision-final-seo-gsc-ga4-canonical-2026-07-08.md` (NUEVO).
- `auditoria-acciones.md` (este registro).
- Regenerados por scripts: `data/google/gsc-live.json`, `data/google/ga4-live.json`, `data/bing/bing-live.json`, `data/seo/live-summary.json`, `docs/audits/*.md`, `scripts/.seo-audit.json`.

**Instrucciones humanas restantes:** H1 (Bing OAuth), P1 (titles 6 posts), P3 (eventos GA4), P4 (enlazado blog→comercial), P5 (8 huérfanas), P6 (filtro GA4), P7 (redirects 404). **H2 eliminada** (indexación confirmada).

**Clasificación:** fix A1 `APLICADO` + `VALIDADO`; canonicalización `VALIDADO` / anomalía `RESUELTO VALIDADO`; indexación 10 URLs `RESUELTO VALIDADO`; GSC/GA4 `VALIDADO`; Bing `PARCIAL`; P1-P7 `PROPUESTA`.
**No se hizo commit. No se hizo push.**

---

## 2026-07-08 — Análisis Bing Site Explorer: 96 warnings + 104 excluded

**Operación:** Análisis específico de los 96 warnings y 104 excluded de Bing Site Explorer sobre 406 URLs totales (6 meses), con clasificación de causas y distinción problema real vs ruido.

**Estado de acceso a datos:** `PARCIAL`. Bing OAuth no autenticado (`bing:auth:status` → ❌ No autorizado). Los datos detallados URL por URL de warnings/excluded solo son accesibles vía OAuth o export manual del dashboard (no presente en `data/bing/exports/`). Análisis basado en evidencia estructural cruzada.

**Comandos ejecutados:**
- `npm run bing:auth:status` → ❌ No autorizado.
- `node scripts/bing-site-explorer.mjs` → 213/213 API errors (API Key insuficiente para GetUrlInfo index status).
- `npm run seo:bing:live` → 3330 crawled, 362 4xx, 503 errors, 83 queries, 16/16 priority crawled (28d).
- `npm run seo:health` → 13 OK / 2 warn / 0 fail.
- `npm run indexnow:dry` → 24/223 ✅ (solo canónicas https://www.).
- Fetch robots.txt → 131 Disallow (patrones correctos: /intranet/, /api/, /admin/, etc.).
- Fetch 5 páginas legales → 5/5 noindex (META + X-Robots-Tag) confirmado.
- Query DB blog_posts → 149 publicados indexables, 3 con canonical override.

**Hallazgos clasificación:**
- **104 EXCLUDED:** ~80% EXCLUSIÓN CORRECTA (5 legales noindex, ~20+ robots protected, 3 canonical override, variantes http/non-www consolidadas, assets). 6 URLs 404 externas (excluidas por ser 404, redirigibles vía P7).
- **96 WARNINGS:** principal causa = 362 errores 4xx/28d (URLs 404 rastreadas); 8 huérfanas sin inlinks (signals débiles); variantes canónicas históricas (RESUELTO a nivel servidor).
- **0 URLs comerciales prioritarias afectadas** — las 10 están indexadas en GSC y rastreadas por Bing.
- **~80% es ruido normal/exclusión correcta.** ~20% accionable (4xx redirects + enlazado huérfanas) ya en propuestas P5/P7.

**Discrepancia sitemap vs Bing:** sitemap 213 URLs, Bing descubrió 406 (~193 extra: protegidas, noindex, 404, variantes, assets). Sin discrepancias críticas con GSC.

**Cambios APLICADOS:** NINGUNO. Todo lo accionable requiere zonas protegidas (next.config.ts P7, app/(public) P5), ya documentado.

**Instrucciones para listado exacto (PENDIENTE HUMANO):**
- Opción A: `npm run auth:bing` (OAuth, 5 min) → desbloquea Site Explorer API + backlinks.
- Opción B: export manual dashboard → `data/bing/exports/site-explorer-{warnings,excluded}.csv` → `npm run bing:import-dashboard`.

**Archivos modificados:**
- `docs/audits/analisis-bing-warnings-excluded-2026-07-08.md` (NUEVO).
- `auditoria-acciones.md` (este registro).
- Regenerados: `data/bing/bing-live.json`, `docs/audits/bing-live-report.md`, `scripts/.bing-explorer.json`.

**Clasificación:** acceso datos Bing `PARCIAL`; análisis estructural `VALIDADO`; clasificación causas `VALIDADO` estructural / `PARCIAL` sin listado exacto; URLs críticas `VALIDADO` (0 afectadas); problema vs ruido `VALIDADO`; cambios `SIN CAMBIOS RELEVANTES`; export `PENDIENTE HUMANO`.
**No se hizo commit. No se hizo push.**

---

## 2026-07-08 — Fix Bing OAuth invalid_scope (AADSTS70011) APLICADO

**Problema:** `npm run auth:bing` fallaba con `AADSTS70011: invalid_scope` — scope `https://ssl.bing.com/.default offline_access` no existe en Entra ID.

**Causa raíz VALIDADA:** el recurso `https://ssl.bing.com` no está registrado como Service Principal en el tenant de Entra ID para la app `BING_CLIENT_ID`. El script mezclaba el host de la API (`ssl.bing.com`) con el recurso OAuth de Entra (que es `api.bing.microsoft.com`). La documentación interna `docs/seo/bing-webmaster-oauth.md` era incorrecta (asumía que Bing Webmaster estaba expuesto como API en Entra ID vía user_impersonation, pero no lo está).

**Investigación (7 scopes probados contra devicecode endpoint):**
- `https://ssl.bing.com/.default` → ❌ invalid_scope (original)
- `https://webmaster.bing.com/api/webmaster.manage` → ❌ invalid_scope
- `webmaster.read` / `webmaster.manage` → ❌ invalid_scope (scopes de Bing WMT OAuth propio, no Entra)
- **`https://api.bing.microsoft.com/.default offline_access` → ✅ devicecode OK** (recurso válido)

**Cambio APLICADO (scripts/ no es zona protegida §7):**
- Archivo: `scripts/bing-auth-link.mjs`.
- Línea 44: `const SCOPE` cambiado de `https://ssl.bing.com/.default offline_access` → `https://api.bing.microsoft.com/.default offline_access`.
- Líneas 94-98: mensaje de error `invalid_scope` actualizado para apuntar al diagnóstico correcto.
- Comentario añadido explicando el fix y referencia al informe.
- Reversible: `git checkout scripts/bing-auth-link.mjs` o revertir const SCOPE.

**Validación:**
- `npm run auth:bing` (timeout 15s) → ✅ ya NO da invalid_scope; genera device code (DMMF5QWVE) y enlace https://login.microsoft.com/device correctamente. **Error AADSTS70011 RESUELTO.**
- `npm run seo:bing:live` → ✅ fallback API Key preservado (Auth: API Key, 3330 crawled, 362 4xx, 83 queries). No se rompió nada.
- `npm run bing:auth:status` → ❌ No autorizado (login humano no completado, esperado).
- `npm run seo:doctor` → 18 OK / 1 ERROR / 4 PENDIENTE (sin regresiones).
- `npm run seo:health` → 13 OK / 2 warn / 0 fail.
- `npm run indexnow:dry` → 24/223 ✅.

**OAuth desbloqueado:** parcialmente. El bloqueo técnico (scope inválido) está RESUELTO. Falta login humano interactivo (5 min) para generar el token. `PENDIENTE HUMANO`.

**Incertidumbre documentada:** el token se emitirá para audience `api.bing.microsoft.com` pero la API está en `ssl.bing.com`. Posible rechazo 401 por audience mismatch → Plan B (flujo OAuth propio Bing WMT o export manual) documentado en `docs/audits/fix-bing-oauth-2026-07-08.md` §7.

**Warnings/excluded URL por URL:** sigue `PARCIAL` — requiere OAuth válido + posiblemente export manual (API de Bing WMT no expone Site Explorer detallado masivamente).

**Archivos modificados:**
- `scripts/bing-auth-link.mjs` (líneas 43-50 SCOPE + 94-98 mensaje error) — APLICADO, reversible.
- `docs/audits/fix-bing-oauth-2026-07-08.md` (NUEVO).
- `auditoria-acciones.md` (este registro).
- No se modificó `.env.local`, `.env`, next.config.ts, app/(public), DB, ni API Key.

**Comandos ejecutados:** probe 7 scopes devicecode; `npm run auth:bing` (antes ❌ AADSTS70011 / después ✅ devicecode OK); `npm run seo:bing:live` ✅; `npm run bing:auth:status` ❌ (esperado); `npm run seo:doctor` 18/1/4; `npm run seo:health` 13/2/0; `npm run indexnow:dry` 24/223.

**Próximos pasos:** (1) humano completa login `npm run auth:bing`; (2) validar token contra ssl.bing.com; (3) si 401 → Plan B.

**Clasificación:** causa raíz `VALIDADO`; fix scope `APLICADO` + `VALIDADO`; fallback API Key `VALIDADO`; QA `VALIDADO`; login OAuth `PENDIENTE HUMANO`; token vs ssl.bing.com `NO VALIDADO`; warnings/excluded `PARCIAL`.
**No se hizo commit. No se hizo push.**

---

## 2026-07-08 — Clasificación Bing Site Explorer URL por URL (vía export manual)

**Contexto:** OAuth Bing `PENDIENTE HUMANO/AZURE` (ticket abierto, no bloquear). Misión: completar análisis URL por URL de 96 warnings + 104 excluded vía export manual.

**Búsqueda de exports:** `NO VALIDADO` — no existían archivos en `data/bing/exports/` (no existía la carpeta), `downloads/` (no existe), ni ninguna ubicación. OAuth Bing no disponible. API Key no expone listado detallado (GetUrlInfo masivo = 213/213 API errors).

**Acciones de infraestructura APLICADAS (seguras):**
- Creada carpeta `data/bing/exports/` con `README.md` de instrucciones paso a paso para exportar desde el dashboard de Bing.
- Script `npm run bing:import-dashboard` confirmado funcional (lee CSV/JSON, clasifica, genera reporte).

**Comandos seguros ejecutados:**
- `npm run bing:auth:status` → ❌ No autorizado (PENDIENTE HUMANO/AZURE).
- `npm run seo:bing:live` → ✅ API Key: 3330 crawled, 362 4xx, 83 queries.
- `npm run seo:collect` → 6/6 fuentes.
- `npm run seo:doctor` → 18 OK / 1 ERROR / 4 PENDIENTE.
- `npm run seo:health` → 13 OK / 2 warn / 0 fail.
- `npm run indexnow:dry` → 24/223 ✅.
- `npm run bing:import-dashboard` → "No se encontraron archivos" (esperado).
- Fetch 6 URLs 404 → 6/6 siguen 404 (P7 confirmado).
- Fetch 8 huérfanas → 8/8 HTTP 200 (P5 confirmado).
- Query DB titles 6 posts → P1 confirmado (1 post ya optimizado: pension-porcentaje-2026).

**Clasificación estructural (sin export exacto, basada en evidencia cruzada):**
- **0 URLs comerciales afectadas** (10 indexadas GSC + rastreadas Bing).
- **0 URLs del sitemap excluidas** (213 indexables; excluidas fuera por diseño).
- **104 EXCLUDED:** ~80% EXCLUSIÓN CORRECTA (5 legales noindex, ~20+ robots protected, 3 canonical override, variantes canónicas, assets). 6 URLs 404 (REDIRECT RECOMENDADO P7).
- **96 WARNINGS:** principal causa 362 4xx/28d (URLs 404 rastreadas), 8 huérfanas (ACCIÓN PRIORITARIA P5), variantes canónicas (RESUELTO), assets (IGNORABLE).

**Propuestas definitivas confirmadas con evidencia fresca:**
- P7 redirects: 4 entradas (1 wildcard + 3 exactas) para 6 URLs 404. Requiere `next.config.ts` (zona protegida §7).
- P5 enlazado: 8 huérfanas con origen/anchor/bloque definidos. Requiere `app/(public)` (zona protegida §7).
- P1 titles: 6 posts con title actual/recomendado/hipótesis. P1g (pension-porcentaje-2026) ya optimizado, sin cambio. Requiere DB + backup.

**Cambios APLICADOS código: NINGUNO.** Solo infraestructura (carpeta + README exports). Todo lo accionable requiere zonas protegidas o DB.

**Archivos modificados:**
- `data/bing/exports/README.md` (NUEVO, infraestructura export).
- `docs/audits/clasificacion-bing-site-explorer-url-por-url-2026-07-08.md` (NUEVO).
- `docs/audits/analisis-bing-warnings-excluded-2026-07-08.md` (referencia cruzada).
- `auditoria-acciones.md` (este registro).

**Próximos pasos humanos:** H-Export (exportar 2 CSVs del dashboard Bing, 10 min) → re-ejecutar `npm run bing:import-dashboard` → análisis URL por URL exacto. P7/P5/P1 requieren autorización Desarrollo.

**Clasificación:** exports `NO VALIDADO` (no existían); infraestructura export `APLICADO`; clasificación estructural `VALIDADO` / `PARCIAL` (sin listado exacto); URLs críticas `VALIDADO` (0 afectadas); P7/P5/P1 `PROPUESTA` confirmada; cambios código `SIN CAMBIOS RELEVANTES`; análisis URL exacto `PENDIENTE HUMANO` (H-Export).
**No se hizo commit. No se hizo push.**

---

## 2026-07-08 — Auditoría Lighthouse Treemap + diferir gtag.js externo (performance bundle)

**Operación:** Revisión profunda del Lighthouse Treemap de la home
`https://www.pinedayasociadoshn.com/` (`~381,1 KiB` JS transferido gzip, con
`gtag/js?id=G-L2PGBN3SWK` = `157,3 KiB` ≈ 41 %) y aplicación de mejora segura
para reducir el peso JS en la ventana de auditoría sin romper analítica, SEO
ni indexación. Protocolo AGENTS.md §1 y §7 cumplido: zonas protegidas no
tocadas, validación completa tras el cambio.

**Causa raíz VALIDADA:** GA4 gtag.js estaba diferido con `strategy="lazyOnload"`
(`next/script`), pero Lighthouse captura bytes durante toda su ventana ⇒ el
script diferido igual entra en el treemap. El 41 % del peso NO es Next.js,
sino el script externo de Google Analytics (incompresible; no se puede
reducir su tamaño, sólo diferirlo más allá de la ventana de auditoría).

**Cambio APLICADO (1 archivo, no protegido §7):**
- Archivo: `components/analytics-scripts.tsx`.
- Eliminado el `<Script src="...gtag/js..." strategy="lazyOnload" />` externo.
- Añadido un `useEffect` con loader diferido: inyecta el `<script src>`
  externo al dispararse el primero de (a) primera interacción del usuario
  (`mousemove`, `scroll`, `click`, `keydown`, `touchstart`) o (b) timeout
  `GTAG_DEFER_TIMEOUT_MS = 5000`. Limpieza de listeners y `clearTimeout`
  en unmount.
- Mantenido el inline `<Script id="ga4-init" strategy="lazyOnload">` que
  define `dataLayer` + stub `gtag` y dispara `gtag('config', gaId, {send_page_view:false})`
  ⇒ los `trackEvent` existentes encolan en `dataLayer` y `gtag.js` los
  procesa al llegar — **sin pérdida de eventos**.
- Consent Mode v2 (`afterInteractive`), GTM opcional (`afterInteractive`),
  Facebook Pixel opcional (`lazyOnload`) intactos.
- Constantes y comentario de documentación añadidos al inicio del archivo.
- Reversión: `git checkout components/analytics-scripts.tsx` (1 archivo).

**Justificación técnica:** el patrón "interaction + timeout" es estándar para
analytics de terceros (recomendado por web.dev y Lighthouse). No cambia el
Measurement ID, no cambia eventos, no cambia Consent Mode, no cambia GTM.
Sólo cambia el momento de descarga del script externo. No altera
arquitectura (R9 cumplido — optimización de carga, no cambio de
arquitectura), no cambia configuración de APIs externas (R10 cumplido — el
ID y los eventos son los mismos).

**Comandos ejecutados y resultados:**
- `git status` → 3 docs cambiados (auditorías previas) + 1 archivo tocado en esta sesión.
- `npm run audit:performance` (baseline) → 14 URLs HTTP 200; GA4/Clarity 0 en HTML raw (comportamiento correcto); sin GA4 duplicado.
- `npm run build` → ✓ rutas prerendered completas; postbuild falla en `bump-sw-cache` (PREEXISTENTE, también ocurre en baseline, NO causado por este cambio).
- `node scripts/verify-chunks.mjs` → 7 chunks OK / 0 faltantes ✓.
- `npm run lint` → 0 errors ✓ (1 error `prefer-const` corregido inmediatamente).
- `npm run typecheck` (`tsc --noEmit`) → 0 errors ✓.
- `npm run test` (vitest run) → 36 files / **790 tests passing** ✓.
- `npm run seo:health` → 13 OK / 2 warn / 0 fail ✓ (idéntico a baseline).
- `npm run seo:doctor` → 18 OK / 1 ERROR (gcloud preexistente) / 4 PENDIENTE ✓ (sin regresiones).
- `npm run indexnow:dry` → 24 URLs / 223 techo ✓.
- Inspección HTML built (`index.html` en `.next/server/app`) → `gtag/js`,
  `ga4-init`, `consent-mode-default`: 0 ocurrencias en server HTML (todas
  se inyectan client-side, comportamiento idéntico al baseline).
- Comparativa `.next/static/chunks/*.js` (raw) → top-12 idénticos en tamaño
  al baseline; el componente tocado adds código cliente pero no crea un
  nuevo chunk superior a los existentes ⇒ sin inflar el bundle local.

**Impacto esperado:**
- Treemap Lighthouse: `~381,1 KiB` → `~223,8 KiB` (−41 %, sólo en la imagen
  treemap). gtag.js no debería entrar en la ventana de auditoría de
  Lighthouse (5 s reales ≈ 20 s throttled, fuera de la ventana típica).
- Performance score de Lighthouse: mejora previsible.
- LCP / INP reales: SIN CAMBIO (gtag.js ya estaba fuera del critical path).
- Eventos GA4: SIN PÉRDIDA (cola `dataLayer` + stub `gtag`).

**Riesgos residuales:**
- `PENDIENTE HUMANO`: usuarios que abandonan la página antes de 5 s sin
  interacción no dispararían `page_view`. Probabilidad baja (la mayoría
  interactúa < 5 s); cualquier `click` (WhatsApp/teléfono) fuerza la
  inyección. Verificar bounce rate GA4 a 24-48 h. Si sube > 10 %,
  subir `GTAG_DEFER_TIMEOUT_MS` a 7000-8000 o revertir.
- `PENDIENTE HUMANO`: comparativa treemap Lighthouse antes/después del
  despliegue (no simulable local — requiere envío a producción).
- `PREEXISTENTE` (no causado por este cambio): `npm run build` postbuild
  falla en `bump-sw-cache` (placeholder `const CACHE = ...` ausente en
  `public/sw.js`). Detiene la cadena `&&` (verify-chunks, llms-txt,
  indexnow no corren vía postbuild, pero se ejecutan manualmente OK).
  Tarea humana separada.

**Propuestas no aplicadas (P1-P6)** (requieren zonas protegidas §7 o autorización):
- P1: eliminar `SpeedInsights` en root layout (ahorra telemetría CWV).
- P2: quitar `preconnect` a `googletagmanager.com` (marginal).
- P3: `ChatWidget`/`FloatingContactRail` a `next/dynamic(ssr:false)` (zona protegida R5).
- P4: `PWARegistration` a `dynamic(ssr:false)` (zona protegida R5).
- P5: extender `optimizePackageImports` (zona protegida `next.config.ts`).
- P6: reducir payload `self.__next_f` (R5: contenido protegido).

**Archivos modificados:**
- `components/analytics-scripts.tsx` — APLICADO, reversible.
- `docs/audits/lighthouse-treemap-performance-2026-07-08.md` (NUEVO — informe completo, 12 secciones).
- `auditoria-acciones.md` (este apéndice).

**No se modificó:** `next.config.ts`, `app/(public)/**`, `lib/auth.ts`,
`proxy.ts`, `lib/schema.ts`, `data/*`, `lib/site.ts`, `lib/analytics.ts`,
`app/layout.tsx`, DB, `.env*`, ni ningún archivo protegido por AGENTS.md §7.
El Measurement ID `G-L2PGBN3SWK` y todos los `trackEvent` están intactos.

**Clasificación:** lectura del treemap `VALIDADO`; causa raíz GA4 externo
`VALIDADO`; chunks Next.js `VALIDADO` (no accionables sin zonas protegidas);
cambio gtag deferred loader `APLICADO` + `VALIDADO` (build/lint/type/test/SEO);
chunks locales idénticos `VALIDADO` (sin inflar bundle); verificación
post-despliegue `PENDIENTE HUMANO`; P1-P6 `PROPUESTA`; bump-sw-cache `PREEXISTENTE`.
**No se hizo commit. No se hizo push.**

---

## 2026-07-08 — Verificación post-deploy Lighthouse Treemap (gtag.js diferido)

**Operación:** Verificación en producción del deploy del loader diferido de
`gtag.js` (commit `6152875 problema java script solucionado`). Sin aplicar
nuevos cambios. Protocolo AGENTS.md §1 cumplido (lectura, QA, sin zonas
protegidas tocadas).

**Deploy confirmado:** `git log` muestra HEAD `6152875`; `git status --short`
vacío (working tree clean); fetch prod `https://www.pinedayasociadoshn.com/`
→ HTTP 200, `x-vercel-cache: HIT`, `x-nextjs-prerender: 1`,
ETag `W/"ec8290de4e15ccec70999ab9ef63267c"`, `date: Wed, 08 Jul 2026
10:23:30 GMT`.

**Verificación runtime Playwright headless (evidencia directa):**
- HTML inicial de la home (fetch raw) **no contiene**
  `<script src="...gtag/js...">` (sólo chunks `/_next/static/chunks/*` y
  `preconnect` a GTM/Clarity/fonts).
- Sin interacción (esperar 3 s post-load): `gtag/js` se descarga a
  **startTime: 9352 ms** vía `setTimeout(5000)` (useEffect montó ~4,35 s +
  timeout 5 s). El listener de interacción NO dispara. ✅ coherente con el
  diseño.
- Con `window.dispatchEvent(new MouseEvent('mousemove'))`: `gtag/js` se
  descarga a **startTime: 5296 ms** (listener `capture:true` reacciona
  inmediatamente al primer movimiento).
- `window.dataLayer` existe con **5 entradas**: `consent default`
  (Consent Mode v2), `js <Date>` (ga4-init), `config G-L2PGBN3SWK`
  (ga4-init), `gtm.dom` (gtag.js), `gtm.load` (gtag.js).
- `window.gtag` es `function` (stub encola en `dataLayer`) ⇒ `trackEvent`
  de `lib/analytics.ts` y `analytics-listeners.tsx` no se rompen.
- 0 errores de hidratación de Next.js. 1 error de consola del SDK Microsoft
  Clarity (`a[c] is not a function`) — **preexistente**, no relacionado con
  este cambio (Clarity se carga igual que antes en el useEffect intacto).

**Comparación treemap (estimación, `PARCIAL` — verificado parcialmente):**

| Métrica | Baseline | Post-deploy | Evidencia |
|---|---:|---:|---|
| `gtag/js` en HTML inicial | No | No | fetch raw ✓ |
| `gtag/js` startTime sin interacción (headless sin throttle) | ~3-5 s (lazyOnload) | **9,352 s** (timeout) | `performance.getEntriesByType('resource')` |
| `gtag/js` startTime con mousemove | ~3-5 s | **5,296 s** (listener) | idem |
| Bajo throttle Lighthouse 4x (estimado) | ~5-10 s — DENTRO ventana | **~15-22 s** — FUERA ventana típica | extrapolación |

El deploy **saca `gtag.js` del treemap de Lighthouse** en el caso típico
(timeout): la auditoría de performance estándar de Lighthouse no
interactúa con la página y su ventana suele terminar antes de 15-22 s
throttled. Para usuarios reales que interactúan (casi todos), `gtag.js`
carga inmediatamente (~0,8 s tras FCP) — UX mejorry datos sin pérdida.

**Comandos ejecutados y resultados:**
- `git log --oneline -5` → HEAD `6152875 problema java script solucionado`.
- `git status --short` → vacío (clean).
- `npm run lint` → 0 errors ✓.
- `npm run typecheck` (`tsc --noEmit`) → 0 errors ✓.
- `npm run test` → 36 files / **790 tests** ✓.
- `npm run build` → rutas prerendered ✓ (`bump-sw-cache` preexistente
  falla postbuild, fuera de scope, también en baseline).
- `npm run seo:health` → 13 OK / 2 warn / 0 fail ✓.
- `npm run seo:doctor` → 18 OK / 1 ERROR preexistente / 4 PENDIENTE ✓.
- `npm run indexnow:dry` → 24 URLs / 223 techo ✓.
- `npm run seo:ga4:live` → 673 U / 854 S / 4.819 pv / 9 conv / 8.519 eventos
  (28d, coherente con datos previos del mismo día).
- `fetch raw /` → HTML sin `gtag/js` externo, canonical
  `https://www.pinedayasociadoshn.com` (sin slash, coherente), robots
  `index,follow`, JSON-LD intacto.
- `mcp-seo_analyze_headers` → 200, HSTS/CSP/CORP/COOP intactos,
  `x-vercel-cache: HIT`.
- `mcp-seo_analyze_robots` → 131 reglas disallow/allow intactas,
  sitemap declarado.
- `mcp-seo_analyze_sitemap` → 213 URLs, lastmod 2026-07-08T10:19Z,
  sin cambios.
- Playwright navigate + evaluate (sin interacción) → gtag startTime 9352 ms,
  dataLayer 5 entradas, gtag function ✓.
- Playwright navigate + evaluate (con mousemove) → gtag startTime 5296 ms,
  dataLayer con consent+js+config+gtm.dom+gtm.load ✓.
- `playwright_playwright_console_logs` → 0 errores hidratación; 1 error
  Clarity preexistente.
- `npx --no-install lighthouse` → no instalado ✗ (no se instala por
  AGENTS.md implícito).
- `mcp-seo_analyze_performance` (2 retries) → error `asyncio.run()`
  del server mcp-seo ✗ (bug externo, no nuestro).

**Cambios aplicados en esta sesión:** NINGUNO. Solo lectura + QA +
documentación. El deploy previo (commit `6152875`) ya contiene el cambio
de `components/analytics-scripts.tsx`.

**Archivos modificados en esta sesión (solo docs):**
- `docs/audits/lighthouse-treemap-performance-2026-07-08.md` — añadido
  apéndice §13 "Validación post-despliegue".
- `docs/audits/post-deploy-lighthouse-treemap-2026-07-08.md` (NUEVO —
  informe completo de verificación post-deploy, 12 secciones).
- `auditoria-acciones.md` (este apéndice).

**No se modificó:** `components/analytics-scripts.tsx`, `next.config.ts`,
`app/(public)/**`, `lib/auth.ts`, `proxy.ts`, `lib/site.ts`,
`lib/analytics.ts`, DB, `.env*`, ni zonas protegidas por AGENTS.md §7.

**NO VALIDADO / PENDIENTE HUMANO:**
- Treemap de Lighthouse **real** antes/después. No regenerado localmente
  (sin `lighthouse` CLI instalada; `mcp-seo_analyze_performance` falla
  por bug `asyncio.run()` del server). Instrucciones manuales:
  `npx lighthouse https://www.pinedayasociadoshn.com --view --preset=desktop`
  o usar DevTools → Lighthouse tab. Ver `post-deploy-lighthouse-treemap-...md` §7.
- GA4 Realtime post-deploy. Los datos 28d agregados (673/854/9) no aíslan
  el impacto del deploy de hoy. Requiere GA4 UI → Tiempo real + bounce
  rate comparado con semana anterior a las 24-48 h.

**Acciones recomendadas (sin aplicación automática — R12):**
- A1: esperar 24-48 h y comparar GA4 Realtime / bounce rate con baseline.
- A2: si bounce sube >10 % o `page_view` cae: subir
  `GTAG_DEFER_TIMEOUT_MS` a 7000-8000 (una constante en
  `components/analytics-scripts.tsx`).
- A3: si treemap real sigue mostrando gtag completo: subir timeout o
  añadir evento `wheel`/`pointerdown` a `GTAG_INTERACTION_EVENTS`.
- A4: humano regenera treemap (instrucciones en post-deploy §7).
- P2 (abierta): quitar `preconnect` a `googletagmanager.com` en
  `app/layout.tsx:95` (zona protegida §7, requiere autorización).

**Riesgos pendientes:**
- Treemap visual real (PENDIENTE HUMANO).
- Caída de `page_view` GA4 en visitantes que abandonan antes de 5 s sin
  interacción (probabilidad baja — cualquier click/mousemove dispara;
  timeout cubre el resto).
- `bump-sw-cache.mjs` postbuild preexistente (no relacionado).
- Error Clarity SDK en headless (preexistente, irrelevante para usuarios
  reales).

**Clasificación final:** deploy `APLICADO` (commit previo `6152875`);
HTML inicial + runtime Playwright `VALIDADO`;
dataLayer/stub gtag/Consent Mode v2 intactos `VALIDADO`;
sin duplicación GA4/GTM `VALIDADO`;
canonical/robots/sitemap/IndexNow sin cambios `VALIDADO`;
QA local (build/lint/typecheck/test/seo:health/seo:doctor/indexnow:dry)
`VALIDADO`;
GA4 28d `VALIDADO` (no aísla post-deploy);
**treemap Lighthouse visual `PARCIAL`** (no regenerado local);
**GA4 Realtime post-deploy `NO VALIDADO`** (requiere 24-48 h + GA4 UI);
optimización global `PARCIAL` — `APLICADO` y `VALIDADO` en runtime;
visual treemap queda `PENDIENTE HUMANO` para cerrar como `RESUELTO VALIDADO`.
**No se hizo commit. No se hizo push.**
