# Plan de decisión: incidencia "Descubierta: actualmente sin indexar" en GSC

> **Fecha:** 2026-06-19
> **Autor:** Consultor SEO técnico (diagnóstico objetivo)
> **Estado:** Diagnóstico completo + plan priorizado. **No se ha modificado código.**
> **Fuentes:** GSC exports (Tabla 1/2, Gráfico 1), sitemap producción, curl headers, `docs/blog-duplicity-report.md`, `docs/seo-off-page.md`, `docs/content-review-schedule.md`.

---

## 1. Diagnóstico resumido

**La incidencia NO es un bug técnico.** Las 183 URLs "Descubiertas, actualmente sin indexar" son **todas indexables** (200 OK, canonical propio, `index, follow`, sin noindex, en sitemap). El problema es una **combinación de tres factores convergentes**:

| Factor | Severidad | Evidencia |
|---|---|---|
| 🟠 **Crawl budget insuficiente** (dominio nuevo, 0 autoridad) | Crítica | 183 URLs descubiertas el 9 jun 2026, 0 rastreadas (`1970-01-01`); 52 URLs del sitemap ni siquiera descubiertas |
| 🔴 **Home NO enlaza a ningún post del blog** | Crítica | `curl / | grep 'href="/blog/'` → **0 resultados**. El crawl path principal no llega al blog |
| 🔴 **Calidad editorial baja del 99% del catálogo** | Alta | 49 ALTO riesgo thin + 109 MEDIO plantilla de 159 posts (`docs/blog-duplicity-report.md`) |
| 🟠 **Backlinks externos: 0 reales** | Alta | `docs/seo-off-page.md` §6: "Backlinks (0)" |
| 🟡 **Sitio joven** (apenas descubierto por Google el 9 jun 2026) | Contexto | Gráfico GSC: 0 → 183 URLs en un día |

**Causa más probable (hipótesis principal):** Google descubrió el sitemap el 9 jun 2026, encoló 183 URLs, pero **no las rastrea** porque (a) el dominio es nuevo y sin autoridad externa (crawl budget mínimo), (b) la home no enlaza el blog (baja prioridad de crawl por ruta interna corta), y (c) cuando Google hace un muestreo, encuentra contenido thin/plantilla que no merece indexar.

### Comparativa Google vs Bing

| Motor | Estado | Causa documentada |
|---|---|---|
| **Google** | 183 descubiertas / 0 rastreadas | Crawl budget + autoridad + enlazado + calidad |
| **Bing** | 9.450 URLs enviadas (IndexNow) / 0 rastreadas / 0 indexadas | `docs/seo-off-page.md` §2: dominio **no verificado en Bing WMT** (403) |

Bing tiene **una causa raíz distinta y resuelta a nivel de código** (solo falta verificación humana del dominio). Google NO tiene una causa única bloqueante; es una suma de debilidades.

---

## 2. Evidencias revisadas (verificadas empíricamente)

### 2.1 Sitemap
- **220 URLs** en `https://www.pinedayasociadoshn.com/sitemap.xml` (verificado con `curl | grep -c '<url>'`).
- 42 estáticas (pilar + landings + servicios + legales) + 20 categorías blog + ~158 posts.
- **Cruce sitemap vs GSC:** 168 de las 183 URLs pendientes SÍ están en sitemap (92%). 15 descubiertas fuera de sitemap (por enlaces internos). 52 URLs del sitemap aún NO descubiertas.

### 2.2 Indexabilidad técnica (muestra de 10 URLs verificadas con curl)
Todas devuelven:
- HTTP 200
- `X-Robots-Tag: index, follow, max-image-preview:large, max-snippet:-1`
- `<link rel="canonical" href="...misma URL...">` (canonical propio, sin consolidación)
- Sin `<meta name="robots" content="noindex">`

**Conclusión:** 0 bloqueos técnicos. El problema NO es de robots/canonical/noindex.

### 2.3 Enlazado interno
- **Home → /blog/*: 0 enlaces.** Verificado: `curl / | grep -oE 'href="/blog/[^"]+"' | wc -l` = **0**.
- `/blog` (hub) → /blog/*: 34 enlaces.
- El footer tiene "COBERTURA" con landings locales, pero **no enlaza posts estratégicos**.

### 2.4 Calidad editorial (`docs/blog-duplicity-report.md`)
- 159 posts analizados: **49 ALTO** (300-500 palabras, 0/10 marcadores de especificidad) + **109 MEDIO** (plantilla genérica) + 1 BAJO.
- Muestra verificada: post ALTO `sanciones-administrativas-...` = 320 palabras, 3 párrafos (intro + plazo + CTA). Es thin content real.
- `docs/content-review-schedule.md`: **96 posts vencidos** (revisión trimestral pasada), solo 39 al día.

### 2.5 Línea temporal GSC
| Fecha | URLs afectadas |
|---|---|
| 2026-06-08 | 0 |
| 2026-06-09 | **183** (descubrimiento inicial) |
| 2026-06-10 a 12 | 183 (estable, sin progreso) |

Google descubrió el sitio el 9 jun 2026. Es un **sitio de 10 días de antigüedad** con crawl budget casi nulo.

### 2.6 Backlinks / autoridad
- `docs/seo-off-page.md` §6: "Backlinks (0): No se pueden crear desde código".
- Sin Google Business Profile (§1, pendiente humano).
- Sin perfiles sociales verificados (§5, investigado sin resultados).

---

## 3. Respuestas a las 12 preguntas del briefing

1. **¿Tipo de problema?** Combinación: **crawl budget + autoridad + enlazado interno + calidad editorial**. No es técnico (sitemap/canonical/noindex OK).
2. **¿URLs en sitemap?** Sí, 168/183 (92%) están en sitemap.
3. **¿200 + canonical propio + index/follow?** Sí, las 10 verificadas. Todas indexables.
4. **¿noindex/robots/canonical cross?** No. Ningún bloqueo.
5. **¿URLs de bajo valor en sitemap?** SÍ. 49 posts thin (ALTO) están en sitemap diluyendo calidad.
6. **¿Categorías/posts a sacar temporalmente?** Sí: los 49 ALTO riesgo deberían revisarse antes de insistir en indexación.
7. **¿Pilar con enlaces internos suficientes?** Las pilar están en header/footer. Pero **home → blog = 0 enlaces**.
8. **¿Posts profundos con enlaces contextuales?** No. Solo desde `/blog` hub (34 enlaces). Sin enlazado temático desde pilar.
9. **¿Duplicidad/canibalización?** `docs/blog-duplicity-report.md` detecta plantilla genérica compartida (no duplicidad exacta). Patrones de riesgo: `derecho-penal` (4 ALTO+13 MEDIO), `practica-legal` (9 ALTO+11 MEDIO), `derecho-de-familia` (4 ALTO+9 MEDIO), `derecho-civil` (3 ALTO+11 MEDIO).
10. **¿Autoridad externa?** 0 backlinks reales. Sin GBP. Dominio de 10 días.
11. **¿Rendimiento/redirecciones frenan crawl?** No. Lighthouse Perf 100/100 en CI. CWV impecables.
12. **¿Solo Google o también Bing?** Ambos, pero causas distintas. Google = crawl budget + calidad. Bing = dominio no verificado en WMT (bloqueante, documentado).

---

## 4. Matriz de soluciones

| # | Solución | Impacto | Riesgo SEO | Dificultad | Tiempo | Dependencia externa | Automatizable | Prioridad |
|---|---|---|---|---|---|---|---|---|
| **A** | Solicitar indexación manual de TODAS (183) | Bajo | Medio (saturar cuota) | Baja | 2h | GSC | No | ❌ Descartada |
| **B** | Solicitar indexación solo prioritarias (10-20) | Medio | Bajo | Baja | 30min | GSC | No | ✅ **Fase 5** |
| **C** | Limpiar sitemap: solo alta calidad | Alto | Bajo | Media | 1h | No | Sí | ✅ **Fase 2** |
| **D** | `noindex` temporal a posts thin/duplicados | Alto | Medio (si se excede) | Media | 2h | No | Sí | ⚠️ Opción a C (no ambas) |
| **E** | Reforzar enlazado interno home→blog + pilar→posts | **Muy alto** | Bajo | Media | 3h | No | Sí | ✅ **Fase 3 (crítica)** |
| **F** | Reescribir posts estratégicos antes de pedir indexación | Alto | Bajo | Alta | 1-2h/post | No | No | ✅ **Fase 4** |
| **G** | Crear hubs/páginas pilar por categoría fuerte | Alto | Bajo | Alta | 2h/hub | No | No | ✅ **Fase 3** |
| **H** | Backlinks externos + GBP | **Muy alto** | Bajo | Muy alta | Semanas | Sí (humanos) | No | ✅ **Fase 6** |
| **I** | Reducir URLs profundas de bajo valor | Medio | Medio | Media | 1h | No | Sí | Subsumida en C/D |
| **J** | Mantener todo igual y esperar | 0 | 0 | 0 | — | No | — | ❌ Descartada |

### Soluciones descartadas y por qué
- **A (indexar 183 a la vez):** Google limita solicitudes manuales (~10/día), y forzar indexación de contenido thin genera "Descubierta sin indexar" recurrente. Empeora la señal de calidad.
- **D + C combinadas:** contradictorias. Si saco thin del sitemap (C), no hace falta noindexarlo (D). Mejor C (menos invasiva, reversible).
- **J (esperar):** sin acciones, el crawl budget no mejorará. El sitio necesita señales activas.

---

## 5. Solución recomendada (plan por fases)

### 🔴 Fase 1 — Correcciones técnicas y selección de URLs prioritarias (Día 0, sin deploy)
**Acción inmediata recomendada (no requiere código):**
- En GSC → Inspección de URLs → solicitar indexación de las **5 URLs pilar** (ver lista §6).
- Verificar que el sitemap está "Declared" en GSC (no solo "Discovered").

### 🟠 Fase 2 — Limpieza del sitemap (deploy, ~1h)
- Sacar del sitemap los **49 posts ALTO riesgo thin** (mantenerlos publicados pero fuera de sitemap temporalmente). Implementación: filtro en `app/sitemap.ts` que excluya slugs en una lista `THIN_POSTS_REVIEW`.
- Resultado: sitemap pasa de 220 → ~170 URLs de mayor calidad media.
- **Alternativa más conservadora:** en vez de excluir, bajar `priority` de los ALTO a 0.3 (menos invasivo).

### 🔴 Fase 3 — Enlazado interno + hubs (deploy, ~3-4h) — **LA ACCIÓN DE MAYOR IMPACTO**
- Añadir en la **home** una sección "Guías jurídicas destacadas" con 6-8 enlaces a posts estratégicos (alto valor, ya de calidad: `derecho-penal`, `proceso-penal`, `familia`). **Cero enlaces → 8 enlaces** es el mayor salto de crawl path posible.
- Añadir en cada página pilar (`/derecho-penal`, `/servicios-juridicos`, `/hondurenos-en-espana`) una sección "Artículos relacionados" con 4-6 enlaces contextuales a posts de esa categoría.
- Crear **hubs de categoría** potentes: `/blog/derecho-penal` y `/blog/derecho-de-familia` ya existen (20 categorías); reforzar su enlazado interno desde las pilar.

### 🟡 Fase 4 — Mejora editorial de posts estratégicos (~1-2h/post, semanas)
- Reescribir primero los **posts de categorías fuertes** que estén ALTO riesgo Y en el lote prioritario de indexación.
- Priorizar: `derecho-penal` (4 ALTO), `proceso-penal` (2 ALTO), `derecho-de-familia` (4 ALTO).
- Mientras no se reescriban, mantener fuera del sitemap (Fase 2) o con priority baja.

### 🟢 Fase 5 — Solicitud de indexación manual limitada (10-20 URLs)
**Solo DESPUÉS de Fases 2 y 3.** Solicitar en GSC las URLs de §6 (prioritarias). Nunca más de 10-15/día.

### 🔵 Fase 6 — Autoridad externa (humano, semanas)
- **Google Business Profile** (acción humana crítica, `docs/seo-off-page.md` §1).
- **Bing WMT verificación** (resuelve Bing 0%, `docs/seo-off-page.md` §2).
- Directorios locales + prensa + Colegio de Abogados.

### 🟣 Fase 7 — Medición y reevaluación
- Revisar GSC a 7, 14, 30 días (ver §9).

---

## 6. URLs prioritarias (lote inicial 15 URLs)

Seleccionadas por: (a) son pilar/landings de alta intención comercial, (b) ya tienen calidad suficiente, (c) reciben/ recibirán enlaces internos.

### Pilar + landings locales (5) — solicitar indexación AHORA
1. `/` (home)
2. `/servicios-juridicos`
3. `/derecho-penal`
4. `/abogados-en-nacaome`
5. `/abogados-en-choluteca`

### Hub + categorías estratégicas (4)
6. `/blog`
7. `/blog/derecho-penal`
8. `/blog/derecho-de-familia`
9. `/blog/derecho-laboral`

### Posts estratégicos de alto valor comercial (6) — posts MEDIO/BAJO ya con buen contenido
10. `/blog/derecho-penal/cuando-necesito-abogado-penalista-honduras` (1161 palabras)
11. `/blog/derecho-penal/que-hacer-si-me-detienen-en-honduras` (724 palabras)
12. `/blog/derecho-penal/delitos-mas-comunes-honduras` (1156 palabras)
13. `/blog/proceso-penal/audiencia-inicial-proceso-penal-honduras` (1009 palabras)
14. `/blog/derecho-laboral/jornada-laboral-horas-extra-descansos-honduras` (1174 palabras)
15. `/blog/derecho-notarial/poder-legal-honduras-cuando-se-necesita` (1187 palabras)

**Total: 15 URLs.** No solicitar más hasta ver respuesta de Google en 7-14 días.

---

## 7. URLs / patrones a revisar ANTES de seguir en sitemap

### Posts ALTO riesgo thin (49) — candidatos a excluir de sitemap o bajar priority
Patrones principales (de `docs/blog-duplicity-report.md`):
- **`practica-legal`** (9 ALTO): posts genéricos tipo "abogados-en-{ciudad}" duplicados con las landings reales (`/abogados-en-nacaome`). **Riesgo de canibalización.**
- **`derecho-mercantil`** (4 ALTO): `contratos-franquicia`, `competencia-desleal`, `titulos-valores-cheques`, `incumplimiento-contrato`.
- **`derecho-penal`** (4 ALTO): `estafas-fraudes`, `defensa-penal-menores`, `allanamiento-ilegal`, `fianza-medidas-cautelares`.
- **`derecho-de-familia`** (4 ALTO): `guarda-custodia`, `abogado-familia-choluteca`, `adopcion-requisitos`, `union-de-hecho`.
- **`tributario`** (3 ALTO), **`regulacion-sanitaria`** (3 ALTO), **`derechos-ciudadanos`** (3 ALTO), **`hondurenos-en-espana`** (3 ALTO).

### Canibalización detectada
- Landings locales (`/abogados-en-nacaome`, `/abogados-en-choluteca`, `/abogados-en-san-lorenzo`) **vs** posts `practica-legal/abogados-en-nacaome`, `practica-legal/abogados-en-choluteca`, etc. **Misma intención de búsqueda, dos URLs.** Una debe canibalizar (canonical) o eliminarse del sitemap.

### Categorías con poco valor
- `/blog/noticias-legales` (1 post: `actualizacion-legislativa-mensual`). Categoría con 1 post genera página hub pobre.
- `/blog/practica-legal` (20 posts, 9 ALTO thin). Categoría saturada de baja calidad.

---

## 8. Cambios propuestos

### Cambios técnicos (requieren deploy)
1. **`app/sitemap.ts`:** excluir 49 posts ALTO del sitemap (lista `THIN_POSTS_REVIEW`) O bajar su `priority` a 0.3.
2. **`app/(public)/page.tsx`:** añadir sección "Guías destacadas" con 6-8 enlaces a posts estratégicos.
3. **Páginas pilar** (`/derecho-penal`, `/servicios-juridicos`, etc.): añadir sección "Artículos relacionados" con enlaces contextuales.
4. **Resolver canibalización landings vs posts `practica-legal/abogados-en-{ciudad}`:** canonical de los posts hacia las landings, o excluir los posts.

### Cambios editoriales (sin deploy, requieren DB)
- Reescribir los 49 ALTO (priorizando `derecho-penal`, `proceso-penal`, `familia`).
- Actualizar `docs/content-review-schedule.md`: 96 posts vencidos.

### Qué se puede automatizar
- Exclusión de thin del sitemap (lista de slugs en `app/sitemap.ts`).
- Script de detección de canibalización landings vs posts (similar a `detectar-posts-plantilla.ts`).
- Health-check de enlazado interno (extender `scripts/seo-health-check.mjs`).

### Qué depende del propietario (externo, no automatizable)
- **Google Business Profile** (cuenta Google del despacho).
- **Bing WMT** verificación (cuenta Microsoft).
- **Backlinks** (prensa, directorios, Colegio de Abogados).
- **Reescritura editorial** de 49 posts (conocimiento legal, 1-2h/post).

---

## 9. Métricas de éxito y calendario de revisión

### Métricas (medir en GSC cada semana)
| Métrica | Objetivo 30 días | Objetivo 90 días |
|---|---|---|
| URLs "Descubierta sin indexar" | <100 (de 183) | <30 |
| URLs rastreadas (último rastreo ≠ 1970) | >50 | >150 |
| URLs indexadas | >20 | >100 |
| Páginas pilar indexadas (5) | 5/5 | 5/5 |
| Posts estratégicos indexados (6) | >3 | 6/6 |
| Clics/impresiones GSC | Impresiones >0 en pilar | Crecimiento sostenido |
| Posts thin en sitemap | 0 (de 49) | 0 |
| Enlaces internos home→blog | 6-8 | 8+ |

### Calendario
| Checkpoint | Acción | Qué medir |
|---|---|---|
| **Día 0** | Solicitar indexación de 5 pilar (GSC) | Confirmar "Solicitud recibida" |
| **Día 7** | Tras deploy Fases 2+3 | ¿Bajan las "Descubiertas"? ¿Rastrea Google alguna? |
| **Día 14** | Solicitar indexación de 10 más (hub + posts) | ¿Indexa las 5 pilar? |
| **Día 30** | Reevaluar estrategia | ¿Tendencia de indexación positiva? Si no, escalar Fase 6 (GBP/backlinks) |

---

## 10. Resumen ejecutivo

**El problema es un dominio nuevo (10 días) sin autoridad, con home que no enlaza el blog, y 49 posts thin en sitemap. No es un bug técnico.**

**La intervención de mayor impacto y menor riesgo es la Fase 3 (enlazado interno home→blog)**, porque transforma el crawl path: Google pasará de "0 enlaces a posts desde home" a "8 enlaces", facilitando discovery sin depender solo del sitemap. Combinada con la Fase 2 (limpieza de thin del sitemap) y la Fase 5 (indexación manual de 15 URLs), se espera reducir las "Descubiertas sin indexar" significativamente en 14-30 días.

**La Fase 6 (GBP + backlinks + Bing WMT) es la palanca estructural** pero depende de acciones humanas del despacho y tarda semanas. Sin ella, el crawl budget seguirá siendo limitado.
