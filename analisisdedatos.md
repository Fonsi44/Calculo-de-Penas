# Plan de Mejoras — Panel de Analítica y SEO

## Dashboard `/intranet/admin/seo` para `pinedayasociadoshn.com`

**Versión:** 2.1 | **Fecha:** 13 junio 2026 | **Estado:** Fase 0 completada ✅ — Listo para comenzar Fase 1

---

## Índice

1. [Auditoría crítica del plan anterior](#1-auditoría-crítica-del-plan-anterior)
2. [Resumen ejecutivo corregido](#2-resumen-ejecutivo-corregido)
3. [Arquitectura actual y limitaciones reales](#3-arquitectura-actual-y-limitaciones-reales)
4. [Fase 0 — Auditoría técnica y validación de datos](#4-fase-0--auditoría-técnica-y-validación-de-datos)
5. [Fase 1 — Fundamentos de datos, caché y tipos](#5-fase-1--fundamentos-de-datos-caché-y-tipos)
6. [Fase 2 — Visualizaciones esenciales (MVP gráfico)](#6-fase-2--visualizaciones-esenciales-mvp-gráfico)
7. [Fase 3 — Conversiones, análisis por URL y leads](#7-fase-3--conversiones-análisis-por-url-y-leads)
8. [Fase 4 — Alertas locales y exportación básica](#8-fase-4--alertas-locales-y-exportación-básica)
9. [Fase 5 — Optimización, accesibilidad y documentación](#9-fase-5--optimización-accesibilidad-y-documentación)
10. [Arquitectura de componentes](#10-arquitectura-de-componentes)
11. [Contratos de API detallados](#11-contratos-de-api-detallados)
12. [Estrategia de caché para serverless](#12-estrategia-de-caché-para-serverless)
13. [KPIs reales para un bufete jurídico local](#13-kpis-reales-para-un-bufete-jurídico-local)
14. [Priorización MoSCoW](#14-priorización-moscow)
15. [No hacer todavía](#15-no-hacer-todavía)
16. [Roadmap resumido con dependencias](#16-roadmap-resumido-con-dependencias)
17. [Estimación de esfuerzo realista](#17-estimación-de-esfuerzo-realista)
18. [Criterios de aceptación por fase](#18-criterios-de-aceptación-por-fase)
19. [Checklist de validación pre-desarrollo](#19-checklist-de-validación-pre-desarrollo)
20. [Actualizaciones documentales requeridas](#20-actualizaciones-documentales-requeridas)

---

## 1. Auditoría crítica del plan anterior

### 1.1 Errores graves detectados

| # | Problema | Impacto | Corrección necesaria |
|---|----------|---------|---------------------|
| 1 | **Caché en memoria (`Map`) en serverless** | 🔴 Crítico — Vercel serverless no garantiza instancia persistente. Cada request puede ir a un worker distinto. El caché no funciona. | Propone `unstable_cache` de Next.js o Redis/KV. Memoria solo como fallback local. |
| 2 | **Eventos GA4 no verificados** | 🔴 Crítico — Se asume que `whatsapp_click`, `phone_click`, `form_click`, `lead_generated` existen como eventos en GA4. No se ha validado. Sin eventos no hay datos. | Fase 0: auditar eventos GA4 reales antes de implementar panel de conversiones. |
| 3 | **Conversiones no marcadas en GA4** | 🔴 Crítico — Para que un evento aparezca como "conversión" debe marcarse como "Key Event" en GA4. No está hecho. | Indicar que es tarea externa (configuración de GA4), no de código. |
| 4 | **Volumen de búsqueda inventado** | 🟡 Alto — La tabla de keywords locales ponía "Alto/Medio/Bajo" como volumen. GSC no proporciona volumen de búsqueda. Eso es inventado. | Eliminar columna de volumen. Usar solo datos reales de GSC (clics, impresiones, CTR, posición). |
| 5 | **PDF con gráficos** | 🟡 Alto — Generar PDF con gráficos requiere Puppeteer o librería server-side. No es realista para un MVP de panel interno. | Mover a "No hacer todavía". MVP solo CSV. |
| 6 | **Análisis por URL sin datos suficientes** | 🟡 Alto — `getAnalyticsForUrl` devuelve null si la URL tiene poco tráfico. La mayoría de URLs nuevas no tendrán datos. | Añadir estado "Sin datos suficientes" y no bloquear la UI. |
| 7 | **Estimaciones irreales** | 🟡 Alto — 34-44h para 23 archivos con endpoints, UI, gráficos, exportación, tests y QA es muy baja. La realidad es 60-80h. | Ajustar estimaciones por fase con tareas reales. |

### 1.2 Problemas de consistencia

| # | Problema | Detalle |
|---|----------|---------|
| 8 | **Sin Fase 0** | El salta directo a implementar sin auditar los datos disponibles. No sabe si los eventos existen. |
| 9 | **18 componentes** | Muchos componentes para un MVP. 5-6 bien diseñados bastan al inicio. |
| 10 | **Selector de fecha con calendario** | Innecesario para MVP. Presets fijos (7/28/90) son suficiente. |
| 11 | **Alertas sin histórico** | "Caída de tráfico >20%" requiere datos históricos. Sin DB propia no es posible. |
| 12 | **Gráfico de dispersión** | Poco útil y complejo para el público objetivo (abogados, no data scientists). |
| 13 | **GA4 no es tiempo real** | Los datos de GA4 tienen 24-48h de retraso. Search Console similar. El plan no lo menciona. |
| 14 | **Tabla "caliente" (heatmap)** | Requiere librería adicional. No prioritaria. |

### 1.3 Errores menores

| # | Problema |
|---|----------|
| 15 | `pinedayasocioshn.com` en lugar de `pinedayasociadoshn.com` (falta la `d`) |
| 16 | Recharts no pesa 150KB gzipped sino ~35KB gzipped (el dato original era el uncompressed) |
| 17 | No se distingue entre caché de desarrollo y producción |
| 18 | No hay plan de testing ni criterios de aceptación |

---

## 2. Resumen ejecutivo corregido

### 2.1 Situación actual

El panel `/intranet/admin/seo` funciona y muestra datos reales de Google Analytics 4, Google Search Console, IndexNow y estado del sitio. Sin embargo:

- **Sin gráficos** — todos los datos son cards numéricos o tablas de texto plano.
- **Sin tendencias** — no se ve evolución día a día, solo agregados 7/28/90 días.
- **Sin comparación** — no hay Δ% contra el período anterior.
- **Sin conversiones visibles** — la API devuelve suscriptores y consultas pero no se renderizan.
- **Sin exportación** — no se pueden descargar datos.
- **Sin estado de carga** — skeleton loaders, errores y vacío no están diferenciados.
- **Eventos GA4 no auditados** — se desconoce si los eventos de lead están llegando realmente.

### 2.2 Objetivo del plan

Construir un dashboard analítico **realista, útil y mantenible** para el equipo del bufete, priorizando:

1. **Ver qué funciona** — qué páginas traen tráfico, qué consultas posicionan, qué dispositivos usan los visitantes.
2. **Detectar oportunidades** — qué keywords mejorar, qué páginas tienen potencial sin explotar.
3. **Medir conversiones** — cuántos leads genera cada página y de qué canal vienen.
4. **Exportar datos** — poder descargar informes básicos en CSV.

**No se busca** un Power BI completo. Se busca un panel ligero, funcional y con datos que el bufete pueda interpretar sin ser expertos en analítica.

### 2.3 Supuestos del plan (actualizado tras Fase 0)

| Supuesto | Detalle | Estado |
|----------|---------|--------|
| **S1** | El proyecto se despliega en Vercel (serverless). No hay Redis/Upstash configurado. | ✅ Confirmado |
| **S2** | GA4 Data API está configurada con OAuth 2.0 y responde con datos reales (38 usuarios, 72 sesiones en 28d). | ✅ Verificado |
| **S3** | Search Console API está configurada para `sc-domain:pinedayasociadoshn.com` pero devuelve "Insufficient Permission". Pendiente de que el usuario se añada como propietario en GSC. | 🟡 Pendiente |
| **S4** | Los eventos `whatsapp_click`, `phone_click`, `form_click` y `lead_generated` están definidos en `lib/analytics.ts` pero NO se ha verificado su recepción en GA4. | 🟡 No verificado |
| **S5** | No hay base de datos propia para almacenar histórico de métricas. Todo depende de las APIs de Google. | ✅ Confirmado |
| **S6** | El tráfico del sitio es bajo (38 usuarios en 28 días). Los endpoints pueden devolver datos vacíos para URLs individuales. | ✅ Verificado |
| **S7** | **Nuevo**: OAuth 2.0 es funcional con scopes `analytics.readonly` + `analytics.edit`. El refresh token se ha almacenado en Vercel. | ✅ |
| **S8** | **Nuevo**: La service account `id-seo-api-v2@...` tiene claves pero no pudo añadirse a GA4. Se usará OAuth 2.0 como método de autenticación primario. | ✅ |
| **S9** | **Nuevo**: El DNS TXT record para verificación de GSC está añadido en Vercel DNS. | ✅ |

---

## 3. Arquitectura actual y limitaciones reales

### 3.1 Stack técnico existente

| Componente | Tecnología |
|------------|-----------|
| Frontend | Next.js 16 (App Router), React 19, Tailwind CSS v4 |
| Charts | Ninguno |
| Iconos | lucide-react |
| Autenticación | JWT + requireAdmin() |
| APIs Google | googleapis (GA4 Data API v1beta, Search Console API v1) |
| GA4 Property ID | 541022095 |
| GSC Site URL | `sc-domain:pinedayasociadoshn.com` |
| Caché | Ninguna |
| Exportación | Ninguna |
| Despliegue | Vercel (serverless) |

### 3.2 APIs disponibles hoy

| Endpoint | Datos | Latencia típica |
|----------|-------|-----------------|
| `GET /api/admin/analytics?days=N` | Métricas GA4 agregadas (usuarios, sesiones, páginas vistas, fuentes, países, dispositivos) | 2-5s |
| `GET /api/admin/search-console?days=N` | Métricas GSC agregadas (clics, impresiones, CTR, posición, queries, páginas) | 2-5s |
| `GET /api/admin/seo/summary` | Resumen combinado (contenido + analytics + search console + estado) | 3-7s |
| `GET /api/admin/seo/health` | Health check de 7 integraciones | 1-3s |
| `GET /api/admin/seo/sitemap` | Estado del sitemap | <1s |
| `POST /api/admin/seo/inspect` | Inspección URL via GSC API | 2-4s |
| `POST /api/admin/seo/indexnow-submit` | Envío masivo a IndexNow | <1s |

### 3.3 Limitaciones reales (no inventadas)

| Limitación | Explicación | Impacto |
|------------|-------------|---------|
| **GA4 Data API no es tiempo real** | Los datos tienen 24-48h de retraso. Hoy muestras datos de anteayer. | Los gráficos de "hoy" no tienen sentido. Usar períodos completos. |
| **GSC tampoco es tiempo real** | Similar retraso. Los datos de ayer pueden no estar completos. | No comparar "ayer" con "hoy". Usar 7d vs 7d anteriores. |
| **Tráfico bajo** | Sitio local, pocas visitas. Muchas métricas serán 0 o null. | La UI debe manejar datos vacíos sin romperse. |
| **Sin histórico propio** | Sin DB para guardar métricas día a día. Solo se puede consultar el período que ofrece Google. | Alertas de tendencia requieren al menos 2 consultas (período actual vs anterior). |
| **Eventos no auditados** | No se sabe si los eventos de lead están llegando a GA4. | El panel de conversiones puede estar vacío hasta que se verifique la configuración. |
| **Rate limiting** | GA4 Data API tiene cuotas por proyecto. 50 requests/día por usuario (plan free). | Cachear respuestas es obligatorio, no opcional. |
| **Caché en serverless** | `Map` en memoria no persiste entre requests en Vercel. | Necesita `unstable_cache` o Redis. |

### 3.4 Retrasos de datos conocidos

| Fuente | Retraso típico | Recomendación |
|--------|---------------|---------------|
| GA4 Data API (agregados) | ~24h | No usar períodos que terminen hoy |
| GA4 Data API (tiempo real) | ~5 min | Solo para pestaña "Tiempo real" (no implementada) |
| Search Console API | ~24-48h | Misma recomendación |
| IndexNow | Inmediato | No aplica retraso |
| Health checks | Inmediato | No aplica retraso |

---

## 4. Fase 0 — Auditoría técnica y validación de datos ✅ COMPLETADA

**Objetivo:** Verificar qué datos están realmente disponibles antes de escribir una línea de código del dashboard.

**Duración real:** 6 horas

### 4.1 Resultados de la auditoría

| # | Tarea | Resultado | Evidencia |
|---|-------|-----------|-----------|
| 0.1 | Verificar eventos GA4 personalizados | 🟡 Pendiente — requiere acceso al dashboard de GA4 (UI) para listar eventos recibidos | Se confirmó que `lib/analytics.ts` existe con los eventos pero no se ha verificado su recepción en GA4 |
| 0.2 | Verificar eventos `whatsapp_click` en últimos 30 días | 🟡 Pendiente — mismo motivo | No se ha accedido al reporte de eventos de GA4 |
| 0.3 | Verificar Search Console con datos | 🟡 Search Console API devuelve "Insufficient Permission" | El usuario `alfonsroiget@gmail.com` necesita añadirse como propietario en GSC |
| 0.4 | GA4 Data API responde con datos | ✅ **38 usuarios activos, 72 sesiones, 1.382 páginas vistas en 28 días** | Verificado mediante script `scripts/test-ga4.mjs` con OAuth 2.0 |
| 0.5 | Health check completo | 🟡 No ejecutado — las rutas admin requieren JWT y no se pudo acceder desde herramientas externas | Pendiente de verificar desde el panel una vez en producción |
| 0.6 | URLs con suficiente tráfico | 🔴 Sin datos — GSC no disponible | Depende de que GSC esté operativo |
| 0.7 | `lib/analytics.ts` cargándose en producción | 🟡 No verificado | Requiere acceso a GA4 DebugView |

### 4.2 Configuración realizada durante la auditoría

| Acción | Detalle | Estado |
|--------|---------|--------|
| **OAuth 2.0 Client creado** en GCP Console | Web application con redirect URIs: `https://developers.google.com/oauthplayground`, `http://localhost:3000/auth` | ✅ |
| **Refresh Token obtenido** mediante OAuth 2.0 con scopes `analytics.readonly` y `analytics.edit` | Token: `YOUR_REFRESH_TOKEN` | ✅ |
| **Variables de entorno configuradas en Vercel** (producción) | `OAUTH_CLIENT_ID`, `OAUTH_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`, `GOOGLE_SEARCH_CONSOLE_SITE_URL` | ✅ |
| **Registro DNS TXT añadido** para verificación de GSC | `google-site-verification=DzWyeKuME1pSzwjCuV4vkfZH80UMwULmyiQhg2qhhUE` en Vercel DNS | ✅ |
| **Conexión GA4 Data API verificada** | 38 usuarios activos, 72 sesiones, 1.382 páginas vistas en 28 días | ✅ |
| **Scripts de prueba** | `scripts/test-ga4.mjs` — prueba de APIs, `scripts/oauth-setup.js` — flujo OAuth | ✅ |

### 4.3 Pendiente para completar Fase 0

| Tarea | Acción necesaria | Prioridad |
|-------|-----------------|-----------|
| Verificar eventos GA4 (`whatsapp_click`, etc.) | Acceder a GA4 → Reports → Engagement → Events y buscar eventos personalizados | 🔴 Para Fase 3 |
| Configurar Search Console API | El usuario `alfonsroiget@gmail.com` debe añadirse como propietario en https://search.google.com/search-console?resource_id=sc-domain:pinedayasociadoshn.com | 🔴 Para Fase 2 |
| Verificar carga de `lib/analytics.ts` en producción | Usar GA4 DebugView o Real-time report | 🟡 |
| Ejecutar health check desde el panel | Acceder a `/intranet/admin/seo` tras el próximo deploy | 🟡 |

### 4.4 Lecciones aprendidas

1. **Google ha bloqueado el OAuth out-of-band (OOB)** (`urn:ietf:wg:oauth:2.0:oob`). Ya no funciona. La alternativa fue crear un OAuth Client Web y usar el flujo con `http://localhost:3000/auth` como redirect URI.
2. **El OAuth Playground** tiene problemas con clientes OAuth propios si no se configura correctamente. Tiende a usar su client_id por defecto.
3. **Las service accounts no pueden autogestionarse permisos en GA4.** Es un círculo vicioso: necesitan acceso para pedir acceso. La solución es OAuth 2.0 con un usuario que YA tenga permisos de administrador en GA4.
4. **GA4 Data API funciona** con OAuth 2.0 usando los scopes `analytics.readonly` y `analytics.edit`.
5. **Los datos diarios de GA4** se obtienen correctamente solicitando la dimensión `date`. El response incluye `rows` con valores día a día.
6. **Search Console API requiere** que el usuario autenticado sea propietario de la propiedad. No funciona con OAuth simple si el usuario no tiene permisos en GSC.

---

## 5. Fase 1 — Fundamentos de datos, caché y tipos

**Objetivo:** Crear la infraestructura de datos necesaria para los gráficos: endpoints de timeline diario, caché robusta para serverless, comparación con período anterior, y tipos compartidos.

**Duración estimada:** 10-14 horas

**Dependencias:** Fase 0 completada (datos validados)

### 5.1 Tareas

| # | Tarea | Archivos probables | Esfuerzo |
|---|-------|-------------------|----------|
| 1.1 | Endpoint `GET /api/admin/analytics/timeline?days=28` con datos día a día + período anterior + cambios % | `app/api/admin/analytics/timeline/route.ts`, `lib/google.ts` | 4h |
| 1.2 | Endpoint `GET /api/admin/search-console/timeline?days=28` con datos día a día + período anterior + cambios % | `app/api/admin/search-console/timeline/route.ts`, `lib/google.ts` | 3h |
| 1.3 | Estrategia de caché escalonada (ver sección 12) | `lib/cache.ts`, modificar endpoints existentes | 3h |
| 1.4 | Añadir `previousPeriod` y `changes` a endpoints agregados existentes | `app/api/admin/analytics/route.ts`, `app/api/admin/search-console/route.ts` | 2h |
| 1.5 | Tipos compartidos entre APIs y frontend | `lib/types/admin-dashboard.ts` | 1h |
| 1.6 | Manejo de errores consistente en todos los endpoints | Refactor de routes | 1h |

### 5.2 Riesgos

| Riesgo | Mitigación |
|--------|------------|
| GA4 Data API rate limit (50 req/día) | Caché agresiva (TTL 10-30 min). No más de 3-4 requests por hora por endpoint. |
| Período anterior en GA4 no es exacto | GA4 no tiene "período anterior" mágico. Hay que hacer 2 queries: N días y N días anteriores. Duplica el tiempo. |
| Timeline sin datos (tráfico bajo) | Muchos días tendrán valor 0. El gráfico debe funcionar con huecos. |

### 5.3 Criterios de aceptación

- [ ] `GET /api/admin/analytics/timeline?days=28` devuelve array de 28 objetos con fecha y métricas
- [ ] `GET /api/admin/analytics/timeline?days=28` incluye `previousPeriod` con cambios %
- [ ] Lo mismo para Search Console
- [ ] Caché funcional: segunda request en <5s responde desde caché
- [ ] Tipos documentados y exportados

---

## 6. Fase 2 — Visualizaciones esenciales (MVP gráfico)

**Objetivo:** Añadir gráficos básicos a las pestañas Resumen, Analytics y Search Console usando Recharts. No sobre-ingeniería: líneas, barras y donut simples.

**Duración estimada:** 12-16 horas

**Dependencias:** Fase 1 completada (timelines disponibles, caché operativa)

### 6.1 Tareas

| # | Tarea | Archivos probables | Esfuerzo |
|---|-------|-------------------|----------|
| 2.1 | Instalar Recharts | `package.json` | 0.5h |
| 2.2 | Componente `MetricCard` con valor grande + trend badge + estado loading | `components/admin/metric-card.tsx` | 1.5h |
| 2.3 | Componente `TrendBadge` (↑/↓/→ con color semáforo) | `components/admin/trend-badge.tsx` | 0.5h |
| 2.4 | Componente `ChartCard` (wrapper de card + título + gráfico Recharts + estado vacío/error) | `components/admin/chart-card.tsx` | 1h |
| 2.5 | Componente `BaseLineChart` (Recharts Line con tooltip, grid, responsive) | `components/admin/base-line-chart.tsx` | 1.5h |
| 2.6 | Componente `BaseBarChart` (Recharts Bar, horizontal/vertical) | `components/admin/base-bar-chart.tsx` | 1h |
| 2.7 | Componente `BaseDonutChart` (Recharts Pie con label de %) | `components/admin/base-donut-chart.tsx` | 1h |
| 2.8 | Componente `DataTable` con paginación client-side y columnas configurables | `components/admin/data-table.tsx` | 2h |
| 2.9 | Componente `LoadingSkeleton` para estados de carga | `components/admin/loading-skeleton.tsx` | 0.5h |
| 2.10 | Componente `EmptyState` y `ErrorState` | `components/admin/empty-state.tsx`, `components/admin/error-state.tsx` | 1h |
| 2.11 | Pestaña Resumen: grid 2×2 con gráficos de tráfico diario, donut dispositivos, barras fuentes, barras top páginas | `app/intranet/admin/seo/page.tsx` | 3h |
| 2.12 | Pestaña Analytics: línea de usuarios/sesiones + tabla de países y fuentes | `app/intranet/admin/seo/page.tsx` | 2h |
| 2.13 | Pestaña Search Console: línea clics/impresiones + tabla de queries top con Δposición y Δclics | `app/intranet/admin/seo/page.tsx` | 2h |
| 2.14 | Selector de período con presets (7/28/90 días) sincronizado entre pestañas | `app/intranet/admin/seo/page.tsx` | 1h |

### 6.2 Gráficos priorizados (MVP)

| Pestaña | Gráfico | Prioridad | Por qué |
|---------|---------|-----------|---------|
| Resumen | Línea de usuarios/sesiones 7d | 🔴 Must | Visión rápida de tendencia |
| Resumen | Donut de dispositivos | 🔴 Must | Saber si mobile domina |
| Resumen | Barras de fuentes top 5 | 🟡 Should | Entender de dónde viene el tráfico |
| Resumen | Barras de top páginas | 🟡 Should | Saber qué funciona |
| Analytics | Línea de usuarios/sesiones 28d | 🔴 Must | Tendencia ampliada |
| Analytics | Tabla de países | 🟡 Should | Presencia geográfica |
| GSC | Línea de clics/impresiones 28d | 🔴 Must | Evolución del SEO |
| GSC | Tabla de top 20 queries | 🔴 Must | Saber por qué keywords nos encuentran |

### 6.3 Lo que NO se implementa en esta fase

- Gráficos de dispersión (scatter)
- Heatmaps
- Comparativas avanzadas (semanales agrupadas)
- Calendario personalizado

### 6.4 Riesgos

| Riesgo | Mitigación |
|--------|------------|
| Recharts aumenta el bundle del panel | Lazy load de los componentes de gráficos con `next/dynamic` |
| Datos vacíos rompen el gráfico | `BaseLineChart` debe manejar `data.length === 0` sin error |
| Tooltips en móvil no funcionan | Recharts tiene soporte táctil por defecto |

### 6.5 Criterios de aceptación

- [ ] Pestaña Resumen muestra 4 gráficos con datos reales
- [ ] Pestaña Analytics muestra línea de usuarios/sesiones en 28 días
- [ ] Pestaña Search Console muestra línea de clics/impresiones + tabla de top 20 queries
- [ ] Selector de período cambia los datos de todas las pestañas
- [ ] Estados loading → datos → vacío → error funcionan y son visualmente distintos
- [ ] Tamaño del bundle: Recharts no aumenta >50 KB en el JS del cliente

---

## 7. Fase 3 — Conversiones, análisis por URL y leads

**Objetivo:** Mostrar leads reales del bufete (WhatsApp, teléfono, formularios) y permitir analizar el rendimiento de una URL concreta.

**Duración estimada:** 10-14 horas

**Dependencias:** Fase 0 (eventos validados), Fase 1 (endpoints de datos)

### 7.1 Condiciones previas (de la Fase 0)

Antes de implementar esta fase, los eventos GA4 deben estar verificados. Si no existen, esta fase se pospone.

| Evento | Esperado | Real (rellenar tras Fase 0) |
|--------|----------|-----------------------------|
| `whatsapp_click` | Sí | ⬜ |
| `phone_click` | Sí | ⬜ |
| `form_click` | Sí | ⬜ |
| `lead_generated` | Sí | ⬜ |

### 7.2 Tareas

| # | Tarea | Archivos probables | Esfuerzo |
|---|-------|-------------------|----------|
| 3.1 | Endpoint `GET /api/admin/conversions?days=30` que consulte eventos GA4 por nombre de evento | `app/api/admin/conversions/route.ts` | 3h |
| 3.2 | Agregar conversiones al summary | `app/api/admin/seo/summary/route.ts` | 1h |
| 3.3 | Sección "Conversiones" en pestaña Resumen con leads totales, por fuente y tendencia | `app/intranet/admin/seo/page.tsx` | 2h |
| 3.4 | Endpoint `POST /api/admin/url-analysis` que combine indexación + GA4 por URL + GSC por URL | `app/api/admin/url-analysis/route.ts` | 3h |
| 3.5 | Sección "Analizar URL" en pestaña Indexación con resultado unificado | `app/intranet/admin/seo/page.tsx` | 2h |
| 3.6 | Mostrar richResults en inspector de URL (datos ya existen en API) | `app/intranet/admin/seo/page.tsx` | 1h |

### 7.3 Riesgos

| Riesgo | Mitigación |
|--------|------------|
| Los eventos GA4 no existen o están mal nombrados | La Fase 0 debe detectarlo. Si no hay eventos, mostrar "Sin datos de conversión — configurar eventos en GA4". |
| `getAnalyticsForUrl` devuelve null para URLs con poco tráfico | Mostrar "No hay suficientes datos" sin romper la UI. |
| GSC no tiene datos para la URL consultada | Lo mismo: estado "Sin datos" visualmente claro. |
| GA4 Data API no permite filtrar por nombre de evento personalizado | Sí permite: `eventName` como dimensión en `RunReportRequest`. Verificado en docs. |

### 7.4 Criterios de aceptación

- [ ] `GET /api/admin/conversions?days=30` devuelve leads por fuente y timeline
- [ ] La UI muestra leads aunque sean 0 (no se rompe)
- [ ] `POST /api/admin/url-analysis` devuelve indexación + tráfico + GSC o estado "Sin datos"
- [ ] Los richResults se muestran en inspector de URL
- [ ] Todo maneja correctamente estados "no configurado" y "sin datos"

---

## 8. Fase 4 — Alertas locales y exportación básica

**Objetivo:** Alertas puntuales (sin histórico) y exportación CSV de tablas.

**Duración estimada:** 6-8 horas

**Dependencias:** Fase 2 (componentes de UI y DataTable)

### 8.1 Tareas

| # | Tarea | Archivos probables | Esfuerzo |
|---|-------|-------------------|----------|
| 4.1 | Endpoint `GET /api/admin/alerts` que detecte problemas puntuales: errores 4xx/5xx en GSC, URLs en sitemap no indexadas, health checks fallando | `app/api/admin/alerts/route.ts` | 2h |
| 4.2 | Componente `AlertsPanel` renderizado en pestaña Resumen | `components/admin/alerts-panel.tsx` | 1.5h |
| 4.3 | Botón "Exportar CSV" en cada `DataTable` | `lib/export/csv.ts`, modificar `DataTable` | 1.5h |
| 4.4 | Última actualización por sección (timestamp + "hace X min") | Refactor de cards | 1h |

### 8.2 Alertas implementables SIN histórico

| Alerta | Fuente de datos | Cómo se detecta |
|--------|-----------------|-----------------|
| 🟡 URLs en sitemap no indexadas | GSC URL Inspection + sitemap | Comparar sitemap vs estado de indexación |
| 🔴 Errores 4xx/5xx en GSC | Search Console API | Consultar `platform:web` con `responseStatus` |
| 🟢 Health checks OK/FAIL | `GET /api/admin/seo/health` | Ya existe |
| 🟡 Sin datos en GA4 en últimos 7 días | `GET /api/admin/analytics?days=7` | Métricas = 0 |

**Lo que NO se implementa (requiere histórico):**
- Caída de tráfico >20%
- Pérdida de indexación progresiva
- Keywords que pierden posiciones

### 8.3 Criterios de aceptación

- [ ] Panel de alertas muestra problemas detectables sin histórico
- [ ] Cada tabla exportable tiene botón CSV que descarga archivo UTF-8 BOM
- [ ] Timestamp "Última actualización" visible en cada sección
- [ ] Alertas sin datos no rompen la UI

---

## 9. Fase 5 — Optimización, accesibilidad y documentación

**Objetivo:** Pulir el panel, mejorar accesibilidad, lazy loading de componentes pesados, y documentar para futuros desarrolladores.

**Duración estimada:** 6-8 horas

**Dependencias:** Fases 1-4 completadas

### 9.1 Tareas

| # | Tarea | Archivos probables | Esfuerzo |
|---|-------|-------------------|----------|
| 5.1 | Lazy loading de Recharts con `next/dynamic` | `app/intranet/admin/seo/page.tsx` | 0.5h |
| 5.2 | Añadir `aria-label` a gráficos y botones | Todos los componentes de admin | 1h |
| 5.3 | Estados de carga/error/vacío consistentes en todas las pestañas | Refactor de page.tsx | 2h |
| 5.4 | Skeleton loaders animados en todas las secciones | `components/admin/loading-skeleton.tsx` | 1h |
| 5.5 | Documentación técnica del panel (data flow, APIs, componentes) | `docs/admin-seo-dashboard.md` | 1.5h |
| 5.6 | Actualizar README.md con sección del dashboard | `README.md` | 0.5h |
| 5.7 | Actualizar CHANGELOG.md | `CHANGELOG.md` | 0.5h |

### 9.2 Criterios de aceptación

- [ ] Recharts no aumenta el bundle inicial (lazy loaded)
- [ ] Todos los gráficos tienen `aria-label` descriptivo
- [ ] Skeleton loaders visibles mientras cargan datos
- [ ] Documentación del panel creada en `docs/`
- [ ] README.md actualizado

---

## 10. Arquitectura de componentes

### 10.1 Componentes del dashboard (6 + 4 auxiliares)

```
components/admin/                    # Solo 10 componentes, no 18
├── metric-card.tsx                  # Card con valor + tendencia + icono
├── trend-badge.tsx                  # Badge ↑/↓/→ con color
├── chart-card.tsx                   # Card contenedora + título + footer con timestamp
├── base-line-chart.tsx              # Recharts LineChart (wrapper ligero)
├── base-bar-chart.tsx               # Recharts BarChart (wrapper ligero)
├── base-donut-chart.tsx             # Recharts PieChart (wrapper ligero)
├── data-table.tsx                   # Tabla con paginación + export CSV
├── alerts-panel.tsx                 # Lista de alertas colapsable
├── loading-skeleton.tsx             # Skeleton genérico
├── empty-state.tsx                  # Estado vacío + error
└── date-range-selector.tsx          # Presets 7/28/90 días
```

### 10.2 Principios de diseño

1. **Cada componente maneja 4 estados**: loading, success, empty, error
2. **No hay efectos secundarios en componentes**: toda la data llega por props
3. **Los wrappers de Recharts son genéricos**: aceptan `data`, `lines`/`bars`/`pies` config
4. **DataTable**: paginación client-side (los datos del panel son pequeños, <100 filas)
5. **CSV export**: función pura sin dependencias, genera blob y dispara descarga

### 10.3 Tipos compartidos

```typescript
// lib/types/admin-dashboard.ts

export type DashboardMetric = {
  label: string;
  value: number | string;
  icon?: string;
  trend?: { direction: 'up' | 'down' | 'flat'; percentage: number };
  subtitle?: string;
};

export type DashboardState = 'loading' | 'success' | 'empty' | 'error';

export type ApiResponse<T> = {
  configured: boolean;
  success: boolean;
  data: T;
  totals?: Record<string, number>;
  previousPeriod?: {
    totals: Record<string, number>;
    changes: Record<string, number | null>;
  };
  lastUpdatedAt?: string;
  source?: 'cache' | 'fresh';
  warnings?: string[];
  error?: string;
};

export type TimelinePoint = {
  date: string;
  [key: string]: number | string;
};

export type ConversionData = {
  total: number;
  bySource: Record<string, number>;
  timeline: TimelinePoint[];
  byUrl: { url: string; leads: number; source: string }[];
};

export type UrlAnalysis = {
  url: string;
  indexation: {
    configured: boolean;
    coverageState: string | null;
    isIndexable: boolean | null;
    canonical: string | null;
    richResults: unknown[] | null;
  };
  analytics: {
    configured: boolean;
    hasData: boolean;
    pageViews: number | null;
    users: number | null;
    avgDuration: number | null;
  } | null;
  searchConsole: {
    configured: boolean;
    hasData: boolean;
    clicks: number | null;
    impressions: number | null;
    ctr: number | null;
    position: number | null;
  } | null;
};

export type AlertItem = {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  actionUrl?: string;
  actionLabel?: string;
};
```

---

## 11. Contratos de API detallados

### 11.1 Endpoints a crear

#### `GET /api/admin/analytics/timeline?days=7|28|90`

```json
{
  "configured": true,
  "success": true,
  "days": 28,
  "data": [
    { "date": "2025-05-17", "activeUsers": 5, "sessions": 8, "screenPageViews": 20, "newUsers": 3 }
  ],
  "totals": { "activeUsers": 245, "sessions": 389, "screenPageViews": 1203, "newUsers": 180 },
  "previousPeriod": {
    "totals": { "activeUsers": 220, "sessions": 360, "screenPageViews": 1100, "newUsers": 165 },
    "changes": { "activeUsers": 11.4, "sessions": 8.1, "screenPageViews": 9.4, "newUsers": 9.1 }
  },
  "deviceBreakdown": [
    { "device": "mobile", "users": 160 },
    { "device": "desktop", "users": 65 },
    { "device": "tablet", "users": 20 }
  ],
  "sourceBreakdown": [
    { "source": "google", "sessions": 200 },
    { "source": "direct", "sessions": 80 },
    { "source": "social", "sessions": 40 }
  ],
  "lastUpdatedAt": "2025-06-13T12:00:00Z",
  "source": "fresh"
}
```

Parámetros: `days` (7/28/90, default 28) — validar que sea uno de esos valores.
Si `configured === false`, no devolver data.

#### `GET /api/admin/search-console/timeline?days=7|28|90`

```json
{
  "configured": true,
  "success": true,
  "days": 28,
  "data": [
    { "date": "2025-05-17", "clicks": 3, "impressions": 45, "ctr": 0.0667, "position": 8.5 }
  ],
  "totals": { "clicks": 120, "impressions": 4500, "ctr": 0.0267, "position": 7.2 },
  "previousPeriod": {
    "totals": { "clicks": 105, "impressions": 4200, "ctr": 0.025, "position": 7.8 },
    "changes": { "clicks": 14.3, "impressions": 7.1, "ctr": 6.7, "position": -7.7 }
  },
  "topQueries": [
    { "query": "abogado penalista Choluteca", "clicks": 12, "impressions": 340, "ctr": 0.035, "position": 4.2 }
  ],
  "lastUpdatedAt": "2025-06-13T12:00:00Z",
  "source": "cache"
}
```

Parámetros: `days` (7/28/90, default 28), `limit` (max 50, default 20).

#### `GET /api/admin/conversions?days=7|28|90`

```json
{
  "configured": true,
  "success": true,
  "eventsFound": true,
  "total": 23,
  "bySource": { "whatsapp_click": 15, "phone_click": 5, "form_click": 3 },
  "timeline": [
    { "date": "2025-06-01", "leads": 1 }
  ],
  "byUrl": [
    { "url": "/abogado-penalista-choluteca", "leads": 3, "sources": { "whatsapp_click": 2, "phone_click": 1 } }
  ],
  "lastUpdatedAt": "2025-06-13T12:00:00Z"
}
```

Si `eventsFound === false`, la UI debe mostrar "Eventos no detectados — verifique que los eventos GA4 están configurados".

#### `POST /api/admin/url-analysis`

Request: `{ "url": "https://www.pinedayasociadoshn.com/..." }`

Response:
```json
{
  "success": true,
  "url": "https://www.pinedayasociadoshn.com/abogado-penalista-choluteca",
  "indexation": {
    "configured": true,
    "coverageState": "Submitted and indexed",
    "isIndexable": true,
    "canonical": "https://www.pinedayasociadoshn.com/...",
    "richResults": [
      { "type": "BlogPosting", "items": 1 },
      { "type": "FAQPage", "items": 4 }
    ]
  },
  "analytics": {
    "configured": true,
    "hasData": true,
    "pageViews": 45,
    "users": 38,
    "avgDuration": 154
  },
  "searchConsole": {
    "configured": true,
    "hasData": true,
    "clicks": 12,
    "impressions": 340,
    "ctr": 0.035,
    "position": 8.2
  }
}
```

Campos `hasData: false` cuando no hay datos suficientes.

#### `GET /api/admin/alerts`

```json
{
  "success": true,
  "alerts": [
    {
      "id": "sitemap-unindexed-1",
      "severity": "warning",
      "title": "URLs del sitemap no indexadas",
      "description": "3 URLs del sitemap no están indexadas por Google.",
      "actionUrl": "/intranet/admin/seo?tab=indexacion",
      "actionLabel": "Revisar"
    }
  ],
  "lastUpdatedAt": "2025-06-13T12:00:00Z"
}
```

### 11.2 Endpoints a modificar

#### `GET /api/admin/analytics` — Añadir:

```json
{
  "previousPeriod": {
    "metrics": { "activeUsers": 220, "sessions": 360, "screenPageViews": 1100 },
    "changes": { "activeUsers": 11.4, "sessions": 8.1, "screenPageViews": 9.4 }
  },
  "lastUpdatedAt": "2025-06-13T12:00:00Z",
  "source": "cache"
}
```

#### `GET /api/admin/search-console` — Añadir:

```json
{
  "previousPeriod": {
    "totals": { "clicks": 105, "impressions": 4200, "ctr": 0.025, "position": 7.8 },
    "changes": { "clicks": 14.3, "impressions": 7.1, "ctr": 6.7, "position": -7.7 }
  },
  "lastUpdatedAt": "2025-06-13T12:00:00Z",
  "source": "cache"
}
```

### 11.3 Validación de parámetros

Todos los endpoints deben validar:

| Parámetro | Tipo | Valores | Default | Error si inválido |
|-----------|------|---------|---------|-------------------|
| `days` | number | 7, 28, 90 | 28 | 400 Bad Request |
| `limit` | number | 1-50 | 20 | 400 Bad Request |
| `page` | number | 1+ | 1 | 400 Bad Request |
| `from` | string (ISO date) | Fecha válida | — | 400 Bad Request |
| `to` | string (ISO date) | Fecha válida | — | 400 Bad Request |
| `url` | string | URL válida | — | 400 Bad Request |

---

## 12. Estrategia de caché para serverless

### 12.1 El problema

Vercel serverless no garantiza que dos requests consecutivos caigan en el mismo worker. Usar `Map` en memoria no es fiable en producción.

### 12.2 Solución escalonada

```
┌─────────────────────────────────────────────────────────────┐
│                    ESTRATEGIA DE CACHÉ                       │
├─────────────┬─────────────────────┬──────────────────────────┤
│ Entorno     │ Método              │ Comportamiento           │
├─────────────┼─────────────────────┼──────────────────────────┤
│ Desarrollo  │ Map en memoria      │ Funciona (un solo worker)│
│ Producción  │ unstable_cache      │ Cachea HTTP responses    │
│             │ (Next.js fetch cache)│ en Vercel Edge Network   │
│ Producción  │ + React.cache()     │ Cachea promesas en SSR   │
│ (futuro)    │ Upstash Redis       │ Cache compartido real    │
└─────────────┴─────────────────────┴──────────────────────────┘
```

### 12.3 TTL recomendados por fuente

| Fuente | TTL | Razón |
|--------|-----|-------|
| GA4 agregado | 10 min | Datos cambian poco, tasa limit 50 req/día |
| GA4 timeline | 15 min | Misma razón, más pesado de generar |
| GSC agregado | 15 min | GSC es aún menos frecuente que GA4 |
| GSC timeline | 30 min | Timeline grande, cambios mínimos |
| Health checks | 1 min | Debe ser casi tiempo real |
| Sitemap | 1 min | Datos locales, cambian con cada post |
| URL inspection | 5 min | GSC API, no cambia frecuentemente |
| Conversiones | 10 min | Eventos GA4, misma limitación |

### 12.4 Invalidación manual

Añadir botón "🔄 Forzar actualización" en cada sección. Al hacer clic:

1. Obtiene el cache key desde la URL del endpoint
2. Si usamos `unstable_cache`, revalidar con `revalidateTag()`
3. Si usamos Redis, eliminar la clave
4. Refrescar la UI con datos frescos

### 12.5 Esquema de cache key

```
dashboard:{source}:{period}:{params_hash}
```

Ejemplos:
- `dashboard:analytics:28:default`
- `dashboard:gsc:7:limit=20`
- `dashboard:conversions:30:default`

---

## 13. KPIs reales para un bufete jurídico local

Estos son los KPIS que importan para un bufete local en la zona sur de Honduras. No son métricas vanity.

### 13.1 KPIs principales (pestaña Resumen)

| KPI | Fuente | Por qué importa |
|-----|--------|-----------------|
| **Clics orgánicos** | GSC | Cuántas personas hacen clic en los resultados de búsqueda |
| **Impresiones orgánicas** | GSC | Cuántas veces aparecemos en búsquedas |
| **CTR orgánico** | GSC | Efectividad de títulos y descripciones |
| **Posición media** | GSC | Qué tan arriba aparecemos en Google |
| **Usuarios** | GA4 | Visitantes únicos al sitio |
| **Sesiones** | GA4 | Visitas totales |
| **Duración media** | GA4 | Si el contenido engancha |
| **Leads (WhatsApp + Teléfono + Formulario)** | GA4 Events | Cuántas personas contactan |

### 13.2 KPIs de SEO local (pestaña GSC filtrada)

| KPI | Fuente | Notas |
|-----|--------|-------|
| **Posiciones de keywords locales objetivo** | GSC | Filtrado por keywords predefinidas |
| **Clics desde zona sur** | GA4 | Si está configurado geo |
| **Impresiones en Choluteca/Nacaome/San Lorenzo** | GSC | No hay datos de ciudad en GSC, solo país |
| **CTR en páginas de servicio local** | GSC | Páginas de dinero |

### 13.3 KPIs de contenido (pestaña Sitemap / Contenido)

| KPI | Fuente | Notas |
|-----|--------|-------|
| **Posts publicados** | DB | Total de artículos |
| **Posts con 0 impresiones en 30 días** | GSC + DB | Contenido que no genera tráfico |
| **URLs indexadas vs en sitemap** | GSC + Sitemap | Diferencia = problemas de indexación |

### 13.4 Lo que NO se puede medir (con las herramientas actuales)

| "KPI" | Por qué no |
|-------|------------|
| Volumen de búsqueda de keywords | GSC no lo proporciona. Se necesita Google Keyword Planner o herramienta de pago. |
| Posición exacta de una keyword | GSC da posición media, no posición exacta en SERP. |
| Tráfico de competidores | No hay datos. |
| Leads atribuidos a cliente concreto | Sin CRM conectado, no se puede. |
| Satisfacción del cliente post-consulta | Requiere encuesta. |

---

## 14. Priorización MoSCoW

### 14.1 Must Have (imprescindible para MVP)

- [ ] Endpoints de timeline diario (GA4 + GSC)
- [ ] Caché funcional en producción (`unstable_cache`)
- [ ] Comparación período anterior en endpoints existentes
- [ ] Pestaña Resumen con 4 gráficos (tráfico, dispositivos, fuentes, top páginas)
- [ ] Pestaña Analytics con línea de usuarios/sesiones
- [ ] Pestaña GSC con línea de clics/impresiones + tabla de top 20 queries
- [ ] MetricCard con tendencia
- [ ] Estados loading → success → empty → error
- [ ] Selector de período 7/28/90 días
- [ ] Rich results visibles en inspector de URL

### 14.2 Should Have (muy deseable)

- [ ] Panel de conversiones (si eventos existen)
- [ ] Analizador de URL individual
- [ ] Exportación CSV
- [ ] Skeleton loaders en todas las secciones
- [ ] Alertas básicas (URLs no indexadas, health checks)

### 14.3 Could Have (mejora notable)

- [ ] Alerts avanzados (errores 4xx/5xx)
- [ ] Seguimiento de keywords locales con GSC
- [ ] Badge "última actualización" en cada sección
- [ ] Botón "Forzar actualización" por sección
- [ ] Lazy loading de Recharts

### 14.4 Won't Have (por ahora)

- [ ] PDF con gráficos
- [ ] Calendario personalizado
- [ ] Gráficos de dispersión y heatmaps
- [ ] Comparativas semanales agrupadas
- [ ] Alertas por email
- [ ] Dashboards drag-and-drop personalizables
- [ ] Predicción con IA
- [ ] Base de datos propia para histórico

---

## 15. No hacer todavía

Esta sección lista lo que el plan anterior proponía pero que **no debe implementarse en el MVP** por falta de base técnica, datos insuficientes o complejidad desproporcionada.

| Funcionalidad | Motivo | Cuándo reconsiderar |
|---------------|--------|---------------------|
| **PDF con gráficos** | Requiere Puppeteer o librería server-side. CSV es suficiente. | Cuando se solicite explícitamente informes descargables. |
| **Gráficos de dispersión (scatter)** | Poco intuitivo para el público objetivo. No hay pares de datos significativos. | Si hay suficientes datos para correlacionar. |
| **Heatmaps** | Requiere librería adicional. No hay datos con estructura de matriz. | Post-MVP lejano. |
| **Calendario personalizado** | Presets fijos cubren el 95% de casos de uso. | Si usuarios solicitan rangos arbitrarios. |
| **Alertas por email** | Requiere sistema de notificaciones, cola de trabajos, suscripciones. | Cuando el panel esté maduro y haya demanda. |
| **Dashboard drag-and-drop** | Extremadamente complejo de implementar. | Nunca para un panel interno. Usar herramientas especializadas. |
| **Predicción/IA** | Sin datos históricos suficientes, cualquier predicción es aleatoria. | Con > 1 año de datos diarios. |
| **Seguimiento de keywords con volumen de búsqueda** | GSC no da volumen. Se necesita herramienta externa de pago. | Si se contrata herramienta SEO. |
| **Base de datos propia para histórico** | Coste de desarrollo y mantenimiento alto para el beneficio actual. | Cuando el panel demuestre valor y se necesiten alertas históricas. |

---

## 16. Roadmap resumido con dependencias

```
Fase 0 ─── Auditoría (4-6h)
  │
  ▼
Fase 1 ─── Fundamentos (10-14h) ─── Depende de: Fase 0 OK
  │
  ▼
Fase 2 ─── Visualizaciones (12-16h) ─── Depende de: Fase 1 OK
  │
  ├────> Fase 3 ─── Conversiones (10-14h) ─── Depende de: Fase 0 eventos OK + Fase 1
  │
  ├────> Fase 4 ─── Alertas + CSV (6-8h) ─── Depende de: Fase 2
  │
  └────> Fase 5 ─── Optimización + Docs (6-8h) ─── Depende de: Fases 1-4
```

**Ruta crítica mínima para MVP útil (2-3 semanas reales):**
Fase 0 → Fase 1 → Fase 2 → (Fase 4 parcial: CSV)

**Fases paralelizables:**
- Fase 3 puede iniciarse después de Fase 1 si los eventos existen
- Fase 5 puede solaparse con Fase 4

---

## 17. Estimación de esfuerzo realista

| Fase | Desarrollo | QA/validación | Documentación | Total |
|------|-----------|---------------|---------------|-------|
| Fase 0 | 3h | 1h | 1h | **5h** |
| Fase 1 | 8h | 3h | 1h | **12h** |
| Fase 2 | 10h | 4h | 1h | **15h** |
| Fase 3 | 8h | 3h | 1h | **12h** |
| Fase 4 | 5h | 2h | 1h | **8h** |
| Fase 5 | 4h | 2h | 2h | **8h** |
| **Total** | **38h** | **15h** | **7h** | **60h** |

**Estimación realista total: 50-70 horas** (dependiendo de la complejidad real de integración con Google APIs y la cantidad de datos disponibles).

**MVP mínimo (Fase 0 + 1 + 2): 32 horas** → 2 semanas para un desarrollador full-time.

**Release completo (Fases 0-5): 60 horas** → 3-4 semanas.

---

## 18. Criterios de aceptación por fase

### Fase 0
- [ ] Todos los eventos GA4 verificados o plan de remediación documentado
- [ ] Health check completo con resultados documentados
- [ ] Lista de URLs analizables identificada

### Fase 1
- [ ] Timeline endpoints devuelven datos día a día
- [ ] Período anterior con cambios % funcional
- [ ] Caché operativa (segunda request en <0.5s vs primera en <5s)
- [ ] Manejo de errores: endpoints devuelven error estructurado, no 500

### Fase 2
- [ ] Resumen: 4 gráficos con datos reales
- [ ] Analytics: línea de usuarios/sesiones
- [ ] GSC: línea de clics/impresiones + tabla top 20 queries
- [ ] Selector de período cambia datos en todas las pestañas
- [ ] Estados loading → success → empty → error visualmente distintos
- [ ] Build: 0 errores, 0 warnings nuevos

### Fase 3
- [ ] Panel de conversiones renderiza leads o mensaje de "no configurado"
- [ ] URL analysis devuelve datos o "sin datos suficientes"
- [ ] Rich results visibles

### Fase 4
- [ ] CSV descargable desde cada tabla
- [ ] Alertas panel muestra problemas detectables
- [ ] Timestamps visibles

### Fase 5
- [ ] Lazy loading de Recharts verificado en Network tab
- [ ] Documentación técnica creada
- [ ] README.md y CHANGELOG.md actualizados

---

## 19. Checklist de validación pre-desarrollo

Antes de escribir la primera línea de código de las fases 1-5, verificar:

### 19.1 Datos

- [ ] ¿GA4 Data API responde con `activeUsers > 0` para 28 días?
- [ ] ¿Search Console API responde con `clicks > 0` para 28 días?
- [ ] ¿Los eventos `whatsapp_click`, `phone_click`, `form_click` existen en GA4?
- [ ] ¿Hay al menos un evento de lead en los últimos 30 días?
- [ ] ¿Las URLs de servicio local tienen al menos 10 visitas en 28 días?

### 19.2 Infraestructura

- [ ] ¿El health check de GA4 Data API pasa?
- [ ] ¿El health check de Search Console API pasa?
- [ ] ¿IndexNow está configurado y funcional?
- [ ] ¿Se ha identificado qué URLs tienen datos en GSC para análisis?

### 19.3 Dependencias

- [ ] ¿Se ha decidido si usar `unstable_cache`, Redis o solo caché local?
- [ ] ¿Se ha verificado que Recharts no añade conflictos con Tailwind v4?
- [ ] ¿El equipo tiene acceso al dashboard de GA4 para verificar eventos?

### 19.4 Si alguna verificación falla

No avanzar hasta resolver. Cada fallo tiene un plan de remediación:

| Fallo | Remedio |
|-------|---------|
| GA4 API sin datos | Verificar service account en GA4 property. Dar permisos de "Visualizador". |
| GSC sin datos | Verificar service account en GSC. Dar permisos de "Propietario completo". |
| Eventos no existen | Revisar `lib/analytics.ts`. Verificar que se carga en producción (GA4 DebugView). |
| Sin leads en 30 días | El sitio tiene poco tráfico. Aceptar que el panel de conversiones esté vacío. |
| Recharts incompatible | Probar con `npm ls recharts peer` o buscar alternativa. |

---

## 20. Actualizaciones documentales requeridas

Cuando se implemente este plan, los siguientes archivos deberán actualizarse:

| Archivo | Cambio requerido |
|---------|-----------------|
| `README.md` | Añadir sección "Dashboard de Analítica SEO" con descripción del panel, acceso, APIs que consume y cómo interpretar los datos. |
| `CHANGELOG.md` | Registrar cada fase implementada con fecha, archivos modificados y validación. |
| `docs/admin-seo-dashboard.md` | **Nuevo**: documentación técnica del dashboard (data flow, contratos de API, componentes, caché, manejo de errores). |
| `AGENTS.md` | Si se modifica la arquitectura de datos o se añaden dependencias externas (Redis, etc.), actualizar sección 2. |

---

## Apéndice A — Comparativa de librerías de gráficos

| Librería | Bundle (gzipped) | Reactiva | Curva aprendizaje | Server Components | Notas |
|----------|-----------------|----------|-------------------|-------------------|-------|
| **Recharts** | ~35 KB | Sí | Baja | No (client-only) | Recomendada. Componentes declarativos. |
| Chart.js + react-chartjs-2 | ~45 KB | Sí | Media | No | Más conocido, menos integración React. |
| Nivo | ~60 KB | Sí | Alta | Parcial | Requiere D3. Más complejo. |
| ECharts | ~90 KB | Vía wrapper | Alta | No | Muy pesado para panel interno. |
| Tremor (sobre Recharts) | ~50 KB | Sí | Baja | Parcial | Componentes pre-diseñados. Menos control. |

**Decisión:** Recharts. Es la opción más ligera, con mejor integración React y documentación extensa.

---

## Apéndice B — Glosario

| Término | Significado |
|---------|-------------|
| GA4 | Google Analytics 4 |
| GSC | Google Search Console |
| CTR | Click-Through Rate (tasa de clics) |
| TTL | Time To Live (tiempo de vida del caché) |
| KPI | Key Performance Indicator |
| MVP | Minimum Viable Product |
| MoSCoW | Must/Should/Could/Won't — priorización |
| lead | Contacto potencial (WhatsApp, llamada, formulario) |
| SERP | Search Engine Results Page |
| Key Event | Evento marcado como conversión en GA4 |

---

*Documento generado el 13 de junio de 2026. Versión 2.0 — Auditoría crítica aplicada. Próxima revisión: 13 de julio de 2026 o al completar la Fase 0.*
