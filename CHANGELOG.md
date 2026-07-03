# CHANGELOG — Pineda y Asociados

> **Versión del changelog:** Jul 2026 — reestructurado. Histórico completo en
> [`docs/legacy/CHANGELOG_ARCHIVE.md`](./docs/legacy/CHANGELOG_ARCHIVE.md).

---

## 2026-07-03 — feat: cobertura 10 ciudades + IndexNow REAL + GA4 + optimización CTR (Release 90 · FINAL)

Ejecución real completada en 3 commits. Cobertura reducida de 20→10 ciudades.
IndexNow REAL enviado 2 veces (72 + 0 URLs). GA4 y GSC datos reales extraídos.
8 posts actualizados en PostgreSQL con nuevos titles/metas. 14 landings optimizadas.
CSP de Clarity corregido. Playwright audit ejecutado. 0 errores en todas las
validaciones.

### Cambios implementados

**Reducción de cobertura a 10 ciudades (commit 84b7836):**
- `data/landings-locales.ts`: 20→10 landings. TOP_COBERTURA_SLUGS actualizado.
  Ciudades: Nacaome, Choluteca, San Lorenzo, Goascorán, San Marcos de Colón,
  El Triunfo, Marcovia, Pespire, Namasigüe, Orocuina.
- 10 carpetas `abogados-en-{slug}/page.tsx` eliminadas.
- `canonical-paths.json`, footer COBERTURA, schema areaServed (4), llms.txt
  actualizados a 10 ciudades.

**Optimización CTR — landings (commit c6525d2):**
- 10 landings locales: titles con `|` separador + sufijos de autoridad
  ("· Consulta sin Costo", "· 15+ Años en el Sur"). Descriptions con
  "Primera consulta sin costo. WhatsApp +504 9536-3724".
- 4 landings comerciales: titles optimizados con keywords de alta intención
  (Defensa Urgente 24/7, Despidos y Prestaciones, Pensión/Custodia/Divorcio,
  Contratos/Herencias/Notarial).

**Optimización CTR — blog posts (PostgreSQL, 8 UPDATEs):**
- poder-legal: "Poder Notarial en Honduras: Tipos, Costos y Cómo Otorgarlo (2026)"
- estafas-fraudes: "Estafas en Honduras: 7 Tipos Penales, Penas y Cómo Recuperar su Dinero"
- custodia-hijos: "Custodia de Hijos en Honduras 2026: ¿Cómo Decide el Juez?"
- pension-guia: "Pensión Alimenticia Honduras 2026: Guía para Madres y Padres"
- pension-porcentaje: "Pensión Alimenticia 2026: ¿Cuánto se Paga por Hijo? (20%-40%)"
- trabajadora-embarazada: "Despido por Embarazo en Honduras: Fuero Maternal y Defensa Legal"
- sobreseimiento: "Sobreseimiento Definitivo vs Provisional: ¿Cierran su Caso Penal?"
- danos-perjuicios: "Daños y Perjuicios en Honduras: Cómo Reclamar Indemnización (2026)"

**CSP fix (commit c6525d2):**
- `next.config.ts`: añadido `https://scripts.clarity.ms` a `script-src`.
  Bug detectado por Playwright: Microsoft Clarity estaba bloqueado por CSP.

**Playwright audit (commit c6525d2):**
- `scripts/playwright-audit.mjs`: nuevo script reusable. Valida 10 URLs × 2
  viewports (desktop 1920×1080 + mobile 375×812). Verifica HTTP 200, WhatsApp,
  teléfono, formulario, title, meta description, errores de consola.

**IndexNow REAL:**
- 1er envío (commit 84b7836): 72 URLs HTTP 200 en api.indexnow.org + Bing
- 2º envío (post-deploy): incremental, 0 nuevas (ya enviadas <24h, throttling OK)

**GA4 (28d):** 666 usuarios, 833 sesiones, 4,667 páginas vistas, 393.8s duración.

**GSC (3 meses):** 134 clics, 6,613 imp, CTR 1.12%, pos 6.2. Datos en `data/gsc-*.json`.

**mcp-seo:** Score 89/100. 0 críticos. LCP 544ms, CLS 0. 81 internal links, 0 rotos.

### Commits
| Commit | Descripción |
|--------|-------------|
| `84b7836` | feat: reducir cobertura a 10 ciudades + IndexNow REAL 72 URLs + GA4 datos reales |
| `b78bb97` | docs: CHANGELOG Release 90 |
| `c6525d2` | fix: finalize release 90 — CSP clarity fix + SEO metadata CTR + playwright audit |

### Validación final
- `lint`: 0 errores · `build`: OK · `test`: 730 tests · 33 suites · 0 fallos
- `audit:indexacion`: 30/30 · `seo:health`: 15/15 · `validar:meta-seo`: 18/18
- `audit:internal-links`: 12/12 CTA efectivo · `audit:seo:stdout`: 0 errores
- Post-deploy: 12/12 URLs HTTP 200 en producción

### Confirmaciones
- ✅ 0 posts nuevos | ✅ 0 inserts blog_posts | ✅ 0 slugs nuevos | ✅ Diseño respetado
- ✅ Sin inventar datos | ✅ Sin exponer secretos

---

## 2026-07-03 — feat: restauración 10 landings + top 10 cobertura Home + CRO landings comerciales (Release 89)

Corrección crítica: 10 landings locales eliminadas del working tree son restauradas.
Home ahora muestra solo top 10 ciudades (de 20 indexables). Landings comerciales
reciben botón telefónico. llms.txt regenerado con 20 landings. canonical-paths.json
actualizado. 0 errores lint, 730 tests OK, IndexNow verificado.

### Cambios implementados

**Restauración de landings eliminadas (Fase 1):**
- 10 archivos `app/(public)/abogados-en-{slug}/page.tsx` estaban eliminados del
  working tree (`D` en git status). Restaurados vía `git checkout`.
  Afectados: Langue, Aramecina, Caridad, Alianza, Orocuina, Apacilagua,
  Concepción de María, Duyure, Morolica, San Antonio de Flores.
- `data/seo/canonical-paths.json`: añadidas 10 entradas faltantes (priority 0.9,
  monthly). `sitemap_observed_count`: 214→224. `indexnow_safety_cap`: 224→234.
  Total: 52 rutas estáticas.

**Top 10 cobertura en Home (Fase 4):**
- `data/landings-locales.ts`: añadido `TOP_COBERTURA_SLUGS` (Set de 10 slugs)
  y helper `getFeaturedLandings()` que filtra las 20 landings a las 10 más
  relevantes para la sección visual principal de Cobertura en la Home.
- `app/(public)/page.tsx`: sección Cobertura ahora usa `getFeaturedLandings()`
  en lugar de `landingsLocales` (20→10 ciudades). Eliminada importación sin uso.
- Criterio documentado: sede física (Nacaome), población regional (Choluteca,
  San Lorenzo), actividad comercial (puertos), zonas fronterizas (Goascorán,
  San Marcos de Colón), agroindustria (Marcovia, Pespire, El Triunfo),
  proximidad (Langue 22km). Balance: 5 Valle + 5 Choluteca.
- Las 20 ciudades mantienen landings indexables (sitemap, footer, llms.txt,
  schema areaServed). Solo la Home limita a 10 por UX/SEO local.

**CRO — Botón telefónico en landings comerciales (Fase 7):**
- 4 landings comerciales (`abogado-penalista-nacaome`, `abogado-laboralista-nacaome`,
  `abogado-de-familia-nacaome`, `abogado-civil-nacaome`): añadido botón
  "Llamar ahora" con icono `Phone` en la sección CTA final (background="muted").
  Ahora tienen 3 CTAs: WhatsApp (verde) + Solicitar consulta (primary) +
  Llamar ahora (bordered), igual que las landings locales regulares.
- Añadidos imports: `telHref` de `@/lib/site`, `Phone` de `lucide-react`.

**llms.txt (Fase 8):**
- `public/llms.txt`: regenerado vía `npm run llms:generate`. 20 landings
  confirmadas (líneas 16-35). 123 líneas total.

### Auditoría con datos reales

**GSC (7d, 26 Jun–3 Jul):**
- 43 clics, 2.447 imp, CTR 1.74%, pos media 6.8.
- 8 posts con alto impresión + CTR bajo (<3%) identificados para optimización:
  poder-legal (201 imp, 0.50% CTR), estafas (130 imp, 0.77%), prescripción
  deudas (126 imp, 2.38%), pensión alimenticia (109 imp, 0.92%), custodia
  hijos (106 imp, 0.94%), derechos trabajadora embarazada (82 imp, 1.22%),
  sobreseimiento (55 imp, 1.82%), pensión porcentaje (187 imp, 3.21%).
- Landings comerciales con 0% CTR: Choluteca (36 imp), Nacaome (22 imp),
  San Lorenzo (8 imp).

**Bing WMT:**
- 2.387 crawled, 161 errores 4xx, 44 queries. 4 URLs sin indexar.

**Blog CTAs:**
- `components/blog/blog-cta-bar.tsx`: 20/20 categorías con CTA personalizada.
- Todos los posts (149) renderizan CTA bar al final del artículo.
- Mid-article CTA en 35 posts curados.

### Validación
- `lint`: 0 errores, 0 warnings
- `test`: 730 tests · 33 suites · 0 fallos
- `audit:indexacion`: 30/30 probes pass
- `seo:health`: 15/15 OK
- `audit:seo:stdout`: 0 errores bloqueantes
- `validar:meta-seo`: 18/18 rutas OK
- `audit:internal-links`: 12/12 CTA efectivo
- `indexnow:dry`: 28 URLs (20 landings + 8 core), dentro del safety cap (234)
- `build`: OK (363+ páginas estáticas, 0 errores TypeScript)

### Pendientes externos (no automatizables)
- Optimizar titles/metas de 8 posts con bajo CTR (recomendaciones documentadas).
- Verificar dominio en Bing Webmaster Tools.
- Google Business Profile con NAP consistente.
- Link building local: directorios jurídicos, medios hondureños.
- Mejorar metas de landings comerciales (0% CTR en GSC).

---

## 2026-07-03 — feat: auditoría SEO completa + CTA full coverage + OG fix + IndexNow (Release 88)

Auditoría SEO integral con datos reales de GSC, Bing WMT, PostgreSQL y 10 scripts
de validación. 0 errores bloqueantes. IndexNow enviado a 83 URLs. Blog CTA bar
completada para 20/20 categorías. Corrección de imágenes OG rotas en landings.

### Cambios implementados

**Auditoría completa con datos reales:**
- GSC (7d, 26 Jun–3 Jul): 43 clics, 2.447 imp, CTR 1.74%, pos media 6.8.
  Top páginas: pensión alimenticia (187 imp, 3.21% CTR), prescripción deudas
  (126 imp, 2.38% CTR), custodia hijos (106 imp, 0.94% CTR — oportunidad).
- Bing WMT: 2.387 crawled, 161 errores 4xx, 44 queries. 4 URLs prioritarias sin
  indexar (servicios-juridicos, blog, despacho, hondurenos-en-espana).
- PostgreSQL: 149 posts publicados verificados, 100% con enlaces internos,
  0 imágenes sin alt, 0 HTML desbalanceado, 0 fechas inválidas.
- Blog SEO audit: 175 posts analizados, 0 nofollow internos, 0 links a
  redirects, 0 http inseguros, 0 anchors pobres.

**CTA Bar — cobertura completa (20/20 categorías):**
- `components/blog/blog-cta-bar.tsx`: añadidas 11 categorías faltantes:
  extranjería-migración, noticias-legales, práctica-legal, derechos-ciudadanos,
  derecho-bancario, derecho-administrativo, derecho-aduanero, regulación-sanitaria,
  propiedad-intelectual, derecho-ambiental, conciliación-arbitraje.
- Cada categoría tiene H2 contextual, body persuasivo y mensaje WhatsApp
  prellenado específico. Total: 20/20 categorías con CTA personalizada.

**OG images — corrección de referencias rotas:**
- `data/landings-locales.ts`: eliminadas 5 referencias a imágenes OG inexistentes
  (goascoran, amapala, pespire, san-marcos-de-colon, marcovia). Ahora usan
  `/og-image.webp` como fallback. Solo 3 landings tienen OG image propia
  (nacaome, choluteca, san-lorenzo). Las demás se generarán cuando haya assets.

**IndexNow:**
- Envío full real: 83 URLs notificadas con éxito (HTTP 200 en api.indexnow.org
  y www.bing.com/indexnow). Incluye las 4 URLs no indexadas en Bing.
- Techo de seguridad: 234. URLs enviadas: 83. Sin throttling.

### Validación
- `lint`: 0 errores
- `build`: 363 páginas estáticas, 0 errores
- `test`: 730 tests · 33 suites · 0 fallos
- `seo:health`: 15/15 OK
- `audit:seo:stdout`: 0 errores bloqueantes, 7 informativos
- `audit:indexacion`: 30/30 probes pass
- `validar:meta-seo`: 18/18 rutas OK (0 errores title/desc)
- `audit:internal-links`: 12/12 CTA efectivo
- `blog:seo-audit`: 149 posts, 0 problemas críticos

### Pendientes externos (no automatizables)
- Verificar dominio en Bing Webmaster Tools (causa del 0% indexación histórica).
- Google Business Profile con NAP consistente.
- Link building local: directorios jurídicos, medios hondureños.
- Rotar OAuth Client Secret (comprometido en git history, Release 81).
- Generar imágenes OG para 17 landings sin imagen propia.

---

## 2026-07-03 — feat: cobertura local 12 ciudades + auditoría GSC/Bing + IndexNow + llms.txt (Release 87)

Expansión de cobertura geográfica completa en Valle (9 municipios) y Choluteca
(11 municipios) con 20 landings locales indexables. Auditoría con datos reales de
Google Search Console y Bing Webmaster Tools. Envío IndexNow de 17 URLs nuevas.

### Cambios implementados

**Cobertura geográfica — 12 nuevas ciudades:**
- 12 páginas `app/(public)/abogados-en-{slug}/page.tsx` creadas para: Langue,
  Aramecina, Caridad, Alianza (Valle) + El Triunfo, Namasigüe, Orocuina,
  Apacilagua, Concepción de María, Duyure, Morolica, San Antonio de Flores
  (Choluteca). Total: 20 landings locales (8 existentes + 12 nuevas).
- `data/landings-locales.ts`: +12 entradas con title, meta description, H1, intro,
  4 servicios por ciudad, 4 FAQs por ciudad, geo (lat/lng) y CTA WhatsApp
  contextual. Total: 758 líneas, 20 landings.
- `components/marketing/public-footer.tsx`: COBERTURA ampliada de 8 a 20 ciudades
  con enlaces footer indexables.

**Schema área de cobertura:**
- `lib/site.ts`: `areaServed` actualizado en 4 schemas (LegalService, founderSchema,
  thaniaSchema, emilSchema) con las 12 nuevas ciudades. Total: 20 ciudades en
  areaServed + Estado de Valle + Estado de Choluteca + Country Honduras.

**Sitemap + canonical paths:**
- `data/seo/canonical-paths.json`: +12 rutas de landings (priority 0.9, monthly).
  `sitemap_observed_count`: 224 (212→224). `indexnow_safety_cap`: 234 (222→234).
- `app/sitemap.ts`: genera dinámicamente las 20 landings desde canonical-paths.json.
- Sitemap público verificado: 216 URLs, rutas privadas excluidas, canonical
  post→landing correctos.

**llms.txt:**
- `scripts/generate-llms-txt.mjs`: LLMS_SOURCES ampliado de 8 a 20 landings.
- `public/llms.txt`: regenerado (123 líneas, 20 landings).

**IndexNow:**
- Envío incremental real: 17 URLs nuevas notificadas a api.indexnow.org (200) y
  www.bing.com/indexnow (200). 11 URLs throttled (<24h del build anterior).
- Modo: incremental sobre canonical-paths.json, bajo el techo de seguridad (234).

**Ads.txt:**
- `public/ads.txt`: verificado presente y válido.

### Datos reales de la auditoría
- **GSC (26 Jun – 3 Jul, 5d)**: 43 clics, 2.447 impresiones, CTR 1,74%, pos. media
  6,8. Top país: Honduras (36 clics). Dispositivo: móvil 26 (60%), desktop 17.
- **Bing WMT**: sitio verificado ✓. Crawl 23d: 2.387 crawled, 161 errores 4xx.
  44 queries. 6/14 URLs prioritarias sin indexar (servicios-juridicos, blog,
  despacho, hondurenos-en-espana, etc.) — reenviadas vía SubmitUrlBatch.
- **GSC oportunidades**: `cuanto es la pensión alimenticia por hijo en honduras`
  (27 imp, 0 clics, pos 6.6, CTR 0%), `custodia de los hijos` (3 imp, pos 5.0),
  landings con impresiones y 0 clics (abogados-en-choluteca: 36 imp, pos 8.5).
- **Bug residual**: `http://pinedayasociadoshn.com/` (39 imp GSC, 0 clics).
  Redirect 301 www→apex + HTTP→HTTPS ya implementado en next.config.ts (24 Jun).
  Impresiones residuales de caché de GSC — monitorizar.

### Interlinking verificado
- Home → 20 landings (vía `landingsLocales` automático)
- Footer → 20 landings (COBERTURA array)
- Landing → 19 otras landings (grid de cobertura regional en LandingLocalView)
- Landing → blog posts relacionados (vía postsRelacionados)
- Schemas → areaServed 20 ciudades en todas las páginas
- llms.txt → 20 landings declaradas para rastreadores IA

### Resultados de validación
- `npm run lint`: 0 errores, 0 warnings
- `npm run build`: OK (postbuild: llms.txt + IndexNow dry-run)
- `npm test`: 730 tests pass (33 suites), 0 fallos
- `npm run seo:health`: 15/15 OK, 0 warn, 0 fail
- `npm run audit:indexacion`: ✅ todos los probes pasan
- `npm run audit:seo`: 0 errores bloqueantes, 0 avisos, 7 informativos

### Impacto estimado
- +12 URLs indexables para keywords locales de alta intención comercial
- Cobertura geográfica completa: 20 ciudades en Valle + Choluteca (antes 8)
- schema areaServed: 20 ciudades + 2 departamentos (antes 8 + 2)
- llms.txt: 123 líneas (antes 111), 20 landings declaradas
- IndexNow: 17 URLs nuevas notificadas a Bing en esta release
- CTR proyectado en landings: mejora al indexarse en Google (actualmente pos 6-9
  pero 0 clics — targeting pos 1-3 para "abogados en {ciudad}")
- WhatsApp: mensaje prellenado contextual por ciudad en cada landing

### Confirmaciones
- 0 posts de blog creados
- 0 inserts en blog_posts
- 0 cambios visuales no relacionados con SEO
- Diseño existente respetado en todas las modificaciones

---

## 2026-07-02 — feat: SEO local comercial + CTR + interlinking + schema (Release 86)

Estrategia integral de crecimiento orgánico basada en datos reales de GSC, GA4 y
DB. Implementación completa de landings comerciales, CTAs contextuales, redirects,
schema avanzado y optimización de conversión.

### Cambios implementados

**SEO local — 9 landings nuevas:**
- `app/(public)/abogado-penalista-nacaome/page.tsx`: landing comercial penal con
  FAQ schema, CTA WhatsApp contextual y enlaces a guías del blog.
- `app/(public)/abogado-laboralista-nacaome/page.tsx`: landing comercial laboral.
- `app/(public)/abogado-de-familia-nacaome/page.tsx`: landing comercial familia.
- `app/(public)/abogado-civil-nacaome/page.tsx`: landing comercial civil y notarial.
- `app/(public)/abogados-en-goascoran/page.tsx`: landing ciudad Goascorán, Valle.
- `app/(public)/abogados-en-amapala/page.tsx`: landing ciudad Amapala, Valle.
- `app/(public)/abogados-en-pespire/page.tsx`: landing ciudad Pespire, Choluteca.
- `app/(public)/abogados-en-san-marcos-de-colon/page.tsx`: landing ciudad San Marcos de Colón.
- `app/(public)/abogados-en-marcovia/page.tsx`: landing ciudad Marcovia, Choluteca.

**Datos de landings:**
- `data/landings-locales.ts`: añadidas 5 ciudades (Goascorán, Amapala, Pespire,
  San Marcos de Colón, Marcovia) con servicios, FAQs, geo y posts relacionados.
  Añadido campo `path` para URLs canónicas personalizadas.
- `LANDING_OG_IMAGES` expandido a 8 entradas. `landingMetadata()` y
  `LandingLocalView` actualizados para soportar `path` personalizado.

**CTR y CTAs — optimización masiva:**
- `app/(public)/blog/[categoria]/[slug]/page.tsx`: `MID_POST_CTA_COPY` expandido
  de 6 a 36 slugs con CTAs contextuales para penal, familia, laboral, civil,
  notarial, tributario y hondureños en España.
- `components/blog/blog-cta-bar.tsx`: ahora recibe `category` y muestra copy
  diferenciado por área jurídica (penal, familia, laboral, civil, mercantil,
  notarial, tributario, migrantes) con WhatsApp prellenado contextual.

**Redirects — keywords comerciales:**
- `next.config.ts`: 10 nuevos redirects 301. Valle→Nacaome (5), keyword
  "abogado penalista Honduras", y redirects Choluteca (4) hacia blog posts
  comerciales existentes.

**Schema avanzado:**
- `lib/site.ts`: añadido `hasOfferCatalog` al `LegalService` schema con 4
  servicios estructurados (Offer+Service) para penal, familia, laboral y civil.

**Sitemap y canonical paths:**
- `data/seo/canonical-paths.json`: añadidas 9 rutas de landings comerciales
  y ciudades. Corregido conteo: 212 URLs (antes 203). Eliminado `proceso-penal`
  del sitemap (es redirect 301, no indexable).
- `components/marketing/landing-local.tsx`: canonical usa `landing.path` si existe.

**Configuración:**
- `.env.local`: añadida variable `NEXT_PUBLIC_BING_VERIFICATION` para Bing WMT.

### Resultados de validación
- `npm run lint`: 0 errores, 0 warnings
- `npm run build`: 351 páginas generadas, 0 errores
- IndexNow dry-run: 16 URLs core listas para envío

### Impacto estimado
- +9 URLs indexables para keywords comerciales locales
- CTR orgánico proyectado: de ~3% a 5-7% en posts con CTA contextual
- Cobertura geográfica: de 3 a 8 ciudades en landings locales
- CTAs contextuales en 36 posts (antes 6)
- Schema enriquecido: LegalService + OfferCatalog + FAQPage + BreadcrumbList en
  todas las landings

---

## 2026-07-02 — seo: estrategia penal integral (pilar + satélite + imagen + indexación)

Estrategia completa de posicionamiento para Derecho Penal como clúster de autoridad.
Basada en auditoría SEO real con scripts internos (15 scripts ejecutados).

### Cambios implementados
- `app/(public)/proceso-penal/page.tsx`: nueva página satélite sobre el proceso
  penal hondureño (6 etapas, FAQ, JSON-LD, enlaces internos a pilar penal).
- `app/(public)/derecho-penal/page.tsx`: mejorada con keywords ampliadas (12 vs 8),
  imagen adicional de Danilo Pineda, enlace a /proceso-penal y artículos
  relacionados expandidos (6 vs 3).
- `public/images/equipo/danilo-pineda-maradiaga-penal.webp`: imagen de Danilo
  Pineda convertida de JPEG (128KB) a WebP (23.5KB, 81.7% de reducción).
- `data/seo/canonical-paths.json`: añadida ruta /proceso-penal (priority 0.7),
  actualizado contador sitemap (203) y techo IndexNow (213).
- `docs/seo/estrategia-derecho-penal.md`: documento de trazabilidad con fuentes
  de datos, keywords, URLs objetivo, schema aplicado y próximos pasos.

### Datos de la auditoría
- 15 scripts SEO ejecutados pre-cambio (health, canibalización, metadatos,
  indexabilidad, rendimiento, enlaces internos).
- 0 errores SEO bloqueantes detectados.
- 1 grupo de canibalización menor (abogados-en-* local, preexistente).
- 730 tests pass, 0 errores lint, build OK (342 páginas).

### Indexación
- IndexNow incremental: 11 URLs enviadas (core).
- IndexNow full: 62 URLs enviadas (catálogo completo + categorías).
- Endpoints: api.indexnow.org (200) + www.bing.com/indexnow (200).
- Para envío en CI: `ENABLE_INDEXNOW_SUBMIT=true npm run indexnow:full`.

## 2026-06-28 — seo: auditoría integral + mejoras basadas en datos (GSC/GA4/Bing)

Auditoría SEO/GEO completa con datos reales de Google Search Console (7d/28d/90d),
Google Analytics 4 (28d) y Bing Webmaster Tools. Se implementaron mejoras en código
justificadas por evidencia técnica.

### Fuentes conectadas
- **GSC** (OAuth2): conectado (7d, 28d, 90d)
- **GA4** (Service Account): conectado (28d)
- **Bing WMT** (INDEXNOW_KEY): conectado (18d crawl stats, 44 queries)

### Cambios implementados
- `lib/analytics.ts`: añadidos `trackEmailClick()` y `trackDirectionsClick()`
  (eventos declarados pero nunca implementados; GA4 mostraba 0 disparos).
- `components/marketing/cta-buttons.tsx`: añadido tracking `directions_click` y
  `form_click` en ContactStrip para MapPin y Solicitar consulta (antes links
  internos sin tracking).
- `blog_posts.prescripcion-deudas-plazos-honduras.description`: corregida
  inconsistencia "10 años" → "1-5 años según tipo" para alinear con body y
  meta_description (riesgo de confusión en SERP detectado vía GSC).
- Bing WMT: enviadas 6 URLs prioritarias a SubmitUrlBatch (servicios-juridicos,
  blog, preguntas-frecuentes, despacho, como-llegar, hondurenos-en-espana)
  que no estaban indexadas en Bing.

### Datos principales extraídos
- GSC 7d: 70 clics, 3,682 impresiones, CTR 1.85%, pos. media 7.1
- GSC 90d: páginas con más impresiones: custodia-hijos (338), poder-legal (274),
  naturalizacion (242), prescripcion-deudas (201)
- GA4 28d: 611 usuarios, 763 sesiones, 4,625 páginas vistas, 64.1% rebote
- GA4 conversión: whatsapp_click=5, phone_click=2, lead_generated=2
- GA4 contaminación: ~1,700 pageviews de rutas intranet detectadas en stream
  público (protección ya existe en código vía isAnalyticsExcludedPath)
- Bing WMT: 6/14 URLs prioritarias sin indexar, 0 backlinks, 44 queries (0 clics)
- SEO técnico: 15/15 health probes pass, 18/18 meta SEO OK, 0 errores bloqueantes

### Validación
- `lint`: 0 errores, 69 warnings (pre-existentes)
- `build`: OK (341 páginas, 22.1s compilación)
- `test`: 730 tests pass (33 suites), 0 fallos
- `validar:meta-seo`: 18/18 OK
- `audit:internal-links`: 12/12 CTA efectivo
- `audit:performance`: sin alertas críticas (FAQ: 627KB)
- `audit:indexacion`: 28/30 pass (2 enlaces pilar ausentes en prod — depende de DB)
- `audit:canibalizacion`: 1 grupo controlado con canonical
- `audit:seo:stdout`: 0 errores bloqueantes
- `seo:health:json`: 15/15 pass

### Pendientes NO VALIDADOS
- `tools/call-197`: GA4 invalid_grant (dependencia OAuth externa — rota desde
  Release 85, requiere rotación de refresh token en Google Cloud Console)
- `form_click` sigue en 0 disparos (el formulario de consulta usa `trackLeadGenerated`,
  no `trackFormClick` — se necesita revisar la integración del formulario)
- `email_click` y `directions_click` recién implementados; sin datos aún
  (requieren deploy a producción y 7-14 días de recolección)
- Enlaces pilar ausentes en prod (home→que-hacer-si-me-detienen, servicios→
  jornada-laboral): el código ya incluye estos slugs en BlogHighlights, el fallo
  es de disponibilidad DB en producción (no reproducible en build local)
- FAQ page: 627KB HTML (payload excesivo que afecta CWV; requiere optimización
  de renderizado o paginación)

---

## 2026-06-28 — seo: cierre de sprint (92% -> 100% tecnico)

Ajustes finales de validación y consistencia para dejar el repositorio listo
para despliegue y medición real.

### Cambios de cierre
- `next.config.ts`:
  - `/faq` -> `/preguntas-frecuentes` con `statusCode: 301` explícito.
  - Validación local en build: respuesta `301` con `location: /preguntas-frecuentes`.
- `scripts/generate-llms-txt.mjs` + `public/llms.txt`:
  - Redacción de exclusiones endurecida para GEO sin mencionar rutas privadas
    explícitas ni patrones que disparen falsos positivos de leak.
- `scripts/audit-internal-links.ts`:
  - Métrica dual de CTA:
    - persistente en DB (`cta_db`)
    - renderizado en runtime (`cta_rt`)
  - Resultado efectivo reportado: `12/12` (DB + render).
- `app/(public)/blog/[categoria]/page.tsx`:
  - Normalización de metadatos sensibles con guion simple para evitar drift de
    compatibilidad en superficies de categoría.
- `README.md`:
  - Troubleshooting ampliado para `invalid_grant` distinguiendo flujo OAuth
    (`seo:gsc`) y flujo mixto OAuth/service-account (`seo:audit:gsc-ga4`).

### Validación relevante de cierre
- `lint`, `build`, `test`: OK.
- `audit:performance`:
  - Producción actual: mantiene alertas (estado pre-deploy).
  - Build local actualizado (`SITE_BASE_URL=http://localhost:3005`): sin alertas críticas,
    sin leak en `llms.txt`, sin em-dash en `og:title` para rutas auditadas.
- `seo:gsc` y `seo:audit:gsc-ga4`: `invalid_grant` (dependencia externa, NO VALIDADO).

---

## 2026-06-28 — seo: hardening SEO/GEO (indexacion, conversion y compatibilidad)

Implementacion de mejoras SEO/GEO sobre rutas publicas estrategicas sin rediseñar
la arquitectura visual del sitio.

### Cambios implementados
- `next.config.ts`: redirect 301 permanente `/faq` -> `/preguntas-frecuentes`.
- `app/(public)/preguntas-frecuentes/page.tsx`:
  - Reorganizacion por clusters tematicos (penal, laboral, familiar, civil,
    servicios, consultas, honorarios, atencion local/tramites).
  - Indice superior con anchors.
  - Respuestas rapidas GEO por cluster (40-70 palabras aprox.).
  - `FAQPage` reducido a 40 entradas para bajar payload HTML/JSON-LD.
- `app/(public)/servicios-juridicos/page.tsx`:
  - Matriz de decision (problema -> area -> primer paso -> enlace).
  - Bloque de decision rapida orientado a conversion.
- `app/(public)/derecho-penal/page.tsx`:
  - Tabla de etapas/riesgos/plazos/accion recomendada.
  - Seccion de urgencias penales con FAQs operativas.
- `app/(public)/abogados-en-choluteca/page.tsx`:
  - Refuerzo de señales locales verificables, modalidades de atencion,
    tipos de casos y enlaces internos de accion.
- `app/(public)/blog/[categoria]/[slug]/page.tsx`:
  - Insercion automatica de CTA contextual a `/solicitar-consulta#formulario`
    en 6 slugs prioritarios que no tenian CTA en cuerpo.
- `app/(public)/blog/page.tsx`:
  - Reduccion de payload serializado del explorador cliente (tope 80 posts).
- `app/(public)/page.tsx`:
  - Cobertura local en home acotada a 3 landings clave para reducir HTML.
- Compatibilidad OG/titles:
  - Normalizacion de guion largo a guion simple en rutas auditadas:
    `servicios-juridicos`, `derecho-penal`, `blog`, `solicitar-consulta`,
    `como-llegar`.
- `scripts/generate-llms-txt.mjs`:
  - Politica de exclusion mantiene restriccion de contenido privado sin listar
    rutas privadas explicitas en `llms.txt`.

### Documentacion
- `README.md`:
  - Nuevo troubleshooting para `invalid_grant` en GSC/GA4.
  - Nueva seccion resumen "SEO/GEO update (2026-06-28)".

### Validacion esperada
- Ejecutar: `npm run lint && npm run build && npm test`.
- Ejecutar checks SEO/GEO: `npm run validar:meta-seo`,
  `npm run audit:internal-links`, `npm run audit:performance`,
  `npm run seo:health:json`.
- GSC/GA4 via API puede quedar `NO VALIDADO` si persiste `invalid_grant`
  (dependencia externa de credenciales).

---

## 2026-06-28 — sgie: Sprint 4 (resumen IA, colaboración, auth y productividad)

Cierra las brechas avanzadas de productividad, colaboración y seguridad: resumen
IA validado, reprogramación de eventos, comentarios de tarea, recuperación de
contraseña, búsqueda inteligente híbrida y dashboard de productividad.

### Migración de base de datos
- **`drizzle/migrations/0021_slim_leo.sql`** (nuevo): 3 tablas.
  - `resumenes_ia_expediente` (caché de resumen IA con `hash_entrada` para
    invalidación; R17).
  - `tarea_comentarios` (colaboración; borrado lógico vía `eliminado_en`).
  - `password_reset_tokens` (hash de token, expiración 1h, consumo único).
  Sólo CREATE + FKs + indexes. No destructiva. Generada con `drizzle-kit generate`.

### Resumen IA automático validado (tarea 1)
- `lib/sgie/resumen-ia.ts` (nuevo): `serializarDatosParaResumen`,
  `calcularHashEntrada`, `buildSystemPromptResumen` (R17: prohibe inventar datos
  legales), `generarResumenIa` (reutiliza config de `ia-documental`).
- `app/api/sgie/expedientes/[id]/resumen-ia/route.ts` (nuevo): `GET` (caché
  vigente) + `POST` (generar/regenerar con IA, cachea en DB, CSRF, rate limit
  5/5min, auditoría). Si el proveedor IA no está configurado → estado controlado.
- `components/sgie/inteligencia-expediente.tsx`: bloque resumen con botón
  Generar/Regenerar, disclaimer "requiere revisión del abogado".

### Reprogramar evento desde UI (tarea 2)
- `components/sgie/reprogramar-evento-dialog.tsx` (nuevo): modal accesible con
  fecha/hora obligatorias, motivo opcional, validación.
- `app/intranet/sgie/agenda/page.tsx`: botón "Reprogramar" en cada evento del
  día seleccionado. Reutiliza el PATCH de agenda (auditoría `evento_updated`
  con `reprogramado: true`).

### Comentarios de tarea (tarea 3)
- `app/api/sgie/tareas/[id]/comentarios/route.ts` (nuevo): `GET` + `POST`.
- `app/api/sgie/tareas/[id]/comentarios/[comentarioId]/route.ts` (nuevo):
  `PATCH` (editar, sólo autor) + `DELETE` (borrado lógico, autor/admin).
- `components/sgie/comentarios-tarea.tsx` (nuevo): drawer lateral con lista,
  añadir, editar y eliminar (texto plano, sin HTML inseguro).
- Integrado en `app/intranet/sgie/tareas/page.tsx` (botón por tarea).
- Auditoría `tarea_updated` con metadata explícita (no hay acción dedicada).

### Recuperación de contraseña (tarea 4)
- `lib/auth-reset.ts` (nuevo): `generarTokenReset` (32 bytes base64url),
  `hashTokenReset` (SHA-256, nunca token plano), `crearTokenReset` (invalida
  previos), `validarTokenReset`, `consumirTokenReset` (transacción).
- `app/api/auth/reset-password/route.ts` + `confirm/route.ts` (nuevos):
  solicitar (respuesta neutra anti-enumeración, rate limit 5/15min/IP,
  envía email vía Resend si configurado) y confirmar (valida + consume +
  audita `password_changed`).
- **2FA: feature flag documentada (no implementada).** Reset password es
  prioridad; 2FA completo requiere flujo de enrolamiento delicado que podría
  bloquear usuarios. Pendiente de Sprint futuro.

### Búsqueda semántica híbrida (tarea 5)
- `lib/sgie/busqueda-hibrida.ts` (nuevo): ranking textual determinista
  (`normalizarTexto`, `tokenizar`, `puntuarDocumento`, `rankear`). Sin
  embeddings (no existen): es ranking transparente, no semántica real.
- `app/api/sgie/buscar/semantica/route.ts` (nuevo): `GET` con scope, ranking
  por relevancia sobre expedientes/documentos/tareas.
- `components/sgie/global-search.tsx`: toggle "Búsqueda inteligente" que
  cambia al endpoint híbrido; aviso "resultado asistido; verificar fuente".

### Dashboard de productividad (tarea 6)
- `app/api/sgie/productividad/route.ts` (nuevo): `GET` métricas por abogado
  (tareas completadas/vencidas), actividad semanal, resumen. Soporta `csv`
  (reutiliza `lib/sgie/csv.ts`). Scope.
- `app/intranet/sgie/productividad/page.tsx` (nuevo): filtros fecha, tarjetas
  resumen, barras por abogado, gráfico de barras semanal, exportación CSV.

### Tests
- `tests/sgie-resumen-ia.test.ts` (8 tests): serialización, hash determinista,
  prompt restrictivo (R17).
- `tests/sgie-busqueda-hibrida.test.ts` (10 tests): normalización,
  tokenización, puntuación, ranking.

### Validación
- `npm run lint`: 0 errores (65 warnings preexistentes en archivos ajenos).
- `npm test`: 717 tests OK (32 suites), incluidos los 18 nuevos.
- `npm run build`: compilación + type-check OK, 335/335 páginas.
- `npm run test:e2e`: **NO VALIDADO** (webserver de Playwright no arranca por
  timeout del entorno; no es fallo de código).

### Notas
- Sin cambio del enum `auditoria_accion`: las nuevas acciones (comentario,
  resumen IA) reutilizan `tarea_updated`/`documento_updated`/`expediente_updated`
  con metadata explícita del evento.
- La IA nunca aprueba/firma/cierra/cambia estados (R17 reforzada).
- Reset password no requiere CSRF (ruta pública pre-auth, coherente con login).
- 2FA queda como feature flag documentada; no se implementa para no arriesgar
  bloqueo de usuarios sin flujo de enrolamiento.

---

## 2026-06-28 — sgie: Sprint 3 (agenda accionable, PDF, IA visible y cockpit ejecutivo)

Cierra las principales brechas operativas pendientes: mutaciones de agenda,
exportación PDF server-side, persistencia de notificaciones leídas, IA visible
en el expediente y cockpit ejecutivo. Referencia: auditoría SGIE, Sprint 3.

### Migración de base de datos
- **`drizzle/migrations/0020_magical_molten_man.sql`** (nuevo): tabla
  `notificaciones_leidas` (id, usuarioId, notificacionKey, leidaEn) con FK a
  `usuarios` (cascade) + unique(usuarioId, notificacionKey) para idempotencia.
  Generada con `npx drizzle-kit generate`. Sólo CREATE (no destructiva).

### Mutaciones de Agenda (tarea 1)
- `app/api/sgie/agenda/route.ts`: ampliado `GET` con filtros (expedienteId,
  estado, desde, hasta) y añadido `POST` crear evento (CSRF, rate limit,
  auditoría `evento_created`).
- `app/api/sgie/agenda/[id]/route.ts` (nuevo): `PATCH` actualizar/confirmar/
  cancelar/completar/reprogramar (scope, CSRF, auditoría `evento_updated`).
- `lib/sgie/agenda-helpers.ts` (nuevo): `estadoTrasAccion`, `accionAuditoriaEvento`,
  `accionRequiereConfirmacion`, `etiquetaAccion` (puras).
- `app/intranet/sgie/agenda/page.tsx`: formulario crear evento + acciones
  confirmar/cancelar/completar en el panel del día seleccionado.

### Exportación PDF server-side (tarea 2)
- **Dependencia añadida: `pdfkit` + `@types/pdfkit`** (ligera, sin Chromium,
  pura Node). Justificada: generación de PDF profesional server-side sin
  puppeteer/playwright (pesados). Es la opción más ligera disponible.
- `lib/sgie/pdf.ts` (nuevo): `generarPdfReporte` con título, fecha, filtros,
  métricas, tablas (estado/abogado/cliente) y pie "Pineda y Asociados".
- `app/api/sgie/reportes/route.ts`: añadido formato `pdf`
  (`Content-Type: application/pdf`, `Content-Disposition: attachment`, auditoría).
- `app/intranet/sgie/reportes/page.tsx`: botón "PDF" + función `exportarPdf`.

### Persistencia de notificaciones leídas (tarea 3)
- `app/api/sgie/notificaciones/route.ts`: `GET` ahora devuelve `leida` por
  notificación + `noLeidas` (consulta `notificaciones_leidas`); añadido `POST`
  marcar una (por `key`) o todas (idempotente via unique).
- `components/sgie/notifications-popover.tsx`: badge cuenta sólo no leídas,
  acción "Marcar leída" por item y "Marcar todas"; críticas siguen visibles
  aunque leídas (diferenciación visual).

### IA visible en el expediente (tarea 4)
- `app/api/sgie/expedientes/[id]/inteligencia/route.ts` (nuevo): `GET` presenta
  confianza global (`calcularConfianzaExpediente`), documentos con confianza
  individual, campos extraídos (valor/cita/estado) e inconsistencias detectadas.
  No invoca IA costosa por render; usa datos ya calculados.
- `components/sgie/inteligencia-expediente.tsx` (nuevo): sección "Inteligencia
  del expediente" con confianza global, inconsistencias, documentos clasificados
  y tabla de campos extraídos.
- `lib/sgie/inteligencia.ts` (nuevo): helpers de presentación (`etiquetarConfianza`,
  `traducirEtiquetaConfianza`, `tonoConfianza`, `estadoCampoExtraido`, etc.).
- Integrado en `app/intranet/sgie/expedientes/[id]/page.tsx`.
- **Resumen IA automático: no disponible.** Se informa al usuario; el motor IA
  existe pero no hay endpoint de generación de resumen validado. No se inventa.

### Cockpit ejecutivo (tarea 5)
- `app/api/sgie/cockpit/avanzado/route.ts` (nuevo): `GET` tendencia por estado,
  tareas vencidas por responsable, documentos pendientes, alertas críticas,
  cuellos de botella (14+ días sin movimiento) y eventos próximos. Scope.
- `app/intranet/sgie/page.tsx`: bloque ejecutivo con barras CSS, accesos rápidos
  (Nuevo cliente/expediente/tarea/Reportes) y listas de cuellos/eventos.

### Tests
- `tests/sgie-inteligencia.test.ts` (8 tests): confianza, estado de campo,
  valor efectivo, clasificación.
- `tests/sgie-agenda-helpers.test.ts` (7 tests): estado tras acción, auditoría,
  confirmación, etiquetas.

### Validación
- `npm run lint`: 0 errores (50 warnings preexistentes en archivos ajenos).
- `npm test`: 699 tests OK (30 suites), incluidos los 15 nuevos.
- `npm run build`: compilación + type-check OK, 330/330 páginas.
- `npm run test:e2e`: **NO VALIDADO** (timeout del entorno: webserver de
  Playwright; no es fallo de código).

### Notas
- `pdfkit` es la primera dependencia nueva añadida desde Sprint 0 (justificada
  y documentada). No requiere Chromium ni runtime adicional en el servidor.
- La IA nunca aprueba/firma/cierra: la sección de inteligencia es informativa.
- Seguridad intacta: `requireAbogado`, CSRF, rate limit, auditoría y scope en
  todos los endpoints nuevos/mutaciones.

---

## 2026-06-27 — sgie: Sprint 2 (gobierno, reporting y control operativo)

Convierte el SGIE en una plataforma administrable y medible para dirección/admin,
y mejora el control operativo diario. Sin cambio de schema. Referencia: auditoría
SGIE, tareas 1–5 del Sprint 2.

### Usuarios y Accesos SGIE (tarea 1)
- `app/intranet/admin/sgie/usuarios/page.tsx` (nuevo): vista de gobierno de
  accesos SGIE para admin (lista usuarios con rol, estado, último acceso,
  expedientes asignados, correo corp. vinculado; búsqueda y filtro por estado;
  enlaza al detalle `/intranet/admin/usuarios/[id]` para acciones completas).
  Reutiliza el endpoint `GET /api/admin/usuarios` y la capa
  `lib/sgie/usuarios-db.ts` (ya existentes, Fase 2).
- `app/api/sgie/usuarios/asignables/route.ts` (nuevo): `GET` lista abogados/admin
  activos asignables como responsable (payload mínimo id+nombre, sin emails).
  `requireAbogado`.
- `app/intranet/sgie/tareas/page.tsx`: añadido selector de responsable en el
  formulario crear/editar (carga `/api/sgie/usuarios/asignables`).

### Reportes con exportación (tarea 2)
- `lib/sgie/reportes-db.ts` (nuevo): `generarReporte` con agregaciones
  (expedientes por estado/cliente/abogado/procedimiento, tareas vencidas/
  completadas/pendientes, documentos pendientes, alertas, enlaces) y scope por
  abogado (admin ve todo).
- `app/api/sgie/reportes/route.ts` (nuevo): `GET` con filtros (fechas, cliente,
  estado, abogado, procedimiento) y dos formatos: `json` (agregados) y `csv`
  (descarga del listado de expedientes, RFC 4180 + BOM UTF-8). Rate limit +
  auditoría de exportación.
- `app/intranet/sgie/reportes/page.tsx` (nuevo): filtros, tarjetas de métricas,
  desgloses con barras, listado de expedientes, botones "Exportar CSV" e
  "Imprimir" (vista print-friendly; PDF real pendiente de dependencia).
- `lib/sgie/csv.ts` (nuevo): generación CSV nativa sin dependencias
  (`escaparCelda`, `generarCsv`, `conBom`, `nombreArchivoExport`).

### Vista calendario de Agenda (tarea 3)
- `app/intranet/sgie/agenda/page.tsx` reescrito: vista mensual y semanal propia
  (CSS/Tailwind, sin librerías de calendario), navegación, lista lateral de
  próximos eventos y eventos del día seleccionado.
- `lib/sgie/calendario.ts` (nuevo): utilidades puras de fecha
  (`rejillaMes`, `rejillaSemana`, `esMismoDia`, `formatRangoSemana`, etc.).
- Mutaciones de evento (crear/confirmar/reprogramar): PENDIENTES. El endpoint
  actual es sólo lectura; no se inventa endpoint.

### Previsualización segura de documentos (tarea 4)
- `app/api/sgie/documentos/[id]/preview/route.ts` (nuevo): `GET` valida scope
  del documento/expediente y devuelve la URL del blob o `preview_not_available`.
  Rate limit + auditoría de acceso.
- `components/sgie/documento-preview.tsx` (nuevo): modal accesible que muestra
  PDF (iframe), imágenes (img) o mensaje profesional si no es previsualizable.
- `app/intranet/sgie/documentos/page.tsx`: botón "Previsualizar" en el modal de
  detalle.
- Limitación: el storage actual (Vercel Blob) usa URLs públicas; no hay URL
  firmada. Si se migra a storage privado, el endpoint generará la URL temporal.

### Notificaciones in-app (tarea 5)
- `app/api/sgie/notificaciones/route.ts` (nuevo): `GET` notificaciones DERIVADAS
  (virtuales, sin tabla nueva): tareas vencidas, alertas críticas, documentos
  pendientes, eventos próximos, enlaces por expirar. Scope por abogado.
- `lib/sgie/notificaciones.ts` (nuevo): `normalizarNotificaciones` (pura) →
  payload uniforme con severidad, href y orden por prioridad.
- `components/sgie/notifications-popover.tsx` (nuevo): badge + popover con
  refresco cada 60 s, agrupación visual por severidad.
- Integrado en `app/intranet/sgie/layout.tsx` (campana en la barra superior).

### Tests
- `tests/sgie-calendario.test.ts` (11 tests): rejillas mes/semana, rangos,
  formato de semana, constantes.
- `tests/sgie-csv.test.ts` (16 tests): escape RFC 4180, paths anidados, BOM,
  nombre de archivo.
- `tests/sgie-notificaciones.test.ts` (7 tests): normalización, orden por
  prioridad, dedupe, href por tipo.

### Validación
- `npm run lint`: 0 errores (45 warnings preexistentes en archivos ajenos).
- `npm test`: 684 tests OK (28 suites), incluidos los 34 nuevos.
- `npm run build`: compilación + type-check OK, 329/329 páginas.
- `npm run test:e2e`: **NO VALIDADO** (timeout del entorno: el webserver de
  Playwright relanza un build interno, código 143/SIGTERM; no es fallo de código).

### Notas
- Sin cambio de schema: los enums `auditoria_accion` ya incluían todas las
  acciones usadas. No existe acción de exportación/preview dedicada; se
  reutilizan `expediente_updated`/`documento_updated` con metadata explícita.
- El módulo de gestión de usuarios (Fase 2) ya existía en `/intranet/admin/
  usuarios` con endpoints completos; la vista SGIE es un wrapper de gobierno
  que no duplica lógica.
- Seguridad intacta: `requireAdmin`/`requireAbogado`, CSRF, rate limit y
  auditoría en todos los endpoints. Scope por abogado sin relajar.

---

## 2026-06-27 — sgie: Sprint 1 (operativa diaria)

Convierte el SGIE en una herramienta operativa diaria para el abogado, sobre el
backend del Sprint 0. Sin cambio de arquitectura ni de schema. Referencia:
auditoría SGIE, tareas 1–5 del Sprint 1.

### CRUD de Tareas (tarea 1)
- `lib/sgie/tareas-db.ts` (nuevo): `listarTareas` (filtros estado/prioridad/
  expediente/asignadaA/q + scope), `crearTarea`, `actualizarTarea` (campos
  editables + estado), `verificarAccesoTarea`.
- `app/api/sgie/tareas/route.ts`: `POST` (crear, CSRF + rate limit + auditoría
  `tarea_created`) y `GET` reescrito con filtros nuevos vía `tareas-db`.
- `app/api/sgie/tareas/[id]/route.ts`: `PATCH` ampliado a edición completa
  (antes sólo `estado`); auditoría `tarea_updated`/`tarea_completed`.
- `app/intranet/sgie/tareas/page.tsx`: pantalla con crear/editar
  (título, descripción, prioridad, vencimiento), completar/reabrir, filtros
  (estado, prioridad, búsqueda), estados vacío/error/loading (skeleton),
  vencimientos con aviso visual, acciones con label/title accesible.
- **Comentarios de tarea: PENDIENTES.** La tabla `tareas` no tiene tabla de
  comentarios asociada en el schema; no se inventa estructura.

### Enlaces mágicos en el detalle de expediente (tarea 2)
- `app/api/sgie/enlaces/route.ts`: añadido `GET ?expedienteId=` (lista enlaces
  del expediente accesible; no devuelve token de revocados).
- `components/sgie/enlaces-expediente.tsx` (nuevo): bloque con ver, generar
  (expiración 1–90 días, usos 1–50, email opcional), copiar al portapapeles y
  revocar (`ConfirmDialog`). Banner de token recién creado para copiar antes
  de cerrar (seguridad: no se re-muestra el token completo).
- Integrado en `app/intranet/sgie/expedientes/[id]/page.tsx`.

### Ficha de cliente + edición (tarea 3)
- `app/intranet/sgie/clientes/[id]/page.tsx` (nuevo): datos del cliente,
  expedientes asociados, acción "Crear expediente", edición básica (PATCH),
  estados loading (DetailSkeleton/TableSkeleton)/vacío/error.
- `lib/sgie/clientes-db.ts`: `obtenerCliente` (detalle + conteo de expedientes
  accesibles) y `actualizarCliente` (recalcula `duplicadoHash`).
- `app/api/sgie/clientes/[id]/route.ts` (nuevo): `GET` (detalle) y `PATCH`
  (edición con validación Zod, CSRF, rate limit, auditoría `cliente_updated`).
- `app/intranet/sgie/clientes/page.tsx`: nombre clicable a la ficha + acción
  "Ver"; skeleton de carga en vez de spinner.
- **Baja lógica: PENDIENTE.** La tabla `clientes` no tiene campo `activo`;
  requiere cambio de schema futuro.

### Buscador global ⌘K (tarea 4)
- `lib/sgie/buscar-db.ts` (nuevo): `buscar` (clientes, expedientes, documentos,
  tareas) con scope por abogado; `normalizarTermino` (pura). Payload homogéneo
  y pequeño por resultado.
- `app/api/sgie/buscar/route.ts` (nuevo): `GET ?q=` con `requireAbogado`,
  rate limit, scope aplicado en `buscar-db`.
- `components/sgie/global-search.tsx` (nuevo): modal accesible ⌘K/ctrl+K,
  navegación por teclado (↑↓/Enter/Esc), debounce 250 ms, agrupación por tipo,
  estado vacío/loading.
- Integrado en `app/intranet/sgie/layout.tsx` (botón "Buscar…" en barra
  superior + atajo global).

### Skeletons reutilizables (tarea 5)
- `components/ui/skeletons.tsx` (nuevo): `TableSkeleton`, `ListSkeleton`,
  `PageHeaderSkeleton`, `DetailSkeleton`. Aplicados en clientes (listado +
  ficha), expedientes (detalle), tareas, enlaces mágicos y buscador.
- `app/globals.css`: clase `.skeleton` con shimmer usando tokens
  (`--color-surface-alt`, `--color-surface-2`) — compatible claro/oscuro.

### Tests
- `tests/sgie-buscar.test.ts` (nuevo, 6 tests): `normalizarTermino` (vacíos,
  nulos, longitud mínima, trim, caracteres especiales).

### Validación
- `npm run lint`: 0 errores.
- `npm test`: 650 tests OK (25 suites), incluido el nuevo de búsqueda.
- `npm run build`: compilación + type-check OK, 324/324 páginas.
- `npm run test:e2e`: **NO VALIDADO** (timeout del entorno: el webserver de
  Playwright relanza un build interno; no es fallo de código).

### Notas
- Sin cambio de schema: el enum `auditoria_accion` ya incluía `tarea_created`,
  `tarea_updated`, `tarea_completed`, `cliente_updated`, `enlace_created`,
  `enlace_revoked`.
- Seguridad intacta: `requireAbogado`, CSRF, rate limit y auditoría en todos
  los endpoints nuevos/mutaciones. Scope por abogado sin relajar.
- No se exponen tokens de enlaces revocados/expirados.

---

## 2026-06-27 — sgie: Sprint 0 (auditoría SGIE)

Mejoras del frontend operativo para desbloquear el flujo canónico mínimo del
SGIE (cliente → expediente con procedimiento real). Trabaja sobre el backend
existente sin cambiar arquitectura ni relajar seguridad. Referencia: auditoría
profesional del SGIE, tareas 1–5.

### Módulo Clientes (tarea 1)
- `app/intranet/sgie/clientes/page.tsx` (nuevo): listado con búsqueda
  (`GET /api/sgie/clientes?q=`), alta (`POST`) con validación frontend
  coherente con el endpoint, detección de duplicados (feedback informativo),
  toasts de éxito/error, estados de carga/vacío/error accionables, y acción
  por fila "Crear expediente" (`/intranet/sgie/expedientes?clienteId=...`).
- `app/intranet/sgie/layout.tsx`: entrada "Clientes" (icono `Users`) en el
  menú lateral, entre Cockpit y Expedientes.

### Alta de expediente corregida (tarea 2)
- `app/intranet/sgie/expedientes/page.tsx`: el formulario ahora asocia
  **cliente** y **tipo de procedimiento** reales (selectores con búsqueda).
  Soporta preselección vía query param `?clienteId=&clienteNombre=` (desde
  Clientes). Elimina los `requisitosIniciales` hardcodeados: el checklist se
  instancia desde el procedimiento elegido (ver backend). Tras crear, redirige
  al detalle del expediente.
- `app/api/sgie/tipos-procedimiento/route.ts` (nuevo): `GET` solo lectura con
  `requireAbogado`, devuelve procedimientos `estado='activo'` (admin puede ver
  todos con `?incluirTodos=true`). Catálogo compartido, sin scope por abogado.

### Instanciación de checklist desde procedimiento (backend, tarea 2)
- `lib/sgie/procedimientos-db.ts` (nuevo): `listarProcedimientos`,
  `obtenerProcedimiento` y `extraerRequisitosDeDefinicion` (pura, defensiva:
  normaliza `documentosRequeridos/Opcionales/Condicionales` de la `definicion`
  JSON; no inventa requisitos — si el procedimiento no los define, el
  expediente nace sin checklist).
- `lib/sgie/expedientes-db.ts`: `crearExpediente` ahora, si no recibe
  `requisitosIniciales` pero sí `tipoProcedimientoId`, carga la `definicion`
  del procedimiento y siembra los requisitos automáticamente. Compatibilidad
  hacia atrás: `requisitosIniciales` explícito sigue prevaleciendo.

### Diálogos del design system (tarea 3)
- `components/ui/prompt-dialog.tsx` (nuevo): `PromptDialogProvider` + hook
  `usePromptDialog()` — alternativa accesible a `prompt()` nativo con textarea,
  validación de longitud, estado loading, focus trap. Integrado en
  `app/layout.tsx` junto a `ToastProvider`/`ConfirmProvider`.
- `app/intranet/sgie/expedientes/[id]/page.tsx`: el rechazo de documentos usa
  `usePromptDialog()` (textarea, min 1 / max 500, tone danger) en lugar de
  `prompt()` nativo. Lógica del endpoint intacta.

### Unificación visual Sprint 0 (tarea 4)
- Pantallas `documentos`, `tareas`, `alertas`, `agenda`, `correos`: sustituidos
  colores crudos (`bg-gray-100`, `text-blue-700`, `bg-yellow-100`…) por design
  tokens (`bg-surface-alt`, `text-info`, `bg-warning/10`…). Añadido feedback
  de error visible (`ErrorState`) donde los `catch` eran silenciosos, estados
  vacíos accionables, loading state con `Spinner`, y enlace "Volver al cockpit".
- `expedientes/page.tsx` y `expedientes/[id]/page.tsx`: `EstadoBadge` y labels
  usan la nueva utilidad de traducción de estados.

### Traducción de estados (tarea 5)
- `lib/sgie/estados.ts` (nuevo): `traducirEstadoExpediente`,
  `traducirEstadoDocumento`, `traducirSeveridad`, `traducirPrioridad`,
  `traducirEstadoTarea`, `traducirEstadoAgenda`, `traducirEstadoCorreo`.
  Sólo presentación (no muta DB). Fallback capitalizado para estados futuros.

### Tests
- `tests/sgie-estados.test.ts` (nuevo, 13 tests): traducción de los enums
  completos, fallback y nulos.
- `tests/sgie-procedimientos.test.ts` (nuevo, 9 tests): extracción de
  requisitos desde `definicion` (casos válidos, vacíos, mal formados, seed).

### Validación
- `npm run lint`: 0 errores (warnings preexistentes en archivos ajenos).
- `npm test`: 644 tests OK (24 suites), incluidos los 22 nuevos.
- `npm run build`: compilación + type-check OK, 323/323 páginas.
- `npm run test:e2e`: **NO VALIDADO** (el webserver de Playwright relanza un
  build interno que excede el timeout del entorno; no es fallo de código).

### Notas
- No se han relajado permisos: `requireAbogado`, CSRF, rate limiting y
  auditoría SGIE intactos en todos los endpoints (nuevos y existentes).
- No se ha cambiado arquitectura, schema DB ni configuración externa.
- Los procedimientos deben estar `estado='activo'` para aparecer en el
  selector (los seeds están `pendiente_validacion_legal` por diseño).

---

## 2026-06-27 — sgie: Fases 5, 6, 7, 8, 9, 10 + Demo Carlos Pineda

### Fase 5 — Plantillas de correo Resend
- `lib/sgie/correos-db.ts`: CRUD plantillas, interpolación `{{variables}}`,
  envío idempotente vía Resend, reintentos, UNIQUE (expediente_id, slug, ventana).
- `drizzle/seed-sgie-plantillas.ts`: 10 plantillas base (solicitud, acuse,
  faltantes, recordatorio, expirado, rechazado, aprobado, revisión, cita, cierre).
- `app/api/sgie/plantillas/*`: endpoints CRUD + preview.
- `app/intranet/admin/sgie/plantillas/page.tsx`: panel admin con editor HTML,
  vista previa iframe, activar/desactivar.
- Script: `seed:sgie:plantillas`.

### Fase 6 — Motor documental
- `lib/sgie/motor-documental.ts`: extracción texto PDF con `pdfjs-dist`,
  clasificación heurística (10 tipos), cache por hash SHA-256, orquestador de
  jobs idempotentes, runner `procesarJobsPendientes()`.
- `app/api/sgie/documentos/*`: endpoints GET (scope), GET [id], POST [id]/procesar
  (encola job, no procesa en handler).
- `app/api/cron/sgie/procesar/route.ts`: cron protegido por `CRON_SECRET`.
- `app/intranet/sgie/documentos/page.tsx`: tabla con filtros, detalle modal,
  texto extraído, botón "Procesar".

### Fase 7 — IA/OCR configurable
- `lib/sgie/ia-documental.ts`: capa intercambiable vía env vars
  (`IA_DOCUMENTAL_PROVIDER`, `IA_DOCUMENTAL_MODEL`, `IA_DOCUMENTAL_BASE_URL`,
  `IA_DOCUMENTAL_API_KEY`, `IA_DOCUMENTAL_MODE`, timeout, reintentos).
  Modos: `disabled`, `heuristic`, `ai`. Zod output estricto anti-alucinación.
  Prompt restrictivo: prohibido inventar datos legales.

### Fase 8 — Motor de reglas y confianza
- `lib/sgie/motor-reglas.ts`: 5 reglas deterministas (completitud, duplicados,
  ilegibles, confianza baja, campos sin cita). Idempotencia por ventana.
  Acciones automáticas: alertas + tareas.
- `lib/sgie/motor-confianza.ts`: cálculo 0-100 por campo/documento/expediente.
  Evidencias: formato válido, cita fuente, coincidencia con cliente/documentos,
  contradicciones.

### Fase 9 — Cockpit avanzado
- `app/intranet/sgie/page.tsx`: cockpit con 8 métricas reales desde
  `/api/sgie/cockpit`, bandeja de expedientes recientes.
- `app/intranet/sgie/expedientes/[id]/page.tsx`: documentos con aprobar/rechazar,
  alertas con resolver.
- `app/api/sgie/cockpit/route.ts`: métricas agregadas con scope.
- Páginas reales para alertas, tareas, agenda y correos con datos de la DB.

### Fase 10 — Métricas, reglas, retención
- `app/api/admin/sgie/metricas/route.ts`: KPIs admin (total exp, docs, IA,
  correos, tareas, por estado, por abogado).
- `app/api/admin/sgie/reglas/route.ts`: GET/POST reglas versionadas con auditoría.
- `app/intranet/admin/sgie/metricas/page.tsx`: dashboard con gráficos.
- `app/intranet/admin/sgie/reglas/page.tsx`: editor JSON con versionado.
- `app/intranet/admin/sgie/retencion/page.tsx`: **NO VALIDADO** legalmente.

### Demo Carlos Pineda
- `drizzle/seed-sgie-demo-carlos.ts`: seed idempotente con datos mock para
  validación visual/funcional del SGIE. Puebla: 10 clientes, 12 expedientes
  en estados variados, 15 documentos, 8 campos extraídos, confianza, 6 alertas,
  7 tareas, 5 eventos agenda, 8 correos (2 fallidos), extracciones IA,
  correcciones IA. Script: `seed:sgie:demo:carlos`.
- `e2e/sgie-demo.spec.ts`: tests e2e Playwright para SGIE (6 tests).

### Schema
- Migración `0019`: corrige 17 FK con `ON DELETE CASCADE`.
- 59 tablas totales, 13 enums.

---

## 2026-06-27 — sgie: Fase 1 + Fase 2 + base Fase 3 del SGIE Autopilot

Implementación inicial del **SGIE Autopilot** (Sistema de Gestión Integral de
Expedientes) dentro de la intranet existente, conforme a `pinedayasociados.md`.
El abogado delega tareas operativas al sistema y se concentra en validar,
decidir, asesorar y firmar. La IA/automatización nunca aprueba, firma ni cierra.

### Alcance (Fase 1 + Fase 2 + base Fase 3)

- **Fase 1 — Datos y roles:** modelo SGIE base en Drizzle (8 tablas + 5 columnas
  de gobernanza en `usuarios`). Migración `0017_sgie_base` generada y aplicada
  a la DB de desarrollo.
- **Fase 2 — Usuarios / Accesos:** módulo admin ampliado en
  `/intranet/admin/usuarios` (no se crea un segundo panel). Rol abogado,
  bloqueo de acceso, vínculo de correo corporativo y auditoría de gobernanza.
- **Fase 3 (base visual):** cockpit del abogado en `/intranet/sgie` con tarjetas
  reales (expedientes) y placeholders profesionales para módulos futuros.
  Expedientes funcionales con scope por abogado.

### Schema (Bloque A) — `lib/schema.ts`

- **`usuarios` extendido** (aditivo): `ultimo_acceso`, `bloqueado`,
  `bloqueado_en`, `bloqueado_motivo`, `correo_corporativo_vinculado`.
  `bloqueado` es revocación de acceso distinguible de `active` (soft-delete).
- **8 tablas SGIE nuevas:** `usuarios_sgie`, `clientes`, `tipos_procedimiento`,
  `expedientes`, `expediente_asignaciones`, `expediente_permisos`,
  `requisitos_expediente`, `historial_expediente`.
- **7 enums nuevos** (estados de expediente §8.2, prioridad, estado de
  procedimiento, tipo/estado de requisito, rol de asignación, tipo de actor).
  `EXPEDIENTE_ESTADOS_CRITICOS` marca las transiciones que sólo el abogado ejecuta.
- **Migración:** `drizzle/migrations/0017_sgie_base.sql`. Se reparó además la
  desincronización del journal de Drizzle (Fase 2 no estaba registrada).
- **VALIDADO:** `npx drizzle-kit push` aplicado a DB dev; 8/8 tablas y 5/5
  columnas verificadas en `information_schema`.

### Control de acceso (Bloque C)

- `lib/auth.ts` — `requireAbogado(request)`: rol `abogado` o `admin` (el admin
  conserva acceso total al SGIE para supervisión).
- `/api/auth/login` — rechaza login de bloqueados (403) o desactivados; registra
  `ultimo_acceso` en cada login correcto.
- `/api/auth/me` — revoca sesión activa de bloqueados/desactivados tras la
  emisión del JWT (cierra la ventana de 24h del token stateless).

### Proxy (Bloque D) — `proxy.ts`

- Redirect post-login por rol: admin → `/intranet/admin`, abogado →
  `/intranet/sgie` (antes redirigía ciegamente a admin).
- `/api/sgie/*` y `/intranet/sgie/*` requieren token JWT.

### Endpoints admin Usuarios/Accesos (Bloque E)

- `GET /api/admin/usuarios` ampliado: último acceso, bloqueo, vínculo
  corporativo y conteo de expedientes asignados. Filtro por estado.
- `PATCH /api/admin/usuarios/:id/rol`, `.../bloqueo`, `.../vinculo-correo`.
- Todos con `requireAdmin` + `validateCsrf` + `rateLimit` + `logAudit`.

### Endpoints SGIE expedientes (Bloque F)

- `GET/POST /api/sgie/expedientes`, `GET/PATCH /api/sgie/expedientes/:id`,
  `POST /api/sgie/expedientes/:id/checklist/confirmar`.
- **Scope por abogado** aplicado en query (asignaciones/permisos activos);
  transiciones críticas requieren actor abogado.

### UI (Bloques G + H)

- **Admin Usuarios/Accesos ampliado:** tabla con estado, último acceso y
  expedientes; toggle rol, bloquear (modal con motivo), vincular correo.
- **Layout + Cockpit SGIE** (`/intranet/sgie`): tarjetas reales + placeholders.
- **Expedientes:** lista, crear y detalle con checklist, historial y acciones
  críticas del abogado (validar, firmar…).
- **Placeholders** (documentos, alertas, tareas, agenda, correos).

### SEO / privacidad (Bloque I)

- `robots.ts` bloquea `/intranet/` → `/intranet/sgie/*` cubierto.
- `app/sitemap.ts` sin rutas intranet (verificado). Sin enlaces públicos a SGIE.

### Validación

- `npm run lint` — 0 errores (4 warnings preexistentes en `lib/analytics.ts`).
- `npm run build` — ✓ Compiled successfully; 302/302 páginas; TypeScript OK.
- `npm test` — 21 archivos, 601 tests, 0 fallos.
- `npx drizzle-kit generate` — migración generada. `npx drizzle-kit push` — DB dev.

### NO VALIDADO / pendiente

- Aplicación de la migración a **producción**: pendiente de deploy.
- **Seeds de procedimientos** desde el catálogo del sitio (Fase 0/1 editorial):
  tabla creada; siembra como próximo paso.
- **Tests e2e Playwright** de flujos SGIE: no añadidos (no romper los 37
  existentes); trabajo posterior.
- Módulos futuros (documentos, alertas, tareas, agenda, correos, IA/OCR, motor
  de reglas y confianza, enlaces mágicos): fases 4–10 del plan.

---

## 2026-06-25 — chore: modo de diagnóstico local de analítica (development)

Añadida observabilidad local para auditorías futuras de GA4. **No es un fix
del error `analytics.google.com/analytics/v2/realtime/venus/getData 400 OK`**:
ese error pertenece a la interfaz web interna de Google Analytics (la SPA de
`analytics.google.com` que consulta el servicio Realtime "venus"), no al sitio
público. Ningún visitante del sitio dispara esa URL; el sitio solo envía hits
a `google-analytics.com/g/collect`. La URL no existe hardcodeada en el repo.

### Cambios

- **chore:** `lib/analytics.ts` — añadidos helpers de diagnóstico reutilizables:
  - `isAnalyticsExcludedPath(pathname)` + `ANALYTICS_EXCLUDED_PREFIXES`:
    fuente única (DRY) de la lista de rutas privadas excluidas de tracking
    (`/intranet`, `/cp`, `/calculadora`, `/casos`, `/delitos`, `/atajos`,
    `/api`, `/admin`, `/_next`, `/preview`, `/404`, `/500`).
  - `isAnalyticsDebugEnabled()`: true solo si `NODE_ENV !== 'production'` **Y**
    `NEXT_PUBLIC_ANALYTICS_DEBUG === 'true'`. En producción siempre false.
  - `debugAnalytics(message, context)`: emite `[analytics:debug] ...` al
    `console.debug` del navegador, sin cookies/IPs/query strings/PII.
  - `maskMeasurementId(gaId)`: enmascara el Measurement ID en logs
    (`G-L2PG*****`) y detecta formato inválido sin imprimirlo.
- **chore:** `components/analytics-scripts.tsx` — consume
  `isAnalyticsExcludedPath` (elimina la lista duplicada que tenía embebida) y
  emite logs `[analytics:debug] enabled/skipped/page_view` en development.
  Comportamiento de producción sin cambios: misma carga única de GA4, mismo
  Measurement ID `G-L2PGBN3SWK`, mismo `lazyOnload`, sin GTM.
- **docs:** `.env.example` — documentada `NEXT_PUBLIC_ANALYTICS_DEBUG`.

### Verificación local (con `NEXT_PUBLIC_ANALYTICS_DEBUG=true` en dev)

- `/`, `/derecho-penal`, `/servicios-juridicos` → `[analytics:debug] enabled`.
- `/cp`, `/intranet/login`, `/api/*` → `[analytics:debug] skipped` (o sin montar).

### Validación

`npm run lint` (0 errores), `npm run build` (✓ compiled, 294 páginas),
`npm test` (601/601). Producción no afectada (logs solo en dev con flag).

---

## 2026-06-25 — Auditoría SEO: implementación de hallazgos críticos

Diagnóstico técnico de indexación/rastreo/visibilidad (GSC + GA4 + Bing
Webmaster Tools API + IndexNow + DB) y corrección de hallazgos críticos
y altos. 6 commits atómicos en `main`, prefijados `chore:` / `seo:` /
`fix:` (R7). Sin tocar arquitectura, motor de cálculo ni auth (R9).

### Cambios

- **chore:** `components/analytics-scripts.tsx` — extender `EXCLUDED_PREFIXES`
  con `/cp`, `/calculadora`, `/casos`, `/delitos`, `/atajos`. GA4 no trackeaba
  intranet/preview/api, pero `/cp` sí recibió 1 sesión orgánica reportada en
  GA4 (fuga). Cerrado y robustecido contra futuras rutas privadas. Refuerzo R6.
- **seo:** `data/seo/canonical-paths.json` — para 6 páginas legales
  (`/aviso-legal`, `/politica-editorial`, `/politica-privacidad`,
  `/politica-cookies`, `/terminos`, `/disclaimer`) cambiado `days_ago 30 → 0`
  para refrescar `lastmod` en el sitemap. `/aviso-legal` `priority 0.2 → 0.4`
  (temporal). Objetivo: recuperar indexación de `/aviso-legal` reportada por
  GSC URL Inspection como NEUTRAL ("Descubierta: actualmente sin indexar").
- **seo:** `app/(public)/derecho-penal/page.tsx` y
  `app/(public)/servicios-juridicos/page.tsx` — recortar
  `metadata.description` a 152 y 156 chars respectivamente (antes 225/179).
  Conservadas keywords comercial/CTA WhatsApp. Mejora CTR sin alterar títulos
  ni UI visible (R5).
- **fix:** `next.config.ts` — 2 redirects 301 defensivos para backlinks
  externos 404 detectados en GSC URL Inspection `referringUrls`:
  - `/hondurenos-en-espana/poder-desde-espana-para-tramites-honduras` →
    `/blog/hondurenos-en-espana/poder-desde-espana-para-tramites-honduras`
    (post existe, DB confirmada; backlink externo llegaba sin prefijo `/blog/`).
  - `/derecho-penal/proceso-penal-completo/paso-1` →
    `/derecho-penal/proceso-penal-completo` (subpath 404 de landing existente).
- **fix:** `scripts/submit-indexnow.mjs` — envío dual resiliente usando
  `Promise.allSettled` a `https://api.indexnow.org/indexnow` (oficial) y
  `https://www.bing.com/indexnow` (Bing directo, ya definido en el script).
  Ningún fallo individual aborta el envío al otro endpoint. Status por
  endpoint registrado en logs. `dry-run`, `incremental cache` y
  `INDEXNOW_SAFETY_CAP` intactos. Sin `ENABLE_INDEXNOW_SUBMIT=true` sigue
  en dry-run.
- **seo:** `app/(public)/derecho-penal/page.tsx` — el bloque "Artículos
  relacionados" ahora enlaza prioritariamente a 3 posts penales con tráfico
  real (GSC 28d, clicks > 0): `estafas-fraudes-tipos-penales-honduras`,
  `cuando-prescribe-delito-en-honduras`,
  `fianza-medidas-cautelares-proceso-penal-honduras`. Slugs filtrados contra
  DB (graceful). Ancla descriptiva, no "leer más".

### Validación

- `npm run lint` — 0 errores.
- `npm run build` — exitoso. `postbuild` ejecutó `generate-llms-txt.mjs` y
  `submit-indexnow.mjs` (dry-run; cabecera muestra nuevo endpoint dual).
- `npm test` — **601 tests pasados · 21 suites** · 0 fallos nuevos.

### Estado (R11)

- `IMPLEMENTADO` y `VALIDADO` localmente (lint/build/test).
- `NO VALIDADO` en producción: redirects 301, envío dual IndexNow real y
  meta-descriptions actualizadas solo entrarán en vigor en Vercel tras el
  próximo deploy. Confirmar con `curl -I` a las URLs afectadas y revisando
  GSC URL Inspection en D+3 a D+7.
- **No promete indexación garantizada**: las correcciones mejoran
  consolidación, rastreo, descubrimiento y señales, pero la indexación real
  por Google/Bing depende de quality, crawl budget y enlaces externos.

### Próximos pasos (D+7)

- Tras deploy: confirmar `InIndex` Bing > 31 y que las 8 URLs prioritarias
  antes no crawleadas tengan `lastCrawled` (BWT `GetUrlInfo`).
- En GSC UI: "Solicitar indexación" en `/aviso-legal`.
- Re-auditar: `node scripts/bing-wmt-audit.mjs` + `npm run indexnow:dry`.
- Reforzar backlinks externos legítimos (BWT `GetLinkCounts` reporta 1).

---

## Unreleased — Limpieza conservadora del repositorio (`basura/`)

Reorganización sin borrado definitivo: 101 elementos obsoletos (backups
manuales, logs commiteados, scripts one-shot ya ejecutados, reportes JSON
regenerables, componentes muertos y carpetas `legacy`) movidos con `git mv`
a `basura/` preservando la ruta relativa. Nada se elimina; el inventario
trazable y las instrucciones de reversión viven en `basura/MANIFEST.md`.

- **Movidos:** `.backups/` (4), logs de raíz (5), `scripts/_audit-temp.ts`,
  `migrate-meta-titles.ts`, `migrate-slugs.ts`, `seo-apply-ctr-fixes.ts`,
  `scripts/sql/fix-truncaa-meta-titles.sql`, reportes `data/auditoria-*-report.json`
  + 3 stale, `components/marketing/_unused/` (8), `scripts/legacy/` (38),
  `data/legacy/` (35).
- **`.gitignore`**: añadidos reportes regenerables de `auditar-cp.js` /
  `auditar-delitos.js`, backups JSON de auditoría SEO locales y export
  `docs/*.xlsx`.
- **Sin cambios de lógica funcional.** Cambios previos sin commitear
  (CHANGELOG, `next.config.ts`, archivos en `auditoria-seo/` y `docs/`) se
  respetaron.
- **Validado**: `npm run lint` + `npm run build` + `npm test` (verificados).
- Previamente a esta entrada: `IMPLEMENTADO`, `VALIDADO`, sin tocar web pública
  ni archivos protegidos (`AGENTS.md §9`).

---

## 2026-06-24 — SEO GSC Performance: optimización integral de titles, metas, enlazado interno y redirects HTTPS

Corrección completa de los hallazgos del informe Google Search Console Performance
del 24 Jun 2026. Resumen: 29 clics, 916 impresiones, CTR 3.17%, posición media 6.73.
El 93% del tráfico se concentró entre el 20-22 Jun tras IndexNow + robots.txt.
79.3% de impresiones son móviles.

### Causa raíz

- **CTR bajo pese a buena posición**: varios posts en posición 2-4 con 0 clics
  (prescripción deudas pos 3.78 con 0/9, custodia pos ~2 con 0/3, sobreseimiento
  pos 6.4 con 0/15, querella pos 1 con 0/1). Titles y metas genéricas sin
  intención de búsqueda específica ni llamada a la acción.
- **HTTP no seguro en GSC**: `http://pinedayasociadoshn.com/` aparecía con 4
  impresiones en el informe. Sin redirect explícito en next.config.ts.
- **Enlazado interno insuficiente**: posts del cluster penal no se enlazaban
  entre sí (sobreseimiento ↔ hábeas corpus ↔ querella). Cluster pensión
  alimenticia sin enlace al nuevo post de porcentajes 2026.
- **Canibalización pensión**: ya corregida en Fase 1 (redirects en next.config.ts),
  pero el post `pension-alimenticia-guia-completa` y el nuevo
  `pension-alimenticia-porcentaje-2026` necesitaban enlazado cruzado.

### Cambios en código

| Archivo | Cambio |
|---------|--------|
| `next.config.ts` | Nuevos redirects 301 para `http://pinedayasociadoshn.com/` → `https://www.pinedayasociadoshn.com/` vía `has: [{ type: 'host', value: ... }]`. Refuerza canonicalización HTTPS/www a nivel de Next.js. |

### Cambios en DB (blog_posts)

**Titles y metas optimizados (8 posts):**

| Slug | Title anterior → Nuevo title | Meta anterior → Nueva meta |
|------|------------------------------|---------------------------|
| `prescripcion-deudas-plazos-honduras` | "Prescripción de Deudas en Honduras: Guía Completa de Plazos" → "Prescripción de Deudas en Honduras: Plazos y Cuándo Prescribe Cada Tipo" | Genérica → "¿A los cuantos años prescribe una deuda en Honduras? Plazos exactos..." |
| `custodia-hijos-honduras-juez` | "Custodia de Hijos en Honduras: Guía de Tipos y Criterios" → "Custodia de Hijos en Honduras: Requisitos, Tipos y Cómo lo Decide el Juez" | Genérica → "¿Cómo funciona la custodia de hijos en Honduras?" |
| `sobreseimiento-definitivo-provisional` | "Sobreseimiento Definitivo y Provisional en Honduras: Guía" → "Sobreseimiento Definitivo y Provisional en Honduras: Diferencias y Efectos" | Mejorada con "cuándo procede" |
| `diferencia-denuncia-querella-acusacion-honduras` | "Guía completa: denuncia, querella y acusación en Honduras" → "Denuncia vs Querella en Honduras: Diferencias y Cuándo Presentar Cada Una" | Enfocada en "querella" |
| `competencia-desleal-como-denunciar-honduras` | "Competencia Desleal en Honduras: 6 Conductas Sancionables" → "Competencia Desleal en Honduras: Cómo Denunciar y 6 Conductas Sancionables" | "¿Cómo denunciar...?" |
| `pension-alimenticia-honduras-guia-completa` | "Pensión Alimenticia en Honduras: Cómo Solicitarla" → "Pensión Alimenticia en Honduras: Cómo Solicitarla \| Porcentajes 2026" | Incluye "porcentaje 2026" |
| `pension-alimenticia-porcentaje-honduras-2026` | "Porcentaje de Pensión Alimenticia en Honduras 2026" → "Porcentaje de Pensión Alimenticia en Honduras 2026: Cuánto se Paga por Hijo" | "¿Cuánto es la pensión...?" |
| `habeas-corpus-cuando-interponer-honduras` | "Hábeas Corpus en Honduras: Guía Completa Paso a Paso" → "Hábeas Corpus en Honduras: Cuándo Interponerlo y Cómo Funciona" | Pregunta directa |
| `pension-alimenticia-choluteca` | "Pensión Alimenticia en Choluteca, Honduras: Cómo Fijarla" → "Pensión Alimenticia en Choluteca: Cómo Fijarla y Reclamarla" | Meta más específica |

**Enlazado interno mejorado (7 posts):** Añadidas/actualizadas secciones "Temas
relacionados" con anchors descriptivos conectando clusters:
- Penal: sobreseimiento ↔ hábeas corpus ↔ querella ↔ fianza
- Familia: pensión guía ↔ porcentaje 2026 ↔ custodia ↔ divorcio
- Mercantil: competencia desleal ↔ protección marcas
- Civil: prescripción deudas ↔ querella ↔ pensión

### No modificado (justificado o externo)

- **Canibalización pensión alimenticia:** ya redirigida en Fase 1
  (next.config.ts líneas 73, 90). El post de porcentajes 2026 es de intención
  diferenciada (no se redirige).
- **Dominio Vercel redirect www→non-www:** gestionado a nivel de plataforma.
  El redirect en next.config.ts es refuerzo adicional.
- **Mobile-first/CWV:** el layout ya usa next/image, Tailwind responsive,
  `scroll-behavior: smooth` y estrategias `lazyOnload`. Sin cambios requeridos.
- **IndexNow + sitemap:** ya regenerados automáticamente en postbuild.
- **Tareas externas (no automatizables desde código):**
  1. Verificar en GSC que `http://pinedayasociadoshn.com/` desaparezca tras los
     nuevos redirects (7-14 días).
  2. Monitorear CTR de los 8 posts optimizados en 14-21 días.
  3. Solicitar re-rastreo selectivo en GSC de las URLs con posiciones 1-5 y 0 clics.
  4. Si el cluster "sobreseimiento" sigue sin clics en 30 días, considerar
     reescribir el body completo con enfoque en "diferencias" y más contenido.

### Validación

| Comando | Resultado |
|---------|-----------|
| `npm run lint` | 0 errores |
| `npm run build` | Compiled + TypeScript OK |
| `npm test` | 601/601 (21 suites) ✅ |

Backups en `auditoria-seo/backup-titles-*.json` y `auditoria-seo/backup-internal-links-*.json`.

---

## Unreleased — Corrección integral de enlaces internos, scroll de navegación y archivo mensual del blog

Auditoría y corrección completa de la navegación interna: enlaces del archivo mensual
del blog ahora funcionales, scroll-to-top centralizado en cambios de ruta, y revisión
de todos los enlaces internos del proyecto para comportamiento consistente.

### Causa raíz

- **Archivo mensual del blog**: los meses se renderizaban como `<span>` (texto plano)
  dentro de `BlogSidebar`. No existía ruta de archivo ni parámetro de filtro mensual.
  Tampoco existía función de filtrado por mes en la capa de datos.
- **Scroll en navegación**: sin protección explícita contra pérdida de scroll en
  transiciones de ruta, especialmente al usar el botón "Atrás" del navegador.
- **target="_blank"**: revisados 51 usos — los enlaces internos que abrían nueva
  pestaña estaban en el panel de administración (intranet → vista previa pública),
  caso explícitamente justificado para la UX del admin. Los enlaces externos
  (WhatsApp, redes sociales, entidades gubernamentales) mantienen `target="_blank"`.
- **Eventos bloqueadores**: ningún `preventDefault()` ni `stopPropagation()` afectaba
  a la navegación por enlaces.

### Cambios

| Archivo | Cambio |
|---------|--------|
| `components/blog/blog-sidebar.tsx` | Widget "Archivo" convertido de `<span>` a `<Link href="/blog?month=YYYY-MM">`. Los meses ahora navegan al filtro mensual con el mismo patrón que `?tag=`. |
| `lib/blog-hub.ts` | Nueva función `filterByMonth(posts, month)` que filtra posts por mes en formato `YYYY-MM`. |
| `app/(public)/blog/page.tsx` | Nuevo parámetro `?month=YYYY-MM` en `searchParams`. Filtro server-side (no indexable, mismo tratamiento SEO que `?tag=`). El H2 cambia a "Archivo: mayo 2026" cuando hay filtro activo. `rel prev/next` desactivado cuando hay filtros. |
| `components/layout/scroll-to-top.tsx` | Nuevo componente cliente que restaura scroll al inicio en cada cambio de ruta, respetando hashes (`#formulario`). |
| `app/layout.tsx` | Importado `ScrollToTop` envuelto en `<Suspense>` para compatibilidad con páginas estáticas (404, _not-found). |

### No modificado (justificado)

- Admin preview links con `target="_blank"` (intranet → público): mantienen su
  comportamiento porque son enlaces de previsualización con icono `ExternalLink`.
- Enlaces externos (WhatsApp, redes sociales, SAR, IHSS, ARSA, etc.): mantienen
  `target="_blank"` + `rel="noopener noreferrer"`.
- `app/(public)/blog/[categoria]/[slug]/page.tsx`: no requiere cambios porque
  ya usa `BlogSidebar` y `deriveArchiveMonths` que fueron actualizados.
- `BlogCard`, `PublicHeader`, `PublicFooter`: no requieren cambios — ya usan
  `next/link` correctamente sin `target="_blank"`.

### Validación

| Comando | Resultado |
|---------|-----------|
| `npm run lint` | 0 errores |
| `npm run build` | Compiled + TypeScript OK (static pages en progreso) |
| `npm test` | 601/601 (21 suites) ✅ — 0 regresiones |

### Cómo probar

1. **Archivo mensual**: navegar a `/blog`, hacer clic en cualquier mes del
   sidebar → debe filtrar a `/blog?month=YYYY-MM` mostrando solo posts de ese mes.
2. **Clic en mes sin posts**: debe mostrar EmptyState.
3. **Navegación interna**: clic en menú principal, footer, CTAs, tarjetas →
   deben abrir en la misma pestaña y posicionar arriba.
4. **Hash navigation**: `/solicitar-consulta#formulario` → debe desplazar al
   formulario.
5. **Enlaces externos**: WhatsApp, Facebook, X → deben abrir en nueva pestaña.
6. **Archivo en post**: `/blog/[categoria]/[slug]` → sidebar también muestra
   meses clicables.
7. **Botón "Atrás"**: navegar del filtro mensual al hub completo → scroll arriba.

---

### Cambios

- AGENTS.md: eliminar cifra fija de tests por descripción estable (R4 validación).
- AGENTS.md: aclarar regla editorial 600–1200 palabras guía vs 800–1000 ampliación IA (R13).
- AGENTS.md: nueva sección 10 — MCPs autorizados, orden de uso y prohibiciones (gobernanza).
- CHANGELOG.md: esta entrada.

### Validación

- `git diff -- AGENTS.md CHANGELOG.md README.md`
- `npm run lint && npm run build && npm test`

---

## Unreleased — Configuración MCP gratuita SEO

Instalación y configuración de servidores MCP gratuitos/open-source para auditoría
SEO, validación en navegador, operaciones git y trazabilidad.

### Cambios

**Nuevo — MCPs gratuitos en `opencode.jsonc`**
- `mcp-seo` (v0.3.0): auditoría SEO (meta, headings, schemas, sitemap, robots,
  performance, Lighthouse). Instalado vía `pipx`.
- `playwright`: validación en navegador real. Instalado vía
  `npx @executeautomation/playwright-mcp-server`.
- `git`: operaciones git de lectura, diff, status y trazabilidad. Instalado vía
  `pipx mcp-server-git` (2026.6.16, oficial PyPI).
- Filesystem, Postgres, Fetch, DuckDuckGo y Diag ya estaban configurados.

**Seguridad**
- Detectado y eliminado `mcp-server-git` npm v0.0.2 (paquete canario de seguridad,
  npx-confusion). Reemplazado por el oficial de PyPI.

**Documentación**
- README.md: nueva sección "MCPs gratuitos para SEO/GEO/metadatos".
- `auditoria-seo/mcp-validation-2026-06-23.md`: documento de validación completo.

**Validación**
- `npm run lint` ✅ | `npm run build` ✅ (294 páginas) | `npm test` ✅ (601 tests)
- Auditoría SEO real contra localhost:3000 con mcp-seo:
  - Score Lighthouse 89/100, 8 JSON-LD válidos, 206 URLs en sitemap
  - Home: TTFB 1592ms, LCP 1964ms, CLS 0
  - /despacho: TTFB 948ms, LCP 1368ms, CLS 0
  - /blog, /preguntas-frecuentes: reportes completos generados

## Unreleased — Auditoría SEO de indexabilidad (corrección urgente 2026-06-23)

Corrección de los hallazgos del informe SEO Bing Webmaster Tools + GSC del
2026-06-23: 183 URLs "Descubiertas: actualmente sin indexar", 1 URL indexada,
202 URLs en sitemap, 9.466 URLs enviadas por IndexNow con 0 crawled / 0 indexed,
CTR Honduras 3,06 %, 0 backlinks de calidad. Implementa fuente única de URLs
estáticas, techo de seguridad IndexNow y utilidad de auditoría SEO estática.

### Cambios

**Nuevo — `data/seo/canonical-paths.json` (fuente única de rutas estáticas)**
- Catálogo canónico de 41 rutas públicas estáticas (title, prioridad,
  change_frequency, days_ago) + metadatos (`sitemap_observed_count=202`,
  `indexnow_safety_cap=212`).
- Consumido tanto por `app/sitemap.ts` (PUBLIC_ROUTES) como por
  `scripts/submit-indexnow.mjs`. Elimina la duplicación que permitió el bug
  histórico de 9.466 URLs enviadas a Bing (7-11/06/2026, 0 crawled).

**Refactor — `app/sitemap.ts`**
- `PUBLIC_ROUTES` se deriva ahora del JSON compartido (antes era una lista
  hardcoded duplicada). Sin cambio de comportamiento del sitemap.xml
  generado (mismas URLs, prioridades y frecuencias).
- Exporta `INDEXNOW_SAFETY_CAP` para uso desde el script IndexNow.
- `THIN_POST_SLUGS` (Set con 49 slugs, mitigación rutas thin) sin cambios.

**Refactor — `scripts/submit-indexnow.mjs` (techo de seguridad)**
- Lee el catálogo del JSON compartido (no más `FULL_CATALOG` hardcoded).
- Validación **dura**: aborta con código 1 si el lote final supera
  `INDEXNOW_SAFETY_CAP` (default 212). Override vía env
  `INDEXNOW_SAFETY_CAP` para staging (no usar en prod).
- Logs ampliados: catálogo estático (nº rutas), sitemap observado, techo
  configurado, candidatas antes/después de filtro, excluidas por motivo,
  total final vs techo. Aviso preventivo si candidatas > sitemap observado.
- Eliminada la rama `readdirSync(postsDir)` (los posts viven en DB, no en
  `data/blog/posts/` desde la migración a Drizzle).
- Dry-run sigue siendo el comportamiento por defecto salvo
  `ENABLE_INDEXNOW_SUBMIT=true`.

**Nuevo — `scripts/seo-indexability-audit.mjs` (auditoría SEO estática)**
- 11 probes estáticos sobre el repositorio (no usa red ni DB):
  1. DRY `canonical-paths.json` ↔ `sitemap.ts` ↔ `submit-indexnow.mjs`.
  2. Existencia de `page.tsx` para cada ruta del catálogo (con fallback
     `[slug]` para rutas dinámicas).
  3. `THIN_POST_SLUGS` presente en sitemap (mitigación activa).
  4. Trailing slash consistente (solo `/` lo tiene).
  5. Sin rutas privadas en el catálogo IndexNow.
  6. Techo `INDEXNOW_SAFETY_CAP` > sitemap observado.
  7. robots.ts bloquea rutas privadas esperadas.
  8. Sin duplicados en el catálogo.
  9. Prioridades (0–1) y `change_frequency` válidas.
  10. Landings locales coordinadas con `app/(public)/abogados-en-{slug}`.
  11. IndexNow define techo y mensaje ABORTADO.
- Salida Markdown a stdout o `auditoria-seo/audit-<fecha>.md` con `--write`.

**Nuevo — `auditoria-seo/audit-2026-06-23.md`**
- Documento de trazabilidad con: diagnóstico aplicado, cambios técnicos,
  estado de los schemas server-side (ya completo, sin acción), riesgos
  pendientes y próximos pasos manuales externos (GBP, re-rastreo GSC,
  link building).

**Docs — README/CHANGELOG**
- README ampliado: nueva sección "IndexNow (fuente única)" con todos los
  modos, advertencia del techo de seguridad y bloque de "Auditoría SEO
  estática" con los nuevos comandos `npm run audit:seo` / `audit:seo:stdout`.
-Entry en CHANGELOG (esta).

### SEO (preservado / sin regresión)
- `LegalService` + `LocalBusiness` + `Organization` + `WebSite` + 3 `Person`
  ya se inyectaban server-side en `app/(public)/layout.tsx` (sin cambios).
- `BlogPosting` + `FAQPage` se emiten en el template de post (sin cambios).
- `BreadcrumbList` único vía `<Breadcrumbs>`, sin duplicados (sin cambios).
- Canonical, robots, sitemap.xml y `THIN_POST_SLUGS` sin cambios.
- Tests `tests/seo-protection.test.ts` (32 tests) siguen cubriendo: robots
  granulares por bot, sin directiva Host, `/_next/` no bloqueado, sitemap
  sin rutas privadas, schemas válidos, sin BreadcrumbList duplicado, FAQPage
  sanitiza HTML. `PUBLIC_ROUTES` sigue exportado desde `sitemap.ts` y
  derivado del JSON compartido — los tests no requieren cambios.

### Validación
- `node scripts/submit-indexnow.mjs --dry-run --full` → 61 URLs finales,
  aborta correctamente si se fuerza `INDEXNOW_SAFETY_CAP=5` (test manual OK).
- `node scripts/seo-indexability-audit.mjs --write` → 0 errores bloqueantes,
  0 avisos, 7 informativos. Informe en `auditoria-seo/audit-2026-06-23.md`.
- `npm run lint && npm run build && npm test` (se ejecuta tras este cambio).

### Riesgos pendientes (trabajo externo, no automatizable desde el código)
1. Verificar dominio en Bing Webmaster Tools (HTTP 403 histórico → 0 crawled).
2. Solicitar re-rastreo selectivo en GSC de las 30 URLs top con más
   impresiones (no las 183 masivas).
3. Crear/verificar Google Business Profile (NAP consistente con
   `lib/site.ts`).
4. Link building nivel 1+2 (Google Business Profile + directorios jurídicos
   + PR en medios hondureños).
5. Reescribir titles/meta de los 7-10 DB-driven blog posts con CTR bajo vía
   `npm run blog:review --aplicar-ia` (guardias R17 activas, requiere
   `DEEPSEEK_API_KEY`).
6. Ampliar los 49 posts thin vía `npm run blog:verify-fix:aplicar`
   (800-1000 palabras, sin inventar datos legales).
7. Crear el post `pension-alimenticia-porcentaje-honduras-2026` (cluster de
   14 impresiones ya descubiertas en GSC) vía admin blog API con verificación
   contra `data/codigo_trabajo.json` y el Código de Familia de Honduras.

---

## Unreleased — Rediseño del hub del blog (`/blog`) como content hub magazine

Transformación del índice del blog en un portal editorial escalable (preparado
para 300+ artículos y 20 categorías), manteniendo identidad visual, rutas, SEO
y arquitectura editorial. Sin nuevas dependencias.

### Cambios

**Nuevo: capa de datos del hub (`lib/blog-hub.ts`)**
- Derivaciones puras a partir de una sola consulta DB (`getAllPosts`):
  destacados con fallback resiliente (featured + recientes con diversidad de
  categoría), categorías con conteo ordenadas por volumen, "lecturas
  recomendadas" (heurístico determinista: featured + nº de etiquetas + recencia
  — etiquetado honesto, sin métricas de vistas inventadas), archivo por meses
  (es-HN), etiquetas, búsqueda insensible a acentos y orden Recientes/Relevantes.
- `BlogCardData` (payload ligero sin `body`) en `data/blog/types.ts` para no
  inflar el bundle cliente.

**Nuevo: componentes del hub (`components/blog/`)**
- `BlogHero` (server, H1 + estadísticas), `FeaturedPosts` (server, magazine
  1 tarjeta grande + 3 secundarias), `CategoryNavigation` (cliente, chips por
  volumen + desplegable "Más categorías" con panel flotante y cierre por
  backdrop), `BlogFilters` (cliente, orden segmentado + chips de filtros
  activos con quitar + "Limpiar filtros"), `BlogCardGrid` (presentacional),
  `EmptyState` (server, estado vacío con salidas útiles), `BlogPagination`
  (server, accesible, preserva `?tag=`), `BlogExplorer` (cliente, orquestador
  de búsqueda + filtros + orden + cuadrícula + "cargar más").
- **`BlogCard` refactorizado:** variantes `default` / `featured` / `compact`,
  client-safe (imports puros de `lib/datetime` + `data/blog/categories` para
  poder usarse en server y cliente). API compatible con la página de categoría.

**Refactor: `BlogSidebar`**
- Ahora recibe datos derivados en servidor (sin llamadas DB propias): categorías
  indexables con conteo, lecturas recomendadas, recientes, archivo por meses y
  etiquetas. Sticky en desktop.

**Reescrito: `app/(public)/blog/page.tsx`**
- Layout dos columnas (cuadrícula + sidebar), hero dedicado, sección
  destacados solo en página 1 sin tag, destacados excluidos del grid (sin
  duplicar). Dual mode: vista servidor paginada (con `rel prev/next`) cuando
  no hay filtros cliente; vista cliente con "cargar más" al buscar/filtrar/ordenar.

### SEO (preservado / sin regresión)
- Un solo `<h1>` por página (verificado en `/blog`, `/blog?page=2`,
  `/blog?tag=*`, `/blog/[categoria]`).
- Canonical, `robots` (noindex para `?tag=`), `rel prev/next`, `CollectionPage`
  JSON-LD y breadcrumbs intactos.
- Categorías siguen indexables vía `/blog/[categoria]` (enlaces del sidebar);
  el filtro rápido de categoría es cliente y no crea URLs indexables (evita
  canibalización, §5 AGENTS.md).
- Sitemap y `PUBLIC_ROUTES` sin cambios (`/blog` sigue prioridad 0.6).

### Validación
- `npm run lint` → 0 errores.
- `npm run build` → 293 páginas, TypeScript OK, 148 posts SSG prerrenderizados.
- `npm test` → 600/601 OK (1 fallo preexistente ajeno: `site.tagline` no
  contiene "Pineda y Asociados" — test sobre la home, no sobre el blog).
- Servidor de producción + `Invoke-WebRequest`:
  - `/blog` → 200, 1 H1, sección destacados, sidebar, paginación, schema.
  - `/blog?page=2` y `?page=3` → 200, 1 H1, paginación, `rel prev/next`.
  - `/blog?tag=Choluteca` → 200, 6 tarjetas (coincide con DB).
  - `/blog?tag=zzz` → 200, `EmptyState` renderizado.
  - `/blog/derecho-penal` → 200 (página de categoría sin cambios).

---

## Unreleased — llms.txt: deploy a producción + verificación completa SEO/GEO/AEO

Deploy a Vercel Production de todos los cambios de llms.txt, robots.txt,
sitemap.xml y automatización. Verificación post-deploy completa.

### Fase 2 — Revisión editorial post-auditoría sobre posts pendientes (2026-06-22)

Segunda fase manual de revisión editorial sobre los posts pendientes detectados
en los reportes `verify-fix-reporte-2026-06-22T*.md`/`.json` (14 reportes, 136
slugs únicos). Continúa la fase 1 (11 posts críticos) atacando los posts que
seguían con problemas verificables tras las correcciones automáticas previas.

**Inventario y clasificación (136 slugs en reportes):**
- Fase 1 (ya corregidos): 11.
- Pendientes: 125 (Prioridad 1: 44, Prioridad 2: 78, Prioridad 3: 3).
- **Verificación de estado actual:** de los 44 prio1, **16 ya estaban limpios**
  (corregidos por `blog:verify-fix --aplicar` y fases anteriores) y **28
  seguían con problemas verificables** (anti-plantilla + titles truncados).

**Hallazgo clave:** las fases automáticas previas resolvieron los problemas
graves (0 decretos inventados residuales, 0 Art. sospechosos, 0 thin <600 —
todos expandidos a 754–2147 palabras). El problema restante era **repetición
anti-plantilla estructural**: las secciones que `blog:verify-fix` añadió
sistemáticamente ("Explicación en lenguaje llano", "en términos sencillos",
etc.) se repetían idénticas en 58–138 posts.

**Correcciones aplicadas:**
| Lote | Posts | Acción |
|------|-------|--------|
| Prio1 anti-plantilla H2 | 21 | Diversificación de H2 "Explicación en lenguaje llano" con 6 variantes temáticas rotadas |
| Prio1 titles truncados | 3 | Titles completados (`ejecucion-hipotecaria`, `contratos-confidencialidad`, `despido-empleados-publicos`) |
| Frases introductorias blog-wide | 88 | Diversificación de 4 frases repetidas ("en lenguaje llano/sencillo/simple/palabras sencillas") con variantes rotadas |

**Reducción del patrón anti-plantilla (frases introductorias):**
- "en lenguaje llano": 58 → 8 posts
- "Explicación en lenguaje llano": 54 → 5 posts
- "en términos sencillos": 52 → 0 posts
- "en términos simples": 19 → 0 posts
- "En palabras sencillas": 9 → 1 post

**Pendiente documentado (no resuelto por alcance):** los nombres de sección
estándar ("Temas relacionados" 143x, "Preguntas frecuentes" 127x, "Marco legal"
115x, "Ejemplo práctico" 106x, "Base legal" 90x, "Errores frecuentes" 77x)
siguen repetidos por ser convenciones útiles para el lector. Su diversificación
total requeriría reescritura editorial humana de ~1000 encabezados y escapa al
alcance de esta fase. Se documenta como riesgo pendiente.

**Anti-alucinaciones:** verificación de 6 decretos inventados conocidos
(12-99-E, 26-94, 82-2004, 104-93, 35-2014, 29-2010) → 0 residuales. Sin
nuevas afirmaciones legales introducidas (solo sustitución de encabezados y
frases introductorias).

**Validación:**
- Bug markers residuales: 0
- Posts con H1 en body: 0
- Desbalance HTML: 0
- Enlaces rotos internos: 0
- `npm run lint`: ✅ 0 errores
- `npm run build`: ✅ 293/293 páginas

### Arquitectura integral de enlaces internos blog↔servicios↔locales (2026-06-22)

Cierre de la arquitectura completa de enlaces internos a nivel web, más allá
del saneamiento de enlaces rotos. El objetivo: cada post conecta con su
servicio pilar, un post complementario del mismo clúster y (cuando aplica)
una página local; cada servicio recibe inbound desde su clúster de posts.

**Estado antes (post-saneamiento) → después (post-arquitectura):**

| Métrica | Antes | Después |
|---------|-------|---------|
| Posts con ≥1 enlace interno | 132 (89%) | **148 (100%)** |
| Posts con enlace a servicio pilar | 22 (15%) | **119 (80%)** |
| Posts con enlace a página local | 18 (12%) | **99 (67%)** |
| Posts huérfanos (0 enlaces internos) | 16 | **0** |
| Enlaces rotos internos | 0 | **0** |
| Servicios pilares sin inbound | 7 | **0** (los 13 principales reciben inbound) |

**Trabajo aplicado:**
- **127 posts** procesados: 45 secciones "Temas relacionados" creadas + 82
  enriquecidas con enlace al servicio pilar de su categoría.
- Cada post ahora enlaza a: (a) servicio pilar de su área, (b) 1 post
  complementario del mismo clúster, (c) página local cuando la intención es
  contratar abogado en Nacaome/Choluteca/San Lorenzo (no en hondurenos-en-espana).
- **Anchors naturales y variados** (3 variantes por categoría, rotación por
  índice de post): "defensa penal en Honduras", "asesoría mercantil para
  empresas", "abogados en San Lorenzo", etc. Sin anchors genéricos.
- **5 frases introductorias rotadas** para evitar bloques anti-plantilla.

**Clústeres temáticos conectados (14):** Penal, Laboral, Familia, Civil y
notarial, Mercantil/empresarial, Bancario/financiero, Administrativo,
Aduanero/comercio exterior, Tributario, Ambiental, Extranjería,
Propiedad intelectual, Regulación sanitaria, Conciliación y arbitraje.
Migración/hondureños-en-espana como clúster propio (no mezclado con locales HN).

**Servicios que ahora reciben inbound desde el blog (antes 0):**
`/servicios-juridicos/derecho-civil-y-notarial` (16x),
`/servicios-juridicos/derecho-mercantil-empresarial` (7x),
`/servicios-juridicos/derecho-bancario-y-financiero` (6x),
`/servicios-juridicos/derecho-administrativo-y-servicio-civil` (5x),
`/servicios-juridicos/derecho-aduanero-y-comercio-exterior` (7x),
`/servicios-juridicos/regulacion-sanitaria` (4x),
`/servicios-juridicos/ambiental-regulatorio` (5x).

**Páginas de servicio y locales (no modificadas, ya estaban bien diseñadas):**
- `/servicios-juridicos/[slug]`: ya renderiza automáticamente 3 posts
  relacionados de su categoría vía `getPostsByCategory` + "Áreas relacionadas"
  + CTA a despacho. Mapeo `SERVICE_TO_BLOG_CATEGORY` cubre los 14 servicios.
- `/abogados-en-nacaome|choluteca|san-lorenzo`: ya muestran `<BlogHighlights>`
  con 6 posts locales relevantes + CTA a `/blog`.
- `/hondurenos-en-espana`: ya muestra `<BlogHighlights>` con 6 posts del clúster.
- `/solicitar-consulta`: página de conversión pura (sin blog, correcto).

**Bug detectado y corregido:** la v1 del script insertó literalmente
`${intro} ${links.join(` (template literal no evaluado) en 78 posts.
Detectado por validación, revertido desde backups `backup-arch-*` y
regenerado correctamente en v2. Validación post-fix: 0 bug markers.

**Seguridad y trazabilidad:**
- Backups previos por post en `auditoria-blog/backup-arch-*-<ts>.json`
  (127 archivos) y `backup-arch2-*` (78 archivos de la corrección v2).
- Sin alteración de slugs, URLs, categorías ni fechas. Solo `body` e
  `updated_at` modificados.
- Sin cambios en código `.tsx`, `next.config.ts`, schema ni rutas.
- Validación: `npm run lint` ✅ 0 errores; `npm run build` ✅ 293/293 páginas;
  re-audit HTML ✅ 0 rotos / 0 bug markers / 0 desbalances.

### Auditoría y mejora de enlaces internos SEO/GEO (2026-06-22)

Auditoría completa de la arquitectura de enlaces internos del blog y refuerzo
del interlinking blog ↔ servicios ↔ páginas locales, sin automatizaciones
masivas. Trabajo selectivo, verificable, con backup previo por post.

**Diagnóstico inicial:**
- 195 URLs internas referenciadas en 148 posts publicados.
- **43 enlaces a posts inexistentes** (404 reales o anchors inventados por IA
  en bodies) detectados en 47 posts.
- **16 enlaces a slugs con redirect 301 activo** (subóptimos: desperdician
  autoridad en la redirección).
- **1 enlace con categoría incorrecta** en la URL (`/derecho-mercantil/...`
  cuyo post real está en `derecho-civil`).
- 0 anchors vacíos.
- 27 posts huérfanos (sin enlaces internos salientes hacia servicios/posts).

**Correcciones aplicadas:**

| Categoría | Posts | Enlaces |
|-----------|-------|---------|
| Enlaces rotos sustituidos por equivalente real verificado | 49 | 77 |
| Enlaces rotos sin equivalente → eliminados (texto plano) | 1 | 1 |
| Enlaces con redirect 301 → actualizados a destino final | (incluidos arriba) | (incluidos) |
| Interlinking nuevo en posts huérfanos (sección "Temas relacionados") | 11 | 33 |

**Clústeres temáticos reforzados (12):** Penal, Laboral, Familia, Civil y
notarial, Mercantil/empresarial, Tributario, Aduanero/comercio exterior,
Migración y hondureños en España, Ambiental, Bancario/consumidor financiero,
Conciliación y arbitraje, Cobertura local (Nacaome, Choluteca, San Lorenzo).

Cada clúster ahora conecta: página pilar de servicio → posts de apoyo →
página local cuando la intención es transaccional. Los posts huérfanos
reforzados enlazan a su servicio pilar + 2 posts complementarios del mismo
clúster con anchors naturales y variados.

**Validación de URLs destino:** los 46 slugs destino (servicios, locales y
posts relacionados) se verificaron contra DB antes de aplicar; los 16 destinos
de redirect se confirmaron contra `next.config.ts`. Resultado post-aplicación:
**0 enlaces a posts inexistentes** restantes (re-audit confirmado).

**Seguridad y trazabilidad:**
- Backups previos por post en `auditoria-blog/backup-links-<slug>-<ts>.json`
  (49 archivos) y `backup-interlink-<slug>-<ts>.json` (11 archivos).
- Sin alteración de slugs, URLs, categorías ni fechas. Solo se modificaron
  `body` e `updated_at` de los posts afectados.
- Sin cambios en `next.config.ts`, redirects, schema ni rutas públicas.
- Validación: `npm run lint` ✅ 0 errores; `npm run build` ✅ 293/293 páginas.

### Revisión editorial-jurídica manual post-auditoría (2026-06-22)

Corrección selectiva y quirúrgica de 11 posts del blog marcados por los
reportes de auditoría (`auditoria-blog/verify-fix-reporte-2026-06-22T*.md`)
con problemas verificables: alucinaciones legales, thin content, discrepancias
fácticas, repetición anti-plantilla, metadatos deficientes y estructura
editorial incompleta. Trabajo manual post-ejecución de `blog:verify-fix`,
sin procesos masivos.

**Categorías de mejora aplicadas:**

| Categoría | Posts afectados |
|-----------|-----------------|
| Reducción de alucinaciones legales | `clausulas-abusivas-contratos-como-detectar-honduras` (atribución incorrecta al Art. 90 Constitución neutralizada), `despido-laboral-honduras-derechos` (cita del Art. 118 CT corregida a Art. 110 CT verificado), `derechos-laborales-basicos-honduras` (edad mínima laboral corregida de 16 a 14 años según Art. 32 CT) |
| Corrección factual con fuente canónica | Verificación contra `data/codigo_trabajo.json`, `data/codigo_civil.json`, `data/codigo_comercio.json`, `data/articulos_constitucion.json` |
| Expansión de thin content (<600 → 800–1150 palabras) | `costos-honorarios-abogados-como-funcionan-honduras`, `nacionalidad-espanola-para-hondurenos-residencia-plazos`, `reagrupacion-familiar-hondurenos-espana`, `arraigo-social-laboral-hondurenos-espana`, `tributar-espana-bienes-guia`, `constituir-empresa-guia-paso-a-paso-honduras` |
| Mejora anti-plantilla (eliminación de bloques repetidos) | `clausulas-abusivas-contratos-como-detectar-honduras`, `isv-impuesto-venta-tasas-obligaciones-honduras` (frases "¿Necesita ayuda legal en la zona sur de Honduras?", "solicite una evaluación inicial de su caso") |
| Optimización SEO/GEO (title/meta no truncados, H1 único) | Todos los 11 posts: titles completados, meta descriptions ≤155 chars, eliminación de H2 duplicado al inicio (la plantilla ya renderiza el title como H1) |
| Revisión de metadatos | Title y meta_description reescritos en los 11 posts para evitar truncamiento en SERP y eliminar meta_title redundante |

**Listado completo de posts revisados y modificados:**

1. `clausulas-abusivas-contratos-como-detectar-honduras` (derecho-civil)
2. `costos-honorarios-abogados-como-funcionan-honduras` (práctica-legal)
3. `nacionalidad-espanola-para-hondurenos-residencia-plazos` (hondurenos-en-espana)
4. `reagrupacion-familiar-hondurenos-espana` (hondurenos-en-espana)
5. `arraigo-social-laboral-hondurenos-espana` (hondurenos-en-espana)
6. `tributar-espana-bienes-guia` (hondurenos-en-espana)
7. `isv-impuesto-venta-tasas-obligaciones-honduras` (tributario)
8. `constituir-empresa-guia-paso-a-paso-honduras` (práctica-legal)
9. `despido-laboral-honduras-derechos` (derecho-laboral)
10. `servicios-legales-empresas-sur-honduras` (derecho-civil)
11. `derechos-laborales-basicos-honduras` (derecho-laboral)

**Seguridad y trazabilidad:**

- Backups previos en `auditoria-blog/backup-manual-<slug>-<timestamp>.json`
  para cada uno de los 11 posts modificados.
- Sin alteración de slugs, URLs, categorías, fechas ni tags (R7).
- Sin introducción de nuevas dependencias ni cambios en API/schema/rutas.
- Validación: `npm run lint` ✅ 0 errores; `npm run build` ✅ 293/293 páginas;
  verificación de balance HTML y conteo de palabras por post ✅.

### Deploy


| Comando | Resultado |
|---------|-----------|
| `vercel deploy --prod` | ✅ Build exitoso (293 páginas, 48s TypeScript, 7.9s SSG) |
| `https://www.pinedayasociadoshn.com/llms.txt` | HTTP 200 — Content-Type: text/plain, 9120 bytes, 106 líneas |
| `https://www.pinedayasociadoshn.com/robots.txt` | HTTP 200 — reglas granulares desplegadas, Host eliminado |
| `https://www.pinedayasociadoshn.com/sitemap.xml` | HTTP 200 — 43,904 bytes, todas las URLs públicas indexables |

### Verificaciones post-deploy (10/10)

| # | Prueba | Resultado |
|---|--------|-----------|
| 1 | llms.txt HTTP 200 | ✅ 200 OK |
| 2 | Content-Type text/plain | ✅ `text/plain; charset=utf-8` |
| 3 | robots.txt HTTP 200 | ✅ 200 OK |
| 4 | robots.txt NO bloquea llms.txt | ✅ Permitido por proxy matcher (.*\\.txt excluido) |
| 5 | sitemap.xml HTTP 200 | ✅ 200 OK |
| 6 | Sin URLs de intranet en llms.txt | ✅ Solo en sección "Contenido excluido" |
| 7 | /intranet/ bloqueada sin auth | ✅ Proxy 307 → /intranet/login |
| 8 | /login eliminado | ✅ 404 Not Found |
| 9 | URLs públicas responden 200 | ✅ 7/7: home, despacho, servicios, penal, blog, FAQ, consulta |
| 10 | AI bots acceden a llms.txt | ✅ 7/7 bots simulados obtienen 200 |

### Simulación de accesos de bots IA a llms.txt

| User-Agent | Status |
|------------|--------|
| Googlebot | ✅ 200 |
| Google-Extended | ✅ 200 |
| Bingbot | ✅ 200 |
| OAI-SearchBot | ✅ 200 |
| ChatGPT-User | ✅ 200 |
| PerplexityBot | ✅ 200 |
| ClaudeBot | ✅ 200 |

### Estándares y convenciones aplicados

| Estándar/Convención | Estado |
|---------------------|--------|
| `llmstxt.org` (propuesta) | ✅ H1 + blockquote resumen + secciones con enlaces absolutos + exclusiones + sitemap |
| `robots.txt` (RFC 9309) | ✅ Sin `Host:`, reglas granulares, sitemap declarado |
| `Sitemap XML` | ✅ 293 URLs públicas indexables |
| Schema.org Organization | ✅ LegalService + LocalBusiness con geo |
| Schema.org WebPage | ✅ 10 páginas con WebPage propio |
| Schema.org ItemList | ✅ Hub de servicios con 14 ítems |
| Schema.org BlogPosting | ✅ Posts individuales |
| OpenGraph / Twitter Cards | ✅ `twitter:creator`, `twitter:site`, OG images |
| SEO local (NAP + geo) | ✅ 3 landings locales |
| AI crawler allow rules | ✅ GPTBot, ChatGPT-User, OAI-SearchBot, PerplexityBot, ClaudeBot, Claude-User, anthropic-ai permitidos con acceso público |
| X-Robots-Tag | ✅ `index, follow` público / `noindex, nofollow` en intranet |
| CSP / HSTS / Security Headers | ✅ Sin regresión |

### Automatización

- `scripts/generate-llms-txt.mjs`: regenera `public/llms.txt` desde fuentes canónicas.
- Integrado en `postbuild`: se ejecuta automáticamente tras cada build, antes de IndexNow.
- Comandos: `npm run llms:generate` (regenerar), `npm run llms:dry` (previsualizar).

### Estado
`IMPLEMENTADO`, `VALIDADO` y `DESPLEGADO` a producción. Backup en `.backups/`.

**Hallazgo preexistente (no causado por este cambio):** las cabeceras `X-Robots-Tag` de la intranet (`/intranet/:path*`) no se reflejan consistentemente en producción debido a un posible edge caching de Vercel. Verificar tras propagación de caché global. La protección real de la intranet es el proxy JWT middleware, no las cabeceras.

---

## Unreleased — SEO/GEO/AEO: metadatos, schemas WebPage/ItemList, Twitter creator y corrección de meta descriptions

Auditoría y optimización completa de metadatos SEO/GEO/AEO de todas las URLs públicas
indexables (51 páginas estáticas + ~159 posts + 20 categorías + 7 subáreas penales,
3 subáreas migrantes, 14 servicios detallados). Se corrigieron meta descriptions con
HTML sin sanitizar, se añadieron schemas WebPage a 10 páginas que carecían de schema
propio, se incorporó ItemList al hub de servicios, se añadió referencia a Twitter
creator (@Danilo_Pineda_M) en el layout público global y se normalizaron OG images.

### Cambios realizados

| Archivo | Cambio |
|---------|--------|
| `app/(public)/layout.tsx` | Añadido `twitter.creator` y `twitter.site` con @Danilo_Pineda_M |
| `app/(public)/servicios-juridicos/[slug]/page.tsx` | Corregida meta description: strip HTML de `area.descripcion` antes de usarla en description/OG/Twitter (evita `&lt;strong&gt;` en SERP) |
| `app/(public)/servicios-juridicos/page.tsx` | Añadido schema ItemList para las 14 tarjetas de servicios del hub |
| `app/(public)/como-llegar/page.tsx` | Añadido schema WebPage JSON-LD (antes no tenía ningún schema propio) |
| `app/(public)/aviso-legal/page.tsx` | Añadido schema WebPage JSON-LD |
| `app/(public)/politica-privacidad/page.tsx` | Añadido schema WebPage JSON-LD |
| `app/(public)/politica-cookies/page.tsx` | Añadido schema WebPage JSON-LD |
| `app/(public)/politica-editorial/page.tsx` | Añadido schema WebPage JSON-LD |
| `app/(public)/terminos/page.tsx` | Añadido schema WebPage JSON-LD |
| `app/(public)/disclaimer/page.tsx` | Añadido schema WebPage JSON-LD |
| `components/marketing/landing-local.tsx` | Añadido schema WebPage a las 3 landings locales (Nacaome, Choluteca, San Lorenzo) |

### Detalle técnico

- **HTML en meta descriptions**: las descripciones de áreas de práctica (`data/areas-juridicas.ts`) contienen etiquetas `<strong>` que se traspolaban literalmente a meta tags. Se añadió función `stripHtml()` en `servicios-juridicos/[slug]/page.tsx` que elimina tags y decodifica entidades antes de usarlas en meta description, OG y Twitter.
- **WebPage schema**: 10 páginas que antes solo tenían los schemas globales del layout (LegalService, Organization, WebSite, 3×Person) ahora también tienen un WebPage con `@id`, `name`, `description`, `inLanguage`, `isPartOf` y `about` propios, mejorando la granularidad del grafo de conocimiento.
- **ItemList**: el hub de servicios jurídicos ahora expone un schema ItemList con todas las 14 áreas de práctica, cada una con su posición y URL, mejorando la comprensión semántica de la rejilla de servicios por parte de Google.
- **Twitter creator**: se añadió `twitter.creator` y `twitter.site` al layout público (`@Danilo_Pineda_M`), mejorando la atribución de marca en tarjetas de Twitter/X.
- **Consistencia OG**: las páginas de servicio que carecían de OG image especializada (`/og/laboral.webp`, etc.) ya estaban correctamente mapeadas.

### Inventario de URLs públicas auditadas

| Tipo | Cantidad |
|------|----------|
| Páginas estáticas (home, servicios, despacho, blog hub, FAQ, solicitar-consulta, como-llegar, legales, landings) | 25 |
| Subpáginas de servicios (`/servicios-juridicos/[slug]`) | 14 |
| Subpáginas de derecho penal (`/derecho-penal/[slug]`) | 7 |
| Subpáginas de hondureños en España (`/hondurenos-en-espana/[slug]`) | 3 |
| Categorías de blog (`/blog/[categoria]`) | 20 |
| Posts de blog (`/blog/[categoria]/[slug]`) | ~147 publicados |
| **Total URLs indexables** | **~216** |

### URLs excluidas
- `/intranet/*`, `/api/*`, `/admin/*`, `/calculadora/*`, `/casos/*`, `/cp/*`, `/delitos/*`, `/atajos/*`, `/preview/*` — zonas privadas
- `/login` — ruta eliminada
- `/404`, `/500`, `/_not-found` — páginas de error
- Parámetros no canónicos, staging y dominios de preview

### Validación

| Comando | Resultado |
|---------|-----------|
| `npm run lint` | 0 errores |
| `npx tsc --noEmit` | 0 errores |
| `npm run build` | Compiled successfully (293 páginas) |
| `npm test` | 591/591 (21 suites) ✅ |
| `npm test -- tests/seo-protection.test.ts` | 32/32 ✅ |
| `npm run llms:dry` | llms.txt regenerado, 106 líneas, sin URLs privadas |
| Verificación: intranet no incluida en metadatos | ✅ Confirmado — ningún schema apunta a rutas `/intranet/`, ninguna URL privada en sitemap |

### Estado
`IMPLEMENTADO` y `VALIDADO` (lint/build/test). No se requirió backup de DB (cambios exclusivamente en código fuente).

### OG images específicas añadidas
Se generaron 5 nuevas OG images (1200×630, .webp) desde assets originales en `docs/imagenes/`:

| OG image | Fuente | Páginas que la usan |
|----------|--------|-------------------|
| `/og/faq.webp` | `docs/imagenes/faq.jpg` (5843×3901) | `/preguntas-frecuentes` |
| `/og/migracion.webp` | `docs/imagenes/honduras-espana.jpg` (3161×2107) | `/hondurenos-en-espana`, `/hondurenos-en-espana/[slug]` |
| `/og/nacaome.webp` | `docs/imagenes/Nacaome.jpg` (516×387) | `/abogados-en-nacaome` |
| `/og/choluteca.webp` | `docs/imagenes/Choluteca.jpg` (677×453) | `/abogados-en-choluteca` |
| `/og/san-lorenzo.webp` | `docs/imagenes/San Lorenzo.jpg` (1280×720) | `/abogados-en-san-lorenzo` |

**Nota:** `Nacaome.jpg` y `Choluteca.jpg` tenían resolución inferior a 1200×630 y se escalaron. Para calidad óptima, reemplazar con assets ≥1200×630.

**Nota:** `/solicitar-consulta` y páginas legales mantienen OG genérica (`/og-image.webp`) con el logo del bufete (fondo azul marino #0B1B3D).

### OG image genérica reemplazada por el logo corporativo
- `public/og-image.webp` (1200×630) y `public/og-image.png` (1200×630) se regeneraron desde `docs/imagenes/logo.png` con fondo navy, reemplazando la imagen genérica anterior (1600×1067).
- Referencia en `app/layout.tsx` actualizada de `.png` a `.webp`.
- Fallback en `blog/[categoria]/[slug]/page.tsx` y `servicios-juridicos/[slug]/page.tsx` actualizado a `.webp`.

---

## Unreleased — limpieza de rutas obsoletas (admin, calculadora, cp, delitos, login) consolidadas en /intranet/

Eliminación de páginas y rutas que ya no existen como endpoints independientes.
Todo el contenido privado (admin, calculadora, casos, cp, delitos, atajos,
preview) vive exclusivamente bajo `/intranet/`.

### Rutas eliminadas

- **`app/login/page.tsx`** — redirigía a `/intranet/login`. Eliminado porque
  `/intranet/login` ya existe y el proxy edge maneja la redirección de usuarios
  no autenticados. El acceso directo a `/login` ahora devuelve 404.
- **`/admin/`, `/calculadora/`, `/casos/`, `/cp/`, `/delitos/`, `/atajos/`,
  `/preview/`** — ya no existían como rutas independientes. Limpieza de
  referencias en robots.txt, next.config.ts, llms.txt y script generador.

### Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `app/login/page.tsx` | **Eliminado** — redirect stub obsoleto |
| `app/login/` | **Eliminado** — directorio vacío |
| `app/robots.ts` | Eliminado `/login` de `blockPrivate` (la ruta ya no existe) |
| `next.config.ts` | Eliminada regla X-Robots-Tag para `/login` (ruta eliminada) |
| `public/llms.txt` | Exclusiones simplificadas: solo `/intranet/` cubre toda zona privada |
| `scripts/generate-llms-txt.mjs` | Exclusiones simplificadas: mismo cambio que llms.txt |
| `tests/seo-protection.test.ts` | Eliminado `/login` del test de bloqueo (ya no es ruta) |

### Validación

| Comando | Resultado |
|---------|-----------|
| `npm run lint` | 0 errores |
| `npm test -- tests/seo-protection.test.ts` | 32/32 ✅ |
| `npm run llms:dry` | Output correcto, 106 líneas |
| Verificación: `/login` ya no redirige | ✅ Página eliminada, proxy devuelve 404 |

### Estado
`IMPLEMENTADO` y `VALIDADO` (lint/test). Backups en `.backups/`.

---

## Unreleased — llms.txt: creación, optimización y automatización para asistentes IA

Implementación del archivo `llms.txt` siguiendo el estándar `llmstxt.org` para
guiar a sistemas de IA y asistentes de búsqueda hacia el contenido público
canónico del sitio, excluyendo toda zona privada.

### llms.txt (`public/llms.txt`) — nuevo

- **Optimización completa**: archivo reescrito con estructura clara (sitio oficial,
  áreas de práctica, blog, páginas legales, contenido excluido, sitemap, política
  técnica).
- **56 URLs públicas incluidas**: inicio, despacho, servicios (14 áreas), derecho
  penal (7 subáreas), hondureños en España (3 subáreas), blog (20 categorías),
  landings SEO local (3), páginas legales (6), solicitar consulta, cómo llegar.
- **Exclusiones estrictas documentadas**: `/intranet/`, `/api/`, `/admin/`,
  `/login`, `/calculadora/`, `/casos/`, `/cp/`, `/delitos/`, `/atajos/`,
  `/preview/`, subdominio intranet no existente, parámetros no canónicos.
- **Restricciones de uso claras**: el archivo indica que no constituye asesoría
  legal, que las herramientas internas son privadas, y que el contenido es
  meramente informativo.
- **Enlace al sitemap**: referencia directa a `sitemap.xml`.

### Script de automatización (`scripts/generate-llms-txt.mjs`) — nuevo

- Script autónomo que regenera `public/llms.txt` a partir de fuentes canónicas
  (misma taxonomía de rutas que `app/sitemap.ts`).
- **Integración en postbuild**: se ejecuta automáticamente tras cada build
  antes del envío a IndexNow.
- **Modo dry-run**: `npm run llms:dry` para previsualizar cambios sin escribir.
- **Modo manual**: `npm run llms:generate` para regeneración bajo demanda.

### Seguridad — intranet protegida, sin filtraciones

- Verificado: ninguna URL de intranet aparece en `llms.txt`.
- Verificado: `robots.txt` sigue bloqueando `/intranet/`, `/api/` y rutas
  privadas para todos los bots (incluyendo asistentes IA).
- Verificado: `sitemap.xml` no incluye rutas privadas.
- Las exclusiones del `llms.txt` son consistentes con `robots.txt` y la
  configuración de `next.config.ts`.

### Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `public/llms.txt` | Reescrito con 113 líneas (antes 65). 56 URLs públicas documentadas. |
| `scripts/generate-llms-txt.mjs` | Nuevo — script de generación automática. |
| `package.json` | Nuevos scripts `llms:generate`, `llms:dry`; `postbuild` encadena generación. |
| `CHANGELOG.md` | Esta entrada. |
| `README.md` | Sección llms.txt añadida. |

### Validación

| Comando | Resultado |
|---------|-----------|
| `npm run lint` | 0 errores |
| `npm test` | 568/568 (21 suites) ✅ |
| `scripts/generate-llms-txt.mjs --dry-run` | Output correcto, 113 líneas |
| `scripts/generate-llms-txt.mjs` | Archivo escrito correctamente |
| Verificación manual llms.txt | Sin URLs de intranet, sin rutas privadas |
| Verificación robots.txt | Intacto, bloqueo de intranet preservado |

### Estado
`IMPLEMENTADO` y `VALIDADO` (lint/test/build). Backups en `.backups/`.

---

## Unreleased — SEO/seguridad: robots.txt granulado, eliminado Host, intranet reforzada

Configuración SEO/seguridad de la raíz del sitio siguiendo criterio equilibrado:
permitir buscadores legítimos y asistentes IA útiles, bloquear scrapers/bots
agresivos y proteger intranet a nivel servidor.

### robots.txt (app/robots.ts) — cambios estructurales

- **Eliminada directiva `Host`** (`host: site.url`). Bing la marca como no
  válida/no recomendada. La directiva Host no forma parte del estándar moderno
  de robots.txt (RFC 9309). La canonicalización se gestiona vía redirecciones
  301, canonical tags y configuración de Vercel/dominio.
- **Reglas granulares por user-agent** (antes: una sola regla `*`). Ahora 21
  reglas:
  - **5 buscadores principales**: Googlebot, Googlebot-Image, Bingbot,
    DuckDuckBot, Applebot → `Allow: /`, `Disallow: /intranet/`.
  - **7 bots IA con valor GEO**: GPTBot, ChatGPT-User, OAI-SearchBot,
    PerplexityBot, ClaudeBot, Claude-User, anthropic-ai → `Allow: /`,
    `Disallow: /intranet/`.
  - **8 scrapers/bots bloqueados**: Bytespider, CCBot, Meta-ExternalAgent,
    Meta-ExternalFetcher, Amazonbot, ImagesiftBot, omgili, omgilibot →
    `Disallow: /`.
  - **Regla `*` comodín**: conserva todos los `Allow` explícitos previos
    (`/_next/`, `/_next/static/`, `/_next/image`, `/images/`, `/fonts/`,
    `/*.js$`, `/*.css$`, `/*.woff2$`, `/*.png$`, etc.) y bloquea
    `/intranet/`, `/api/`, `/login` y páginas de error.

### Protección de intranet

- **Cabeceras X-Robots-Tag reforzadas** en `next.config.ts`: `/intranet/` y
  `/intranet` ahora emiten `noindex, nofollow, noarchive, nosnippet, noimageindex`
  (antes solo `noindex, nofollow, noarchive`). Añadida regla explícita para
  `/intranet` (sin trailing slash).
- **Protección servidor**: `proxy.ts` (middleware edge) ya redirecta usuarios
  no autenticados a `/intranet/login` con 307. No hay Apache/Nginx — todo el
  tráfico pasa por Vercel Edge Network + Next.js middleware.
- **Sin subdominio intranet separado**: la intranet vive bajo `/intranet/` en
  el mismo dominio. No existe `intranet.pinedayasociadoshn.com` ni registros
  DNS asociados. No requiere configuración adicional.
- **Enlace público único**: header → `rel="nofollow"` a `/intranet/admin`.
  Verificado: no hay otros enlaces públicos a intranet.
- **Sitemap**: verificado — ninguna URL de intranet aparece en `PUBLIC_ROUTES`.

### Tests actualizados (seo-protection.test.ts)

- De 25 → 32 tests. Nuevas aserciones:
  - `host` debe ser `undefined` (eliminado).
  - Reglas específicas para Googlebot, Bingbot, GPTBot, ClaudeBot,
    PerplexityBot, CCBot, Bytespider con allow/disallow correctos.
  - Test anterior "NO bloquea bots de IA" reemplazado por verificaciones
    específicas de cada bot.

### Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `app/robots.ts` | Reglas granulares, eliminado `host`, 21 user-agents |
| `tests/seo-protection.test.ts` | 7 tests nuevos, actualizados asserts |
| `next.config.ts` | X-Robots-Tag más restrictivo en `/intranet/` |

### Validación

| Comando | Resultado |
|---------|-----------|
| `npm run lint` | 0 errores |
| `npm run build` | Compiled successfully (294 páginas) |
| `npm test` | 556/556 (21 suites) — **32 tests SEO protection** |

### Estado
`IMPLEMENTADO` y `VALIDADO` (lint/build/test). Backups en `.backups/`.

---

## Unreleased — SEO: corrección de bloqueo de rastreo de recursos Next.js en robots.txt (GSC)

Google Search Console reportaba "No se puede cargar el recurso: bloqueado por
robots.txt" para **29/29 recursos** de la home (`/_next/static/chunks/*.js`,
CSS, fuentes `.woff2` en `/_next/static/media/` e imágenes en
`/_next/image?url=...`), impidiendo a Googlebot renderizar la página y evaluar
el contenido visual. Corregido con `Allow` explícitos en `robots.txt`.
Validado con `npm run lint && npm run build && npm test` (430 tests, 0 errores).

### feat: Script de verificación de datos legales + corrección IA del blog (`blog:verify-fix`)

Nuevo script `scripts/blog-verify-fix.ts` que aborda el problema de artículos
del blog generados por IA con información legal potencialmente falsa.

**3 fases por artículo:**
1. **Extracción y verificación de claims legales** (determinista): escanea el
   body HTML en busca de referencias a artículos del CP/Constitución, penas,
   nombres de delitos y decretos. Cruza contra `data/delitos.json` (483 delitos,
   100% verificados), `data/articulos_cp.json` (635+ artículos) y
   `data/articulos_constitucion.json` (378 artículos). Genera reporte de
   discrepancias fácticas.
2. **Corrección con DeepSeek**: envía el artículo + reporte de discrepancias
   al modelo. El prompt obliga a SOLO corregir datos objetivamente falsos,
   mantener estructura e intención original, expandir a 800-1000 palabras
   usando solo información del propio artículo, y PROHIBE inventar datos legales.
3. **Normalización mecánica**: mismas correcciones idempotentes de
   `normalizar-blog.ts` (H1→H2, CTAs duplicados, whitespace, títulos largos).

**CLI:**
- `npm run blog:verify-fix` — dry-run (fact-check + IA + mecánico)
- `npm run blog:verify-fix:aplicar` — aplica cambios en DB
- `--slug`, `--limit`, `--offset`, `--no-ai`, `--solo-verificar`

**Seguridad:** dry-run por defecto, backup previo, sanitización HTML, guardia
body <50 palabras, API key de `process.env`, modelo configurable vía
`DEEPSEEK_MODEL`.

### Diagnóstico
- **Causa raíz:** el `robots.txt` de producción (`app/robots.ts`, rama
  `site.noindex=false`) NO contenía un `Disallow: /_next` explícito — `/_next/`
  quedaba técnicamente permitido por el `Allow: /` genérico. El informe de GSC
  era un **estado establo**: Google había cacheado un `robots.txt` de una
  versión anterior (fase `NEXT_PUBLIC_NOINDEX=true`, que emite `Disallow: /`
  para `*`) en su último render y no lo había re-fetcheado.
- **Proxy** (`proxy.ts`): el matcher **ya excluye** `_next/static|_next/image`
  (no los bloquea). Sin cambios.
- **Headers** (`next.config.ts`): los assets estáticos solo reciben
  `Cache-Control: public, immutable`; la regla default aplica
  `X-Robots-Tag: index, follow` (sin `noindex`). Sin cambios.
- **Assets reales:** verificadas 16 imágenes en `/public/images/services/`,
  7 en `/penal/`, 6 en `/corporate/`, 179 covers en `/blog/`. Sin referencias
  rotas ni problemas de mayúsculas/minúsculas. Las fuentes se autohospedan vía
  `next/font` bajo `/_next/static/media/` (cubiertas por `Allow: /_next/`).

### Cambios aplicados
- **`app/robots.ts`** (rama producción): el `allow: '/'` pasa a ser un array
  con `Allow` explícitos para que el tester de robots.txt de GSC marque cada
  recurso individual como permitido:
  - `/_next/`, `/_next/static/`, `/_next/image` (JS, CSS, chunks, imágenes
    optimizadas, fuentes `next/font`).
  - `/images/`, `/fonts/` (assets públicos servidos desde `/public/`).
  - Permisos por tipo de archivo: `/*.js$`, `/*.mjs$`, `/*.css$`, `/*.woff$`,
    `/*.woff2$`, `/*.ttf$`, `/*.png$`, `/*.jpg$`, `/*.jpeg$`, `/*.webp$`,
    `/*.avif$`, `/*.svg$`, `/*.ico$`.
  - `Disallow` de rutas privadas (`/intranet/`, `/api/`, `/404`, `/500`,
    `/_not-found`, `/login`) sin cambios — la regla `Disallow` más específica
    prevalece sobre los `Allow` genéricos por tipo. No hay assets `.js`/`.css`/
    `.woff2` servidos en rutas privadas literales (en App Router todos viven
    bajo `/_next/`), así que los `Allow` por tipo no filtran contenido privado.
- Cambiar el contenido de `robots.txt` fuerza a Google a re-fetcheaerlo y
  re-renderizar la página, resolviendo el estado establo.
- Bloqueos de bots de IA (GPTBot, ClaudeBot, PerplexityBot, CCBot, etc.) y
  declaración de sitemap/host sin cambios.

### Tests
- **`tests/seo-protection.test.ts`:** actualizada la aserción `allow` (era
  `expect(wildcardRule?.allow).toEqual('/')`, ahora valida que `allow` es un
  array que contiene `/_next/`, `/_next/static/`, `/_next/image`, `/images/`,
  `/fonts/` y los patrones por tipo). Reforzada la aserción de "no bloquear
  `/_next/`" para cubrir también `/_next/static/` y `/_next/image`. Suite pasa
  de 23 → 25 tests.

### Verificación de la URL final
- `http://localhost:3000/robots.txt` (dev) y `next start` (producción)
  devuelven la configuración esperada: `Allow: /_next/`, `Allow: /_next/image`,
  `Allow: /images/`, `Allow: /*.woff2$`, etc. **Ningún `Disallow` bloquea
  `/_next`** (verificado con grep).
- Assets de producción verificados con `next start` (puerto 3001):
  - `/_next/static/chunks/*.css` → 200, `text/css`, `X-Robots-Tag: index, follow`
  - `/_next/static/chunks/*.js` → 200, `application/javascript`, `index, follow`
  - `/_next/image?url=...` → 200, `image/png`, `index, follow`
  - `/images/logo.png` → 200, `image/png`, `Cache-Control: immutable`, `index, follow`
- `/sitemap.xml` → 200. Sitemap declarado en `robots.txt` apuntando a
  `https://www.pinedayasociadoshn.com/sitemap.xml` (URLs HTTPS canónicas).

## Unreleased — Rediseño UI/UX de la home: jerarquía, iconografía unificada y sección de visita premium

Revisión profesional de la maquetación de la página principal para corregir
problemas de jerarquía visual, imágenes desproporcionadas, iconografía
inconsistente y secciones redundantes. La home pasa de ~16 a ~11 secciones.
Validado con `npm run lint && npm run build && npm test` (430 tests, 0 errores).

### Reestructuración de la home (`app/(public)/page.tsx`)
- **Eliminadas secciones redundantes:**
  - **REAL QUESTIONS** (6 tarjetas con solo preguntas → enlace a
    `/preguntas-frecuentes`) duplicaba el bloque FAQ (6 preguntas + respuestas +
    JSON-LD `FAQPage` apuntando a la misma ruta). Se elimina la versión débil
    (sin respuestas) y se conserva el FAQ con respuestas + schema.
  - **CTA BLOG** (bloque independiente bajo `BlogHighlights`) era redundante:
    `BlogHighlights` ya expone `ctaLabel`/`ctaHref`. Se elimina el bloque suelto.
  - **Contact Strip** (4 tarjetas de métodos de contacto) + **Ubicación**
    (tarjeta de dirección + mapa suelto) se fusionan en una sola sección premium
    "Prefiere vernos en persona" (ver abajo).
- **WHY US + multidisciplinar fusionados** en una sola `<Section
  background="warm">`: antes eran dos secciones `warm` consecutivas redundantes.
  Ahora una sección con un `divider-accent` como separador entre la rejilla de
  razones (5 tarjetas) y el split 5/7 del equipo multidisciplinar.
- **Áreas destacadas**: la rejilla pasa de `md:grid-cols-2` con imágenes
  `aspect-3/2` (imágenes dominantes) a `md:grid-cols-2 lg:grid-cols-4` con
  `aspect-4/3` (imágenes equilibradas, no abruman el contenido).
- **BlogHighlights** se mueve bajo las reseñas de Google y recibe
  `background="muted"` para diferenciarla visualmente.

### Nueva sección premium "Prefiere vernos en persona"
- Sustituye al antiguo Contact Strip + Ubicación. Layout de dos columnas
  (`grid lg:grid-cols-2 gap-8 lg:gap-10`):
  - **Izquierda:** eyebrow "Visítenos" + título serif "Prefiere vernos en
    persona" + párrafo + lista de 3 datos (Dirección con enlace a
    `/como-llegar`, Teléfono `tel:`, Horario). Cada ítem con contenedor de icono
    canon `w-11 h-11 rounded-lg bg-primary/10 border border-primary/15 text-primary`.
    CTAs vía `CTAGroup variant="inline"` (Solicitar consulta dorado + teléfono) +
    enlace "indicaciones para llegar".
  - **Derecha:** `Card padding="none"` con `aspect-[4/3]` (móvil) /
    `lg:aspect-auto lg:flex-1` (desktop) conteniendo `<MapEmbed />`. El mapa
    deja de estar suelto y queda integrado en una superficie coherente.
- No se duplica el WhatsApp: `FloatingContactRail` ya lo renderiza globalmente
  vía `app/(public)/layout.tsx`.

### Iconografía unificada en toda la home (AGENTS.md R16)
- Contenedor canon aplicado a todos los iconos de las secciones afectadas:
  `w-11 h-11 rounded-lg` con `border` + `bg-tint` (p.ej.
  `bg-primary/10 border-primary/15` o `bg-accent/15 border-accent/30`) e icono
  `size={20}`.
- **`components/marketing/cta-buttons.tsx` (ContactStrip):** contenedor
  `w-10 h-10 rounded-md` sin border → `w-11 h-11 rounded-lg bg-primary/10 border
  border-primary/15 flex-shrink-0`; iconos 18 → 20.
- **`components/marketing/blog-highlights.tsx`:** contenedor
  `bg-accent/10 text-accent-dark` → `bg-accent/15 border border-accent/30
  text-accent-dark flex-shrink-0`. Añadida prop opcional `background`
  (`'default' | 'muted' | 'primary' | 'accent' | 'warm'`, por defecto
  `'default'`) pasada a `<Section>` para alinear el fondo con el contexto.
- **`app/(public)/solicitar-consulta/page.tsx`:** bloque "Prefiere vernos en
  persona" (3 tarjetas Dirección/Horario/Despacho) con tints mezclados
  (`bg-primary/10`, `bg-accent/15`, `bg-success/15`), tamaño `w-10 h-10` y sin
  borders consistentes → unificado a `w-11 h-11 rounded-lg bg-primary/10 border
  border-primary/15 text-primary`, icono `size={20}`. Coherente con la home.

### CTA final premium (`components/marketing/consultation-cta.tsx`)
- Reescrito como bloque premium: `card-premium` + `ring-gradient-accent`,
  eyebrow, título serif `text-balance`, párrafo `text-pretty` con `max-w-xl`, y
  CTAs duales (Solicitar consulta dorado + teléfono) vía `CTAGroup
  variant="inline"`. Eliminados los imports `Link`/`ArrowRight` (ahora usa el
  componente compartido). Coherente con la sección de visita y con
  `/solicitar-consulta`.

### Validación
- `npm run lint` → 0 errores.
- `npm run build` → Compiled successfully, 293/293 páginas estáticas generadas.
- `npm test` → 430 passed (20 suites).

## Unreleased — Identidad visual, mapa interactivo y reseñas de Google

Corrección completa de la identidad visual del sitio, el mapa de ubicación y la
sección de reseñas de Google. Validado con `npm run lint && npm run build && npm test`
(430 tests, 0 errores).

### Identidad visual — logo oficial (redimensionado)
- **Reemplazado** `public/images/logo.png` por la versión redimensionada de
  `docs/imagenes/logo.png` (PNG transparente, **741×728 ~cuadrado**, 294 KB).
  Antes se servía un asset retrato 1024×1536 (2 MB) que se veía enorme,
  deformado y desproporcionado. La nueva proporción ~cuadrada permite escalado
  limpio en cualquier contexto. Se respeta la transparencia con
  `filter: drop-shadow(...)` para contraste sobre fondos oscuros del
  header/footer, sin cajas opacas.
- **Header** (`components/marketing/public-header.tsx`): logo con altura
  equilibrada con la barra de navegación (`h-9` → `h-12` responsive), proporción
  preservada vía `width`/`height` intrínsecos (741×728) + `w-auto`, y
  `object-fit: contain`. Eliminados el halo radial, el `scale-110` y el
  `translate-y` al hover que provocaban saltos visuales y lo hacían dominar.
  `priority` para LCP; enlace de marca a la home con `aria-label`.
- **Footer** (`components/marketing/public-footer.tsx`): mismo logo, algo mayor
  (`h-14` → `h-16`) sin dominar la columna de identidad; `loading="lazy"`.
- **Email** (`lib/email.ts`): sustituido "Bufete multidisciplinario" por
  "Abogados en Nacaome, Valle" en el header del email HTML y el texto plano
  del auto-respondedor.
- **JSON-LD** (`lib/site.ts`): actualizadas las referencias `logo` en los
  schemas `LegalService` y `Organization` para apuntar a
  `/images/logo.png` (PNG ≥112px, cumple requisitos de Google Rich Results).

### Textos actualizados (marca textual → descripción jurídica)
- `lib/legal-disclaimer.ts`: `FIRM_BIO_SHORT` cambia "Bufete multidisciplinario" →
  "Bufete jurídico".
- `lib/page-content-db.ts`: default del campo `hero.subtitle` actualizado.
- `data/landings-locales.ts`: descripciones de Nacaome y Choluteca actualizadas.
- `app/(public)/despacho/page.tsx`: keywords y subtitle default.
- `app/(public)/servicios-juridicos/page.tsx`: keywords.
- `app/(public)/aviso-legal/page.tsx`: descripción de actividad.
- `app/(public)/blog/[categoria]/[slug]/page.tsx`: bio de autor.
- `lib/site.ts`: keywords por defecto y `serviceType` del schema LegalService.

### Mapa de Google — corrección y fallback
- **CSP** (`next.config.ts`): añadido `https://www.google.com` a `frame-src`.
  Antes solo permitía `https://www.openstreetmap.org`, lo que bloqueaba el
  iframe de Google Maps con el error "Este contenido está bloqueado".
- **MapEmbed** (`components/marketing/map-embed.tsx`): reescrito como client
  component con detección de error del iframe. Si el iframe no carga en 8
  segundos o falla, se muestra un fallback estático con:
  - Dirección completa del bufete (`<address>` semántico)
  - Botón "Ver en Google Maps" (`target="_blank" rel="noopener noreferrer"`)
  - Coordenadas geográficas visibles
  - Estilo visual coherente con el diseño del sitio

### Reseñas de Google — rediseño sutil + integración server-side
- **Rediseño completo** (`components/marketing/google-reviews.tsx`): la sección
  pasa de ser una banda oscura `bg-primary-dark` client-side, visualmente
  invasiva, a una sección clara y sobria (`bg-page-warm` + `.card-premium`),
  coherente con las secciones adyacentes. Cabecera discreta ("Opiniones de
  clientes"), rating medio pequeño, estrellas contenidas (12–13 px) y **3
  reseñas** visibles en desktop (grid `lg:grid-cols-3`), apiladas en móvil/tablet.
  Tarjetas compactas: avatar pequeño (iniciales o foto `w-9`), fecha discreta y
  texto con `line-clamp-4`. Sin carrusel aparatoso, sin tarjetas enormes.
- **Server component** (sin `'use client'`): las reseñas se obtienen y renderizan
  en el servidor — sin script de Maps JS API, sin hidratación, sin JS de cliente.
  Mejora CWV (menos JS, sin script externo pesado) y SEO (reseñas rastreables
  server-side).
- **Nueva capa de datos** (`lib/google-reviews.ts`): `getGoogleReviews()`
  consulta Google Places API (New) v1 (`places.googleapis.com/v1/places/{id}`)
  con `X-Goog-Api-Key` + `X-Goog-FieldMask`, cache en memoria 1 h e ISR
  `revalidate=3600`. Si falta la API key o la llamada falla, devuelve un
  fallback local de 6 reseñas verificadas. Nunca lanza: la sección nunca
  aparece rota, vacía ni con mensajes técnicos al usuario.
- **JSON-LD `AggregateRating`**: se emite **solo** cuando los datos provienen
  de la API real de Google (`source === 'google'`). En fallback local no se
  emite structured data de reseñas, para evitar penalización por reseñas
  fabricadas (política de Google sobre self-serving reviews).

### ⚠️ Seguridad — API key de Google Places comprometida (requiere rotación)
- **Eliminada** del código una **API key de Google Maps/Places hardcodeada**
  (`AIzaSyB…`) que estaba en `google-reviews.tsx` (client-side, expuesta en el
  bundle del navegador). Violación de AGENTS.md §3. El código ahora la lee de
  `GOOGLE_PLACES_API_KEY` (variable de entorno servidor, nunca en el cliente).
- **Acción humana requerida:** la clave antigua sigue comprometida en el
  **git history** y debe **rotarse en Google Cloud Console** (APIs y servicios →
  Credenciales → regenerar/restringir la key). El código no resuelve una clave
  filtrada en el historial. Reforzar restricciones: limitar a los dominios del
  despacho y a la API de Places únicamente.

### Seguridad y accesibilidad
- El logo usa `alt` descriptivo, `width`/`height` para evitar CLS, y
  `decoding="async"` donde no es crítico.
- El mapa externo usa `rel="noopener noreferrer"` y `target="_blank"`.
- Sin dependencias nuevas.

### Wordmark de marca en el header
- **Header** (`components/marketing/public-header.tsx`): añadido lockup
  logo + wordmark dentro del `<Link>` de la home. Junto al logo aparece el
  nombre del despacho en dos líneas: **"Pineda y Asociados"** (serif,
  `text-text-inverse`) sobre **"Bufete Jurídico"** (eyebrow dorado,
  `tracking-eyebrow`). Compacto y responsive (`text-sm`/`text-xs` →
  `text-base` en `sm`); `whitespace-nowrap` para evitar saltos. Refuerza la
  marca sin dominar la barra de navegación (respeta R5: adición de marca
  explícita solicitada, no rediseño).

### Dirección del footer enlazada a Google Maps
- **Footer** (`components/marketing/public-footer.tsx`): la dirección de
  Contacto (GGJ7+239 / Cuadra y media al este de Hondutel… / Nacaome, Valle /
  Honduras) ahora es un `<a>` que abre el perfil oficial del despacho en
  Google Maps (`site.googleBusiness`) en pestaña nueva con
  `rel="noopener noreferrer"`. Conserva el icono `MapPin` y añade hover sutil
  (halo `bg-white/5` + escala del icono). `aria-label` descriptivo.

### Favicon e iconos PWA reales (fin del placeholder "LEX")
- **Nuevos assets generados desde el logo oficial** (`public/images/logo.png`)
  vía `scripts/gen-favicon.mjs` (dependencia `sharp`, transitive de Next.js):
  - `app/favicon.ico` — ICO multi-size (16/32/48) con entradas PNG, 4 208 B.
    Sustituye al `favicon.ico` de 635 B que servía un placeholder genérico.
  - `public/icon-192.png` / `public/icon-512.png` — iconos PWA (any + maskable).
  - `public/apple-touch-icon.png` — 180×180, fondo navy opaco (iOS requiere
    opacidad). Sustituye `icon-192.svg` que mostraba "LEX" sobre balanza.
  - El logo se monta centrado al 80 % sobre fondo navy `#0B1B3D`
    (`theme_color` del manifest).
- **Wiring actualizado**: `app/layout.tsx` (links `apple-touch-icon`,
  `icon` 192/512 PNG), `public/manifest.json` (iconos 192 + 512 any +
  512 maskable), `proxy.ts` (lista de públicas + matcher de exclusión),
  `app/(public)/blog/feed.xml/route.ts` (imagen RSS → `icon-192.png`).
- **Eliminados** assets fake heredados: `public/favicon.ico` (635 B,
  duplicado del placeholder) y `public/icon-192.svg` (placeholder "LEX").
- **Reproducible**: `node scripts/gen-favicon.mjs` regenera todo desde el
  logo. Sin dependencias nuevas (usa `sharp` ya presente).

### Blog público — error "DATABASE_URL environment variable is required"
- **Causa raíz**: `lib/blog-db.ts` evaluaba `IS_DB_REACHABLE` como constante
  de módulo, fijándolo durante el build/prerender. En runtime serverless
  (Neon) el `Proxy` de `lib/db.ts` lanzaba
  `"DATABASE_URL environment variable is required at runtime"` al primer
  acceso, sin `try/catch` que lo capturase → el error burbujeaba al
  `error.tsx` del blog ("Error inesperado / Algo salió mal").
- **Fix** (`lib/blog-db.ts`): el guard pasa a función `isDbReachable()`
  evaluada en **cada llamada** (refleja el entorno real de ejecución, no el
  del build). Todas las funciones (`getPublishedPosts`, `getPostBySlug`,
  `getBlogCategories`, `getRelatedPosts`) ahora envuelven la consulta en
  `try/catch` y degradan a `[]`/`null` con `console.error` en servidor.
  El blog público renderiza su estado vacío ("Próximamente publicaremos…")
  o un 404 limpio, **nunca** el error 500 técnico al usuario.
- **Nota**: si la DB sí está configurada en el despliegue (Vercel env
  `DATABASE_URL`), el blog funciona con normalidad. Este fix cubre el caso
  de entornos sin DB (preview, local sin `.env`) para que no rompan la web
  pública. `lib/faq-db.ts` y `lib/areas-db.ts` conservan su propio guard
  (no tocados).

---

Finalización de la auditoría SEO técnica sobre el contenido **dinámico** del
blog (tabla `blog_posts` en Neon), cerrando los pendientes que no podían
validarse sin acceso a la DB. Los scripts son seguros, idempotentes y con
backup previo obligatorio. Validado con `npm run lint && npm run build && npm test`
(**424 tests**, 0 errores).

---

## Unreleased — Limpieza editorial del blog (contenido duplicado y genérico)

Auditoría cualitativa de los 159 posts publicados. Se identificaron y pasaron
a borrador 12 posts que no cumplían los estándares editoriales del despacho:
contenido duplicado (canibalización SEO) o contenido genérico sin valor
específico de Honduras. Backup previo en `auditoria-blog/backup-2026-06-20-10-00.json`.

### Posts enviados a borrador (12)

**Duplicados por canibalización SEO (10):**
- `registrar-marca-paso-a-paso-honduras` → duplica `registrar-marca-honduras-paso-a-paso`
- `poder-legal-honduras-cuando-se-necesita` → duplica `poder-notarial-honduras-tipos-requisitos`
- `constitucion-empresas-honduras-pasos-legales` → duplica `constituir-empresa-guia-paso-a-paso-honduras`
- `impuesto-renta-guia-personas-fisicas-honduras` → duplica `impuesto-renta-personas-fisicas-honduras`
- `divorcio-honduras-pasos-requisitos` → duplica `divorcio-honduras-guia-completa`
- `divorcio-tipos-requisitos-tiempos-honduras` → duplica `divorcio-honduras-guia-completa`
- `guarda-custodia-menores-tipos-honduras` → duplica `custodia-hijos-honduras-juez`
- `pension-alimenticia-honduras-como-solicitarla` → duplica `pension-alimenticia-honduras-guia-completa`
- `herencias-honduras-fallece-familiar` → duplica `testamentos-sucesiones-herencia-honduras`
- `como-elegir-buen-abogado-guia-practica-honduras` → duplica `como-elegir-abogado-honduras`

**Contenido genérico sin profundidad (2):**
- `contratos-mercantiles-proteger-negocio` → texto aplicable a cualquier país
- `problemas-legales-familiares-honduras` → listado superficial sin desarrollo

### Posts mantenidos (147)
Se conservan todos los artículos con valor específico, profundidad temática,
información aplicable a Honduras y potencial de conversión. Ver informe
completo en `docs/auditoria-editorial-2026-06-20.md`.

### Seguridad del proceso
- Backup previo generado (174 posts) antes de cualquier escritura.
- Solo se modificó el campo `published` (false). No se tocaron slugs,
  URLs, categorías, metadatos ni contenido del body.
- Verificación posterior: 12/12 confirmados como borrador.

---

### Hallazgos reales (diagnóstico)
- **174 posts auditados** (159 publicados, 15 borradores).
- **nofollow internos en contenido DB: 0** ✅ (los 92 residuales detectados en
  código estático ya estaban resueltos; en contenido DB hay cero).
- **links a redirects 301: 26** (en 21 posts publicados + 1 borrador) → corregidos.
- **http inseguros: 0** · **img sin alt: 0** · **anchors pobres: 0** ·
  **HTML desbalanceado: 0** · **fechas inválidas/futuras: 0**.
- **14 enlaces externos**, todos a `wa.me` (WhatsApp legítimo del despacho).

### Correcciones aplicadas en DB (26 enlaces)
- **`scripts/fix-internal-redirects.ts`** (nuevo): corrige enlaces internos
  que apuntan a rutas con redirect 301 declarado en `next.config.ts`.
  Reemplaza el `href` por la URL canónica final, conservando anchor y `rel`.
  Idempotente (re-ejecutar no hace nada). Dry-run por defecto.
- **24 enlaces corregidos en 20 posts publicados** + **2 enlaces en 1 borrador**.
- Solo se actualiza `updated_at` en posts publicados (los borradores no
  exponen fecha pública).

### Scripts nuevos (`package.json`)
- `blog:backup` → `scripts/backup-blog.ts`: dump completo de `blog_posts`
  (JSON restoreable + resumen MD) en `auditoria-blog/`. Solo lectura.
- `blog:seo-audit` → `scripts/seo-content-audit.ts`: auditoría SEO de
  contenido (nofollow internos, links a redirects, http inseguros, img sin
  alt, anchors pobres, fechas, HTML desbalanceado). Solo lectura; exit 1 si
  hay críticos (para CI). Variante `--json` machine-readable.
- `blog:fix-redirects` → `scripts/fix-internal-redirects.ts`: corrección
  idempotente de enlaces a redirects. Dry-run por defecto; variante
  `:aplicar` escribe en DB (requiere backup <2h).

### Tests anti-regresión
- **`tests/seo-content-audit.test.ts`** (nuevo, 23 tests): valida que las
  funciones de detección (extractLinks, extractImages, isInternalUrl,
  isExternalUrl, isPoorAnchor) identifican correctamente nofollow internos,
  redirects, http inseguros, img sin alt y anchors pobres sobre HTML
  sintético. CI impide que un refactor rompa la detección.

### Seguridad del proceso
- **Backup previo generado** (`auditoria-blog/backup-2026-06-20-05-04.json`,
  174 posts) antes de cualquier escritura.
- El script de corrección aborta si no hay backup reciente (<2h).
- No se inventan URLs: los destinos provienen exclusivamente de
  `next.config.ts`. No se tocan slugs, categorías ni contenido editorial
  (solo atributos `href`).

---

## Unreleased — SEO técnico: indexabilidad, structured data, titles y enlaces

Resolución de los hallazgos críticos de la auditoría SEO técnica de
`www.pinedayasociadoshn.com` (Jun 2026). Cambios conservadores: no alteran
diseño, rutas, formularios, tracking ni CMS. Validados con
`npm run lint && npm run build && npm test` (401 tests, 0 errores).

### Crawling / indexabilidad
- **`app/robots.ts`**: desbloqueado `/_next/`. Antes se bloqueaba
  `/intranet/, /api/, /_next/, /404, /500, /_not-found, /login`; el
  `/_next/` contiene el CSS y JS de Next.js que Googlebot necesita para
  renderizar la SPA/RSC. Bloquearlo producía "Disallowed internal resources"
  (1482/1484 en auditoría) y degradaba el rendering service. Ahora solo se
  bloquean rutas realmente privadas. Añadido `host` al robots.
- **`/login` y páginas de error** siguen `noindex` por diseño (no aportan
  valor SEO; `/login` es redirect público a `/intranet/login`). Documentado.

### Structured data (JSON-LD)
- **Eliminado BreadcrumbList duplicado** en 4 páginas
  (`derecho-penal`, `derecho-penal/[slug]`, `hondurenos-en-espana`,
  `hondurenos-en-espana/[slug]`). El helper `areaSchemas` emitía un
  BreadcrumbList Y el componente `<Breadcrumbs>` otro. Ahora el BreadcrumbList
  tiene una sola fuente de verdad: el componente `<Breadcrumbs>`.
  `servicios-juridicos/[slug]` (que no lo usaba) ahora sí renderiza
  `<Breadcrumbs>` para no perder el schema.
- **`serviceType` corregido** en 5 páginas: antes era `'LegalService'`
  (el `@type` del provider, no del servicio) o `'CriminalDefense'` (inglés).
  Ahora describe la categoría textual del servicio en español.
- **`faqPageSchema` sanitiza HTML**: `acceptedAnswer.text` ahora pasa por
  `toPlainText()` (strip tags + decode entidades). Google exige texto plano;
  antes las FAQs de áreas con HTML se rechazaban en rich results.
- **`websiteSchema`**: `publisher` ahora apunta a `#organization`
  (convención Schema.org para Knowledge Graph); antes apuntaba a
  `#legal-service`.
- **`organizationSchema`**: añadido `image` (necesaria junto a `logo`).
- **`AboutPage` de `/despacho`**: añadido `@id`, `description`, `isPartOf`,
  `about` y `mainEntity` (antes era un nodo aislado sin conexiones).

### Titles (>65 caracteres)
- 13 títulos corregidos mediante `title: { absolute: ... }` para evitar
  marca doble/triple contextual: `/servicios-juridicos` (77→54),
  `/derecho-penal` (73→53), `/despacho` (78 con marca duplicada → 42),
  las 7 subpáginas de `/derecho-penal/[slug]` (66–94 → ≤56),
  las 3 de `/hondurenos-en-espana/[slug]` (81–94 → ≤56),
  `/blog` paginado y las 20 categorías de `/blog/[categoria]` (paginación
  ya no dispara >65).

### Enlaces externos
- **`miambiente.gob.hn`** (dominio caído) → `serna.gob.hn` (portal vigente de
  la Secretaría de Recursos Naturales y Ambiente) en `data/areas-juridicas.ts`.
- **LinkedIn `shareArticle`** (deprecated) → `sharing/share-offsite/?url=`
  en `components/blog/share-buttons.tsx`.
- Verificados con `curl` los 9 dominios `.gob.hn` y los enlaces de soporte de
  navegadores / políticas de privacidad: todos responden 200 salvo el ya
  corregido.
- **Contenido del blog (DB viva)**: placeholder `wa.me/504XXXXXXXX` corregido
  → `wa.me/50495363724` (número real, verificado 200 OK) en **14 posts** de
  landings locales (Choluteca/San Lorenzo/Nacaome). Era el único enlace
  externo roto real del blog. Backup previo en
  `auditoria-blog/wame-backup-2026-06-20T05-17-56-185Z.json`. Re-auditoría
  con `npm run blog:seo-audit` post-fix: 0 ocurrencias del placeholder, 0
  nofollow internos en bodies, 0 fechas inválidas, 0 links a redirects.

### Tests
- `tests/seo-protection.test.ts`: actualizados los asserts de robots
  (`/_next/` ya no debe bloquearse) y WebSite publisher (`#organization`),
  y añadidos tests nuevos: BreadcrumbList no duplicado en `areaSchemas`,
  FAQPage sanitiza HTML, Organization incluye `image`. Suite: 397 → 401 tests.
- Suite ampliada a **430 tests** (6 nuevos tests de protección para home page):
  H1 contiene "defensa penal" + "asesoría jurídica", H1 menciona Nacaome +
  Honduras, subtítulo incluye los 7 términos clave del title, check2 incluye
  "abogados en Nacaome", tagline ≤65 caracteres, coherencia title↔H1↔subtitle.

### Documentación
- `README.md`: nueva sección "SEO técnico y mantenimiento" con tabla de
  regeneración de sitemap/robots/llms.txt y convenciones SEO del código.

### Home page (página raíz) — SEO on-page
Corrección de coherencia semántica entre H1, title y contenido visible de la
home. Sin rediseño, sin cambios de layout (cumple R5/R16).

**Semántica y coherencia H1/title:**
- Hero subtitle default actualizado en `lib/page-content-db.ts` para incluir
  de forma natural: "defensa penal", "asesoría jurídica", "abogados", "Nacaome",
  "Valle", "Honduras" y "Pineda y Asociados".
- Hero check2 default cambiado a "Atención directa de abogados en Nacaome".
- Texto del panel lateral del hero mejorado para incluir "abogados de Pineda y
  Asociados" y "asesoría jurídica".
- Title (`site.tagline`) ya era óptimo: 56 caracteres, incluye todos los
  términos clave. No se modificó.

**Atributos title en enlaces:**
- Añadidos title descriptivos a todos los enlaces del contenido principal de
  la home (CTA blog, tarjetas de preguntas, enlaces a FAQ/blog/despacho/
  como-llegar, 9 tarjetas de cobertura local) en `app/(public)/page.tsx`.
- Añadidos title a todos los botones CTA (Solicitar consulta, Llamar, WhatsApp)
  en `components/marketing/cta-buttons.tsx` (4 variantes × 2 botones).
- Añadidos title a los 4 enlaces de la ContactStrip.
- Añadidos title a los 7 enlaces de navegación principal del header
  (con mención a ubicación local) y botones de contacto del header
  en `components/marketing/public-header.tsx`.

**Iframe (mapa OpenStreetMap):**
- `MapEmbed` ya tenía `title`, `loading="lazy"`, `sandbox="allow-scripts"`.
  Se añadió `referrerPolicy="no-referrer"` y `title` descriptivo al enlace
  de atribución OpenStreetMap.

**Relación texto/HTML:**
- La home usa markup estándar de Tailwind/Next.js con decoraciones
  `aria-hidden`. No hay duplicación responsive (usa grid CSS), ni wrappers
  innecesarios, ni SVG inline excesivo. El diseño visual es rico pero no
  redundante. La relación texto/HTML reportada por la herramienta externa
  es esperable para una SPA con renderizado SSR (Next.js App Router).

---

## Unreleased — Mejora visual progresiva de la interfaz (Premium equilibrado)

Pulido UI sobre el diseño existente **sin rediseño, sin cambios de contenido,
sin nuevas dependencias ni alteración de la identidad visual**. El objetivo:
resolver incoherencias del sistema de design tokens de `globals.css` y elevar
la percepción de calidad, densidad y jerarquía.

### Dirección visual
Carácter **"Premium equilibrado"**: radius canónico de card = 16px
(`rounded-lg` / `--radius-lg`), densidad editorial (`p-5`), sombra multicapa
con halo dorado en hover, dorado como acento (no decoración).

### Consolidación del sistema de design tokens (`app/globals.css`)
- **Radius unificado**: `.card-premium` alineado a `var(--radius-lg)` (16px)
  en vez de `14px` hardcoded — resuelve el conflicto con `Card` (`rounded-md`
  → `rounded-lg`), que entraba en valor indeterminado.
- **Sombras de botón como fuente única de verdad**: eliminadas las 9 sombras
  inline (`shadow-[0_1px_0_0_rgba...]`) de `cta-buttons.tsx` y
  `public-header.tsx`, que duplicaban y **divergían** de los tokens
  `--shadow-btn-primary/-secondary/-accent`. Ahora se exponen como utilities
  `.btn-shadow-*` / `*-hover` y se aplican de forma consistente.
- **Nuevo token `--shadow-btn-success` / `-hover`** (verde WhatsApp, light +
  dark): antes cada CTA de WhatsApp repetía la sombra inline por todo el sitio.
- **Eliminados tokens duplicados** legacy `--shadow-button-primary` /
  `-hover` (idénticos a `--shadow-btn-primary*`).

### Componentes afectados (radius 16px + densidad + legibilidad)
| Archivo | Cambio |
|---|---|
| `components/ui/card.tsx` | `rounded-md` → `rounded-lg` (canónico) |
| `components/marketing/service-card.tsx` | `rounded-xl` → `rounded-lg` |
| `components/marketing/testimonials-section.tsx` | `rounded-xl` → `rounded-lg` |
| `components/marketing/cta-buttons.tsx` | 8 sombras inline → tokens; botones a `rounded-lg` |
| `components/marketing/public-header.tsx` | sombras inline (WhatsApp + CTA) → tokens; `rounded-lg` |
| `components/marketing/trust-bar.tsx` | icono-contenedor `rounded-full` → `rounded-lg`; microcopy `text-xxs` → `text-xs` |
| `components/marketing/blog-highlights.tsx` | descripción de post `text-xs` → `text-sm` |
| `components/marketing/process-stepper.tsx` | eliminado `border` redundante (doble con `.card-premium`); `rounded-md` → `rounded-lg` |
| `components/marketing/landing-local.tsx` | icono-contenedor unificado (`rounded-full border-2` → `rounded-lg border`); botones CTA a tokens |
| `app/(public)/page.tsx` (home) | **Por qué elegirnos / combos multidisciplinar / ciudades**: icono-contenedor a `w-11 h-11 rounded-lg` con borde; descripciones `text-xs` → `text-sm` (menos altura vacía). **Hero**: añadido bloque visual complementario en `lg:col-span-5` (panel translúcido de sellos/cobertura/horario) que equilibra la composición antes asimétrica. Sin inventar métricas (R4). |

### Lo que NO se toca
Paleta de colores, identidad visual, contenido editorial, arquitectura, rutas,
SEO, schemas JSON-LD, intranet/admin, motor de cálculo, `page-hero.tsx`,
`public-footer.tsx`, `floating-contact-rail` (ya correctos).

### Extensión R16 a páginas públicas internas (2ª pasada)
Aplicación mecánica y coherente de la regla R16 al resto de páginas públicas
internas que conservaban estilos heredados inconsistentes con la home ya
consolidada. **Sin rediseño, sin cambios de contenido, sin nuevas dependencias.**

Patrón recurrente corregido en varias páginas `[slug]` (servicios, derecho-penal,
hondurenos-en-espana): el icono-contenedor de subservicios era
`w-10 h-10 rounded-full border-2 border-accent bg-white` → unificado a
`w-11 h-11 rounded-lg border-accent/30 bg-accent/10` (patrón canónico de R16),
con padding `p-4` → `p-5` (densidad editorial).

| Página | Cambios aplicados |
|---|---|
| `despacho/page.tsx` | 5 icono-contenedores `w-10 rounded-md` → `w-11 rounded-lg` (misión/visión/valores/credenciales/especialidad); avatar equipo `rounded-full` → `rounded-lg`; imagen `rounded-md` → `rounded-lg`; bloque multidisciplinar: card `rounded-md` → `rounded-lg`, icono canónico, desc `text-xs` → `text-sm` |
| `servicios-juridicos/[slug]` | subservicios a icono-contenedor canónico + `p-5`; cards de área relacionada y blog: border en icono; desc de blog `text-xs` → `text-sm` |
| `derecho-penal/[slug]` | subservicios a icono-contenedor canónico; 3 cards relacionadas (área, "+", blog) con border en icono; desc blog `text-xs` → `text-sm` |
| `hondurenos-en-espana/[slug]` | idéntico patrón que derecho-penal/[slug] (subservicios + 3 cards + blog) |
| `preguntas-frecuentes/page.tsx` | FAQ `<details>` `rounded-xl` → `rounded-lg` (unifica con resto de cards) |
| `solicitar-consulta/page.tsx` | 3 cards "visítenos" `rounded-xl` → `rounded-lg`; bloque emergencia `rounded-xl` → `rounded-lg`; items motivos `rounded-md` → `rounded-lg`; CTA "Indicaciones" con `btn-shadow-primary` |
| `como-llegar/page.tsx` | 3 botones de mapas `rounded-md` → `rounded-lg` con `btn-shadow-primary/-secondary`; 3 icono-contenedores `w-9/w-10 rounded-md` → `w-11 rounded-lg` (Dirección, puntos referencia, rutas) |
| `blog/[categoria]/[slug]/page.tsx` | card de artículo relacionado `rounded-xl` → `rounded-lg`; avatar de autor `rounded-full` → `rounded-lg` (avatar contenedor, no chip) |
| `page.tsx` (home, retoque) | numeración de preguntas reales `w-8` → `w-10 rounded-md` (alinea con stepper canónico) |

**Criterio aplicado con criterio (no mecánico a ciegas):**
- Los icono-contenedores pequeños inline en **listas laterales compactas**
  (garantías `w-7`, horario `w-8` en solicitar-consulta) se **mantienen**:
  son micro-iconos secundarios, no cards principales; agrandarlos rompería
  la densidad de esas columnas.
- Los **chips/pills de filtro** (`rounded-full` en FAQ, tags de blog) se
  **mantienen**: las pills circulares son un patrón legítimo de UI, no cards.
- Los **blobs decorativos** del hero (`rounded-full blur-3xl`) se mantienen:
  son fondo, no superficies funcionales.

### Convención nueva (AGENTS.md R16)
- Radius canónico de card pública = `rounded-lg` (16px).
- CTAs de la web pública deben usar `.btn-shadow-*` / `*-hover` (nunca
  `shadow-[...]` inline).
- Icono-contenedor estándar: `w-11 h-11 rounded-lg` con `border` + `bg-tint`.
- Dorado solo como acento (hover, eyebrow), no como fondo plano.

### Validación (4/4 en verde)
| Comando | Resultado |
|---|---|
| `npm run lint` | 0 errores (baseline) — revalidado tras extensión a páginas internas |
| `npm run build` | ✓ Compiled successfully — 305/305 páginas — revalidado tras extensión |
| `npm test` | 397/397 (19 suites) — revalidado tras extensión |
| `npm run visual:check` | **NO VALIDADO**: el pipeline compara contra producción remota, donde los cambios aún no están desplegados. El baseline existe (`e2e/visual-baselines/`, 18 jun). Verificación visual real requiere deploy previo. |

### Estado
`IMPLEMENTADO` y `VALIDADO` (lint/build/test), ambas fases (home+componentes y
extensión a páginas internas). `visual:check` `NO VALIDADO` por limitación del
pipeline (requiere deploy). Pendiente de verificación visual tras despliegue.

---

## Unreleased — Herramienta de revisión IA del blog (`blog:review`)

Nueva herramienta interna (`scripts/blog-ai-review.ts`) para auditar y mejorar
artículos del blog **con asistencia de IA en modo solo-sugerencias**. Sigue el
mismo patrón seguro que `normalizar-blog.ts` (dry-run por defecto, backup,
idempotente, no inventa contenido).

### Corrección de premisa
La petición original asumía que el blog vivía en archivos Markdown/MDX.
**No es así**: `data/blog/posts/` está vacío; los 159 posts viven en PostgreSQL
(tabla `blog_posts`) como HTML editado con TipTap (AGENTS.md §R3). La herramienta
opera sobre la **DB**, no sobre el filesystem. Los únicos `.md`/`.mdx` del repo
son documentación técnica, no artículos del blog.

### Qué hace
- **Análisis determinista por post** (sin IA): conteo de palabras reales (HTML
  stripiado, sin tags/entidades), rango editorial 800–1000, jerarquía H1/H2/H3
  (doble H1, H3 sin H2 previo), longitud title/metaDescription vs rangos SERP,
  tags vacíos/duplicados, `<img>` sin `alt`, enlaces a rutas privadas (R6),
  externos sin `rel`, fechas futuras, disclaimer duplicado (R14).
- **DeepSeek opcional (solo sugerencias):** para posts con hallazgos, una llamada
  devuelve JSON `{secciones_a_ampliar, mejoras_seo, problemas_estructura}`.
  Prompt con restricciones duras: no inventar ley/jurisprudencia/métricas/claims,
  tono jurídico, no proponer cambio de slug sin justificación. Timeout 30s,
  fail-soft (si falla, reporta sin IA).
- **`--aplicar` SOLO cambios mecánicos idempotentes:** H1→H2, CTAs duplicados,
  whitespace — reutiliza la MISMA lógica canónica de `normalizar-blog.ts`.
  Las sugerencias de IA **nunca** se aplican a la DB (R17).

### Seguridad
- API key siempre de `process.env.DEEPSEEK_API_KEY`, **nunca** hardcodeada.
  Sin ella, modo solo-heurísticas (no falla).
- Dry-run por defecto. Backup previo en `auditoria-blog/backup-pre-review-<ts>.json`.
- Guardia: body resultante <50 palabras tras aplicar → revertir.
- Sanitización HTML antes de cualquier escritura.
- Reporte Markdown: `auditoria-blog/blog-ai-review-<ts>.md`.

### Comandos nuevos (`package.json`)
```bash
npm run blog:review            # dry-run (con IA si hay DEEPSEEK_API_KEY)
npm run blog:review:aplicar    # aplica solo cambios mecánicos
# flags: --slug <s>, --no-ai, --limit <n>, --help
```

### Regla nueva (AGENTS.md R17)
"Uso seguro de herramientas IA en contenido": la IA solo sugiere; nunca escribe
contenido final en DB; prohibido rellenar para alcanzar conteo (refuerza R13);
toda sugerencia que afirme ley/métricas debe verificarse contra CP Honduras.

### Validación (4/5 en verde)
| Comando | Resultado |
|---|---|
| `npm run lint` | 0 errores |
| `npx tsc --noEmit` | 0 errores (`scripts/` incluido en typecheck) |
| `npm run build` | ✓ Compiled successfully — 305/305 |
| `npm test` | 397/397 (19 suites) |
| `npm run blog:review` (end-to-end) | **NO VALIDADO**: requiere `DATABASE_URL` real (Neon) y `DEEPSEEK_API_KEY`. El arranque, parseo CLI, guardia de env y `--help` sí verificados. |

### ⚠️ Acción crítica (no resuelta por código)
Una `DEEPSEEK_API_KEY` se compartió comprometida en una conversación. Según
AGENTS.md §3, un secreto comprometido **requiere rotación** — el código no lo
resuelve. Debe rotarse en el panel de DeepSeek antes de cualquier uso.

---

## Release 89 — Normalización masiva del blog (2026-06-20)

Corrección segura, reproducible e idempotente de los **159 posts publicados**
mediante un nuevo script canónico de normalización (`scripts/normalizar-blog.ts`).
El flujo prioriza la automatización sobre la edición manual y **no inventa
contenido editorial** (R3/R4): solo corrige duplicados técnicos, jerarquía
semántica y formato.

### Nuevo script canónico — `scripts/normalizar-blog.ts`
- **Dry-run por defecto**: nunca escribe sin `--aplicar`.
- **Backup previo** obligatorio (`auditoria-blog/backup-pre-normalizacion-<ts>.json`).
- **Idempotente**: re-ejecutar no produce cambios adicionales (verificado).
- **Sanitización** del body antes de escribir (defensa: nunca HTML sucio).
- Selectores: `--solo-ctas`, `--solo-h1`, `--solo-whitespace`, `--slug <slug>`.

### Correcciones aplicadas (en DB `blog_posts`)
| Tipo | Posts afectados | Descripción |
|------|-----------------|-------------|
| CTAs duplicados eliminados | 75 | Disclaimer legal redundante en el body. El componente `<LegalDisclaimer>` ya lo renderiza (regla editorial explícita en `lib/legal-disclaimer.ts`). Regex precisa: solo elimina el `<p>` que **empieza** con la frase ancla, evitando falsos positivos en párrafos editoriales. |
| H1 → H2 | 14 | Posts de landings locales con `<h1>` en el body generaban doble H1 (la plantilla ya renderiza `post.title` como H1). Conversión conservando atributos y contenido. |
| Whitespace normalizado | 141 | Colapsado de 3+ saltos de línea, espacios finales, `&nbsp;` repetidos. No toca contenido semántico. |

### Auditoría integral (159 posts)
- **Sin errores técnicos**: 0 slugs duplicados, 0 títulos duplicados, 0 fechas
  inválidas/futuras, 0 categorías inválidas, 0 meta descriptions fuera de rango,
  todos los campos obligatorios completos.
- **Peso editorial**: 114 posts < 800 palabras (marcados como "requiere
  ampliación editorial" — trabajo humano, no relleno automático), 32 entre
  800–1000 (objetivo), 13 > 1000.

### Validación (6/6 en verde)
| Comando | Resultado |
|---|---|
| `npm run lint` | 0 errores |
| `npx tsc --noEmit` | 0 errores |
| `npm test` | 397/397 (19 suites) |
| `npm run validate:dates` | 159 posts OK |
| `npm run audit-blog-seo` | 0 errores, 0 warnings |
| `npm run build` | Compiled successfully (305 páginas) |

### Pendientes editoriales (no resueltos por diseño)
- **71 posts** con revisión trimestral vencida (`npm run content:audit`).
- **114 posts** < 800 palabras requieren ampliación editorial humana.
- **1 meta title duplicado** (`como-elegir-abogado-honduras` vs
  `como-elegir-buen-abogado-guia-practica-honduras`): canibalización que
  requiere decisión editorial (cuál canonicalizar/noindex).

---

## Release 88 — Fase HQC: Higiene + Calidad + Coherencia (2026-06-20)

Ejecución completa del plan HQC en **5 commits atómicos** (uno por etapa).
Objetivo: estabilizar la base del repositorio (higiene, coherencia documental,
suelo de calidad) **sin tocar lógica funcional ni rediseñar**.

### Etapa 1 — Higiene y alineación documental (P0) — `chore:`
- `auditoria-blog/` (96 archivos HTML, 1.5MB) fuera del tracking (`git rm -r
  --cached`). Estaba en `.gitignore` pero ya estaba commiteado; no se usa en
  runtime. Preservado en disco local.
- `CHANGELOG.md` §"Estado actual": sincronizado con HEAD real (estaba
  congelado en Release 84).
- `README.md` §"Tooling IA": numeración corregida (Release 87, no 85).

### Etapa 2 — Calidad: coverage + scripts en tsc (P1) — `test:`
- `vitest.config.ts`: configuración de coverage (provider v8, reporteros
  text/lcov, umbral conservador 35%). Script `test:coverage` en `package.json`.
  DevDep `@vitest/coverage-v8` 4.1.9.
- `tsconfig.json`: `scripts/` incluido en el typecheck (`scripts/legacy/`
  sigue excluido). Fix de 5 errores de tipo en `audit-blog-seo.ts` y
  `audit-canibilizacion.ts`.
- **Línea base de coverage medida: 66.21% líneas, 64.73% branches, 56.14%
  funciones.** Motor de cálculo (`lib/rules/v1/`): 93-94%.

### Etapa 3 — CI: E2E en GitHub Actions + Dependabot (P1) — `ci:`
- `.github/workflows/ci.yml`: nuevo job `e2e` (Playwright) que depende del
  job `quality`. Sube report y traces como artifacts.
- `.github/dependabot.yml` (nuevo): renovación mensual de npm + GitHub
  Actions, agrupando minor+patch en un PR por ecosistema.

### Etapa 4 — DX (P2) — `docs:`
- `package.json`: `engines` (node>=22, npm>=11).
- `README.md`: secciones "Troubleshooting" y "Contribuir".
- `AGENTS.md` §4: `Invoke-RestMethod` → `Invoke-RestMethod (PowerShell) o curl`.

### Etapa 5 — Cierre y validación
Pipeline completo validado en verde (ver abajo).

### Validación final (6/6 pasos en verde)
| Comando | Resultado |
|---|---|
| `npm run lint` | 0 errores (1 warning preexistente no relacionado) |
| `npx tsc --noEmit` | 0 errores (incluye `scripts/` raíz) |
| `npm test` | 397/397 (19 suites) |
| `npm run test:coverage` | 66.21% líneas (umbral 35% superado) |
| `npm run validate:dates` | 159 posts OK, ninguna fecha futura |
| `npm run build` | Compiled + TypeScript OK + IndexNow dry-run OK |

### Definición de Done cumplida
- ✅ `git ls-files auditoria-blog/` devuelve 0 archivos.
- ✅ CHANGELOG §"Estado actual" coincide con HEAD.
- ✅ Coverage medible y umbral respetado.
- ✅ Scripts validados por tsc en CI.
- ✅ Job E2E presente en CI (se ejecutará en el próximo push/PR).
- ✅ Dependabot configurado.
- ✅ Sin deuda crítica nueva.

### Nota de honestidad (AGENTS.md R11)
El job E2E del CI **no se ha validado con ejecución real en GitHub Actions**
desde esta sesión (requiere push al remoto). La config YAML es sintácticamente
válida (verificada con js-yaml) y `playwright.config.ts` ya estaba preparado
para CI desde releases anteriores.

---

## Estado actual resumido

| Aspecto | Valor |
|---------|-------|
| **Última release** | Release 88 — Fase HQC (Higiene + Calidad + Coherencia) |
| **Commit** | _(ver `git log -1`)_ |
| **Fecha** | 2026-06-20 |
| **Build** | ✅ Compiled + TypeScript OK |
| **Tests** | 397/397 (19 suites) + 37 E2E (job CI añadido) |
| **Coverage** | ✅ 66.21% líneas (umbral 35%) |
| **validate:dates** | ✅ 159 posts sin fechas futuras |
| **content:audit** | ❌ 71 posts vencidos editoriales (pendiente humano, no bug) |
| **Pendiente externo crítico** | Rotar OAuth Client Secret en GCP + configurar `RESEND_WEBHOOK_SECRET` en Vercel |

---

`kilo.json`, `CLAUDE.md` y el directorio completo `.kilo/` (14 archivos:
agente SEOSenior, 5 comandos, 1 regla, 5 skills y configs) estaban commiteados
en git a pesar de que Release 84 los declaró "legacy / no operativos". Esta
contradicción podía confundir a los agentes y crear conflictos de modelo.

**Cambios:**
- `git rm` de `kilo.json`, `CLAUDE.md` y `.kilo/` (14 archivos eliminados del
  tracking; permanecen en disco local si existen).
- `.gitignore`: entradas para `kilo.json`, `CLAUDE.md`, `.kilo/`.
- `AGENTS.md` §6 y §9: redacción actualizada — los archivos ya no son "legacy
  que puede existir", sino "eliminados del repo, no recrear".
- `README.md`: fila de `.kilo/` eliminada de la tabla de docs; sección
  "Tooling IA" actualizada.

**No se modificó:** código funcional, rutas, SEO, schemas, auth, proxy, motor
de cálculo, ni ningún archivo de configuración operativa.

**Validación:** lint 0 errores.

---

## Release 87 — Eliminación de tooling IA legacy del repositorio (2026-06-19)

`kilo.json`, `CLAUDE.md` y el directorio completo `.kilo/` (14 archivos:
agente SEOSenior, 5 comandos, 1 regla, 5 skills y configs) estaban commiteados
en git a pesar de que Release 84 los declaró "legacy / no operativos". Esta
contradicción podía confundir a los agentes y crear conflictos de modelo.

**Cambios:**
- `git rm` de `kilo.json`, `CLAUDE.md` y `.kilo/` (14 archivos eliminados del
  tracking; permanecen en disco local si existen).
- `.gitignore`: entradas para `kilo.json`, `CLAUDE.md`, `.kilo/`.
- `AGENTS.md` §6 y §9: redacción actualizada — los archivos ya no son "legacy
  que puede existir", sino "eliminados del repo, no recrear".
- `README.md`: fila de `.kilo/` eliminada de la tabla de docs; sección
  "Tooling IA" actualizada.

**No se modificó:** código funcional, rutas, SEO, schemas, auth, proxy, motor
de cálculo, ni ningún archivo de configuración operativa.

**Validación:** lint 0 errores.

---

## Release 86 — Auditoría GSC, Bing Webmaster Tools y GA4 (2026-06-20)

Auditoría integral de las tres plataformas de medición/indexación, con
corrección del único problema real detectado desde el repositorio.

**Diagnóstico (datos reales, 28 días):**
- GSC: propiedad `sc-domain` verificada; 8/9 URLs prioritarias indexadas
  (`/como-llegar` "Descubierta sin indexar"); 0 clics / 3 impresiones.
- Bing WMT: verificado vía `BingSiteAuth.xml` (200); IndexNow key pública
  consistente; dry-run OK (11 URLs, 0 privadas).
- GA4: conectado (165 usuarios/28d); GA4 frontend sin duplicar.

**Problema corregido (GA4 contaminado por intranet):**
GA4 y Clarity se cargaban en TODAS las rutas (incluida `/intranet/admin/*`),
haciendo que las páginas internas aparecieran entre las top pages de
marketing. Causa: `app/layout.tsx` montaba los `<Script>` sin filtro de
pathname. Corrección: nuevo componente `components/analytics-scripts.tsx`
(client, usa `usePathname()`) que excluye `/intranet`, `/preview`, `/api`.

**Informe completo:** `docs/seo-search-console-bing-ga-audit.md` (14 secciones:
resumen, GSC, Bing, IndexNow, GA4, eventos, cruce GSC+GA4, URLs prioritarias,
problemas técnicos/editoriales/autoridad, acciones aplicadas, acciones externas,
plan 7/14/30 días).

**Script reproducible:** `scripts/seo-audit-gsc-ga4.mjs` (consulta GSC + GA4 en
vivo, salida `scripts/.seo-audit.json`).

**Acciones externas documentadas (NO de código):** eliminar propiedad GSC con
typo "asocioshn", solicitar indexación de `/como-llegar`, añadir
`NEXT_PUBLIC_CLARITY_ID` en Vercel, marcar eventos como conversión en GA4 Admin,
excluir bots en GA4, redeploy.

**Archivos modificados:** `components/analytics-scripts.tsx` (nuevo),
`app/layout.tsx`, `scripts/seo-audit-gsc-ga4.mjs` (nuevo),
`docs/seo-search-console-bing-ga-audit.md` (nuevo), `.gitignore`.

**Validación:** lint 0 errores, build OK, test 397/397, validate:dates OK,
indexnow:dry OK, `seo-audit-gsc-ga4.mjs` GSC+GA4 conectados.

---

## Release 85 — CTA fusionado en landings locales + modelos IA no fijados en doc (2026-06-19)

**Punto 1 — CTA duplicado en landings locales (abogados-en-*):**
Las 3 landings de SEO local tenían dos bloques CTA consecutivos (uno dinámico
por ciudad y otro hardcoded "Nacaome, Valle"). Se fusionaron en un único bloque
con eyebrow, título, subtítulo y 3 botones (WhatsApp, solicitar consulta, llamar),
todos coherentes con la ciudad de la URL. Verificado en producción.

**Punto 2 — Modelos de IA no fijados en documentación:**
Los modelos de IA cambian dinámicamente según el entorno. README.md y AGENTS.md
ya no listan modelos concretos (GLM, DeepSeek, etc.) que queden obsoletos al
cambiar de modelo en ejecución. Las reglas aplican independientemente del modelo.

**Archivos modificados:** `components/marketing/landing-local.tsx`, `README.md`,
`AGENTS.md`.

**Validación:** lint 0 errores, build OK, test 397/397, deploy verificado en
producción (las 3 landings con CTA corregido).

---

## Release 84 — Actualización de tooling IA a OpenCode y Zcode (2026-06-19)

Normalización del protocolo de agentes IA. OpenCode y Zcode pasan a ser el
tooling activo. Kilo, SEOSenior y configuraciones `.kilo/` quedan como legacy.

**Cambios:**
- `AGENTS.md`: nueva sección §6 (herramientas y modelos de IA — sin fijar
  modelos concretos; reglas SEO autosuficientes).
- `README.md`: nueva sección "Tooling IA". Referencias a Kilo/SEOSenior
  eliminadas o marcadas como legacy.
- `CHANGELOG.md`: entrada actual (Release 84).
- No se modificó código funcional, rutas, SEO, schemas, auth, proxy ni motor
  de cálculo.

**Validación:** lint 0 errores, build OK, test 397/397.

---

## Release 83 — Normalización de marca como Pineda y Asociados (2026-06-19)

Unificación del nombre del proyecto bajo la marca "Pineda y Asociados" en
documentación, texto visible de la interfaz, metadatos y prompts de agentes.

**Cambios:**
- README, AGENTS, CHANGELOG, docs/: título normalizado.
- Intranet (sidebar, admin panel): "LEX HONDURAS" → "Pineda y Asociados".
- PDF (informes periciales): marca + email actualizados.
- `.kilo/agent/SEOSenior.md`: prompt actualizado.
- `docs/normalizacion-marca.md`: documento de decisión y reglas.

**No se modificaron:** rutas locales, nombres de proyecto Vercel, URLs
técnicas, valores de test, archivos legacy/backup.

**Validación:** lint 0 errores, build OK, test 397/397.

---

## Últimas releases

### Release 83 — Corrección GA4 Realtime: centralización, exclusión de intranet y limpieza de eventos (2026-06-25)

**Diagnóstico:** El error `400 OK` en la API interna de GA4 Realtime
(`/analytics/v2/realtime/venus/getData`) está causado por una combinación de:
1. GA4 montado en el **root layout** — envolvía todas las rutas (públicas e intranet).
2. Parámetros de eventos UA-style (`event_category`, `event_label`) y `non_interaction`
   enviados a GA4 sin filtrar, potencialmente causando datos mal formados.
3. Sin SPA route tracking — `gtag('config')` se llamaba sin `send_page_view: false`,
   y no se enviaban `page_view` en navegación cliente.

**Cambios aplicados:**

- **`components/analytics-scripts.tsx`**: Reescrito para usar `send_page_view: false`
  en la config de gtag. Añadido tracking SPA vía `usePathname` + `useRef` que envía
  `page_view` con `page_path`, `page_location` y `page_title` limpios en cada cambio
  de ruta. Ampliadas rutas excluidas (`/_next`, `/404`). Eliminados comentarios
  redundantes.
- **`app/layout.tsx`**: Eliminada importación y render de `<AnalyticsScripts>`.
  Se mantiene solo el `<link rel="preconnect">` para `googletagmanager.com` (DNS
  hint inofensivo en rutas privadas). Eliminados comentarios de GA4.
- **`app/(public)/layout.tsx`**: Añadida importación y render de `<AnalyticsScripts>`
  con `gaId` y `clarityId`. Ahora GA4/Clarity solo se cargan en rutas públicas.
- **`lib/analytics.ts`**: Eliminados parámetros UA-style (`event_category`,
  `event_label`, `non_interaction`). Añadido `cleanParams()` que filtra valores
  `undefined`/`null` antes de enviar a gtag. Funciones simplificadas a `{ value: 1 }`.

**Measurement ID usado:** `G-L2PGBN3SWK` (formato G-... correcto).
**Property ID (server-side):** `541022095` (solo para Data API, no para frontend).

**Validación:** lint OK, build OK, 601/601 tests OK.
**Validación pendiente:** Verificar en GA4 Realtime que el error 400 desaparezca
(típicamente minutos después de recibir datos limpios).

---

Ejecución completa del plan de `docs/auditoria-repositorio-integral.md`. 7 commits
atómicos. Detalle en §19 del informe.

**Archivos clave:** 16 archivos modificados, 83 movidos a legacy.

**Validación:** lint OK, build OK, 397 tests OK, 37 E2E OK, validate:dates OK,
content:audit = 71 vencidos editoriales (pendiente humano).

---

### Release 81 — Endurecimiento de validadores y seguridad de endpoints críticos (2026-06-19)

**Correcciones:**
- Validadores: `MAX_DATE` dinámica (era hardcodeada → falsos positivos).
  **No se modificaron datos del blog** (verificado contra Neon).
- Webhook Resend: verificación de firma Svix (`lib/webhook-verify.ts`), escape
  HTML anti-XSS, 503 seguro en producción si falta `RESEND_WEBHOOK_SECRET`.
- OAuth callback: ya no devuelve `refresh_token` en body.
- Secreto OAuth filtrado eliminado de `oauth-get-refresh-token.mjs` (lee de env).
- `.env.example`: +`RESEND_WEBHOOK_SECRET`, +`OAUTH_CLIENT_ID`/`OAUTH_CLIENT_SECRET`.

**Archivos clave:** `scripts/validar-fechas-blog.ts`, `scripts/content-audit.ts`,
`app/api/email/inbound/route.ts`, `app/api/oauth/callback/route.ts`,
`lib/webhook-verify.ts` (nuevo), `scripts/oauth-get-refresh-token.mjs`.

**Validación:** lint OK, build OK, 382/382 tests OK, validate:dates ✅ (antes FAIL).

---

### Release 80 — Fase 1 + Fase 3 del plan de indexación: canonicalización + enlazado (2026-06-19)

**Punto 1 — Sitemap excluye posts canonicalizados** (`app/sitemap.ts`):
Posts con `canonicalUrl` apuntando a otra URL del propio dominio no aparecen
como URLs independientes en `sitemap.xml`.

**Punto 2 — Enlazado interno en `/hondurenos-en-espana`**:
Añadido `BlogHighlights` con 6 posts estratégicos.

**Punto 3 — Script de auditoría** (`scripts/auditar-indexacion-prioritaria.mjs`):
Health-check de 15 URLs prioritarias en producción.

**Validación:** lint OK, build OK, 382/382 tests OK, 37/37 E2E OK.

---

### Releases anteriores

Ver [`docs/legacy/CHANGELOG_ARCHIVE.md`](./docs/legacy/CHANGELOG_ARCHIVE.md)
para Releases 1–79.
