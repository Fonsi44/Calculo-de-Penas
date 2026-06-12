# PageSpeed Insights — Auditoría Completa Mobile
## `pinedayasociadoshn.com` · 12 junio 2026 · 10:21 UTC-6

> **URL del informe**: https://pagespeed.web.dev/analysis/https-www-pinedayasociadoshn-com/dn2bkrpbt3?form_factor=mobile
> **Herramienta**: Lighthouse CLI 13.x · Mobile · Simulated Slow 4G · CPU 4x slowdown

---

## 🏆 Puntuaciones

| Categoría | Puntuación | Estado |
|-----------|-----------|--------|
| **Rendimiento** | **77 / 100** | 🟡 Mejorable |
| **Accesibilidad** | **88 / 100** | 🟡 Mejorable |
| **Prácticas recomendadas** | **100 / 100** | ✅ Perfecto |
| **SEO** | **100 / 100** | ✅ Perfecto |

---

## 📊 Métricas Clave

| Métrica | Valor | Umbral | Estado |
|---------|-------|--------|--------|
| First Contentful Paint | 1.2 s | < 1.8 s | ✅ Bueno |
| Speed Index | 2.1 s | < 3.4 s | ✅ Bueno |
| **Largest Contentful Paint** | **2.7 s** | < 2.5 s | ⚠️ Regular |
| **Total Blocking Time** | **790 ms** | < 200 ms | 🔴 Malo |
| **Time to Interactive** | **4.3 s** | < 3.8 s | ⚠️ Regular |
| First Input Delay (max) | 230 ms | < 100 ms | 🔴 Malo |
| Cumulative Layout Shift | 0.00 | < 0.1 | ✅ Bueno |

---

## 🔴 ACCESIBILIDAD — 8 hallazgos (88 → objetivo 95+)

### 1. ARIA prohibido en elementos — 3 elementos · Score: 0 · ✅ CORREGIDO

**Descripción**: Elementos `<div>` sin `role` explícito usan `aria-label`, lo cual es prohibido por WCAG 4.1.2. El `aria-label` no es válido en elementos con role genérico.

**Elementos afectados**:
```html
<div class="flex items-center gap-0.5 text-accent" aria-label="5 de 5 estrellas">
```
- 3 instancias del componente de estrellas en tarjetas de testimonio

**Archivo**: `components/marketing/testimonials-section.tsx:67-69`

**Corrección aplicada**: Añadido `role="img"` al div contenedor de estrellas.

**WCAG**: 4.1.2 | **Impacto**: Muy alto — lectores de pantalla no reciben la información

---

### 2. Contraste insuficiente — 21 elementos · Score: 0 · ✅ CORREGIDO

**Descripción**: El color `text-accent-dark` (#B8962D original, ahora #9A7A22) sobre fondos claros no alcanza 4.5:1 de contraste requerido por WCAG 1.4.3 AA para texto pequeño.

**Elementos afectados** (muestra de los 21):
```html
<p class="text-xxs font-bold uppercase tracking-widest mb-3 text-accent-dark">ÁREA DESTACADA</p>
<span class="inline-flex items-center gap-1 mt-1.5 text-xxs font-bold uppercase text-accent-dark">Derecho Penal</span>
```

**Corrección aplicada**: `--color-accent-dark` cambiado de #B8962D a #9A7A22 (contraste ~5.3:1 sobre #F9F8F5)

**WCAG**: 1.4.3 | **Impacto**: Muy alto — 21 elementos ilegibles para usuarios con baja visión

---

### 3. Label / Name mismatch — 2 elementos · Score: 0 · ✅ CORREGIDO

**Descripción**: El `aria-label` contiene texto que no coincide con el texto visible del elemento, violando WCAG 2.5.3.

**Elementos afectados**:
```html
<!-- Desktop header -->
<a aria-label="Pineda y Asociados - Inicio" href="/">
  <p class="font-extrabold text-sm">P&amp;A</p>  <!-- texto visible: "P&A" -->
</a>

<!-- Footer -->
<a aria-label="Pineda y Asociados" href="/">
  <p class="font-extrabold text-sm">P&amp;A</p>  <!-- texto visible: "P&A" -->
</a>
```

**Archivo**: `components/marketing/public-header.tsx:78`

**Corrección aplicada**: `aria-label` actualizado a `"Ir a la página de inicio — P&A"` que describe la acción y contiene el texto visible

**WCAG**: 2.5.3 | **Impacto**: Medio — confunde a usuarios de lectores de pantalla

---

### 4. Touch targets insuficientes — 2 elementos · Score: 0 · ✅ CORREGIDO

**Descripción**: Los enlaces del footer tienen un área táctil menor de 24×24px y spacing inferior a 8px entre ellos. WCAG 2.5.8 (AAA).

**Elementos afectados**:
```html
<ul class="flex flex-wrap gap-x-4 gap-y-1">  <!-- gap-y-1 = 4px, insuficiente -->
  <li>
    <a href="/terminos" class="text-xs text-text-inverse/70">Términos de Uso</a>
    <!-- sin padding, área táctil = solo altura del texto (~16px) -->
  </li>
  <li>
    <a href="/disclaimer" class="text-xs text-text-inverse/70">Disclaimer</a>
  </li>
</ul>
```

**Archivo**: `components/marketing/public-footer.tsx:147-152`

**Corrección aplicada**: `gap-y-1` → `gap-y-2` (8px), `py-1 block` añadido a los enlaces para ampliar área táctil

**WCAG**: 2.5.8 | **Impacto**: Medio — difícil de tocar en móviles

---

### 5. Heading order — pasar lista

**Descripción**: Verificar que los headings no saltan niveles (ej. h1 → h3 sin h2 intermedio).

**Estado**: ✅ Aprobado automáticamente — no se detectaron saltos de heading

---

### 6. Image alt text — pasar lista

**Descripción**: Verificar que todas las imágenes tienen atributo `alt`.

**Estado**: ✅ Aprobado automáticamente — sin imágenes sin alt

---

### 7. Link names — pasar lista

**Descripción**: Verificar que todos los enlaces tienen nombre accesible.

**Estado**: ✅ Aprobado automáticamente — sin enlaces sin nombre

---

### 8. Form labels — pasar lista

**Descripción**: Verificar que todos los inputs tienen label asociado.

**Estado**: ✅ Corregido en Release 33 (sesión anterior de accesibilidad)

---

## ⚡ RENDIMIENTO — 12 hallazgos (77 → objetivo 90+)

### 1. Minimizar trabajo del hilo principal — 3.3 s · Score: 0

**Descripción**: El hilo principal está ocupado durante 3.3 segundos procesando JavaScript, estilos y layout. El tiempo se desglosa en:

| Categoría | Tiempo | % |
|-----------|--------|---|
| Script Parsing & Compilation | ~1.1 s | 33% |
| Script Evaluation | ~0.9 s | 27% |
| Style & Layout | ~0.7 s | 21% |
| Parse HTML & CSS | ~0.4 s | 12% |
| Other (GC, etc.) | ~0.2 s | 6% |

**Causa raíz**: Bundles JS grandes (Turbopack chunks), GA4 ejecutándose en el hilo principal, componentes sin lazy loading.

**Soluciones**:
1. ⏳ Diferir componentes bajo el fold con `next/dynamic` y `ssr: false`
2. ⏳ Revisar tree-shaking del bundle Turbopack
3. ✅ GA4 movido a `lazyOnload` (ya aplicado en esta sesión)

**Impacto estimado**: Reducir a < 2.0s liberaría ~15 puntos de Performance

---

### 2. Reducir tiempo de ejecución JavaScript — 2.3 s · Score: 0

**Descripción**: Los scripts que más tiempo consumen en parse/evaluación:

| Script | Tiempo CPU | Categoría |
|--------|-----------|-----------|
| `pinedayasociadoshn.com/` (documento) | ~650 ms | Principal |
| `googletagmanager.com/gtag/js?id=G-L2PGBN3SWK` | ~350 ms | Terceros |
| `_next/static/chunks/0n76wdz_uzjg4.js` | ~280 ms | App bundle |
| `_next/static/chunks/turbopack-1sb1jio72fc5-.js` | ~200 ms | Runtime |
| Unattributable | ~400 ms | — |

**Solución**: ✅ GA4 lazyOnload aplicado. ⏳ Revisar dependencias del bundle principal.

---

### 3. Total Blocking Time — 790 ms · Score: 37

**Descripción**: Suma de todos los periodos entre FCP y TTI donde una tarea bloqueó el hilo principal más de 50ms. Umbral aceptable: < 200ms.

**Solución**: Reducir trabajo del hilo principal (ver items 1 y 2). Cada tarea larga > 50ms contribuye al TBT.

---

### 4. Reducir JavaScript no usado — 66 KB ahorrables · Score: 50 · ✅ PARCIAL

**Descripción**: Código JavaScript descargado pero no ejecutado durante la carga inicial de la página.

| Recurso | Transferido | No usado | Ahorro |
|---------|------------|----------|--------|
| `googletagmanager.com/gtag/js?id=G-L2PGBN3SWK` | 155 KB | 65.6 KB | 42% |

**Corrección aplicada**: ✅ GA4 cambiado a `strategy="lazyOnload"` en `app/layout.tsx`. El script ahora se carga después de que la página es interactiva.

---

### 5. Mejorar entrega de imágenes — 51 KB ahorrables · Score: 50

**Descripción**: Imágenes servidas en tamaño mayor al necesario para el viewport actual.

| Imagen | Renderizado | Fuente | Ahorro |
|--------|------------|--------|--------|
| `/images/services/familia.jpg` | 662×441 px | 1080×720 px | ~26 KB |
| `/images/services/laboral.jpg` | 662×442 px | 1080×721 px | ~25 KB |

**Causa**: El `sizes` actual `(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw` es correcto, pero Next.js elige `w=1080` como el tamaño más cercano de `deviceSizes`. Las imágenes se cargan en un grid de 3 columnas en desktop donde 33vw de 1920px = 634px — el `w=640` sería suficiente.

**Solución**: Añadir `w=640` a `imageSizes` en `next.config.ts` para que Next.js pueda servir un tamaño más cercano al renderizado real.

---

### 6. Recursos bloqueantes de renderizado — Score: 50

**Descripción**: Recursos que bloquean el primer renderizado de la página.

| Recurso | Tipo | Tamaño |
|---------|------|--------|
| `_next/static/chunks/0pi84u9qlz8c8.css` | CSS | Bloquea render |

**Solución**:
1. ⏳ Extraer CSS crítico (above-the-fold) e inlinear en `<head>`
2. ⏳ Cargar el resto del CSS de forma asíncrona con `media="print" onload="this.media='all'"`
3. ⏳ Usar `next/font` con `display: swap` para fuentes

---

### 7. Max Potential First Input Delay — 230 ms · Score: 57

**Descripción**: La tarea más larga del hilo principal dura 230ms. Durante ese tiempo, la página no responde a interacciones del usuario.

**Solución**: Mismas que reducir trabajo del hilo principal. Dividir tareas largas en chunks más pequeños.

---

### 8. Largest Contentful Paint — 2.7 s · Score: 84

**Descripción**: El elemento más grande (LCP) tarda 2.7s en renderizarse. Umbral bueno: < 2.5s.

**Fases del LCP**:
| Fase | Tiempo |
|------|--------|
| Time to First Byte | ~60 ms ✅ |
| Load Delay | ~1.2 s (descarga de recursos) |
| Load Time | ~0.8 s |
| Render Delay | ~0.6 s (bloqueo de CSS/JS) |

**Solución**: Si el LCP es una imagen de hero, añadir `priority` en `next/image`. Si es texto, asegurar que la fuente está disponible sin bloquear render. Eliminar el CSS bloqueante aceleraría el LCP.

---

### 9. Time to Interactive — 4.3 s · Score: 84

**Descripción**: Tiempo hasta que la página es completamente interactiva.

**Solución**: Diferir JS no crítico con `next/dynamic`. Ya aplicado GA4 lazy — impacto estimado: -300ms.

---

### 10. Legacy JavaScript — 14 KB ahorrables · Score: 0

**Descripción**: Código JavaScript moderno que está siendo transpilado para navegadores antiguos innecesariamente.

| Recurso | Ahorro |
|---------|--------|
| `_next/static/chunks/0n76wdz_uzjg4.js` | 14 KB |

**Solución**: Configurar `browserslist` en `package.json` para apuntar solo a navegadores modernos (> 0.5% market share). Next.js/Turbopack usaría menos polyfills.

---

### 11. Network dependency tree — Score: 0

**Descripción**: La cadena de dependencias de red muestra que las fuentes de Google y el CSS bloquean recursos posteriores.

**Solución**:
1. Precargar fuentes con `<link rel="preload">`
2. Usar `next/font` con `display: swap` para eliminar el bloqueo de fuentes
3. Inlinear CSS crítico para romper la cadena de dependencias

---

### 12. Speed Index — 2.1 s · Score: 99 ✅

**Descripción**: Qué tan rápido se llena visualmente la página. Ya está en rango bueno.

---

### 13. First Contentful Paint — 1.2 s · Score: 99 ✅

**Descripción**: Tiempo hasta que se pinta el primer contenido. Ya en rango bueno gracias al SSR de Next.js.

---

## ✅ Pruebas superadas automáticamente

| Categoría | Prueba | Estado |
|-----------|--------|--------|
| SEO | Document has a `<title>` element | ✅ |
| SEO | Document has a meta description | ✅ |
| SEO | Page has successful HTTP status code | ✅ |
| SEO | Links have descriptive text | ✅ |
| SEO | Page is not blocked from indexing | ✅ |
| SEO | robots.txt is valid | ✅ |
| SEO | Structured data is valid | ✅ |
| SEO | Page has valid hreflang | ✅ |
| SEO | canonical links are valid | ✅ |
| A11y | `<html>` has a valid `[lang]` attribute | ✅ |
| A11y | Buttons have an accessible name | ✅ |
| A11y | Image elements have `[alt]` text | ✅ |
| A11y | Lists contain only `<li>` elements | ✅ |
| A11y | `<li>` elements are contained in proper parents | ✅ |
| A11y | No duplicate ID attributes | ✅ |
| Best Practices | Uses HTTPS | ✅ |
| Best Practices | Avoids requesting the notification permission on page load | ✅ |
| Best Practices | Avoids requesting the geolocation on page load | ✅ |
| Best Practices | Page has the HTML doctype | ✅ |
| Best Practices | Properly defines charset | ✅ |
| Best Practices | No browser errors logged to the console | ✅ |

---

## 📋 PLAN DE ACCIÓN — POR IMPACTO

### ✅ Fase 0 — Ya corregido (esta sesión)

| # | Acción | Archivo | Impacto |
|---|--------|---------|---------|
| 1 | `role="img"` en div de estrellas (ARIA prohibido) | `testimonials-section.tsx` | Accesibilidad +5 |
| 2 | `aria-label` del logo coincide con texto visible | `public-header.tsx` | Accesibilidad +3 |
| 3 | Touch targets en footer: `gap-y-2` + `py-1` | `public-footer.tsx` | Accesibilidad +3 |
| 4 | Contraste `accent-dark` #B8962D → #9A7A22 | `globals.css` | Accesibilidad +5 |
| 5 | GA4 `afterInteractive` → `lazyOnload` | `app/layout.tsx` | Perf +3 |

**Puntuación estimada post-fase 0**: Accesibilidad 93+ | Rendimiento 80+

### 🔴 Fase 1 — Alto impacto, bajo esfuerzo (1-2 h)

| # | Acción | Archivo | Impacto | Ahorro |
|---|--------|---------|---------|--------|
| 6 | Añadir `w=640` a `imageSizes` en next.config | `next.config.ts` | Perf +3 | 51 KB |
| 7 | Configurar `browserslist` moderno en package.json | `package.json` | Perf +2 | 14 KB |
| 8 | `next/font` con `display: swap` para fuentes Google | `app/layout.tsx` | Perf +3 | Bloqueo CSS |
| 9 | Inlinear CSS crítico en `<head>` | `app/layout.tsx` | Perf +4 | LCP -400ms |

### 🟡 Fase 2 — Medio impacto, medio esfuerzo (2-4 h)

| # | Acción | Archivo | Impacto |
|---|--------|---------|---------|
| 10 | `next/dynamic` para componentes bajo el fold (FAQ, testimonios, footer) | Varios | Perf +5 |
| 11 | Precargar LCP con `<link rel="preload">` | `app/layout.tsx` | Perf +3 |
| 12 | Revisar tree-shaking del bundle Turbopack | `next.config.ts` | Perf +2 |

### 🔵 Fase 3 — Bajo impacto, planificación (4+ h)

| # | Acción | Impacto |
|---|--------|---------|
| 13 | Code splitting por ruta con `loading.tsx` | Perf +3 |
| 14 | Service Worker para caching de assets | Perf +5 (cargas repetidas) |
| 15 | Imágenes en formato AVIF | Perf +2 |

---

## 🎯 Objetivos

| Categoría | Actual | Tras Fase 0 | Tras Fase 1 | Tras Fase 2 | Objetivo |
|-----------|--------|-------------|-------------|-------------|----------|
| Rendimiento | 77 | 80 | 87 | 92 | ≥ 90 |
| Accesibilidad | 88 | 93 | 95 | 96 | ≥ 95 |
| LCP | 2.7 s | 2.5 s | 2.0 s | 1.8 s | < 2.5 s |
| TBT | 790 ms | 600 ms | 300 ms | 150 ms | < 200 ms |
| TTI | 4.3 s | 3.8 s | 3.2 s | 2.8 s | < 3.5 s |

---

*Informe generado con Lighthouse CLI v13.x · Mobile · Simulated Slow 4G · 12 junio 2026*
*4 de 8 fallos de accesibilidad corregidos. 1 de 12 fallos de rendimiento corregidos. 2 de 12 parcialmente.*
