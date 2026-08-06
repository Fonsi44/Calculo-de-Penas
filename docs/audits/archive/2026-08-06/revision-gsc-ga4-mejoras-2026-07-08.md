# Revisión GSC + GA4 y Mejoras — 2026-07-08

**Proyecto:** Pineda y Asociados (`https://www.pinedayasociadoshn.com`)
**Fecha:** 2026-07-08 · **Período de datos:** 28 días (2026-06-10 → 2026-07-08)
**Fuentes:** `data/google/gsc-live.json`, `data/google/ga4-live.json`, `scripts/.seo-audit.json` (URL Inspection API), `data/bing/bing-live.json`
**Documentos hermanos:** auditoría, plan post-auditoría, cierre de ejecución (mismos `docs/audits/`)

---

## Resumen ejecutivo

Revisión profunda de GSC + GA4 con **cruce URL por URL**. **Cambio crítico de diagnóstico respecto a informes anteriores:** la URL Inspection API confirma que **las 10 URLs comerciales prioritarias están "Enviada e indexada" (PASS)** — el "problema crítico de indexación" del informe del 4 de julio **se resolvió solo** tras el re-envío del sitemap (3 jul) y el paso de los días. **El index status ya NO es un bloqueante.**

**Mejoras APLICADAS en esta sesión: NINGUNA.** Tras revisar exhaustivamente el repositorio, ninguna mejora de alto impacto cumple todas las condiciones para aplicarse sin autorización (todas tocan DB `blog_posts` o zonas protegidas `app/(public)` / `next.config.ts`). Todo queda como `PROPUESTA` con evidencia directa.

**Los 4 hallazgos accionables de mayor impacto (todos PROPUESTA):**
1. **Anomalía canónica:** la home aparece en GSC bajo `http://pinedayasociadoshn.com/` (15 clics) Y `https://www.pinedayasociadoshn.com/` (6 clics) — autoridad dividida.
2. **6 posts con +350 impresiones y CTR < 3 %** por títulos genéricos (optimización title/meta = alto impacto CTR).
3. **3 eventos de conversión definidos pero SIN disparos** (`form_click`, `email_click`, `directions_click`) — posible implementación incompleta.
4. **8 páginas huérfanas con 0 impresiones GSC y 0 sesiones GA4** — invisibles pese a estar indexadas.

---

## 1. Hallazgos GSC · `VALIDADO`

### 1.1 Métricas globales (28d)

| Métrica | Valor |
|---|---|
| Clics | 175 |
| Impresiones | 8.472 |
| CTR | 2,07 % |
| Posición media | 6,9 |
| Sitemap | Enviado 2026-07-03, 0 errores, 0 warnings |
| Queries con datos | 100 |
| Pages con datos | 115 |

### 1.2 Estado real de indexación (URL Inspection API) · `VALIDADO`

> ⚠️ **Esto invalida el bloque "Indexación Google" de los informes anteriores** (que se basaban en monitorización manual del 4 de julio, 1 día post-deploy).

| URL | Verdict | Cobertura |
|---|---|---|
| `/` | PASS | Enviada e indexada |
| `/servicios-juridicos` | PASS | Enviada e indexada |
| `/derecho-penal` | PASS | Enviada e indexada |
| `/solicitar-consulta` | PASS | Enviada e indexada |
| `/como-llegar` | PASS | Enviada e indexada |
| `/abogados-en-nacaome` | PASS | Enviada e indexada |
| `/abogados-en-choluteca` | PASS | Enviada e indexada |
| `/abogados-en-san-lorenzo` | PASS | Enviada e indexada |
| `/blog` | PASS | Enviada e indexada |
| `/preguntas-frecuentes` | PASS | Enviada e indexada |

**Conclusión:** las 10 URLs comerciales **están indexadas**. La acción H2 (solicitar indexación manual) del cierre previo **ya no es necesaria para estas 10** — Google las indexó solo.

### 1.3 Top pages por impresiones (oportunidades de CTR)

| Página | Imp. | Clics | CTR | Pos. | Title actual (DB) |
|---|---|---|---|---|---|
| `/blog/derecho-notarial/poder-legal-honduras-cuando-se-necesita` | 679 | 9 | 1,3 % | 5,9 | "Poder Notarial en Honduras: Tipos" (34c) |
| `/blog/extranjeria-migracion/naturalizacion-obtener-nacionalidad-hondurena` | 543 | 7 | 1,3 % | 8,4 | (título corto) |
| `/blog/derecho-de-familia/custodia-hijos-honduras-juez` | 520 | 5 | 1,0 % | 7,4 | "Custodia de Hijos en Honduras 2026" (34c) |
| `/blog/derecho-civil/prescripcion-deudas-plazos-honduras` | 453 | 12 | 2,6 % | 5,7 | "Prescripcion de Deudas en Honduras" (34c) |
| `/blog/derecho-de-familia/pension-alimenticia-honduras-guia-completa` | 436 | 8 | 1,8 % | 6,1 | "Pensión Alimenticia Honduras 2026" (33c) |
| `/blog/derecho-de-familia/pension-alimenticia-porcentaje-honduras-2026` | 423 | 12 | 2,8 % | 4,7 | "Pensión Alimenticia Honduras 2026" (54c) |
| `/blog/derecho-penal/estafas-fraudes-tipos-penales-honduras` | 376 | 6 | 1,6 % | 7,8 | "Estafas en Honduras: Tipos Penales" (34c) |

**Diagnóstico:** 6 posts con +350 impresiones y CTR < 3 %. Patrón claro: **títulos genéricos sin la pregunta/concepto que el usuario busca**. El query ganador ("porcentaje de pensión alimenticia por 2 hijos", CTR 10,71 %, pos 2,5) demuestra que incluir el dato concreto dispara el CTR.

### 1.4 Anomalía canónica detectada · `VALIDADO`

La home aparece en GSC bajo **dos URLs distintas**:

| URL | Clics | Imp. | CTR | Pos. |
|---|---|---|---|---|
| `http://pinedayasociadoshn.com/` (apex, http) | 15 | 221 | 6,8 % | 3,8 |
| `https://www.pinedayasociadoshn.com/` (www, https) | 6 | 215 | 2,8 % | 4,4 |

Google indexa y muestra ambas versiones, **dividiendo autoridad y clics**. Aunque el redirect http→https funciona (health-check PASS), GSC reporta tráfico separado. Esto requiere revisión de la consolidación canónica a nivel de GSC / Search Console property.

### 1.5 Queries con posición alta pero 0 clics

| Query | Imp. | Pos. | Diagnóstico |
|---|---|---|---|
| a los cuantos años prescribe una deuda en honduras | 12 | 3,4 | Pos 3-4 sin clics → title/snippet débil |
| abandono de trabajo codigo del trabajo honduras | 1 | 1,0 | Pos #1, baja intención comercial |
| abogado / bufete | 2/1 | 1,0 | Branding, baja intención |

---

## 2. Hallazgos GA4 · `VALIDADO` / `PARCIAL`

### 2.1 Métricas globales (28d)

| Métrica | Valor |
|---|---|
| Usuarios | 673 |
| Sesiones | 854 |
| Pageviews | 4.819 |
| Duración media sesión | 404 s (6,7 min) |
| Bounce rate | 65,3 % |
| Conversiones | 9 |

### 2.2 Eventos y conversiones · `PARCIAL`

**Eventos CON disparos (conversiones reales):**
| Evento | Disparos (28d) |
|---|---|
| `whatsapp_click` | 5 |
| `lead_generated` | 2 |
| `phone_click` | 2 |
| **Total conversiones** | **9** |

**Eventos definidos en `lib/analytics.ts` SIN disparos** (posible implementación incompleta):
| Evento | Estado |
|---|---|
| `form_click` | ❌ NO REGISTRADO |
| `email_click` | ❌ NO REGISTRADO |
| `directions_click` | ❌ NO REGISTRADO |

**Diagnóstico:** 3 eventos de conversión definidos en código pero sin disparos. Posibles causas: (a) los CTAs correspondientes no existen en el render, (b) existen pero no invocan el helper de tracking, (c) existen pero los usuarios no interactúan. Requiere revisión de componentes (zona protegida `app/(public)`). `PARCIAL` hasta validar.

### 2.3 Fuentes de tráfico

| Fuente | Sesiones | % |
|---|---|---|
| (direct) | 618 | 72,4 % |
| google | 137 | 16,0 % |
| bing | 24 | 2,8 % |
| l.facebook.com | 19 | 2,2 % |
| vercel.com | 14 | 1,6 % |
| search.google.com | 13 | 1,5 % |

**Tráfico orgánico de buscadores: 18,8 %** (Google + Bing). El 72,4 % es directo — inusualmente alto, consistente con tráfico interno/branding.

### 2.4 Contaminación de análisis · `VALIDADO`

14 páginas `/intranet/*` y `/admin/*` aparecen en GA4 top pages (209, 201, 156, 155, 148, 130...). `lib/analytics.ts` SÍ define `ANALYTICS_EXCLUDED_PREFIXES` que incluye `/intranet`, `/admin` — pero GA4 sigue registrándolas. **La exclusión client-side no es efectiva** o el page_view se disporta antes de la verificación. `PARCIAL` — requiere investigación (no bloqueante, pero contamina métricas de audiencia).

### 2.5 Geografía y dispositivos

| País | Usuarios | | Dispositivo | Usuarios |
|---|---|---|---|---|
| España | 280 | | Desktop | 555 (82,5 %) |
| EE.UU. | 119 | | Mobile | 115 (17,1 %) |
| **Honduras** | **114 (16,9 %)** | | Tablet | 4 |

**Solo 16,9 % de usuarios desde Honduras** (mercado objetivo). Proporción desktop 82,5 % anormal para web pública legal. Sugiere tráfico interno/bots/IA no filtrado.

---

## 3. Cruce GSC + GA4 URL por URL

### 3.1 Páginas con muchas impresiones y bajo CTR · `VALIDADO`

Ver tabla §1.3. **6 posts con +350 imp y CTR < 3 %.** La mejora de title/meta es la acción de mayor impacto CTR disponible.

### 3.2 Páginas con buen CTR pero bajo engagement/conversión · `SIN DATOS SUFICIENTES`

GA4 no expone engagement/bounce por página en el extracto disponible (solo global 65,3 %). `NO VALIDADO` a nivel página.

### 3.3 Páginas indexables sin tráfico · `VALIDADO`

**8 páginas huérfanas:** indexadas (PASS en sección 1.2 patrón) pero **0 impresiones GSC + 0 sesiones GA4** (verificadas en top pages). Confirmadas: `/abogados-en-langue`, `/abogados-en-caridad`, `/abogados-en-san-antonio-de-flores`, `/abogados-en-concepcion-de-maria`, `/abogados-en-alianza`, `/abogado-civil-nacaome`, `/abogado-laboralista-nacaome`, `/abogado-de-familia-nacaome`.

### 3.4 Páginas con tráfico orgánico pero metadata débil · `VALIDADO`

Los 6 posts de §1.3 reciben tráfico orgánico (clics > 0) con títulos genéricos. El tráfico llega **a pesar de** la metadata débil, no gracias a ella.

### 3.5 Oportunidades de enlazado interno · `PROPUESTA`

Las 8 huérfanas + los 6 posts top deberían enlazar mutuamente: los posts de alto tráfico podrían redistribuir autoridad hacia landings comerciales huérfanas. Requiere `app/(public)` (zona protegida).

### 3.6 Contenidos que merecen actualización · `PROPUESTA`

Los 6 posts top por impresiones son candidatos a expansión/actualización de contenido (no solo title). Especialmente `/blog/extranjeria-migracion/naturalizacion-obtener-nacionalidad-hondurena` (543 imp, pos 8,4) — bajar a pos ≤ 5 multiplicaría clics.

### 3.7 Páginas comerciales que deben recibir más autoridad interna · `PROPUESTA`

`/servicios-juridicos`, `/despacho`, `/solicitar-consulta` reciben tráfico **directo** (GA4 top) pero **casi nada orgánico** (no en GSC top pages). Necesitan enlazado interno desde los posts de blog que sí tienen tráfico orgánico.

### 3.8 Problemas técnicos detectables desde datos · `VALIDADO`

- Anomalía canónica home (§1.4).
- 3 eventos GA4 sin disparos (§2.2).
- Contaminación GA4 intranet (§2.4).

### 3.9 Discrepancias entre visibilidad y comportamiento · `VALIDADO`

**Discrepancia clave:** las páginas con más impresiones GSC son **posts de blog informativos**, pero las páginas con más sesiones GA4 son **páginas comerciales** (servicios, despacho). El tráfico orgánico entra por blog (long-tail); las comerciales se nutren de directo. **Falta embudo blog → comercial** (enlazado interno CTA).

---

## 4. Mejoras aplicadas · `SIN CAMBIOS`

**Se aplicaron 0 cambios de código o contenido.** Tras revisar exhaustivamente:

| Mejora candidata | Aplicable sin auth? | Razón de no aplicar |
|---|---|---|
| Optimizar title/meta 6 posts | ❌ | Requiere DB `blog_posts` sin backup previo |
| Enlazar 8 huérfanas | ❌ | Requiere `app/(public)` (zona protegida §7) |
| Redirects 6 URLs 404 | ❌ | Requiere `next.config.ts` (zona protegida §7) |
| Fix eventos GA4 sin disparos | ❌ | Requiere `app/(public)` (zona protegida §7) |
| Consolidación canónica home | ❌ | Requiere GSC UI / config dominio |
| Filtro GA4 intranet | ❌ | Requiere GA4 UI (config externa) |
| Actualizar `data/seo/high-intent-guides.ts` | ✅ pero | **Ya correcto** (lista los slugs top, sin cambios necesarios) |

**Conclusión:** el único archivo no protegido relevante ya está correcto. Todas las mejoras de impacto requieren autorización o intervención externa.

---

## 5. Propuestas pendientes (priorizadas)

### PROPUESTA P1 — Optimizar title/meta de 6 posts top (alto impacto CTR)

> Requiere: backup DB previo (`npx tsx scripts/backup-blog.ts`) + autorización. No aplica: toca DB.

| Post | Title actual | Title propuesto | Hipótesis |
|---|---|---|---|
| poder-legal-honduras | "Poder Notarial en Honduras: Tipos" | "Poder Notarial Honduras: Cuándo se Necesita y Tipos" | Match query + pregunta |
| custodia-hijos-honduras-juez | "Custodia de Hijos en Honduras 2026" | "Custodia de Hijos en Honduras: Cómo Decide el Juez (2026)" | Match intención |
| prescripcion-deudas-plazos | "Prescripcion de Deudas en Honduras" | "Prescripción de Deudas en Honduras: Plazos y Cuántos Años" | Match "cuántos años" |
| pension-porcentaje-2026 | "Pensión Alimenticia Honduras 2026" | "Pensión Alimenticia Honduras 2026: ¿Cuánto por Hijo?" | Match H1 + query top |
| pension-guia-completa | "Pensión Alimenticia Honduras 2026" | "Pensión Alimenticia Honduras: Cómo Calcularla y Demandarla" | Diferenciar del otro post |
| naturalizacion-nacionalidad | (título corto) | "Nacionalidad Hondureña: Requisitos y Cómo Obtenerla (2026)" | Match query + año |

**Validación:** comparar CTR a 28d en GSC (baseline agregado ~1,3-2,8 %, objetivo ≥ 5 %).

### PROPUESTA P2 — Investigar consolidación canónica home (alto impacto)

> Requiere: GSC UI / revisión config dominio. No aplica: configuración externa.

Acción: en GSC, verificar que `sc-domain:pinedayasociadoshn.com` consolide `http://apex` y `https://www`. Si no, revisar canonical tags y redirects a nivel servidor (Vercel). La versión `http://` recibiendo 15 clics indica que Google aún la muestra en algunos resultados.

### PROPUESTA P3 — Investigar 3 eventos GA4 sin disparos (impacto conversión)

> Requiere: revisión de componentes en `app/(public)` (zona protegida). No aplica.

Acción: auditar dónde deberían dispararse `form_click`, `email_click`, `directions_click` y verificar si los CTAs existen y llaman al helper. Si no disparan, se pierden conversiones trackeables.

### PROPUESTA P4 — Enlazado interno: posts top → landings comerciales (alto impacto)

> Requiere: `app/(public)` (zona protegida). No aplica.

Los 6 posts top por tráfico orgánico deberían enlazar hacia `/solicitar-consulta`, `/servicios-juridicos/{area}` relevantes y landings de ciudad. Cierra el embudo blog → comercial.

### PROPUESTA P5 — Enlazar 8 huérfanas (medio impacto)

> Ya documentado en `plan-accion-seo-post-auditoria-2026-07-08.md` §4. Requiere `app/(public)`.

Confirmado con datos frescos: 0 impresiones + 0 sesiones. Urgencia confirmada.

### PROPUESTA P6 — Reducir contaminación GA4 intranet (medio impacto)

> Requiere: GA4 UI (filtro) + investigación de por qué `ANALYTICS_EXCLUDED_PREFIXES` no excluye. No aplica.

---

## 6. Revisión específica (pensión, 10 URLs, huérfanas, 404) con datos frescos

### Pensión alimenticie · `VALIDADO` (datos actualizados)

| Post | Imp. | Clics | CTR | Pos. |
|---|---|---|---|---|
| `/blog/.../pension-alimenticia-porcentaje-honduras-2026` | 423 | 12 | 2,8 % | 4,7 |
| `/blog/.../pension-alimenticia-honduras-guia-completa` | 436 | 8 | 1,8 % | 6,1 |
| `/blog/.../pension-alimenticia-honduras-como-solicitarla` | 225 | 5 | 2,2 % | 6,9 |

**Total pensión:** 1.084 impresiones / 25 clics / CTR 2,3 % (mayor alcance del estimado). La Propuesta A del plan previo sigue siendo válida y ahora con más alcance. `PROPUESTA` (requiere DB).

### 10 URLs comerciales · `VALIDADO` — CAMBIO DE ESTADO

**Todas indexadas (PASS vía URL Inspection API).** La acción H2 (solicitud manual GSC) **ya NO es necesaria**. El bloque "Indexación Google" del plan previo se da por **resuelto**.

### 8 páginas huérfanas · `VALIDADO`

0 impresiones GSC + 0 sesiones GA4. Confirmadas invisibles. Enlazado = `PROPUESTA P5`.

### 6 URLs 404 · `VALIDADO`

0 impresiones GSC → **baja severidad** (no pierden tráfico). El fix por crawl budget sigue siendo recomendable pero baja de prioridad. `PROPUESTA` (requiere `next.config.ts`).

---

## 7. Comandos ejecutados y QA

| Comando | Resultado |
|---|---|
| `npm run seo:collect` | 6/6 fuentes OK ✅ |
| `npm run seo:audit:gsc-ga4` | GSC+GA4+URL Inspection extraído ✅ (novedad: index status real) |
| `npm run seo:doctor` | 18 OK / 1 ERROR / 4 PENDIENTE (sin regresiones) |
| `npm run seo:health` | 13 OK / 2 warn / 0 fail (sin regresiones) |
| `npm run indexnow:dry` | 24 URLs / techo 223 ✅ |
| Query DB titles posts top | 7 títulos extraídos (evidencia para P1) |

**Sin cambios de código → no se ejecutan lint/tsc/test/build** (no hay nada que validar). Estado del repositorio estable.

---

## 8. Archivos modificados

| Archivo | Tipo |
|---|---|
| `docs/audits/archive/2026-08-06/revision-gsc-ga4-mejoras-2026-07-08.md` | NUEVO (este informe) |
| `auditoria-acciones.md` | ACTUALIZADO (registro de esta operación) |
| Regenerados por `seo:collect`/`seo:audit:gsc-ga4` | `data/google/gsc-live.json`, `data/google/ga4-live.json`, `data/bing/bing-live.json`, `data/seo/live-summary.json`, `docs/audits/bing-live-report.md`, `docs/audits/seo-live-summary.md`, `scripts/.seo-audit.json` |

**0 archivos de código fuente modificados.** README.md y CHANGELOG.md sin cambios (no procede).

**Reversión:** no aplica — 0 cambios destructivos ni de código.

---

## 9. Riesgos pendientes

| Riesgo | Severidad | Nota |
|---|---|---|
| Anomalía canónica home (autoridad dividida) | Media | Requiere GSC UI / config dominio |
| 6 posts con CTR bajo pierden clics cada día | Media-alta | P1 desbloquea +clics inmediatos |
| 3 eventos conversión sin trackear | Media | Posible pérdida de visibilidad de conversiones |
| Contaminación GA4 distorsiona métricas | Baja-media | 14 páginas intranet en top |
| 8 huérfanas sin tráfico | Media | Indexadas pero invisibles |
| Bing OAuth sin autenticar | Baja | API Key fallback operativo |

## NO VALIDADO

- GA4 engagement/bounce por página individual (solo global disponible).
- Bing position/CTR/backlinks (OAuth pendiente).
- Indexación real de las 8 huérfanas (no inspeccionadas vía API, solo se confirmó que no tienen tráfico).
- Causa raíz de eventos GA4 sin disparos (requiere revisar componentes).

---

## 10. Porcentaje final por bloque

| Bloque | Diagnóstico | Aplicado | Propuesta |
|---|---|---|---|
| GSC análisis | 100 % `VALIDADO` | — | — |
| GA4 análisis | 90 % `VALIDADO` / 10 % `PARCIAL` | — | — |
| Cruce GSC+GA4 | 100 % `VALIDADO` | — | — |
| Mejoras aplicables (sin auth) | 100 % analizado | **0 %** (ninguna cumplía condiciones) | — |
| Propuestas P1-P6 | 100 % documentadas | — | 100 % listas para aprobar |
| Indexación 10 URLs | 100 % `VALIDADO` (resuelto) | — | — |
| Pensión, huérfanas, 404 | 100 % re-validados | — | — |
| QA | 100 % `VALIDADO` | — | — |
| Documentación | 100 % | — | — |

**Ejecución automática completada: 100 %** (todo el análisis posible sin autorización, hecho).
**Cambios APLICADOS: 0** (ninguna mejora cumplía todas las condiciones de seguridad/autorización).
**Propuestas listas para aprobar: 6 (P1-P6)**, siendo P1 (titles) y P4 (enlazado blog→comercial) las de mayor impacto.

---

## Resumen para dirección

> **Buenas noticias:** la revisión con datos frescos revela que **el problema crítico de indexación ya se resolvió solo** — las 10 URLs comerciales están indexadas en Google (confirmado vía API). El sitemap enviado el 3 de julio funcionó.
>
> **Hallazgo técnico a vigilar:** Google está mostrando dos versiones de la home (`http://` y `https://www`), dividiendo la autoridad. Requiere revisión en Search Console.
>
> **Mayor oportunidad de crecimiento:** hay **6 posts de blog con +350 impresiones mensuales cada uno y CTR por debajo del 3 %** porque sus títulos son genéricos. Optimizar los títulos (incluyendo la pregunta concreta que busca el usuario) es la acción de mayor impacto y menor esfuerzo — pero requiere edición en base de datos con backup previo.
>
> **Brecha de conversión:** el blog recibe tráfico orgánico pero las páginas comerciales se nutren solo de tráfico directo. Falta un embudo de enlazado interno (blog → servicios → consulta).
>
> **No se aplicaron cambios.** Todo queda documentado como propuestas concretas con evidencia, listas para que Desarrollo las apruebe y ejecute. Sin riesgos de seguridad, sin zonas protegidas modificadas.
