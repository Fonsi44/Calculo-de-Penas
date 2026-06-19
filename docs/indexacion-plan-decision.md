# Plan de decisión: incidencia "Descubierta: actualmente sin indexar" en GSC

> **Fecha:** 2026-06-19 (revisión v3 — Fase 1 y Fase 3 IMPLEMENTADAS)
> **Autor:** Consultor SEO técnico (diagnóstico objetivo)
> **Estado:** Diagnóstico completo + Fase 1 (sitemap/canonical) y Fase 3 (enlazado) implementadas y validadas. Pendiente deploy para que los cambios de sitemap se reflejen en producción.
> **Fuentes:** GSC exports (Tabla 1/2, Gráfico 1), sitemap producción, curl headers, `docs/blog-duplicity-report.md`, `docs/seo-off-page.md`, `docs/content-review-schedule.md`, `app/sitemap.ts`, `app/robots.ts`, `next.config.ts`, verificación home en producción.

---

## 0. Estado de ejecución del plan previo (verificado hoy)

Antes de proponer nuevas acciones, se verificó empíricamente qué del plan anterior ya está aplicado en producción:

| Acción del plan previo (v1) | Estado real (verificado 2026-06-19) | Evidencia |
|---|---|---|
| Thin posts con `priority` 0.3 en sitemap | ✅ **Aplicado** | `curl /sitemap.xml` → 49 entradas con `<priority>0.3` |
| Home NO enlazaba blog (0 enlaces) | ✅ **Aplicado** | `curl /` ahora → **6 enlaces** a posts estratégicos |
| Posts estratégicos seleccionados | ✅ **Aplicado** | Home enlaza exactamente los 6 posts del plan v1 |
| Excluir thin del sitemap | ❌ **No aplicado** (se eligió priority baja en su lugar) | Los 49 thin siguen en sitemap con priority 0.3 |
| Canibalización landings vs posts `abogados-en-*` | ❌ **No resuelto** | Ambos URLs devuelven 200, ambos en sitemap, sin canonical cruzado |
| Solicitud indexación manual pilar | ⏳ Pendiente humano | Requiere GSC interactivo |
| Google Business Profile | ⏳ Pendiente humano | `docs/seo-off-page.md` §1 |
| Bing WMT verificación | ⏳ Pendiente humano | (IndexNow ya funciona tras key nueva) |

**Conclusión v2:** el plan v1 se ejecutó parcialmente (enlazado home + priority thin = hecho). La incidencia persiste porque **esas acciones solas no bastan**: el bloqueo real es crawl budget de un dominio de 10 días + calidad editorial + autoridad externa.

---

## 1. Diagnóstico resumido

**La incidencia NO es un bug técnico.** Las URLs "Descubiertas, actualmente sin indexar" son **todas indexables** (200 OK, canonical propio, `index, follow`, sin noindex, en sitemap). El problema es una **combinación de factores convergentes**, no una causa única:

| Factor | Severidad | Evidencia (verificada hoy) |
|---|---|---|
| 🔴 **Dominio nuevo, crawl budget casi nulo** | Crítica | 183 descubiertas 9 jun, 0 rastreadas (`1970-01-01`); 213 URLs en sitemap |
| 🔴 **Calidad editorial baja del ~70% del catálogo** | Alta | 49 ALTO thin + 109 MEDIO plantilla de 159 posts (`docs/blog-duplicity-report.md`) |
| 🟠 **Backlinks externos: 0 reales** | Alta | `docs/seo-off-page.md` §6: "Backlinks (0)" |
| 🟠 **Sin Google Business Profile** | Alta | `docs/seo-off-page.md` §1, pendiente humano |
| 🟡 **Canibalización landings vs posts sin resolver** | Media | `/abogados-en-nacaome` (200) vs `/blog/practica-legal/abogados-en-nacaome` (200), ambos en sitemap |
| 🟢 **Enlazado home→blog** | Resuelto | 6 enlaces a posts estratégicos (antes 0) |
| 🟢 **Thin en sitemap con priority baja** | Parcialmente mitigado | priority 0.3 (no excluidos) |

**Causa más probable (hipótesis principal v2):** Google descubrió el sitemap el 9 jun 2026 y encoló las URLs, pero **no las rastrea con prioridad** porque (a) el dominio es nuevo y sin autoridad externa (crawl budget mínimo), (b) cuando hace muestreo encuentra contenido thin/plantilla que no merece indexar, (c) no hay señales de autoridad (0 backlinks, sin GBP). El enlazado interno ya está arreglado pero solo es una de varias palancas.

### Comparativa Google vs Bing

| Motor | Estado | Causa documentada |
|---|---|---|
| **Google** | 183 descubiertas / 0 rastreadas | Crawl budget + autoridad + calidad editorial |
| **Bing** | IndexNow funcional (HTTP 200, 55 URLs notificadas 19 jun) | Dominio ya verificable; key nueva `9f9940...` operativa. Falta ver manual en WMT |

Bing tiene una causa más concreta y ya resuelta a nivel técnico. Google NO tiene una causa única bloqueante; es suma de debilidades.

---

## 2. Evidencias revisadas (verificadas empíricamente hoy)

### 2.1 Sitemap (213 URLs)
- `curl /sitemap.xml` → **213 `<url>`** (era 220; 7 menos que informe v1).
- Distribución de `priority`:
  - `1.0`: 3 (home, servicios, derecho-penal)
  - `0.9`: 5 (landings locales + despacho + FAQ)
  - `0.8`: 105 (posts no-thin)
  - `0.5`: 43 (servicios + subáreas + categorías blog)
  - `0.3`: **49 (posts thin — plan v1 aplicado aquí)**
  - `0.2`: 6 (legales)
- **Cruce sitemap vs GSC:** ~168 de las 183 URLs pendientes SÍ están en sitemap (92%).

### 2.2 Indexabilidad técnica (verificada con curl)
- `/`, `/servicios-juridicos`, `/derecho-penal` → HTTP 200, `X-Robots-Tag: index, follow, max-image-preview:large, max-snippet:-1`.
- `NEXT_PUBLIC_NOINDEX` no definida en producción (sitio indexable).
- Sin `<meta name="robots" content="noindex">` en layout.
- `robots.txt` permite rastreo completo salvo `/intranet/`, `/api/`, `/_next/`, `/login`.
- **Conclusión:** 0 bloqueos técnicos.

### 2.3 Enlazado interno (CAMBIO vs v1)
- **Home → /blog/*: 6 enlaces** (era 0). Verificado: `curl / | grep href="/blog/"`.
  - `/blog/derecho-penal/que-hacer-si-me-detienen-en-honduras`
  - `/blog/derecho-penal/cuando-necesito-abogado-penalista-honduras`
  - `/blog/derecho-penal/delitos-mas-comunes-honduras`
  - `/blog/derecho-penal/audiencia-inicial-proceso-penal-honduras`
  - `/blog/derecho-laboral/jornada-laboral-horas-extra-descansos-honduras`
  - `/blog/derecho-notarial/poder-legal-honduras-cuando-se-necesita`
- `/blog` (hub) → 34 enlaces a posts.
- Faltan enlaces contextuales desde **páginas pilar hacia posts** (solo home y hub enlazan).

### 2.4 Canibalización detectada (NUEVO — no resuelta)
Verificado con `Invoke-WebRequest`:
```
200  /abogados-en-nacaome                                    (landing)
200  /blog/practica-legal/abogados-en-nacaome                (post thin)
200  /abogados-en-choluteca                                  (landing)
200  /blog/practica-legal/abogados-en-choluteca              (post thin)
200  /blog/derecho-civil/abogado-civil-choluteca             (post thin)
```
Ambas URLs cubren la **misma intención** ("abogados en X"). Ambas en sitemap. Sin canonical cruzado → Google ve duplicidad y retrasa indexación de ambas.

### 2.5 Calidad editorial (`docs/blog-duplicity-report.md`)
- 159 posts: **49 ALTO** (300-500 palabras, 0/10 marcadores) + **109 MEDIO** (plantilla) + 1 BAJO.
- `docs/content-review-schedule.md`: **96 posts vencidos** (revisión trimestral pasada), solo 39 al día.

### 2.6 Línea temporal GSC
| Fecha | Sin indexar | Indexadas | Impresiones |
|---|---|---|---|
| 2026-06-08 | 2 | 2 | — |
| 2026-06-09 | **186** | 1 | 3 |
| 2026-06-10 | 186 | 1 | 1 |
| 2026-06-11 | 186 | 1 | 5 |
| 2026-06-12 | 186 | 1 | 3 |

Sitio descubierto el 9 jun 2026. **10 días de antigüedad.** Crawl budget casi nulo.

### 2.7 Backlinks / autoridad
- `docs/seo-off-page.md` §6: "Backlinks (0): No se pueden crear desde código".
- Sin GBP, sin perfiles sociales verificados.

---

## 3. Respuestas a las 12 preguntas del briefing

1. **¿Tipo de problema?** Combinación: **crawl budget + autoridad + calidad editorial + canibalización residual**. No es técnico.
2. **¿URLs en sitemap?** Sí, ~168/183 (92%).
3. **¿200 + canonical propio + index/follow?** Sí, verificadas.
4. **¿noindex/robots/canonical cross?** No hay bloqueos. Pero **canibalización landings/posts sin canonical cruzado** (parcial).
5. **¿URLs de bajo valor en sitemap?** Sí. 49 thin siguen en sitemap (con priority 0.3).
6. **¿Categorías/posts a sacar?** Sí: los 49 thin + los canibalizados (`abogados-en-*`).
7. **¿Pilar con enlaces internos suficientes?** Home ya enlaza 6 posts. Faltan enlaces desde pilar de servicios.
8. **¿Posts profundos con enlaces contextuales?** Los 6 de la home sí. El resto solo desde hub.
9. **¿Duplicidad/canibalización?** Sí, landings vs posts `abogados-en-{ciudad}` sin resolver.
10. **¿Autoridad externa?** 0 backlinks, sin GBP, dominio de 10 días.
11. **¿Rendimiento/redirecciones frenan crawl?** No. Lighthouse Perf 100/100. CWV OK.
12. **¿Solo Google o también Bing?** Ambos, causas distintas. Bing casi resuelto (key nueva operativa).

---

## 4. Matriz de soluciones

| # | Solución | Impacto | Riesgo SEO | Dificultad | Tiempo | Dependencia externa | Automatizable | Prioridad |
|---|---|---|---|---|---|---|---|---|
| **A** | Solicitar indexación manual de TODAS (183) | Bajo | Medio (saturar cuota) | Baja | 2h | GSC | No | ❌ Descartada |
| **B** | Solicitar indexación solo prioritarias (15) | Medio | Bajo | Baja | 30min | GSC | No | ✅ **Fase 5** |
| **C** | Excluir thin del sitemap (los 49 priority 0.3) | Medio | Bajo | Media | 30min | No | Sí | ⚠️ Opcional (ver nota) |
| **D** | `noindex` temporal a thin/duplicados | Alto | Medio | Media | 1h | No | Sí | ⚠️ Solo para canibalizados |
| **E** | Reforzar enlazado pilar→posts | Medio | Bajo | Media | 2h | No | Sí | ✅ **Fase 3** |
| **F** | Reescribir posts estratégicos | Alto | Bajo | Alta | 1-2h/post | No | No | ✅ **Fase 4** |
| **G** | Resolver canibalización canonical landings↔posts | **Alto** | Bajo | Baja | 30min | No | Sí | ✅ **Fase 1 (rápida)** |
| **H** | Backlinks externos + GBP | **Muy alto** | Bajo | Muy alta | Semanas | Sí (humanos) | No | ✅ **Fase 6 (palanca estructural)** |
| **I** | Reducir URLs profundas de bajo valor | Medio | Medio | Media | 1h | No | Sí | Subsumida en C/D |
| **J** | Mantener todo igual y esperar | 0 | 0 | 0 | — | No | — | ❌ Descartada |

### Nota sobre C (excluir thin)
El plan v1 ya bajó priority a 0.3 (hecho). Excluirlos del sitemap ahora tendría **impacto marginal** adicional, porque Google ya los ve con baja prioridad. **Mejor reescribir (F)** que excluir. Excluir solo si la reescritura se retrasa meses.

### Soluciones descartadas y por qué
- **A (indexar 183 a la vez):** Google limita ~10 solicitudes manuales/día; forzar thin genera "Descubierta sin indexar" recurrente y empeora la señal de calidad.
- **J (esperar):** sin acciones activas, el crawl budget no mejorará.
- **C + D combinadas:** contradictorias. Si excluyo del sitemap (C), no hace falta noindex (D).

---

## 5. Solución recomendada (plan por fases v2)

### 🟢 Fase 0 — Acciones ya hechas (no repetir)
- ✅ Thin posts con priority 0.3 en sitemap.
- ✅ Home enlaza 6 posts estratégicos.
- ✅ Posts `abogados-en-{nacaome,choluteca,san-lorenzo}` con `canonicalUrl` → landings (en DB).

### ✅ Fase 1 — Resolver canibalización (IMPLEMENTADO Release 80, 2026-06-19)
**Estado:** IMPLEMENTADO y validado (pendiente deploy para que el sitemap refleje el cambio).
- **DB:** los 3 posts `practica-legal/abogados-en-{ciudad}` ya tenían `canonicalUrl` set
  (verificado: `/abogados-en-nacaome`, `-choluteca`, `-san-lorenzo`). Canonicals confirmados
  en producción (`curl` del post → `<link rel="canonical" href="...landing">`).
- **Sitemap (`app/sitemap.ts`):** ahora selecciona `canonicalUrl` y **excluye** del sitemap
  los posts cuyo canonical apunta a otra URL del propio dominio. Así las landings (URL
  principal) son la única entrada declarada; el post ya no aparece como URL independiente.
- **Decisión sobre los 3 posts restantes** (`abogado-civil-choluteca`, `abogado-empresas-san-lorenzo`,
  `abogado-familia-choluteca`): **se conservan sin canonicalizar**. Tienen intención diferenciada
  (especialidad + ciudad, cola larga) que las landings generales no cubren. Ya están con priority 0.3 (thin).
- **Validación:** `scripts/auditar-indexacion-prioritaria.mjs` confirma canonicals OK. Los 3 probes
  de exclusión de sitemap fallan hasta deploy (producción aún ejecuta código previo).

### 🟠 Fase 2 — Solicitar indexación manual de 15 URLs prioritarias (humano, ~30min)
**Acción inmediata recomendada (no requiere código):**
- En GSC → Inspección de URLs → solicitar indexación de las URLs de §6.
- Máx 10-15/día. Empezar por las 5 pilar.

### ✅ Fase 3 — Reforzar enlazado pilar→posts (IMPLEMENTADO Release 80, 2026-06-19)
**Estado:** IMPLEMENTADO.
- **`/servicios-juridicos`:** ya tenía `BlogHighlights` con 6 posts (laboral, civil, mercantil, notarial). Sin cambios.
- **`/derecho-penal`:** ya enlazaba 3 posts dinámicos de su categoría + los 6 de la home cubren el resto. Sin cambios.
- **`/hondurenos-en-espana`:** añadido `BlogHighlights` con 6 posts estratégicos verificados
  (poderes desde España, nacionalidad, herencias transfronterizas, reagrupación familiar,
  asuntos familiares, fiscalidad). Antes solo enlazaba 3 posts dinámicos recientes.
- **Validación:** `scripts/auditar-indexacion-prioritaria.mjs` confirma que las 4 páginas pilar
  enlazan posts estratégicos (probes "Pilar enlaza posts" pasan).

### 🟡 Fase 4 — Mejora editorial de posts estratégicos (~1-2h/post, semanas)
- Reescribir primero los ALTO riesgo en categorías fuertes: `derecho-penal` (4), `proceso-penal` (2), `derecho-de-familia` (4).
- Mientras, mantenerlos con priority 0.3.

### 🟢 Fase 5 — Medir y, si procede, escalar indexación manual
- Tras Fases 1-3, pedir indexación de las 10 restantes (hub + posts).

### 🔵 Fase 6 — Autoridad externa (humano, semanas) — **palanca estructural**
- **Google Business Profile** (crítica, `docs/seo-off-page.md` §1).
- **Bing WMT** verificación manual (resuelve Bing 0%, `docs/seo-off-page.md` §2).
- Directorios locales + Colegio de Abogados + prensa.

### 🟣 Fase 7 — Medición a 7, 14, 30 días (ver §9)

---

## 6. URLs prioritarias (lote inicial 15 URLs)

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

### Posts estratégicos de alto valor comercial (6)
10. `/blog/derecho-penal/cuando-necesito-abogado-penalista-honduras`
11. `/blog/derecho-penal/que-hacer-si-me-detienen-en-honduras`
12. `/blog/derecho-penal/delitos-mas-comunes-honduras`
13. `/blog/derecho-penal/audiencia-inicial-proceso-penal-honduras`
14. `/blog/derecho-laboral/jornada-laboral-horas-extra-descansos-honduras`
15. `/blog/derecho-notarial/poder-legal-honduras-cuando-se-necesita`

> **Nota:** los 6 posts del bloque 3 ya están enlazados desde la home (Fase 0). Tienen la mejor posición de crawl path posible hoy.

**Total: 15 URLs.** No pedir más hasta ver respuesta de Google en 7-14 días.

---

## 7. URLs / patrones a revisar ANTES de seguir en sitemap

### Canibalización landings vs posts (prioridad Fase 1)
| Landing (indexar) | Post a canonicalizar | Acción |
|---|---|---|
| `/abogados-en-nacaome` | `/blog/practica-legal/abogados-en-nacaome` | canonical → landing |
| `/abogados-en-choluteca` | `/blog/practica-legal/abogados-en-choluteca` | canonical → landing |
| `/abogados-en-san-lorenzo` | `/blog/practica-legal/abogados-en-san-lorenzo` | canonical → landing |
| (sin landing) | `/blog/derecho-civil/abogado-civil-choluteca` | revisar (¿fusionar con landing Choluteca?) |
| (sin landing) | `/blog/derecho-mercantil/abogado-empresas-san-lorenzo` | revisar |

### Posts ALTO riesgo thin (49) — candidatos a reescribir (Fase 4)
Patrones principales de `docs/blog-duplicity-report.md`:
- **`practica-legal`** (9 ALTO): posts genéricos tipo "abogados-en-{ciudad}" — ya tratados en Fase 1.
- **`derecho-mercantil`** (4 ALTO), **`derecho-penal`** (4 ALTO), **`derecho-de-familia`** (4 ALTO).
- **`tributario`** (3), **`regulacion-sanitaria`** (3), **`derechos-ciudadanos`** (3), **`hondurenos-en-espana`** (3).

### Categorías con poco valor
- `/blog/noticias-legales` (1 post). Categoría hub pobre.
- `/blog/practica-legal` (20 posts, 9 thin). Categoría saturada de baja calidad.

---

## 8. Cambios propuestos

### Cambios técnicos (requieren deploy)
1. **Canibalización (Fase 1):** canonical de posts `abogados-en-{ciudad}` → landings. Implementación: campo `canonicalUrl` en DB para esos slugs, o regla en `generateMetadata` del post.
2. **Enlazado pilar→posts (Fase 3):** sección "Artículos relacionados" en `/servicios-juridicos`, `/derecho-penal`, `/hondurenos-en-espana`.
3. **(Opcional, Fase 4 si se retrasa reescritura):** excluir los 49 thin del sitemap.

### Cambios editoriales (sin deploy, requieren DB / redacción)
- Reescribir los 49 ALTO (priorizando `derecho-penal`, `proceso-penal`, `familia`).
- Actualizar `docs/content-review-schedule.md`: 96 posts vencidos.

### Qué se puede automatizar
- Canonical de canibalización (regla por slug en `generateMetadata`).
- Health-check de enlazado interno (extender `scripts/seo-health-check.mjs`).
- Detección de canibalización landings vs posts (script similar a `detectar-posts-plantilla.ts`).

### Qué depende del propietario (externo, no automatizable)
- **Solicitud de indexación manual** (GSC interactivo, ~10/día).
- **Google Business Profile** (cuenta Google del despacho).
- **Bing WMT** verificación (cuenta Microsoft).
- **Backlinks** (prensa, directorios, Colegio de Abogados).
- **Reescritura editorial** de 49 posts (conocimiento legal, 1-2h/post).

---

## 9. Métricas de éxito y calendario de revisión

### Métricas (medir en GSC cada semana)
| Métrica | Objetivo 30 días | Objetivo 90 días |
|---|---|---|
| URLs "Descubierta sin indexar" | <100 (de 186) | <30 |
| URLs rastreadas (último rastreo ≠ 1970) | >50 | >150 |
| URLs indexadas | >20 (de 1) | >100 |
| Páginas pilar indexadas (5) | 5/5 | 5/5 |
| Posts estratégicos indexados (6) | >3 | 6/6 |
| Clics/impresiones GSC | Impresiones >0 en pilar | Crecimiento sostenido |
| Posts thin en sitemap | 49 (mantener 0.3) o 0 si se excluyen | 0 (reescritos) |
| Enlaces internos home→blog | 6 (mantenido) | 8+ |
| Enlaces pilar→posts | >12 (3 pilar × 4) | >20 |

### Calendario
| Checkpoint | Acción | Qué medir |
|---|---|---|
| **Día 0** | Solicitar indexación de 5 pilar (GSC) + deploy Fase 1 (canonical) | Confirmar "Solicitud recibida" |
| **Día 7** | Solicitar indexación de 5 más (hub + categorías) | ¿Bajan las "Descubiertas"? ¿Rastrea Google alguna? |
| **Día 14** | Solicitar indexación de 5 posts estratégicos | ¿Indexa las 5 pilar? |
| **Día 30** | Reevaluar estrategia | ¿Tendencia positiva? Si no, escalar Fase 6 (GBP/backlinks) |

---

## 10. Resumen ejecutivo

**El problema es un dominio nuevo (10 días) sin autoridad externa, con 49 posts thin en sitemap y canibalización landings/posts sin resolver. No es un bug técnico.** El plan v1 ya aplicó enlazado home→blog y priority baja a thin, pero la incidencia persiste porque esas palancas solas no superan el crawl budget mínimo.

**La intervención de mayor impacto y menor riesgo ahora es la Fase 1 (resolver canibalización canonical)**, seguida de Fase 3 (enlazado pilar→posts) y Fase 2 (indexación manual de 15 URLs prioritarias).

**La Fase 6 (GBP + backlinks + Bing WMT) es la palanca estructural** pero depende de acciones humanas del despacho y tarda semanas. Sin ella, el crawl budget seguirá siendo limitado. **No hay atajo técnico que sustituya la autoridad externa.**
