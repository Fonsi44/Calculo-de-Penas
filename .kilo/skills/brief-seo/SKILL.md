---
name: brief-seo
description: Redacción de briefs de contenido optimizados para SEO. Define intención de búsqueda, keyword principal y secundarias, estructura de headings, enlazado interno recomendado, schemas a incluir y diferenciadores frente a competencia. Ideal antes de crear nuevos posts o páginas de servicio.
---

# Brief SEO — Brief de contenido optimizado

Skill para crear briefs de contenido listos para redactar, con todos los elementos SEO definidos.

## Cuándo usar este skill

- Antes de crear un nuevo post de blog
- Antes de crear una nueva página de servicio
- Al reformular contenido existente que no posiciona
- Al planificar contenido para un topic cluster

## Estructura del brief

Genera un brief con esta estructura:

### 1. Ficha técnica
```
Tipo de página: [post blog | página servicio | landing]
URL propuesta: /ruta/
Keyword principal: [keyword]
Volumen estimado: [bajo/medio/alto] (solo si hay datos GSC/GA4)
Intención de búsqueda: [informacional | comercial | transaccional]
Canibalización: [existe riesgo con URL X | no existe riesgo]
```

### 2. Metadatos
```
Title (50-60 chars):
Meta description (150-160 chars):
Slug:
Categoría (blog):
OG image: [URL o tipo]
Canonical: [URL]
```

### 3. Estructura de headings
```
H1: [contiene keyword principal]
H2: [subtema 1]
H2: [subtema 2]
H3: [sub-subtema si aplica]
H2: [subtema 3]
```

### 4. Contenido
- **Primer párrafo** (100-150 palabras): responde a la intención, contiene la keyword
- **Cuerpo**: estructura recomendada con puntos clave a cubrir
- **Longitud objetivo**: [número de palabras, basado en intención y competencia]
- **Diferenciador**: qué aporta este contenido que no tenga la competencia

### 5. Enlazado interno
- **Enlaces salientes recomendados**: [URL anchor_text]
- **Enlaces entrantes necesarios**: desde qué páginas deberían enlazar aquí

### 6. Datos estructurados
- **Schema principal**: [BlogPosting | Service | FAQPage | etc.]
- **Schemas secundarios**: [BreadcrumbList | WebPage]

### 7. Conversión
- **CTA recomendado**: [texto y destino]
- **Lead magnet relacionado**: [si aplica, qué guía descargable]

## Reglas

- La keyword principal debe ser realista (que el sitio pueda posicionar para ella)
- No inventar volúmenes de búsqueda si no hay datos de GSC
- Revisar siempre canibalización antes de proponer una URL nueva
- Alinear la intención con el tipo de contenido (no hacer post informacional si la intención es transaccional)
- El diferenciador debe ser real, basado en la experiencia del bufete

## Verificación post-brief

1. `npm run build` tras implementar el contenido
2. Verificar schemas JSON-LD en el HTML servido
3. Verificar canonical y metadatos
4. Si es blog, verificar que aparece en sitemap
