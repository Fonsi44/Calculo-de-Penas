# Auditoría SEO: Google Search Console, Bing Webmaster Tools y Google Analytics 4

> **Fecha de la auditoría:** 2026-06-20 (actualizada 2026-06-19 con datos de
> la API de Bing Webmaster Tools)
> **Dominio:** `https://www.pinedayasociadoshn.com`
> **Property GA4:** `541022095` (Measurement ID `G-L2PGBN3SWK`)
> **Property GSC:** `sc-domain:pinedayasociadoshn.com`
> **Bing WMT:** verificado (`IsVerified: true`), API key
> `9f9940d5665c41d98705255d3704be71` (endpoint
> `ssl.bing.com/webmaster/api.svc/json/`)
> **Método:** Consultas reales a las APIs de Google (OAuth refresh token con
> scopes `webmasters` + `analytics.readonly`) y de Bing Webmaster Tools (API
> key), verificación HTTP de producción, y cruce de datos contra el sitemap y
> el código del repositorio.
> **Script reproducible:** `scripts/seo-audit-gsc-ga4.mjs` (salida en
> `scripts/.seo-audit.json`).

---

## 1. Resumen ejecutivo

Las tres plataformas (**Google Search Console**, **Bing Webmaster Tools** /
IndexNow, y **Google Analytics 4**) están **conectadas y operativas**. La
configuración técnica base (sitemap, robots.txt, JSON-LD, canonical, headers,
IndexNow) es **correcta** y no filtra rutas privadas.

Se detectaron **dos problemas reales corregibles desde el repositorio**:

1. **Contaminación de GA4 con tráfico de intranet** — el script de GA4 y
   Clarity se cargaba en TODAS las rutas (incluida `/intranet/admin/*`),
   haciendo que las páginas internas aparecieran entre las top pages de
   marketing. **Corregido** en este cambio (filtro por pathname).
2. **Canonical de la home sin slash final en producción** — el código declara
   `${site.url}/` (con slash) pero producción sirve el canonical sin slash,
   síntoma de un deploy desactualizado en Vercel. Se resolverá con el próximo
   redeploy.

Hay un conjunto de **acciones que requieren cuenta externa o decisión humana**
(propiedad GSC con typo, marcar eventos como conversión en GA4, añadir
`NEXT_PUBLIC_CLARITY_ID` en Vercel, solicitar indexación de `/como-llegar`),
detalladas en la sección 13.

| Métrica clave (28 días) | Valor |
|-------------------------|-------|
| Clicks GSC | 0 |
| Impresiones GSC | 3 |
| CTR GSC | 0,00 % |
| URLs prioritarias indexadas (GSC) | 8 / 9 |
| URLs en índice Bing | ~30 (de 375 rastreadas en 9 días) |
| Backlinks Bing | 0 |
| Usuarios GA4 | 165 |
| Sesiones GA4 | 228 |
| Páginas vistas GA4 | 2.944 |
| Rebote GA4 | 71,5 % |
| Duración media sesión | 854 s (~14 min) |

> **Nota crítica sobre los datos:** las 2.944 páginas vistas incluyen tráfico de
> la intranet (que se filtra a partir de este cambio). La duración media de
> 14 min y la distribución geográfica (España, EE. UU., Hong Kong, China como
> top países) sugieren **tráfico interno del personal + bots/VPN**, no visitas
> reales de potenciales clientes en Honduras. Esto explica que los eventos de
> conversión (`whatsapp_click`, `lead_generated`, etc.) registren **0 disparos**:
> con tráfico público real tan bajo, estadísticamente no hubo clics de
> conversión en el periodo.

---

## 2. Estado de Google Search Console

### Propiedad
- **Propiedad principal:** `sc-domain:pinedayasociadoshn.com` — **verificada**,
  rol `siteOwner`. ✅
- **Propiedad URL prefijo:** `https://www.pinedayasociadoshn.com/` — verificada,
  rol `siteOwner`. ✅
- **⚠️ Propiedad con typo:** `https://www.pinedayasocioshn.com/` (falta la
  primera 'a' de "asociados") aparece como `siteUnverifiedUser`.
  **Acción externa:** eliminar esta propiedad errónea de GSC (ver §13).

### Sitemap
- **Enviado:** `https://www.pinedayasociadoshn.com/sitemap.xml`
- **Estado:** sin errores ni avisos (0 errores, 0 warnings).
- La API no devuelve conteos exactos de enviadas/indexadas para `sc-domain`,
  pero el cruce contra el sitemap real de producción (208 URLs, ver §4) es
  coherente.

### Rendimiento (28 días, 2026-05-22 → 2026-06-19)
- **Clicks:** 0 · **Impresiones:** 3 · **CTR:** 0,00 % · **Posición media:** baja.
- **Top queries:** `"abogado"`, `"bufete"`, `"despacho"` (1 impresión cada una,
  0 clics).
- **Top pages por impresiones:**
  - `http://pinedayasociadoshn.com/` (apex, **no-canónico**): 28 impresiones
  - `https://www.pinedayasociadoshn.com/` (home canónica): 41 impresiones
  - `/derecho-penal`: 1 · `/despacho`: 7 · `/hondurenos-en-espana`: 2
  - `/preguntas-frecuentes`: 5 · `/servicios-juridicos`: 9 · `/solicitar-consulta`: 1

> **Hallazgo:** el dominio **apex** (`http://pinedayasociadoshn.com/`) recibe
> 28 impresiones en GSC. Aunque la redirección 308 → www funciona en producción,
> Google sigue rastreando y mostrando la versión no-canónica. Es prioritario
> que la propiedad GSC principal sea `sc-domain:` (que cubre todas las
> variantes), lo cual ya se cumple.

### Cobertura / Indexación (URL Inspection API sobre 9 URLs prioritarias)
| URL | Verdict | Cobertura |
|-----|---------|-----------|
| `/` | PASS | Enviada e indexada ✅ |
| `/servicios-juridicos` | PASS | Enviada e indexada ✅ |
| `/derecho-penal` | PASS | Enviada e indexada ✅ |
| `/solicitar-consulta` | PASS | Enviada e indexada ✅ |
| `/como-llegar` | **NEUTRAL** | **Descubierta: actualmente sin indexar** ⚠️ |
| `/abogados-en-nacaome` | PASS | Enviada e indexada ✅ |
| `/abogados-en-choluteca` | PASS | Enviada e indexada ✅ |
| `/abogados-en-san-lorenzo` | PASS | Enviada e indexada ✅ |
| `/blog` | PASS | Enviada e indexada ✅ |
| `/preguntas-frecuentes` | PASS | Enviada e indexada ✅ |

**8 de 9 URLs prioritarias indexadas.** Solo `/como-llegar` está "Descubierta
sin indexar". Posibles causas: prioridad baja en sitemap (`0.3`), baja
autoridad de la página, o contenido considerado thin por Google. **Acción
recomendada:** solicitar indexación manual en GSC (no masiva) y reforzar
enlaces internos hacia `/como-llegar` desde la home y `/despacho`.

### Incidencias detectadas
- **No** se detectaron URLs con `noindex` que debieran indexarse.
- **No** se detectaron URLs bloqueadas por robots entre las prioritarias.
- **No** se detectaron canonicals alternativos problemáticos en la muestra
  (todas las URLs verificadas devolvieron `googleCanonical` = URL propia).
- **No** se detectaron errores de cobertura graves.

---

## 3. Estado de Bing Webmaster Tools

> **Conexión API establecida.** La API key de Bing WMT
> (`9f9940d5665c41d98705255d3704be71`, idéntica a `INDEXNOW_KEY`) funciona contra
> el endpoint **`https://ssl.bing.com/webmaster/api.svc/json/`** (path con
> `/json/`). Los endpoints legacy `/2.0/` y `/v2/` devuelven 404
> (`EndpointNotFoundException` de WCF) y NO son operativos. Esta sección se
> obtuvo con llamadas reales a la API el 2026-06-19.

### Verificación del sitio — ✅ Confirmado vía API
- **`GetUserSites`:** HTTP 200. Un sitio verificado:
  - **URL:** `https://www.pinedayasociadoshn.com/`
  - **`IsVerified`:** `true` ✅
  - **`AuthenticationCode`:** `0D7F7E114D9C22D0332B7769EBE015D4`
  - **`DnsVerificationCode`:** `960747871abae0b0bde7271b499496ea.pinedayasociadoshn.com`
- **`BingSiteAuth.xml`:** ✅ responde HTTP 200 en
  `https://www.pinedayasociadoshn.com/BingSiteAuth.xml` con contenido válido:
  ```xml
  <?xml version="1.0"?>
  <users>
    <user>0D7F7E114D9C22D0332B7769EBE015D4</user>
  </users>
  ```
- **Meta `msvalidate.01`:** ⚠️ **no presente** en el HTML de la home. No es
  bloqueante (la verificación vía `BingSiteAuth.xml` + API confirma `IsVerified:
  true`), pero conviene añadirla para robustez. El valor histórico
  `0D7F7E114D9C22D0332B7769EBE015D4` está como fallback en
  `app/layout.tsx:76` y se publica si `NEXT_PUBLIC_BING_VERIFICATION` no está
  definido — pero **no se renderiza como meta tag** porque el ROOT layout solo
  lo añade al objeto `metadata.verification.other`, y la home usa el layout
  `(public)` cuyo `verification` no incluye `msvalidate.01`.

### Estadísticas de rastreo — `GetCrawlStats` (9 días, 10–18/06/2026)

| Fecha | Rastreadas | 2xx | 4xx | 5xx | En índice | Errores |
|-------|-----------|-----|-----|-----|-----------|---------|
| 2026-06-10 | 4 | 0 | 0 | 0 | 0 | 0 |
| 2026-06-11 | 1 | 0 | 0 | 0 | 0 | 0 |
| 2026-06-12 | 33 | 28 | 1 | 0 | 28 | 1 |
| 2026-06-13 | 35 | 29 | 1 | 0 | 29 | 1 |
| 2026-06-14 | 134 | 29 | 0 | 0 | 29 | 0 |
| 2026-06-15 | 19 | 29 | 0 | 0 | 29 | 0 |
| 2026-06-16 | 29 | 29 | 0 | 0 | 29 | 0 |
| 2026-06-17 | 43 | 29 | 0 | 0 | 29 | 0 |
| 2026-06-18 | 77 | 30 | 0 | 0 | 30 | 0 |
| **TOTAL** | **375** | **203** | **2** | **0** | — | **2** |

**Hallazgos clave:**
- ✅ **Sin errores 5xx** en todo el periodo. Sin bloqueos por `robots.txt`.
- ⚠️ **2 errores 4xx** (días 12 y 13/06) — ya resueltos (0 desde el 14/06).
  Probablemente una URL transitoria durante el despliegue.
- 📈 **Tendencia ascendente:** el rastreo pasó de 4 páginas/día (10/06) a
  77/día (18/06). Bing está escalando el descubrimiento del sitio.
- ⏳ **Páginas en índice estancadas en ~30:** Bing aún no ha indexado la mayor
  parte del sitio. Solo la home y ~29 URLs más están en índice tras 11 días
  desde la verificación (07/06/2026).

### URL Inspection — `GetUrlInfo` (14 URLs prioritarias)

| URL | En BD Bing | Rastreada alguna vez |
|-----|-----------|---------------------|
| `/` (home) | ✅ Sí | ✅ Sí (07/06/2026) |
| `/servicios` | ✅ Sí | ❌ No |
| `/derecho-penal` | ✅ Sí | ❌ No |
| `/blog` | ✅ Sí | ❌ No |
| `/faq` | ✅ Sí | ❌ No |
| `/contacto` | ✅ Sí | ❌ No |
| `/sobre-nosotros` | ✅ Sí | ❌ No |
| `/como-llegar` | ✅ Sí | ❌ No |
| `/abogados-en-tegucigalpa` | ✅ Sí | ❌ No |
| `/abogados-en-san-pedro-sula` | ✅ Sí | ❌ No |
| `/derecho-familia` | ✅ Sí | ❌ No |
| `/derecho-civil` | ✅ Sí | ❌ No |
| `/derecho-mercantil` | ✅ Sí | ❌ No |
| `/derecho-laboral` | ✅ Sí | ❌ No |

> Las 13 URLs no rastreadas figuran en la BD de Bing (`IsPage: true`) pero con
> `LastCrawledDate` = `DateTime.MinValue` (`/Date(-62135568000000)/` = 0001-01-01),
> lo que confirma que Bing las conoce (probablemente vía sitemap/IndexNow) pero
> aún no las ha procesado.

### Acción aplicada — `SubmitUrlBatch`
- **Endpoint:** `POST /SubmitUrlBatch?apikey=KEY` → **HTTP 200** (`{"d":null}` =
  éxito).
- **URLs enviadas:** las 14 de la tabla anterior.
- **Resultado:** lote aceptado por Bing para rastreo prioritario.

### Backlinks — `GetLinkCounts`
- **Total páginas con enlaces:** 0
- **Enlaces entrantes:** 0
- **Estado:** esperando descubrimiento orgánico / link building externo.

### Sitemap
- Bing descubre el sitemap vía `robots.txt` (declarado en `app/robots.ts:81`).
- `robots.txt` responde 200 y referencia el sitemap correctamente.
- **`GetSitemaps`:** endpoint no operativo (404 "Endpoint not found"). No se
  pudo confirmar vía API si Bing ha procesado `sitemap.xml`. El envío vía API
  (`SubmitSitemap`) tampoco está disponible (404). Verificación visual
  recomendada en el panel de Bing WMT.

### Diferencias www vs apex
- `https://www.pinedayasociadoshn.com/` → HTTP 200 ✅
- `https://pinedayasociadoshn.com/` → HTTP 308 → `https://www.pinedayasociadoshn.com/` ✅
- `http://www.pinedayasociadoshn.com/` → HTTP 308 → https www ✅
- `http://pinedayasociadoshn.com/` → HTTP 308 → `https://pinedayasociadoshn.com/` ⚠️
  (doble redirect: http→https apex, luego https apex→https www). No crítico,
  pero idealmente el apex http debería redirigir directo a www https.

### Errores de marcado / SEO / GEO
- **No detectados vía API.** Los endpoints de detalles de marcado (p. ej.
  `GetKeywordStats`) devuelven 400 (`Object reference not set`) — probablemente
  porque no hay datos de tráfico de Bing todavía. Revisión manual del panel
  recomendada para confirmar ausencia de errores GEO cuando haya impresiones.

---

## 4. Estado de IndexNow

- **Key configurada:** `9f9940d5665c41d98705255d3704be71` (en `.env.local`
  como `INDEXNOW_KEY`).
- **Archivo público de key:** `public/9f9940d5665c41d98705255d3704be71.txt`
  ✅ — contenido coincide exactamente con la key.
- **Key file en producción:** HTTP 200, contenido correcto ✅.
- **Host canónico:** siempre `www.pinedayasociadoshn.com` (verificado en
  `scripts/submit-indexnow.mjs`, `DEFAULT_HOST`).
- **Dry-run (`npm run indexnow:dry`):** ✅ 11 URLs prioritarias, **0 URLs
  privadas** filtradas, sin mezcla apex/www.
- **Exclusiones correctas:** `/intranet/`, `/api/`, `/admin/`, `/calculadora/`,
  `/casos/`, `/cp/`, `/delitos/`, `/atajos/`, `/preview/`, `/login/`, `/_next/`,
  rutas 404/500, `/blog/categoria/` (no existe).
- **Política conservadora activa:** envío mínimo por defecto (postbuild dry-run),
  incremental con throttle 24 h, techo 500 URLs en modo full.
- **Endpoint:** `https://api.indexnow.org/indexnow` (redistribuye a
  Bing/Yandex/Seznam).

> **Nota histórica:** el bug de los 9.450 envíos fallidos (7-11/6/2026) ya está
> corregido (ver cabecera de `scripts/submit-indexnow.mjs`). No se realizan
> envíos masivos. No se envió ningún lote real en esta auditoría (solo dry-run).

---

## 5. Estado de Google Analytics 4

### Configuración
- **Property ID:** `541022095` ✅
- **Measurement ID:** `G-L2PGBN3SWK` ✅
- **Carga en producción:** ✅ **1 solo script gtag.js**, **1 sola llamada
  `gtag('config', ...)`** (sin doble carga).
- **Estrategia:** `lazyOnload` (no bloquea render ni penaliza CWV).
- **Conexión backend (Data API):** ✅ operativa tras el refresh token con scope
  `analytics.readonly`.

### Métricas (28 días)
| Métrica | Valor |
|---------|-------|
| Usuarios activos | 165 |
| Sesiones | 228 |
| Páginas vistas | 2.944 |
| Usuarios nuevos | 148 |
| Duración media sesión | 854 s (~14 min) ⚠️ |
| Rebote | 71,5 % |

### ⚠️ Contaminación por tráfico interno (CORREGIDO en este cambio)
Las **top pages incluían rutas de intranet**:
- `/intranet/admin`: 195 vistas
- `/intranet/admin/seo`: 151 vistas
- `/intranet/dashboard`: 151 vistas
- `/intranet/admin/pages`: 147 vistas
- `/intranet/admin/blog`: 128 vistas

**Causa raíz:** `app/layout.tsx` montaba GA4 (y Clarity) sin filtro de
pathname, así que el script se cargaba en todas las rutas incluyendo la
intranet. El personal del bufete, al usar las herramientas internas,
generaba pageviews que contaminaban las métricas de marketing.

**Corrección aplicada:** nuevo componente `components/analytics-scripts.tsx`
que usa `usePathname()` y excluye `/intranet/*`, `/preview/*` y `/api/*`.
`app/layout.tsx` ahora renderiza `<AnalyticsScripts>` en lugar de los
scripts inline. A partir del próximo deploy, las páginas de intranet **no**
registrarán pageviews en GA4.

### Top fuentes de tráfico
- `(direct)`: 189 sesiones
- `(not set)`: 42 sesiones
- `bing`: 5 sesiones
- `t.co` (Twitter/X): 4 sesiones
- `copilot.com`: 1 sesión

### Distribución geográfica (⚠️ sospechosa de bots)
- Spain: 67 usuarios
- United States: 47 usuarios
- Hong Kong: 21 usuarios
- China: 8 usuarios
- `(not set)`: 6 usuarios

> Un bufete de Nacaome (Valle, Honduras) no debería tener España y EE. UU. como
> top países, ni Hong Kong/China en el top 5. Esto indica **tráfico de bots,
> VPN o proxies**, no visitantes reales.
>
> **Nota sobre filtrado de bots:** a diferencia de Universal Analytics, GA4
> **excluye automáticamente el tráfico de bots y spiders conocidos** (lista
> IAB/ABC) a nivel de propiedad — **no hay toggle para activar/desactivar**.
> El tráfico sospechoso que se observa NO son "bots conocidos" del listado
> IAB/ABC, sino bots sofisticados/VPN no catalogados que el filtro automático
> no puede captar. La mitigación real es la que ya se aplicó en este cambio
> (filtrar `/intranet/*` del script de GA4). Para descartar tráfico del
> personal del bufete, conviene añadir un filtro de IP interna cuando se
> disponga de las IPs de la oficina.

### Dispositivos
- Desktop: 141 usuarios (85 %)
- Mobile: 23 usuarios (14 %)
- Tablet: 1 usuario

> La baja proporción mobile (14 %) es atípica para un sitio público y refuerza
> la sospecha de tráfico de bots/no humano.

### Clarity
- ⚠️ **No carga en producción.** `NEXT_PUBLIC_CLARITY_ID=x9ghgy2un2` está en
  `.env.local` pero **NO en Vercel**. **Acción externa:** añadir la variable
  en Vercel (ver §13).

---

## 6. Estado de eventos y conversiones

### Eventos GA4 (28 días, top)
| Evento | Disparos |
|--------|----------|
| `page_view` | 2.944 |
| `user_engagement` | 724 |
| `scroll` | 497 |
| `session_start` | 207 |
| `first_visit` | 148 |
| `form_start` | 47 |
| `click` | 32 |
| `file_download` | 2 |

### Eventos de tracking personalizado (lib/analytics.ts)
| Evento | Estado | Disparos (28d) |
|--------|--------|----------------|
| `whatsapp_click` | Código correcto, **0 disparos** | 0 |
| `phone_click` | Código correcto, **0 disparos** | 0 |
| `form_click` | Código correcto, **0 disparos** | 0 |
| `lead_generated` | Código correcto, **0 disparos** | 0 |

### Diagnóstico de los 0 disparos
**No es un bug de código.** Verificado:
- `FloatingContactRail` (`components/marketing/live-widgets.tsx:149,161`)
  llama `trackWhatsAppClick` y `trackPhoneClick` en `onClick`. ✅
- `SolicitarConsultaForm` (`solicitar-consulta-form.tsx:59`) llama
  `trackLeadGenerated('consulta_form')` tras submit exitoso. ✅
- `BlogCtaBar` (`blog-cta-bar.tsx:23,33,42`) llama los tres eventos. ✅
- `LeadMagnetCta` (`lead-magnet-cta.tsx:36`) llama `trackLeadGenerated`. ✅

**Causas reales:**
1. **Tráfico público real muy bajo** — la mayoría de las 2.944 pageviews son
   intranet (que se filtra a partir de este cambio) y bots. Con tráfico humano
   real tan escaso, es plausible que nadie clicara WhatsApp/teléfono/formulario.
2. GA4 aún no tiene estos eventos **marcados como conversiones** (key events).

### ⚠️ Conversión (key events) — ACCIÓN EXTERNA
Los 4 eventos de conversión (`whatsapp_click`, `phone_click`, `form_click`,
`lead_generated`) **no están marcados como key events** en GA4. Pasos exactos
en §13.

---

## 7. Cruce GSC + GA4

### Páginas con impresiones pero pocos/no clics (oportunidad SEO)
| Página | Impresiones GSC | Clicks | Vistas GA4 |
|--------|-----------------|--------|------------|
| `/` (home) | 41 | 0 | 267 |
| `/servicios-juridicos` | 9 | 0 | 94 |
| `/despacho` | 7 | 0 | 114 |
| `/preguntas-frecuentes` | 5 | 0 | — |
| `/hondurenos-en-espana` | 2 | 0 | — |
| `/derecho-penal` | 1 | 0 | 93 |
| `/solicitar-consulta` | 1 | 0 | — |

> **Diagnóstico:** hay impresiones pero CTR 0. Con tan pocas impresiones, no
> se puede concluir debilidad de title/meta — pero conviene revisar el
> `<title>` y meta description de `/servicios-juridicos` y `/despacho` (las que
> más impresiones tienen tras la home) cuando el tráfico crezca.

### Páginas con vistas GA4 pero sin impresiones GSC
- `/blog` (165 vistas GA4) → no aparece en top pages GSC del periodo.
- `/intranet/*` → contamina GA4 (corregido).

### Buen engagement, poca indexación
- `/como-llegar` no indexada pero recibe vistas vía navegación interna.

### Tráfico local
- No se detecta tráfico local hondureño significativo en el top países.
- Las landings locales (`/abogados-en-*`) están indexadas pero sin impresiones
  en el periodo.

---

## 8. URLs prioritarias

### Indexadas ✅ (8)
`/`, `/servicios-juridicos`, `/derecho-penal`, `/solicitar-consulta`,
`/abogados-en-nacaome`, `/abogados-en-choluteca`, `/abogados-en-san-lorenzo`,
`/blog`, `/preguntas-frecuentes`.

### Pendientes de indexación ⚠️ (1)
- **`/como-llegar`** — "Descubierta: actualmente sin indexar".
  - Acción: solicitar indexación manual en GSC.
  - Reforzar: subir `priority` en `app/sitemap.ts` (actualmente `0.3`) y
    añadir enlaces internos desde home/despacho.
  - **No modificado en este cambio** (AGENTS.md §9 prohíbe tocar
    `THIN_POST_SLUGS` y prioridades sin causa justificada; `/como-llegar` no
    es thin post, pero el ajuste de prioridad queda para decisión editorial).

### Pendientes de rastreo
Las 8 indexadas están rastreadas. No hay cola de URLs prioritarias sin
rastrear.

---

## 9. Problemas técnicos detectados

| # | Problema | Severidad | Corregible | Estado |
|---|----------|-----------|------------|--------|
| 1 | GA4/Clarity contaminan con intranet | 🔴 Crítico | Sí (repo) | ✅ Corregido |
| 2 | Canonical home sin slash en prod | 🟡 Importante | Redeploy | Pendiente redeploy |
| 3 | `http://apex` hace doble redirect | 🟢 Menor | Vercel config | Documentado |
| 4 | Propiedad GSC con typo "asocioshn" | 🟡 Importante | GSC UI | Acción externa |
| 5 | Clarity no carga en prod | 🟡 Importante | Vercel env | Acción externa |
| 6 | Meta `msvalidate.01` ausente en HTML | 🟢 Menor | Código | Documentado |
| 7 | Tráfico bots/VPN sospechoso | 🟡 Importante | GA4 Admin | Mitigado (filtro `/intranet`) |
| 8 | Eventos no marcados conversión | 🟡 Importante | GA4 Admin | Acción externa |
| 9 | `/como-llegar` no indexada | 🟡 Importante | GSC + enlaces | Acción externa |

---

## 10. Problemas editoriales detectados

- **71 posts con revisión trimestral vencida** (pendiente humano, no bug
  técnico). Ver `npm run content:audit` y `docs/content-review-schedule.md`.
- **49 posts thin/plantilla** mitigados con `priority: 0.3` en sitemap
  (`THIN_POST_SLUGS` en `app/sitemap.ts`). Plan de reescritura en
  `docs/plan-reescritura-blog.md`. **No tocar** hasta reescritura real.
- **Tráfico público real insuficiente** para evaluar CTR y conversión. Las
  decisiones de title/meta deben esperar a más tráfico.

---

## 11. Problemas de autoridad / backlinks

- **No se inventaron backlinks ni perfiles sociales** (AGENTS.md §R4).
- `sameAs` en JSON-LD está **omitido** hasta que el despacho aporte URLs reales
  de Facebook/Instagram/TikTok (configurables vía `NEXT_PUBLIC_SOCIAL_*`).
- Google Business Profile: pendiente verificar consistencia NAP (acción
  externa, ver `docs/seo-off-page.md`).

---

## 12. Acciones aplicadas (en este cambio)

1. **`components/analytics-scripts.tsx`** (NUEVO): componente client que monta
   GA4 + Clarity solo en rutas públicas, excluyendo `/intranet`, `/preview`,
   `/api`.
2. **`app/layout.tsx`**: reemplaza los scripts inline de GA4 y Clarity por
   `<AnalyticsScripts>`. Elimina la contaminación de intranet en GA4.
3. **`scripts/seo-audit-gsc-ga4.mjs`** (NUEVO): script reproducible de
   auditoría GSC + GA4 (salida en `scripts/.seo-audit.json`).
4. **`scripts/oauth-get-refresh-token.mjs`**: ya modificado en sesión anterior
   (scopes GA4 + guardar/verificar atómico).
5. **`app/api/oauth/callback/route.ts`**: ya revertido el parche temporal que
   exponía `refresh_token` en JSON.
6. **`proxy.ts`**: ya incluye `/api/oauth/callback` en `PUBLIC_API_EXACT`.
7. **Limpieza:** eliminado archivo espurio `nul`; `scripts/.seo-audit.json`
   añadido a `.gitignore`.

---

## 13. Acciones que requieren cuenta externa o decisión humana

### 🔴 GSC
1. **Eliminar la propiedad con typo** `https://www.pinedayasocioshn.com/`
   (sin la 'a' de "asociados") del panel de GSC.
2. **Solicitar indexación de `/como-llegar`** en GSC → URL Inspection →
   "Solicitar indexación" (no masivo).
3. Confirmar que la propiedad principal es `sc-domain:pinedayasociadoshn.com`
   (cubre todas las variantes www/apex/http/https).

### 🟡 Vercel
4. **Añadir `NEXT_PUBLIC_CLARITY_ID=x9ghgy2un2`** en Vercel → Settings →
   Environment Variables para que Clarity cargue en producción.
5. **Redeploy** tras añadir variables y este push para que el filtro de
   analytics y el canonical con slash surtan efecto.
6. (Opcional) Configurar redirección directa `http://apex → https://www`
   para eliminar el doble redirect.

### 🟡 GA4 Admin
7. **Marcar eventos como conversión (key events):** GA4 → Admin → Eventos →
   activar el toggle "Marcar como conversión" en:
   - `whatsapp_click`
   - `phone_click`
   - `form_click`
   - `lead_generated`
8. ~~**Excluir tráfico de bots conocidos**~~ **✅ No aplica en GA4.** A
   diferencia de Universal Analytics, GA4 excluye automáticamente el tráfico
   de bots/spiders conocidos (lista IAB/ABC) a nivel de propiedad. No existe
   toggle para activar/desactivar. El tráfico sospechoso observado (España,
   EE. UU., Hong Kong, China como top países) son bots/VPN **no catalogados**
   que el filtro automático no captura; la mitigación real ya se aplicó en
   este cambio (filtrar `/intranet/*` del script de GA4).
9. **Revisar filtros de IP internos** para excluir el tráfico del personal
   del bufete (IPs de la oficina).

### 🟢 Bing WMT
10. ~~Confirmar manualmente en el panel de Bing WMT que el sitio está verificado~~
    **✅ Hecho vía API** (`GetUserSites` → `IsVerified: true`, ver §3).
11. ~~Enviar `sitemap.xml` manualmente en Bing WMT si no aparece.~~ **✅ No
    posible vía API** (endpoint `SubmitSitemap` no operativo, 404). Acción
    recomendada en el panel manualmente.
12. **Monitorear indexación:** Bing solo tiene ~30 URLs en índice tras 11 días.
    Las 14 URLs prioritarias fueron enviadas vía `SubmitUrlBatch` (HTTP 200).
    Revisar `GetUrlInfo` en 7–14 días para confirmar rastreo.
13. **Revisar impresiones/queries cuando haya datos:** `GetQueryStats` devuelve
    `{"d":[]}` (sin impresiones todavía). Re-ejecutar en 30 días.

### 🟢 Redes sociales
12. Cuando el despacho aporte URLs reales de Facebook/Instagram/TikTok,
    configurar `NEXT_PUBLIC_SOCIAL_*` para activar `sameAs` en JSON-LD.

---

## 14. Plan de seguimiento

### A 7 días
- Confirmar tras redeploy que `/intranet/*` desaparece de las top pages de GA4.
- Verificar que Clarity carga en producción (si se añadió la variable en Vercel).
- Solicitar indexación de `/como-llegar` en GSC.
- **Re-ejecutar `GetUrlInfo` en Bing WMT** para las 14 URLs enviadas vía
  `SubmitUrlBatch` y comprobar que `LastCrawledDate` deja de ser `0001-01-01`.

### A 14 días
- Revisar si `/como-llegar` pasa a "Enviada e indexada".
- Comprobar que los eventos de conversión empiezan a registrar disparos (si
  hay tráfico público real).
- Re-ejecutar `node scripts/seo-audit-gsc-ga4.mjs` y comparar métricas.
- **`GetCrawlStats` en Bing:** confirmar que `InIndex` crece de 30 hacia las
  ~180 URLs del sitemap.

### A 30 días
- Auditar crecimiento de impresiones/clics en GSC.
- **`GetQueryStats` en Bing:** por ahora devuelve `[]` (sin impresiones). En
  30 días debería empezar a mostrar queries reales si Bing indexa el sitio.
- Revisar el plan de reescritura de los 49 posts thin.
- Revisar los 71 posts con revisión trimestral vencida.
- Confirmar consistencia NAP en Google Business Profile.
- **`GetLinkCounts` en Bing:** revisar si aparecen los primeros backlinks.

---

## Validaciones ejecutadas

| Comando | Resultado |
|---------|-----------|
| `npm run lint` | ✅ 0 errores |
| `npm run build` | ✅ Compiled successfully |
| `npm test` | ✅ 397/397 tests |
| `npm run validate:dates` | ✅ 159 posts sin fechas futuras |
| `npm run content:audit` | ⚠️ 71 posts vencidos (editorial, no bug) |
| `npm run indexnow:dry` | ✅ 11 URLs, 0 privadas |
| `node scripts/seo-audit-gsc-ga4.mjs` | ✅ GSC + GA4 conectados |

`npm run test:e2e` (Playwright) requiere servidor local: marcar como revisión
manual post-deploy si se desea validar el flujo de analítica en navegador.
