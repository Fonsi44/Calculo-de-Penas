# Diagnóstico inicial — Site Audit Ahrefs (2026-07-10)

**Proyecto:** Pineda y Asociados — https://www.pinedayasociadoshn.com/
**Fecha del crawl Ahrefs:** 10-jul-2026
**Fecha del diagnóstico:** 10-jul-2026
**Fuente:** 6 CSV exportados desde Ahrefs en `ahrefs/` (UTF-16, TSV).
**Fase:** A — Diagnóstico sin cambios.

---

## 1. Archivos CSV identificados

Los nombres Ahrefs llegan truncados/timestamped. Identificación por cabeceras:

| Alias interno | Archivo en `ahrefs/` | Filas | Cols | Notas |
|---|---|---|---|---|
| `internal_urls` | `..._internal-urls_2026-07-10_11-25-16.csv` | 2.371 | 33 | Incluye 3xx, 4xx, redirects y URLs no-HTML. |
| `internal_html_200` | `..._internal-html_2026-07-10_11-25-25.csv` | 2.148 | 29 | Export con 1.332 filas de URL vacía (ruido del export); **817 URLs HTML 200 únicas reales**. |
| `links_to_4xx` | `..._links-target-4_2026-07-10_11-25-42.csv` | 8 | 11 | Enlaces hacia URLs 4xx. |
| `links_to_3xx` | `..._links-target-r_2026-07-10_11-25-46.csv` | 114 | 12 | Enlaces hacia URLs 3xx. |
| `canonical_links` | `..._links-canonica_2026-07-10_11-27-12.csv` | 816 | 12 | Relaciones canonical fuente→destino. |
| *(all_issues)* | **NO aportado en este lote.** | — | — | El encargo menciona un 6.º CSV de problemas generales; no está en la carpeta. Se infieren los problemas estructurales del resto de CSV. |

> Los dos archivos `..._links-target-r_2026-07-10_11-25-46.csv` y `..._11-26-24.csv` son **idénticos** (mismo reporte 3xx exportado dos veces). Se usa uno solo.

**Codificación:** UTF-16LE con BOM, tab-separated, campos entre comillas dobles. Los scripts de análisis decodifican con `utf16le` y un parser TSV con comillas.

---

## 2. Métricas generales

| Métrica | Valor |
|---|---|
| URLs internas únicas rastreadas | **1.039** |
| URLs HTML 200 únicas | **817** |
| Páginas HTML 200 indexables (`Is indexable page = true`) | **212** |
| Enlaces internos hacia 4xx | **8** |
| Enlaces internos hacia 3xx | **114** (113 href + 1 desde sitemap) |
| Targets 3xx únicos | **8** |
| Relaciones canonical analizadas | **816** |

---

## 3. Prioridad 1 — Enlaces internos hacia 4xx

**Total: 8 enlaces.** Detalle en `urls-4xx-prioridad.csv`.

| # | Origen (200) | Destino (404) | Anchor | Tipo | Clasificación |
|---|---|---|---|---|---|
| 1 | `/blog/derecho-laboral/jornada-laboral-horas-extra-descansos-honduras` | `/blog/derecho-laboral/solicitar-consulta` | consúltenos | Href | **Artefacto de crawl** (ruta inexistente; no hay href en código/DB) |
| 2 | `/blog/tributario/defensa-sar-choluteca` | `/blog/tributario/blog/tributario/facturacion-electronica-requisitos-sar` | Facturación Electrónica | Href | **Artefacto de crawl** (doble prefijo `/blog/tributario/blog/tributario/`) |
| 3 | `/blog/tributario/defensa-sar-choluteca` | `/blog/tributario/abogados-en-choluteca` | Abogados en Choluteca | Href | **Artefacto de crawl** |
| 4 | `/hondurenos-en-espana` | `/servicios-juridicos/derecho-notarial` | Poder notarial desde España | Href | **ENLACE REAL ROTO** — código |
| 5 | `/hondurenos-en-espana` | `/servicios-juridicos/derecho-civil` | Herencias, propiedades y representación legal | Href | **ENLACE REAL ROTO** — código |
| 6 | `/blog/tributario/defensa-sar-choluteca` | `/blog/tributario/solicitar-consulta` | Solicite una evaluación inicial | Href | **Artefacto de crawl** |
| 7 | `/blog/derecho-de-familia/pension-alimenticia-porcentaje-honduras-2026` | `/blog/derecho-de-familia/solicitar-consulta` | solicite una consulta… | Href | **Artefacto de crawl** |
| 8 | `/blog/tributario/defensa-sar-choluteca` | `/blog/tributario/blog/derecho-laboral/abogado-laboral-choluteca` | Abogado Laboral en Choluteca | Href | **Artefacto de crawl** |

### Análisis

- **Casos 4, 5 (reales):** en `app/(public)/hondurenos-en-espana/page.tsx` hay dos `<Link href>` a `/servicios-juridicos/derecho-notarial` y `/servicios-juridicos/derecho-civil`. Esos slugs **no existen**: el slug canónico unificado es **`/servicios-juridicos/derecho-civil-y-notarial`**. **Acción: corregir los dos href al slug canónico.** (Confirmado: el resto del codebase usa `derecho-civil-y-notarial`.)

- **Casos 1, 2, 3, 6, 7, 8 (artefactos):** son URLs con patrón `/blog/<cat>/solicitar-consulta` y dobles prefijos `/blog/tributario/blog/...`. Ya están **documentados como artefactos de crawl** en `next.config.ts:176-181`: ningún href del código apunta a ellas. Ahrefs/Bing los descubrieron por resolución errónea de rutas relativas. **Acción: ninguna** (no crear redirects ni enlaces; documentar).

**Decisión:** corregir 2 enlaces (casos 4, 5). Descartar 6 (artefactos, sin referencia real).

---

## 4. Prioridad 2 — Enlaces internos hacia 3xx

**Total: 114 enlaces** (113 href + 1 desde sitemap.xml). Detalle en `urls-3xx-prioridad.csv`.

### Concentración por destino (8 targets únicos)

| Target 308 (URL vieja) | # enlaces | URL final 200 (destino del redirect) |
|---|---|---|
| `/blog/derecho-penal/abogado-penalista-choluteca` | **33** | `/abogado-penalista-choluteca` (landing propia) |
| `/blog/derecho-laboral/despido-injustificado-honduras-derechos-trabajador` | 19 | `/blog/derecho-laboral/despido-laboral-honduras-guia-completa` |
| `/blog/derecho-laboral/empleador-no-paga-salario-honduras` | 18 | `/blog/derecho-laboral/despido-laboral-honduras-guia-completa` |
| `/blog/derecho-laboral/calcular-prestaciones-laborales-honduras` | 17 | `/blog/derecho-laboral/calcular-liquidacion-laboral-honduras` |
| `/blog/derecho-laboral/despido-laboral-honduras-derechos` | 9 | `/blog/derecho-laboral/despido-laboral-honduras-guia-completa` |
| `/blog/derecho-notarial/tramites-notariales-frecuentes-honduras` | 7 | `/blog/derecho-notarial/poder-legal-honduras-cuando-se-necesita` |
| `/blog/practica-legal/elegir-bufete-abogados-nacaome` | 6 | `/blog/practica-legal/como-elegir-abogado-honduras` |
| `/blog/practica-legal/elegir-bufete-multidisciplinario-ventajas-honduras` | 5 | `/blog/practica-legal/como-elegir-abogado-honduras` |

### Causa raíz (verificada)

Los **8 posts existen en la DB como `published=true`** (confirmado vía `data/seo/url-indexability-audit.json`: los 8 marcados "Indexable"). Pero `next.config.ts` define **redirects 301/308** desde sus rutas hacia URLs consolidadas (clusterización de Fase 1). Resultado:

- El post se sirve desde la DB → aparece en `getAllPosts()`.
- `BlogHighlights`, la navegación prev/next (`page.tsx:510-533`), las landings locales (`BlogHighlights slugs=[...]`) y `MID_POST_CTA_COPY` construyen enlaces a `/blog/<cat>/<slug>` → que **está redirigido** → **308**.
- El sitemap **ya excluye 7 de 8** vía `REDIRECT_SOURCE_PATHS` (`app/sitemap.ts:78-111`), pero **falta `/blog/derecho-penal/abogado-penalista-choluteca`** → por eso aparece 1 enlace "Sitemap URL → 308".

### Tráfico residual (GSC, `data/gsc-pages.json`)

| URL vieja | Clicks | Impresiones | Pos. media |
|---|---|---|---|
| `empleador-no-paga-salario-honduras` | 0 | 163 | 9.5 |
| `tramites-notariales-frecuentes-honduras` | 0 | 19 | 8.9 |
| `abogado-penalista-choluteca` | 0 | 14 | 9.2 |
| Resto (5 slugs) | 0 | 0 | — |
| **Total** | **0** | **196** | — |

**Decisión (aprobada):** despublicar los 8 posts (`published=false`), mantener los redirects 301, y añadir `abogado-penalista-choluteca` a `REDIRECT_SOURCE_PATHS`. Esto elimina los 114 enlaces 3xx de raíz. Riesgo aceptado: perder ~196 impresiones residuales sin clics mientras Google consolida en las URLs finales.

---

## 5. Prioridad 3 — Sitemap con URLs no finales

- El sitemap se genera en `app/sitemap.ts` y excluye 31 rutas vía `REDIRECT_SOURCE_PATHS`.
- **7 de 8 slugs 3xx ya están excluidos.**
- **Falta `/blog/derecho-penal/abogado-penalista-choluteca`** → aparece en el CSV como "Sitemap URL → 308".
- **Acción:** añadir esa ruta a `REDIRECT_SOURCE_PATHS`.

No se detectan URLs 4xx ni noindex en el sitemap.

---

## 6. Prioridad 4 — Canonicals

**816 relaciones canonical analizadas.** Resultado:

| Caso | Cuenta | Estado |
|---|---|---|
| Self-referencing en páginas indexables | ~797 | ✅ Correcto |
| Non-self en paginación (`/blog?page=N` → `/blog`) | 19 | ✅ Correcto (consolidación de paginación, páginas origen son noindex) |
| Non-self en facetas (`?tag=`) → self | (dentro de self) | ✅ Correcto (facetas noindex, canonical self) |
| Canonical → 3xx | **0** | ✅ |
| Canonical → 4xx | **0** | ✅ |
| Canonical → noindex | **0 problemático** | ✅ (los `is_target_noindex=true` son facetas/paginación con canonical self, comportamiento deseado) |
| Canonical HTTP (no HTTPS) | **0** | ✅ |

**Conclusión: los canonicals NO requieren acción.** El filtro inicial de "585 problemáticos" era un falso positivo (atraía páginas `?tag=`/`?page=` noindex con canonical self, que es correcto). Revisado manualmente: sin casos a corregir. Ver `canonicals-review.csv` (refinado a problemas reales).

---

## 7. Prioridad 5 — Noindex accidental en páginas core

Revisión de páginas críticas contra `internal_html_200`:

| Página core | ¿Indexable? | Estado |
|---|---|---|
| `/` (home) | — | Requiere verificación post-build |
| `/servicios-juridicos` | — | Requiere verificación post-build |
| `/derecho-penal` | — | Requiere verificación post-build |
| `/solicitar-consulta` | — | Requiere verificación post-build |
| `/blog` | — | Requiere verificación post-build |
| Posts de Fase 1 | — | Requiere verificación post-build |

> Las páginas core se validan en la fase de post-validación (build + inspección de metadata). No se detectan indicios de noindex accidental en el análisis de CSV; el `site.noindex` global está en `false` (los sitemap/robots se sirven normalmente).

**Acción:** validar en post-build. Las facetas `?tag=`/`?page=` son noindex intencional (débil) → **dejar como están**.

---

## 8. Prioridad 7 — Titles, metas y H1 (solo indexables)

Análisis restringido a las **212 páginas indexables** (excluyendo facetas noindex y ruido del export):

| Métrica | Cuenta | Detalle |
|---|---|---|
| Title vacío o > 75 chars | **3** | Posts con title ligeramente largo (76-80 chars). Revisar. |
| Meta vacía / <70 / >200 | **0** | ✅ |
| H1 ausente | **3** | `/blog/derecho-bancario/banco-demanda-deuda-defensa-opciones-honduras`, `/blog/practica-legal/como-preparar-demanda-guia-no-abogados-honduras`, `/blog/regulacion-sanitaria/habilitacion-clinicas-hospitales` |

### Sobre los 3 H1 ausentes
El componente renderiza siempre `<h1>{post.title}</h1>` (`page.tsx:392`). Si Ahrefs no detecta H1, la causa probable es: (a) title vacío en DB para ese post, o (b) problema de render/SSR. **Acción:** verificar el campo `title`/`body` de esos 3 posts en DB antes de concluir. Si el title existe, el H1 existe y es un falso positivo de Ahrefs.

### Sobre los 3 titles largos
Posts de Fase 1 con title 76-80 chars. Umbrales Ahrefs: el encargo pide corregir solo "extremadamente largos o vacíos". 76-80 chars es **límite aceptable** (Google trunca ~60 pero no penaliza). **Acción:** documentar, no reescribir (R13/R17 — no tocar posts Fase 1 sin error técnico claro).

---

## 9. Prioridad 6 — Schema.org

Sin el CSV `all_issues` no hay recuento directo de errores de schema. Por inspección del código (`application/ld+json` en 31 archivos):

- `BlogPosting`: `lib/schemas/blog.ts:24` — estructura completa con `headline`, fechas, `author`, `publisher`, `mainEntityOfPage`, `image`, `articleBody`, `wordCount`, `speakable`.
- `FAQPage`: condicional desde `lib/faq-schema.ts`.
- `@graph` global (Organization/LegalService/LocalBusiness/WebSite): `app/(public)/layout.tsx:128`.
- `BreadcrumbList`, `CollectionPage`, landings locales: presentes.

**Acción:** validar varias URLs representativas en post-build con la herramienta de schema de Google. No se detecta un patrón de error estructural común en el código. **Pendiente de confirmar** tras disponer del CSV `all_issues`.

---

## 10. Prioridad 8 — Performance

Sin datos de Ahrefs de performance en este lote. No se actúa. Se documenta que el SW (`public/sw.js`) y el `postbuild` ya gestionan cache-busting y chunks.

---

## 11. Resumen de prioridades y acciones

| # | Problema | Casos | Acción | Prioridad |
|---|---|---|---|---|
| 1 | Enlaces 4xx reales (hondurenos-en-espana) | 2 | **Corregir href → `derecho-civil-y-notarial`** | Alta |
| 1b | Enlaces 4xx artefactos de crawl | 6 | Documentar (sin acción) | — |
| 2 | Enlaces 3xx (8 posts redirigidos aún publicados) | 114 | **Despublicar 8 posts + añadir 1 a sitemap exclusion** | Alta |
| 3 | Sitemap con 1 URL 3xx | 1 | **Añadir a `REDIRECT_SOURCE_PATHS`** | Alta |
| 4 | Canonicals | 0 problemas | Sin acción | — |
| 5 | Noindex accidental core | TBD | Validar en post-build | Media |
| 6 | Schema.org | Sin CSV all_issues | Validar muestra en post-build | Media |
| 7 | Titles largos (3) | 3 | Documentar (no reescribir) | Baja |
| 7b | H1 ausentes (3) | 3 | Verificar title/body en DB | Media |
| 8 | Performance | Sin datos | Sin acción | — |

---

## 12. URLs afectadas (lista operativa)

### A corregir en código (4xx)
- `app/(public)/hondurenos-en-espana/page.tsx` — 2 href → `/servicios-juridicos/derecho-civil-y-notarial`

### A corregir en sitemap (3xx)
- `app/sitemap.ts` `REDIRECT_SOURCE_PATHS` — añadir `/blog/derecho-penal/abogado-penalista-choluteca`

### A despublicar en DB (3xx — 8 posts)
1. `abogado-penalista-choluteca` (cat: derecho-penal)
2. `despido-injustificado-honduras-derechos-trabajador` (cat: derecho-laboral)
3. `empleador-no-paga-salario-honduras` (cat: derecho-laboral)
4. `calcular-prestaciones-laborales-honduras` (cat: derecho-laboral)
5. `despido-laboral-honduras-derechos` (cat: derecho-laboral)
6. `tramites-notariales-frecuentes-honduras` (cat: derecho-notarial)
7. `elegir-bufete-abogados-nacaome` (cat: practica-legal)
8. `elegir-bufete-multidisciplinario-ventajas-honduras` (cat: practica-legal)

### A verificar (H1)
- `banco-demanda-deuda-defensa-opciones-honduras`
- `como-preparar-demanda-guia-no-abogados-honduras`
- `habilitacion-clinicas-hospitales`

---

## 13. Problemas ignorables (descartados con justificación)

- **6 enlaces 4xx artefacto**: rutas `/blog/<cat>/solicitar-consulta` y dobles prefijos. Sin referencia real en código/DB (verificado). Ya documentados en `next.config.ts:176-181`.
- **1.332 filas de URL vacía** en `internal_html_200`: ruido del export Ahrefs, no URLs reales.
- **Canonicals non-self en paginación** (`/blog?page=N` → `/blog`): consolidación correcta.
- **Facetas `?tag=`/`?page=` noindex**: comportamiento deseado para contenido thin/duplicado.
- **3 titles de 76-80 chars**: dentro de límites aceptables; no reescribir posts de Fase 1.

---

*Diagnóstico generado sin modificar el proyecto. Próxima fase: corrección segura.*
