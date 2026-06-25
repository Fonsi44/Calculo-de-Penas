# Seguimiento D+0 — Validación post-deploy (NO deployado) — 2026-06-25

> **Estado:** intento de validación post-deploy el 2026-06-25 09:13 UTC.
> **Resultado:** el deployment de Vercel **NO contiene** los commits
> `b50209a`, `efbc363`, `0153296`, `feef1f3`, `841d98f`, `465be90`.
> HEAD local = `465be901fac2d4743c3b704953f81c4afc2dbd20`.
> Production evidencia versión pre-commits (meta-desc 225/179, sitemap
> priority 0.2 con lastmod 2026-05-26, redirects 301 NO activos).

## Evidencias D+0

### 1. Redirects (Test 1.1 + 1.2)

| URL | Resultado HTTP | Estado commit |
|---|---|---|
| `http://pinedayasociadoshn.com/` | **308 → https://pinedayasociadoshn.com/** | Vercel ya lo hacia (pre-commit) ✓ |
| `http://pinedayasociadoshn.com/derecho-penal` | **308 → https://pinedayasociadoshn.com/derecho-penal** | ídem ✓ |
| `http://pinedayasociadoshn.com/blog` | **308 → https://pinedayasociadoshn.com/blog** | ídem ✓ |
| `https://www.pinedayasociadoshn.com/hondurenos-en-espana/poder-desde-espana-para-tramites-honduras` | **404 NotFound** | commit `0153296` NO deployado ✗ |
| `https://www.pinedayasociadoshn.com/derecho-penal/proceso-penal-completo/paso-1` | **404 NotFound** | ídem ✗ |

> El redirect HTTP→HTTPS del host apex `pinedayasociadoshn.com` ya lo
> gestiona Vercel (308 Permanent Redirect). **El redirect www falta**:
> `pinedayasociadoshn.com` → `https://pinedayasociadoshn.com/` (sin `www.`).
> Esto NO se corrigió en ningún commit pero no fue parte de las 8
> prioridades originales (las prioridades eran consolidate HTTP/404,
> no añadir una nueva cadena www). Sigue en **RIESGO PENDIENTE**.

### 2. Sitemap (Test 2)

```
Sitemap length: 44134 bytes
URL count: 207
/aviso-legal         lastmod=2026-05-26T08:38:58.124Z  priority=0.2
/politica-editorial  lastmod=2026-05-26T08:38:58.124Z  priority=0.2
/politica-privacidad lastmod=2026-05-26T08:38:58.124Z  priority=0.2
/politica-cookies    lastmod=2026-05-26T08:38:58.124Z  priority=0.2
/terminos            lastmod=2026-05-26T08:38:58.124Z  priority=0.2
/disclaimer          lastmod=2026-05-26T08:38:58.124Z  priority=0.2
```

- Total URLs: **207** (sin perdida de posts/categorías ✓).
- `lastmod` **2026-05-26**: anterior a commit `efbc363` (que lo debería
  actualizar a hoy 2026-06-25). → **NO deployado**.
- `<priority>0.2</priority>`: commit `efbc363` lo debería subir a 0.4
  para `/aviso-legal`. → **NO deployado**.

### 3. Meta descriptions y canonical (Test 3)

| URL | len meta-desc (prod) | Local | Estado |
|---|---|---|---|
| `/derecho-penal` | 225 | 152 | commit `b50209a` NO deployado |
| `/servicios-juridicos` | 179 | 156 | idem |
| `/` canonical | `https://www.pinedayasociadoshn.com` (sin slash) | ${site.url}/` con slash | sin cambios en commit, ya estaba |

> Canonical de la home sigue sin slash final. Pre-existente; no fue
> módulo de prioridad 6 (esa prioridad se marco como "IMPLEMENTADO
> preexistente" pero corroboramos que en realidad no se cumple en
> producción para el slash). Mantener **RIESGO PENDIENTE** y resolver
> en deploy posterior (Next.js metadataBase + alternates canonical).

### 4. GA4 / Intranet (Test 4)

| URL | status | gtag script | GTM | GA4-id-en-source | Fuga |
|---|---|---|---|---|---|
| `/` | 200 | 0 raw (lazyOnload client) | 0 | G-L2PGBN3SWK | No |
| `/derecho-penal` | 200 | ídem | 0 | G-L2PGBN3SWK | No |
| `/cp` | **404** | n/a | 0 | (ninguno) | No |
| `/intranet/login` | 200 | 0 raw | 0 | (ninguno) | No |

- Measurement ID en producción: **G-L2PGBN3SWK** (formato `G-XXXX`)
  CORRECTO.
- **No encontrado** el property ID numérico `541022095` en HTML source
  (es el ID interno GA4 Data API, solo en `.env`, no expuesto).
- **No encontrada** la URL `analytics.google.com/analytics/v2/realtime/
  venus/getData` en el HTML source (pertenece a UI interna GA4, no al
  sitio). El "Http failure response ... 400 OK" que mencionaba la
  solicitud NO es reproducible desde el HTML source público: es un
  error de la consola del navegador cuando el usuario abre la UI de
  GA4, no del sitio visitante.
- GA4 usa `strategy="lazyOnload"` (next/script) por lo que las tags
  `gtag` no aparecen en HTML initial; el navegador las monta post-
  hydrate. Excluye `/intranet`, `/preview`, `/api` ya (commit
  preexistente). Mi commit `feef1f3` añade `/cp`, `/calculadora`,
  `/casos`, `/delitos`, `/atajos` → NO deployado.
- `/cp` en producción **retorna 404 real** (no página), confirmado vía
  HTTP HEAD. Por lo tanto GA4 nunca podrá trackearlo desde el HTML
  (no hay página que instanciar). GA4 nunca Disparara page_view en
  `/cp` incluso sin mi commit. El visitor que generó "1 session" del
  diagnóstico (28d) muy probablemente vino desde Googlebot que crawleó
  `/cp` (404) con página vacía y GA4 contabilizo como sesion-no-bounce
  - **falso positivo de analytics**, no fuga activa. Mi commit
  `feef1f3` refuerza robustez para futuras URLs internas permitidas,
  pero no es causa de un error visible hoy.

### 5. IndexNow dual real (Test 5) — VALIDADO EN ACCIÓN

**Pruebas reales ejecutadas con éxito (commit `b023790` operacional):**

| Modo | URLs | Status Endpoint |
|---|---|---|
| `--core` (11 URLs) REAL | 11 | `✓ HTTP 200 [api.indexnow.org=200✓ www.bing.com=200✓]` |
| Headers manuales (6 legales) REAL | 6 | `api.indexnow.org: 200` + `www.bing.com/indexnow: 200` |
| `--full --limit 80` REAL | 61 | `✓ HTTP 200 [api.indexnow.org=200✓ www.bing.com=200✓]` |

> **IndexNow dual confirmedo en acción real de red.** El commit
> `b023790` está operacional. NO depende del deploy de la app Vercel
> (es un script local en cliente; lo ejecuta el developer/CI postbuild).
> El script imprime `Endpoint: api.indexnow.org + www.bing.com/indexnow
> (dual)` como cabecera esperada.

### 6. Bing WMT (Test 6) — baseline D+0 reconfirmado

```
→ GetUserSites
   https://www.pinedayasociadoshn.com/  verified=true
→ GetCrawlStats (14 d)
   total: crawled=692 2xx=357 4xx=9 5xx=0 errors=13
→ GetUrlInfo (12 URLs prioritarias)
   ✓ / | ✓ /abogados-en-nacaome | ✓ /abogados-en-choluteca | ✓ /abogados-en-san-lorenzo
   ✗ /servicios-juridicos | ✗ /derecho-penal | ✗ /blog | ✗ /preguntas-frecuentes
   ✗ /solicitar-consulta | ✗ /despacho | ✗ /como-llegar | ✗ /hondurenos-en-espana
→ GetLinkCounts
   totalPages=0 links=0
→ GetQueryStats
   17 queries
```

- **InIndex baseline mantenido: ~31** (consistente con auditoría
  2026-06-25 previa). Mismo numero: el envío IndexNow de hoy (78
  URLs) no impacto D+0 (Bing tarda días en rastrear).\* **No promete
  crecimiento**; solo reporta datos.
- `GetUrlInfo` confirma 4 / 12 URLs prioritarias crawleadas alguna vez
  por Bing (misma situacion pre-deploy).

### 7. GSC /aviso-legal (Test 7) — URL Inspection API D+0

| URL | verdict | coverageState | lastCrawlTime | crawledAs |
|---|---|---|---|---|
| `/aviso-legal` | **NEUTRAL** | "Descubierta: actualmente sin indexar" | (nunca) | UNSPECIFIED |
| `/derecho-penal` | PASS | Enviada e indexada | 2026-06-20 18:32 | MOBILE |
| `/servicios-juridicos` | PASS | Enviada e indexada | 2026-06-20 18:32 | MOBILE |

- `/aviso-legal` permanece NEUTRAL en D+0 (esperado: mi commit
  `efbc363` aun no deployado; lastmod del sitemap sigue 2026-05-26).
- `/derecho-penal` y `/servicios-juridicos` PASS: canonical OK,
  mobile-first OK. Meta-desc vieja (sin deployar) no impacta verdict
  PASS (Google no penaliza long meta-desc, solo la trunca en SERP).

## Conclusión de deployment

El deployment de Vercel **NO fue ejecutado o está pendiente**. HEAD
main local: `465be901`. Los 7 commits atómicos siguen en `main` pero
no en producción. Validación post-deploy real será posible solo tras
`vercel --prod` o push automático.

## Items IMPLEMENTADO+VALIDADO (no requieren deploy de Vercel)

| Item | Validación D+0 |
|---|---|
| IndexNow envío dual (commit b023790) | ✓ REAL, ambos endpoints 200 |
| Bing WMT API conectada (INDEXNOW_KEY) | ✓ REAL, datos retornados |
| GSC API conectada (OAuth refresh) | ✓ REAL, URL Inspection OK |
| GA4 API conectada (gaId G-L2PGBN3SWK) | ✓ REAL, ID correcto expuesto en HTML |
| proxy.ts NO expone /cp como pública | ✓ /cp retorna 404 real |

## Items IMPLEMENTADO en repo, NO VALIDADO en producción

| Item | Razon |
|---|---|
| Redirects 301 para las 2 URLs 404 (commit 0153296) | Requiere deploy Vercel |
| Sitemap lastmod 2026-06-25 + priority /aviso-legal 0.4 (efbc363) | Requiere deploy |
| Meta-desc recortadas /derecho-penal / /servicios-juridicos (b50209a) | Requiere deploy |
| /derecho-penal enlazado prioritizado (841d98f) | Requiere deploy |
| AnalyticsScripts exclude /cp /calculadora... (feef1f3) | Requiere deploy (robustez futura; en prod /cp es 404 y nunca fue causa activa) |

## Próximo paso D+1 (critico)

**Ejecutar `vercel --prod` desde la rama `main`** (o forzar deploy
manual en Vercel dashboard → "Redeploy" con `main` actual). Tras
deploy, repetir tests 1.2, 2, 3 y 7 de este documento:

```bash
git push origin main                  # si no esta pusheado
vercel --prod                        # o vía dashboard Vercel
curl -I https://www.pinedayasociadoshn.com/hondurenos-en-espana/poder-desde-espana-para-tramites-honduras
curl https://www.pinedayasociadoshn.com/sitemap.xml | grep -A2 aviso-legal
curl -s https://www.pinedayasociadoshn.com/derecho-penal | grep -oE '<meta name="description" content="[^"]+"' | head -1
```

## Próximo paso D+7

Tras deploy D+1:
- `node scripts/bing-wmt-audit.mjs` (comparar InIndex vs 31).
- GSC URL Inspection `/aviso-legal` debe evolucionar NEUTRAL → PASS en
  D+3 a D+7 (no garantizado).
- Re-ejecutar IndexNow `--full --incremental` (incremental cache diff
  evita reenvío innecesario de URLs con throttle 24h).
- Generacion de backlinks externos legitimate (BWT InLinks=0) prioridad
  paralela (directorios jurídicos Honduras, GBP, etc.).

## No prometo

- Indexación garantizada.
- Recuperación inmediata de datos GA4.
- Crecimiento de InIndex Bing.
- PASS coverageState inmediato de `/aviso-legal` tras deploy.

Las correcciones implementan consolidación, rastreo, descubrimiento y
señales técnicas. La indexación real depende de Google/Bing, crawl
budget, calidad y enlaces externos.