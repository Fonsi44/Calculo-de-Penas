---
name: enlazado-interno
description: Análisis y optimización del enlazado interno del sitio. Revisa distribución de enlaces, anchors utilizados, páginas huérfanas, silos temáticos y oportunidades de interlinking para mejorar la arquitectura de información y el flujo de PageRank interno.
---

# Enlazado interno — Análisis y optimización

Skill para auditar y optimizar la estructura de enlaces internos del sitio.

## Alcance

1. **Inventario de enlaces**: mapear enlaces internos desde páginas principales
2. **Anchors**: verificar que los textos de enlace son descriptivos y contienen keywords
3. **Páginas huérfanas**: detectar páginas sin enlaces internos entrantes
4. **Profundidad**: páginas a más de 3 clics desde la home
5. **Silos temáticos**: verificar coherencia entre pillar pages y contenido de apoyo
6. **Distribución**: páginas con excesivos o insuficientes enlaces internos

## Método de trabajo

### Paso 1: Mapeo de arquitectura
- Partir del sitemap o del listado de páginas públicas en `app/(public)/`
- Construir un mapa mental de la arquitectura: home → servicios → subpáginas → blog
- Identificar pillar pages: home, despacho, servicios-juridicos, derecho-penal, blog

### Paso 2: Análisis por página
Para cada página principal, revisar:
- **Enlaces salientes**: ¿a qué páginas enlaza? ¿los anchors son descriptivos?
- **Enlaces entrantes**: ¿desde qué páginas se enlaza hacia aquí?
- **Posición en la arquitectura**: ¿a qué profundidad está desde la home?
- **Anchor text**: ¿usa keywords relevantes o genéricos ("clic aquí", "leer más")?

### Paso 3: Detección de problemas
- **Huérfanas**: páginas sin enlaces entrantes desde ninguna otra página del sitio
- **Profundidad excesiva**: páginas a más de 3 clics de la home
- **Anchors genéricos**: "clic aquí", "leer más", "más información"
- **Sobre-enlazado**: páginas con demasiados enlaces salientes (dilución)
- **Bajo enlazado**: páginas importantes con pocos enlaces entrantes
- **Silos rotos**: pillar page que no enlaza a su contenido de apoyo

### Paso 4: Oportunidades de interlinking
- Desde posts del blog hacia páginas de servicio relacionadas
- Desde FAQ hacia páginas de servicio o posts del blog
- Entre páginas de servicio relacionadas (penal → familia cuando hay conexión)
- Desde páginas legales hacia home o despacho
- Breadcrumbs con enlaces (no solo texto)

## Reglas de enlazado interno

1. **Anchors**: descriptivos, con keywords cuando sea natural, nunca genéricos
2. **Profundidad**: páginas importantes a ≤ 2 clics de la home, todas a ≤ 3 clics
3. **Silos**: pillar page → subpáginas → contenido de apoyo, con enlaces bidireccionales
4. **Contexto**: los enlaces deben ser contextualmente relevantes, no forzados
5. **Primer enlace cuenta**: si una página tiene dos enlaces a la misma URL, Google suele considerar el anchor del primero
6. **nofollow**: usar solo para enlaces externos no respaldados o contenido generado por usuario
7. **Cantidad**: no hay límite estricto, pero cada enlace debe aportar valor al usuario

## Archivos a revisar

- Componentes de navegación: `PublicHeader`, `PublicFooter`, `AppSidebar`
- Páginas públicas: `app/(public)/**/page.tsx`
- Componentes de blog: `BlogSidebar`, `BlogCard`
- Páginas de servicio: `app/(public)/servicios-juridicos/[slug]/page.tsx`
- Configuración de breadcrumbs: buscar `BreadcrumbList` en el código
