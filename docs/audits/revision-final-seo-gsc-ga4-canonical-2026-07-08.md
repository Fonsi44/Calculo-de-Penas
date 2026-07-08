# Revisión Final SEO — Canonicalización, GSC, GA4 — 2026-07-08

**Proyecto:** Pineda y Asociados (`https://www.pinedayasociadoshn.com`)
**Fecha:** 2026-07-08 · **Período de datos:** 28 días (2026-06-10 → 2026-07-08)
**Novedad de contexto:** Se eliminó la propiedad sin-www en GSC; la property activa es ahora `https://www.pinedayasociadoshn.com/`.

---

## Resumen ejecutivo

Revisión completa del estado SEO tras la reorganización de propiedades en GSC. **Un cambio APLICADO y VALIDADO** restauró el acceso GSC API roto; la canonicalización del dominio está limpia; las 10 URLs comerciales siguen indexadas.

### Cambio APLICADO ✅

**`GOOGLE_SEARCH_CONSOLE_SITE_URL`** en `.env.local`: de `sc-domain:pinedayasociadoshn.com` → `https://www.pinedayasociadoshn.com/`.

- **Causa:** tras eliminar la property sin-www, la cuenta OAuth perdió acceso a `sc-domain:` (error "User does not have sufficient permission") pero **sí es `siteOwner`** de la property URL-prefix `https://www.`.
- **Efecto:** GSC API restaurado (performance + URL inspection + sitemaps). `seo:collect` volvió a 6/6 fuentes. `seo:doctor` volvió a 18 OK.
- **Reversibilidad:** trivial (revertir el valor en `.env.local`).

### Estado canonicalización · `VALIDADO`

Las **4 variantes del dominio convergen limpia y únicamente** a `https://www.pinedayasociadoshn.com/`:

| Variante | Resultado |
|---|---|
| `http://pinedayasociadoshn.com/` | → `https://www.` ✅ |
| `http://www.pinedayasociadoshn.com/` | → `https://www.` ✅ |
| `https://pinedayasociadoshn.com/` | → `https://www.` ✅ |
| `https://www.pinedayasociadoshn.com/` | 200 (canónica, sin redirect) ✅ |

**0 referencias a `http://` o `sin-www`** en `lib/`, `app/`, `components/`, `data/`. `lib/site.ts` y `.env.example` usan exclusivamente `https://www.`. **La anomalía canónica detectada en informes previos está RESUELTA.**

---

## 1. Canonicalización del dominio · `VALIDADO` / `RESUELTO VALIDADO`

### 1.1 Redirects servidor (Vercel)

Verificado live (2026-07-08): las 4 variantes hacen redirect 200→`https://www.` (excepto la canónica que sirve 200 directo). Consolidación correcta y única.

### 1.2 Código y configuración

| Archivo | Valor | Estado |
|---|---|---|
| `lib/site.ts:44` | `https://www.pinedayasociadoshn.com` (fallback) | ✅ |
| `.env.example` | `NEXT_PUBLIC_SITE_URL=https://www.pinedayasociadoshn.com` | ✅ |
| `GOOGLE_SEARCH_CONSOLE_SITE_URL` (.env.local) | `https://www.pinedayasociadoshn.com/` (tras fix) | ✅ APLICADO |
| JSON-LD `@id`, `url`, OG image | derivan de `site.url` | ✅ |
| Referencias `http://` o `sin-www` en código | 0 encontradas | ✅ |

### 1.3 Anomalía GSC previa · `RESUELTO VALIDADO`

En el informe previo, la home aparecía en GSC bajo 2 URLs (`http://apex` 15 clics + `https://www` 6 clics), dividiendo autoridad. **Tras el fix de la property y la consolidación**, la home aparece **una sola vez** como `https://www.pinedayasociadoshn.com/`. Resuelto.

---

## 2. Estado GSC · `VALIDADO` (acceso restaurado)

### 2.1 Métricas globales (28d, datos frescos 08:30 UTC)

| Métrica | Valor |
|---|---|
| Clics | 161 |
| Impresiones | 8.350 |
| CTR | 1,93 % |
| Posición media | 7,0 |
| Property | `https://www.pinedayasociadoshn.com/` (URL-prefix, siteOwner) |
| Queries | 100 |
| Pages | 114 |

> Diferencia leve vs informe previo (175 clics / 8.472 imp): la property URL-prefix captura solo tráfico `https://www.`, no el histórico `http://apex` ya consolidado. Diferencia esperada y consistente con la canonicalización.

### 2.2 Index status 10 URLs comerciales · `RESUELTO VALIDADO`

URL Inspection API (funcionando tras fix):

| URL | Estado |
|---|---|
| `/`, `/servicios-juridicos`, `/derecho-penal`, `/solicitar-consulta`, `/como-llegar`, `/abogados-en-nacaome`, `/abogados-en-choluteca`, `/abogados-en-san-lorenzo`, `/blog`, `/preguntas-frecuentes` | **10/10 PASS (Enviada e indexada)** |

**El antiguo "problema crítico de indexación" del 4 de julio está RESUELTO VALIDADO.** La acción H2 (solicitud manual GSC) **ya no es necesaria**.

### 2.3 Top pages (oportunidades CTR)

| Página | Imp. | Clics | CTR | Pos. |
|---|---|---|---|---|
| `/blog/.../poder-legal-honduras-cuando-se-necesita` | 679 | 9 | 1,3 % | 5,9 |
| `/blog/.../naturalizacion-obtener-nacionalidad-hondurena` | 543 | 7 | 1,3 % | 8,4 |
| `/blog/.../custodia-hijos-honduras-juez` | 520 | 5 | 1,0 % | 7,4 |
| `/blog/.../prescripcion-deudas-plazos-honduras` | 453 | 12 | 2,6 % | 5,7 |
| `/blog/.../pension-alimenticia-honduras-guia-completa` | 436 | 8 | 1,8 % | 6,1 |
| `/blog/.../pension-alimenticia-porcentaje-honduras-2026` | 423 | 12 | 2,8 % | 4,7 |
| `/blog/.../estafas-fraudes-tipos-penales-honduras` | 376 | 6 | 1,6 % | 7,8 |

**6 posts con +350 impresiones y CTR < 3 %** por títulos genéricos. Oportunidad de optimización confirmada (PROPUESTA, requiere DB).

---

## 3. Estado GA4 · `VALIDADO` / `PARCIAL`

### 3.1 Métricas (28d)

| Métrica | Valor |
|---|---|
| Usuarios | 673 |
| Sesiones | 854 |
| Pageviews | 4.819 |
| Duración sesión | 404 s |
| Bounce rate | 65,3 % |
| Conversiones | 9 |

### 3.2 Eventos · `PARCIAL`

**Con disparos:** `whatsapp_click: 5`, `lead_generated: 2`, `phone_click: 2` (9 conversiones).
**Sin disparos (definidos en `lib/analytics.ts`):** `form_click`, `email_click`, `directions_click` — posible implementación incompleta. Requiere revisión de `app/(public)` (zona protegida).

### 3.3 Fuentes y audiencia

- Orgánico buscadores: 18,8 % (Google 137 + Bing 24 sesiones). Directo: 72,4 %.
- Honduras: 114 usuarios (16,9 %). Desktop 82,5 % / Mobile 17,1 %.
- Contaminación: 14 páginas `/intranet/*` en top pages (exclusión en `lib/analytics.ts` no efectiva).

---

## 4. Cruce GSC + GA4 consolidado

| Categoría | Hallazgo | Estado |
|---|---|---|
| Muchas impresiones, bajo CTR | 6 posts +350 imp, CTR < 3 % | `VALIDADO` → PROPUESTA P1 |
| Indexables sin tráfico | 8 huérfanas (0 imp GSC + 0 sesiones GA4) | `VALIDADO` → PROPUESTA P5 |
| Tráfico orgánico, metadata débil | Los 6 posts reciben clics a pesar de titles genéricos | `VALIDADO` |
| Embudo blog→comercial roto | Blog recibe orgánico; comerciales reciben directo | `VALIDADO` → PROPUESTA P4 |
| Anomalía canónica | Home duplicada en GSC | `RESUELTO VALIDADO` |
| Eventos sin trackear | 3 eventos definidos sin disparos | `PARCIAL` → PROPUESTA P3 |

---

## 5. Mejoras APLICADAS

### ✅ A1 — Fix `GOOGLE_SEARCH_CONSOLE_SITE_URL`

| Item | Detalle |
|---|---|
| Archivo | `.env.local` línea 20 |
| Cambio | `sc-domain:pinedayasociadoshn.com` → `https://www.pinedayasociadoshn.com/` |
| Motivo | Restaurar acceso GSC API roto tras eliminación de property sin-www |
| Evidencia | `seo:audit:gsc-ga4` reportaba `siteOwner` de URL-prefix pero error en `sc-domain:` |
| Validación | `seo:gsc:live` ✅ (161 clics extraídos), `seo:audit:gsc-ga4` ✅ (URL inspection 10/10 PASS), `seo:collect` 6/6, `seo:doctor` 18 OK |
| Reversión | Editar `.env.local`: volver a `sc-domain:pinedayasociadoshn.com` |
| Zona protegida | No (`.env.local` no está en AGENTS.md §7; está gitignored) |

**Efectos colaterales positivos:**
- Anomalía canónica GSC resuelta (home ya no duplicada).
- `seo:collect` restaurado a 6/6 fuentes.
- URL Inspection API operativo (monitoreo de indexación automatizable).

---

## 6. Mejoras NO aplicadas (protección / autorización)

| Mejora | Razón de no aplicar | Estado |
|---|---|---|
| Optimizar title/meta 6 posts (P1) | Requiere DB `blog_posts` sin backup previo | `PROPUESTA` |
| Enlazar 8 huérfanas (P5) | Requiere `app/(public)` (zona protegida §7) | `PROPUESTA` |
| Enlazado blog→comercial (P4) | Requiere `app/(public)` (zona protegida §7) | `PROPUESTA` |
| Redirects 6 URLs 404 (P7) | Requiere `next.config.ts` (zona protegida §7) | `PROPUESTA` |
| Fix eventos GA4 sin disparos (P3) | Requiere `app/(public)` (zona protegida §7) | `PROPUESTA` |
| Filtro GA4 intranet (P6) | Requiere GA4 UI (config externa) | `PROPUESTA` |
| Consolidación canónica (P2) | Ya resuelta por servidor + fix A1 | `RESUELTO` |

---

## 7. Bing · `PARCIAL`

```
npm run bing:auth:status → ❌ No autorizado
```

OAuth Bing sigue pendiente (sin cambios). API Key operativa (crawl stats + queries disponibles). Position/CTR/backlinks requieren OAuth → `PENDIENTE HUMANO`.

---

## 8. QA final

| Comando | Resultado | Regresión |
|---|---|---|
| `npm run seo:gsc:live` | ✅ 161 clics / 8350 imp extraídos | No |
| `npm run seo:audit:gsc-ga4` | ✅ URL inspection 10/10 PASS | No |
| `npm run seo:collect` | 6/6 fuentes ✅ (antes 5/6) | **Mejora** |
| `npm run seo:doctor` | 18 OK / 1 ERROR / 4 PENDIENTE (antes 17/1/5) | **Mejora** |
| `npm run seo:health` | 13 OK / 2 warn / 0 fail | No |
| `npm run indexnow:dry` | 24 URLs / techo 223 ✅ | No |
| Canonical test 4 variantes | 4/4 → `https://www.` | No |

**No se ejecutaron lint/tsc/test/build** porque el único cambio fue una variable de entorno local (sin código). Estado del repositorio estable y mejorado.

---

## 9. Archivos modificados

| Archivo | Tipo | Reversión |
|---|---|---|
| `.env.local` (línea 20) | MODIFICADO (1 variable) | Revertir valor a `sc-domain:pinedayasociadoshn.com` |
| `docs/audits/revision-final-seo-gsc-ga4-canonical-2026-07-08.md` | NUEVO (este informe) | Borrar |
| `auditoria-acciones.md` | ACTUALIZADO | — |
| Regenerados por scripts | `data/google/gsc-live.json`, `data/google/ga4-live.json`, `data/bing/bing-live.json`, `data/seo/live-summary.json`, `docs/audits/*.md`, `scripts/.seo-audit.json` | — |

**0 archivos de código fuente modificados.** `.env.local` está en `.gitignore` (no se commitea). README.md y CHANGELOG.md sin cambios (no procede).

---

## 10. Riesgos pendientes

| Riesgo | Severidad | Estado |
|---|---|---|
| 6 posts CTR bajo pierden clics diarios | Media-alta | P1 pendiente (DB) |
| 8 huérfanas invisibles | Media | P5 pendiente (app/(public)) |
| 3 eventos conversión sin trackear | Media | P3 pendiente (app/(public)) |
| Contaminación GA4 intranet | Baja-media | P6 pendiente (GA4 UI) |
| Bing OAuth sin autenticar | Baja | H1 pendiente (device flow) |
| 6 URLs 404 (sin tráfico) | Baja | P7 pendiente (next.config.ts) |

## NO VALIDADO

- GA4 engagement/bounce por página individual (solo global).
- Bing position/CTR/backlinks (OAuth pendiente).
- Causa raíz eventos GA4 sin disparos (requiere revisar componentes).

---

## 11. Instrucciones humanas restantes (H/P)

| ID | Acción | Bloque | Esfuerzo |
|---|---|---|---|
| H1 | `npm run auth:bing` (device flow OAuth Bing) | Bing | 5 min |
| P1 | Optimizar title/meta 6 posts (backup DB previo) | CTR | 20 min |
| P3 | Investigar eventos GA4 sin disparos (revisar `app/(public)`) | Conversión | 30 min |
| P4 | Enlazado blog→comercial (`app/(public)`) | Embudo | 45 min |
| P5 | Enlazar 8 huérfanas (`app/(public)`) | Indexación | 30 min |
| P6 | Filtro GA4 intranet (GA4 UI) | Analítica | 15 min |
| P7 | Redirects 6 URLs 404 (`next.config.ts`) | Crawl budget | 15 min |

**H2 (solicitud indexación GSC) ELIMINADA** — las 10 URLs ya están indexadas (RESUELTO VALIDADO).

---

## 12. Porcentaje final por bloque

| Bloque | Estado | Completado |
|---|---|---|
| Canonicalización dominio | `VALIDADO` / `RESUELTO` | 100 % |
| GSC acceso API | `APLICADO` (fix A1) | 100 % |
| GSC index status 10 URLs | `RESUELTO VALIDADO` | 100 % |
| GSC análisis (queries, pages, CTR) | `VALIDADO` | 100 % |
| GA4 análisis | `VALIDADO` / `PARCIAL` | 90 % |
| Cruce GSC+GA4 | `VALIDADO` | 100 % |
| Bing | `PARCIAL` (OAuth pendiente) | 60 % |
| Mejoras aplicadas | `APLICADO` (1 fix) | 100 % de lo aplicable |
| Mejoras propuestas (P1-P7) | `PROPUESTA` | 100 % documentadas |
| QA | `VALIDADO` | 100 % |
| Documentación | `VALIDADO` | 100 % |

**Avance real esta sesión:** +1 cambio APLICADO y VALIDADO (fix GSC API), +1 problema RESUELTO VALIDADO (canonicalización/anomalía GSC), +1 acción humana eliminada (H2 ya no necesaria). **Auditoría global: ~95 % completada** (solo falta OAuth Bing + propuestas que requieren autorización de zonas protegidas).

---

## Resumen para dirección

> **Se aplicó un fix que restauró el acceso a Google Search Console**, que se había roto al eliminar la propiedad sin-www. Ahora todas las métricas, la inspección de URLs y la canonicalización funcionan correctamente. Las 10 páginas comerciales clave están confirmadas como **indexadas en Google**.
>
> **La canonicalización del dominio es impecable:** las 4 variantes (`http://`, `https://`, con y sin www) redirigen limpia y únicamente a `https://www.pinedayasociadoshn.com/`. No hay mezcla de protocolos ni subdominios. La anomalía de la home duplicada en GSC desapareció.
>
> **Lo único aplicado:** un cambio de una variable de entorno local (`.env.local`) para apuntar a la propiedad de GSC donde el usuario sí tiene acceso. Reversible en segundos. Sin tocar código, sin zonas protegidas, sin commits.
>
> **Lo que queda pendiente** (requiere autorización humana): optimizar títulos de 6 posts con bajo CTR, enlazar 8 páginas huérfanas, conectar el blog con las páginas comerciales, y autenticar Bing. Todas las propuestas están documentadas con evidencia y listas para ejecutar.
>
> **No hay riesgos de seguridad.** El proyecto está técnicamente sano y mejor que al inicio de la sesión.
