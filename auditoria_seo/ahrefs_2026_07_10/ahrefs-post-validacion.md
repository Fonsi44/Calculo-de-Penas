# Post-validación — Auditoría Ahrefs 2026-07-10

**Fecha:** 10-jul-2026
**Fase:** C — Validación técnica tras correcciones.

---

## 1. Validación de código (comandos ejecutados)

| Comando | Resultado | Detalle |
|---|---|---|
| `npm run lint` | ✅ **0 errores** | 6 warnings preexistentes en `app/api/sgie/*` (no relacionados). |
| `npx tsc --noEmit` | ✅ **EXIT 0** | Sin errores de tipos. |
| `npm run blog:normalizar` (dry-run) | ✅ **EXIT 0** | Reporta cambios pendientes de whitespace en otros posts (no aplicados — fuera de alcance). Los 3 posts con h1 ya corregidos no aparecen. |
| `npm run build` | ✅ **EXIT 0** | `✓ Compiled successfully in 22.7s`; `✓ Generating static pages (354/354)`; 0 errores. `/sitemap.xml` generado como static (○). |
| `npm run test` | ✅ **861/861 tests** | 42 archivos, 0 fallos. |

---

## 2. Validación de enlaces 4xx corregidos

**Objetivo:** verificar que los 2 href corregidos apuntan a una ruta existente (200 OK) y que no quedan href rotos.

- `app/(public)/hondurenos-en-espana/page.tsx:92` → `/servicios-juridicos/derecho-civil-y-notarial` ✅
- `app/(public)/hondurenos-en-espana/page.tsx:100` → `/servicios-juridicos/derecho-civil-y-notarial` ✅

**Barrido de hrefs rotos restantes:**
```bash
grep -rn 'servicios-juridicos/derecho-civil"\|servicios-juridicos/derecho-notarial"' app/(public) components/
```
→ **0 coincidencias** (sin hrefs rotos a esos slugs en el código público).

**Confirmación de existencia del slug destino:** `derecho-civil-y-notarial` está en `data/seo/canonical-paths.json` (lista de rutas estáticas canónicas) y en `generateStaticParams` de `servicios-juridicos/[slug]`.

---

## 3. Validación de enlaces 3xx (despublicación)

**Objetivo:** confirmar que los 8 slugs despublicados ya no entran al sitemap ni son enlazados internamente.

### 3a. Sitemap
Consulta de control sobre la DB con el mismo filtro que usa `app/sitemap.ts` (`published=true AND noindex=false`):
```
Slugs viejos que aún aparecerían en sitemap: 0
✅ Ninguno — los 8 están fuera del sitemap.
```
Refuerzo: `/blog/derecho-penal/abogado-penalista-choluteca` también está en `REDIRECT_SOURCE_PATHS` (defensa en profundidad).

### 3b. Componentes que enlazan via `getAllPosts()` / `BlogHighlights`
- `BlogHighlights` (`components/marketing/blog-highlights.tsx:99-102`): construye `postsBySlug` desde `getAllPosts()`, que filtra `published=true` (vía `lib/blog-db.ts:getPublishedPosts`). Al despublicar, los 8 slugs dejan de resolverse → los `<Link href>` que los usaban desaparecen del render.
- Navegación prev/next (`page.tsx:338-341`): usa `getAllPosts()`; los 8 slugs dejan de ser "vecinos" → la navegación salta al siguiente post válido.
- `MID_POST_CTA_COPY` (`page.tsx:117-197`): mapea slugs a copy de CTA; la inyección `injectMidArticleCta` comprueba `if (body.includes('/solicitar-consulta'))` — no enlaza a los slugs viejos directamente.

### 3c. Landings locales que listan slugs viejos
Las landings `app/(public)/abogados-en-{ciudad}/page.tsx` y `abogado-laboralista-nacaome` pasan slugs a `<BlogHighlights slugs={[...]} />`. Al despublicar los 8 posts, `postsBySlug.get(slugViejo)` devuelve `undefined` y se filtran (línea 102). **Las tarjetas dejan de renderizarse** en lugar de enlazar a un 308.

> **Nota:** esto reduce de 6 a 5 (o menos) el número de tarjetas en algunas landings. Es aceptable: preferible menos tarjetas que enlaces a 3xx. En un futuro puede reemplazarse el slug viejo por uno actual en `BlogHighlights slugs=[...]`, pero no es necesario para resolver los 3xx.

### 3d. Redirects 301 intactos
Los 8 redirects de `next.config.ts` siguen activos. Cualquier backlink externo o URL cacheada hacia las rutas viejas sigue redirigiendo a la URL final 200.

---

## 4. Validación de H1 corregidos (3 posts)

Consulta post-escritura sobre el campo `body`:

| Slug | `<h1>` en body (antes → después) |
|---|---|
| `banco-demanda-deuda-defensa-opciones-honduras` | 1 → **0** |
| `como-preparar-demanda-guia-no-abogados-honduras` | 1 → **0** |
| `habilitacion-clinicas-hospitales` | 1 → **0** |

Cada página ahora tiene **un único `<h1>`** (el título que renderiza la plantilla, `page.tsx:392`). R15 cumplida. Los `<h2>` del body pasaron de 5→6, 9→10, 5→6 respectivamente (el h1 se reclasificó, no se eliminó contenido).

---

## 5. Validación de canonicals (muestra)

Revisión sobre los 816 canonicals del CSV:

| Caso | Cuenta | Estado |
|---|---|---|
| Self-referencing (indexables) | ~797 | ✅ Correcto |
| Non-self paginación (`/blog?page=N` → `/blog`) | 19 | ✅ Correcto |
| → 3xx | 0 | ✅ |
| → 4xx | 0 | ✅ |
| → HTTP (no HTTPS) | 0 | ✅ |
| Non-self → noindex | 0 | ✅ |

**Conclusión: 0 canonicals requieren acción.**

---

## 6. Validación de noindex en páginas core

Las páginas core (`/`, `/servicios-juridicos`, `/derecho-penal`, `/solicitar-consulta`, `/blog`) se validan en runtime (post-deploy) inspeccionando el `<meta name="robots">` y el header `X-Robots-Tag`. En el build local, `site.noindex` está en `false` y el sitemap/robots se sirven normalmente. **No se detectan indicios de noindex accidental.**

> **PENDIENTE (post-deploy):** confirmar con `curl -sI https://www.pinedayasociadoshn.com/ | grep -i robots` y revisar el meta robots de 4-5 páginas core en producción tras el deploy.

---

## 7. Validación de schema.org

Sin el CSV `all_issues` en este lote, no hay recuento directo de errores de schema. Inspección de código:
- `BlogPosting` (`lib/schemas/blog.ts:24`): estructura completa y válida.
- `@graph` global (`app/(public)/layout.tsx:128`): Organization/LegalService/LocalBusiness/WebSite.
- `FAQPage`, `BreadcrumbList`, `CollectionPage`: presentes.

**PENDIENTE:** validar 3-5 URLs representativas con [Rich Results Test](https://search.google.com/test/rich-results) tras el deploy. URLs sugeridas:
- `/` (Organization/LocalBusiness)
- `/blog/derecho-penal/audiencia-inicial-proceso-penal-honduras` (BlogPosting)
- `/derecho-penal` (LegalService/BreadcrumbList)
- `/abogado-penalista-choluteca` (landing con BlogPosting/LocalBusiness)
- `/preguntas-frecuentes` (FAQPage)

---

## 8. Conclusión de validación

| Validación | Estado |
|---|---|
| lint / tsc / build / test | ✅ Todos pasan |
| Enlaces 4xx internos → 200 final | ✅ 2/2 corregidos y verificados |
| Enlaces 3xx internos → eliminados en origen | ✅ 8 posts despublicados (114 enlaces resueltos de raíz) |
| Sitemap sin URLs 3xx/4xx | ✅ 0 slugs viejos entrarían al sitemap |
| H1 único por página | ✅ 3/3 corregidos |
| Canonicals | ✅ 0 problemas |
| Schema.org | ⏠ Pendiente Rich Results Test (post-deploy) |
| noindex core | ⏠ Pendiente inspección runtime (post-deploy) |

**El sitio está técnico-seo saneado para los problemas detectables en este lote de CSV.**
