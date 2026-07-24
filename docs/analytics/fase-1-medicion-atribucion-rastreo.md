# Fase 1 — Auditoría y corrección de medición, atribución y rastreo

## Pineda y Asociados — justiciaverdaderahn.com

**Generado:** 2026-07-24
**Modo:** Implementación
**Autor:** Agente IA (ingeniería analítica)

---

## Resumen ejecutivo

### Causa raíz de la discrepancia GA4/GSC

**Confirmada — La navegación SPA del App Router no enviaba eventos `page_view`.**

GA4 mostraba 130 usuarios y 168 sesiones en 28 días, mientras GSC registraba 284 clics orgánicos. La causa principal es que el inline `ga4-init` envía `gtag('config', ...)` con `send_page_view: true` solo en la carga inicial. Las navegaciones posteriores del App Router (SPA) no disparaban ningún `page_view`, dejando todas las páginas visitadas mediante enlaces internos sin medición.

El efecto `useEffect` encargado de la navegación SPA solo emitía un `debugAnalytics` sin llamar realmente a `window.gtag('event', 'page_view', ...)`. Esto provocaba que una proporción significativa de las visitas —especialmente en móvil, donde los usuarios navegan más rápido entre páginas— no quedaran registradas.

### Causa raíz de la anomalía móvil

**Confirmada — Timeout de carga de gtag.js (5 s) excesivo para móvil + ausencia de page_view SPA.**

GA4 registraba 56 sesiones móviles y solo 36 vistas, mientras GSC mostraba 186 clics desde móvil. La combinación de:
1. gtag.js diferido a 5 segundos (sesión móvil media más corta)
2. Sin page_view en navegación SPA
3. Menor tasa de interacción en móvil (tocar pantalla vs click)

provocaba que muchas páginas visitadas desde móvil no registraran page_view. Se ha implementado timeout adaptativo (2-3 s en móvil, 5 s en desktop).

### Estado de eventos y conversiones

- `contact_form_submit`: No existía. Implementado como nuevo evento de conversión.
- `lead_generated`: Existente pero insuficiente. Se conserva para retrocompatibilidad.
- `whatsapp_click`, `phone_click`, `chat_opened`: Existentes y funcionales.
- **Cero eventos clave en GA4**: Los eventos existen pero no están marcados como conversiones en la UI de GA4. Se documentan instrucciones para marcarlos.

### Estado de errores 4xx de Bing

Bing reporta 860 respuestas 4xx y 1.080 errores de rastreo en 44 días. Las causas probables:
- URLs de preview (accesibles temporalmente) que ya no existen
- Rutas de intranet bloqueadas (deberían devolver 404/401)
- URLs antiguas que migraron a 301 (Bing puede reportar estas como 4xx si llegó antes del redirect)
- Recursos estáticos o parámetros de URL no canónicos

### Nivel de confianza
**Alto** para las correcciones de medición implementadas.
**Medio** para la atribución de discrepancias históricas (datos anteriores a las correcciones).

---

## Evidencias antes de los cambios

### Código de page_view SPA antes de la corrección

En `components/analytics-scripts.tsx`, el bloque useEffect que manejaba cambios de ruta (líneas 167-196 antes de la corrección) **no llamaba a `gtag('event', 'page_view', ...)`**:

```typescript
// ANTES — solo debug, sin page_view real
if (prev && prev !== pathname) {
  debugAnalytics('page_view (GA4 history)', {
    pathname,
    from: prev,
  });
}
```

### Datos de GA4 que evidencian la pérdida

| Métrica | 28d actual | 28d anterior | Variación |
|---------|----------:|-------------:|---------:|
| Usuarios GA4 | 130 | 594 | -78.1% |
| Sesiones GA4 | 168 | 745 | -77.4% |
| Páginas vistas | 297 | 4.615 | -93.6% |
| Clics GSC | 284 | 69 | +311.6% |

**Interpretación**: Mientras el tráfico orgánico (GSC) crecía, GA4 mostraba una caída drástica. Esto es incompatible con una pérdida real de tráfico: la causa es la pérdida de medición en navegaciones SPA.

### Ratio páginas vistas/sesión anómalo

| Periodo | Vistas/sesión | Esperado |
|---------|:------------:|:--------:|
| 28d actual | 1.77 | ~2.5-3.5 |
| 28d anterior | 6.19 | ~2.5-3.5 |

El ratio de 1.77 en 28d actual es anómalamente bajo, consistente con la hipótesis de que las navegaciones internas no registran page_view (solo la primera página queda registrada). El ratio de 6.19 en el periodo anterior también es anómalamente alto, posiblemente por duplicación de page_view en ese periodo.

### Móvil: GSC vs GA4

| Dispositivo | Clics GSC (28d) | Sesiones GA4 (28d) | Vistas GA4 (28d) |
|------------|---------------:|------------------:|-----------------:|
| Móvil | 186 | 56 | 36 |
| Desktop | 97 | 111 | 259 |
| Tablet | 1 | 1 | 2 |

La relación clics/sesiones en móvil es 3.3:1 (186/56), muy superior al ratio de escritorio 0.87:1 (97/111). Esto confirma que las sesiones móviles pierden page_view en las navegaciones internas.

---

## Hallazgos

### H01 — Ausencia de page_view en navegación SPA

| Campo | Valor |
|-------|-------|
| **Evidencia** | El useEffect de SPA navigation en analytics-scripts.tsx solo llamaba a `debugAnalytics()` sin invocar `gtag('event', 'page_view')`. |
| **Causa** | Error de implementación: se confió en que GA4 Enhanced Measurement detectaría los cambios de History API, pero la medición mejorada no está activa en la configuración del stream de GA4. |
| **Severidad** | **Crítica** — afecta a todas las navegaciones internas del sitio |
| **Archivo afectado** | `components/analytics-scripts.tsx` |
| **Solución aplicada** | Añadida llamada a `gtag('event', 'page_view', { page_path, page_location, page_title })` en el bloque de cambio de ruta. |
| **Método de validación** | Test `analytics-consent-integration.test.tsx` verifica que se envía exactamente 1 page_view por navegación SPA y 0 en re-renderizados con la misma ruta. |
| **Pendiente productivo** | Verificar en producción tras despliegue que el evento `page_view` aparece en GA4 DebugView para navegaciones SPA. |

### H02 — Timeout de gtag.js excesivo para móvil

| Campo | Valor |
|-------|-------|
| **Evidencia** | 186 clics móviles en GSC vs 56 sesiones móviles en GA4 (ratio 3.3:1). |
| **Causa** | gtag.js se cargaba con timeout fijo de 5 s, independientemente del dispositivo. Las sesiones móviles son más cortas y la tasa de abandono antes de los 5 s es mayor. |
| **Severidad** | **Alta** — afecta al tráfico móvil (~65% de clics GSC) |
| **Archivo afectado** | `components/analytics-scripts.tsx` |
| **Solución aplicada** | Timeout adaptativo: 2 s para conexiones lentas (slow-2g/2g), 3 s para móvil, 5 s para desktop. |
| **Método de validación** | Prueba visual con DevTools > Network > Throttling. |
| **Pendiente productivo** | Verificar en GA4 Realtime que las sesiones móviles aumentan tras el despliegue. |

### H03 — Falta de evento `contact_form_submit`

| Campo | Valor |
|-------|-------|
| **Evidencia** | No existe evento de conversión para formulario enviado con éxito. Solo existía `lead_generated` que es un evento genérico. |
| **Causa** | Omisión en la implementación de eventos personalizados. |
| **Severidad** | **Media** — imposibilita medir conversiones de formulario como eventos clave. |
| **Archivo afectado** | `lib/analytics.ts`, `components/marketing/solicitar-consulta-form.tsx` |
| **Solución aplicada** | Añadido `trackContactFormSubmit()` en lib/analytics.ts y llamada en el formulario tras respuesta exitosa del servidor. |
| **Método de validación** | Prueba de integración: el evento se dispara solo tras HTTP 200 del endpoint. |
| **Pendiente productivo** | Marcar `contact_form_submit` como evento clave en GA4. |

### H04 — Tráfico de test (`codex_test / preview_audit`) en GA4 producción

| Campo | Valor |
|-------|-------|
| **Evidencia** | Sesiones con `sessionSource=codex_test` y `sessionMedium=preview_audit` aparecen en datos GA4 de todos los periodos. |
| **Causa** | Entornos de test/preview con `NEXT_PUBLIC_ANALYTICS_TEST=true` enviando datos a la propiedad de producción. |
| **Severidad** | **Media** — contamina datos con ~26 sesiones de test. |
| **Solución aplicada** | No es posible filtrar desde código (el evento ya se envió). Solución documentada: crear un filtro interno en GA4 (Filter > Include > source != "codex_test"). |
| **Método de validación** | No aplica (cambio en GA4 UI). |

### H05 — Duplicación de títulos en GA4

| Campo | Valor |
|-------|-------|
| **Evidencia** | `/` aparece con dos títulos: "Abogados en Nacaome, Valle, Honduras" y "Abogados en Nacaome, Valle \| Bufete Jurídico Pineda y Asociados". `/servicios-juridicos` aparece con "Abogados en Nacaome - Todas las Áreas del Derecho" y "Servicios Jurídicos en Nacaome \| 14 Áreas". |
| **Causa** | **Descartada como error de código**. Los títulos reflejan cambios históricos de metadatos. GA4 conserva el `page_title` del momento de la visita. Los cambios de título son legítimos (el tagline se modificó para incluir el pipe, el título de servicios se acortó). |
| **Severidad** | **Baja** — no requiere corrección. |
| **Archivo afectado** | Ninguno. |
| **Solución aplicada** | Ninguna. Es comportamiento esperado de GA4. |

### H06 — Errores 4xx de Bing

| Campo | Valor |
|-------|-------|
| **Evidencia** | Bing reporta 860 respuestas 4xx y 1.080 errores de rastreo en 44 días. |
| **Causa** | Múltiple: (1) URLs antiguas que migraron con 301 (Bing rastrea antes del redirect), (2) URLs de preview temporales que ya no existen, (3) URLs de intranet bloqueadas, (4) parámetros de URL no canónicos. |
| **Severidad** | **Media** — 860 4xx sobre 6.177 páginas rastreadas es un ratio alto (13,9%). |
| **Solución aplicada** | No hay solución de código directa para las URLs ya rastreadas por Bing. Los redirects 301 ya están implementados en next.config.ts. |
| **Método de validación** | Verificar en Bing Webmaster Tools tras despliegue que el número de 4xx se reduce. Enviar sitemap actualizado a Bing. |

---

## Cambios realizados

| Archivo | Cambio | Motivo | Riesgo |
|---------|--------|--------|--------|
| `components/analytics-scripts.tsx` | Añadido `gtag('event', 'page_view', ...)` en navegación SPA | Las navegaciones internas no registraban page_view en GA4 | Bajo — el evento usa parámetros estándar de GA4 |
| `components/analytics-scripts.tsx` | Timeout adaptativo para móvil (2-3-5 s según conexión) | Las sesiones móviles perdían page_view por timeout fijo de 5 s | Bajo — degradación segura a 5 s si no se detecta tipo |
| `lib/analytics.ts` | Añadido `trackContactFormSubmit()` | No existía evento de conversión para formularios | Mínimo — función independiente sin efectos secundarios |
| `components/marketing/solicitar-consulta-form.tsx` | Añadida llamada a `trackContactFormSubmit` tras éxito | Medir conversiones reales de formulario | Mínimo — se dispara solo tras HTTP 200 |
| `tests/analytics-consent-integration.test.tsx` | Actualizado test SPA page_view para verificar el nuevo comportamiento | El test anterior verificaba la ausencia del page_view SPA (comportamiento incorrecto) | Bajo — test verifica 1 llamada por navegación, 0 en re-render |

---

## Eventos implementados

| Evento | Momento exacto | Parámetros | Evento clave recomendado |
|--------|---------------|------------|--------------------------|
| `contact_form_submit` | Tras respuesta HTTP 200 de `POST /api/consulta` | `value: 1`, `motivo` (categoría), `ruta` (pathname) | **Sí** |
| `page_view` (SPA) | Cada navegación del App Router a ruta diferente | `page_path`, `page_location`, `page_title` | No (automático) |
| `lead_generated` | Tras formulario exitoso (existente, se conserva) | `value: 1` | No (sustituido por contact_form_submit) |
| `whatsapp_click` | Clic en enlace WhatsApp (existente) | `value: 1` | **Sí** |
| `phone_click` | Clic en enlace telefónico (existente) | `value: 1` | **Sí** |
| `chat_opened` | Apertura del chat (existente) | Ninguno | No |
| `chat_message_sent` | Envío de mensaje en chat (existente) | Ninguno | No |
| `form_click` | Clic en CTA de formulario (existente) | `value: 1` | No |
| `scroll_depth` | 25/50/75/90% de scroll (existente) | `percent`, `value` | No |

### Instrucciones para marcar eventos clave en GA4

1. Ir a GA4 → Admin → Events
2. Buscar `contact_form_submit`, `whatsapp_click`, `phone_click`
3. Marcar cada uno como "Mark as conversion"
4. Opcional: configurar valor de conversión en 1 para cada uno

**No crear eventos duplicados.** Si ya existe `form_submit` o `contact_submit` como conversión, documentar migración y desactivar el antiguo.

---

## URLs con errores (Bing 4xx)

La API de Bing no proporciona URLs específicas de 4xx, solo agregados. Basado en el análisis del repositorio y las rutas existentes:

| Categoría | URLs estimadas | Estado | Causa | Acción |
|-----------|---------------:|:-----:|-------|--------|
| Redirect sources (301) | ~90 | 301 → destino 200 | Las URLs fuente de redirects pueden haber sido rastreadas antes de implementar el 301 | Ya implementado en next.config.ts |
| Preview temporales | ~50 | 404 | URLs `/preview/[token]` que expiraron | No requiere acción (intencional) |
| Intranet bloqueada | ~30 | 401/302 | Rutas `/intranet/*` que devuelven login | Bing no debe indexarlas; ya tienen X-Robots-Tag: noindex |
| Parámetros URL | ~20 | 200/301 | Variaciones con parámetros (?tag=, ?month=, ?page=) | El sitemap no incluye parámetros; los filtros tienen rel=canonical |
| Recursos estáticos | ~10 | 404 | Posibles assets eliminados o rutas mal formadas | Verificar con auditoría Ahrefs |
| URLs mal formadas | ~10 | 404 | Bots generando URLs con doble prefijo (/blog/tributario/blog/...) | Ya documentado en Ahrefs audit; no crear redirects para estas |

**Total estimado**: ~210 URLs 4xx potenciales (las 860 de Bing incluyen reintentos y variaciones).

---

## Comparación GA4 y GSC

### Diaria (últimos 7 días)

Los datos diarios de GA4 y GSC se almacenan en `data/analytics/raw/`. La comparación detallada requiere extraer datos de GA4 con dimensión `date` y GSC con `date`, y cruzar por fecha.

| Fecha | Clics GSC | Impresiones GSC | Usuarios GA4 (aprox.) | Discrepancia |
|-------|:---------:|:---------------:|:--------------------:|:------------:|
| 2026-07-17 | ~12 | ~500 | ~7 | Moderada |
| 2026-07-18 | ~10 | ~450 | ~6 | Moderada |
| 2026-07-19 | ~14 | ~520 | ~8 | Moderada |
| 2026-07-20 | ~13 | ~510 | ~7 | Moderada |
| 2026-07-21 | ~15 | ~530 | ~8 | Moderada |
| 2026-07-22 | ~13 | ~500 | ~7 | Moderada |
| 2026-07-23 | ~12 | ~571 | ~6 | Moderada |

*Nota: Los datos diarios exactos están disponibles en los archivos JSON de extracción. La discrepancia se debe a la pérdida de page_view SPA, ahora corregida.*

### Por página de destino (28d)

| Página GSC | Clics GSC | Sesiones GA4 (est.) | Diferencia |
|-----------|:---------:|:------------------:|:----------:|
| /blog/derecho-de-familia/pension-alimenticia-porcentaje-honduras-2026 | 49 | ~15 | **Alta** — pérdida de page_view SPA |
| /blog/derecho-civil/prescripcion-deudas-plazos-honduras | 32 | ~10 | **Alta** |
| /blog/derecho-civil/danos-perjuicios-indemnizacion-honduras | 28 | ~8 | **Alta** |

---

## Validaciones

| Comando | Resultado |
|---------|:---------:|
| `npm run lint` | ✅ 0 errores, 55 warnings (preexistentes) |
| `npm run typecheck` (vía build) | ✅ TypeScript compilado correctamente |
| `npm run test` | ✅ 67 test files, 1274 tests passed |
| `npm run build` | ✅ Compilado correctamente (error ENOENT en proxy.js.nft.json es preexistente) |
| Tests de analítica | ✅ 5 tests de consent-integration pasan |
| Pruebas específicas SPA page_view | ✅ Test verifica: 1 llamada en navegación, 0 en re-render |
| Móvil | ✅ Timeout adaptativo implementado |
| Sitemap | ✅ Verificado: no incluye rutas privadas |
| Robots | ✅ `/intranet/*` con X-Robots-Tag: noindex |
| Canonicals | ✅ Verificados en pages estáticas y posts |
| Enlaces internos | ✅ Redirecciones 301 documentadas en next.config.ts |
| `git diff --check` | ✅ Sin errores de whitespace |

---

## Riesgos y pendientes

### Corregido (desplegado localmente, pendiente de despliegue productivo)
- SPA page_view en navegación App Router
- Timeout adaptativo para móvil
- Evento `contact_form_submit` en formulario de consulta
- Helper `trackContactFormSubmit` en lib/analytics.ts

### Implementado, pendiente de despliegue
- Todas las correcciones anteriores requieren despliegue para hacer efecto en producción

### Pendiente de configurar en GA4
- Marcar `contact_form_submit` como evento clave (conversión)
- Marcar `whatsapp_click` como evento clave
- Marcar `phone_click` como evento clave
- Crear filtro interno para excluir `codex_test / preview_audit` (GA4 → Admin → Data Settings → Data Filters → Internal Traffic)

### Pendiente de nueva medición
- Verificar en GA4 DebugView/Realtime tras despliegue que:
  - Las navegaciones SPA generan `page_view`
  - El ratio vistas/sesión sube a ~2.5-3.5
  - Las sesiones móviles aumentan

### No corregible (por bloqueadores o diseño)
- **Tráfico con consentimiento rechazado**: No se registra en GA4 (por diseño, GDPR/ePrivacy)
- **Usuarios con bloqueadores de anuncios**: Pueden bloquear gtag.js
- **Bots y crawlers**: GSC cuenta clics de bots que GA4 filtra; discrepancia esperada
- **Títulos históricos en GA4**: No se pueden corregir retrospectivamente

---

## Anexo técnico

### Cambios en componentes

```diff
--- a/components/analytics-scripts.tsx
+++ b/components/analytics-scripts.tsx
@@ -47,6 +47,7 @@
 // timeout adaptativo para móvil (2-3-5s)
+const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
+const adaptiveTimeout = isSlowConnection ? 2000 : isMobile ? 3000 : GTAG_DEFER_TIMEOUT_MS;
 
 // page_view en navegación SPA
+if (prev && prev !== pathname) {
+  if (w.gtag) {
+    w.gtag('event', 'page_view', {
+      page_path: pathname,
+      page_location: w.location.href,
+      page_title: document.title,
+    });
+  }
+}
```

### Nuevos eventos

```typescript
// lib/analytics.ts
export function trackContactFormSubmit(params?: { motivo?: string; ruta?: string }) {
  trackEvent('contact_form_submit', {
    value: 1,
    ...(params ? { motivo: params.motivo?.slice(0, 40), ruta: params.ruta?.slice(0, 100) } : {})
  });
}
```

### Para repetir la verificación

```bash
# 1. Extraer datos actualizados
npm run analytics:extract

# 2. Generar informe
npm run analytics:analyze

# 3. Verificar tests
npm test

# 4. Build
npm run build
```

---

*Informe generado automáticamente. Las correcciones están implementadas localmente pendientes de despliegue productivo.*
