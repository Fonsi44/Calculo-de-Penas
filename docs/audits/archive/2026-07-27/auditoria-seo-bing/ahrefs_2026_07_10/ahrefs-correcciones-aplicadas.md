# Correcciones aplicadas — Auditoría Ahrefs 2026-07-10

**Fecha de aplicación:** 10-jul-2026
**Fase:** B — Corrección segura (post-diagnóstico).
**Backup previo:** `auditoria-blog/backup-2026-07-10-09-49.json` (175 posts).

---

## Resumen de cambios

| # | Tipo | Cambio | Origen del problema |
|---|---|---|---|
| 1 | Código | 2 enlaces 4xx → corregidos a slug canónico | hrefs a slugs inexistentes en `hondurenos-en-espana` |
| 2 | DB | 8 posts despublicados (`published=false`) | posts redirigidos seguían publicados → generaban enlaces 3xx |
| 3 | Código | 1 exclusión añadida a sitemap | `/blog/derecho-penal/abogado-penalista-choluteca` en sitemap → 308 |
| 4 | DB | 3 posts corregidos (h1→h2 en body) | doble `<h1>` violaba R15 |

---

## Detalle de cambios

### 1. Enlaces 4xx corregidos (código)

**Archivo:** `app/(public)/hondurenos-en-espana/page.tsx`

| Línea | Antes (404) | Después (200) |
|---|---|---|
| 92 | `href="/servicios-juridicos/derecho-notarial"` | `href="/servicios-juridicos/derecho-civil-y-notarial"` |
| 100 | `href="/servicios-juridicos/derecho-civil"` | `href="/servicios-juridicos/derecho-civil-y-notarial"` |

**Motivo:** los slugs `derecho-notarial` y `derecho-civil` no existen bajo `/servicios-juridicos/`. El slug canónico unificado es `derecho-civil-y-notarial` (verificado en `data/seo/canonical-paths.json` y en el resto del codebase: `related-service.tsx`, `public-footer.tsx`, `lib/internal-links.ts`). Sin redirect HTTP, el `<Link href>` duro daba 404.

**Riesgo:** nulo. El slug destino existe, es indexable y canónico. El anchor y el contexto del enlace se conservan.

**Los otros 6 enlaces 4xx del CSV** son artefactos de crawl (`/blog/<cat>/solicitar-consulta` y dobles prefijos `/blog/tributario/blog/...`), ya documentados en `next.config.ts:176-181` como sin referencia real en código/DB. **No se actúa sobre ellos.**

---

### 2. Posts despublicados (DB) — 8 slugs

**Script:** `scripts/seo-unpublish-consolidated-posts.ts` (nuevo, dry-run por defecto).
**Operación:** `UPDATE blog_posts SET published=false WHERE slug IN (...)`.

Estos 8 posts tenían su ruta redirigida (301/308) en `next.config.ts` hacia URLs consolidadas, pero seguían `published=true` en DB. El sitemap, `BlogHighlights`, la navegación prev/next, las landings locales y `MID_POST_CTA_COPY` los enlazaban → **114 enlaces internos a 3xx** (Ahrefs).

| Slug | Categoría | URL vieja (→redirect) | URL final 200 | Redirect en next.config |
|---|---|---|---|---|
| `abogado-penalista-choluteca` | derecho-penal | `/blog/derecho-penal/abogado-penalista-choluteca` | `/abogado-penalista-choluteca` | `:284` |
| `despido-injustificado-honduras-derechos-trabajador` | derecho-laboral | `/blog/derecho-laboral/...` | `/blog/derecho-laboral/despido-laboral-honduras-guia-completa` | `:211` |
| `empleador-no-paga-salario-honduras` | derecho-laboral | `/blog/derecho-laboral/...` | `/blog/derecho-laboral/despido-laboral-honduras-guia-completa` | `:212` |
| `calcular-prestaciones-laborales-honduras` | derecho-laboral | `/blog/derecho-laboral/...` | `/blog/derecho-laboral/calcular-liquidacion-laboral-honduras` | `:187` |
| `despido-laboral-honduras-derechos` | derecho-laboral | `/blog/derecho-laboral/...` | `/blog/derecho-laboral/despido-laboral-honduras-guia-completa` | `:186` |
| `tramites-notariales-frecuentes-honduras` | derecho-notarial | `/blog/derecho-notarial/...` | `/blog/derecho-notarial/poder-legal-honduras-cuando-se-necesita` | `:196` |
| `elegir-bufete-abogados-nacaome` | practica-legal | `/blog/practica-legal/...` | `/blog/practica-legal/como-elegir-abogado-honduras` | `:208` |
| `elegir-bufete-multidisciplinario-ventajas-honduras` | practica-legal | `/blog/practica-legal/...` | `/blog/practica-legal/como-elegir-abogado-honduras` | `:209` |

**Trazabilidad:** los registros NO se eliminan (solo `published=false`). IDs conservados en el output del script. Backup previo en `auditoria-blog/backup-2026-07-10-09-49.json`.

**Redirects:** se mantienen intactos los 8 redirects 301 de `next.config.ts`. Siguen siendo la red de seguridad para cualquier backlink externo o caché de buscador hacia las URLs viejas.

**Tráfico residual asumido:** 196 impresiones / 0 clics en GSC (ver `ahrefs-diagnostico-inicial.md` §4). Riesgo aceptado por el responsable: prioridad a arquitectura limpia y URLs consolidadas.

**Verificación post-aplicación:**
```
✔️ Verificación OK: los 8 posts objetivo están published=false.
```
Consulta de control: `SELECT ... WHERE published=true AND noindex=false AND slug IN (...)` → **0 filas** (ninguno aparecerá en sitemap).

---

### 3. Sitemap — exclusión añadida (código)

**Archivo:** `app/sitemap.ts` — set `REDIRECT_SOURCE_PATHS` (línea ~110).

```diff
   '/blog/hondurenos-en-espana/hondurenos-en-espana-guia-legal-completa',
+  // Post consolidado en landing propia /abogado-penalista-choluteca (redirect 301
+  // en next.config.ts:284). Auditoría Ahrefs 2026-07-10: 1 enlace "Sitemap URL → 308".
+  '/blog/derecho-penal/abogado-penalista-choluteca',
 ]);
```

**Motivo:** este slug era el único de los 8 targets 3xx que el sitemap seguía incluyendo (los otros 7 ya estaban en `REDIRECT_SOURCE_PATHS`). Aparecía en el CSV Ahrefs como enlace "Sitemap URL → 308". Con la despublicación (cambio 2) ya no entraría al sitemap por el filtro `published=true`, pero la exclusión explícita es **defensa en profundidad**: si el post se volviera a publicar por error, el sitemap no lo serviría como 308.

**Riesgo:** nulo. La ruta está redirigida a `/abogado-penalista-choluteca` (landing propia, 200 OK).

---

### 4. H1 duplicados corregidos (DB) — 3 posts

**Script:** `scripts/normalizar-blog.ts --aplicar --solo-h1 --slug <slug>` (existente).
**Regla violada:** R15 (un solo `<h1>` por página de post; el body usa `<h2>`/`<h3>`).

Ahrefs reportó "H1 ausente" en estos 3 posts. Investigación: el **body del post contenía un `<h1>`** además del `<h1>{post.title}</h1>` que renderiza la plantilla (`page.tsx:392`). Doble `<h1>` = jerarquía rota.

| Slug | `<h1>` en body (antes) | `<h1>` en body (después) |
|---|---|---|
| `banco-demanda-deuda-defensa-opciones-honduras` | 1 | 0 (→ `<h2>`) |
| `como-preparar-demanda-guia-no-abogados-honduras` | 1 | 0 (→ `<h2>`) |
| `habilitacion-clinicas-hospitales` | 1 | 0 (→ `<h2>`) |

**Solo se cambia la etiqueta** (`<h1>` → `<h2>`); el contenido del heading y el resto del body se conservan. Misma longitud de body. Idempotente.

---

## Lo que NO se tocó (justificado)

- **Canonicals (816):** revisados, 0 problemas reales. Las facetas `?tag=`/`?page=` son noindex con canonical self (correcto). La paginación `?page=N` consolida canonical a `/blog` (correcto). Sin acción.
- **6 enlaces 4xx artefacto:** rutas de crawl erróneo sin referencia en código/DB. Ya documentados en `next.config.ts:176-181`.
- **3 titles de 76-80 chars:** dentro de límites aceptables; no reescribir posts de Fase 1 (R13/R17).
- **Redirects 301 de next.config.ts:** intactos. Funcionan y consolidan clusters.
- **Schema.org:** sin CSV `all_issues` en el lote; sin patrón de error estructural detectado en código. Pendiente validar muestra con Rich Results Test tras nuevo crawl.
- **noindex de facetas/tags/paginación:** intencional (contenido thin/duplicado). Sin acción.

---

## Archivos modificados / creados

### Código del proyecto
| Archivo | Acción |
|---|---|
| `app/(public)/hondurenos-en-espana/page.tsx` | Editado — 2 href corregidos (líneas 92, 100) |
| `app/sitemap.ts` | Editado — 1 entrada añadida a `REDIRECT_SOURCE_PATHS` |

### Base de datos (tabla `blog_posts`)
| Cambio | Filas |
|---|---|
| `published` true → false (8 slugs consolidados) | 8 |
| `body`: 1 `<h1>` → `<h2>` (3 slugs con doble h1) | 3 |

### Scripts (nuevos, de análisis/operación)
| Archivo | Propósito |
|---|---|
| `scripts/ahrefs-analyze.mjs` | Parser UTF-16/TSV de los CSV de Ahrefs + generación de diagnóstico y CSV de revisión |
| `scripts/seo-unpublish-consolidated-posts.ts` | Despublicación segura (dry-run por defecto) de posts redirigidos |

### Documentación (auditoría)
| Archivo | Propósito |
|---|---|
| `auditoria_seo/ahrefs_2026_07_10/ahrefs-diagnostico-inicial.md` | Diagnóstico sin cambios (Fase A) |
| `auditoria_seo/ahrefs_2026_07_10/ahrefs-correcciones-aplicadas.md` | Este documento (Fase B) |
| `auditoria_seo/ahrefs_2026_07_10/ahrefs-post-validacion.md` | Resultados de validación (Fase C) |
| `auditoria_seo/ahrefs_2026_07_10/pendientes-ahrefs.md` | Pendientes y próximos pasos (Fase D) |
| `auditoria_seo/ahrefs_2026_07_10/urls-4xx-prioridad.csv` | Enlaces 4xx |
| `auditoria_seo/ahrefs_2026_07_10/urls-3xx-prioridad.csv` | Enlaces 3xx |
| `auditoria_seo/ahrefs_2026_07_10/canonicals-review.csv` | Canonicals revisados (0 problemas) |
| `auditoria_seo/ahrefs_2026_07_10/noindex-review.csv` | Noindex de páginas core |
| `CHANGELOG.md` | Entrada de release |

---

## Clasificación (R11)

| Ítem | Estado |
|---|---|
| Enlaces 4xx (2 reales) | **VALIDADO** |
| Enlaces 4xx (6 artefactos) | **DESCARTADO** (documentado) |
| Despublicación 8 posts | **VALIDADO** (verificación post-escritura OK) |
| Exclusión sitemap | **VALIDADO** (build OK) |
| H1→h2 (3 posts) | **VALIDADO** (verificación post-escritura: 0 h1 en body) |
| Canonicals | **VALIDADO** (0 problemas, sin acción) |
| Schema.org | **NO VALIDADO** (sin CSV all_issues; pendiente Rich Results Test) |
| noindex core | **PENDIENTE** (validar en post-deploy con inspección de metadata) |
| Titles largos | **DESCARTADO** (dentro de límites) |
