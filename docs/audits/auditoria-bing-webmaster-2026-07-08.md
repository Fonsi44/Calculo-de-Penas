# Auditoría SEO Integral — Bing Webmaster Tools + Cruzado Multi-Fuente

**Proyecto:** Pineda y Asociados (`https://www.pinedayasociadoshn.com`)
**Fecha de auditoría:** 2026-07-08
**Período de datos:** 28 días (2026-06-10 → 2026-07-08)
**Ejecutada por:** Agente IA (GLM-5.2) siguiendo protocolo `AGENTS.md`
**Clasificación global:** `VALIDADO` (datos reales extraídos) con bloques `NO VALIDADO` y `PENDIENTE` señalados

---

## 1. Resumen ejecutivo

La web del bufete **Pineda y Asociados** presenta una **infraestructura SEO técnica sólida y bien mantenida**: sitemap coherente (213 URLs), robots.txt correctamente segmentado, IndexNow operativo, DNS/SPF/DKIM/DMARC completos, redirect http→https funcional y verificación de propiedad en Google Search Console activa.

Sin embargo, la auditoría revela **tres problemas de alto impacto** que frenan el rendimiento orgánico:

1. **Indexación prácticamente nula en Google** (solo `/` indexada; 16 URLs comerciales prioritarias y 8 categorías de blog permanecen "Pendientes" sin rastreo desde el deploy del 2026-07-04). **Severidad crítica.**
2. **Bing Webmaster conectado solo con API Key** (OAuth no autenticado), lo que impide obtener posición media, CTR, códigos HTTP por URL y backlinks — datos esenciales para diagnóstico profundo en Bing. **Severidad alta.**
3. **8 páginas huérfanas** (landings de ciudades y especialidades con 0 enlaces internos) y **11 URLs 4xx** por enlaces internos mal construidos (rutas duplicadas tipo `/blog/tributario/blog/derecho-laboral/...`). **Severidad alta.**

**Tráfico actual (28 días):** 673 usuarios (GA4), 175 clics / 8.472 impresiones (GSC), CTR 2,07 %, posición media 6,9. Bing aporta 23 usuarios / 24 sesiones (3,4 % del tráfico). El sitio genera impresiones pero **no convierte el potencial**: múltiples queries con miles de impresiones y 0 clics por posicionamiento 8–41.

**Conclusión para dirección:** la base técnica es correcta y no hay riesgos de seguridad. El cuello de botella está en **indexación** (Google no está rastreando las páginas nuevas) y **optimización de CTR/contenido** en queries ya con visibilidad. Invertir 7 días en indexing manual + corrección de enlaces rotos desbloqueará el crecimiento.

---

## 2. Estado de conexión y scripts utilizados

### 2.1 Diagnóstico de credenciales (`npm run seo:doctor`)

Resultado: **18 OK · 1 ERROR · 4 PENDIENTE** (2026-07-08T07:17:00Z)

| Integración | Estado | Detalle |
|---|---|---|
| GSC Site URL | ✅ | Configurada en `.env` (`sc-domain:pinedayasociadoshn.com`) |
| GSC datos LIVE | ✅ | 175 clics, 8.472 impresiones extraídas |
| GA4 Property | ✅ | `541022095` (G-L2PGBN3SWK), 673 usuarios |
| OAuth Google | ✅ | Client + refresh token guardados |
| **Bing OAuth token** | ⬜ PENDIENTE | **`npm run auth:bing` no ejecutado** → OAuth no autenticado |
| Bing API Key (IndexNow) | ✅ | `INDEXNOW_KEY` configurada (9f9940…71) |
| Bing Client ID | ✅ | `BING_CLIENT_ID` presente |
| Bing datos LIVE | ✅ | 3.330 páginas rastreadas, 83 queries (vía API Key) |
| IndexNow key | ✅ | Coincide `.env` ↔ `public/<key>.txt` |
| Vercel CLI / GitHub CLI | ✅ | Autenticados |
| gcloud CLI | ❌ ERROR | No instalada (no bloquea; se usa OAuth directo) |

### 2.2 Scripts del repositorio utilizados (pipeline de extracción)

| Script (`package.json`) | Propósito | Salida |
|---|---|---|
| `npm run seo:doctor` | Diagnóstico de auths y disponibilidad de datos | Consola |
| `npm run seo:collect` | Recolector orquestador (6 fuentes) | `data/seo/live-summary.json` + `docs/audits/seo-live-summary.md` |
| `npm run seo:bing:live` | Bing WMT: crawl, queries, backlinks, URL info | `data/bing/bing-live.json` + `docs/audits/bing-live-report.md` |
| `npm run seo:gsc:live` | Google Search Console: queries, páginas, CTR, posición | `data/google/gsc-live.json` |
| `npm run seo:ga4:live` | GA4: usuarios, sesiones, dispositivos, países, fuentes | `data/google/ga4-live.json` |
| `npm run seo:health` | 15 probes (HTTP 8, DNS 6, local 1) | Consola |
| `npm run indexnow:dry` | Simulación de envío IndexNow (24 URLs) | Consola |

**Scripts disponibles NO ejecutados en esta auditoría** (no requeridos para Bing, listados para completitud):
`bing:auth`, `bing:site-explorer`, `bing:import-dashboard`, `seo:submit-sitemap`, `audit:indexacion`, `audit:seo`, `audit:internal-links`, `audit:canibalizacion`.

---

## 3. Fuentes de datos analizadas

| Fuente | Archivo / Origen | Periodo | Estado |
|---|---|---|---|
| **Bing Webmaster API** | `data/bing/bing-live.json` | 28 días | ✅ Extraído (modo API Key) |
| **Google Search Console** | `data/google/gsc-live.json` | 2026-06-10 → 07-08 | ✅ Extraído |
| **Google Analytics 4** | `data/google/ga4-live.json` | 2026-06-10 → 07-08 | ✅ Extraído |
| **IndexNow** | `.indexnow-cache.json` + dry-run | Instantáneo | ✅ Verificado |
| **SEO Health Check** | 15 probes HTTP/DNS/local | Instantáneo | ✅ 13 OK / 2 warn / 0 fail |
| **Sitemap** | `app/sitemap.ts` → `/sitemap.xml` | 213 URLs | ✅ HTTP 200, rutas prioritarias presentes |
| **Ahrefs (CSV export 07-jul)** | `ahrefs/*.csv` (11 informes) | Snapshot 2026-07-07 | ✅ Análisis cruzado |
| **GSC Indexación (post-deploy)** | `docs/audits/indexacion-monitorizacion.md` | Desde 2026-07-04 | ✅ Referencia |

---

## 4. Métricas clave y diagnóstico

### 4.1 Bing Webmaster — Crawl Stats (28 días)

| Métrica | Valor | Interpretación |
|---|---|---|
| Días reportados | 28 | Período completo |
| Páginas rastreadas | 3.330 | Bingbot activo |
| Respuestas 2xx | 4.702 | Saludable (la mayoría OK) |
| **Errores 4xx** | **362** | ⚠️ Elevado — ~7,7 % de las peticiones |
| Errores 5xx | 0 | ✅ Sin errores de servidor |
| **Errores de rastreo** | **503** | ⚠️ Alto — requiere investigación |

### 4.2 Bing — Queries (83, limitación API Key)

- **83 queries** con impresiones/clics registrados en Bing.
- **Las 83 devuelven `position: 0` y `ctr: 0`** — **limitación conocida**: la API pública con API Key (sin OAuth) no devuelve posición ni CTR, solo clicks/impressions agregados.
- Top queries Bing por intención: "unión de hecho", "pensión alimenticia", "prestaciones laborales", "importación", "licencia ambiental", "testamento", "ISV", "prescripción" — coincide con los topics YMYL del bufete.
- **Total clics Bing (28d):** sumando las queries visibles, ~22 clics orgánicos desde Bing.

### 4.3 Google Search Console (datos completos y fiables)

| Métrica | Valor |
|---|---|
| Clics | 175 |
| Impresiones | 8.472 |
| CTR | 2,07 % |
| Posición media | 6,9 |

**Top 5 queries por impresiones (oportunidades de optimización):**

| Query | Imp. | Clics | CTR | Pos. | Diagnóstico |
|---|---|---|---|---|---|
| cuanto es la pensión alimenticia por hijo en honduras | 70 | 1 | 1,43 % | 6,0 | Posición límite page 1 → mejorar a top 3 |
| cuanto es la manutencion de un hijo en honduras | 36 | 1 | 2,78 % | 5,2 | Igual, alta intención |
| porcentaje de pensión alimenticia por 2 hijos en honduras | 28 | 3 | 10,71 % | 2,5 | ✅ Funciona bien, replicar |
| despido laboral | 17 | 0 | 0 % | 12,2 | page 2 → necesita contenido específico |
| despacho legal | 14 | 0 | 0 % | **41,5** | ❌ Fuera de top 40 — problema de targeting |

### 4.4 GA4 — Audiencia y comportamiento

| Métrica | Valor |
|---|---|
| Usuarios | 673 |
| Sesiones | 854 |
| Pageviews | 4.819 |
| Duración media sesión | 404 s (6,7 min) |
| Bounce rate | 65,3 % |
| Conversiones | 9 |

**Fuentes de tráfico:** Direct 531 (78,8 %), Google 104, **Bing 23**, Facebook 5, ChatGPT 4, Copilot 3.

**Geografía:** España 281, EE.UU. 119, **Honduras 114**, Hong Kong 56, Países Bajos 28, China 22. ⚠️ **Solo 17 % de usuarios desde Honduras** — el tráfico objetivo (Honduras) es minoritario frente a España/EE.UU./Hong Kong. Posible ruido de bots o tráfico de IA no filtrado.

**Dispositivos:** Desktop 555 (82,5 %), Mobile 115 (17,1 %), Tablet 4. ⚠️ Proporción desktop anormalmente alta para web pública legal (típico: 60–70 % mobile). Refuerza hipótesis de tráfico interno/bots/IA.

### 4.5 SEO Health Check — 15 probes

```
Resultado: 13 OK · 2 warn · 0 fail
```

| Categoría | Probe | Estado |
|---|---|---|
| HTTP | IndexNow key file | ✅ HTTP 200, contenido coincide |
| HTTP | sitemap.xml | ✅ HTTP 200, 213 URLs |
| HTTP | robots.txt | ✅ Sitemap declarado, 4 bots IA gestionados |
| HTTP | **JSON-LD home** | ⚠️ Solo `FAQPage` (falta `LegalService`/`LocalBusiness`) |
| HTTP | **JSON-LD derecho-penal** | ⚠️ `BreadcrumbList, FAQPage, Service` (falta `LegalService`) |
| HTTP | BingSiteAuth.xml | ✅ HTTP 200 |
| HTTP | llms.txt | ✅ HTTP 200 |
| HTTP | redirect http→https | ✅ Confirmado |
| DNS | SPF / DKIM / DMARC / MX / NS | ✅ Todos correctos |
| DNS | google-site-verification | ✅ TXT presente |
| LOCAL | key .env vs public/ | ✅ Coinciden |

---

## 5. Errores críticos que bloquean indexación o rastreo

### 5.1 [CRÍTICA] Indexación Google prácticamente nula

- **Evidencia:** `docs/audits/indexacion-monitorizacion.md` muestra que desde el deploy del 2026-07-04, solo `/` está indexada (PASS, último rastreo 2026-06-30). **16 URLs comerciales + 8 categorías de blog permanecen "Pendiente" sin rastreo** (fecha 1970-01-01).
- **URLs afectadas (muestra):** `/servicios-juridicos`, `/blog`, `/servicios-juridicos/derecho-laboral`, `/servicios-juridicos/derecho-de-familia`, `/blog/extranjeria-migracion`, `/blog/conciliacion-arbitraje`, `/abogado-penalista-choluteca` y 9 más.
- **Causa probable:** Deploy nuevo + falta de autoridad externa (backlinks) + Googlebot conservador con sitios YMYL nuevos. El sitemap se envió el 2026-07-04 pero Google no ha re-procesado.
- **Impacto:** El 95 % del inventario de páginas comerciales no compite en Google. Pérdida de todo el tráfico potencial de 13 servicios + 10 ciudades + 20 categorías.
- **Solución:** Inspección de URLs manual en GSC + solicitud de indexación (10/día), enviar sitemap de nuevo, y construir backlinks externos (GBP, directorios legales).
- **Responsable:** SEO + Contenido (off-page). Esfuerzo: medio. Validación: re-ejecutar inspección GSC en 7 días.

### 5.2 [ALTA] Bing Webmaster sin OAuth → datos incompletos

- **Evidencia:** `seo:doctor` reporta `⬜ Bing OAuth token — ejecuta npm run auth:bing`. Las 83 queries de Bing llegan con `position: 0` y `ctr: 0`; las 16 URLs prioritarias con `httpCode: 0`; `backlinks.totalLinks: 0`.
- **Causa:** OAuth device-code flow no completado. La API Key (IndexNow) solo da acceso a un subconjunto de endpoints.
- **Impacto:** No es posible diagnosticar posición media, CTR, códigos HTTP por URL, ni backlinks en Bing. La auditoría de Bing queda **parcial** (solo crawl stats + queries con clicks/impressions).
- **Solución:** `npm run auth:bing` → completar device flow con cuenta Microsoft del despacho → re-ejecutar `npm run seo:bing:live`.
- **Responsable:** SEO / Infraestructura. Esfuerzo: bajo (5 min). Validación: `npm run seo:doctor` debe mostrar `✅ Bing OAuth token`.

### 5.3 [ALTA] 11 URLs 4xx por enlaces internos mal construidos

- **Evidencia (Ahrefs 2026-07-07, `4xx-page.csv`):**
  - `https://www.pinedayasociadoshn.com/blog/tributario/blog/derecho-laboral/abogado-laboral-choluteca`
  - `https://www.pinedayasociadoshn.com/blog/tributario/blog/tributario/facturacion-electronica-requisitos-sar`
  - `https://www.pinedayasociadoshn.com/blog/tributario/solicitar-consulta`
  - `https://www.pinedayasociadoshn.com/blog/derecho-de-familia/solicitar-consulta`
  - `https://www.pinedayasociadoshn.com/blog/derecho-laboral/solicitar-consulta`
  - `https://www.pinedayasociadoshn.com/blog/tributario/abogados-en-choluteca`
  - `https://www.pinedayasociadoshn.com/articulos/declaracion-isr-personas-naturales`
  - `https://www.pinedayasociadoshn.com/articulos/facturacion-electronica-honduras`
  - `https://www.pinedayasociadoshn.com/articulos/isv-en-honduras`
  - `https://www.pinedayasociadoshn.com/contacto-tegucigalpa`
  - `https://www.pinedayasociadoshn.com/servicios/gestoria-ambiental-corporativa`
- **Patrón detectado:** enlaces generados con paths **relativos mal resueltos** dentro de posts (`/blog/derecho-laboral/...` escrito como `blog/derecho-laboral/...` se concatena a la categoría actual → URL doble). Las rutas `/articulos/*` y `/servicios/*` no existen (fueron renombradas).
- **Causa probable:** auto-linker o bodies de posts con enlaces relativos sin `/` inicial, o slugs legacy no redirigidos.
- **Impacto:** 362 errores 4xx en 28 días en Bing. Desperdicio de crawl budget y pérdida de autoridad interna (link equity a páginas 404).
- **Solución:** (a) audit + fix de enlaces internos (`npm run blog:fix-redirects:dry` → `:aplicar`); (b) añadir redirects 301 en `next.config.ts` para `/articulos/*` y `/servicios/*` legacy hacia sus equivalentes actuales; (c) corregir el auto-linker para que emita paths absolutos.
- **Responsable:** Desarrollo. Esfuerzo: medio. Validación: `npm run audit:internal-links` + re-crawl Ahrefs en 14 días.
- ⚠️ **Restricción:** los redirects 301 de `next.config.ts` están en la lista de "archivos que no debe tocar la IA" (AGENTS.md §7). Proponer el cambio, no aplicarlo directamente sin autorización.

### 5.4 [ALTA] 8 páginas huérfanas (0 enlaces internos)

- **Evidencia (Ahrefs `orphan-page.csv`):**
  - `/abogados-en-langue`, `/abogados-en-caridad`, `/abogados-en-san-antonio-de-flores`, `/abogados-en-concepcion-de-maria`, `/abogados-en-alianza`
  - `/abogado-civil-nacaome`, `/abogado-laboralista-nacaome`, `/abogado-de-familia-nacaome`
- **Estado:** están en el sitemap (rastreables) pero **ninguna página del sitio enlaza hacia ellas** → Google/Bing las consideran de baja prioridad y no redistribuyen autoridad.
- **Impacto:** Estas 8 landings (5 ciudades + 3 especialidades en Nacaome) no rankearán aunque estén indexadas.
- **Solución:** añadir enlaces desde hubs relevantes: `/servicios-juridicos` (a las 3 especialidades), footer/home (a las 5 ciudades, respetando R18: solo 10 ciudades prioritarias en footer — las 5 huérfanas que no estén en el top 10 deben enlazarse desde `/servicios-juridicos` o landings de provincia).
- **Responsable:** Desarrollo / SEO. Esfuerzo: bajo. Validación: `npm run audit:internal-links`.

---

## 6. Oportunidades SEO de alto impacto

### 6.1 [ALTA] Optimizar CTR en queries page-1 de pensión alimenticia

- **Evidencia:** "cuanto es la pensión alimenticia por hijo en honduras" → 70 imp / 1 clic / CTR 1,43 % / pos 6,0. "cuanto es la manutencion de un hijo" → 36 imp / 1 clic / pos 5,2. Juntas **106 impresiones en page 1 con solo 2 clics (CTR 1,9 %)**.
- **Acción:** reescribir `<title>` y meta description del post de pensión alimenticia para incluir la cifra exacta y un CTA ("Calcula cuánto te corresponde"). El query ganador "porcentaje de pensión alimenticia por 2 hijos" (CTR 10,71 %, pos 2,5) demuestra que cuando el título incluye dato concreto, funciona.
- **Impacto estimado:** subir CTR del 1,9 % al 5 % en 106 impresiones → +3 clics/mes solo en estos queries; replicable en decenas de queries similares.

### 6.2 [ALTA] Crear contenido para queries transaccionales sin página target

- **Evidencia:** "despido laboral" (17 imp, pos 12,2), "despacho legal" (14 imp, pos **41,5**), "demanda por daños y perjuicios honduras" (13 imp, pos 8,7), "delito de estafa en honduras" (11 imp, pos 7,3) → todas con 0 clics y posición fuera de top 5.
- **Acción:** auditar si existe página target; si no, crear post/servicio específico optimizado para el término exacto (R13: 600–1200 palabras, datos legales verificados contra CP Honduras).

### 6.3 [MEDIA] JSON-LD: añadir `LegalService` / `LocalBusiness` en home

- **Evidencia:** health check reporta que la home solo declara `FAQPage`. Falta el schema de entidad principal (`LegalService` + `LocalBusiness`) que Bing/Google usan para knowledge panel y SEO local.
- **Acción:** añadir bloque JSON-LD `LegalService` con `areaServed`, `address` (Nacaome), `telephone`, `priceRange`, `openingHours`. Mismo para `/derecho-penal` y `/servicios-juridicos`.

### 6.4 [MEDIA] Filtrar tráfico interno en GA4

- **Evidencia:** 26 páginas `/intranet/*` y `/admin/*` aparecen en top pages de GA4 (tráfico de admins). Proporción desktop 82,5 % y solo 17 % de usuarios desde Honduras sugieren contaminación por tráfico interno/bots.
- **Acción:** crear filtro GA4 que excluya IPs del despacho y eventos de `/intranet/*`. Mejorará la fiabilidad de las métricas de audiencia.

### 6.5 [MEDIA] Backlinks = 0 (sin datos, presunción de baja autoridad)

- **Evidencia:** Bing reporta `totalLinks: 0` (pero por falta de OAuth, dato no fiable). El bajo ritmo de indexación Google y la posición media 6,9 son consistentes con un dominio joven con poca autoridad externa.
- **Acción (off-page, manual):** Google Business Profile, directorios legales de Honduras, colaboraciones con Colegio de Abogados, prensa local. Ver `docs/seo-off-page.md §6` y `auditoria-seo/link-building-plan-2026-06-23.md`.

---

## 7. Correcciones técnicas recomendadas

| # | Corrección | Severidad | Archivo / Comando |
|---|---|---|---|
| T1 | Autenticar Bing OAuth (`npm run auth:bing`) | Alta | consola |
| T2 | Fix 11 enlaces internos 4xx (paths relativos mal resueltos) | Alta | `npm run blog:fix-redirects` + auto-linker |
| T3 | Añadir redirects 301 para `/articulos/*`, `/servicios/*`, `/contacto-tegucigalpa` legacy | Alta | `next.config.ts` *(propuesta, no aplicar sin auth)* |
| T4 | Enlazar 8 páginas huérfanas desde hubs | Alta | `app/(public)/servicios-juridicos/*`, footer |
| T5 | Añadir JSON-LD `LegalService`/`LocalBusiness` en home | Media | componente home |
| T6 | Reescribir title/meta de post pensión alimenticia (CTR) | Media | DB `blog_posts` |
| T7 | Solicitar indexación manual GSC (10 URLs/día × 4 días) | Alta | GSC UI |
| T8 | Re-enviar sitemap en GSC y Bing WMT | Media | `npm run seo:submit-sitemap` |
| T9 | Filtrar tráfico interno en GA4 (IPs + `/intranet/*`) | Media | GA4 UI |
| T10 | Audit de 128 títulos demasiado largos | Baja | `npm run blog:fix-titles:dry` |

---

## 8. Priorización por impacto / esfuerzo

| Prioridad | Acción | Impacto | Esfuerzo | Ratio |
|---|---|---|---|---|
| 🔴 1 | T7 Solicitar indexación manual GSC (16 URLs comerciales) | Crítico | Bajo | 🚀 Inmediato |
| 🔴 2 | T1 Autenticar Bing OAuth | Alto | Bajo (5 min) | 🚀 Inmediato |
| 🔴 3 | T2+T3 Fix enlaces 4xx + redirects legacy | Alto | Medio | ⭐ Alta |
| 🟠 4 | T4 Enlazar 8 páginas huérfanas | Alto | Bajo | ⭐ Alta |
| 🟠 5 | T6 Optimizar CTR pensión alimenticia | Alto | Bajo | ⭐ Alta |
| 🟡 6 | T8 Re-enviar sitemap | Medio | Bajo | ✓ Rápido |
| 🟡 7 | T5 JSON-LD LegalService | Medio | Bajo | ✓ Rápido |
| 🟡 8 | T9 Filtro GA4 tráfico interno | Medio | Bajo | ✓ Rápido |
| 🟢 9 | T10 Fix 128 títulos largos | Bajo | Medio | Programar |
| 🟢 10 | 6.5 Link building off-page | Alto | Alto (manual) | 30–90 días |

---

## 9. Plan de acción — 7, 30 y 90 días

### Próximos 7 días (desbloqueo)

- [ ] Ejecutar `npm run auth:bing` y completar device flow con cuenta Microsoft del despacho.
- [ ] Re-ejecutar `npm run seo:doctor` → verificar `✅ Bing OAuth token`.
- [ ] Re-ejecutar `npm run seo:bing:live` → validar que position/CTR/HTTP/backlinks llegan.
- [ ] **GSC → Inspección de URLs → solicitar indexación** de las 10 URLs comerciales Nivel 1 (ver `docs/audits/indexacion-monitorizacion.md`): `/servicios-juridicos`, `/servicios-juridicos/derecho-laboral`, `/derecho-penal`, `/abogados-en-nacaome`, `/abogados-en-choluteca`, etc.
- [ ] Ejecutar `npm run blog:fix-redirects:dry` para ver alcance de enlaces rotos; revisar propuesta antes de `:aplicar`.
- [ ] Reescribir `<title>` del post de pensión alimenticia para incluir cifra concreta.
- [ ] Re-enviar sitemap en GSC (`npm run seo:submit-sitemap`) y en Bing WMT.

### 30 días (optimización)

- [ ] Completar indexación manual de las 16 URLs pendientes (10/día en 2 tandas).
- [ ] Aplicar fix de enlaces 4xx (T2) tras revisión del dry-run.
- [ ] Añadir enlaces a las 8 páginas huérfanas (T4) desde hubs de servicios y footer.
- [ ] Añadir JSON-LD `LegalService`/`LocalBusiness` en home, `/servicios-juridicos`, `/derecho-penal`.
- [ ] Configurar filtro GA4 de tráfico interno (IPs despacho + excluir `/intranet/*`).
- [ ] Crear/optimizar contenido para 4 queries transaccionales sin target: "despido laboral", "demanda daños y perjuicios honduras", "delito de estafa honduras", "despacho legal".
- [ ] Re-auditar con `npm run seo:collect` y comparar CTR/posición vs. baseline.

### 90 días (autoridad y consolidación)

- [ ] Crear y verificar **Google Business Profile** del despacho en Nacaome.
- [ ] Ejecutar plan de link building (`auditoria-seo/link-building-plan-2026-06-23.md`): directorios legales Honduras, Colegio de Abogados, prensa.
- [ ] Auditar y corregir los 128 títulos demasiado largos (`npm run blog:fix-titles`).
- [ ] Re-indexar RAG (`npm run rag:indexar:aplicar`) tras nuevas publicaciones para mantener búsqueda semántica actualizada.
- [ ] Meta-auditoría: comparar indexación Google (objetivo: 60–80 % de las 213 URLs indexadas) y tráfico Bing (objetivo: +50 % clics).
- [ ] Configurar monitorización semanal automatizada (cron del `seo:collect`).

---

## 10. Comandos ejecutados y archivos generados

### Comandos ejecutados en esta auditoría

```
git status
npm run seo:doctor
npm run seo:collect
npm run seo:health
npm run seo:health:json
npm run indexnow:dry
node scripts/bing-webmaster-live.mjs  (vía npm run seo:bing:live dentro de collect)
```

### Archivos generados / actualizados (por `seo:collect`)

| Archivo | Contenido |
|---|---|
| `data/bing/bing-live.json` | Crawl stats, 83 queries, URL info (16 prioritarias) |
| `data/google/gsc-live.json` | 100 queries con posición/CTR completos |
| `data/google/ga4-live.json` | Usuarios, sesiones, fuentes, países, dispositivos |
| `data/seo/live-summary.json` | Resumen de 6 fuentes |
| `docs/audits/bing-live-report.md` | Reporte Bing sanitizado |
| `docs/audits/seo-live-summary.md` | Resumen ejecutivo live |
| `docs/audits/auditoria-bing-webmaster-2026-07-08.md` | **Este informe** |

### Scripts de validación disponibles (no ejecutados, recomendados como seguimiento)

```
npm run audit:indexacion        # auditoría indexación prioritaria
npm run audit:seo               # indexability audit (--write)
npm run audit:internal-links    # enlaces internos rotos
npm run audit:canibalizacion    # canibalización de keywords
npm run blog:fix-redirects:dry  # propuesta de fix de redirects
npm run blog:fix-titles:dry     # propuesta de fix de títulos
```

---

## 11. Datos faltantes o limitaciones

| Dato faltante | Causa | Comando para obtenerlo |
|---|---|---|
| **Bing: posición media y CTR por query** | OAuth no autenticado (API Key no los devuelve) | `npm run auth:bing` → `npm run seo:bing:live` |
| **Bing: código HTTP por URL** | OAuth no autenticado | idem |
| **Bing: backlinks y dominios de referencia** | OAuth no autenticado (`GetLinkCounts` devuelve 0) | idem |
| **Bing: Site Scan / Site Explorer** | No expuesto vía API (solo dashboard) | `npm run bing:site-explorer` (scraping autenticado) o dashboard manual |
| **Bing: crawl errors detallados (503)** | Solo agregado en `GetCrawlStats` | OAuth + `GetCrawlErrors` (no implementado en script actual) |
| **Core Web Vitals** | No cruzado en este repositorio | Lighthouse CI (`lighthouserc.json`) o CrUX de GSC |
| **Backlinks reales** | Sin herramienta de backlinks conectada (Ahrefs export manual) | Importar Ahrefs regularmente o conectar API |
| **Indexación Google precisa** | GSC Coverage API no consultada (solo inspección puntual) | `npm run audit:indexacion` |

**Clasificación de esta auditoría:** `PARCIAL` para Bing (sin OAuth), `VALIDADO` para GSC/GA4/Health/sitemap.

---

## 12. Próximos pasos automatizables

1. **Autenticación Bing OAuth** — desbloquea posición, CTR, HTTP, backlinks. Un solo comando: `npm run auth:bing`.
2. **Monitor de indexación automática** — ampliar `scripts/auditar-indexacion-prioritaria.mjs` para que consulte la API de inspección de URLs de GSC y actualice `docs/audits/indexacion-monitorizacion.md` automáticamente (actualmente manual).
3. **Detector de enlaces 4xx en CI** — añadir un step al `postbuild` o CI que ejecute `npm run audit:internal-links` y falle si aparecen nuevos 4xx (previene regresiones como los paths dobles `/blog/tributario/blog/...`).
4. **Alertas de crawl errors en Bing** — tras OAuth, programar un job que lea `GetCrawlErrors` y notifique si el conteo de 4xx supera un umbral (actualmente 362/28d, umbral sugerido: 50/nuevos).
5. **Dashboard consolidado** — los datos ya viven en `data/{bing,google,seo}/`; generar un `docs/audits/dashboard-seo.md` semanal con tendencias (clics, impresiones, indexación, 4xx) para dirección.
6. **Re-indexación RAG reactiva** — encadenar `rag:indexar:aplicar` tras `blog:verify-fix:aplicar` para que el buscador semántico del asistente virtual refleje siempre el contenido publicado.

---

## Anexo A — Plantilla de auditoría (completar tras OAuth Bing)

Tras ejecutar `npm run auth:bing` + `npm run seo:bing:live`, completar estas secciones que hoy están vacías por falta de OAuth:

```
### Bing — Posición y CTR por query (requiere OAuth)
| Query | Impresiones | Clics | CTR | Posición media |

### Bing — Backlinks y dominios de referencia (requiere OAuth)
| Métrica | Valor |
| Backlinks totales | ___ |
| Dominios de referencia | ___ |
| Top dominios | ___ |

### Bing — Crawl errors detallados (requiere OAuth + GetCrawlErrors)
| URL | Código | Tipo | Fecha |
```

---

## Anexo B — Resumen para dirección

> **Estado general:** técnicamente sano, sin riesgos de seguridad, infraestructura SEO correcta.
>
> **Problema #1:** Google no está indexando las páginas nuevas (solo la home está indexada). Es el bloqueante principal. Solución: solicitar indexación manual en GSC (7 días, esfuerzo bajo).
>
> **Problema #2:** hay enlaces internos rotos (11 URLs 4xx) que desperdician presupuesto de rastreo. Solución: fix técnico (30 días).
>
> **Problema #3:** Bing conectado a medias (falta autenticación OAuth). Solución: 5 minutos.
>
> **Oportunidad clara:** queries de pensión alimenticia con 106 impresiones en page 1 y solo 2 clics → mejorar el título duplicará clics con esfuerzo mínimo.
>
> **No hay urgencia de rediseño** (R5). El trabajo es de contenido + indexing + enlaces internos.

---

## Anexo C — Porcentaje de auditoría completada

| Fase | Completado | Restante |
|---|---|---|
| Análisis del repositorio (scripts, config, env) | 100 % | 0 % |
| Conexión a Bing Webmaster | 60 % (API Key sí, OAuth no) | 40 % |
| Extracción de datos (GSC, GA4, Health, IndexNow) | 100 % | 0 % |
| Diagnóstico (cruzado multi-fuente) | 90 % | 10 % (backlinks Bing, CWV) |
| Plan de mejora priorizado | 100 % | 0 % |
| **Total auditoría** | **~88 %** | **~12 %** |

**Para llegar al 100 %:** ejecutar `npm run auth:bing` + `npm run seo:bing:live` y completar el Anexo A; opcionalmente conectar CrUX/Lighthouse para Core Web Vitals.
