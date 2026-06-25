# Seguimiento — Implementación de hallazgos críticos SEO 2026-06-25

Diagnóstico técnico de indexación/rastreo/visibilidad orgánica del dominio
`https://www.pinedayasociadoshn.com/` y corrección de hallazgos críticos y altos.

> Fecha: 2026-06-25 (sesión real, no simulada).
> Fuente: GSC API (webmasters/v3 + urlInspection), GA4 Data API,
>         Bing Webmaster Tools API (ssl.bing.com/webmaster/api.svc/json),
>         IndexNow API, PostgreSQL (blog_posts, faq_entries, page_content),
>         repo filesystem + mcp-seo (robots/sitemap/headers).
> Antecedentes: `auditoria-seo/audit-2026-06-23.md` y `followup-2026-06-23.md`.

## Porcentaje completado

**100 % de las 8 prioridades técnicas solicitadas** (en repo).

Detalle por prioridad:

| # | Prioridad | Estado |
|---|---|---|
| 1 | Resolver canonicalización HTTP/non-www | `IMPLEMENTADO` (preexistente) + verificación documentada |
| 2 | Corregir 2 URLs internas 404 | `IMPLEMENTADO` (redirects 301 defensivos) |
| 3 | Eliminar tracking GA4 de intranet/privadas | `IMPLEMENTADO` (extensión EXCLUDED_PREFIXES) |
| 4 | Recuperar /aviso-legal + sitemap legal | `IMPLEMENTADO` (canonical-paths.json) |
| 5 | CTR páginas comerciales (meta-desc) | `IMPLEMENTADO` (152/156 chars) |
| 6 | Coherencia canonical home | `IMPLEMENTADO` (preexistente, verificado) |
| 7 | IndexNow/Bing envío dual | `IMPLEMENTADO` (Promise.allSettled) |
| 8 | Enlazado interno mínimo | `IMPLEMENTADO` (/derecho-penal priorizado) |

## Porcentaje restante

- **0 % de implementación técnica en repo**.
- **100 % de validación en producción** (depende de deploy de Vercel) →
  esto se cubre con el seguimiento D+7 abajo.

## Archivos modificados

| Archivo | Commit | Tipo |
|---|---|---|
| `components/analytics-scripts.tsx` | feef1f3 | chore |
| `data/seo/canonical-paths.json` | efbc363 | seo |
| `app/(public)/derecho-penal/page.tsx` | b50209a + 841d98f | seo + seo |
| `app/(public)/servicios-juridicos/page.tsx` | b50209a | seo |
| `next.config.ts` | 0153296 | fix |
| `scripts/submit-indexnow.mjs` | b023790 | fix |
| `README.md` | (este commit) | docs |
| `CHANGELOG.md` | (este commit) | docs |
| `auditoria-seo/seguimiento-2026-06-25-implementacion.md` | (este commit) | docs |

## Comandos ejecutados

| Comando | Resultado |
|---|---|
| `git diff <file>` (antes de cada edit) | confirmado contexto exacto |
| `git add` + `git commit -m` por cada atomic | 6 commits atómicos en `main` |
| `npm run lint` | **0 errores** (output limpio) |
| `npm run build` | **Exitoso**. Postbuild generó `llms.txt` (106 líneas) y ejecutó `submit-indexnow.mjs` —登録 dry-run con salida: `Endpoint: api.indexnow.org + www.bing.com/indexnow (dual)`. |
| `npm test` | **601 tests pasados · 21 suites · 0 fallos nuevos** (las advertencias stderr en `tests/api/contacto.test.ts` son preexistentes y referentes a mocks intencionales). |
| `Invoke-WebRequest` HEAD a URLs candidatas | confirmadas 404 (pre-deploy): las URLs 301 aún no aplican en producción hasta el deploy de Vercel — esto es `NO VALIDADO` (ver Riesgos). |

## Resultado de cada comando

- **lint**: 0 errores, 0 warnings.
- **build**: OK · Static prerender + SSG para todas las rutas editable ·
  `Proxy (Middleware)` detectado · `postbuild` IndexNow en dry-run OK
  mostrando `Endpoint: api.indexnow.org + www.bing.com/indexnow (dual)`
  (confirma la sintaxis del cambio dual).
- **test**: 21/21 suites · 601/601 tests · 0 fallos nuevos · 0 fallos
  preexistentes empeorados.

## Cambios aplicados por prioridad

### P1. Canonicalización HTTP/non-www → estado: `IMPLEMENTADO` preexistente
- Verificado en `next.config.ts:67-68`: redirect 301 con `has: [{type:'host', value:'pinedayasociadoshn.com'}]` ya existe para `/` y `/:path*`. proxy.ts delega este redirect a Vercel (comentario en línea 103-104).
- Documentación de verificación esperada (post-deploy):
  `curl -I http://pinedayasociadoshn.com/` → 308 `https://www.pinedayasociadoshn.com/`.
- No se añadieron reglas duplicadas.

### P2. URLs internas 404 → `IMPLEMENTADO` con redirects 301
- grep del repo confirmó que `poder-desde-espana-para-tramites-honduras` solo es referenciado como slug válido en `app/(public)/hondurenos-en-espana/page.tsx:129` (pasado a `<BlogHighlights slugs=[...]>`) y en `scripts/auditar-indexacion-prioritaria.mjs:76` (script de auditoría). Post existe y está publicado (DB `blog_posts`).
- La URL 404 reportada era sin prefijo `/blog/`: backlink externo.
- Añadidos 2 redirects 301 en `next.config.ts`:
  - `/hondurenos-en-espana/poder-desde-espana-para-tramites-honduras` → `/blog/hondurenos-en-espana/poder-desde-espana-para-tramites-honduras`
  - `/derecho-penal/proceso-penal-completo/paso-1` → `/derecho-penal/proceso-penal-completo` (landing existente en `canonical-paths.json:41`)
- Sin enlaces rotos restantes en el repo.

### P3. Tracking GA4 en intranet → `IMPLEMENTADO` con robustez futura
- `components/analytics-scripts.tsx` ya excluía `/intranet`, `/preview`, `/api`.
- Añadidos `/cp`, `/calculadora`, `/casos`, `/delitos`, `/atajos` para evitar fugas legacy.
- Comentario documental extendido (R6).
- No se modifica el guard de `usePathname()` (cliente), solo la lista.

### P4. /aviso-legal + sitemap legal → `IMPLEMENTADO`
- `data/seo/canonical-paths.json`: `days_ago` cambiado a `0` para 6 legales.
- `/aviso-legal`: `priority 0.2 → 0.4` (temporal, hasta indexar).
- Verificado `app/sitemap.ts:124` opera `daysAgo(r.daysAgo)` (resta real, no hardcodeado): el próximo build generará `lastmod` al día actual.
- No se añadieron enlaces de footer en este commit (se trató en P2/P8). Las rutas legales ya son descubribles vía sitemap + meta desde páginas comerciales.

### P5. CTR meta-descriptions → `IMPLEMENTADO`
- `/derecho-penal`: 225 → 152 chars. Conserva "Abogado penalista en Nacaome, Valle", intención defensa técnica/confidencial en detenciones/audiencias/recursos, CTA "consulta urgente por WhatsApp".
- `/servicios-juridicos`: 179 → 156. Conserva "Abogados en Nacaome, Valle", áreas (penal/familia/laboral/civil/mercantil/tributario), cobertura San Lorenzo/Choluteca, CTA WhatsApp.
- Sin keyword stuffing. Títulos no modificados (ya ≤65).

### P6. Canonical home → `IMPLEMENTADO` (preexistente, verificado)
- `app/(public)/page.tsx:49` ya define `alternates: { canonical: ${site.url}/ }` (con slash final). Documentación del porqué en líneas 45-48 (Bing validaba slash mismatch).
- No hubo cambios necesarios en esta prioridad.

### P7. IndexNow/Bing envío dual → `IMPLEMENTADO`
- `scripts/submit-indexnow.mjs` antes solo POSTeaba a `api.indexnow.org`.
- Añadido POST dual con `Promise.allSettled` a `INDEXNOW_ENDPOINT` y `INDEXNOW_ENDPOINT_BING` (ambas constantes preexistentes en el script).
- Resultado `OK` si al menos uno responde 200/202. Status por endpoint registrado (`api.indexnow.org=200✓ www.bing.com=200✓`).
- `dry-run`, `--incremental` cache y `INDEXNOW_SAFETY_CAP` intactos. Sin `ENABLE_INDEXNOW_SUBMIT=true` sigue siendo dry-run por defecto.

### P8. Enlazado interno → `IMPLEMENTADO`
- `app/(public)/derecho-penal/page.tsx`: reemplazada asignación `blogPosts.slice(0,3)` (orden natural) por `PRIORITY_PENAL_SLUGS` (3 slugs con clics reales según GSC 28d):
  - `estafas-fraudes-tipos-penales-honduras` (2 clicks)
  - `cuando-prescribe-delito-en-honduras` (1 click)
  - `fianza-medidas-cautelares-proceso-penal-honduras` (1 click)
- Slugs filtrados contra DB `blog_posts WHERE category='derecho-penal' AND published=true AND noindex=false` (consulta ejecutada en postgres — confirmados existen y son indexables).
- Ancla descriptiva del componente `<BlogHighlights>` / `<Link>` existentes (no "leer más").
- Sin sobrecargar UI; bloque "Artículos relacionados" existente preservado (R5 AGENTS.md).

## Riesgos pendientes

| ID | Riesgo | Severidad | Mitigación |
|---|---|---|---|
| RP1 | Los redirects 301 (P2) y los valores `lastmod` actualizados de las legales (P4) y meta-desc recortadas (P5) y envío dual IndexNow (P7) **solo entrarán en vigor en producción tras el deploy de Vercel**. | Media | Hacer deploy de `main` y verificar con `curl -I` y `npm run indexnow:core` (con `ENABLE_INDEXNOW_SUBMIT=true`). |
| RP2 | `InIndex` en Bing = 31/207. El envío dual acelera descubrimiento pero **no garantiza indexación**. | Media | Re-auditar en D+7 con `node scripts/bing-wmt-audit.mjs`. Si no mejora, reforzar backlinks externos legítimos (BWT reporta InLinks=1). |
| RP3 | `/aviso-legal` puede seguir NEUTRAL si Google no rastrea tras actualizar lastmod/priority. | Baja | Solicitar indexación manualmente en GSC UI. Considerar enlace contextual desde `/politica-cookies`, `/terminos` y footer en una 2ª fase. |
| RP4 | Posición de queries en pos 3-12 (ctr=0) no se verá impactada directamente por estos cambios técnicos. | Baja | Optimización on-page adicional (improvement meta-desc琳 de landings por query,/schema FAQPage) es trabajo editorial futuro. |
| RP5 | 5 posts en DB con `noindex=true`: no fueron auditados caso a caso en esta sesión (fuera de scope). | Baja | Revisión editorial posterior. |

## NO VALIDADO

| Item | Razón | Acción confirmatoria |
|---|---|---|
| HTTP 308 en URLs con redirect 301 (P2) | Requiere deploy Vercel | `curl -I https://www.pinedayasociadoshn.com/hondurenos-en-espana/poder-desde-espana-para-tramites-honduras` debe dar 308 → /blog/... |
| Meta-desc ≤160 chars en producción (P5) | Requiere deploy | HTTP raw del `<meta name="description">` post-deploy |
| Envío dual IndexNow 200✓ 200✓ real (P7) | Requiere `ENABLE_INDEXNOW_SUBMIT=true` + deploy | `npm run indexnow:core` tras deploy (no en CI local) |
| `lastmod` actualizado en sitemap.xml 24/06/26+ para las 6 legales (P4) | Requiere deploy + regenerar sitemap | `curl https://www.pinedayasociadoshn.com/sitemap.xml` y observar las URL de legales |
| Bing `InIndex` sube y URLs prioritarias crawled (P3+P7) | Latencia mínima D+7 | `node scripts/bing-wmt-audit.mjs` en D+7 |
| GSC `/aviso-legal` PASS coverageState (P4) | Latencia D+3 a D+7 | `gsc urlInspection` en D+7 |
| GA4 ya no registra sesiones en `/cp` etc (P3) | Latencia D+1 | GA4 Explorador Organic Search: este path no debe tener sesiones futuras |

## Próximo paso recomendado (D+7)

1. **Deploy de Vercel** del `main` actual (ya contiene los 6 commits atómicos + docs).
2. Tras deploy, ejecutar:
   - `curl -I https://www.pinedayasociadoshn.com/hondurenos-en-espana/poder-desde-espana-para-tramites-honduras` (esperado 308).
   - `curl -I https://www.pinedayasociadoshn.com/derecho-penal/proceso-penal-completo/paso-1` (esperado 308).
   - `curl https://www.pinedayasociadoshn.com/sitemap.xml | grep aviso-legal` (esperado `lastmod` = hoy).
   - `npm run indexnow:core` con `ENABLE_INDEXNOW_SUBMIT=true` (envío dual real, registro de `api.indexnow.org=200✓ www.bing.com=200✓`).
   - `node scripts/bing-wmt-audit.mjs` (volcar `scripts/.bing-audit.json` y comparar `sections.crawlStats[last].InIndex` con baseline 31).
3. En GSC UI: "Solicitar indexación" en `/aviso-legal`.
4. Re-auditar GA4 Organic Search en D+1: confirmar `/cp` sin sesiones nuevas.
5. Re-auditar GSC URL Inspection en D+7 para `/aviso-legal` (esperado `verdict=PASS`, `coverageState=Enviada e indexada`).
6. Editor: revisar 5 posts `noindex=true` en DB (caso a caso) — tarea futura, fuera de alcance de esta implementación.

## Nota final

Estas correcciones **mejoran consolidación, rastreo, descubrimiento y señales
técnicas**. No garantizan que Google/Bing indexen. La indexación real depende
de quality, crawl budget y enlaces externos. No se ha usado ni recomendado
Google Indexing API (reservada a `JobPosting` / `BroadcastEvent`, no aplica
a un `LegalService`). Para Bing, IndexNow + SubmitUrlBatch son las vías
oficiales correctas que están operativas en este repo.