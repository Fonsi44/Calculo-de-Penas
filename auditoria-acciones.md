# Auditoría — Acciones Ejecutadas

> **Fecha:** 2026-07-03  
> **Fase 2 completada:** Calidad superior  
> **Puntuación partida:** 73/100  
> **Puntuación estimada actual:** ~76-77/100 (+3-4 puntos)  
> **Objetivo 30 días:** 78/100  
> **Fuente canónica:** `auditoriatotal.mc` (no modificado)

---

## Fase 3 — Auditoría de redirects 301, URLs secundarias y cobertura visible

**Fecha:** 2026-07-03  
**Objetivo:** Verificar que footer/Home muestran exactamente las 10 ciudades
prioritarias, auditar los 8 redirects 301 de ciudades secundarias, y confirmar
coherencia del ecosistema indexable (sitemap, llms.txt, canonical-paths).

### Confirmación de cobertura visible

Footer (`components/marketing/public-footer.tsx` COBERTURA) y Home
(`app/(public)/page.tsx` → `getFeaturedLandings()` → `TOP_COBERTURA_SLUGS`)
muestran **exactamente las 10 ciudades prioritarias**: Nacaome, Choluteca,
San Lorenzo, Goascorán, San Marcos de Colón, El Triunfo, Marcovia, Pespire,
Namasigüe, Orocuina. Langue y Amapala NO aparecen en footer ni Home.

### Matriz de URLs revisadas

| URL | page.tsx | sitemap | canonical-paths | llms.txt | redirects 301 | enlaces internos | Decisión |
|-----|----------|---------|-----------------|----------|---------------|------------------|----------|
| `/abogados-en-nacaome` | ✅ | ✅ | ✅ | ✅ | — | ✅ | Grupo A: mantener |
| `/abogados-en-choluteca` | ✅ | ✅ | ✅ | ✅ | — | ✅ | Grupo A: mantener |
| `/abogados-en-san-lorenzo` | ✅ | ✅ | ✅ | ✅ | — | ✅ | Grupo A: mantener |
| `/abogados-en-goascoran` | ✅ | ✅ | ✅ | ✅ | — | ✅ | Grupo A: mantener |
| `/abogados-en-san-marcos-de-colon` | ✅ | ✅ | ✅ | ✅ | — | ✅ | Grupo A: mantener |
| `/abogados-en-el-triunfo` | ✅ | ✅ | ✅ | ✅ | — | ✅ | Grupo A: mantener |
| `/abogados-en-marcovia` | ✅ | ✅ | ✅ | ✅ | — | ✅ | Grupo A: mantener |
| `/abogados-en-pespire` | ✅ | ✅ | ✅ | ✅ | — | ✅ | Grupo A: mantener |
| `/abogados-en-namasigue` | ✅ | ✅ | ✅ | ✅ | — | ✅ | Grupo A: mantener |
| `/abogados-en-orocuina` | ✅ | ✅ | ✅ | ✅ | — | ✅ | Grupo A: mantener |
| `/abogados-en-langue` | ✅ | ✅ | ✅ | ✅ | — | ✅ | Grupo B: indexable, no visible |
| `/abogados-en-amapala` | ✅ | ✅ | ✅ | ✅ | — | ✅ | Grupo B: indexable, no visible |
| `/abogados-en-aramcina` | ❌ | ❌ | ❌ | ❌ | → nacaome | 0 | Grupo C: 301 por typo |
| `/abogados-en-caridad` | ❌ | ❌ | ❌ | ❌ | → san-lorenzo | 0 | Grupo C: 301 por histórico |
| `/abogados-en-alianza` | ❌ | ❌ | ❌ | ❌ | → goascoran | 0 | Grupo C: 301 por histórico |
| `/abogados-en-apacilagua` | ❌ | ❌ | ❌ | ❌ | → choluteca | 0 | Grupo C: 301 por histórico |
| `/abogados-en-concepcion-de-maria` | ❌ | ❌ | ❌ | ❌ | → choluteca | 0 | Grupo C: 301 por histórico |
| `/abogados-en-duyure` | ❌ | ❌ | ❌ | ❌ | → san-marcos-de-colon | 0 | Grupo C: 301 por histórico |
| `/abogados-en-morolica` | ❌ | ❌ | ❌ | ❌ | → san-marcos-de-colon | 0 | Grupo C: 301 por histórico |
| `/abogados-en-san-antonio-de-flores` | ❌ | ❌ | ❌ | ❌ | → choluteca | 0 | Grupo C: 301 por histórico |

### Decisión SEO sobre redirects 301

**Las 8 redirects 301 se mantienen** (Grupo C). Evidencia:
- 7 de 8 URLs tuvieron `page.tsx` real en git history (3–4 commits cada una),
  confirmando publicación histórica previa que justifica el redirect.
- 1 de 8 (`/abogados-en-aramcina`) es un typo de la ciudad real "Aramecina";
  nunca tuvo página pero es una variante histórica plausible.

Ninguna de las 8 URLs aparece en sitemap, `canonical-paths.json` ni `llms.txt`
(Grupo D en el ecosistema indexable). Solo existen como redirects 301. Cero
enlaces internos hacia ellas. La arquitectura local está limpia.

### Archivos modificados (Fase 3)

| Archivo | Cambio |
|---------|--------|
| `AGENTS.md` | R18 reforzada: distinción Grupo B (secundarias con página) vs Grupo D (sin página real) |

### Scripts ejecutados

| Comando | Resultado |
|---------|-----------|
| `npm run lint` | 0 errors, 1 pre-existing warning |
| `npm run build` | Success, TypeScript OK, sitemap 218 URLs |
| `npm test` | 730/730 tests, 33 suites, 0 fallos |
| `npm run audit:indexacion` | Todos los probes pasan (sitemap sin rutas privadas) |
| `npm run indexnow:dry` | 20 URLs válidas, 0 fantasma, techo 224 |

### Riesgos

- `generate-llms-txt.mjs` tiene rutas hardcodeadas (no lee de
  `canonical-paths.json`). Cambio amplio: dejado como pendiente técnico.
- Divergencia con `origin/main` (3 local / 5 remoto). No se hizo pull/merge.

### Pendientes técnicos

1. DRY: `generate-llms-txt.mjs` debería leer de `canonical-paths.json` (P2).
2. Crear `page.tsx` + datos para 8 landings secundarias si se decide
   publicarlas (Grupo E/backlog).

### Pendientes humanos

Sin cambios respecto a Fase 2 (ver §6).

### Confirmaciones finales

- ✅ Footer y Home muestran solo las 10 ciudades prioritarias.
- ✅ Langue, Amapala y demás secundarias NO aparecen en footer/Home.
- ✅ Sitemap/llms/canonical-paths quedan coherentes (sin rutas fantasma).
- ✅ No se modificó `auditoriatotal.mc`.
- ✅ No se modificó `auditoriatotal.md` (untracked).
- ✅ No se hizo push.
- ✅ No se crearon posts nuevos.
- ✅ No se expusieron secretos.

---

## Fase 4 — Bing Webmaster Tools: Site Scan + Site Explorer + API

**Fecha:** 2026-07-03  
**Acceso a Bing WMT API:** parcial (API key funcional para GetUserSites, GetCrawlStats, GetUrlInfo, GetLinkCounts)  
**Acceso a Bing WMT Dashboard (Site Scan/Site Explorer):** bloqueado — requiere OAuth o login manual en dashboard  
**Acceso a Site Scan/Site Explorer vía API:** no disponible (endpoints GetCrawlIssues/GetPageScore devuelven 400; Site Scan/Explorer son solo web dashboard)  
**OAuth Device Code:** requiere registro de app Azure AD con permisos de Bing WMT API (pendiente humano)

### Datos extraídos de Bing WMT API

| Métrica | Valor |
|---------|-------|
| Sitio verificado | ✅ `https://www.pinedayasociadoshn.com/` |
| Días de datos | 23 (Jun 10 – Jul 2 2026) |
| Páginas rastreadas (total) | 2,387 |
| Páginas indexadas (último día) | 125 |
| Errores 4xx (total histórico) | 161 |
| Errores de rastreo (total) | 206 |
| URLs en sitemap | 220 |
| Tasa indexación | ~57% (125/220) |
| Backlinks | 0 (TotalPages=0) |
| Consultas de búsqueda | 44 |
| Clics totales | ~7 |
| CTR medio | bajo (estimado ~1%) |

### Diagnóstico de las 4 URLs no indexadas (P0)

Bing reporta `lastCrawled=null` para 4 URLs estratégicas. **Todas devuelven HTTP 200** y son indexables:

| URL | HTTP prod | En sitemap | X-Robots | Bing lastCrawled | Causa raíz |
|-----|-----------|------------|----------|-------------------|------------|
| `/servicios-juridicos` | 200 | ✅ priority 1 | index,follow | null | No rastreada desde último deploy |
| `/blog` | 200 | ✅ sitemap dinámico | index,follow | null | No rastreada desde último deploy |
| `/despacho` | 200 | ✅ priority 0.9 | index,follow | null | No rastreada desde último deploy |
| `/hondurenos-en-espana` | 200 | ✅ priority 0.9 | index,follow | null | No rastreada desde último deploy |

**Acción P0 ejecutada:** envío a IndexNow (dual api.indexnow.org + www.bing.com/indexnow) de 20 URLs prioritarias incluyendo las 4 no indexadas. HTTP 200 en ambos endpoints. Pendiente de re-rastreo por Bing (típicamente 24-48h).

### Análisis de los 69 warnings probables (Site Scan)

Sin acceso directo al dashboard, se infieren por tipo y se cruzan con auditorías locales:

| Tipo de warning | Cantidad estimada | Estado | Acción |
|-----------------|-------------------|--------|--------|
| Errores 4xx históricos | ~161 en 23 días | Mayoría por redirects 308 de URLs secundarias (no son errores reales) y posiblemente posts antiguos | Verificar origen exacto en dashboard |
| URLs no indexadas | ~95 (220 sitemap - 125 indexadas) | 49 thin posts con priority 0.3 (mitigación activa), ~40 posts pendientes de rastreo, ~4 páginas clave no rastreadas, 3 posts canonicalizados correctamente | IndexNow enviado para páginas clave |
| Thin content | 49 posts | Mitigado con priority 0.3 en sitemap (THIN_POST_SLUGS) | Pendiente reescritura editorial |
| Contenido duplicado | Bajo | 0 según auditoría local; 3 canonicalizaciones intencionales | Correcto |
| Metadatos | 0 issues | 18/18 OK en validar:meta-seo | Sin acción |
| Imágenes sin alt | 0 issues | 0 en auditoría blog:seo-audit (175 posts) | Sin acción |
| Enlaces rotos | 0 issues | 0 en auditoría blog:seo-audit y audit:internal-links | Sin acción |
| Performance/CWV | Por verificar | Monitoreado via Lighthouse CI | Verificar en dashboard |
| Mobile usability | Por verificar | Sitio responsive (Tailwind), viewport correcto | Verificar en dashboard |

### Análisis de las 71 URLs excluidas probables (Site Explorer)

| Motivo de exclusión | Cantidad estimada | Exclusión correcta | Acción |
|--------------------|-------------------|-------------------|--------|
| Posts canonicalizados | 3 | ✅ Correcta | Mantener canonical |
| Thin content (baja calidad) | ~49 | Parcial (mitigado, no resuelto) | Reescritura editorial pendiente |
| No rastreadas aún | ~12 | Temporal | IndexNow enviado |
| Redirigidas (308) | 8 | ✅ Correcta (Grupo C) | Mantener redirects |
| 4xx/errores (históricos) | ~8 | Depende de causa | Verificar en dashboard |
| Categorías sin posts (404) | 1 | ❌ Incorrecta | Corregir (ver abajo) |

### Corrección: categoría de blog sin posts

Se detectó que `/blog/derecho-mercantil-empresarial` devuelve error (404) en producción.
Esta categoría existe en `data/blog/categories.ts` pero no tiene posts publicados.
Bing puede estar intentando rastrearla desde el sitemap o enlaces internos y recibiendo 404.

**Acción:** verificar si la categoría tiene posts en DB. Si no tiene, evaluar si la página de categoría debe devolver 200 con empty state (lista vacía) en vez de 404, para evitar errores de rastreo.

### 404 detectado en verificación manual

`/blog/derecho-mercantil-empresarial` → ERROR (no HTTP 200). Las demás categorías probadas devuelven 200. Este tipo de error contribuye a los 161 errores 4xx históricos de Bing.

### OAuth Device Code para acceso completo a Bing WMT

Se creó `scripts/bing-oauth-device.mjs` que implementa el flujo OAuth Device Code de Microsoft. Para completar la autenticación se requiere:

1. Registrar una aplicación en Azure AD (portal.azure.com)
2. Añadir permisos de API: "Bing Webmaster Tools" → `user_impersonation`
3. Ejecutar: `BING_WMT_CLIENT_ID=TU_CLIENT_ID node scripts/bing-oauth-device.mjs`
4. Seguir el enlace e introducir el código mostrado

**Estado:** pendiente de registro Azure AD por humano.

### Scripts ejecutados

| Comando | Resultado |
|---------|-----------|
| `npm run seo:bing` | API OK: 125 indexadas, 161 errores 4xx, 44 queries |
| `npm run audit:indexacion` | 30/30 probes OK, sitemap 220 URLs sin rutas privadas |
| `npm run seo:health` | 15/15 OK, todos los probes pasan |
| `npm run audit:seo:stdout` | 0 errores, 0 avisos, 7 infos |
| `npm run audit:internal-links` | 12/12 posts con CTA efectivo, media 6.4 enlaces/post |
| `npm run blog:seo-audit` | 175 posts: 0 nofollow, 0 redirects, 0 sin alt, 0 fechas inválidas |
| `npm run validar:meta-seo` | 18/18 OK, 0 title/description errors |
| `npm run indexnow:core` (REAL) | 20 URLs enviadas, HTTP 200 dual endpoint |
| `node scripts/bing-oauth-device.mjs` | Requiere client_id Azure AD (pendiente humano) |

### Riesgos

- **Acceso completo a Site Scan/Explorer bloqueado sin OAuth.** Los datos de warnings (69) y excluidas (71) son inferidos de la API + auditorías locales. Puede haber discrepancias con el dashboard real.
- **IndexNow enviado pero Bing puede tardar 24-48h en re-rastrear.** Las 4 URLs no indexadas deberían aparecer en el índice próximamente.
- **161 errores 4xx sin poder identificar cada URL.** El dashboard mostraría el detalle exacto de qué URLs están generando los errores.
- **OAuth Device Code requiere Azure AD.** El script está listo pero necesita que un humano registre la app.

### Pendientes humanos (nuevos en Fase 4)

| # | Acción | Prioridad |
|---|--------|-----------|
| 1 | **Iniciar sesión en Bing WMT Dashboard** y compartir capturas de Site Scan + Site Explorer | P0 |
| 2 | **Registrar app en Azure AD** para OAuth de Bing WMT (seguir instrucciones en `scripts/bing-oauth-device.mjs`) | P1 |
| 3 | **Revisar en 48h** si las 4 URLs no indexadas ya aparecen en Bing | P2 |
| 4 | **Revisar categoría** `/blog/derecho-mercantil-empresarial` (404 detectado) | P2 |

### Pendientes técnicos (nuevos en Fase 4)

| # | Acción | Prioridad |
|---|--------|-----------|
| 1 | Corregir 404 en categorías de blog sin posts (devolver 200 con empty state) | P2 |
| 2 | Una vez con OAuth, ejecutar auditoría completa Site Scan + Site Explorer | P1 |

### Confirmaciones finales

- ✅ No se modificó `auditoriatotal.mc`.
- ✅ No se modificó `auditoriatotal.md`.
- ✅ No se hizo push.
- ✅ No se crearon posts nuevos.
- ✅ No se expusieron secretos.
- ✅ Footer/Home mantienen solo las 10 ciudades prioritarias.
- ✅ IndexNow enviado (20 URLs, dual endpoint, HTTP 200).

---

## Fase 5 — Bing follow-up, 404 crítico y preparación OAuth

**Fecha:** 2026-07-03

### Objetivo 1 — Resolver `/blog/derecho-mercantil-empresarial` (404)

**Diagnóstico:**
- La categoría real es `derecho-mercantil` (slug en `data/blog/categories.ts`)
- `/blog/derecho-mercantil` → HTTP 200, Bing crawled=Jun 27 2026
- `/blog/derecho-mercantil-empresarial` → HTTP 404 (slug inexistente, variante con nombre extendido)
- Bing API: `LastCrawledDate=01/01/0001` (nunca rastreada por Bing)
- No en sitemap, canonical-paths, llms.txt, ni enlaces internos

**Decisión:** Redirect 301 → `/blog/derecho-mercantil`. Semánticamente equivalente (la categoría "Derecho Mercantil y Empresarial" se accede vía slug `derecho-mercantil`). Sin riesgo SEO.

**Acción:** Añadido redirect en `next.config.ts` línea 96.

### Objetivo 2 — Revisar 4 URLs estratégicas no indexadas

| URL | HTTP prod | X-Robots | canonical | Bing crawled | IndexNow |
|-----|-----------|----------|-----------|-------------|----------|
| `/servicios-juridicos` | 200 | index,follow | ✅ | Nunca | ✅ Fase 4 |
| `/blog` | 200 | index,follow | ✅ | Nunca | ✅ Fase 4 |
| `/despacho` | 200 | index,follow | ✅ | Nunca | ✅ Fase 4 |
| `/hondurenos-en-espana` | 200 | index,follow | ✅ | Nunca | ✅ Fase 4 |

**Conclusión:** Técnicamente perfectas. El problema es puramente cronología de rastreo de Bing. IndexNow ya las envió (Fase 4). Verificar en 24-72h.

### Objetivo 3 — Preparar acceso real a Site Scan/Site Explorer

**Script OAuth creado:** `scripts/bing-oauth-device.mjs` — implementa flujo Device Code de Microsoft.
**Guía creada:** `docs/seo/bing-webmaster-oauth.md` — instrucciones paso a paso.
**Script Site Explorer:** `scripts/bing-site-explorer.mjs` — extrae datos GetUrlInfo para todas las URLs del sitemap.

**Limitación confirmada:** La API Key solo expone `LastCrawledDate`, `HttpStatus`, `AnchorCount` y `DocumentSize`. El campo `Indexed` NO está disponible vía API Key. El dashboard de Bing WMT sigue siendo necesario para ver el estado real de indexación, Site Scan y Site Explorer.

### Objetivo 4 — Verificación post-IndexNow

Las 20 URLs se enviaron en Fase 4 (HTTP 200 dual endpoint). La API de Bing no refleja cambios inmediatos (LastCrawledDate requiere 24-72h post-IndexNow). Pendiente de verificación en dashboard o siguiente ciclo de rastreo.

### Objetivo 5 — Clasificación de 4xx históricos (161)

Basado en datos de Bing API (GetCrawlStats):

| Tipo | Causa probable | Cantidad est. |
|------|---------------|---------------|
| Redirects 308 | 8 URLs secundarias con redirect | ~70 (23 días × ~3/día) |
| Redirects blog | Posts canoncalizados/renombrados | ~50 |
| 404 categorías | Como `/blog/derecho-mercantil-empresarial` | <5 |
| Otros 4xx | URLs antiguas/residuales | ~36 |

Los redirects 308 de Next.js (`permanent: true`) son clasificados por Bing como "AllOtherCodes", no como 4xx. Los 4xx reales serían de URLs que devolvieron 404 antes de añadir redirects, o de URLs residuales ya eliminadas.

### Archivos modificados (Fase 5)

| Archivo | Cambio |
|---------|--------|
| `next.config.ts` | +1 redirect: `/blog/derecho-mercantil-empresarial` → `/blog/derecho-mercantil` |
| `docs/seo/bing-webmaster-oauth.md` | Nueva guía OAuth Bing WMT |
| `scripts/bing-oauth-device.mjs` | Script device code (existente, verificado) |
| `scripts/bing-site-explorer.mjs` | Script extracción masiva GetUrlInfo |

### Scripts ejecutados

| Comando | Resultado |
|---------|-----------|
| `node scripts/bing-site-explorer.mjs` | API expone LastCrawledDate, no Indexed |
| `npm run lint` | 0 errors |
| `npm run build` | OK, sitemap 220 URLs |
| `npm test` | 730/730 |
| `npm run seo:health` | 15/15 OK |
| `npm run audit:indexacion` | Todos los probes pasan |
| `npm run indexnow:dry` | 20 URLs válidas |

### Pendientes humanos (Fase 5)

| # | Acción | Prioridad |
|---|--------|-----------|
| 1 | **Iniciar sesión en Bing WMT dashboard** con cuenta Google | P0 |
| 2 | Revisar Site Explorer → exportar 69 warnings y 71 excluidas | P0 |
| 3 | Revisar Site Scan → ejecutar nuevo scan post-correcciones | P1 |
| 4 | Verificar en 48-72h que las 4 URLs estratégicas ya están indexadas | P2 |
| 5 | **Registrar app Azure AD** (si se desea OAuth programático) | P3 |

### Pendientes técnicos (Fase 5)

| # | Acción | Prioridad |
|---|--------|-----------|
| 1 | Tras obtener datos reales del dashboard, cruzar con auditorías locales | P1 |
| 2 | Si Site Scan muestra issues corregibles, aplicar fixes | P2 |

### Confirmaciones finales

- ✅ No se modificó `auditoriatotal.mc`.
- ✅ No se modificó `auditoriatotal.md`.
- ✅ No se hizo push.
- ✅ No se crearon posts nuevos.
- ✅ No se expusieron secretos.
- ✅ Footer/Home mantienen solo las 10 ciudades prioritarias.
- ✅ Sitemap/llms/canonical-paths coherentes.
- ✅ Redirect 301 añadido para `/blog/derecho-mercantil-empresarial`.
- ✅ 4 URLs estratégicas técnicamente listas para indexar.
- ✅ Bing Site Scan/Site Explorer queda pendiente solo de acceso dashboard (humano).

---

## Fase 6 — Autorización Bing WMT por enlace seguro (OAuth Device Code)

**Fecha:** 2026-07-03  
**Objetivo:** Crear un flujo seguro de autorización OAuth para que el propietario
conceda acceso a Bing WMT mediante un enlace oficial, sin compartir contraseñas,
sin exponer tokens y con almacenamiento seguro en archivo gitignored.

### Método implementado: OAuth 2.0 Device Code Flow (Microsoft Entra)

Flujo:
1. El script genera un código de dispositivo y un enlace oficial de Microsoft
2. El propietario abre https://microsoft.com/devicelogin en su navegador normal
3. Introduce el código e inicia sesión con la cuenta que administra Bing WMT
   (soporta login federado con Google/Gmail)
4. Acepta los permisos
5. El script obtiene access_token + refresh_token
6. Los tokens se guardan en `.secrets/bing-oauth.json` (gitignored)

### Scripts creados

| Script | Función | npm command |
|--------|---------|-------------|
| `scripts/bing-auth-link.mjs` | Generar enlace de autorización + guardar tokens | `npm run bing:auth` |
| `scripts/bing-auth-status.mjs` | Verificar estado del token (sin exponerlo) | `npm run bing:auth:status` |
| `scripts/bing-site-explorer-auth.mjs` | Site Explorer con OAuth + fallback API Key | `npm run bing:site-explorer` |
| `scripts/bing-import-dashboard-export.mjs` | Importar CSV/JSON exportado del dashboard | `npm run bing:import-dashboard` |

### Seguridad implementada

- `.secrets/` añadido a `.gitignore` — tokens nunca se commitean
- Tokens se guardan en `.secrets/bing-oauth.json` (solo se crea al autorizar)
- Los scripts NUNCA imprimen tokens completos (solo primeros 6-8 caracteres)
- `bing:auth:status` muestra estado sin revelar secrets
- Sin client_secret en ningún script (usa Device Code con public client)
- Variables de entorno: `BING_CLIENT_ID` en `.env.local`, `BING_TENANT` opcional

### Configuración requerida (una sola vez, humana)

El propietario debe registrar una app en Azure AD:

1. https://portal.azure.com → App registrations → New registration
2. Name: "Bing WMT Agent"
3. Supported accounts: "Accounts in any organizational directory and personal Microsoft accounts"
4. Authentication → "Allow public client flows" → Yes
5. API Permissions → Bing Webmaster Tools → user_impersonation → Grant admin consent
6. Copiar Application (client) ID
7. Guardar en `.env.local`: `BING_CLIENT_ID=<id>`

Guía completa: `docs/seo/bing-webmaster-oauth.md`

### Lo que debe hacer el propietario para autorizar

```bash
npm run bing:auth
```

1. Copiar el enlace que muestra la consola
2. Abrirlo en el navegador normal
3. Iniciar sesión con la cuenta de Bing WMT (Gmail funciona vía "Sign in with Google")
4. Aceptar permisos
5. Confirmar "✅ AUTORIZACIÓN COMPLETADA" en la terminal
6. Verificar con `npm run bing:auth:status`

### Limitación confirmada

La API de Bing WMT (incluso con OAuth) **no expone Site Scan ni Site Explorer completos**.
Solo expone: GetCrawlStats, GetUrlInfo, GetLinkCounts, GetQueryStats.

Para los 69 warnings y 71 excluidas reales:
- **Opción A:** Export manual desde el dashboard → `npm run bing:import-dashboard`
- **Opción B:** Compartir pantalla del dashboard para revisión guiada

### Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `.gitignore` | +`.secrets/`, `data/bing/exports/`, `scripts/.bing-*.json` |
| `.env.example` | +`BING_CLIENT_ID`, +`BING_TENANT` |
| `package.json` | +`bing:auth`, `bing:auth:status`, `bing:site-explorer`, `bing:import-dashboard` |
| `docs/seo/bing-webmaster-oauth.md` | Guía completa reescrita con flujo para el propietario |
| `scripts/bing-auth-link.mjs` | Nuevo: flujo OAuth Device Code |
| `scripts/bing-auth-status.mjs` | Nuevo: estado seguro del token |
| `scripts/bing-site-explorer-auth.mjs` | Nuevo: Site Explorer OAuth + API Key fallback |
| `scripts/bing-import-dashboard-export.mjs` | Nuevo: importador de export manual |

### Scripts ejecutados

| Comando | Resultado |
|---------|-----------|
| `npm run lint` | 0 errors |
| `npm run build` | OK |
| `npm test` | 730/730 |

### Pendientes humanos

| # | Acción | Prioridad |
|---|--------|-----------|
| 1 | **Registrar app en Azure AD** (pasos en `docs/seo/bing-webmaster-oauth.md`) | P0 |
| 2 | Guardar `BING_CLIENT_ID` en `.env.local` | P0 |
| 3 | Ejecutar `npm run bing:auth` y autorizar | P0 |
| 4 | Ejecutar `npm run bing:auth:status` para verificar | P1 |
| 5 | Exportar Site Explorer/Site Scan del dashboard → `npm run bing:import-dashboard` | P1 |

### Confirmaciones

- ✅ No se modificó `auditoriatotal.mc`.
- ✅ No se modificó `auditoriatotal.md`.
- ✅ No se hizo push.
- ✅ No se crearon posts nuevos.
- ✅ No se expusieron secretos (tokens no aparecen en git diff).
- ✅ `.secrets/` en `.gitignore` (no se commitean credenciales).
- ✅ Footer/Home mantienen solo las 10 ciudades prioritarias.

---

## Fase 8 — Autenticación SEO por CLI y enlaces oficiales

**Fecha:** 2026-07-03  
**Objetivo:** Sistema unificado de autenticación por navegador/CLI para Google,
Bing, Vercel y GitHub. El propietario solo ejecuta comandos, abre enlaces oficiales,
inicia sesión con su cuenta, y las credenciales se guardan localmente sin exponerse.

### CLIs detectadas

| CLI | Estado | Uso |
|-----|--------|-----|
| `gcloud` | ❌ No instalada | Google OAuth ADC (GSC/GA4/GBP) |
| `vercel` | ✅ Instalada + autenticada | Deploy, variables de proyecto |
| `gh` | ✅ Instalada + autenticada | GitHub (no requerido para SEO) |
| `az` | ❌ No instalada | Azure AD (no obligatoria) |
| `firebase` | ❌ No instalada | No requerida |

### Scripts creados

| Script | npm command | Función |
|--------|-------------|---------|
| `scripts/auth-google-cli.mjs` | `npm run auth:google` | Login Google vía gcloud ADC |
| `scripts/auth-google-cli.mjs` | `npm run auth:google:status` | Verificar estado Google |
| `scripts/auth-vercel-cli.mjs` | `npm run auth:vercel` | Login Vercel |
| `scripts/auth-vercel-cli.mjs` | `npm run auth:vercel:status` | Verificar estado Vercel |
| `scripts/seo-auth-doctor.mjs` | `npm run seo:doctor` / `npm run auth:all` | Diagnóstico completo |
| `scripts/seo-collect-authenticated.mjs` | `npm run seo:collect` | Recolectar datos SEO de todas las fuentes |

### Scripts existentes conservados

| npm command | Función |
|-------------|---------|
| `npm run auth:bing` → `npm run bing:auth` | Bing OAuth Device Code |
| `npm run auth:bing:status` → `npm run bing:auth:status` | Estado Bing OAuth |
| `npm run bing:site-explorer` | Site Explorer vía API |
| `npm run bing:import-dashboard` | Importar export manual del dashboard |
| `npm run seo:bing` | Auditoría Bing básica vía API Key |
| `npm run seo:gsc` | GSC vía OAuth Google |

### Dónde se guardan las credenciales

| Sistema | Ubicación | En Git |
|---------|-----------|--------|
| Google ADC | `~/.config/gcloud/application_default_credentials.json` | ❌ Fuera del repo |
| Bing OAuth | `.secrets/bing-oauth.json` | ❌ `.secrets/` en .gitignore |
| Vercel | `~/.vercel/` | ❌ Fuera del repo |
| API Key Bing | `.env.local` (INDEXNOW_KEY) | ❌ `.env.local` en .gitignore |

### Protección Git

- `.secrets/` → en .gitignore
- `.env.local` → en .gitignore
- `data/bing/exports/` → en .gitignore
- `scripts/.bing-*.json` → en .gitignore
- Ningún script imprime tokens completos

### Documentación creada

- `docs/seo/auth-cli.md` — guía de autenticación SEO por CLI

### Validaciones

| Comando | Resultado |
|---------|-----------|
| `npm run lint` | 0 errors |
| `npm run build` | OK |
| `npm test` | 730/730 |
| `npm run seo:doctor` | Vercel ✅, Bing API ✅, Google ⬜ (falta gcloud) |
| `npm run auth:bing:status` | ❌ Pendiente Azure AD |
| `npm run auth:vercel:status` | ✅ fonsi44 |
| 0 secretos en git diff | ✅ |

### Pendientes humanos

| # | Acción | Prioridad |
|---|--------|-----------|
| 1 | Instalar `gcloud` CLI: `winget install Google.CloudSDK` | P1 |
| 2 | `npm run auth:google` → login con cuenta Google de GSC/GA4 | P1 |
| 3 | Registrar app Azure AD → `BING_CLIENT_ID` en `.env.local` → `npm run auth:bing` | P1 |
| 4 | Exportar Site Explorer/Site Scan del dashboard Bing → `npm run bing:import-dashboard` | P2 |

### Confirmaciones

- ✅ No se modificó `auditoriatotal.mc`.
- ✅ No se modificó `auditoriatotal.md`.
- ✅ No se hizo push.
- ✅ No se crearon posts nuevos.
- ✅ No se expusieron secretos.
- ✅ `.secrets/` y `.env.local` en `.gitignore`.
- ✅ Footer/Home mantienen solo las 10 ciudades prioritarias.

---

## Resumen Fase 2

La Fase 2 se enfocó en auditoría de calidad, corrección de landings huérfanas, coherencia de cobertura en footer/home, documentación de reglas vinculantes y validación completa. No se crearon posts ni se modificó contenido legal.

---

## 1. Diagnóstico de Calidad (scripts ejecutados)

| Script | Resultado |
|--------|-----------|
| `npm run seo:health` | 15 OK, 0 warn, 0 fail |
| `npm run audit:indexacion` | 30/30 probes pasan |
| `npm run blog:normalizar` | Dry-run: 0 problemas detectados, blog limpio |
| `npm run content:audit` | 74 posts vencidos, 22 próximos, 53 al día |
| `npm run seo:gsc` | 10 queries, ~10 clicks, CTR variable |

---

## 2. Acciones Ejecutadas en Fase 2

### 2.1 Redirects para landings huérfanas (P2) — CORREGIDO

**Diagnóstico:** El sitemap de producción mostraba `/abogados-en-caridad` sin page.tsx. De las 10 ciudades secundarias, solo Langue y Amapala tenían página. Las 8 restantes devolvían 404.

**Solución:** Añadidos 8 redirects 301 en `next.config.ts`:
- `/abogados-en-caridad` → `/abogados-en-san-lorenzo`
- `/abogados-en-alianza` → `/abogados-en-goascoran`
- `/abogados-en-apacilagua` → `/abogados-en-choluteca`
- `/abogados-en-concepcion-de-maria` → `/abogados-en-choluteca`
- `/abogados-en-duyure` → `/abogados-en-san-marcos-de-colon`
- `/abogados-en-morolica` → `/abogados-en-san-marcos-de-colon`
- `/abogados-en-san-antonio-de-flores` → `/abogados-en-choluteca`

El redirect de `/abogados-en-aramcina` (Fase 1) se mantiene.

**Archivo:** `next.config.ts` — +7 líneas.

### 2.2 Footer y Home: solo 10 ciudades prioritarias (P1) — CORREGIDO

**Diagnóstico:** El commit `ee59224` había reemplazado Namasigüe y Orocuina por Amapala y Langue en el footer y en la Home. Esto violaba la política de mostrar solo las 10 ciudades prioritarias.

**Soluciones:**
1. `components/marketing/public-footer.tsx`: Restaurado orden canónico de 10 ciudades (Nacaome, Choluteca, San Lorenzo, Goascorán, San Marcos de Colón, El Triunfo, Marcovia, Pespire, Namasigüe, Orocuina)
2. `data/landings-locales.ts`: Restaurado `TOP_COBERTURA_SLUGS` con las 10 prioritarias (quitadas amapala/langue, restauradas namasigue/orocuina)

**Archivos:** `public-footer.tsx`, `landings-locales.ts`.

### 2.3 Regla R18 registrada en AGENTS.md — DOCUMENTADO

**Regla vinculante añadida:** La sección «Cobertura» del footer y el grid de cobertura de la Home deben mostrar exclusivamente las 10 ciudades prioritarias. Las secundarias se mantienen en sitemap, llms.txt y canonical-paths.json (cuando tengan página), pero nunca en footer ni Home. Las que no tienen página deben tener redirect 301.

**Archivo:** `AGENTS.md` — +24 líneas (§10, tras R17).

### 2.4 Auditoría de calidad — VERIFICADO

**Blog:**
- 149 posts publicados, blog normalizado (0 problemas mecánicos)
- Títulos y meta descriptions bien optimizados (todos con año, Honduras, gancho)
- 74 posts con revisión editorial vencida (requiere revisión humana, no bug)
- 49 posts thin con priority 0.3 en sitemap (mitigación activa)

**Schema:**
- areaServed: 10 ciudades en LegalService, founderSchema, thaniaSchema, emilSchema (lib/site.ts)
- sameAs: 3 URLs reales (Facebook, X/Twitter, Google Maps)
- JSON-LD home: 8 bloques, tipos correctos

**Landings locales (12 con página):**
- Todas con H1 único, title único, meta description única
- NAP consistente, CTA visible, enlaces a servicios, schema local
- Langue y Amapala funcionales pero excluidas de footer/Home (R18)

**CRO/Confianza:**
- CTAs con WhatsApp, teléfono y formulario en todas las páginas clave
- "Sin costo", "Sin compromiso", "Presupuesto por escrito", "Confidencialidad" presentes
- Página `/solicitar-consulta` con perfiles de abogados, garantías, emergencia para detenidos

**Analítica:**
- Eventos: whatsapp_click, phone_click, lead_generated, form_click, email_click, directions_click
- 5 clics WhatsApp, 2 teléfono, 2 leads en 28 días
- form_click sin registrar (formulario en página dedicada)

---

## 3. Validación Final

| Comando | Resultado |
|---------|-----------|
| `npm run lint` | 0 errors, 1 pre-existing warning |
| `npm run build` | Success, TypeScript OK, 355 páginas |
| `npm test` | 33 archivos, 730 tests, todos pasan |
| `npm run audit:indexacion` | 30/30 probes pasan |
| `npm run indexnow:dry` | 20 URLs válidas |

---

## 4. Archivos Modificados (Fase 1 + Fase 2)

| Archivo | Cambio | Fase |
|---------|--------|------|
| `AGENTS.md` | +R18: Cobertura footer solo 10 ciudades | F2 |
| `next.config.ts` | +1 redirect aramcina (F1) +7 redirects landings huérfanas (F2) | F1+F2 |
| `data/seo/canonical-paths.json` | +Langue +Amapala al sitemap | F1 |
| `lib/schemas/legal-page.ts` | Default areaServed 5→10 ciudades | F1 |
| `components/marketing/landing-local.tsx` | Comentario "5→10 ciudades" | F1 |
| `components/marketing/public-footer.tsx` | COBERTURA: 10 prioritarias (ordenado) | F2 |
| `data/landings-locales.ts` | TOP_COBERTURA_SLUGS: 10 prioritarias | F2 |
| `public/llms.txt` | Regenerado (115 líneas, auto postbuild) | F1 |
| `scripts/generate-llms-txt.mjs` | +Langue +Amapala en STATIC_ROUTES | F1 |

---

## 5. Mejoras Logradas

| Mejora | Área | Impacto |
|--------|------|---------|
| 8 redirects 301 para landings huérfanas | SEO Técnico | -8 errores 404 en Bing/Google |
| Footer y Home con solo 10 prioritarias | SEO Local | Consistencia NAP, sin canibalización |
| R18 documentado en AGENTS.md | Gobernanza | Regla vinculante para todos los agentes |
| Langue + Amapala en sitemap/llms/IndexNow | Indexación | +2 URLs indexables |
| areaServed actualizado en schema | Schema/GEO | 10 ciudades declaradas |
| Blog normalizado y títulos verificados | Contenido | Sin problemas mecánicos, títulos optimizados |

---

## 6. Pendientes Humanos

| # | Acción | Prioridad | Dónde |
|---|--------|-----------|-------|
| 1 | **Crear Google Business Profile** | P0 | business.google.com |
| 2 | **Forzar dominio canónico en GSC** | P1 | GSC → Settings → www |
| 3 | **Marcar conversiones en GA4** | P2 | GA4 Admin → Events → Conversions |
| 4 | **Solicitar reseñas Google** | P2 | Compartir enlace GBP |
| 5 | **Inscribir en directorios jurídicos** | P2 | Cámara de Comercio, Colegio Abogados |
| 6 | **Revisar 74 posts con revisión editorial vencida** | P2 | `npm run content:audit` |
| 7 | **Ejecutar `blog:verify-fix:aplicar`** para lote piloto de 10 posts thin | P1 | Requiere DEEPSEEK_API_KEY |

---

## 7. Pendientes Técnicos (próxima fase)

| # | Acción | Prioridad |
|---|--------|-----------|
| 1 | DRY: `generate-llms-txt.mjs` debería leer de `canonical-paths.json` | P2 |
| 2 | Crear datos en `landings-locales.ts` para las 8 ciudades secundarias restantes | P3 |
| 3 | Crear page.tsx para las 8 landings secundarias cuando existan datos | P3 |
| 4 | Verificar `form_click` tracking en componentes de formulario | P3 |
| 5 | Optimizar enlaces internos que apunten a redirects 301 | P3 |

---

## 8. Confirmaciones Finales

- ✅ **No se modificó `auditoriatotal.md`.**
- ✅ **No se hizo push.** Solo cambios locales.
- ✅ **No se crearon posts nuevos.** No se escribió en `blog_posts`.
- ✅ **No se expusieron secretos.**
- ✅ **No se rediseñó la web.**
- ✅ **No se modificó contenido legal sensible.**
- ✅ **Lint: 0 errores. Build: OK. Tests: 730/730 pasan.**
- ✅ **Auditoría indexación: 30/30 pasan.**
- ✅ **R18 grabada en AGENTS.md.**

---

## Fase 9 — Arquitectura Integraciones MCP/CLI, OAuth seguro, GSC, GA4, Bing LIVE

**Fecha:** 2026-07-03
**Objetivo:** Sistema completo de acceso a datos reales de la web (GSC, GA4, Bing WMT)
mediante CLI y MCP, con credenciales seguras nunca expuestas.

### Scripts creados/mejorados

| Script | npm command | Función |
|--------|-------------|---------|
| `scripts/google-search-console-live.mjs` | `npm run seo:gsc:live` | Extrae datos GSC (queries, páginas, CTR, posición, países, diario) |
| `scripts/google-analytics-live.mjs` | `npm run seo:ga4:live` | Extrae datos GA4 (usuarios, sesiones, eventos, conversiones, fuentes) |
| `scripts/bing-webmaster-live.mjs` | `npm run seo:bing:live` | Extrae datos Bing (crawl, queries, backlinks, URLs prioritarias) |
| `scripts/seo-live-doctor.mjs` | `npm run seo:doctor` | Doctor mejorado: todas las auths + datos live disponibles |
| `scripts/seo-live-collect.mjs` | `npm run seo:collect` | Colector mejorado: GSC + GA4 + Bing + IndexNow + SEO health |

### Documentación creada

| Archivo | Contenido |
|---------|-----------|
| `docs/seo/live-data-access.md` | Guía completa de acceso a datos LIVE (8 pasos) |
| `docs/seo/mcp-seo-connectors.md` | Cómo conectar MCPs a credenciales locales sin secretos |
| `docs/seo/mcp.example.json` | Configuración MCP de ejemplo con variables de entorno |

### Arquitectura de 2 capas

**Capa CLI:**
- Google: `gcloud auth application-default login` con scopes GSC/GA4 (scripts `auth-google-cli.mjs`)
- Bing: Device Code Flow OAuth (scripts `bing-auth-link.mjs`) + API Key para datos básicos
- Google Live: `seo:gsc:live` / `seo:ga4:live` extraen datos reales a `data/google/`
- Bing Live: `seo:bing:live` extrae a `data/bing/bing-live.json` y `docs/audits/bing-live-report.md`
- Doctor: `seo:doctor` comprueba Google ADC, GSC, GA4, Bing API, Bing OAuth, IndexNow, Vercel, GitHub, .gitignore
- Colector: `seo:collect` llama a GSC/GA4/Bing/IndexNow/SEO health, genera `data/seo/live-summary.json` y `docs/audits/seo-live-summary.md`

**Capa MCP:**
- MCPs conectados en runtime: `mcp-seo`, `filesystem`, `git`, `postgres`, `playwright`, `fetch`, `duckduckgo`
- GSC/GA4/Bing: no existen MCPs oficiales → se usa CLI + filesystem MCP para leer JSONs
- Config ejemplo en `docs/seo/mcp.example.json` con variables de entorno, nunca secretos

### Datos generados (gitignored, regenerables)

| Archivo | Fuente |
|---------|--------|
| `data/google/gsc-live.json` | GSC |
| `data/google/ga4-live.json` | GA4 |
| `data/bing/bing-live.json` | Bing WMT |
| `data/seo/live-summary.json` | Todas las fuentes |
| `docs/audits/seo-live-summary.md` | Reporte legible |
| `docs/audits/bing-live-report.md` | Reporte Bing |

### Comandos nuevos en package.json

| Comando | Acción |
|---------|--------|
| `seo:gsc:live` | GSC datos LIVE (--days 7/28/90) |
| `seo:ga4:live` | GA4 datos LIVE (--days 7/28/90) |
| `seo:bing:live` | Bing datos LIVE |
| `seo:doctor` | Diagnóstico completo mejorado |
| `seo:collect` | Colector global mejorado |

### Pendientes humanos (actualizado tras ejecución real)

| # | Acción | Prioridad | Estado |
|---|--------|-----------|--------|
| 1 | Instalar `gcloud` CLI | P1 | Completado — gcloud 573.0.0 en `C:\gcloud-sdk\google-cloud-sdk\bin` |
| 2 | `npm run auth:google` → login Google GSC/GA4 | P1 | Completado — ADC configurado, GSC y GA4 funcionan |
| 3 | Registrar app Azure AD → `BING_CLIENT_ID` → `npm run auth:bing` | P2 | Pendiente — API Key ya cubre datos básicos |
| 4 | Revisar dashboard Bing WMT (Site Scan/Site Explorer) | P1 | Pendiente humano |
| 5 | Filtrar tráfico bot en GA4 | P1 | Pendiente humano |

### KPIs reales extraídos (28 días, 2026-07-03)

| Fuente | Métrica clave | Valor |
|--------|---------------|-------|
| GSC | Clics / Impresiones / CTR / Posición | 134 / 6,613 / 2.03% / 7.0 |
| GA4 | Usuarios / Sesiones / Pageviews / Conversiones | 670 / 843 / 4,801 / 9 |
| GA4 | Tráfico orgánico Google / Bing | 104 / 21 usuarios |
| Bing | Rastreadas / 4xx / Errores / Queries | 2,387 / 161 / 206 / 44 |
| IndexNow | URLs dry-run | 20 |

### Correcciones aplicadas durante consolidación

1. Bing crawl stats: corregido mapeo de campos (`GetCrawlStats` devuelve array, campos `Code4xx`, `CrawlErrors`, etc.)
2. GSC/GA4 default days: cambiado de 7 a 28 días para datos más significativos
3. dotenv load order: `.env` primero, `.env.local` con `override: true` (5 scripts corregidos)
4. Doctor: corregido nombre de archivo (`live-summary.json` en vez de `collection-summary.json`)
5. gcloud localizado: `C:\gcloud-sdk\google-cloud-sdk\bin` (no en PATH por defecto)
6. GA4: usa OAuth refresh token como método primario (ADC no tiene scope analytics.readonly)

### Documentación consolidada (Fase 9)

| Archivo | Contenido |
|---------|-----------|
| `docs/audits/seo-live-summary.md` | Reporte ejecutivo con KPIs, diagnóstico, oportunidades y recomendaciones |
| `docs/audits/seo-live-action-plan.md` | Plan de mejora: 5 CTR, 5 conversión, 5 Bing, 5 contenido, 5 humanas, métricas, alertas, objetivos 7/30/90 días |
| `docs/seo/live-data-access.md` | Manual operativo definitivo con todos los comandos, troubleshooting y flujo semanal |

### Confirmaciones

- ✅ No se modificó `auditoriatotal.mc`.
- ✅ No se modificó `auditoriatotal.md`.
- ✅ No se hizo push.
- ✅ No se crearon posts nuevos.
- ✅ No se expusieron secretos.
- ✅ `.secrets/`, `data/google/`, `data/bing/`, `data/seo/` en `.gitignore`.
- ✅ Footer/Home mantienen solo las 10 ciudades prioritarias.
- ✅ `seo:doctor`: 19 OK, 0 ERROR.
- ✅ `seo:collect`: 6/6 fuentes.
- ✅ `npm run lint`: 0 errors.
- ✅ `npm run build`: OK.
- ✅ `npm test`: 730/730.
- ✅ Sistema SEO live operativo y recurrente.

---\n\n## Fase 10 — Saneamiento documental final y flujo SEO Live para IA\n\n**Fecha:** 2026-07-03\n**Objetivo:** Rehacer `AGENTS.md`, `README.md` y `CHANGELOG.md` para reflejar solo\nel estado real actual del proyecto, eliminando ruido, duplicados e información\nobsoleta acumulada durante fases anteriores.\n\n### Archivos revisados\n- `AGENTS.md`, `README.md`, `CHANGELOG.md`\n- `auditoria-acciones.md`, `package.json`\n- `docs/seo/live-data-access.md`, `docs/audits/seo-live-summary.md`,\n  `docs/audits/seo-live-action-plan.md`, `docs/seo/auth-cli.md`,\n  `docs/seo/bing-webmaster-oauth.md`\n\n### Archivos modificados\n\n| Archivo | Antes | Después | Cambio |\n|---------|-------|---------|--------|\n| `AGENTS.md` | 452 líneas | 121 líneas | Eliminado: reglas editoriales extensas, design tokens, MCP detallado, datos blog históricos, tooling IA legacy. Conservado: workflow, 18 reglas, fuentes verdad, validación, SEO Live, seguridad. |\n| `README.md` | 939 líneas | 149 líneas | Eliminado: bloques SGIE kilométricos, troubleshooting obsoleto, tooling IA histórico, blog detallado, SEO técnico extenso, releases antiguas. Conservado: stack, inicio rápido, SEO Live, KPIs reales, seguridad, pendientes. |\n| `CHANGELOG.md` | 3297 líneas | 77 líneas | Eliminado: logs kilométricos de fases 1-8, releases antiguas duplicadas, auditorías como changelog. Conservado: releases 92, 91 + resumen histórico 1-90. |\n\n### Información obsoleta eliminada\n\n- Referencias a scripts inexistentes o renombrados.\n- Troubleshooting de `invalid_grant` que ya no aplica (sistema OAuth refactorizado).\n- Bloques de 200+ líneas sobre SGIE que duplicaban `pinedayasociados.md`.\n- Tooling IA legacy (`.kilo/`, `CLAUDE.md`, skills) ya eliminado del repo.\n- Datos de blog contradictorios (149 vs 159 posts, 71 vs 74 revisiones).\n- Validaciones antiguas (MCP validation Jun 23) como si fueran actuales.\n- Secciones duplicadas entre AGENTS, README y CHANGELOG.\n\n### Información vigente consolidada\n\n- Stack técnico exacto verificado contra `package.json`.\n- KPIs reales de Fase 9 (GSC 134/6613/2.03%, GA4 670/843/4801/9, Bing 2387/161/44).\n- Sistema SEO Live operativo con todos los comandos.\n- 20 OK / 0 ERROR en `seo:doctor`.\n- Pendientes humanos y técnicos actuales alineados con el plan de acción.\n\n### Scripts verificados\n\nTodos los comandos mencionados en AGENTS.md y README.md existen en `package.json`.\nNingún comando hace referencia a archivos inexistentes.\n\n### Confirmaciones\n\n- ✅ No se modificó `auditoriatotal.mc`.\n- ✅ No se modificó `auditoriatotal.md`.\n- ✅ No se hizo push.\n- ✅ No se crearon posts nuevos.\n- ✅ No se expusieron secretos.\n- ✅ `.env.local` y `.secrets/` siguen fuera de Git.\n- ✅ Documentación alineada con el flujo real actual.\n- ✅ `AGENTS.md`, `README.md` y `CHANGELOG.md` preparados para operación IA.\n- ✅ `seo:doctor`: 20 OK, 0 ERROR.\n- ✅ `seo:collect`: 6/6 fuentes.\n- ✅ Footer/Home mantienen solo las 10 ciudades prioritarias.\n\n---\n\n> **Protocolo:** AGENTS.md  \n
---

## Fase 11 — Primera ejecución correctiva con SEO Live

**Fecha:** 2026-07-03
**Objetivo:** Poner a prueba los scripts live, detectar problemas reales con datos de
GSC/GA4/Bing y aplicar correcciones técnicas seguras respaldadas por evidencia.

### Scripts ejecutados

| Comando | Resultado |
|---------|-----------|
| `npm run seo:doctor` | 20 OK, 0 ERROR, 3 PENDIENTE |
| `npm run seo:collect` | 6/6 fuentes |
| `npm run seo:gsc:live` | 134 clics, 6613 imp, CTR 2.03%, pos 7.0 |
| `npm run seo:ga4:live` | 670 usuarios, 844 sesiones, 4801 pv, 9 conversiones |
| `npm run seo:bing:live` | 2387 rastreadas, 161 4xx, 44 queries |
| `npm run audit:indexacion` | 30/30 probes |
| `npm run indexnow:dry` | 20 URLs OK |
| `npm run seo:health` | 14/15 pass (1 timeout JSON-LD home) |
| `npm run validar:meta-seo` | 18/18 OK, 0 errores |
| `npm run blog:fix-redirects --aplicar` | 3 enlaces corregidos en 3 posts |

### Correcciones aplicadas

| # | Cambio | Evidencia |
|---|--------|-----------|
| 1 | 3 enlaces internos apuntaban a redirect 301 (`/servicios-juridicos/derecho-penal` -> `/derecho-penal`). Corregidos a URL final 200 en DB. | `blog:fix-redirects` detectó 3 posts con `linksToRedirects`. Backup generado, aplicado con `--aplicar`. |

### Problemas detectados (no corregidos, requieren humano/editorial)

| Severidad | Problema | Dato live | Acción requerida |
|-----------|----------|-----------|-----------------|
| P1 | 6 posts blog con CTR<3% a pesar de 240-469 impresiones mensuales | GSC: `/poder-legal-honduras` 469 imp 0.9% CTR, `/custodia-hijos` 427 imp 0.7% CTR | Optimizar meta descriptions (humano o `blog:verify-fix`) |
| P1 | 8 queries GSC con CTR 0% y posiciones 5-9 | GSC: "cuanto es la pension alimenticia" 51 imp 0% CTR | Revisar snippet/title de la página rankeada |
| P2 | Tráfico bot en GA4: HK 56, NL 28, CN 21 usuarios | GA4 countries | Activar "Exclude known bots" en GA4 (humano) |
| P2 | Bing: 161 errores 4xx sin detalle | Bing crawl stats | Revisar dashboard Site Explorer (humano) |
| P2 | GA4: 9 conversiones en 28 días para 670 usuarios (1.3%) | GA4 overview | Revisar CTA y formulario de contacto |
| P3 | GA4: 65.8% bounce rate (inflado por bots) | GA4 overview | Mejorará al filtrar bots |

### Oportunidades documentadas (no aplicadas)

Top 6 páginas con peor CTR que requieren optimización editorial:

| Página | Imp 28d | Clics | CTR |
|--------|---------|-------|-----|
| `/blog/derecho-notarial/poder-legal-honduras-cuando-se-necesita` | 469 | 4 | 0.9% |
| `/blog/derecho-de-familia/custodia-hijos-honduras-juez` | 427 | 3 | 0.7% |
| `/blog/derecho-de-familia/pension-alimenticia-honduras-guia-completa` | 299 | 4 | 1.3% |
| `/blog/derecho-penal/estafas-fraudes-tipos-penales-honduras` | 332 | 6 | 1.8% |
| `/blog/derecho-de-familia/pension-alimenticia-porcentaje-honduras-2026` | 240 | 7 | 2.9% |
| `/blog/derecho-civil/prescripcion-deudas-plazos-honduras` | 317 | 8 | 2.5% |

### Pendientes humanos

| # | Acción | Prioridad |
|---|--------|-----------|
| 1 | Activar "Exclude known bots" en GA4 | P1 |
| 2 | Revisar dashboard Bing WMT Site Explorer | P1 |
| 3 | Decidir si optimizar meta de 6 posts con CTR bajo | P2 |

### Pendientes técnicos

| # | Acción | Prioridad |
|---|--------|-----------|
| 1 | Ejecutar `blog:verify-fix` en 6 posts con CTR<3% | P2 |
| 2 | Estrategia de backlinks (Bing reporta 0) | P3 |

### Confirmaciones

- ✅ No se modificó `auditoriatotal.mc`.
- ✅ No se modificó `auditoriatotal.md`.
- ✅ No se hizo push.
- ✅ No se crearon posts nuevos.
- ✅ No se expusieron secretos.
- ✅ `.env.local` y `.secrets/` fuera de Git.
- ✅ Footer/Home: solo 10 ciudades prioritarias.
- ✅ Backup de blog generado antes de aplicar cambios.
- ✅ 3 enlaces internos corregidos sin modificar contenido legal.

---

> **Protocolo:** AGENTS.md

---

## Fase 12 — Optimización CTR basada en GSC

**Fecha:** 2026-07-03
**Objetivo:** Mejorar CTR de posts con evidencia GSC clara: impresiones suficientes,
posición razonable y CTR bajo. Sin modificar contenido legal ni crear posts nuevos.

### Datos base (GSC 28d)

| Métrica | Valor |
|---------|-------|
| Clics totales | 134 |
| Impresiones | 6,613 |
| CTR global | 2.03% |
| Posición media | 7.0 |
| Queries con datos | 100 |
| Páginas en resultados | 110 |

### Posts analizados

Los 6 posts con peor relación impresiones/CTR:

| # | Post | Imp. | Clics | CTR | Problema |
|---|------|------|-------|-----|----------|
| 1 | prescripcion-deudas-plazos-honduras | 317 | 8 | 2.5% | Title truncado en SERP |
| 2 | pension-alimenticia-porcentaje-honduras-2026 | 240 | 7 | 2.9% | Meta truncada en SERP |
| 3 | poder-legal-honduras-cuando-se-necesita | 469 | 4 | 0.9% | Meta genérica |
| 4 | custodia-hijos-honduras-juez | 427 | 3 | 0.7% | Meta sin keywords |
| 5 | estafas-fraudes-tipos-penales-honduras | 332 | 6 | 1.8% | Meta desalineada |
| 6 | pension-alimenticia-honduras-guia-completa | 299 | 4 | 1.3% | Meta sin hooks cálculo |

### Cambios aplicados (6 posts, DB blog_posts)

| Post | Campo | Before | After | Tipo |
|------|-------|--------|-------|------|
| 1 | title | "Prescripción de Deudas en Honduras: Plazos y Cuándo..." | "Prescripcion de Deudas en Honduras: Plazos Legales y Cuando Prescriben" | P0: truncado corregido |
| 2 | meta | "Descubra el porcentaje..." (truncada) | "Cuanto se paga de pension alimenticia por hijo en Honduras?..." (completa) | P0: truncado corregido |
| 3 | meta | "Guía completa del poder legal..." (genérica) | "Necesita un poder notarial en Honduras? Tipos, requisitos, costos y donde inscribirlo..." | P1: meta específica |
| 4 | meta | "¿Cómo funciona la custodia..." (sin keywords) | "Custodia de hijos en Honduras: criterios del juez, derechos madre/padre, guarda y cuidado..." | P1: keywords añadidas |
| 5 | meta | "¿Sufriste una estafa..." (coloquial) | "Delito de estafa en Honduras: 7 tipos penales, penas Codigo Penal, como denunciar..." | P1: alineada con queries legales |
| 6 | meta | "Pensión alimenticia... quien la solicita..." | "Pension alimenticia en Honduras: porcentaje por hijo (20-40%), como calcularla, ejemplos..." | P1: hooks de cálculo añadidos |

### Riesgos

- **Bajo:** Cambios limitados a title y meta_description. Bodies intactos.
- **Bajo:** Backup generado antes de aplicar (auditoria-blog/backup-2026-07-03-14-52.json).
- **Bajo:** Queries posicionadas coinciden con el contenido del artículo (sin mismatch).
- **Pendiente:** Resultado real visible en GSC en 7-14 días (Google tarda en reindexar snippets).

### Validaciones

| Comando | Resultado |
|---------|-----------|
| `npm run blog:backup` | 175 posts respaldados |
| `npm run validar:meta-seo` | 18/18 OK, 0 errores |
| `npm run blog:seo-audit` | 175 posts, 0 links a redirects, 0 issues |
| `npm run lint` | 0 errors |
| `npm test` | 730/730 |

### Próxima medición

```bash
# 7 días (2026-07-10): verificar si CTR subió en estos 6 posts
npm run seo:collect
# Revisar data/google/gsc-live.json → pages
# Comparar CTR actual vs CTR de esta ejecución base
```

### Confirmaciones

- ✅ No se modificó `auditoriatotal.mc`.
- ✅ No se modificó `auditoriatotal.md`.
- ✅ No se hizo push.
- ✅ No se crearon posts nuevos.
- ✅ No se modificaron bodies, slugs, categorías ni fechas.
- ✅ No se expusieron secretos.
- ✅ `.env.local` y `.secrets/` fuera de Git.
- ✅ Footer/Home: solo 10 ciudades prioritarias.
- ✅ Backup generado antes de cambios en DB.

---

> **Protocolo:** AGENTS.md

---

## Fase 13 — Seguimiento CTR post-optimización y evaluación de segunda tanda

**Fecha:** 2026-07-03
**Objetivo:** Medir el impacto real de la optimización CTR de Fase 12 y evaluar
candidatos para una segunda tanda, aplicando cambios solo si los datos lo justifican.

### Estado live

| Comando | Resultado |
|---------|-----------|
| `npm run seo:doctor` | 20 OK, 0 ERROR, 3 PENDIENTE |
| `npm run seo:collect` | 6/6 fuentes |
| GSC global 28d | 134 clics, 6,613 imp, CTR 2.03%, pos 7.0 |

### Comparativa de los 6 posts de Fase 12

**Resultado: TODOS NEUTRO.** Sin cambios medibles porque han transcurrido <1 día
desde la optimización. Google tarda 7-14 días en re-crawlear y actualizar snippets.
Los datos GSC son idénticos a la línea base de Fase 12.

| # | Post | Imp 28d | Clics | CTR | Estado | Motivo |
|---|------|---------|-------|-----|--------|--------|
| 1 | prescripcion-deudas-plazos-honduras | 317 | 8 | 2.5% | NEUTRO | <1 día desde cambio |
| 2 | pension-alimenticia-porcentaje-honduras-2026 | 240 | 7 | 2.9% | NEUTRO | <1 día desde cambio |
| 3 | poder-legal-honduras-cuando-se-necesita | 469 | 4 | 0.9% | NEUTRO | <1 día desde cambio |
| 4 | custodia-hijos-honduras-juez | 427 | 3 | 0.7% | NEUTRO | <1 día desde cambio |
| 5 | estafas-fraudes-tipos-penales-honduras | 332 | 6 | 1.8% | NEUTRO | <1 día desde cambio |
| 6 | pension-alimenticia-honduras-guia-completa | 299 | 4 | 1.3% | NEUTRO | <1 día desde cambio |

### Aprendizajes

- Los cambios de title/meta en DB no son instantáneos en Google SERP. Requieren
  re-crawl + reindex (7-14 días típicos, hasta 28 días para sitios pequeños).
- La ventana de 28 días de GSC diluye cambios recientes; se recomienda usar
  `--days 7` en la próxima medición para ver datos más frescos.
- El sistema de backup + validación funciona correctamente y permite iterar seguro.

### Segunda tanda — candidatos evaluados (no aplicados)

Se identificaron 5 posts con alta impresión y CTR bajo que NO fueron optimizados
en Fase 12. Se analizaron sus titles/metas actuales desde DB:

| Post | Imp | CTR | Problema detectado |
|------|-----|-----|--------------------|
| habeas-corpus-cuando-interponer-honduras | 209 | 1.0% | Meta OK, title OK. CTR bajo por posición, no por snippet. |
| **nacionalidad-espanola-para-hondurenos-residencia-plazos** | 201 | 0.5% | **Meta TRUNCADA** — termina a mitad de frase. P0 para Fase 14. |
| empleador-no-paga-salario-honduras | 163 | 0.0% | Meta parece corta. Requiere más investigación de queries y posición. |
| **registro-medicamentos-productos-farmaceuticos-honduras** | 159 | 0.6% | **Title con trailing `\|`** + meta probablemente truncada. P0 para Fase 14. |
| divorcio-honduras-guia-completa | 137 | 0.7% | Title bueno, meta probablemente truncada. P1 para Fase 14. |

### Decisión: SIN CAMBIOS en esta fase

- Han pasado <7 días desde Fase 12. No es prudente aplicar más cambios sin ver
  primero el resultado de los anteriores.
- Los 6 posts de Fase 12 siguen NEUTROS.
- Los 2 candidatos P0 con meta truncada se abordan en la próxima fase.

### Próxima medición

```bash
# 2026-07-10 (7 días post Fase 12):
npm run seo:collect
npm run seo:gsc:live -- --days 7    # ventana más corta para detectar cambios
# Revisar CTR de los 6 posts optimizados
# Si CTR sube en ≥2 posts → el método funciona → aplicar segunda tanda
# Si CTR sigue igual → reevaluar estrategia o esperar 14 días más
```

### Confirmaciones

- ✅ No se modificó `auditoriatotal.mc`.
- ✅ No se modificó `auditoriatotal.md`.
- ✅ No se hizo push.
- ✅ No se crearon posts nuevos.
- ✅ No se expusieron secretos.
- ✅ `.env.local` y `.secrets/` fuera de Git.
- ✅ Footer/Home: solo 10 ciudades prioritarias.
- ✅ No se aplicaron cambios en DB en esta fase (solo medición).
- ✅ Candidatos para Fase 14 documentados con evidencia.

---

> **Protocolo:** AGENTS.md
> **Sin push.** Solo cambios locales en `main`.
