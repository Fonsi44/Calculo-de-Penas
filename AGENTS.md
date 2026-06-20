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
5. `docs/auditoria-repositorio-integral.md` §19 (estado post-implementación)

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
npm test              # Vitest — 397 tests (19 suites)
npm run test:e2e      # Playwright — 37 tests E2E (4 specs)
npm run validate:dates  # Validar fechas del blog
npm run content:audit   # Auditoría editorial (71 pendientes hoy)
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

**R13. Peso editorial objetivo: 800–1000 palabras reales.**
- Al crear o reescribir un post, el cuerpo (HTML sin tags) debe tener entre
  800 y 1000 palabras para peso SEO suficiente.
- Posts por debajo de 800 palabras se marcan como "requiere ampliación
  editorial". La ampliación es trabajo humano con información verificable;
  **nunca** se rellena con texto genérico para alcanzar el conteo.
- Posts muy por encima de 1000 palabras se revisan por claridad/estructura.
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

**R17. Uso seguro de herramientas IA en contenido (blog:review).**
Aplica a cualquier herramienta que use IA para analizar o "mejorar" contenido
del blog o editorial. Diseñada tras `scripts/blog-ai-review.ts` (ver
CHANGELOG Unreleased):
- **La IA solo sugiere, nunca escribe contenido final en la DB**, salvo que
  se use explícitamente `--aplicar-ia` bajo **supervisión humana aprobada**
  (diferencias revisadas, sugerencias validadas). El flag `--aplicar-ia`
  ejecuta reescritura del body vía DeepSeek con prompt restrictivo (prohíbe
  inventar datos legales) y validación automática (body no vacío, no idéntico
  al original). El modo `--aplicar` ejecuta ÚNICAMENTE transformaciones
  mecánicas idempotentes (H1→H2, CTAs duplicados, whitespace, truncado de
  títulos >60 chars), nunca reescrituras IA.
- **Prohibido rellenar contenido genérico para alcanzar conteo de palabras**
  (refuerza R13). Los posts <800 palabras se marcan como "requiere ampliación
  editorial" y deben ampliarse con información verificable humana, no con
  texto autogenerado. El flag `--aplicar-ia` puede expandir contenido usando
  SOLO la información presente en el artículo original; no inventa datos
  externos.
- **API keys siempre de variables de entorno** (`DEEPSEEK_API_KEY`), nunca
  hardcodeadas. Si una clave se compromete (commiteada, filtrada en chat,
  logs), **requiere rotación** en el panel del proveedor (refuerza §3): el
  código no resuelve una clave comprometida.
- **Toda sugerencia de IA que afirme ley, jurisprudencia, métricas, fechas,
  rankings o claims** debe verificarse contra el CP Honduras / fuentes
  canónicas (`data/delitos.json`, `data/articulos_cp.json`) antes de aplicar.
  La IA puede alucinar citas legales. Incluso en modo `--aplicar-ia`, el
  prompt prohíbe explícitamente inventar datos.
- **No cambiar slugs, URLs, fechas ni categorías automáticamente.** Esos son
  cambios editoriales que requieren decisión humana y revisión de
  canibalización (§5).
- **Dry-run por defecto.** `blog:review` sin `--aplicar` ni `--aplicar-ia` es
  de solo lectura. Backup previo obligatorio antes de cualquier modo de
  escritura (generado automáticamente en `auditoria-blog/`).
- **Sin `DATABASE_URL` real, el script sale limpio** (no degrada el blog).

---

## 8. Fuentes de datos canónicas

| Dato | Archivo | Registros |
|------|---------|-----------|
| Delitos CP | `data/delitos.json` | 483 (100% verificados) |
| Estados de verificación | `data/delitos-estados.json` | 483 verificados |
| Artículos CP | `data/articulos_cp.json` | 635+ |
| Artículos Constitución | `data/articulos_constitucion.json` | 378 |
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

## 10. Formato de respuesta final

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
