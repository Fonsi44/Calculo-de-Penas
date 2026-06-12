# PageSpeed Insights — Auditoría Mobile
## `pinedayasociadoshn.com` · 12 junio 2026 · 10:21 UTC-6

---

## Puntuaciones

| Categoría | Puntuación | Estado |
|-----------|-----------|--------|
| **Rendimiento** | **77** | 🟡 Mejorable |
| **Accesibilidad** | **88** | 🟡 Mejorable |
| **Prácticas recomendadas** | **100** | ✅ Perfecto |
| **SEO** | **100** | ✅ Perfecto |

---

## 1. RENDIMIENTO — 12 hallazgos

### 🔴 CRÍTICOS (score 0)

#### 1.1 Minimizar trabajo del hilo principal — 3.3 s
El hilo principal está ocupado durante 3.3 segundos. Las tareas se desglosan en:
- **Script Parsing & Compilation** (análisis y compilación de JS)
- **Script Evaluation** (ejecución de JS)
- **Style & Layout** (cálculo de estilos y layout)
- **Parse HTML & CSS** (análisis de HTML/CSS)
- **Other** (garbage collection, etc.)

**Solución**: Reducir el tamaño de los bundles JS, usar code splitting, lazy loading de componentes no críticos.

---

#### 1.2 Reducir tiempo de ejecución JavaScript — 2.3 s
Los scripts que más tiempo consumen:
1. `pinedayasociadoshn.com/` (documento principal)
2. `googletagmanager.com/gtag/js?id=G-L2PGBN3SWK` (Google Analytics)
3. `_next/static/chunks/0n76wdz_uzjg4.js` (chunk principal de Next.js)
4. `_next/static/chunks/turbopack-1sb1jio72fc5-.js` (Turbopack runtime)

**Solución**: Evaluar si GA4 puede cargarse de forma diferida. Revisar tree-shaking en el bundle de Next.js. Usar `next/dynamic` para componentes pesados.

---

#### 1.3 Elementos usan atributos ARIA prohibidos (accesibilidad) — 3 instancias
Elementos `<div>` con `role` implícito que no permite `aria-label`:
```html
<div class="flex items-center gap-0.5 text-accent" aria-label="5 de 5 estrellas">
```
**Archivo probable**: `components/marketing/trust-bar.tsx` o componente de estrellas.

**Solución**: Cambiar `<div>` a `<span>` o añadir `role="img"` al elemento padre.

---

#### 1.4 Contraste insuficiente — 21 instancias
- `text-accent-dark` (#B8962D) sobre fondos claros — 21 elementos afectados
- Principalmente en labels de tarjetas y badges con clase `text-xxs font-bold uppercase tracking-widest`

**Solución**: Oscurecer `text-accent-dark` o usar la variante más oscura en fondos claros. El nuevo valor `#B8962D` (cambiado del anterior `#C5A059`) ya mejoró el contraste, pero aún puede haber elementos que usan el token incorrecto.

---

#### 1.5 Nombres accesibles no coinciden con etiquetas visibles — 2 instancias
```html
<a aria-label="Pineda y Asociados - Inicio" href="/">
```
El `aria-label` contiene texto adicional que no coincide con el texto visible del enlace (probablemente solo el logo).

**Solución**: Asegurar que `aria-label` describa exactamente lo visible, o usar `aria-labelledby`.

---

#### 1.6 Touch targets insuficientes — 2 instancias
Enlaces en footer con tamaño/spacing inadecuado:
```html
<a href="/terminos" class="text-xs text-text-inverse/70">Términos</a>
<a href="/disclaimer" class="text-xs text-text-inverse/70">Disclaimer</a>
```
**Solución**: Añadir padding vertical de al menos 8px o `min-h-[44px]` a los enlaces del footer.

---

### 🟠 MEDIOS (score 37-57)

#### 1.7 Total Blocking Time — 790 ms
El tiempo total de bloqueo es de 790ms (recomendado < 200ms).

**Solución**: Reducir ejecución JS en el hilo principal (mismas acciones que 1.1 y 1.2).

---

#### 1.8 Reducir JavaScript no usado — 66 KB ahorrables
Google Tag Manager (`gtag/js`) tiene ~66 KB de código no utilizado.

**Solución**: Cargar GA4 con `next/script` y estrategia `lazyOnload` o `afterInteractive`.

---

#### 1.9 Mejorar entrega de imágenes — 51 KB ahorrables
2 imágenes de servicio mal dimensionadas:
1. `/images/services/familia.jpg` — renderizado a 662×441, pero el archivo fuente es 1080×720
2. `/images/services/laboral.jpg` — renderizado a 662×442, pero el archivo fuente es 1080×721

**Solución**: Usar `sizes` correcto en `next/image` para que el servidor entregue el tamaño adecuado. Añadir `sizes="(max-width: 768px) 100vw, 33vw"` en imágenes de grid.

---

#### 1.10 Recursos bloqueantes de renderizado
El CSS de Next.js bloquea el primer renderizado:
- `_next/static/chunks/0pi84u9qlz8c8.css`

**Solución**: Extraer CSS crítico e inlinearlo en el `<head>`. Usar `next/font` para fuentes con `display: swap`.

---

#### 1.11 Max Potential First Input Delay — 230 ms
Retraso máximo estimado para la primera interacción.

**Solución**: Mismas acciones que reducir trabajo del hilo principal.

---

### 🟡 LEVES (score 84)

#### 1.12 Largest Contentful Paint — 2.7 s
El LCP es de 2.7 segundos (recomendado < 2.5s).

**Solución**: Optimizar la carga de la imagen o texto del hero. Si es una imagen, usar `priority` en `next/image`. Si es texto, asegurar que la fuente está optimizada con `next/font`.

---

#### 1.13 Time to Interactive — 4.3 s
Tiempo hasta interactividad total: 4.3 segundos.

**Solución**: Diferir JS no crítico. Usar `next/dynamic` con `ssr: false` para componentes no esenciales.

---

## 2. ACCESIBILIDAD — 4 hallazgos

### 🔴 CRÍTICOS

#### 2.1 ARIA prohibido en `<div>` con `aria-label`
3 `<div>` sin role explícito usan `aria-label="5 de 5 estrellas"`.
- **WCAG**: 4.1.2
- **Archivo**: componente de estrellas/rating

#### 2.2 Contraste insuficiente — 21 elementos
`text-accent-dark` sobre fondos claros no alcanza 4.5:1.
- **WCAG**: 1.4.3
- **Archivo**: badges, labels, tarjetas de servicio

#### 2.3 Label/name mismatch — 2 enlaces
`aria-label` no coincide con el texto visible.
- **WCAG**: 2.5.3
- **Archivo**: `public-header.tsx`, logo link

#### 2.4 Touch targets pequeños — 2 enlaces footer
Enlaces del footer sin suficiente área táctil (mínimo 24×24px o spacing de 8px).
- **WCAG**: 2.5.8 (AAA)
- **Archivo**: `public-footer.tsx`

---

## 3. PLAN DE ACCIÓN PRIORIZADO

### Fase 1 — Impacto inmediato (30 min)

| # | Acción | Impacto | Categoría |
|---|--------|---------|-----------|
| 1 | Arreglar `aria-label` en divs de estrellas (cambiar a `<span>` o añadir `role="img"`) | Accesibilidad | ARIA prohibido |
| 2 | Ajustar `aria-label` del logo para que coincida con texto visible | Accesibilidad | Label mismatch |
| 3 | Añadir `min-h-[44px]` o padding a enlaces del footer | Accesibilidad | Touch targets |
| 4 | Revisar contraste de `text-accent-dark` → oscurecer a `#9A7A22` | Accesibilidad | Contraste |

### Fase 2 — Rendimiento JS (1-2 h)

| # | Acción | Impacto | Categoría |
|---|--------|---------|-----------|
| 5 | Cargar GA4 con `next/script strategy="lazyOnload"` | 66 KB JS ahorrados | Rendimiento |
| 6 | Añadir `sizes` correcto a imágenes de servicio | 51 KB imágenes ahorradas | Rendimiento |
| 7 | Usar `next/dynamic` para componentes bajo el fold | TBT -200ms estimado | Rendimiento |

### Fase 3 — Optimización profunda (2-4 h)

| # | Acción | Impacto | Categoría |
|---|--------|---------|-----------|
| 8 | Extraer CSS crítico e inlinear en `<head>` | LCP -500ms estimado | Rendimiento |
| 9 | Revisar tree-shaking del bundle Turbopack | Bundle JS -15% | Rendimiento |
| 10 | Optimizar fuente con `next/font` y `display: swap` | Eliminar bloqueo de fuente | Rendimiento |

---

## 4. MÉTRICAS CLAVE

| Métrica | Valor actual | Objetivo |
|---------|-------------|----------|
| Performance | 77 | ≥ 90 |
| Accesibilidad | 88 | ≥ 95 |
| LCP | 2.7 s | < 2.5 s |
| TBT | 790 ms | < 200 ms |
| TTI | 4.3 s | < 3.5 s |
| JS no usado | 66 KB | < 10 KB |
| Imágenes no optimizadas | 51 KB | 0 KB |

---

*Informe generado con Lighthouse CLI vía `npx lighthouse --form-factor=mobile --output=json` el 12 junio 2026.*
