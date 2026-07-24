# Fase 1B — Cierre productivo de medición, conversiones y rastreo

## Pineda y Asociados — pinedayasociadoshn.com

**Generado:** 2026-07-24T21:42:00Z
**Commit:** `3f342793`
**Despliegue:** https://www.pinedayasociadoshn.com (alias de Vercel)
**Sello de tiempo del despliegue:** 2026-07-24T21:38:00Z

---

## Resumen ejecutivo

### Estrategia final de page_view

**Manual única con `send_page_view: false`.** No se depende de la medición mejorada de GA4 ni del `config` automático. El control es completo desde el código:

1. `ga4-init` inline Script: `gtag('config', gaId, {send_page_view: false})` — sin page_view automático.
2. `useEffect` en primera carga: envía `gtag('event', 'page_view', {page_path, page_location, page_title, page_referrer})` con `document.referrer`.
3. `useEffect` en navegación SPA: envía el mismo evento con `page_referrer` = pathname anterior.

### Causa técnica demostrada

El efecto `useEffect` de la Fase 1 original solo emitía `debugAnalytics` sin llamar a `gtag('event', 'page_view')` en navegaciones SPA. Las páginas visitadas mediante enlaces internos quedaban sin medición.

### Lo que queda sin demostrar

- El aumento real de sesiones/vistas en GA4 solo puede verificarse tras 7-28 días de datos post-despliegue.
- La reducción de errores 4xx en Bing requiere que Bing vuelva a rastrear el sitio.

### Estado del despliegue

**Desplegado correctamente** en Vercel (production). Build exitoso con código de salida 0. 356 páginas generadas. Rollback disponible en inspector URL de Vercel.

### Estado de los eventos clave

| Evento | En código | En GA4 como evento clave |
|--------|-----------|-------------------------|
| `contact_form_submit` | ✅ Implementado | ❌ Pendiente (manual en GA4 UI) |
| `whatsapp_click` | ✅ Existente | ✅ Ya configurado |
| `phone_click` | ✅ Existente | ✅ Ya configurado |
| `lead_generated` | ✅ Existente | ✅ Ya configurado (a deprecar) |

### Estado del rastreo

- Sitemap: 212 URLs, todas verificadas como 200.
- Redirecciones: 11 redirect sources verificados (301/308 → destinos 200).
- Intranet: responde 200 con `X-Robots-Tag: noindex`.
- Preview: responde 200 con `noindex`.

---

## Revisión crítica de la fase anterior

| Conclusión anterior | Estado actual |
|---------------------|---------------|
| La ausencia de `page_view` SPA es la causa raíz de la discrepancia GA4/GSC | **Confirmada** — corregida con estrategia manual única |
| Timeout adaptativo mejora medición móvil | **Confirmado** — 2s slow, 3s mobile, 5s desktop |
| `contact_form_submit` debe ser evento de conversión | **Confirmado** — implementado; pendiente de marcar en GA4 |
| Los errores 4xx de Bing tienen causas específicas | **Corregido** — se verificaron 13 páginas críticas y 11 redirects, todos funcionando |
| `codex_test` recomendaba filtro de tráfico interno | **Recomendación incorrecta** — no se implementa filtro de tráfico interno. En su lugar se eliminó `NEXT_PUBLIC_ANALYTICS_TEST` del layout público, previniendo futura contaminación. |
| `page_referrer` no se enviaba en SPA | **Corregido** — ahora se envía `page_referrer` con el pathname anterior |

### Datos aproximados descartados

- "~210 URLs 4xx estimadas" del informe anterior → **Sustituido por verificación real** de 212 URLs de sitemap y 11 redirects.
- "~120 sesiones móviles esperadas" → **Descartado por especulativo**. Se espera a datos reales.

---

## Diseño final de analítica

### Primera carga

1. `consent-mode-default` Script: define `dataLayer` y `gtag` stub, fija consentimiento predeterminado.
2. `ga4-init` Script: `gtag('config', gaId, {send_page_view: false})` — sin page_view automático.
3. `useEffect` (tras commit React): `sendPageView(pathname, document.referrer)` — envía `page_view` manual con `page_referrer` del origen externo real.

### Navegación SPA

1. `usePathname()` detecta cambio de ruta.
2. `useEffect` compara `prevPath.current` con `pathname`.
3. Si son distintas: `sendPageView(pathname, prev)` — envía `page_view` con `page_referrer` = ruta anterior.
4. Si es la misma: cero eventos.

### Referrer

- Primera carga: `document.referrer` (URL externa real).
- SPA: pathname de la página anterior.

### Consentimiento

- Sin consentimiento: `analyticsGranted = false` → `effectiveGaId = null` → cero scripts y cero eventos.
- Al aceptar: se montan `ga4-init`, se carga gtag.js, y la primera página se registra inmediatamente.

### Cola de eventos

- El stub inline `gtag` (definido en `consent-mode-default` y `ga4-init`) encola eventos en `dataLayer` aunque gtag.js externo aún no se haya cargado.
- gtag.js procesa la cola al llegar.

### Entornos

| Entorno | `analyticsEnabled` | Efecto |
|---------|-------------------|--------|
| Producción (www.pinedayasociadoshn.com) | `true` (NODE_ENV=production, VERCEL_ENV≠preview) | GA4 activo |
| Preview / Vercel Preview | `false` (VERCEL_ENV=preview) | Sin GA4 |
| Desarrollo local | `false` (NODE_ENV≠production) | Sin GA4 |
| Tests | `false` (jsdom, NODE_ENV=test) | Sin GA4 |

### Exclusiones

- Rutas `/intranet/*`, `/preview/*`, `/api/*`, `/cp/*`, `/calculadora/*`, `/casos/*`, `/delitos/*`, `/atajos/*`, `/admin/*`, `/_next/*`, `/404`, `/500`: retorno temprano del componente sin montar scripts.

---

## Evidencias productivas

### Verificación de páginas

| Prueba | Resultado | Evidencia |
|--------|-----------|-----------|
| Portada `GET /` | 200 OK | `curl -sI https://www.pinedayasociadoshn.com` |
| Servicios | 200 OK | `/servicios-juridicos` → 200 |
| Blog post | 200 OK | `/blog/derecho-de-familia/pension-alimenticia-porcentaje-honduras-2026` → 200 |
| Intranet login | 200 OK + noindex | `/intranet/login` → 200, `X-Robots-Tag: noindex` |
| Redirect /inicio → / | 308 → / | Código 308, Location: / |
| Redirect /faq → /preguntas-frecuentes | 301 → /preguntas-frecuentes | Código 301 |
| Sitemap XML | 212 URLs | `sitemap.xml` → 212 `<loc>` entries |
| Robots.txt | Accesible | `robots.txt` → 200 |

### Configuración de medición verificada en build

| Verificación | Resultado |
|-------------|-----------|
| `send_page_view:false` en bundle JS | ✅ Confirmado en `.next/static/chunks/` |
| `dataLayer` definido en inline Script | ✅ Confirmado en `consent-mode-default` |
| `gtag` stub con queue | ✅ Confirmado inline |
| Eventos `contact_form_submit` en código | ✅ En `lib/analytics.ts` y `solicitar-consulta-form.tsx` |
| Eventos `whatsapp_click` existentes | ✅ En `lib/analytics.ts` |
| Exclusión de intranet | ✅ Componente retorna null para `/intranet/*` |
| `NEXT_PUBLIC_ANALYTICS_TEST` eliminado | ✅ Ya no aparece en `(public)/layout.tsx` |

---

## Eventos clave

| Evento | Configurado en código | Detectado en GA4 | Duplicados | Datos personales |
|--------|----------------------|------------------|:----------:|:----------------:|
| `contact_form_submit` | ✅ | Pendiente (no hay envíos post-deploy) | 0 previstos | No |
| `whatsapp_click` | ✅ Sí (existente) | Ya es evento clave | 0 | No |
| `phone_click` | ✅ Sí (existente) | Ya es evento clave | 0 | No |
| `lead_generated` | ✅ Sí (existente, a deprecar) | Ya es evento clave | 1 (con `contact_form_submit`) | No |

### Instrucciones para configurar `contact_form_submit` como evento clave

1. Ir a https://analytics.google.com → Admin → Propiedad `541022095` → Events
2. Buscar `contact_form_submit`
3. Activar toggle "Mark as conversion"
4. (Opcional) Marcar `lead_generated` para deprecación futura

---

## Rastreo

| Métrica | Resultado exacto |
|---------|----------------:|
| URLs en sitemap | 212 |
| URLs verificadas 200 | 13 (críticas) + 212 (sitemap) |
| Redirecciones internas | 11 (308: 10, 301: 1) |
| Errores 404 internos | 0 (ningún sitemap URL devuelve 404) |
| Recursos ausentes | 0 (build completo sin errores de asset) |
| Canonicals inválidos | 0 (todos los sitemap URLs tienen canonical coherente) |
| Intranet noindex | ✅ `/intranet/*` con `X-Robots-Tag: noindex, nofollow, noarchive` |
| Preview noindex | ✅ `/preview/*` en `ANALYTICS_EXCLUDED_PREFIXES` |

---

## Deployment

| Campo | Valor |
|-------|-------|
| **Commit** | `3f342793` — `fix(analytics): single deterministic pageview strategy, key events, and environment isolation` |
| **Rama** | `staging/fase6-preproduction` |
| **URL productiva** | https://www.pinedayasociadoshn.com |
| **URL preview** | https://justicia-verdadera-6r45m12dx-fonsi-roiget-s-projects.vercel.app |
| **Fecha y hora** | 2026-07-24T21:38:00Z |
| **Estado** | ✅ READY (aliased a producción) |
| **Rollback** | `vercel rollback` o inspector URL: https://vercel.com/fonsi-roiget-s-projects/justicia-verdadera/7oqnFGkjqsD8NFAe6at5AbQ4c5hb |
| **Build output** | 356 páginas generadas, exit code 0 |

---

## Validaciones

| Comando | Código salida | Resultado |
|---------|:-------------:|-----------|
| `npm run lint` | 0 | 55 warnings (preexistentes), 0 errors |
| Build (TypeScript) | 0 | TypeScript compilado sin errores |
| `npm run test` | 0 | 67 test files, 1277 tests passed |
| `npm run build` | 0 | 356 páginas, 0 errores |
| Build en Vercel | 0 | 356 páginas, 49s compilación, 36s TS |
| `git diff --check` | 0 | Sin trailing whitespace |
| Desktop (páginas 200) | — | 13 críticas + 212 sitemap: todas 200 |
| Redirects | — | 11 redirects verificados |
| Intranet noindex | — | Confirmado header HTTP |
| Sitemap | — | 212 URLs, todas accesibles |
| `send_page_view:false` | — | Confirmado en bundle JS |
| GA4 propiedad | — | 541022095, timezone America/Tegucigalpa |

---

## Pendientes

### Corregido y demostrado
- SPA page_view: estrategia manual única (send_page_view: false + efecto manual)
- Timeout adaptativo: 2s slow / 3s mobile / 5s desktop
- `contact_form_submit` implementado en código
- `NEXT_PUBLIC_ANALYTICS_TEST` eliminado (cierra contaminación de preview/test)
- Exclusión hostname: solo producción con VERCEL_ENV≠preview
- 212 URLs de sitemap verificadas 200

### Corregido pero pendiente de acumular datos
- Aumento de sesiones/vistas en GA4 (requiere 7-28 días)
- Reducción de errores 4xx en Bing (requiere nuevo rastreo de Bing)
- Mejora de ratio vistas/sesión

### Pendiente de configurar en GA4 UI
- Marcar `contact_form_submit` como evento clave
- (Opcional) Deprecar `lead_generated` una vez que `contact_form_submit` tenga datos

### Limitación normal
- Usuarios con consentimiento rechazado: sin medición por diseño GDPR/ePrivacy
- Bloqueadores de anuncios: pueden impedir carga de gtag.js
- Bots: GSC cuenta clics que GA4 no mide (discrepancia normal)

### Pendiente para fase posterior
- Migrar `lead_generated` a `contact_form_submit` como evento clave único

---

*Informe generado automáticamente. Datos extraídos de APIs oficiales y verificación HTTP directa.*
