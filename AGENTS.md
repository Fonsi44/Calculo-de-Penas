# Pineda y Asociados — Protocolo obligatorio para agentes IA

Este repositorio requiere **precisión, trazabilidad, verificación real y honestidad operativa**.
Ningún agente puede afirmar que algo está implementado, corregido, validado o completado
si no lo ha comprobado mediante lectura de archivos, cambios reales y comandos de validación
cuando correspondan. Las reglas son permanentes, no una tarea puntual.

---

## 1. Lectura obligatoria antes de modificar

En orden:
1. `README.md`, `package.json`
2. `AGENTS.md` (este archivo — protocolo canónico)
3. Archivos afectados por el cambio (leer, no asumir)
4. `CHANGELOG.md` (últimas releases para contexto)
5. `auditoriatotal.mc` (línea base canónica — **solo lectura, no modificar**)
6. `auditoria-acciones.md` (registro vivo de acciones ejecutadas y pendientes)

---

## 2. Reglas de trabajo obligatorias

### R1. Leer antes de escribir
- Leer el archivo que se va a modificar **antes** de editarlo.
- No asumir contenido; verificar con `Read`.

### R2. Una fuente de verdad por subsistema
| Subsistema | Fuente de verdad |
|------------|-----------------|
| Blog (lectura pública) | Tabla `blog_posts` via `lib/blog-db.ts` |
| Blog (datos semilla) | `data/blog/categories.ts` (20 categorías) |
| FAQ (lectura pública) | Tabla `faq_entries` via `lib/faq-db.ts` |
| FAQ (categorías) | `data/faq-categories.ts` (11 categorías) |
| Calculadora / delitos | `data/delitos.json` (483 delitos, verificado 100%) |
| Páginas editables | Tabla `page_content` via `lib/page-content-db.ts` |
| Schema DB | `lib/schema.ts` (35 tablas) |
| Config del sitio | `lib/site.ts` (variables NEXT_PUBLIC_*) |
| Áreas jurídicas | `data/areas-juridicas.ts` (13 áreas, 1122 líneas) |

### R3. No usar datos mock como solución final
- Toda persistencia debe ser en DB (PostgreSQL / Drizzle ORM).
- `data/blog/posts/` está vacío (migración a DB completada).
- `data/faq.ts` es legacy pero **está en uso** por `lib/faq-db.ts` (categorías FAQ).
- `lib/blog.ts` + `data/blog/types.ts` son capa adaptadora legacy **en uso**
  (por `components/blog/blog-card.tsx` y `lib/schemas/blog.ts`). No eliminar sin
  migrar tipos.

### R4. No inventar datos legales
- Prohibido afirmar rankings, métricas, ubicaciones, premios o certificaciones
  no verificables.
- Las citas legales deben poder verificarse contra el CP de Honduras.
- `data/delitos.json`: 483 delitos, 0 duplicados, 100% verificados. No modificar
  sin causa legal expresa.

### R5. No rediseñar la web pública
- `app/(public)/**/*.tsx` tiene diseño visual establecido. Solo tocar por bug
  técnico imprescindible. La optimización SEO (metadatos, schemas, headings,
  enlazado interno) **no constituye rediseño** y es responsabilidad del agente SEO.

### R6. No exponer la intranet
- Toda ruta `/intranet/*`, `/calculadora`, `/casos`, `/cp`, `/delitos`,
  `/atajos`, `/admin/*` es PRIVADA.
- No mencionar, enlazar, indexar ni referenciar desde web pública.
- No solicitar indexación de ninguna URL privada en buscadores.
- El único enlace público a intranet es el del header con `rel="nofollow"`.

### R7. No mezclar refactors grandes con correcciones puntuales
- Un cambio lógico por commit.
- Commits atómicos con mensaje descriptivo en español y prefijo
  (`feat:`, `fix:`, `docs:`, `chore:`, `seo:`, `refactor:`, `test:`).

### R8. Validar siempre tras el cambio
Ejecutar según el área (ver §4). Nunca saltar validación.

### R9. No cambiar arquitectura sin justificar
- Framework, App Router, proxy, auth, DB schema, motor de cálculo.
- Cualquier cambio estructural requiere justificación técnica.

### R10. No modificar configuración de modelos, proveedores o APIs externas
Sin instrucción explícita del usuario.

### R11. Clasificar estados con honestidad
| Estado | Significado |
|--------|-------------|
| `IMPLEMENTADO` | Archivo modificado realmente |
| `VALIDADO` | Comandos reales ejecutados y pasaron |
| `NO VALIDADO` | No se pudo comprobar (cred/permisos/entorno) |
| `PENDIENTE` | Falta trabajo real |
| `RIESGO` | Puede fallar en producción |

### R12. No usar verbos complacientes
Prohibido: "hecho", "listo", "completado", "validado", "todo correcto" si no
corresponde exactamente.

---

## 3. Seguridad

- **Auth**: JWT + bcrypt. Cookies `__Host-token` (HttpOnly, Secure, SameSite=Lax).
- **Proxy** (`proxy.ts`): protege `/intranet/*` y `/api/*` no públicos.
  Exige rol `admin` para `/api/admin/*` y `/intranet/admin/*`.
- **Rate limiting**: login (5/60s), contacto (10/15min), consulta (10/15min),
  calcular (30/min), generate (10/5min).
- **Sanitización**: `lib/sanitize.ts` (sanitize-html) en todo contenido HTML
  de entrada (blog, FAQ, CMS).
- **Validación**: Zod schemas en todas las rutas POST/PATCH/PUT.
- **CSRF**: SameSite=Lax en cookies + Next.js API routes protection.
- **Auditoría**: `lib/audit.ts` registra todas las acciones CRUD en
  `auditoria_eventos`.
- **Headers**: CSP restrictivo, HSTS 2 años preload (prod),
  `X-Content-Type-Options`, `Permissions-Policy`, `X-Frame-Options: DENY` en
  intranet, `poweredByHeader: false`.
- **Webhook email**: `POST /api/email/inbound` verifica firma Svix
  (requiere `RESEND_WEBHOOK_SECRET` o responde 503 en producción).
- **OAuth callback**: `GET /api/oauth/callback` protegido por proxy JWT;
  no devuelve `refresh_token` en JSON.

### Secretos
- NUNCA hardcodear `OAUTH_CLIENT_SECRET`, `RESEND_API_KEY`,
  `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` ni `JWT_SECRET` en código.
- Leer siempre de variables de entorno.
- Si un secreto está en git history, **requiere rotación** (el código no lo
  resuelve).

---

## 4. Validación por área

| Área | Comandos |
|------|----------|
| Cualquier cambio | `npm run lint && npm run build && npm run test` |
| Motor de cálculo (`lib/rules/v1/`) | `build` + probar `POST /api/calcular` |
| Schema DB (`lib/schema.ts`) | `npx drizzle-kit generate` |
| Blog público | `build` + `test:e2e` |
| API routes | `build` + test endpoint con `Invoke-RestMethod` (PowerShell) o `curl` |
| SEO / sitemap / robots | `build` + `lint` + verificar `sitemap.xml`/`robots.txt` |
| UI pública | `build` + `test` |
| Fechas del blog | `npm run validate:dates` |
| Contenido editorial | `npm run content:audit` |
| Normalización del blog | `npm run blog:normalizar` (dry-run) → `npm run blog:normalizar:aplicar` |
| IndexNow | `npm run indexnow:dry` |
| SEO off-page | `npm run seo:health` |
| Regresión visual | `npm run visual:check` |

### Comandos globales

```bash
npm run lint          # ESLint — 0 errores requerido
npm run build         # Next.js build — TypeScript + compilación
npm test              # Vitest — suite completa; 0 fallos nuevos requeridos
npm run test:e2e      # Playwright — ~41 tests E2E (5 specs)
npm run validate:dates  # Validar fechas del blog
npm run content:audit   # Auditoría editorial (74 pendientes hoy)
```

---

## 5. SEO y gobernanza

Reglas vinculantes para toda modificación con impacto SEO. Resumen:

- **Una URL = una intención de búsqueda.** No crear URLs que compitan.
- **Revisar canibalización** antes de crear contenido nuevo.
- **Alinear title, H1, primer párrafo** con la intención de búsqueda.
- **Sin keyword stuffing** — densidad natural, sin repetición forzada.
- **No inventar datos** (métricas, rankings, ubicaciones, clientes, premios).
- **Priorizar cambios por impacto SEO**: crítico > importante > recomendable.
- **JSON-LD obligatorio** por tipo de página: `LegalService+LocalBusiness`
  (home), `Service` (servicios), `BlogPosting` (blog), `FAQPage` (FAQ),
  `BreadcrumbList`, `Organization`, `WebSite`.
- **No degradar SEO existente**: CWV, schemas, canonical, redirects, sitemap,
  robots.txt, llms.txt.
- **SEO local**: NAP consistente en todo el sitio, `geo` en LocalBusiness,
  keywords geográficas en title/H1/contenido, Google Business Profile vinculado.
- **IndexNow + sitemap automático**: sitemap dinámico en `app/sitemap.ts`
  (excluye rutas privadas y posts canonicalizados); IndexNow vía
  `scripts/submit-indexnow.mjs` (dry-run por defecto).
- **Enlazado interno**: anchors descriptivos, sin páginas huérfanas,
  breadcrumbs consistentes.
- **Datos estructurados**: renderizados server-side (no client-side),
  válidos según Schema.org.
- **No exponer intranet**: ninguna URL privada en sitemap, robots.txt,
  enlaces públicos, metadatos ni schemas.
- **Validación SEO**: tras cambios, verificar `sitemap.xml`, `robots.txt`,
  schemas con validador, y `npm run build` sin errores.

---

## 6. Regla sobre tooling y modelos de IA

- El protocolo canónico para cualquier agente es `AGENTS.md` (este archivo).
- Este repositorio **no fija un modelo o proveedor de IA específico** como
  requisito. Los modelos se asignan dinámicamente según el entorno de ejecución
  en cada sesión (pueden cambiar sin previo aviso).
- Todas las reglas de este documento aplican **independientemente del modelo**
  que procese cada instrucción.
- Configuraciones de tooling anteriores (`.kilo/`, `kilo.json`, `CLAUDE.md`,
  skills de Kilo, etc.) fueron **eliminadas del repositorio** (Release 85) y
  están en `.gitignore`. Pueden existir en disco local pero **no operativas**.
  No crear nuevas versiones de estos archivos en el repo.
- El protocolo canónico es **exclusivamente** `AGENTS.md`. Cualquier agente
  (ZCode, OpenCode, u otro) debe leer este archivo como única fuente de reglas.
- Si se requiere fijar un modelo concreto en un entorno con router de modelos,
  usar la configuración del **entorno** (no del repo).

---

## 7. Datos del blog — estado real (Jun 2026)

| Métrica | Valor |
|---------|-------|
| Posts publicados | 159 |
| Verificación de fechas | ✅ Ninguna futura (verificado contra DB) |
| Revisión editorial vencida | 71 (pendiente humano, no bug técnico) |
| Posts thin (0/10 marcadores) | 49 (mitigados con priority 0.3 en sitemap) |
| Posts medios (1–4 marcadores) | 109 |
| Categorías | 20 (fuente: `data/blog/categories.ts`) |
| Fuente de escritura | DB (`blog_posts`), NUNCA `data/blog/posts/` |
| Editor | TipTap (visual) + HTML directo (doble pestaña) |
| Generador AI | `POST /api/admin/blog/generate` (rate limit: 10/5min) |
| Canonical override | Campo `canonical_url` disponible |
| Noindex por artículo | Campo `noindex` disponible |
| Política editorial | README §"Estrategia editorial" |

### Reglas editoriales vinculantes (R13–R15)

**R13. Peso editorial: 600–1200 palabras guía; 800–1000 para ampliación IA.**
- **Guía editorial general:** todo post debe tener entre 600 y 1200 palabras
  como guía. La calidad SEO/GEO, la precisión legal y la ausencia de relleno
  genérico tienen prioridad sobre el conteo. Un artículo de 650 palabras bien
  optimizado vale más que uno de 1000 con relleno. Posts muy por encima de
  1200 palabras se revisan por claridad/estructura.
- **Ampliación automática IA:** cuando un post esté por debajo de 600 palabras
  y la IA pueda ampliarlo sin inventar datos legales, el objetivo preferente es
  800–1000 palabras. La ampliación la realiza `scripts/blog-verify-fix.ts` con
  `DEEPSEEK_API_KEY` usando **exclusivamente** información ya presente en el
  artículo o en su categoría, con prompt restrictivo que prohíbe inventar datos
  legales. La IA **nunca** rellena con texto genérico para alcanzar el conteo.
- **Fallback humano:** si la IA no puede ampliar sin inventar datos legales,
  el post se marca como "pendiente" para revisión humana puntual. La ampliación
  editorial humana no es un paso obligatorio, sino un recurso puntual.
- **Guardias automáticas** (no requieren intervención humana): el body corregido
  se rechaza si (a) sigue <600 palabras en posts que requerían ampliación,
  (b) introduce alucinaciones legales nuevas (artículos/penas inexistentes),
  (c) introduce regresiones SEO/privacidad (rutas privadas, H1, disclaimer duplicado),
  o (d) es ≥98% similar al original (cambio irrelevante).
- **Validación post-escritura**: tras escribir en DB, el script relee el post y
  re-analiza; si no pasa los validadores, revierte al original automáticamente.
- El conteo se verifica con `scripts/normalizar-blog.ts` (audit) o
  `scripts/detectar-posts-plantilla.ts`.

**R14. El disclaimer legal va en el componente, no en el body.**
- El componente `<LegalDisclaimer>` (`components/marketing/legal-disclaimer.tsx`)
  ya renderiza el aviso legal en todas las páginas de detalle. El body de un
  post **NO debe contener** el disclaimer (`"Este artículo tiene carácter
  informativo..."`): sería duplicado y rompe la regla de `lib/legal-disclaimer.ts`.
- `npm run blog:normalizar:aplicar` elimina estos duplicados de forma segura.

**R15. Un solo H1 por página de post.**
- La plantilla `app/(public)/blog/[categoria]/[slug]/page.tsx` ya renderiza
  `post.title` como `<h1>`. El body del post debe usar `<h2>`/`<h3>` para la
  jerarquía interna, **nunca** `<h1>` (generaría doble H1, problema SEO).
- `npm run blog:normalizar:aplicar` convierte `<h1>` del body a `<h2>`.

**R16. Pulido visual coherente (design tokens).**
Aplica a toda modificación visual de la web pública. Refuerza R5 (no rediseñar)
con reglas operativas para mantener la coherencia del sistema de design tokens
de `app/globals.css`:
- **Radius canónico de card pública = `rounded-lg` (16px / `--radius-lg`)**.
  No usar `rounded-md` (12px) ni `rounded-xl` (20px) en cards públicas.
  `.card-premium` y `.card-dark` ya usan `var(--radius-lg)`.
- **Sombras de botón siempre vía tokens**, nunca `shadow-[...]` inline.
  Usar las utilities `.btn-shadow-primary`/`-secondary`/`-accent`/`-success`
  y sus variantes `*-hover` (definidas en `globals.css`). Los tokens fuente
  son `--shadow-btn-*`. Antes había 9 sombras inline que duplicaban y
  divergían de los tokens.
- **Icono-contenedor estándar**: `w-11 h-11 rounded-lg` con `border` +
  `bg-tint` (p.ej. `bg-primary/10 border-primary/15` o
  `bg-accent/15 border-accent/30`) e icono `size={20}`. Para numeración
  (stepper, listas): `w-10 h-10 rounded-md`.
- **Dorado solo como acento**: hover (border + halo), eyebrow, iconos
  destacados. Nunca como fondo plano de superficies grandes.
- **Legibilidad mínima**: descripciones/extractos de cards a `text-sm` (14px)
  mínimo. `text-xs` (12px) reservado para labels/meta; `text-xxs` (11px) solo
  para eyebrow/captions ultracortos.
- **Validación**: tras cambios visuales, `npm run lint && npm run build`
  obligatorio. `npm run visual:check` compara contra producción remota
  (requiere deploy previo para validar cambios no desplegados).

**R17. Uso seguro de herramientas IA en contenido (blog:review / blog:verify-fix).**
Aplica a cualquier herramienta que use IA para analizar o "mejorar" contenido
del blog o editorial. Cubre `scripts/blog-ai-review.ts` (`blog:review`) y
`scripts/blog-verify-fix.ts` (`blog:verify-fix`):
- **`blog:verify-fix` es la herramienta canónica de verificación + corrección
  + ampliación del blog.** Verifica datos legales contra fuentes canónicas
  (`data/delitos.json`, `data/articulos_cp.json`, `data/articulos_constitucion.json`),
  corrige errores fácticos con IA, amplía posts thin a 800-1000 palabras usando
  SOLO información del artículo, y normaliza mecánicamente (H1→H2, CTAs
  duplicados, whitespace, truncado de títulos >60 chars). La ampliación IA es el
  camino por defecto (R13); no existe "ampliación editorial humana" como paso
  obligatorio — solo como fallback puntual cuando la IA no puede ampliar sin
  inventar datos.
- **`blog:review` con `--aplicar-ia`** ejecuta reescritura del body vía DeepSeek
  con prompt restrictivo (prohíbe inventar datos legales) y validación
  automática. El modo `--aplicar` (sin `-ia`) ejecuta ÚNICAMENTE
  transformaciones mecánicas idempotentes, nunca reescrituras IA.
- **Guardias automáticas comunes** (ambos scripts): el body corregido se
  rechaza si (a) sigue <800 palabras cuando se requería ampliación, (b)
  introduce alucinaciones legales nuevas (artículos/penas inexistentes
  detectados por re-verificación de claims), (c) introduce regresiones
  SEO/privacidad (rutas privadas, H1, disclaimer duplicado), o (d) es ≥98%
  similar al original (cambio irrelevante, no se escribe). **Validación
  post-escritura**: tras escribir en DB, el script relee el post y re-analiza;
  si no pasa los validadores, revierte al original automáticamente.
- **Prohibido rellenar contenido genérico para alcanzar conteo de palabras**
  (refuerza R13). La IA expande usando SOLO la información presente en el
  artículo original o su categoría; no inventa datos externos.
- **API keys siempre de variables de entorno** (`DEEPSEEK_API_KEY`), nunca
  hardcodeadas. Si una clave se compromete (commiteada, filtrada en chat,
  logs), **requiere rotación** en el panel del proveedor (refuerza §3): el
  código no resuelve una clave comprometida.
- **Toda sugerencia de IA que afirme ley, jurisprudencia, métricas, fechas,
  rankings o claims** debe verificarse contra el CP Honduras / fuentes
  canónicas (`data/delitos.json`, `data/articulos_cp.json`) antes de aplicar.
  La IA puede alucinar citas legales. Incluso en modo `--aplicar-ia`, el
  prompt prohíbe explícitamente inventar datos. `blog:verify-fix` realiza esta
  verificación automáticamente (re-verificación de claims sobre el body
  corregido).
- **No cambiar slugs, URLs, fechas ni categorías automáticamente.** Esos son
  cambios editoriales que requieren decisión humana y revisión de
  canibalización (§5).
- **Dry-run por defecto.** Sin `--aplicar`, ambos scripts son de solo lectura.
  Backup previo obligatorio antes de cualquier modo de escritura (generado
  automáticamente en `auditoria-blog/`). `blog:verify-fix` guarda además un
  checkpoint reanudable (`auditoria-blog/checkpoint.json`) para lotes grandes.
- **Sin `DATABASE_URL` real, el script sale limpio** (no degrada el blog).

---

## 8. Fuentes de datos canónicas

| Dato | Archivo | Registros |
|------|---------|-----------|
| Delitos CP | `data/delitos.json` | 483 (100% verificados) |
| Estados de verificación | `data/delitos-estados.json` | 483 verificados |
| Artículos CP | `data/articulos_cp.json` | 635+ |
| Artículos Constitución | `data/articulos_constitucion.json` | 378 |
| Código de Trabajo | `data/codigo_trabajo.json` | 856 (extraído de PDF oficial) |
| Código Civil | `data/codigo_civil.json` | 2359 (extraído de PDF oficial) |
| Código de Comercio | `data/codigo_comercio.json` | 1693 (extraído de PDF oficial) |
| Código Tributario | `data/codigo_tributario.json` | 218 (extraído de PDF oficial) |
| Ramas jurídicas | `data/ramas_juridicas.json` | 119 |
| Áreas jurídicas | `data/areas-juridicas.ts` | 13 áreas |
| Categorías blog | `data/blog/categories.ts` | 20 |
| Categorías FAQ | `data/faq-categories.ts` | 11 |
| Landings locales | `data/landings-locales.ts` | 9 |
| Imágenes OG | `data/images.ts` | — |
| Schema DB | `lib/schema.ts` | 35 tablas |

---

## 9. Archivos que NO debe tocar la IA

- **Web pública visual** (`app/(public)/**/*.tsx`) — salvo SEO.
- **Motor de cálculo** (`lib/rules/v1/`, `lib/utils.ts`, `lib/catalogos.ts`).
- **Schema DB** (`lib/schema.ts`) — cambios requieren `drizzle-kit generate`.
- **Auth** (`lib/auth.ts`).
- **Proxy** (`proxy.ts`) — cambios pueden abrir filtraciones.
- **Datos de delitos** (`data/delitos.json`, `data/delitos-estados.json`).
- **Redirects 301** de `next.config.ts` (canibalizaciones activas).
- **`THIN_POST_SLUGS`** en `app/sitemap.ts` (mitigación activa hasta reescritura).
- **Config legacy de agentes** (`.kilo/`, `kilo.json`, `CLAUDE.md` — eliminados
  del repo en Release 85; solo pueden existir en disco local, no operativos).

---

## 10. MCPs autorizados y uso operativo

### MCPs permitidos

- **filesystem**: leer/escribir solo dentro del repositorio permitido.
- **git**: status, diff, logs, ramas y commits atómicos.
- **github**: issues, PRs y remoto cuando exista token configurado.
- **postgres**: acceso DB solo mediante `DATABASE_URL` de entorno; nunca imprimir secretos.
- **mcp-seo**: auditoría técnica SEO, metadatos, sitemap, robots, structured data y contenido.
- **playwright**: validación renderizada real, navegación, screenshots y DOM.
- **fetch**: comprobaciones HTTP puntuales y lectura simple de páginas.
- **duckduckgo**: investigación externa no sensible, SERP/GEO básica y comparación pública.
- **diag**: diagnóstico del entorno, herramientas y conectividad local.

### Orden recomendado para auditorías SEO

```
filesystem → git → postgres → mcp-seo → playwright → fetch → duckduckgo → github
```

### Reglas de uso

- Priorizar datos internos reales (DB, filesystem) antes de búsqueda externa.
- Usar postgres antes de asumir contenido del blog — leer DB es más fiable que inferir del código.
- Usar playwright cuando el HTML renderizado pueda diferir del código fuente (componentes cliente, hidratación).
- Usar mcp-seo para evidencias repetibles de metadatos, sitemap, robots y schema.
- Registrar en `auditoria-seo/` cualquier auditoría SEO relevante para trazabilidad.
- Nunca imprimir secretos completos en logs, documentación ni outputs.
- Nunca solicitar indexación de rutas privadas.
- Nunca ejecutar crawling externo masivo sin instrucción explícita.
- No usar MCPs premium, de pago o con créditos comerciales sin instrucción explícita del usuario.
- No usar MCPs que dupliquen capacidades existentes si añaden riesgo o ruido.
- No modificar configuración de modelos, proveedores o APIs externas desde el repositorio (refuerza R10).

### R18. Cobertura del footer: solo 10 ciudades prioritarias

La sección «Cobertura» del footer (`components/marketing/public-footer.tsx`) y el grid
de cobertura de la Home (`TOP_COBERTURA_SLUGS` en `data/landings-locales.ts`) deben
mostrar **exclusivamente las 10 ciudades prioritarias**:

1. Nacaome
2. Choluteca
3. San Lorenzo
4. Goascorán
5. San Marcos de Colón
6. El Triunfo
7. Marcovia
8. Pespire
9. Namasigüe
10. Orocuina

Las ciudades secundarias pueden existir en `sitemap.xml`, `llms.txt`,
`canonical-paths.json` y `areaServed` del schema **solo si tienen `page.tsx` real**
(Grupo B: Langue, Amapala). Las secundarias **sin página real** (Caridad, Alianza,
Apacilagua, Concepción de María, Duyure, Morolica, San Antonio de Flores, Aramecina)
no deben aparecer en sitemap, `llms.txt` ni `canonical-paths.json` (Grupo D). Solo
mantienen redirect 301 hacia la ciudad prioritaria más cercana cuando existe
evidencia de publicación, rastreo o acceso histórico (Grupo C); si no hay evidencia,
no necesitan 301. URL indexable ≠ ciudad visible en cobertura: son capas distintas.

---

## 11. Formato de respuesta final

```
Porcentaje completado:
Porcentaje restante:
Archivos modificados:
Comandos ejecutados:
Resultado de cada comando:
Errores corregidos:
Riesgos pendientes:
NO VALIDADO:
Próximo paso recomendado:
```
