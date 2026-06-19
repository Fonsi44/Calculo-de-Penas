# Diagnóstico de PageSpeed / UX Móvil

## Diagnóstico inicial (Jun 2026)

### LCP estimado: ~3.7s

### Problemas detectados y prioridad

| Problema | Prioridad | Status |
|----------|-----------|--------|
| Cadena doble redirect (http → https → www) | Baja | Documentado — inherente a Vercel |
| iFrame del mapa sin `loading="lazy"`/`title`/`sandbox` | Media | ✅ Ya optimizado en `map-embed.tsx` |
| Estilos inline en `placeholder-photo.tsx` | Baja | Justificados (dinámicos por tone) |
| `'use client'` en componentes marketing | Media | ✅ 0 en marketing (todos Server Components) |
| Form inputs sin eventos GA4 | Alta | ✅ Corregido — `trackLeadGenerated()` en formulario y lead magnet |
| Superposición FloatingContactRail en móvil | Alta | ✅ Corregido — `pb-20 sm:pb-24` en `main` del layout público |
| Accesibilidad menú móvil | Media | ✅ Ya tiene `aria-label`, `aria-expanded`, `useFocusTrap` |
| Touch targets < 44px en iconos | Baja | Botones del FloatingContactRail son 48x48 (w-12 h-12) ✅ |
| Form `solicitar-consulta` labels | Alta | ✅ Ya tiene `htmlFor`/`id` en todos los campos |
| Lead magnet labels | Alta | ✅ Ya tiene `label htmlFor="lead-magnet-email"` |

### Problemas no críticos (postergados)

- **Double redirect**: Vercel hace automáticamente HTTP→HTTPS en el edge, luego el redirect de dominio naked→www. Inherente a la arquitectura Vercel. Impacto mínimo (~100-200ms adicionales).
- **CSS blocking**: Tema complejo; requeriría critical CSS inlining.
- **Font preloading**: Las fuentes se cargan con `next/font` (auto-preloading), no se requiere acción adicional.
- **JS bundle**: El bundle de `'use client'` componentes (`live-widgets.tsx`, `solicitar-consulta-form.tsx`) es pequeño (~5KB gzip).
- **Imágenes**: No hay imágenes LCP (hero es texto + gradiente CSS). Imágenes decorativas usan `next/image` con `loading="lazy"`.

### Cambios aplicados

1. `app/(public)/layout.tsx:99` — Añadido `pb-20 sm:pb-24` al `<main>` para evitar superposición con FloatingContactRail
2. `components/marketing/solicitar-consulta-form.tsx:58` — Añadido `trackLeadGenerated('consulta_form')` en éxito del formulario
3. `components/marketing/lead-magnet-cta.tsx:35` — Añadido `trackLeadGenerated('lead_magnet_' + area)` en descarga exitosa
4. Dominio: Intentado PATCH API para redirect directo naked→www con protocolo HTTPS — Vercel solo acepta nombre de dominio sin protocolo

### Próximas mejoras recomendadas

1. **Vercel Domains**: Configurar naked domain para redirect directo (no requiere cambios de código — configurable en Vercel Dashboard → Domains)
2. **Google Business Profile**: Crear perfil para SEO local
3. **Bing Webmaster / IndexNow**: Resolver 403 (verificar key file en Bing)
4. **Reescritura editorial**: 92 posts con revisión vencida (Release 67+)
