# Protocolo obligatorio para agentes IA — LEX HONDURAS

Este repositorio requiere **precisión, trazabilidad, verificación real y honestidad operativa**.
Ningún agente puede afirmar que algo está implementado, corregido, validado o completado
si no lo ha comprobado mediante lectura de archivos, cambios reales y comandos de validación
cuando correspondan. Las reglas son permanentes, no una tarea puntual.

---

## 1. Lectura obligatoria antes de modificar

En orden:
1. `README.md`, `package.json`
2. Este archivo (`AGENTS.md`)
3. `.kilo/rules/seo.md` (reglas SEO vinculantes)
4. Archivos afectados por el cambio (leer, no asumir)
5. `CHANGELOG.md` (últimas releases para contexto)
6. `docs/auditoria-repositorio-integral.md` §19 (estado post-implementación)

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
| API routes | `build` + test endpoint con `Invoke-RestMethod` |
| SEO / sitemap / robots | `build` + `lint` + verificar `sitemap.xml`/`robots.txt` |
| UI pública | `build` + `test` |
| Fechas del blog | `npm run validate:dates` |
| Contenido editorial | `npm run content:audit` |
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

Las reglas de `.kilo/rules/seo.md` son **vinculantes** para cualquier
modificación con impacto SEO. Resumen:

- **Una URL = una intención de búsqueda.** No crear URLs que compitan.
- **Revisar canibalización** antes de crear contenido nuevo (R2).
- **Alinear title, H1, primer párrafo** con la intención (R3).
- **Sin keyword stuffing** (R4).
- **No inventar datos** (métricas, rankings, ubicaciones) (R5).
- **Priorizar cambios por impacto SEO**: crítico > importante > recomendable (R6).
- **JSON-LD obligatorio** por tipo de página: `LegalService+LocalBusiness`
  (home), `Service` (servicios), `BlogPosting` (blog), `FAQPage` (FAQ),
  `BreadcrumbList`, `Organization`, `WebSite`.
- **No degradar SEO existente**: CWV, schemas, canonical, redirects (R9).
- **SEO local**: NAP consistente, `geo` en LocalBusiness, keywords geográficas (R11).
- **IndexNow + sitemap automático**: sitemap dinámico en `app/sitemap.ts`;
  IndexNow vía `scripts/submit-indexnow.mjs` (dry-run por defecto, R12).

El agente SEO (`SEOSenior` en `.kilo/agent/SEOSenior.md`) tiene autoridad para
optimizar metadatos, schemas, headings, enlazado interno y contenido editorial
sin aprobación adicional (salvo cambios estructurales de URLs).

---

## 6. Datos del blog — estado real (Jun 2026)

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

---

## 7. Fuentes de datos canónicas

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

## 8. Archivos que NO debe tocar la IA

- **Web pública visual** (`app/(public)/**/*.tsx`) — salvo SEO.
- **Motor de cálculo** (`lib/rules/v1/`, `lib/utils.ts`, `lib/catalogos.ts`).
- **Schema DB** (`lib/schema.ts`) — cambios requieren `drizzle-kit generate`.
- **Auth** (`lib/auth.ts`).
- **Proxy** (`proxy.ts`) — cambios pueden abrir filtraciones.
- **Datos de delitos** (`data/delitos.json`, `data/delitos-estados.json`).
- **Redirects 301** de `next.config.ts` (canibalizaciones activas).
- **`THIN_POST_SLUGS`** en `app/sitemap.ts` (mitigación activa hasta reescritura).
- **Config de agentes** (`.kilo/`, `kilo.json`).

---

## 9. Formato de respuesta final

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
