# Plan de Mejoras — Panel de Analítica y SEO

## Dashboard `/intranet/admin/seo` para `pinedayasociadoshn.com`

**Versión:** 2.3 | **Fecha:** 13 junio 2026 | **Estado:** Plan actualizado — GSC operativo ✅, conversiones pendientes de verificar eventos 🔴

---

## Índice

1. [Resumen ejecutivo](#1-resumen-ejecutivo)
2. [Arquitectura actual](#2-arquitectura-actual)
3. [Estado de integraciones externas](#3-estado-de-integraciones-externas)
4. [Bloqueadores por fase](#4-bloqueadores-por-fase)
5. [Estrategia de implementación por carriles](#5-estrategia-de-implementación-por-carriles)
6. [Contratos de API](#6-contratos-de-api)
7. [Estrategia de caché](#7-estrategia-de-caché)
8. [Componentes del dashboard](#8-componentes-del-dashboard)
9. [Seguridad](#9-seguridad)
10. [Priorización MoSCoW](#10-priorización-moscow)
11. [Estimaciones](#11-estimaciones)
12. [Roadmap detallado](#12-roadmap-detallado)
13. [Criterios de aceptación](#13-criterios-de-aceptación)
14. [Checklist de validación pre-desarrollo](#14-checklist-de-validación-pre-desarrollo)
15. [Actualizaciones documentales requeridas](#15-actualizaciones-documentales-requeridas)

---

## 1. Resumen ejecutivo

### 1.1 Situación actual

El panel `/intranet/admin/seo` existe y muestra datos de GA4, Search Console, IndexNow y estado del sitio. Sin embargo carece de gráficos, tendencias, comparación con período anterior, exportación y estados de carga diferenciados.

### 1.2 Estado de la Fase 0 (auditoría)

Tras ejecutar la Fase 0 de auditoría, el estado real de las integraciones es mixto:

| Integración | Estado | Detalle |
|-------------|--------|---------|
| **GA4 Data API** | ✅ Operativa | OAuth 2.0 configurado. 38 usuarios activos, 72 sesiones, 1.382 páginas vistas en 28 días. |
| **Search Console API** | ✅ Operativa | OAuth con scope `webmasters.readonly`. 1 consulta detectada en 28 días. API funcional con datos reales. |
| **GA4 Frontend (gtag)** | 🟡 No verificado | CSP permite GTM, `lib/site.ts` tiene espacio para `NEXT_PUBLIC_GA_ID`. No se ha verificado que los eventos se reciban en producción. |
| **Eventos personalizados** | 🔴 No verificados | `whatsapp_click`, `phone_click`, `form_click`, `lead_generated` existen en `lib/analytics.ts`. No se ha confirmado su recepción en GA4. |
| **IndexNow** | ✅ Operativo | Configurado en postbuild. Clave verificada. |
| **Health check** | 🟡 No ejecutado | Requiere sesión admin autenticada en el panel. |
| **DNS TXT (GSC verification)** | ✅ Añadido | `google-site-verification=DzWyeKuME1pSzwjCuV4vkfZH80UMwULmyiQhg2qhhUE` en Vercel DNS. |
| **Variables de entorno Vercel** | ✅ Configuradas | `OAUTH_CLIENT_ID`, `OAUTH_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`, `GOOGLE_SEARCH_CONSOLE_SITE_URL`, `GOOGLE_ANALYTICS_PROPERTY_ID`. |

### 1.3 Conclusión

GSC ya está operativo tras obtener un nuevo refresh token con scope `webmasters.readonly`. Las conversiones siguen pendientes de verificar eventos en GA4. El plan se divide en: carril A (GA4, implementable ahora), carril B (GSC, desbloqueado ✅) y carril C (conversiones, condicionado 🔴).

---

## 2. Arquitectura actual

### 2.1 Stack técnico

| Componente | Tecnología | Estado |
|------------|-----------|--------|
| Frontend | Next.js 16 (App Router), React 19, Tailwind CSS v4 | ✅ |
| Autenticación admin | JWT + requireAdmin() | ✅ |
| Charts | Ninguno | A implementar |
| APIs Google | googleapis (node_modules) | ✅ Instalado |
| Autenticación Google | OAuth 2.0 via `google-auth-library` | ✅ Configurado |
| Despliegue | Vercel (serverless) | ✅ |
| Caché | Ninguna | A implementar |
| Exportación | Ninguna | A implementar |

### 2.2 APIs disponibles hoy

| Endpoint | Auth | Estado | Notas |
|----------|------|--------|-------|
| `GET /api/admin/analytics?days=N` | admin | ✅ GA4 OK | Responde con datos. |
| `GET /api/admin/search-console?days=N` | admin | ✅ GSC OK | Responde con datos. |
| `GET /api/admin/seo/summary` | admin | ✅ Parcial | GA4 OK, GSC OK. |
| `GET /api/admin/seo/health` | admin | 🟡 No verificado | Requiere sesión admin. |
| `GET /api/admin/seo/sitemap` | admin | ✅ | Responde con datos de DB. |
| `POST /api/admin/seo/inspect` | admin | ✅ Disponible | Funciona con GSC. |
| `POST /api/admin/seo/indexnow-submit` | admin | ✅ | Funcional. |

---

## 3. Estado de integraciones externas

### 3.1 GA4 Data API — ✅ Operativa

- OAuth 2.0 con scope `analytics.readonly` y `analytics.edit`.
- Refresh token almacenado en Vercel (`GOOGLE_REFRESH_TOKEN`).
- Datos verificados: 38 usuarios activos, 72 sesiones, 1.382 páginas vistas en 28 días.
- Datos diarios verificables mediante dimensión `date`.
- **No requiere ninguna acción externa.**

### 3.2 Search Console API — ✅ Operativa

- OAuth 2.0 con scope `webmasters.readonly` (refresh token actualizado con este scope).
- Datos verificados: 1 consulta detectada en 28 días ("despacho", 0 clics, 1 impresión).
- El DNS TXT record `google-site-verification=DzWyeKuME1pSzwjCuV4vkfZH80UMwULmyiQhg2qhhUE` está añadido en Vercel DNS.
- `GOOGLE_SEARCH_CONSOLE_SITE_URL=sc-domain:pinedayasociadoshn.com` configurado en Vercel.
- **No requiere acciones externas adicionales.** Los datos son limitados (sitio con poco tráfico orgánico) pero la API funciona correctamente.

### 3.3 Eventos GA4 personalizados — 🔴 No verificados

- `lib/analytics.ts` exporta: `trackWhatsAppClick()`, `trackPhoneClick()`, `trackFormClick()`, `trackLeadGenerated()`.
- Se desconoce si estos eventos están llegando a GA4.
- **Acción externa necesaria:** acceder a GA4 → Reports → Engagement → Events y buscar los eventos. Si no existen, el panel de conversiones mostrará estado informativo "Eventos no detectados".
- La Fase 3 (conversiones) no puede implementarse sin esta verificación.

### 3.4 IndexNow — ✅ Operativo

- Clave configurada en Vercel. Script postbuild funcional.
- Sin novedades.

### 3.5 GA4 Frontend (gtag) — 🟡 No verificado

- CSP incluye `googletagmanager.com`.
- `NEXT_PUBLIC_GA_ID` debería estar configurado en Vercel.
- No se ha confirmado que los eventos de `lib/analytics.ts` se estén enviando realmente desde producción.
- **Acción externa necesaria:** verificar en GA4 DebugView o Real-time report que los eventos llegan.

---

## 4. Bloqueadores por fase

| Fase | Bloqueador | Impacto | Acción requerida | Prioridad |
|------|-----------|---------|------------------|-----------|
| **Fase 1 (GA4-first)** | Ninguno | ✅ Puede implementarse | — | Inmediato |
| **Fase 1 (parte GSC)** | Ninguno (GSC operativo) | ✅ Puede implementarse | — | Inmediato |
| **Fase 2 (gráficos GA4)** | Ninguno | ✅ Puede implementarse | — | Inmediato |
| **Fase 2 (gráficos GSC)** | Ninguno (GSC operativo) | ✅ Puede implementarse | — | Inmediato |
| **Fase 3 (conversiones)** | Eventos GA4 no verificados | ❌ Bloqueado | Verificar eventos en GA4 UI | Alto |
| **Fase 4 (alertas GSC)** | Ninguno (GSC operativo) | ✅ Puede implementarse | — | Inmediato |
| **Fase 4 (alertas health/locales)** | Ninguno | ✅ Puede implementarse | — | Inmediato |
| **Fase 5 (optimización)** | Ninguno | ✅ Puede implementarse | — | Inmediato |

### 4.1 Dependencias para carril GA4-first (implementable ahora)

- `lib/google.ts` (ya existe, adaptar para OAuth)
- `google-auth-library` (ya instalada)
- Tipos compartidos, caché, endpoints timeline GA4
- Componentes UI, estados, gráficos GA4
- IntegrationStatusCard para GA4

### 4.2 Dependencias para carril GSC (desbloqueado ✅)

- Ninguna. GSC funciona correctamente con OAuth 2.0 + scope `webmasters.readonly`.
- Endpoints timeline GSC, gráficos GSC, tabla de queries implementables ahora.

### 4.3 Dependencias para carril conversiones (bloqueado)

- Verificar eventos GA4 en la UI de Analytics
- Si existen: endpoint conversions, panel de conversiones
- Si no existen: mostrar estado informativo sin bloquear el panel

---

## 5. Estrategia de implementación por carriles

```
CARRIL A — GA4 (implementable ahora)     CARRIL B — GSC (desbloqueado ✅)     CARRIL C — Conversiones (condicionado 🔴)
────────────────────────────────────     ────────────────────────────────     ────────────────────────────────────────
Fase 1: timeline GA4                    Fase 1: timeline GSC                 Fase 3: endpoint conversions           
Fase 2: gráficos GA4                    Fase 2: gráficos GSC, queries        Fase 3: panel de conversiones          
Fase 4: alerts health, CSV              Fase 4: alerts GSC                   Fase 3: url-analysis                   
Fase 5: optimización, docs                                                                                        
```

**MVP completo (carril A + B):** GA4 + GSC. ~40-50 horas.
**Alcance total (A + B + C):** GA4 + GSC + conversiones. ~50-70 horas.

---

## 6. Contratos de API

### 6.1 Estructura común de respuesta

Todos los endpoints del dashboard deben devolver esta estructura base:

```json
{
  "configured": true,
  "success": true,
  "status": "ok",
  "data": { ... },
  "lastUpdatedAt": "2026-06-13T12:00:00Z",
  "source": "cache",
  "warnings": []
}
```

**Campos:**
| Campo | Tipo | Valores | Obligatorio |
|-------|------|---------|-------------|
| `configured` | boolean | `true`, `false` | Sí |
| `success` | boolean | `true`, `false` | Sí |
| `status` | string | `ok`, `not_configured`, `permission_denied`, `no_data`, `partial`, `error` | Sí |
| `code` | string | Código máquina legible (ej: `gsc_permission_denied`) | Opcional |
| `message` | string | Mensaje humano legible | Sí si status ≠ ok |
| `data` | object | Datos de la respuesta | Sí si success=true |
| `lastUpdatedAt` | string | ISO 8601 | Recomendado |
| `source` | string | `cache`, `fresh` | Recomendado |
| `warnings` | string[] | Advertencias no bloqueantes | Opcional |

**Estados posibles:**
- `ok`: todo funciona, datos disponibles.
- `not_configured`: la integración no está configurada (faltan env vars).
- `permission_denied`: la integración está configurada pero no tiene permisos.
- `no_data`: la integración funciona pero no hay datos para el período solicitado.
- `partial`: algunos datos disponibles, otros no.
- `error`: error inesperado del servidor.

### 6.2 `GET /api/admin/analytics/timeline?days=7|28|90`

**Carril A — implementable ahora.** Funciona sin GSC.

```json
{
  "configured": true,
  "success": true,
  "status": "ok",
  "data": [
    { "date": "2025-06-13", "activeUsers": 2, "sessions": 4, "screenPageViews": 10, "newUsers": 1 }
  ],
  "totals": { "activeUsers": 38, "sessions": 72, "screenPageViews": 1382, "newUsers": 38 },
  "previousPeriod": {
    "totals": { "activeUsers": 30, "sessions": 60, "screenPageViews": 1200, "newUsers": 28 },
    "changes": { "activeUsers": 26.7, "sessions": 20, "screenPageViews": 15.2, "newUsers": 35.7 }
  },
  "deviceBreakdown": [
    { "device": "mobile", "users": 25 },
    { "device": "desktop", "users": 10 },
    { "device": "tablet", "users": 3 }
  ],
  "sourceBreakdown": [
    { "source": "direct", "sessions": 30 },
    { "source": "organic", "sessions": 25 },
    { "source": "social", "sessions": 10 },
    { "source": "referral", "sessions": 7 }
  ],
  "lastUpdatedAt": "2026-06-13T12:00:00Z",
  "source": "fresh"
}
```

**Si GA4 no está configurado:**
```json
{ "configured": false, "success": false, "status": "not_configured", "message": "GA4 no configurado. Verificar OAUTH_CLIENT_ID, OAUTH_CLIENT_SECRET y GOOGLE_REFRESH_TOKEN en Vercel." }
```

### 6.3 `GET /api/admin/search-console/timeline?days=7|28|90`

**Carril B — desbloqueado.**

```json
{
  "configured": true,
  "success": true,
  "status": "ok",
  "data": [
    { "date": "2026-06-13", "clicks": 0, "impressions": 5, "ctr": 0, "position": 12.5 }
  ],
  "totals": { "clicks": 1, "impressions": 1, "ctr": 0, "position": 25 },
  "previousPeriod": {
    "totals": { "clicks": 0, "impressions": 0, "ctr": 0, "position": 0 },
    "changes": { "clicks": null, "impressions": null, "ctr": null, "position": null }
  },
  "topQueries": [
    { "query": "despacho", "clicks": 0, "impressions": 1, "ctr": 0, "position": 25 }
  ],
  "lastUpdatedAt": "2026-06-13T12:00:00Z",
  "source": "cache"
}
```

**Si GSC no tiene permisos (por si vuelve a ocurrir):**
```json
{ "configured": true, "success": false, "status": "permission_denied", "message": "Sin permisos en Google Search Console. Verificar refresh token en Vercel (debe incluir scope webmasters.readonly).", "code": "gsc_permission_denied" }
```

**Sin datos:****
```json
{ "configured": true, "success": true, "status": "no_data", "message": "No hay datos de Search Console para los últimos 28 días. El sitio ha sido indexado recientemente y tiene poco tráfico.", "data": [], "warnings": ["Sitio con poco tráfico orgánico"] }
```

### 6.4 `GET /api/admin/conversions?days=7|28|90`

**Carril B — condicionado a verificación de eventos GA4.**

```json
{
  "configured": true,
  "success": true,
  "status": "ok",
  "eventsFound": true,
  "total": 5,
  "bySource": { "whatsapp_click": 3, "phone_click": 1, "form_click": 1 },
  "timeline": [
    { "date": "2026-06-10", "leads": 1 },
    { "date": "2026-06-12", "leads": 2 }
  ],
  "byUrl": [
    { "url": "/abogado-penalista-choluteca", "leads": 2, "sources": { "whatsapp_click": 2 } },
    { "url": "/divorcio-choluteca", "leads": 1, "sources": { "form_click": 1 } }
  ],
  "lastUpdatedAt": "2026-06-13T12:00:00Z"
}
```

**Si eventos no verificados:** _"Eventos de conversión no verificados. Acceda a GA4 → Reports → Engagement → Events y confirme que `whatsapp_click`, `phone_click`, `form_click` existen."_

**Si eventos existen pero sin leads:** `"status": "no_data"`, `"message": "No se detectaron leads en los últimos 30 días."`

### 6.5 `POST /api/admin/url-analysis`

**Carril A + B — respuesta parcial permitida.**

Request:
```json
{ "url": "https://www.pinedayasociadoshn.com/abogado-penalista-choluteca" }
```

Response típica con GSC bloqueado:
```json
{
  "success": true,
  "url": "https://www.pinedayasociadoshn.com/abogado-penalista-choluteca",
  "indexation": {
    "configured": true,
    "status": "permission_denied",
    "message": "Search Console sin permisos. La inspección de URL no está disponible."
  },
  "analytics": {
    "configured": true,
    "hasData": false,
    "message": "No hay datos de GA4 suficientes para esta URL en los últimos 28 días.",
    "pageViews": null,
    "users": null
  },
  "warnings": ["URL con poco tráfico. Los datos de GA4 pueden tardar en acumularse."]
}
```

**Validación de URL (seguridad):**
- Solo permitir: `https://www.pinedayasociadoshn.com/...` o `https://pinedayasociadoshn.com/...`
- Rechazar: localhost, 127.0.0.1, IPs, otros dominios, protocolos no HTTPS.
- Sanitizar: eliminar parámetros `?`, fragmentos `#` y payloads sospechosos (SQLi, XSS).

### 6.6 `GET /api/admin/alerts`

**Carril A — implementable ahora (solo health/locales). Carril B — condicionado a GSC.**

Alertas implementables sin GSC:
- Health checks (GA4, IndexNow, robots.txt, sitemap, JSON-LD)
- URLs en sitemap no indexadas (si GSC está disponible)
- Sin datos en GA4 en últimos 7 días

### 6.7 `POST /api/admin/cache/revalidate`

**Nuevo endpoint protegido.** Requiere `requireAdmin()`.

Request:
```json
{ "tags": ["analytics", "gsc", "health", "sitemap"] }
```

Llama a `revalidateTag(tag)` para cada tag. Esto permite al botón "Forzar actualización" del frontend refrescar los datos.

---

## 7. Estrategia de caché

### 7.1 El problema

Vercel serverless no garantiza persistencia entre requests. `Map` en memoria no es fiable en producción.

### 7.2 Solución para el MVP

**Usar `unstable_cache` de Next.js** para cachear resultados de funciones async que consultan Google APIs.

```typescript
// Ejemplo estructural (no implementación final)
import { unstable_cache } from 'next/cache';

const getCachedAnalytics = unstable_cache(
  async (days: number) => {
    // Llamada real a GA4 Data API
    return await fetchAnalyticsFromGoogle(days);
  },
  ['analytics'], // clave de cache
  { tags: ['analytics'], revalidate: 600 } // 10 min TTL
);
```

**Nota importante:** `unstable_cache` cachea el valor de retorno de la función, no la respuesta HTTP. Funciona envolviendo funciones de acceso a datos. No es un Map global.

### 7.3 Tags de revalidación

| Tag | Endpoints | TTL sugerido |
|-----|-----------|-------------|
| `analytics` | timeline GA4, analytics agregado | 10 min |
| `gsc` | timeline GSC, search-console agregado | 15 min |
| `conversions` | conversions | 10 min |
| `health` | health check | 1 min |
| `sitemap` | sitemap | 1 min |
| `url-inspection` | inspect | 5 min |

### 7.4 Forzar actualización

El frontend tendrá un botón "Forzar actualización" que llama a:
`POST /api/admin/cache/revalidate` con los tags correspondientes.
Este endpoint debe estar protegido por `requireAdmin()`.

### 7.5 Caché en desarrollo

Durante desarrollo local, un `Map` en memoria con TTL es aceptable ya que el servidor Next.js se ejecuta en un solo proceso. No usar en producción.

### 7.6 Futuro: Redis/Upstash

Si el caché con `unstable_cache` resulta insuficiente (por ejemplo, en rutas edge), migrar a Upstash Redis. No es requisito del MVP.

---

## 8. Componentes del dashboard

### 8.1 Componentes a crear

```
components/admin/
├── metric-card.tsx              # Card con valor + tendencia
├── trend-badge.tsx              # Badge ↑/↓/→ con color
├── chart-card.tsx               # Card contenedora + título + estado
├── base-line-chart.tsx          # Recharts LineChart
├── base-bar-chart.tsx           # Recharts BarChart
├── base-donut-chart.tsx         # Recharts PieChart
├── data-table.tsx               # Tabla con paginación + CSV
├── integration-status-card.tsx  # Estado de GA4/GSC/IndexNow (nuevo)
├── permission-state.tsx         # Estado de permiso denegado (nuevo)
├── empty-state.tsx              # Estado vacío + error
├── loading-skeleton.tsx         # Skeleton genérico
└── date-range-selector.tsx      # Presets 7/28/90 días
```

### 8.2 Estados que cada componente debe manejar

| Estado | Apariencia | Cuándo |
|--------|-----------|--------|
| `loading` | Skeleton animado | Datos cargando |
| `success` | Datos normales | API responde ok |
| `empty` | "No hay datos" | API responde con status=no_data |
| `permission_denied` | "Sin permisos + instrucciones" | API responde con status=permission_denied |
| `not_configured` | "No configurado" | API responde con configured=false |
| `error` | "Error inesperado + botón reintentar" | API responde con status=error |

---

## 9. Seguridad

### 9.1 Secrets y tokens

**⚠️ ADVERTENCIA: nunca documentar secrets reales.**

- No incluir `GOOGLE_REFRESH_TOKEN`, `OAUTH_CLIENT_SECRET`, `JWT_SECRET` ni ningún otro secreto en `analisisdedatos.md`, `README.md`, `CHANGELOG.md`, `docs/`, issues, commits ni logs.
- Usar placeholders: `<GOOGLE_REFRESH_TOKEN>`, `<OAUTH_CLIENT_SECRET>`.
- Los secrets se almacenan exclusivamente en Vercel Environment Variables (producción) y `.env.local` (gitignorado).

### 9.2 Autenticación admin

Todos los endpoints nuevos del dashboard deben exigir autenticación admin mediante `requireAdmin()` del middleware existente.

### 9.3 Validación de URL en `url-analysis`

- Solo aceptar URLs que coincidan con: `https://(www\.)?pinedayasociadoshn\.com/.*`
- Rechazar: localhost, IPs, otros dominios, protocolos no HTTPS, payloads con SQLi/XSS.
- Sanitizar: eliminar fragmentos `#`, parámetros `?`, y decodificar antes de usar.

---

## 10. Priorización MoSCoW

### 10.1 Must Have — Inmediato (carril A)

- [ ] Endpoint `GET /api/admin/analytics/timeline?days=7|28|90` con caché
- [ ] Comparación período anterior en analytics
- [ ] Tipos compartidos (`lib/types/admin-dashboard.ts`)
- [ ] Estructura común de respuesta con estados `configured/success/status`
- [ ] Caché con `unstable_cache` y tags
- [ ] Endpoint `POST /api/admin/cache/revalidate` protegido
- [ ] Pestaña Resumen con MetricCards de GA4
- [ ] Gráfico de línea de usuarios/sesiones (GA4)
- [ ] Selector de período 7/28/90 días
- [ ] IntegrationStatusCard para GA4
- [ ] Estados loading → success → empty → permission_denied → error
- [ ] Componente EmptyState, LoadingSkeleton, PermissionState
- [ ] Exportación CSV básica
- [ ] Alertas health/locales
- [ ] Build: `npm run build` sin errores
- [ ] Documentación mínima del dashboard

### 10.2 Must Have — Desbloqueado (carril B, GSC operativo ✅)

- [ ] `GET /api/admin/search-console/timeline?days=7|28|90`
- [ ] Gráfico de línea clics/impresiones GSC
- [ ] Tabla de top 20 queries GSC con ∆posición
- [ ] IntegrationStatusCard para GSC

### 10.3 Should Have — Condicionado (carril C, cuando eventos GA4 estén verificados)

- [ ] `GET /api/admin/conversions?days=30`
- [ ] Panel de conversiones en pestaña Resumen
- [ ] `POST /api/admin/url-analysis` con respuesta parcial
- [ ] Rich results en inspector de URL

### 10.4 Could Have

- [ ] Seguimiento de keywords locales con GSC
- [ ] Botón "Forzar actualización" por sección
- [ ] Badge "última actualización" en cada sección
- [ ] Lazy loading de Recharts

### 10.5 Won't Have (MVP)

- PDF con gráficos
- Calendario personalizado
- Gráficos de dispersión, heatmaps
- Comparativas semanales agrupadas
- Alertas por email
- Dashboards drag-and-drop
- Predicción IA
- Base de datos propia para histórico

---

## 11. Estimaciones

| Fase | Carril | Implementable | Desarrollo | QA | Docs | Total |
|------|--------|--------------|-----------|-----|------|-------|
| Fase 1 GA4 | A | ✅ Ahora | 5h | 2h | 1h | **8h** |
| Fase 1 GSC | B | ✅ Ahora | 3h | 1h | 0.5h | **4.5h** |
| Fase 2 GA4 | A | ✅ Ahora | 8h | 3h | 1h | **12h** |
| Fase 2 GSC | B | ✅ Ahora | 4h | 1.5h | 0.5h | **6h** |
| Fase 3 | C | ❌ Bloqueada | 8h | 3h | 1h | **(12h)** |
| Fase 4 (health/locales) | A | ✅ Ahora | 3h | 1h | 0.5h | **4.5h** |
| Fase 4 (GSC alerts) | B | ✅ Ahora | 2h | 1h | 0.5h | **3.5h** |
| Fase 5 | A+B+C | ✅ Ahora | 4h | 2h | 2h | **8h** |
| **MVP completo (A+B)** | **A+B** | **✅** | **29h** | **11.5h** | **6h** | **~46h** |
| **Alcance total (A+B+C)** | **A+B+C** | **Parcial** | **37h** | **14.5h** | **7h** | **~58h** |

**MVP completo (carril A + B, con GSC desbloqueado):** ~40-50 horas de implementación + QA + deploy.
**Alcance total (carril A + B + C, cuando eventos estén verificados):** ~50-70 horas.

---

## 12. Roadmap detallado

### 12.1 Día 1-3: Carril A — Fundación GA4 (Fase 1 GA4 + tipos + caché)

| Tarea | Dependencias | Esfuerzo |
|-------|-------------|----------|
| Endpoint timeline GA4 con caché y `previousPeriod` | — | 4h |
| Estructura común de respuesta con estados | — | 1h |
| Tipos compartidos (`lib/types/admin-dashboard.ts`) | — | 1h |
| Caché con `unstable_cache` y tags | — | 2h |
| Endpoint `POST /api/admin/cache/revalidate` | caché lista | 1h |
| Adaptar endpoint analytics existente para usar OAuth | — | 2h |

### 12.2 Día 4-8: Carril A — Visualizaciones GA4 (Fase 2 GA4)

| Tarea | Dependencias | Esfuerzo |
|-------|-------------|----------|
| Instalar Recharts | — | 0.5h |
| MetricCard, TrendBadge | tipos listos | 2h |
| BaseLineChart, BaseBarChart, BaseDonutChart | Recharts instalado | 3h |
| ChartCard, IntegrationStatusCard | — | 2h |
| Pestaña Resumen: gráficos GA4 | timeline listo | 3h |
| Pestaña Analytics: línea usuarios/sesiones | timeline listo | 2h |
| Selector de período 7/28/90 | — | 1h |
| Estados loading/success/empty/permission_denied/error | — | 2h |
| DataTable con CSV export | — | 2h |

### 12.3 Día 9-10: Carril A — Alertas health + optimización (Fase 4 parcial + Fase 5)

| Tarea | Dependencias | Esfuerzo |
|-------|-------------|----------|
| Alertas health/locales | health check existente | 2h |
| Lazy loading de Recharts | — | 0.5h |
| Skeleton loaders | — | 1h |
| Documentación técnica | — | 2h |
| Build, deploy, verificación | — | 2h |

### 12.4 Carril B — GSC (desbloqueado ✅)

| Tarea | Dependencias | Esfuerzo |
|-------|-------------|----------|
| Endpoint timeline GSC | — | 3h |
| Gráfico de línea clics/impresiones | timeline GSC listo | 2h |
| Tabla de top 20 queries | timeline GSC listo | 2h |
| IntegrationStatusCard GSC | — | 1h |
| Alertas GSC | — | 2h |

### 12.5 Carril C — Conversiones (cuando eventos estén verificados)

| Tarea | Dependencias | Esfuerzo |
|-------|-------------|----------|
| Endpoint conversions | eventos GA4 OK | 3h |
| Panel de conversiones en UI | endpoint listo | 2h |
| URL analysis | — | 3h |
| Rich results en inspector | — | 1h |

---

## 13. Criterios de aceptación

### 13.1 Fase 1 (GA4-first)

- [ ] `GET /api/admin/analytics/timeline?days=28` devuelve datos día a día con `source: "cache"` o `"fresh"`
- [ ] Incluye `previousPeriod` con cambios porcentuales
- [ ] Sin GSC configurado: devuelve `permission_denied` en lugar de error 500
- [ ] Caché: segunda request responde con `source: "cache"`
- [ ] `POST /api/admin/cache/revalidate` protegido por `requireAdmin()`
- [ ] `npm run build` sin errores

### 13.2 Fase 2 (GA4-first)

- [ ] Pestaña Resumen muestra MetricCards con datos GA4
- [ ] Gráfico de línea usuarios/sesiones funcionando
- [ ] Estado `permission_denied` para GSC no rompe la UI
- [ ] Estado `empty`/`no_data` se muestra como EmptyState
- [ ] Selector 7/28/90 refresca datos de todas las pestañas
- [ ] CSV descargable desde DataTable
- [ ] Build sin errores

### 13.3 Fase 3 (condicionada a eventos GA4)

- [ ] Si eventos no existen: UI muestra mensaje informativo
- [ ] Si eventos existen: panel de conversiones muestra leads por fuente y URL
- [ ] `url-analysis` maneja respuestas parciales (GA4 sin datos, GSC bloqueado, etc.)
- [ ] Rich results visibles

### 13.4 Fase 4

- [ ] Panel de alertas muestra health checks funcionando
- [ ] Alertas GSC bloqueadas: no rompen el panel
- [ ] CSV exportable desde cada tabla

### 13.5 Fase 5

- [ ] Lazy loading verificado en Network tab
- [ ] Documentación técnica creada en `docs/admin-seo-dashboard.md`
- [ ] `README.md` y `CHANGELOG.md` actualizados

---

## 14. Checklist de validación pre-desarrollo

### 14.1 Datos

- [ ] GA4 Data API responde con `activeUsers > 0` para 28 días → ✅ Verificado (38 usuarios)
- [ ] Search Console API responde → ✅ Verificado (1 consulta en 28 días)
- [ ] Eventos GA4 verificados → 🔴 Pendiente
- [ ] URLs con suficiente tráfico identificadas → 🔴 Pendiente

### 14.2 Infraestructura

- [ ] Variables de entorno configuradas en Vercel → ✅ 5 variables
- [ ] OAuth 2.0 funcional → ✅ Refresh token con scopes analytics + webmasters
- [ ] Health check ejecutable desde panel admin → 🟡 Pendiente de verificación

### 14.3 Dependencias

- [ ] `unstable_cache` testeado en entorno Vercel → 🟡 Se verificará en deploy
- [ ] Recharts compatible con Tailwind v4 → ✅ Probado en otros proyectos
- [ ] Integración parcial (GSC bloqueado) no rompe UI → 🟡 Se verificará en QA

---

## 15. Actualizaciones documentales requeridas

Cuando se implemente el plan, actualizar:

| Archivo | Cuándo | Cambio requerido |
|---------|--------|-----------------|
| `README.md` | Al completar MVP GA4-first | Añadir sección "Dashboard de Analítica SEO" |
| `CHANGELOG.md` | Por cada fase | Registrar fecha, archivos, cambios y validación |
| `docs/admin-seo-dashboard.md` | Al completar MVP GA4-first | **Nuevo**: documentación técnica completa |
| `AGENTS.md` | Solo si cambia arquitectura o dependencias | Actualizar si se añade Redis, nueva API, etc. |

**⚠️ No documentar secrets reales en ninguno de estos archivos.** Usar siempre placeholders.

---

*Documento generado el 13 de junio de 2026. Versión 2.2 — Plan corregido para implementación por carriles. Próxima revisión: al completar MVP GA4-first o al desbloquear GSC/eventos.*
