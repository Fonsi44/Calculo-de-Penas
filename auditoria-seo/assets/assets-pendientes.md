# Assets Pendientes — Imágenes para Posts del Blog

## Problema detectado

El nuevo post `pension-alimenticia-porcentaje-honduras-2026` tiene:
```
cover_image: "/images/blog/pension-alimenticia-honduras-guia-completa.webp"
```
Esta imagen es la misma que usa `pension-alimenticia-honduras-guia-completa` (el post canónico del cluster). Es incorrecto compartir coverImage entre posts: puede crear confusión visual y no aporta identidad propia al artículo.

## Especificación para imagen nueva

| Campo | Valor |
|-------|-------|
| **Slug del post** | `pension-alimenticia-porcentaje-honduras-2026` |
| **Nombre archivo recomendado** | `pension-alimenticia-porcentaje-honduras-2026.webp` |
| **Ubicación** | `public/images/blog/pension-alimenticia-porcentaje-honduras-2026.webp` |
| **Dimensiones** | 1200×630 píxeles (OG estándar) |
| **Formato** | WebP (conversión desde PNG/JPG) |
| **Alt text** | "Porcentaje de pensión alimenticia por hijo en Honduras — Guía 2026" |
| **Estilo** | Fondo claro con elementos legales (escala de justicia, familia). Texto opcional: "Pensión Alimenticia Honduras 2026" |
| **Tono** | Serio, profesional, azul corporativo (#0B1B3D) |
| **Licencia** | Libre de derechos o creada por el equipo |

## Cómo actualizar en DB

```sql
UPDATE blog_posts
SET cover_image = '/images/blog/pension-alimenticia-porcentaje-honduras-2026.webp'
WHERE slug = 'pension-alimenticia-porcentaje-honduras-2026';
```

## Pipeline de assets existente

El proyecto usa imágenes estáticas en `public/images/blog/`. No hay pipeline de build para imágenes:
- Las imágenes se añaden manualmente al repositorio
- Se referencian con ruta absoluta desde `cover_image` en DB
- El formato preferido es WebP (conversión manual desde PNG/JPG)

## Alternativas sin coste

1. **Crear con herramienta gratuita**: Canva (plantilla 1200×630), Photopea, o GIMP.
2. **Usar foto de stock gratuita**: Unsplash (búsqueda "family", "justice"), Pexels.
3. **Contratar diseñador** en Fiverr / Workana (coste estimado $10-30 USD).

## Posts que comparten coverImage (revisar)

Revisados en DB (pueden necesitar imágenes propias):
- `pension-alimenticia-honduras-guia-completa` → `/images/blog/pension-alimenticia-honduras-guia-completa.webp`
- `pension-alimenticia-honduras-como-solicitarla` → (comparte?)
- `pension-alimenticia-porcentaje-honduras-2026` → **debe ser reemplazada**
