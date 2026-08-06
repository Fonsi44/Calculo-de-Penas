---
status: current
owner: seo
created: 2026-07-03
last_reviewed: 2026-08-06
review_due: 2026-11-04
supersedes: null
superseded_by: null
---
# Acceso a datos LIVE de la web — Manual operativo

Sistema definitivo para consultar datos reales de GSC, GA4, Bing WMT, IndexNow,
sitemap y SEO health. Un comando, un reporte.

---

## Comandos rápidos

```bash
npm run seo:doctor       # diagnóstico de auths y datos (debe dar 0 ERROR)
npm run seo:collect       # recolecta todas las fuentes → reportes
npm run seo:gsc:live      # solo Google Search Console (28 días)
npm run seo:ga4:live      # solo Google Analytics 4 (28 días)
npm run seo:bing:live     # solo Bing Webmaster Tools
npm run indexnow:dry      # IndexNow dry-run (20 URLs prioritarias)
```

---

## Qué hace cada comando

### `npm run seo:doctor`
Verifica 23 cosas: Google ADC, GSC credenciales, GA4 credenciales, datos live
existentes, Bing API Key, Bing OAuth, Vercel CLI auth, GitHub CLI auth,
`.gitignore` protecciones, `.secrets/` seguridad, `.env.local` tracking.

Salida esperada: `OK: ~19 | ERROR: 0 | PENDIENTE: ~4`

Los pendientes normales son:
- Bing OAuth token (no bloqueante, API Key funciona)
- Service account Google (no bloqueante, OAuth refresh token funciona)
- ADC file en ruta estándar (no bloqueante, ADC funciona vía gcloud)
- SEO collect pending (se soluciona ejecutando `seo:collect`)

### `npm run seo:collect`
Ejecuta secuencialmente GSC, GA4, Bing, IndexNow, SEO Health y Sitemap.
Si una fuente falla (sin credenciales), continúa con las demás.

Genera:
- `data/seo/live-summary.json` — resumen estructurado
- `docs/audits/seo-live-summary.md` — reporte ejecutivo

### `npm run seo:gsc:live`
Extrae de Google Search Console: clics, impresiones, CTR, posición media,
top 100 queries, top 200 páginas, distribución por país, dispositivo y día.

Opciones:
```bash
npm run seo:gsc:live -- --days 7    # solo 7 días
npm run seo:gsc:live -- --days 90   # trimestral
npm run seo:gsc:live -- --json-only # solo JSON, sin output
```

Guarda en: `data/google/gsc-live.json`

**Requiere:** `OAUTH_CLIENT_ID` + `OAUTH_CLIENT_SECRET` + `GOOGLE_REFRESH_TOKEN`
en `.env.local`, o service account, o gcloud ADC.

### `npm run seo:ga4:live`
Extrae de Google Analytics 4: usuarios, sesiones, pageviews, eventos,
conversiones, duración media, tasa de rebote, top páginas, fuentes de tráfico,
países, dispositivos.

Opciones: igual que GSC (`--days`, `--json-only`).

Guarda en: `data/google/ga4-live.json`

**Requiere:** `GOOGLE_ANALYTICS_PROPERTY_ID` + credenciales (OAuth o service account).

### `npm run seo:bing:live`
Extrae de Bing WMT: crawl stats (páginas rastreadas, 2xx, 4xx, 5xx, errores),
44 queries, backlinks, estado de 16 URLs prioritarias.

Guarda en:
- `data/bing/bing-live.json`
- `docs/audits/bing-live-report.md`

**Requiere:** `INDEXNOW_KEY` en `.env` (API Key de Bing WMT).

### `npm run indexnow:dry`
Simula envío de 20 URLs prioritarias a IndexNow (Bing + Yandex).
Sin `--dry-run`, envía realmente (requiere `ENABLE_INDEXNOW_SUBMIT=true`).

---

## Archivos generados

| Archivo | Fuente | Regenerable | En Git |
|---------|--------|-------------|--------|
| `data/google/gsc-live.json` | GSC | Sí | No (gitignored) |
| `data/google/ga4-live.json` | GA4 | Sí | No (gitignored) |
| `data/bing/bing-live.json` | Bing WMT | Sí | No (gitignored) |
| `data/seo/live-summary.json` | Todas | Sí | No (gitignored) |
| `docs/audits/seo-live-summary.md` | Todas | Sí | Opcional |
| `docs/audits/bing-live-report.md` | Bing | Sí | Opcional |
| `docs/audits/seo-live-action-plan.md` | Manual | No | Sí |

Los archivos en `data/` son volátiles (regenerables con `seo:collect`) y están
en `.gitignore`. Los reportes en `docs/audits/` son legibles y pueden
committearse para mantener historial.

---

## Credenciales requeridas

| Variable | Dónde | Para qué |
|----------|-------|----------|
| `INDEXNOW_KEY` | `.env` | Bing WMT API Key + IndexNow |
| `BING_CLIENT_ID` | `.env.local` | Bing OAuth (Azure AD, opcional) |
| `BING_TENANT` | `.env.local` | Bing OAuth tenant (default: common) |
| `OAUTH_CLIENT_ID` | `.env.local` | Google OAuth (GSC + GA4) |
| `OAUTH_CLIENT_SECRET` | `.env.local` | Google OAuth |
| `GOOGLE_REFRESH_TOKEN` | `.env.local` | Google OAuth refresh |
| `GOOGLE_ANALYTICS_PROPERTY_ID` | `.env.local` | GA4 property ID |
| `GOOGLE_SEARCH_CONSOLE_SITE_URL` | `.env.local` | GSC site URL |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | `.env.local` | Service account (alternativa a OAuth) |
| `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` | `.env.local` | Service account key |

---

## Cómo ejecutar en Windows

gcloud SDK está en `C:\gcloud-sdk\google-cloud-sdk\bin`. Los scripts npm no
tienen esta ruta en PATH automáticamente.

**Opción A — Añadir al PATH del sistema:**
```
[Environment]::SetEnvironmentVariable("PATH", "$env:PATH;C:\gcloud-sdk\google-cloud-sdk\bin", "User")
```
Reiniciar la terminal.

**Opción B — Script wrapper (recomendado):**
```powershell
$env:PATH = "C:\gcloud-sdk\google-cloud-sdk\bin;$env:PATH"
npm run seo:collect
```

**Opción C — El script `auth-google-cli.mjs` detecta gcloud automáticamente**
si está en el PATH, y muestra instrucciones si no lo encuentra.

---

## Solución de problemas

| Problema | Causa probable | Solución |
|----------|---------------|----------|
| `gcloud` no encontrado | PATH no incluye `C:\gcloud-sdk\google-cloud-sdk\bin` | Ver Opciones A/B/C arriba |
| GSC sin datos | Refresh token expirado o permisos revocados | `npm run auth:google` para re-autenticar |
| GA4 "Insufficient Permission" | ADC no tiene scope analytics.readonly | El script usa OAuth refresh token como fallback; verificar que `GOOGLE_REFRESH_TOKEN` esté en `.env.local` |
| Bing "InvalidApiKey" | `INDEXNOW_KEY` no está en `.env` | Verificar que `.env` contiene `INDEXNOW_KEY=...` |
| Bing datos vacíos (0 queries, 0 crawl) | Doble encoding de URL (corregido en Fase 9) | Actualizar scripts a última versión |
| `seo:collect` sale con error | Falta una credencial esencial | `seo:doctor` para diagnóstico |
| Datos desactualizados | Último `seo:collect` fue hace >7 días | Re-ejecutar semanalmente |

---

## Lo que NO se debe hacer

- **NO compartir** `INDEXNOW_KEY`, `OAUTH_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN` ni tokens en chats, logs o consola.
- **NO commitear** `.env.local`, `.env`, `.secrets/`, `data/google/`, `data/bing/`, `data/seo/`.
- **NO pegar credenciales** en documentación, issues, PRs o CHANGELOG.
- **NO modificar** `auditoriatotal.mc` ni `auditoriatotal.md`.
- **NO ejecutar** `indexnow:core` (envío real) sin verificar URLs con dry-run primero.
- **NO exponer** rutas de intranet en datos públicos.

---

## Interpretación de `seo:doctor`

```
OK: 19  |  ERROR: 0  |  PENDIENTE: 4
```

Los 4 pendientes normales y opcionales:

1. **ADC file** — El archivo de credenciales ADC no está en la ruta estándar, pero gcloud ADC funciona de todas formas.
2. **Service account** — No configurada. El OAuth refresh token cubre GSC y GA4 sin necesidad de service account.
3. **Bing OAuth token** — No se ha ejecutado `npm run auth:bing` todavía. La API Key ya da acceso a datos básicos.
4. **SEO collect** — Los datos existen pero el doctor busca un archivo específico que puede cambiar de nombre. Ejecutar `seo:collect` resuelve.

---

## Flujo semanal recomendado

```bash
# Lunes
npm run seo:doctor        # verificar todo OK
npm run seo:collect       # datos frescos de la semana anterior
# Revisar docs/audits/seo-live-summary.md
# Comparar con semana anterior
# Si hay cambios bruscos → investigar

# Tras cualquier deploy
npm run indexnow:dry      # verificar URLs
npm run indexnow:core     # enviar (si dry-run OK)

# Viernes (opcional)
npm run seo:gsc:live -- --days 7   # solo semana actual
```

---

*Manual operativo del sistema SEO Live. Mantener actualizado tras cada cambio en scripts o credenciales.*
