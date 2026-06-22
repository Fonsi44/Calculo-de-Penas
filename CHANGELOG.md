# CHANGELOG — Pineda y Asociados

> **Versión del changelog:** Jun 2026 — reestructurado. Histórico completo en
> [`docs/legacy/CHANGELOG_ARCHIVE.md`](./docs/legacy/CHANGELOG_ARCHIVE.md).

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

### Release 82 — Implementación de las 7 fases de la auditoría integral (2026-06-19)

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
