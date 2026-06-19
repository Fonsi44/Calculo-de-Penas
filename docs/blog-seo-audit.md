# Auditoría SEO del Blog — 2026-06-19

## Resumen ejecutivo

| Métrica | Antes | Después |
|---------|-------|---------|
| Posts publicados | 159 | 159 |
| Errores SEO (metadatos) | 256 | 0 |
| Warnings | 120 | 3 |
| Posts con meta_title propio | 31 (19%) | 156 (98%) |
| Posts con meta_description propia | 31 (19%) | 154 (97%) |
| Canibalización detectada | 20 pares | 7 resueltos (noindex) |

## Acciones aplicadas

### 1. Generación automática de meta_title y meta_description (128 posts)

Script: `scripts/generate-blog-meta.ts`

Posts que no tenían SEO metadata personalizada recibieron:
- `meta_title`: generado a partir del título del post, truncado inteligentemente a ≤60 caracteres
- `meta_description`: generado a partir de la description existente (truncada a ≤160 caracteres) o del cuerpo del post

### 2. Corrección de metadatos largos (34 correcciones)

Script: `scripts/fix-long-meta.ts`

- 16 meta_titles >60 caracteres → acortados
- 18 meta_descriptions >160 caracteres → truncados

### 3. Resolución de canibalización (7 pares)

Script: `scripts/resolve-cannibalization.ts`

Posts con misma intención de búsqueda marcados como `noindex=true`:

| Post principal (keep) | Post duplicado (noindex) |
|----------------------|--------------------------|
| como-elegir-abogado-honduras | como-elegir-buen-abogado-guia-practica-honduras |
| despido-laboral-honduras-guia-completa | despido-laboral-honduras-derechos |
| divorcio-honduras-guia-completa | divorcio-tipos-requisitos-tiempos-honduras |
| impuesto-renta-personas-fisicas-honduras | impuesto-renta-guia-personas-fisicas-honduras |
| registrar-marca-paso-a-paso-honduras | registrar-marca-honduras-paso-a-paso |
| poder-legal-honduras-cuando-se-necesita | poder-notarial-honduras-tipos-requisitos |
| custodia-hijos-honduras-juez | guarda-custodia-menores-tipos-honduras |

### 4. Mejora del generador AI

Archivo: `app/api/admin/blog/generate/route.ts`

El generador ahora incluye `metaTitle` y `metaDescription` en la respuesta JSON para que el admin pueda revisarlos antes de publicar.

### 5. Scripts de auditoría creados

| Script | Propósito |
|--------|-----------|
| `scripts/audit-blog-seo.ts` | Auditoría completa: metadatos, thin content, noindex, cover, categorías, canibalización |
| `scripts/generate-blog-meta.ts` | Genera meta_title y meta_description para posts sin metadata |
| `scripts/fix-long-meta.ts` | Corrige metadatos que exceden límites Bing Webmaster |
| `scripts/resolve-cannibalization.ts` | Detecta y resuelve canibalización entre posts |

## Warnings pendientes (3)

| Post | Problema |
|------|----------|
| abogados-en-amapala-valle | meta_desc 87c (demasiado corta) |
| abogados-en-san-lorenzo | meta_desc 103c (corta) |
| abogados-en-choluteca | meta_desc 97c (corta) |

Estos son landings locales cuyas descriptions originales eran muy largas y se truncaron
agresivamente. Requieren reescritura manual para alcanzar 120-160 caracteres.

## Categorías con más posts

| Categoría | Posts |
|-----------|-------|
| practica-legal | 20 |
| derecho-penal | 17 |
| derecho-laboral | 15 |
| derecho-civil | 14 |
| derecho-de-familia | 13 |
| derecho-mercantil | 9 |
| tributario | 8 |
| hondurenos-en-espana | 8 |
| derecho-aduanero | 7 |

## Próximos pasos

1. Revisar manualmente los posts marcados como noindex para verificar que la acción es correcta
2. Reescribir las 3 meta_descriptions cortas de landings locales
3. Revisar los 5 posts con título >100 caracteres (info)
4. Configurar redirects 301 para los posts noindex (si se decide eliminarlos del sitemap)
5. Auditar enlazado interno: verificar que los posts principales enlacen a servicios y landings
