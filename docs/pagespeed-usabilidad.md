# Diagnóstico de PageSpeed / UX Móvil

## Optimización aplicada — Release 75 (2026-06-19)

### Cambios aplicados
| Área | Antes | Después | Impacto |
|---|---|---|---|
| **RSC payload home** | `LazyBlogSearch` recibía 74 posts serializados como props (RSC stream) | BlogSearch eliminado de la home; reemplazado por CTA ligero al `/blog` | Reduce payload de hidratación de la home |
| **Scripts GA4/Clarity** | Ya usaban `lazyOnload` (no bloqueante) | Sin cambios (ya optimizado) | ✅ |
| **iframe mapa** | Ya tenía `loading="lazy"`, `sandbox`, `title`, `<noscript>` | Sin cambios (ya optimizado) | ✅ |
| **Componentes cliente** | 15 en web pública | Revisados: todos justificados (interacción real) | ✅ |
| **Estilos inline** | Solo 3 en `placeholder-photo.tsx` (dinámicos) | Sin cambios (justificados) | ✅ |

### Componentes cliente analizados (justificados, NO convertidos a server)
- `PublicHeader`: menú móvil, scroll listener, navegación → requiere client
- `FloatingContactRail`: botones clicables + tracking → requiere client
- `BlogSearch`: filtrado client-side con `useState`/`useMemo` → requiere client
- `SolicitarConsultaForm`: formulario POST → requiere client
- `BlogCtaBar`: tracking `onClick` analytics → requiere client
- `CopyableAddress`: `navigator.clipboard` → requiere client
- `ShareButtons`: `window.open` para compartir → requiere client

### Script de auditoría creado
`scripts/auditar-performance-publico.ts`: comprueba 14 URLs públicas contra
producción y reporta tamaño HTML, scripts GA4/Clarity duplicados, iframes sin
`title`/`lazy`, emails en texto plano, rutas privadas filtradas, y em-dash en
OG. Uso: `npx tsx scripts/auditar-performance-publico.ts`.

### Redirecciones (curl, sin cambios — correctas)
| URL | Cadena | Resultado |
|---|---|---|
| `https://www.pinedayasociadoshn.com/` | 200 directo | ✅ |
| `https://pinedayasociadoshn.com/` | 308 → www → 200 | ✅ |
| `http://www.pinedayasociadoshn.com/` | 308 → https www → 200 | ✅ |
| `http://pinedayasociadoshn.com/` | 308 → https apex → 308 → www → 200 | ⚠️ 2 saltos (Vercel Domains, externo) |

### NO VALIDADO (requiere herramientas externas)
- **Lighthouse local real**: no ejecutable desde CLI (requiere navegador headless).
  Validar manualmente en https://pagespeed.web.dev/.
- **Core Web Vitals field data**: requiere tráfico real + CrUX/GSC.
- **Doble redirect http apex**: gestionado por Vercel Domains, no accionable
  desde el repo.

### Móvil (verificación de principios)
- FloatingContactRail: `bottom-4 right-4` + `paddingBottom: env(safe-area-inset-bottom)` → no tapa contenido
- Footer: padding `py-14 md:py-16` → suficiente
- Botones: altura mínima `h-11`/`h-12` (44-48px táctil) → correcto
- Texto base: `text-sm`/`text-base` (14-16px) → correcto, no baja de 14

---

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
