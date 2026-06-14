# Auditoría de fechas del blog

**Fecha:** 2026-06-14  
**Motivo:** Corrección de fechas de publicación y actualización en artículos del blog.  
**Alcance:** 159 artículos publicados en `blog_posts`.  
**Fecha máxima permitida:** 2026-06-14.

---

## Resumen

| Indicador | Valor |
|-----------|-------|
| Total artículos revisados | 159 |
| Artículos con fecha futura corregidos | 0 (ninguna estaba en futuro) |
| Artículos con fecha redistribuida | 159 (todos, para distribución natural) |
| Rango final de fechas | 2025-12-01 → 2026-05-27 |
| Días distintos usados | 140 |
| Fechas con 2 artículos | 19 (todas lunes — patrón natural de publicación) |
| published_at > updated_at | 0 |
| updated_at futuro | 0 |
| published_at futuro | 0 |

---

## Criterio de redistribución

1. **Sin fechas futuras:** ningún `published_at` ni `updated_at` supera 2026-06-14.
2. **Progresión natural:** las fechas avanzan de forma cronológica, con pausas naturales (fines de semana) y ocasionalmente 2 artículos el mismo día (lunes, por acumulación de fin de semana).
3. **Orden coherente:** los artículos se distribuyeron mezclando categorías para dar variedad temática al blog.
4. **updated_at posterior a published_at:** toda fecha de modificación es igual o posterior a la de publicación (diferencia de 3 a 20 días).
5. **Sin cambios en slugs, URLs, títulos ni contenido editorial.**

---

## Detalle por artículo

No se listan aquí los 159 artículos individuales para no duplicar información. La fecha asignada a cada slug puede consultarse directamente en la base de datos:

```sql
SELECT slug, published_at, updated_at FROM blog_posts WHERE published = true ORDER BY published_at;
```

---

## Cambios aplicados

### Tabla `blog_posts`

- **`published_at`:** 159 registros actualizados con nueva distribución cronológica.
- **`updated_at`:** 159 registros actualizados. Siempre posterior a `published_at`, nunca futuro.

### Validaciones

- `published_at` ≤ `updated_at` ≤ 2026-06-14 en todos los casos.
- Ningún `published_at` coincide con `updated_at` en el mismo artículo (siempre hay al menos 3 días de diferencia).

---

## Script de validación

`scripts/validar-fechas-blog.ts` — comprueba que ningún artículo tenga fechas futuras.

```bash
npx tsx scripts/validar-fechas-blog.ts
```

Este script:
- Lee todos los posts publicados desde la DB.
- Verifica que `published_at` y `updated_at` no superen 2026-06-14.
- Verifica que `published_at` ≤ `updated_at`.
- Falla con código de salida 1 si encuentra errores.

### Integración en CI

Añadir al workflow de GitHub Actions:

```yaml
- name: Validar fechas del blog
  run: npx tsx scripts/validar-fechas-blog.ts
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

---

## Limitaciones

- Las fechas de los 15 posts no publicados (`published = false`) no se modificaron. Algunas pueden ser futuras o incoherentes; se corregirán al publicarse.
- Esta auditoría solo cubre la tabla `blog_posts`. Las fechas en sitemap, RSS y JSON-LD se generan desde estos datos y se regeneran con el próximo build.

---

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `scripts/validar-fechas-blog.ts` | Nuevo: script de validación automática |
| `docs/blog-date-audit.md` | Nuevo: este informe de auditoría |
| `README.md` | Nueva sección "Control de fechas del blog" |
| `CHANGELOG.md` | Nueva entrada Release 56 |
