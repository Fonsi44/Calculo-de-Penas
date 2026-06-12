---
name: on-page
description: Optimización on-page de elementos SEO específicos. Revisa y corrige titles, meta descriptions, headings, OG tags, contenido, densidad de keywords, CTAs y datos estructurados de una página concreta o un conjunto de páginas.
---

# SEO On-Page — Optimización por página

Skill para optimizar elementos on-page de páginas específicas.

## Elementos a revisar por página

### Title tag
- Longitud: 50-60 caracteres
- Keyword principal al inicio
- Marca al final con `|`
- Único en todo el sitio
- Coincide con OG title

### Meta description
- Longitud: 150-160 caracteres
- Incluye keyword principal
- Tiene CTA implícito o valor diferencial
- Única por página
- Coincide con OG description

### Headings
- H1: uno por página, contiene keyword principal
- H2: subtemas reales, jerarquía semántica sin saltos
- H3-H6: sub-subtemas, solo si hay profundidad real
- Sin headings vacíos o decorativos

### Open Graph
- `og:title`: igual al `<title>`
- `og:description`: igual a meta description
- `og:image`: 1200x630px, específica por página o sección
- `og:url`: URL canónica de la página
- `og:type`: article (blog), website (home), page (servicios, legales)
- `og:locale`: es_HN

### Twitter Cards
- `twitter:card`: summary_large_image
- `twitter:title`: igual al `<title>`
- `twitter:description`: igual a meta description
- `twitter:image`: misma que og:image

### Canonical
- Etiqueta `<link rel="canonical">` presente
- Autorreferencial (apunta a sí misma) para páginas principales
- Apunta a URL canónica correcta si hay parámetros o variantes

### Robots
- `index, follow` para páginas que deben indexarse
- `noindex, follow` para páginas que no deben indexarse (legales, admin)
- No debe haber `noindex` accidental en páginas importantes

### Contenido
- Primer párrafo responde a la intención de búsqueda
- Contiene keyword principal de forma natural
- Sustancial (>300 palabras para páginas de servicio, >800 para posts)
- Sin contenido duplicado con otras páginas del sitio
- Sin thin content

### Datos estructurados
- Schema correcto para el tipo de página (ver `.kilo/rules/seo.md` R8)
- JSON-LD válido (estructura correcta)
- Renderizado server-side (visible en View Source)

### Conversión (CRO)
- CTA visible y contextual
- Formulario de consulta accesible
- Lead magnet si aplica (guía descargable)

## Método

1. Identificar la página objetivo (URL o ruta en `app/`)
2. Leer el archivo fuente (`page.tsx` y layout correspondiente)
3. Inspeccionar el HTML servido actual (webfetch o Playwright)
4. Detectar diferencias entre lo deseado y lo real
5. Proponer correcciones específicas (archivo, línea, cambio exacto)
6. Implementar si se solicita, validando con `npm run build`
