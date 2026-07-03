# Plan de Decisión — Indexación (GSC)

> **Creado:** 2026-07-03  
> **Fuente:** `npm run seo:gsc:live` (28d), `app/sitemap.ts`, `data/seo/canonical-paths.json`,  
>            `auditoria-acciones.md` (Fases 11-14), DB `blog_posts`  
> **Estado:** Vigente — refleja el gap real entre sitemap (~220 URLs) y GSC (~110 páginas con datos)

---

## 1. Resumen del gap

| Concepto | Cantidad |
|----------|----------|
| URLs en sitemap | ~220 |
| Páginas en GSC (28d) | ~110 |
| Gap bruto | ~110 |

---

## 2. Clasificación del gap (~110 URLs no representadas en GSC)

### 2.1 Exclusiones correctas — no requieren acción

| Grupo | Cantidad | Motivo |
|-------|----------|--------|
| Posts thin (THIN_POST_SLUGS, priority 0.3) | 46 | Depriorización intencional. Google prioriza otras URLs. Mitigación activa con priority 0.3. |
| Posts canonicalizados a landings locales | 3 | `abogados-en-nacaome`, `abogados-en-choluteca`, `abogados-en-san-lorenzo` → canonical apunta a landing. Excluidos del sitemap correctamente. |
| Páginas de poca utilidad SEO (priority 0.2) | 6 | `politica-privacidad`, `politica-cookies`, `terminos`, `disclaimer`, `aviso-legal`, `politica-editorial`. Páginas funcionales/legales sin valor de búsqueda. |
| Páginas de categoría sin tráfico | ~15 | 20 categorías en sitemap, pero muchas no tienen impresiones en 28d. Normal para un sitio en crecimiento. |
| URLs de paginación (`?page=N`) | ~3 | Ahora tienen `noindex,follow` + canonical a page 1 (corregido en Fase 15). |

**Subtotal exclusiones correctas: ~73**

### 2.2 Problemas temporales — se resuelven con tiempo/crawl budget

| Grupo | Cantidad | Causa |
|-------|----------|-------|
| Posts publicados sin rastrear aún | ~30-35 | El sitio tiene 149 posts publicados. Google rastrea progresivamente. La velocidad de rastreo depende de la autoridad del dominio (0 backlinks según Bing). |
| Páginas estratégicas con lastCrawled=null | 4 | `/servicios-juridicos`, `/blog`, `/despacho`, `/hondurenos-en-espana`. Ya enviadas a IndexNow (Fase 4). Pendiente de re-rastreo. |

**Subtotal problemas temporales: ~34-39**

### 2.3 Problemas corregidos en esta fase

| Problema | Acción | Archivo |
|----------|--------|---------|
| Paginación `?page=N` indexable con canonical autocontenido | Añadido `noindex,follow` + canonical a page 1 | `app/(public)/blog/page.tsx`, `app/(public)/blog/[categoria]/page.tsx` |

---

## 3. Decisión sobre cada grupo

| Grupo | ¿Debe indexarse? | Decisión |
|-------|-----------------|----------|
| Posts thin (46) | Sí, pero con baja prioridad | Mantener priority 0.3. Reescritura editorial pendiente (futura fase). |
| Canonicalizados (3) | No | Correcto así. El canonical ya apunta a la landing. |
| Páginas legales (6) | Depende | Mantener indexable por ahora (necesarias para cumplimiento legal). Priority 0.2 es suficiente. |
| Categorías blog (20) | Sí | Ya en sitemap. La indexación es cuestión de tiempo. |
| Paginación (`?page=N`) | No | Corregido: `noindex,follow` + canonical a page 1. |
| Posts sin rastrear (~35) | Sí | Esperar a que Google los descubra. IndexNow enviado para 20 prioritarios. |
| 4 páginas sin lastCrawled | Sí | IndexNow ya enviado. Verificar en 7 días. |

---

## 4. Acciones futuras recomendadas (fuera de este bloque)

1. **Reescribir 46 posts thin** → subir priority de 0.3 a 0.8 → aumentar indexación en ~46 URLs.
2. **Conseguir backlinks** → Bing reporta 0. Más autoridad = más crawl budget.
3. **Revisar en 30 días** → ejecutar `npm run seo:gsc:live` y comparar páginas en GSC.
4. **Si persiste el gap >50 después de reescribir thin posts**, revisar si Google está teniendo problemas técnicos de rastreo (verificar Coverage report en GSC dashboard).

---

## 5. Límites de este análisis

- GSC no expone el "Index Coverage Report" vía API. Solo tenemos datos de páginas con impresiones.
- Es posible que Google tenga indexadas páginas que no han tenido impresiones en 28d (no aparecen en GSC pero están en el índice).
- El gap real probablemente sea menor que 110. Estimamos ~40-50 páginas realmente no indexadas de las que deberían estarlo.
- Para datos precisos de indexación, usar GSC dashboard → Index → Pages → "Not indexed".
