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

## Validación en producción (Release 69 — 2026-06-19)

### Comando de validación
```powershell
Invoke-WebRequest + curl.exe para status codes, headers, redirect chain, contenido HTML
```

### Resultados

| Prueba | Resultado |
|--------|-----------|
| Home | 200 ✅ |
| `/solicitar-consulta` | 200 ✅ |
| `/como-llegar` | 200 ✅ |
| `/abogados-en-nacaome` | 200 ✅ |
| `/abogados-en-choluteca` | 200 ✅ |
| `/abogados-en-san-lorenzo` | 200 ✅ |
| `/servicios-juridicos` | 200 ✅ |
| `/robots.txt` | 200 ✅ |
| `/sitemap.xml` | 200 ✅ |
| `/llms.txt` | 200 ✅ |
| `X-Powered-By` ausente | ✅ |
| HSTS | `max-age=63072000; includeSubDomains; preload` ✅ |
| `X-Content-Type-Options: nosniff` | ✅ |
| `Referrer-Policy: strict-origin-when-cross-origin` | ✅ |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), interest-cohort=()` ✅ |
| `X-Robots-Tag` en home | `index, follow, max-image-preview:large, max-snippet:-1` ✅ |
| CSP presente | ✅ |
| GA4 `G-L2PGBN3SWK` carga única (1 gtag config) | ✅ |
| Clarity `x9ghgy2un2` carga única | ✅ |
| iFrame mapa: `loading="lazy"` + `title` + `sandbox="allow-scripts"` | ✅ |
| Email `contacto@pinedayasociadoshn.com` visible (intencional) | 4 ocurrencias (footer, contacto) |
| `pb-20` + `sm:pb-24` presentes en HTML home | ✅ |
| FloatingContactRail presente (clase `fixed bottom-4 right-4`) | ✅ |

### Redirecciones
| URL | Cadena | Hops |
|-----|--------|------|
| `http://pinedayasociadoshn.com` | → 308 → `https://...` → 308 → `https://www....` → 200 | **2** ⚠️ inherente Vercel |
| `https://pinedayasociadoshn.com` | → 308 → `https://www....` → 200 | 1 ✅ |
| `http://www.pinedayasociadoshn.com` | → 308 → `https://www....` → 200 | 1 ✅ |
| `https://www.pinedayasociadoshn.com` | → 200 directo | 0 ✅ |

> **Double redirect**: Solo ocurre al escribir `http://pinedayasocioshn.com` sin `www` ni `https`. Vercel no permite consolidar en un hop desde código porque el upgrade HTTP→HTTPS es automático en el edge, anterior a las reglas de dominio. La redirección única `https://pinedayasocioshn.com → https://www.pinedayasocioshn.com` ya es 1 hop.

### Built & Tests
| Comando | Resultado |
|---------|-----------|
| `npm run lint` | 0 errors, 0 warnings ✅ |
| `npm run build` | Compiled successfully, 304 routes ✅ |
| `npm run test` | 18 suites, 382 tests passed ✅ |
| `npm run test:e2e` | 37 passed ✅ |

## Pendientes externos (no accionables desde código)

1. **Vercel Domains**: Redirección directa naked→www con 1 hop no es posible desde código — depende de Vercel platform
2. **Google Business Profile**: Crear perfil para SEO local
3. **Bing Webmaster / IndexNow**: Resolver 403 (verificar key file en Bing)
4. **Google PageSpeed / Lighthouse**: Datos CrUX no disponibles por bajo tráfico — esperar a que Google recopile datos de campo
