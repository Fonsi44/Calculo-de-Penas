# Plan de Acción SEO — Post-Auditoría 2026-07-08

**Proyecto:** Pineda y Asociados (`https://www.pinedayasociadoshn.com`)
**Fecha:** 2026-07-08
**Documento hermano:** `docs/audits/auditoria-bing-webmaster-2026-07-08.md` (auditoría completa)
**Clasificación:** `PROPUESTA` (no se aplican cambios de código; todo requiere autorización previa)

---

## Resumen ejecutivo

La auditoría del 2026-07-08 (88 % completada) identificó **5 líneas de trabajo operativas** que se desglosan en este plan ejecutable. La infraestructura SEO base está sana; el trabajo pendiente es de **indexación, enlazado interno y optimización de CTR**.

**Estado validado en esta sesión:**
- Bing OAuth: `❌ No autorizado` — `BING_CLIENT_ID` configurado, device flow listo para ejecutar.
- 10 URLs comerciales prioritarias: **todas HTTP 200**, sin `X-Robots-Tag` restrictivo.
- 11 URLs 4xx del informe Ahrefs: **5 ya resuelven a 200 vía redirect existente**, **6 siguen 404** (paths dobles por enlaces externos entrantes).
- Búsqueda exhaustiva en `app/`, `components/`, `lib/`: **0 hrefs relativos en código fuente** → las URLs 40xx no se generan internamente.
- Queries de pensión alimenticia: **152 impresiones / 5 clics (CTR 3,3 %)** en 28 días. Query ganador con CTR 10,71 % demuestra el patrón a replicar.

**Bloques de trabajo (con porcentaje de preparación completado):**

| Bloque | Estado | Prep. completada |
|---|---|---|
| 1. Bing OAuth | Instrucciones listas, token pendiente de auth manual | 100 % plan / 0 % ejecución |
| 2. Indexación Google | Checklist 10 URLs + señales validadas | 100 % plan / 0 % ejecución |
| 3. Enlaces rotos | Diagnóstico completo, propuesta de 6 redirects | 100 % plan / 0 % ejecución |
| 4. Páginas huérfanas | Propuesta de enlazado contextual | 100 % plan / 0 % ejecución |
| 5. CTR pensión alimenticia | Title/meta actuales extraídos, propuestas redactadas | 100 % plan / 0 % ejecución |
| Documentación | Este documento | 100 % |

---

## Estado actual (validado 2026-07-08)

### Bing OAuth

```
$ npm run bing:auth:status
❌ No autorizado — no hay token guardado.
Ejecuta: npm run bing:auth
```

```
$ npm run seo:doctor  (extracto)
── BING (WMT / IndexNow) ──
  ✅ Bing API Key — INDEXNOW_KEY configurada
  ✅ Bing OAuth Client — BING_CLIENT_ID configurada
  ⬜ Bing OAuth token — ejecuta npm run auth:bing
  ✅ Bing datos LIVE — 3330 rastreadas, 83 queries
```

**Conclusión:** el `BING_CLIENT_ID` ya está en `.env.local`. Solo falta completar el device flow interactivo (5 min). No faltan variables de entorno.

### URLs 4xx (verificación live 2026-07-08)

| URL | Status | Estado |
|---|---|---|
| `/articulos/declaracion-isr-personas-naturales` | 200 → `/blog/tributario/impuesto-renta-personas-fisicas-honduras` | ✅ Ya redirige |
| `/articulos/facturacion-electronica-honduras` | 200 → `/blog/tributario/facturacion-electronica-requisitos-sar` | ✅ Ya redirige |
| `/articulos/isv-en-honduras` | 200 → `/blog/tributario/isv-impuesto-venta-tasas-obligaciones-honduras` | ✅ Ya redirige |
| `/contacto-tegucigalpa` | 200 → `/solicitar-consulta` | ✅ Ya redirige |
| `/servicios/gestoria-ambiental-corporativa` | 200 → `/servicios-juridicos/ambiental-regulatorio` | ✅ Ya redirige |
| `/blog/tributario/blog/derecho-laboral/abogado-laboral-choluteca` | **404** | ❌ Pendiente redirect |
| `/blog/tributario/blog/tributario/facturacion-electronica-requisitos-sar` | **404** | ❌ Pendiente redirect |
| `/blog/tributario/solicitar-consulta` | **404** | ❌ Pendiente redirect |
| `/blog/derecho-de-familia/solicitar-consulta` | **404** | ❌ Pendiente redirect |
| `/blog/derecho-laboral/solicitar-consulta` | **404** | ❌ Pendiente redirect |
| `/blog/tributario/abogados-en-choluteca` | **404** | ❌ Pendiente redirect |

**Origen confirmado:** NO son enlaces internos del código fuente (búsqueda exhaustiva: 0 hrefs relativos en `app/`, `components/`, `lib/`, ni en `post.body` en DB). Son **enlaces entrantes externos** indexados por Ahrefs. El fix es exclusivamente redirects.

---

## Acciones críticas (semana 1)

### ACCIÓN CRÍTICA 1 — Autenticar Bing OAuth

**Bloque 1** · Severidad: alta · Esfuerzo: 5 min · Responsable: SEO/Infraestructura

### ACCIÓN CRÍTICA 2 — Solicitar indexación manual en GSC (10 URLs)

**Bloque 2** · Severidad: crítica · Esfuerzo: 30 min · Responsable: SEO

### ACCIÓN CRÍTICA 3 — Añadir redirects para 6 URLs 404

**Bloque 3** · Severidad: alta · Esfuerzo: 15 min · Responsable: Desarrollo · ⚠️ Requiere tocar `next.config.ts` (zona protegida AGENTS.md §7)

---

## Bloque 1 — Bing OAuth: checklist de ejecución

### 1.1 Instrucciones device flow (manual, 5 min)

El script `npm run auth:bing` (`scripts/bing-auth-link.mjs`) ya está implementado y `BING_CLIENT_ID` está configurado. Pasos:

```
# 1. Iniciar el device flow
npm run auth:bing

# El script imprimirá:
#   ─ un enlace (https://microsoft.com/devicelogin)
#   ─ un código de 8-12 caracteres
#   ─ "Esperando autorización (expira en 900s)..."

# 2. En el navegador (cuenta Microsoft del despacho):
#    - Abrir https://microsoft.com/devicelogin
#    - Pegar el código
#    - Iniciar sesión con la cuenta que administra Bing WMT
#    - Aprobar el consentimiento

# 3. El script detecta la autorización y guarda el token en:
#    .secrets/bing-oauth.json (gitignored, NUNCA commitear)

# 4. Verificar
npm run bing:auth:status
# Debe mostrar: ✅ Token válido
```

### 1.2 Comando para refrescar datos tras OAuth

```bash
npm run seo:bing:live    # extrae crawl + queries + backlinks + url info (con OAuth)
npm run seo:doctor       # debe mostrar ✅ Bing OAuth token
```

### 1.3 Archivos que deben cambiar tras OAuth

| Archivo | Cambio esperado |
|---|---|
| `.secrets/bing-oauth.json` | NUEVO (token + refresh_token). Gitignored. |
| `data/bing/bing-live.json` | `authMode: "OAuth"`, `queries[].position` y `ctr` con valores reales, `priorityUrls[].httpCode` con códigos HTTP, `backlinks.totalLinks > 0` |
| `docs/audits/bing-live-report.md` | Tablas con posición/CTR/HTTP rellenos |

### 1.4 Si OAuth falla (diagnóstico)

| Síntoma | Causa probable | Solución |
|---|---|---|
| `invalid_client` | `BING_CLIENT_ID` incorrecto o app sin "public client flows" | Azure AD → Authentication → Allow public client flows → Yes |
| `invalid_scope` | App sin permiso Bing WMT `user_impersonation` | Azure AD → API Permissions → Grant admin consent |
| `authorization_declined` | Usuario rechazó | Repetir flujo |
| `expired_token` | Código caducado (15 min) | Repetir `npm run bing:auth` |

**Variables de entorno aplicables** (referencia `.env.example`):

```bash
BING_CLIENT_ID=<Application (client) ID de Azure AD>  # YA CONFIGURADO
BING_TENANT=common                                     # YA CONFIGURADO
INDEXNOW_KEY=<clave IndexNow>                          # YA CONFIGURADO (API Key básica)
```

---

## Bloque 2 — Indexación Google: checklist manual GSC

### 2.1 Las 10 URLs comerciales prioritarias

Seleccionadas de `data/seo/canonical-paths.json` (priority ≥ 0,9) y validadas HTTP 200 el 2026-07-08. Todas están en el sitemap, sin `X-Robots-Tag` restrictivo, y son las que generan/should generar valor comercial.

| # | URL | Prioridad | Status | Motivo de prioridad |
|---|---|---|---|---|
| 1 | `/` | 1,0 | 200 ✅ | Home (ya indexada PASS) — refrescar |
| 2 | `/servicios-juridicos` | 1,0 | 200 ✅ | Hub de 13 servicios — NUNCA rastreada por Bing (0001-01-01) |
| 3 | `/derecho-penal` | 1,0 | 200 ✅ | Hub penal, YMYL alto volumen |
| 4 | `/despacho` | 0,9 | 200 ✅ | Identidad del bufete (query "despacho legal" pos 41,5) |
| 5 | `/abogados-en-nacaome` | 0,9 | 200 ✅ | Sede principal, geolocal |
| 6 | `/abogados-en-choluteca` | 0,9 | 200 ✅ | Ciudad más grande del sur |
| 7 | `/abogados-en-san-lorenzo` | 0,9 | 200 ✅ | Puerto comercial |
| 8 | `/hondurenos-en-espana` | 0,8 | 200 ✅ | Vertical internacional (281 usuarios ES) |
| 9 | `/solicitar-consulta` | — | 200 ✅ | Página de conversión principal |
| 10 | `/servicios-juridicos/derecho-laboral` | 0,5 | 200 ✅ | Servicio con más impresiones GSC |

### 2.2 Checklist GSC (ejecución manual, ~10 min/día)

> Google limita a ~10 solicitudes de indexación/día. Hacer en 1-2 tandas.

```
Para CADA URL (1-10):
  1. GSC → "Inspección de URLs" → pegar URL completa
  2. Verificar:
     [ ] "URL está en Google" → si "No indexada", continuar
     [ ] Canonical declarada = self (la propia URL)
     [ ] Sin "bloqueada por robots.txt"
     [ ] Sin "redirección"
  3. Click "Solicitar indexación"
  4. Confirmar "Se ha solicitado la indexación"
```

### 2.3 Validación de señales SEO (estado por URL)

> Marcado `VALIDADO` donde hay evidencia directa; `PENDIENTE` donde falta inspección GSC puntual.

| Señal | Estado | Evidencia |
|---|---|---|
| HTTP 200 | ✅ VALIDADO | fetch live 2026-07-08 (10/10 OK) |
| En sitemap.xml | ✅ VALIDADO | health-check: "213 URLs, rutas prioritarias presentes" |
| `X-Robots-Tag` no restrictivo | ✅ VALIDADO | 10/10 sin header restrictivo |
| Canonical self | ⚠️ PENDIENTE | Validar puntualmente en GSC (la home ya confirmada PASS) |
| Título único presente | ⚠️ PENDIENTE | Audit Ahrefs reporta 128 títulos largos — revisar estas 10 |
| Meta description presente | ⚠️ PENDIENTE | Mismo |
| Enlaces internos entrantes | ⚠️ PENDIENTE | 8 landings huérfanas (ver Bloque 4) |
| Indexación real en Google | ❌ NO VALIDADO | Solo `/` confirmada; 9 pendientes de rastreo |

---

## Bloque 3 — Enlaces rotos: propuesta de reparación

### 3.1 Diagnóstico

- **11 URLs 4xx** reportadas por Ahrefs (2026-07-07).
- **5 ya resuelven a 200** vía redirects existentes en `next.config.ts` (verificadas live 2026-07-08).
- **6 siguen 404** — todas con patrón de **path doble** o **relativo mal resuelto** desde un referer externo bajo `/blog/{categoria}/`.

### 3.2 Origen confirmado

Búsqueda exhaustiva en código fuente (`app/`, `components/`, `lib/`) y en `post.body` (DB): **0 enlaces relativos**. El auto-linker (`blog-context-linker.ts`), el entity-dictionary y todos los componentes emiten hrefs absolutos con `/`. **Las URLs 404 provienen de enlaces entrantes externos** indexados por Ahrefs.

### 3.3 Propuesta de redirects (NO aplicar — `next.config.ts` es zona protegida)

> ⚠️ **RESTRICCIÓN AGENTS.md §7:** "Redirects 301 de `next.config.ts`" está en la lista de archivos que la IA no debe tocar. Esta es una **propuesta conceptual** para que Desarrollo la aplique tras autorización.

| # | Origen 404 (source) | Destino corregido (destination) | Tipo | Riesgo |
|---|---|---|---|---|
| R1 | `/blog/:cat/solicitar-consulta` | `/solicitar-consulta` | Wildcard | Bajo |
| R2 | `/blog/tributario/abogados-en-choluteca` | `/abogados-en-choluteca` | Exacta | Bajo |
| R3 | `/blog/tributario/blog/derecho-laboral/abogado-laboral-choluteca` | `/blog/derecho-laboral/abogado-laboral-choluteca` | Exacta | Bajo |
| R4 | `/blog/tributario/blog/tributario/facturacion-electronica-requisitos-sar` | `/blog/tributario/facturacion-electronica-requisitos-sar` | Exacta | Bajo |

**Patch conceptual (formato `next.config.ts` redirects):**

```typescript
// ⚠️ PROPUESTA — no aplicar sin autorización. Zona protegida AGENTS.md §7.
async redirects() {
  return [
    // ... redirects existentes ...

    // R1: /blog/{cualquier-categoria}/solicitar-consulta → /solicitar-consulta
    {
      source: '/blog/:cat/solicitar-consulta',
      destination: '/solicitar-consulta',
      permanent: true,
    },
    // R2
    {
      source: '/blog/tributario/abogados-en-choluteca',
      destination: '/abogados-en-choluteca',
      permanent: true,
    },
    // R3
    {
      source: '/blog/tributario/blog/derecho-laboral/abogado-laboral-choluteca',
      destination: '/blog/derecho-laboral/abogado-laboral-choluteca',
      permanent: true,
    },
    // R4
    {
      source: '/blog/tributario/blog/tributario/facturacion-electronica-requisitos-sar',
      destination: '/blog/tributario/facturacion-electronica-requisitos-sar',
      permanent: true,
    },
  ];
}
```

### 3.4 Validación posterior (tras aplicar)

```bash
# Verificar que las 6 URLs ya no dan 404
node -e "
const urls=['/blog/tributario/solicitar-consulta','/blog/derecho-de-familia/solicitar-consulta','/blog/derecho-laboral/solicitar-consulta','/blog/tributario/abogados-en-choluteca','/blog/tributario/blog/derecho-laboral/abogado-laboral-choluteca','/blog/tributario/blog/tributario/facturacion-electronica-requisitos-sar'];
// ... fetch cada una, esperar 301→200
"

# Tras deploy, re-crawl Ahrefs en 14 días: las 6 deben desaparecer de "4xx-page"
```

### 3.5 Fix alternativo (NO requiere tocar zona protegida)

Si no se quiere tocar `next.config.ts`, alternativa de **menor calidad pero segura**: dejar que las 6 URLs sigan 404 y, a medio plazo, Ahrefs las depura de su índice al confirmar que no hay enlaces internos指向 ellas. **No recomendado** — el crawl budget de Bing (362 errores 4xx/28d) justifica el fix.

---

## Bloque 4 — Páginas huérfanas: propuesta de enlazado interno

### 4.1 Las 8 páginas huérfanas (0 enlaces internos)

Fuente: Ahrefs `orphan-page` (2026-07-07). Todas están en sitemap (rastreables) pero ninguna recibe link equity interna.

| Página huérfana | Tipo |
|---|---|
| `/abogados-en-langue` | Ciudad |
| `/abogados-en-caridad` | Ciudad |
| `/abogados-en-san-antonio-de-flores` | Ciudad |
| `/abogados-en-concepcion-de-maria` | Ciudad |
| `/abogados-en-alianza` | Ciudad |
| `/abogado-civil-nacaome` | Especialidad |
| `/abogado-laboralista-nacaome` | Especialidad |
| `/abogado-de-familia-nacaome` | Especialidad |

### 4.2 Propuesta de enlazado contextual

> ⚠️ **RESTRICCIÓN AGENTS.md §5/R5:** no rediseñar la web pública (`app/(public)/**/*.tsx`). Las propuestas siguientes indican **dónde y cómo** enlazar; la implementación la hace Desarrollo sin alterar el diseño visual existente.

**Para las 3 especialidades en Nacaome** (alta prioridad — son landings comerciales):

| Página huérfana | Enlazar desde | Anchor natural | Bloque |
|---|---|---|---|
| `/abogado-civil-nacaome` | `/servicios-juridicos/derecho-civil-y-notarial` | "abogado civil en Nacaome" | CTA inferior "¿Necesitas un abogado civil en Nacaome?" |
| `/abogado-laboralista-nacaome` | `/servicios-juridicos/derecho-laboral` | "abogado laboralista en Nacaome" | CTA inferior |
| `/abogado-de-familia-nacaome` | `/servicios-juridicos/derecho-de-familia` | "abogado de familia en Nacaome" | CTA inferior |

**Para las 5 ciudades** (prioridad media — respetar R18: footer/home solo 10 ciudades prioritarias):

| Página huérfana | Enlazar desde | Anchor natural | Justificación |
|---|---|---|---|
| `/abogados-en-langue` | `/abogados-en-nacaome` ( RelatedCities existente) | "abogados en Langue" | Ciudad vecina, mismo departamento |
| `/abogados-en-caridad` | `/abogados-en-nacaome` | "abogados en Caridad" | Idem |
| `/abogados-en-san-antonio-de-flores` | `/servicios-juridicos` (mapa de cobertura) | "San Antonio de Flores" | Hub de servicios |
| `/abogados-en-concepcion-de-maria` | `/abogados-en-choluteca` | "abogados en Concepción de María" | Mismo departamento |
| `/abogados-en-alianza` | `/abogados-en-goascoran` | "abogados en Alianza" | Valle cercano |

### 4.3 Principios (R5/R7)

- **Anchors naturales**, no sobreoptimizados: "abogados en Langue" (no "mejor bufete abogados Langue Honduras").
- **No añadir al footer/home** las 5 ciudades (R18: solo 10 prioritarias ya listadas). Se enlazan desde landings hermanas.
- **No alterar diseño visual** — usar bloques de CTA o secciones RelatedCities ya existentes.

### 4.4 Validación posterior

```bash
npm run audit:internal-links    # las 8 URLs deben mostrar ≥1 inlink
# Re-crawl Ahrefs en 14 días: deben desaparecer de "orphan-page"
```

---

## Bloque 5 — CTR pensión alimenticia: propuestas de title/meta

### 5.1 Datos (GSC, 28d 2026-06-10 → 07-08)

| Query | Imp. | Clics | CTR | Pos. |
|---|---|---|---|---|
| cuanto es la pensión alimenticia por hijo en honduras | 70 | 1 | 1,43 % | 6,0 |
| cuanto es la manutencion de un hijo en honduras | 36 | 1 | 2,78 % | 5,2 |
| porcentaje de pensión alimenticia por 2 hijos en honduras | 28 | 3 | 10,71 % | 2,5 |
| cuanto es la pensión alimenticia por un hijo en honduras | 5 | 0 | 0 % | 4,8 |
| otros 7 queries de pensión | 13 | 0 | 0 % | 1,5–9,0 |
| **TOTAL** | **152** | **5** | **3,3 %** | — |

### 5.2 Estado actual del post

- **URL:** `/blog/derecho-de-familia/pension-alimenticia-porcentaje-honduras-2026`
- **Status:** 200 ✅ · **Canonical:** self ✅
- **Title actual:** `Pensión Alimenticia Honduras 2026 | Pineda y Asociados` (54 chars)
- **Meta actual:** `Descubra cómo se fija la pensión alimenticia en Honduras. Conozca los factores, la práctica judicial y los pasos a seguir. ¡Asesoría legal experta!` (147 chars)
- **H1:** `Pensión Alimenticia 2026: ¿Cuánto por Hijo en...`

**Diagnóstico:** el title es genérico (no incluye la pregunta concreta ni el porcentaje). El H1 sí pregunta "¿Cuánto por Hijo?". El query ganador "porcentaje de pensión alimenticia por 2 hijos" (CTR 10,71 %) demuestra que **incluir el porcentaje/cifra en el title dispara el CTR**.

### 5.3 Propuestas (NO aplicar — requiere cambio en DB `blog_posts`)

> ⚠️ R1/R7: leer antes de editar. R13: 600–1200 palabras, sin inventar datos legales. El cambio de title/meta se hace vía intranet o script sobre DB, no sobre archivo fuente.

#### Propuesta A (recomendada) — Title con cifra + pregunta

| Campo | Actual | Propuesta |
|---|---|---|
| **Title** | Pensión Alimenticia Honduras 2026 \| Pineda y Asociados | Pensión Alimenticia Honduras 2026: ¿Cuánto por Hijo? \| Pineda y Asociados |
| **Meta** | Descubra cómo se fija la pensión... (147 chars) | Pensión alimenticia en Honduras 2026: porcentaje por hijo (18%-50%), factores del juez y cómo solicitarla. Abogados de familia en Nacaome. |

- **Hipótesis:** el title replica el H1 (que ya funciona) e incluye la pregunta exacta de los top queries ("¿cuánto por hijo?"). La meta incluye el rango de porcentaje (atractivo sin ser sensacionalista) y la geo.
- **Riesgo:** bajo. Mantiene marca y año. No inventa cifras (el rango 18–50 % debe verificarse contra el contenido del post antes de publicar — R4).
- **Longitud title:** 73 chars (límite ~60 recomendado, pero el query ganador actual tiene 82 chars y funciona). ⚠️ Considerar acortar marca a "Pineda Asocs." si se quiere ≤60.

#### Propuesta B (alternativa) — Title con porcentaje explícito

| Campo | Propuesta |
|---|---|
| **Title** | Pensión Alimenticia por Hijo en Honduras 2026 (Porcentaje) \| Pineda |
| **Meta** | ¿Cuánto es la pensión alimenticia por hijo en Honduras? Conoce el porcentaje legal, factores del juez y pasos para reclamarla. Primera consulta sin costo. |

- **Hipótesis:** matched directo con los 2 top queries ("cuanto es la pensión alimenticia por hijo" + "porcentaje de pensión alimenticia por 2 hijos").
- **Riesgo:** medio — más agresivo en keyword matching. Puede sobreoptimizar.

### 5.4 Validación posterior (en GSC, 14-28 días tras aplicar)

```
GSC → Rendimiento → filtrar por:
  - Consulta contiene "pensión alimenticia" OR "manutencion"
  - Comparar CTR antes/después (baseline: 3,3 %)
  - Objetivo: CTR ≥ 6 % (duplicar)
  - Vigilar que la posición media no empeore
```

---

## Comandos ejecutados (esta sesión)

```
git status                                    # clean salvo docs generados
npm run bing:auth:status                      # ❌ No autorizado
npm run seo:doctor                            # 18 OK / 1 ERROR / 4 PENDIENTE
npm run blog:fix-redirects                    # dry-run: 0 correcciones (hrefs no en DB)
node (query DB post.body hrefs relativos)     # 0 resultados
node (fetch 11 URLs 4xx live)                 # 5 resuelven 200, 6 siguen 404
grep (hrefs relativos en app/components/lib)  # 0 resultados
node (fetch 10 URLs comerciales)              # 10/10 HTTP 200
node (extract title/meta post pensión)        # title genérico, H1 con pregunta
```

## Archivos consultados

- `AGENTS.md` (protocolo, zonas protegidas)
- `package.json` (scripts disponibles)
- `scripts/bing-auth-link.mjs` (device flow)
- `scripts/fix-internal-redirects.ts` (rewrite-map, lógica de fix)
- `lib/blog-context-linker.ts`, `lib/entity-dictionary.ts`, `lib/internal-links.ts` (auto-linker)
- `data/seo/canonical-paths.json` (rutas prioritarias)
- `data/google/gsc-live.json` (queries pensión)
- `data/bing/bing-live.json`, `docs/audits/auditoria-bing-webmaster-2026-07-08.md`
- `.env.example` (vars Bing OAuth)

## Archivos que deberían modificarse en fase posterior (con autorización)

| Archivo | Bloque | Zona protegida | Requiere autorización |
|---|---|---|---|
| `next.config.ts` | 3 (redirects) | ✅ Sí (AGENTS.md §7) | Sí, explícita |
| `app/(public)/blog/[categoria]/[slug]/page.tsx` | 4 (enlazado) | ✅ Sí (AGENTS.md §5) | Sí, explícita |
| `app/(public)/servicios-juridicos/**` | 4 (enlazado) | ✅ Sí (AGENTS.md §5) | Sí, explícita |
| DB `blog_posts` (title/meta post pensión) | 5 | No (vía intranet/script) | No, pero requiere backup previo |
| `.secrets/bing-oauth.json` | 1 | No (gitignored) | No — generado por `npm run auth:bing` |

---

## Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| OAuth Bing rechazado / app mal configurada | Media | Medio | Diagnóstico en §1.4; API Key sigue funcionando meanwhile |
| Indexación GSC no progresa tras solicitud | Media-baja | Alto | Re-enviar sitemap + construir backlinks externos (GBP) |
| Redirects en `next.config.ts` crean cadena 301 | Baja | Medio | Validar que destinos son finales (no origenes de otro redirect) |
| Enlazado interno altera diseño visual (R5) | Media | Medio | Desarrollo respeta componentes existentes (RelatedCities, CTA) |
| Cambio de title empeora posición | Baja | Medio | Solo cambiar title/meta, no contenido; monitorizar 14-28d |

## Validación global (cómo confirmar que el plan funcionó)

- **+7 días:** Bing OAuth ✅, 10 URLs solicitadas en GSC, redirects aplicados.
- **+14 días:** re-crawl Ahrefs → 0 URLs 4xx nuevas, 8 huérfanas con inlinks, title/meta publicados.
- **+28 días:** `npm run seo:collect` → comparar:
  - GSC: CTR global ≥ 2,5 % (actual 2,07 %), CTR pensión ≥ 6 %.
  - GSC: ≥ 5 de las 10 URLs comerciales con impresiones > 0 (indexación activa).
  - Bing: queries con position/CTR visibles (post-OAuth).

---

## Porcentaje completado / restante por bloque

| Bloque | Completado | Restante |
|---|---|---|
| Repositorio (inspección + validaciones) | 100 % | 0 % |
| Bing OAuth (plan) | 100 % | 0 % |
| Bing OAuth (ejecución) | 0 % | 100 % (requiere auth manual) |
| Google indexación (plan + checklist) | 100 % | 0 % |
| Google indexación (ejecución) | 0 % | 100 % (requiere GSC UI) |
| Enlaces rotos (diagnóstico + propuesta) | 100 % | 0 % |
| Enlaces rotos (aplicación) | 0 % | 100 % (requiere auth `next.config.ts`) |
| Páginas huérfanas (propuesta) | 100 % | 0 % |
| Páginas huérfanas (aplicación) | 0 % | 100 % (requiere auth `app/(public)`) |
| CTR pensión (propuestas) | 100 % | 0 % |
| CTR pensión (aplicación + validación) | 0 % | 100 % (requiere backup DB + 28d) |
| Documentación | 100 % | 0 % |
| **TOTAL plan (preparación)** | **~90 %** | **~10 %** |
| **TOTAL ejecución** | **0 %** | **100 %** (todas las acciones requieren intervención humana autorizada) |

---

## Resumen para dirección

> La auditoría se completó al 88 % y este plan operativo convierte los hallazgos en **acciones concretas y priorizadas**. Toda la **preparación está al 100 %**: instrucciones exactas, evidencia verificada, propuestas redactadas. Falta la **ejecución**, que es 100 % humana y requiere autorización porque toca zonas protegidas del código (`next.config.ts`, web pública) o interfaces externas (GSC, Bing OAuth).
>
> **3 acciones críticas para esta semana (desbloquean el crecimiento):**
> 1. `npm run auth:bing` (5 min) — desbloquea datos Bing completos.
> 2. Solicitar indexación en GSC de las 10 URLs comerciales (30 min) — desbloquea indexación Google.
> 3. Añadir 4 redirects en `next.config.ts` (15 min, Desarrollo) — elimina 6 URLs 404.
>
> **1 acción de alto impacto para esta semana:**
> 4. Cambiar el title del post de pensión alimenticia (Propuesta A) — duplicar CTR en 152 impresiones/mes.
>
> **Sin riesgos de seguridad.** Sin cambios de arquitectura. Sin tocar diseño visual. Todo reversible.
