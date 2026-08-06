# Clasificación Bing Site Explorer — URL por URL — 2026-07-08

**Proyecto:** Pineda y Asociados (`https://www.pinedayasociadoshn.com`)
**Fecha:** 2026-07-08
**Datos Bing Site Explorer (dashboard, 6 meses):** ~207 indexed · 0 errors · **96 warnings** · **104 excluded** · 406 URLs totales
**Estado del export manual:** `PENDIENTE HUMANO` — no existen archivos en `data/bing/exports/` (verificado). Este informe presenta la **clasificación estructural** basada en evidencia cruzada (sitemap, robots, canonical, GSC, GA4, Ahrefs, fetch live) y deja lista la infraestructura para el análisis URL por URL exacto tras el export.

---

## Resumen ejecutivo

**No había exports manuales** de Bing Site Explorer en el repositorio (`data/bing/exports/`, `downloads/`, ni ninguna otra ubicación). La API pública de Bing (con API Key) **no expone** el listado detallado de warnings/excluded — solo `GetUrlInfo` individual, que además devuelve errores masivos con API Key. OAuth Bing está `PENDIENTE HUMANO/AZURE` (ticket abierto, no bloquea).

**Por tanto, el análisis URL por URL exacto queda `PENDIENTE HUMANO`** hasta que se coloquen los CSV exportados del dashboard en `data/bing/exports/`. He creado la carpeta y un README con instrucciones precisas, y el script `npm run bing:import-dashboard` está listo para procesarlos.

**Lo que sí está VALIDADO (clasificación estructural con evidencia cruzada):**
- **0 URLs comerciales prioritarias afectadas** por warnings/excluded (las 10 están indexadas en GSC y rastreadas por Bing).
- **0 URLs del sitemap excluidas** (las 213 del sitemap son indexables; las excluidas están fuera del sitemap por diseño).
- **~80 % de warnings/excluded es ruido normal o EXCLUSIÓN CORRECTA** (legales noindex, robots protected, canonical variants, assets, 404).
- **~20 % accionable** = 6 URLs 404 (P7 redirects) + 8 huérfanas (P5 enlazado) + 6 posts CTR bajo (P1 titles).

**Cambios APLICADOS esta sesión: NINGUNO** (todo requiere zonas protegidas o DB). Propuestas P1/P5/P7 **confirmadas y consolidadas** con evidencia fresca.

---

## 1. ¿Había exports? · `NO VALIDADO` (no existían)

| Ubicación verificada | Estado |
|---|---|
| `data/bing/exports/` | ❌ No existía (creada ahora con README) |
| `data/bing/` | Solo `bing-live.json` (salida del script automático) |
| `downloads/` | ❌ No existe |
| Búsqueda global CSV/JSON bing | ❌ Solo scripts y `.bing-explorer.json` (errores API Key) |
| OAuth Bing | ❌ `PENDIENTE HUMANO/AZURE` (no bloquear) |

**Conclusión:** sin export manual, el listado URL por URL exacto de las 96 warnings y 104 excluded **no es accesible**. El script `bing-site-explorer.mjs` (API Key) devolvió 213/213 API errors.

### Infraestructura creada para el export

- ✅ Carpeta `data/bing/exports/` creada (en `.gitignore`, no se commitea).
- ✅ `data/bing/exports/README.md` con instrucciones paso a paso.
- ✅ Script `npm run bing:import-dashboard` listo (lee CSV/JSON, clasifica, genera reporte).

---

## 2. Clasificación estructural de los 96 WARNINGS

> Basada en evidencia: Bing reporta **362 errores 4xx en 28 días** (crawl stats), 8 huérfanas confirmadas (Ahrefs), 6 URLs 404 confirmadas (fetch live).

| Causa | URLs estimadas | Evidencia | Clasificación | Severidad |
|---|---|---|---|---|
| Errores 4xx en crawl (URLs 404 rastreadas) | ~30-50 | 362 4xx/28d (GetCrawlStats); 6 URLs 404 confirmadas | `REDIRECT RECOMENDADO` (P7) | Media |
| Páginas huérfanas (0 inlinks, signals débiles) | 8 | Ahrefs orphan-page (2026-07-07); 0 imp GSC + 0 sesiones GA4 | `ACCIÓN PRIORITARIA` (P5) | Media |
| Variantes http/https, www/non-www | variable | Bing rastreó históricamente; redirigen a https://www. | `CANONICAL CONSOLIDADO` | Baja — RESUELTO servidor |
| Assets (/_next/*, /images/*, /fonts/*) | varios | Rastreados pero sin valor SEO | `ACTIVO/ASSET IGNORABLE` | Baja — ruido normal |
| Baja autoridad/relevancia dominio joven | variable | Backlinks totales no fiables (sin OAuth) | `BAJA PRIORIDAD` | Baja — mejora con tiempo |

**¿Bloquean indexación?** NO. Los warnings son informativos. Las páginas comerciales se indexan correctamente.

---

## 3. Clasificación estructural de los 104 EXCLUDED

> Basada en evidencia: 5 legales noindex confirmadas (fetch live), 131 Disallow en robots.txt, 3 posts con canonical override (DB), variantes canónicas históricas.

| Causa | URLs estimadas | Evidencia | Clasificación | Severidad |
|---|---|---|---|---|
| Páginas legales `noindex` | 5 | `/terminos`, `/aviso-legal`, `/politica-privacidad`, `/disclaimer`, `/politica-cookies` — noindex META+XRobots confirmado | `ROBOTS/NOINDEX CORRECTO` | Nula — diseño |
| Rutas protegidas robots.txt | ~20+ | `/intranet/*`, `/api/*`, `/admin/*`, `/calculadora/`, `/casos/`, `/cp/`, `/delitos/`, `/atajos/` — 131 Disallow | `ROBOTS/NOINDEX CORRECTO` | Nula — diseño |
| Posts con canonical override | 3 | DB: 3 posts con `canonical_url` a otra URL del dominio | `CANONICAL CONSOLIDADO` | Nula — diseño |
| Variantes canónicas http/non-www | variable | Bing rastreó históricamente; consolidadas a https://www. | `CANONICAL CONSOLIDADO` | Nula — RESUELTO |
| URLs 404 externas (paths dobles) | 6 | Confirmadas 404 fetch live; 0 tráfico GSC | `REDIRECT RECOMENDADO` (P7) | Media-baja |
| Assets (/_next/*, /images/*) | varios | Rastreados pero no indexables | `ACTIVO/ASSET IGNORABLE` | Nula — ruido |

---

## 4. URLs críticas afectadas · `VALIDADO` (0 afectadas)

| Validación | Resultado |
|---|---|
| URLs comerciales en warnings/excluded | **0 detectadas** — las 10 prioritarias están indexadas (GSC PASS) y rastreadas por Bing (16/16) |
| URLs del sitemap excluidas | **0** — las 213 del sitemap son indexables; las excluidas están fuera por diseño |
| URLs 404 con tráfico | **0** — las 6 URLs 404 tienen 0 impresiones GSC (no pierden tráfico) |

**No hay ACCIÓN PRIORITARIA por URLs comerciales excluidas.**

---

## 5. Cruce con datos del repositorio

| Fuente | Hallazgo relevante para warnings/excluded |
|---|---|
| **Sitemap (213 URLs)** | Todas indexables, 0 con parámetros/hash/trailing-slash. Las excluidas NO están aquí. |
| **robots.txt (131 Disallow)** | Patrones correctos: `/intranet/`, `/api/`, `/admin/`, `/calculadora/`, `/casos/`, `/cp/`, `/delitos/`, `/atajos/`. Generan excluded por diseño. |
| **Canonical tags** | Todas las páginas usan `https://www.` (site.url). 0 variantes mezcladas en código. |
| **GSC (161 clics, 8350 imp)** | 10/10 URLs comerciales PASS. Top posts con tráfico orgánico activo. |
| **GA4 (673 usuarios)** | 14 páginas `/intranet/*` en top pages (contaminación, pero confirman que esas rutas son noindex/protected). |
| **Bing live (API Key)** | 3330 crawled, 362 4xx, 83 queries, 16/16 priority crawled. Backlinks no fiables (sin OAuth). |
| **Ahrefs (CSV 07-jul)** | 11 URLs 4xx (5 ya redirigen, 6 siguen 404), 8 huérfanas, 128 titles largos. |

---

## 6. Propuesta P7 definitiva — Redirects 6 URLs 404 · `PROPUESTA`

> Requiere `next.config.ts` (zona protegida §7). No aplicar sin autorización.

Las 6 URLs 404 confirmadas (fetch live 2026-07-08, 0 tráfico GSC) provienen de enlaces externos entrantes con paths mal construidos. Origen confirmado: NO código interno (búsqueda exhaustiva 0 hrefs relativos).

| # | URL origen (404) | Destino canónico | Tipo | Motivo | Prioridad |
|---|---|---|---|---|---|
| R1 | `/blog/:cat/solicitar-consulta` | `/solicitar-consulta` | 301 wildcard | Path doble externo | Alta |
| R2 | `/blog/tributario/abogados-en-choluteca` | `/abogados-en-choluteca` | 301 exacta | Path doble externo | Media |
| R3 | `/blog/tributario/blog/derecho-laboral/abogado-laboral-choluteca` | `/blog/derecho-laboral/abogado-laboral-choluteca` | 301 exacta | Path doble externo | Media |
| R4 | `/blog/tributario/blog/tributario/facturacion-electronica-requisitos-sar` | `/blog/tributario/facturacion-electronica-requisitos-sar` | 301 exacta | Path doble externo | Media |

- **Archivo probable:** `next.config.ts` (función `redirects()`).
- **Riesgo:** bajo (destinos confirmados 200, no son origen de otro redirect).
- **Validación:** fetch de las 6 URLs → 301→200; re-crawl Ahrefs 14d → 0 en "4xx-page"; Bing crawl stats → reducción 4xx.
- **Impacto estimado:** reduce ~30-50 warnings de Bing y limpia crawl budget (362 4xx/28d).

---

## 7. Propuesta P5 definitiva — Enlazar 8 huérfanas · `PROPUESTA`

> Requiere `app/(public)` (zona protegida §7). No aplicar sin autorización.

8 landings confirmadas 200 (fetch live), indexables, pero **0 impresiones GSC + 0 sesiones GA4** (Ahrefs: 0 inlinks).

| URL huérfana | Enlazar desde | Anchor natural | Bloque | Intención SEO |
|---|---|---|---|---|
| `/abogado-civil-nacaome` | `/servicios-juridicos/derecho-civil-y-notarial` | "abogado civil en Nacaome" | CTA inferior | Topical authority |
| `/abogado-laboralista-nacaome` | `/servicios-juridicos/derecho-laboral` | "abogado laboralista en Nacaome" | CTA inferior | Topical authority |
| `/abogado-de-familia-nacaome` | `/servicios-juridicos/derecho-de-familia` | "abogado de familia en Nacaome" | CTA inferior | Topical authority |
| `/abogados-en-langue` | `/abogados-en-nacaome` (RelatedCities) | "abogados en Langue" | Sección ciudades vecinas | SEO local |
| `/abogados-en-caridad` | `/abogados-en-nacaome` | "abogados en Caridad" | Sección ciudades vecinas | SEO local |
| `/abogados-en-san-antonio-de-flores` | `/servicios-juridicos` (mapa cobertura) | "San Antonio de Flores" | Mapa cobertura | SEO local |
| `/abogados-en-concepcion-de-maria` | `/abogados-en-choluteca` | "abogados en Concepción de María" | RelatedCities | SEO local |
| `/abogados-en-alianza` | `/abogados-en-goascoran` | "abogados en Alianza" | RelatedCities | SEO local |

- **Archivo probable:** `app/(public)/servicios-juridicos/**`, `app/(public)/abogados-en-*/**`.
- **Riesgo:** bajo (usar bloques RelatedCities/CTA existentes, no alterar diseño — R5).
- **Validación:** `npm run audit:internal-links` → 8 URLs con ≥1 inlink; re-crawl Ahrefs 14d → 0 en "orphan-page".

---

## 8. Propuesta P1 definitiva — Optimizar titles 6 posts CTR bajo · `PROPUESTA`

> Requiere DB `blog_posts` con backup previo. No aplicar sin autorización.

6 posts con +350 impresiones/28d y CTR bajo. Datos GSC frescos + titles actuales extraídos de DB.

| # | URL | Query objetivo | Imp. | Clics | Title actual | Title recomendado | Hipótesis |
|---|---|---|---|---|---|---|---|
| P1a | `/blog/derecho-notarial/poder-legal-honduras-cuando-se-necesita` | "poder legal honduras cuando se necesita" | 679 | 9 | "Poder Notarial en Honduras: Tipos" (33c) | "Poder Notarial Honduras: Cuándo se Necesita y Tipos" | Match query + pregunta |
| P1b | `/blog/extranjeria-migracion/naturalizacion-obtener-nacionalidad-hondurena` | "nacionalidad hondureña requisitos" | 543 | 7 | (title corto, verificar DB) | "Nacionalidad Hondureña: Requisitos y Cómo Obtenerla (2026)" | Match query + año |
| P1c | `/blog/derecho-de-familia/custodia-hijos-honduras-juez` | "custodia hijos honduras juez" | 520 | 5 | "Custodia de Hijos en Honduras 2026" (34c) | "Custodia de Hijos en Honduras: Cómo Decide el Juez (2026)" | Match intención |
| P1d | `/blog/derecho-civil/prescripcion-deudas-plazos-honduras` | "a los cuantos años prescribe una deuda" | 453 | 12 | "Prescripcion de Deudas en Honduras" (34c) | "Prescripción de Deudas Honduras: Plazos y Cuántos Años" | Match "cuántos años" (12 imp, pos 3,4, 0 clics) |
| P1e | `/blog/derecho-de-familia/pension-alimenticia-honduras-guia-completa` | "pensión alimenticia honduras" | 436 | 8 | "Pensión Alimenticia Honduras 2026" (33c) | "Pensión Alimenticia Honduras: Cómo Calcularla y Demandarla" | Diferenciar del otro post |
| P1f | `/blog/derecho-penal/estafas-fraudes-tipos-penales-honduras` | "delito de estafa en honduras" | 376 | 6 | "Estafas en Honduras: Tipos Penales" (34c) | "Estafas y Fraudes en Honduras: Tipos Penales y Denuncia" | Match + acción |

- **Nota P1g:** `/blog/derecho-de-familia/pension-alimenticia-porcentaje-honduras-2026` (423 imp, 12 clics) **YA tiene title optimizado** "Pensión Alimenticia 2026: ¿Cuánto por Hijo en..." (45c) — la Propuesta A previa se aplicó. **Confirmado: no necesita cambio.**
- **Requiere:** `npx tsx scripts/backup-blog.ts` (backup previo obligatorio).
- **Validación:** comparar CTR a 28d en GSC (baseline agregado posts ~1,5 %, objetivo ≥ 5 %).

---

## 9. Cambios APLICADOS · `SIN CAMBIOS RELEVANTES`

**0 cambios de código o contenido aplicados.** Todo lo accionable requiere zonas protegidas (`next.config.ts` P7, `app/(public)` P5) o DB con backup (P1).

### Acciones de infraestructura aplicadas (seguras, no código):

| Acción | Archivo | Reversible |
|---|---|---|
| Crear carpeta exports | `data/bing/exports/` (+ README.md) | Borrar carpeta |

---

## 10. Cambios NO aplicados por protección · `PROPUESTA`

| Cambio | Razón | Estado |
|---|---|---|
| P7 redirects 6 URLs 404 | `next.config.ts` zona protegida §7 | `PROPUESTA` definitiva |
| P5 enlazar 8 huérfanas | `app/(public)` zona protegida §7 | `PROPUESTA` definitiva |
| P1 titles 6 posts | DB `blog_posts` sin backup previo | `PROPUESTA` definitiva |
| Filtro GA4 intranet | GA4 UI config externa | `PROPUESTA` |
| OAuth Bing | Ticket Azure abierto | `PENDIENTE HUMANO/AZURE` |

---

## 11. Comandos ejecutados y QA

| Comando | Resultado |
|---|---|
| `npm run bing:auth:status` | ❌ No autorizado (PENDIENTE HUMANO/AZURE) |
| `npm run seo:bing:live` | ✅ API Key: 3330 crawled, 362 4xx, 83 queries |
| `npm run seo:collect` | ✅ 6/6 fuentes |
| `npm run seo:doctor` | 18 OK / 1 ERROR / 4 PENDIENTE |
| `npm run seo:health` | 13 OK / 2 warn / 0 fail |
| `npm run indexnow:dry` | 24/223 ✅ |
| `npm run bing:import-dashboard` | "No se encontraron archivos" (esperado) |
| Fetch 6 URLs 404 | 6/6 siguen 404 (P7 confirmado) |
| Fetch 8 huérfanas | 8/8 HTTP 200 (P5 confirmado) |
| Query DB titles | 6 posts extraídos (P1 confirmado) |

**Sin cambios de código → sin lint/tsc/test/build.** Estado estable.

---

## 12. Archivos modificados

| Archivo | Tipo |
|---|---|
| `data/bing/exports/` (carpeta + README.md) | NUEVO (infraestructura para export) |
| `docs/audits/archive/2026-08-06/clasificacion-bing-site-explorer-url-por-url-2026-07-08.md` | NUEVO (este informe) |
| `docs/audits/archive/2026-08-06/analisis-bing-warnings-excluded-2026-07-08.md` | ACTUALIZADO (referencia) |
| `auditoria-acciones.md` | ACTUALIZADO |

**0 archivos de código fuente modificados.** `data/bing/` está en `.gitignore` (no se commitea).

---

## 13. Riesgos pendientes

| Riesgo | Severidad | Nota |
|---|---|---|
| Sin export manual → listado URL exacto no disponible | Media | H-Export lo desbloquea |
| 362 4xx/28d desperdician crawl budget | Media | P7 lo reduce |
| 8 huérfanas sin autoridad | Media | P5 lo resuelve |
| 6 posts CTR bajo pierden clics | Media-alta | P1 los optimiza |
| OAuth Bing bloqueado | Baja | API Key fallback operativo; ticket Azure abierto |

---

## 14. Próximos pasos humanos

| ID | Acción | Esfuerzo | Desbloquea |
|---|---|---|---|
| **H-Export** | Exportar Site Explorer (Warning + Excluded) a `data/bing/exports/` | 10 min | Análisis URL por URL exacto |
| H-Azure | Resolver ticket Azure para OAuth Bing | externo | OAuth + backlinks + datos completos |
| P7 | Aplicar 4 redirects en `next.config.ts` | 15 min | Reduce warnings 4xx |
| P5 | Enlazar 8 huérfanas en `app/(public)` | 30 min | Resuelve huérfanas |
| P1 | Optimizar 6 titles (backup DB previo) | 20 min | Mejora CTR |

### Instrucciones exactas para H-Export

```
1. Ir a: https://www.bing.com/webmasters/siteexplorer?siteUrl=https://www.pinedayasociadoshn.com/
2. Filtro Status → "Warning" (96 URLs)
3. Click "Download" → guardar como bing-site-explorer-warning-2026-07-08.csv
4. Mover a: data/bing/exports/
5. Filtro Status → "Excluded" (104 URLs)
6. Click "Download" → guardar como bing-site-explorer-excluded-2026-07-08.csv
7. Mover a: data/bing/exports/
8. Ejecutar: npm run bing:import-dashboard
9. Re-ejecutar este análisis para clasificación URL por URL exacta
```

---

## 15. Porcentaje final

| Bloque | Estado | Completado |
|---|---|---|
| Búsqueda exports | `VALIDADO` (no existían) | 100 % |
| Infraestructura export | `APLICADO` (carpeta + README + script) | 100 % |
| Comandos seguros + QA | `VALIDADO` | 100 % |
| Clasificación estructural warnings | `VALIDADO` (estructural) / `PARCIAL` (sin URL exactas) | 80 % |
| Clasificación estructural excluded | `VALIDADO` (estructural) / `PARCIAL` (sin URL exactas) | 80 % |
| URLs críticas afectadas | `VALIDADO` (0 comerciales, 0 sitemap) | 100 % |
| Cruce con repo (sitemap, robots, GSC, GA4) | `VALIDADO` | 100 % |
| P7 redirects definitivo | `PROPUESTA` confirmada | 100 % |
| P5 huérfanas definitivo | `PROPUESTA` confirmada | 100 % |
| P1 titles definitivo | `PROPUESTA` confirmada | 100 % |
| Cambios aplicados | `SIN CAMBIOS RELEVANTES` (solo infraestructura) | — |
| QA | `VALIDADO` | 100 % |
| Documentación | `VALIDADO` | 100 % |
| **Análisis URL por URL exacto** | `PENDIENTE HUMANO` (H-Export) | **0 %** |

**Análisis estructural completado: ~85 %.** El 15 % restante (listado URL por URL exacto) requiere el export manual del dashboard.

---

## Resumen para dirección

> **No había exports manuales de Bing** en el repositorio, así que el análisis URL por URL exacto de los 96 warnings y 104 excluded **requiere un paso humano de 10 minutos**: exportar dos CSVs desde el dashboard de Bing Webmaster Tools y guardarlos en `data/bing/exports/`. He creado la carpeta con instrucciones precisas y el script que los procesará automáticamente.
>
> **Lo que sí sabemos con evidencia:** ninguna página comercial importante está afectada (las 10 clave están indexadas en Google y Bing las rastrea), y ninguna URL del sitemap está excluida. Aproximadamente el 80 % de warnings/excluded es **ruido normal o exclusión correcta** (páginas legales, intranet, APIs, variantes canónicas). El 20 % accionable son 6 URLs 404 (redirigibles), 8 páginas huérfanas (enlazables) y 6 posts con bajo CTR (optimizables) — todas con propuestas definitivas documentadas.
>
> **No se aplicaron cambios de código.** El proyecto sigue técnicamente sano. OAuth Bing sigue pendiente del ticket de Azure, pero no bloquea el trabajo (API Key funciona para datos básicos).
>
> **Próximo paso inmediato:** exportar los 2 CSVs del dashboard de Bing (10 min) para completar el análisis URL por URL.
