# CHANGELOG — Pineda y Asociados

> **Versión del changelog:** Jun 2026 — reestructurado. Histórico completo en
> [`docs/legacy/CHANGELOG_ARCHIVE.md`](./docs/legacy/CHANGELOG_ARCHIVE.md).

---

## Unreleased — Mejora visual progresiva de la interfaz (Premium equilibrado)

Pulido UI sobre el diseño existente **sin rediseño, sin cambios de contenido,
sin nuevas dependencias ni alteración de la identidad visual**. El objetivo:
resolver incoherencias del sistema de design tokens de `globals.css` y elevar
la percepción de calidad, densidad y jerarquía.

### Dirección visual
Carácter **"Premium equilibrado"**: radius canónico de card = 16px
(`rounded-lg` / `--radius-lg`), densidad editorial (`p-5`), sombra multicapa
con halo dorado en hover, dorado como acento (no decoración).

### Consolidación del sistema de design tokens (`app/globals.css`)
- **Radius unificado**: `.card-premium` alineado a `var(--radius-lg)` (16px)
  en vez de `14px` hardcoded — resuelve el conflicto con `Card` (`rounded-md`
  → `rounded-lg`), que entraba en valor indeterminado.
- **Sombras de botón como fuente única de verdad**: eliminadas las 9 sombras
  inline (`shadow-[0_1px_0_0_rgba...]`) de `cta-buttons.tsx` y
  `public-header.tsx`, que duplicaban y **divergían** de los tokens
  `--shadow-btn-primary/-secondary/-accent`. Ahora se exponen como utilities
  `.btn-shadow-*` / `*-hover` y se aplican de forma consistente.
- **Nuevo token `--shadow-btn-success` / `-hover`** (verde WhatsApp, light +
  dark): antes cada CTA de WhatsApp repetía la sombra inline por todo el sitio.
- **Eliminados tokens duplicados** legacy `--shadow-button-primary` /
  `-hover` (idénticos a `--shadow-btn-primary*`).

### Componentes afectados (radius 16px + densidad + legibilidad)
| Archivo | Cambio |
|---|---|
| `components/ui/card.tsx` | `rounded-md` → `rounded-lg` (canónico) |
| `components/marketing/service-card.tsx` | `rounded-xl` → `rounded-lg` |
| `components/marketing/testimonials-section.tsx` | `rounded-xl` → `rounded-lg` |
| `components/marketing/cta-buttons.tsx` | 8 sombras inline → tokens; botones a `rounded-lg` |
| `components/marketing/public-header.tsx` | sombras inline (WhatsApp + CTA) → tokens; `rounded-lg` |
| `components/marketing/trust-bar.tsx` | icono-contenedor `rounded-full` → `rounded-lg`; microcopy `text-xxs` → `text-xs` |
| `components/marketing/blog-highlights.tsx` | descripción de post `text-xs` → `text-sm` |
| `components/marketing/process-stepper.tsx` | eliminado `border` redundante (doble con `.card-premium`); `rounded-md` → `rounded-lg` |
| `components/marketing/landing-local.tsx` | icono-contenedor unificado (`rounded-full border-2` → `rounded-lg border`); botones CTA a tokens |
| `app/(public)/page.tsx` (home) | **Por qué elegirnos / combos multidisciplinar / ciudades**: icono-contenedor a `w-11 h-11 rounded-lg` con borde; descripciones `text-xs` → `text-sm` (menos altura vacía). **Hero**: añadido bloque visual complementario en `lg:col-span-5` (panel translúcido de sellos/cobertura/horario) que equilibra la composición antes asimétrica. Sin inventar métricas (R4). |

### Lo que NO se toca
Paleta de colores, identidad visual, contenido editorial, arquitectura, rutas,
SEO, schemas JSON-LD, intranet/admin, motor de cálculo, `page-hero.tsx`,
`public-footer.tsx`, `floating-contact-rail` (ya correctos).

### Extensión R16 a páginas públicas internas (2ª pasada)
Aplicación mecánica y coherente de la regla R16 al resto de páginas públicas
internas que conservaban estilos heredados inconsistentes con la home ya
consolidada. **Sin rediseño, sin cambios de contenido, sin nuevas dependencias.**

Patrón recurrente corregido en varias páginas `[slug]` (servicios, derecho-penal,
hondurenos-en-espana): el icono-contenedor de subservicios era
`w-10 h-10 rounded-full border-2 border-accent bg-white` → unificado a
`w-11 h-11 rounded-lg border-accent/30 bg-accent/10` (patrón canónico de R16),
con padding `p-4` → `p-5` (densidad editorial).

| Página | Cambios aplicados |
|---|---|
| `despacho/page.tsx` | 5 icono-contenedores `w-10 rounded-md` → `w-11 rounded-lg` (misión/visión/valores/credenciales/especialidad); avatar equipo `rounded-full` → `rounded-lg`; imagen `rounded-md` → `rounded-lg`; bloque multidisciplinar: card `rounded-md` → `rounded-lg`, icono canónico, desc `text-xs` → `text-sm` |
| `servicios-juridicos/[slug]` | subservicios a icono-contenedor canónico + `p-5`; cards de área relacionada y blog: border en icono; desc de blog `text-xs` → `text-sm` |
| `derecho-penal/[slug]` | subservicios a icono-contenedor canónico; 3 cards relacionadas (área, "+", blog) con border en icono; desc blog `text-xs` → `text-sm` |
| `hondurenos-en-espana/[slug]` | idéntico patrón que derecho-penal/[slug] (subservicios + 3 cards + blog) |
| `preguntas-frecuentes/page.tsx` | FAQ `<details>` `rounded-xl` → `rounded-lg` (unifica con resto de cards) |
| `solicitar-consulta/page.tsx` | 3 cards "visítenos" `rounded-xl` → `rounded-lg`; bloque emergencia `rounded-xl` → `rounded-lg`; items motivos `rounded-md` → `rounded-lg`; CTA "Indicaciones" con `btn-shadow-primary` |
| `como-llegar/page.tsx` | 3 botones de mapas `rounded-md` → `rounded-lg` con `btn-shadow-primary/-secondary`; 3 icono-contenedores `w-9/w-10 rounded-md` → `w-11 rounded-lg` (Dirección, puntos referencia, rutas) |
| `blog/[categoria]/[slug]/page.tsx` | card de artículo relacionado `rounded-xl` → `rounded-lg`; avatar de autor `rounded-full` → `rounded-lg` (avatar contenedor, no chip) |
| `page.tsx` (home, retoque) | numeración de preguntas reales `w-8` → `w-10 rounded-md` (alinea con stepper canónico) |

**Criterio aplicado con criterio (no mecánico a ciegas):**
- Los icono-contenedores pequeños inline en **listas laterales compactas**
  (garantías `w-7`, horario `w-8` en solicitar-consulta) se **mantienen**:
  son micro-iconos secundarios, no cards principales; agrandarlos rompería
  la densidad de esas columnas.
- Los **chips/pills de filtro** (`rounded-full` en FAQ, tags de blog) se
  **mantienen**: las pills circulares son un patrón legítimo de UI, no cards.
- Los **blobs decorativos** del hero (`rounded-full blur-3xl`) se mantienen:
  son fondo, no superficies funcionales.

### Convención nueva (AGENTS.md R16)
- Radius canónico de card pública = `rounded-lg` (16px).
- CTAs de la web pública deben usar `.btn-shadow-*` / `*-hover` (nunca
  `shadow-[...]` inline).
- Icono-contenedor estándar: `w-11 h-11 rounded-lg` con `border` + `bg-tint`.
- Dorado solo como acento (hover, eyebrow), no como fondo plano.

### Validación (4/4 en verde)
| Comando | Resultado |
|---|---|
| `npm run lint` | 0 errores (baseline) — revalidado tras extensión a páginas internas |
| `npm run build` | ✓ Compiled successfully — 305/305 páginas — revalidado tras extensión |
| `npm test` | 397/397 (19 suites) — revalidado tras extensión |
| `npm run visual:check` | **NO VALIDADO**: el pipeline compara contra producción remota, donde los cambios aún no están desplegados. El baseline existe (`e2e/visual-baselines/`, 18 jun). Verificación visual real requiere deploy previo. |

### Estado
`IMPLEMENTADO` y `VALIDADO` (lint/build/test), ambas fases (home+componentes y
extensión a páginas internas). `visual:check` `NO VALIDADO` por limitación del
pipeline (requiere deploy). Pendiente de verificación visual tras despliegue.

---

## Release 89 — Normalización masiva del blog (2026-06-20)

Corrección segura, reproducible e idempotente de los **159 posts publicados**
mediante un nuevo script canónico de normalización (`scripts/normalizar-blog.ts`).
El flujo prioriza la automatización sobre la edición manual y **no inventa
contenido editorial** (R3/R4): solo corrige duplicados técnicos, jerarquía
semántica y formato.

### Nuevo script canónico — `scripts/normalizar-blog.ts`
- **Dry-run por defecto**: nunca escribe sin `--aplicar`.
- **Backup previo** obligatorio (`auditoria-blog/backup-pre-normalizacion-<ts>.json`).
- **Idempotente**: re-ejecutar no produce cambios adicionales (verificado).
- **Sanitización** del body antes de escribir (defensa: nunca HTML sucio).
- Selectores: `--solo-ctas`, `--solo-h1`, `--solo-whitespace`, `--slug <slug>`.

### Correcciones aplicadas (en DB `blog_posts`)
| Tipo | Posts afectados | Descripción |
|------|-----------------|-------------|
| CTAs duplicados eliminados | 75 | Disclaimer legal redundante en el body. El componente `<LegalDisclaimer>` ya lo renderiza (regla editorial explícita en `lib/legal-disclaimer.ts`). Regex precisa: solo elimina el `<p>` que **empieza** con la frase ancla, evitando falsos positivos en párrafos editoriales. |
| H1 → H2 | 14 | Posts de landings locales con `<h1>` en el body generaban doble H1 (la plantilla ya renderiza `post.title` como H1). Conversión conservando atributos y contenido. |
| Whitespace normalizado | 141 | Colapsado de 3+ saltos de línea, espacios finales, `&nbsp;` repetidos. No toca contenido semántico. |

### Auditoría integral (159 posts)
- **Sin errores técnicos**: 0 slugs duplicados, 0 títulos duplicados, 0 fechas
  inválidas/futuras, 0 categorías inválidas, 0 meta descriptions fuera de rango,
  todos los campos obligatorios completos.
- **Peso editorial**: 114 posts < 800 palabras (marcados como "requiere
  ampliación editorial" — trabajo humano, no relleno automático), 32 entre
  800–1000 (objetivo), 13 > 1000.

### Validación (6/6 en verde)
| Comando | Resultado |
|---|---|
| `npm run lint` | 0 errores |
| `npx tsc --noEmit` | 0 errores |
| `npm test` | 397/397 (19 suites) |
| `npm run validate:dates` | 159 posts OK |
| `npm run audit-blog-seo` | 0 errores, 0 warnings |
| `npm run build` | Compiled successfully (305 páginas) |

### Pendientes editoriales (no resueltos por diseño)
- **71 posts** con revisión trimestral vencida (`npm run content:audit`).
- **114 posts** < 800 palabras requieren ampliación editorial humana.
- **1 meta title duplicado** (`como-elegir-abogado-honduras` vs
  `como-elegir-buen-abogado-guia-practica-honduras`): canibalización que
  requiere decisión editorial (cuál canonicalizar/noindex).

---

## Release 88 — Fase HQC: Higiene + Calidad + Coherencia (2026-06-20)

Ejecución completa del plan HQC en **5 commits atómicos** (uno por etapa).
Objetivo: estabilizar la base del repositorio (higiene, coherencia documental,
suelo de calidad) **sin tocar lógica funcional ni rediseñar**.

### Etapa 1 — Higiene y alineación documental (P0) — `chore:`
- `auditoria-blog/` (96 archivos HTML, 1.5MB) fuera del tracking (`git rm -r
  --cached`). Estaba en `.gitignore` pero ya estaba commiteado; no se usa en
  runtime. Preservado en disco local.
- `CHANGELOG.md` §"Estado actual": sincronizado con HEAD real (estaba
  congelado en Release 84).
- `README.md` §"Tooling IA": numeración corregida (Release 87, no 85).

### Etapa 2 — Calidad: coverage + scripts en tsc (P1) — `test:`
- `vitest.config.ts`: configuración de coverage (provider v8, reporteros
  text/lcov, umbral conservador 35%). Script `test:coverage` en `package.json`.
  DevDep `@vitest/coverage-v8` 4.1.9.
- `tsconfig.json`: `scripts/` incluido en el typecheck (`scripts/legacy/`
  sigue excluido). Fix de 5 errores de tipo en `audit-blog-seo.ts` y
  `audit-canibilizacion.ts`.
- **Línea base de coverage medida: 66.21% líneas, 64.73% branches, 56.14%
  funciones.** Motor de cálculo (`lib/rules/v1/`): 93-94%.

### Etapa 3 — CI: E2E en GitHub Actions + Dependabot (P1) — `ci:`
- `.github/workflows/ci.yml`: nuevo job `e2e` (Playwright) que depende del
  job `quality`. Sube report y traces como artifacts.
- `.github/dependabot.yml` (nuevo): renovación mensual de npm + GitHub
  Actions, agrupando minor+patch en un PR por ecosistema.

### Etapa 4 — DX (P2) — `docs:`
- `package.json`: `engines` (node>=22, npm>=11).
- `README.md`: secciones "Troubleshooting" y "Contribuir".
- `AGENTS.md` §4: `Invoke-RestMethod` → `Invoke-RestMethod (PowerShell) o curl`.

### Etapa 5 — Cierre y validación
Pipeline completo validado en verde (ver abajo).

### Validación final (6/6 pasos en verde)
| Comando | Resultado |
|---|---|
| `npm run lint` | 0 errores (1 warning preexistente no relacionado) |
| `npx tsc --noEmit` | 0 errores (incluye `scripts/` raíz) |
| `npm test` | 397/397 (19 suites) |
| `npm run test:coverage` | 66.21% líneas (umbral 35% superado) |
| `npm run validate:dates` | 159 posts OK, ninguna fecha futura |
| `npm run build` | Compiled + TypeScript OK + IndexNow dry-run OK |

### Definición de Done cumplida
- ✅ `git ls-files auditoria-blog/` devuelve 0 archivos.
- ✅ CHANGELOG §"Estado actual" coincide con HEAD.
- ✅ Coverage medible y umbral respetado.
- ✅ Scripts validados por tsc en CI.
- ✅ Job E2E presente en CI (se ejecutará en el próximo push/PR).
- ✅ Dependabot configurado.
- ✅ Sin deuda crítica nueva.

### Nota de honestidad (AGENTS.md R11)
El job E2E del CI **no se ha validado con ejecución real en GitHub Actions**
desde esta sesión (requiere push al remoto). La config YAML es sintácticamente
válida (verificada con js-yaml) y `playwright.config.ts` ya estaba preparado
para CI desde releases anteriores.

---

## Estado actual resumido

| Aspecto | Valor |
|---------|-------|
| **Última release** | Release 88 — Fase HQC (Higiene + Calidad + Coherencia) |
| **Commit** | _(ver `git log -1`)_ |
| **Fecha** | 2026-06-20 |
| **Build** | ✅ Compiled + TypeScript OK |
| **Tests** | 397/397 (19 suites) + 37 E2E (job CI añadido) |
| **Coverage** | ✅ 66.21% líneas (umbral 35%) |
| **validate:dates** | ✅ 159 posts sin fechas futuras |
| **content:audit** | ❌ 71 posts vencidos editoriales (pendiente humano, no bug) |
| **Pendiente externo crítico** | Rotar OAuth Client Secret en GCP + configurar `RESEND_WEBHOOK_SECRET` en Vercel |

---

`kilo.json`, `CLAUDE.md` y el directorio completo `.kilo/` (14 archivos:
agente SEOSenior, 5 comandos, 1 regla, 5 skills y configs) estaban commiteados
en git a pesar de que Release 84 los declaró "legacy / no operativos". Esta
contradicción podía confundir a los agentes y crear conflictos de modelo.

**Cambios:**
- `git rm` de `kilo.json`, `CLAUDE.md` y `.kilo/` (14 archivos eliminados del
  tracking; permanecen en disco local si existen).
- `.gitignore`: entradas para `kilo.json`, `CLAUDE.md`, `.kilo/`.
- `AGENTS.md` §6 y §9: redacción actualizada — los archivos ya no son "legacy
  que puede existir", sino "eliminados del repo, no recrear".
- `README.md`: fila de `.kilo/` eliminada de la tabla de docs; sección
  "Tooling IA" actualizada.

**No se modificó:** código funcional, rutas, SEO, schemas, auth, proxy, motor
de cálculo, ni ningún archivo de configuración operativa.

**Validación:** lint 0 errores.

---

## Release 87 — Eliminación de tooling IA legacy del repositorio (2026-06-19)

`kilo.json`, `CLAUDE.md` y el directorio completo `.kilo/` (14 archivos:
agente SEOSenior, 5 comandos, 1 regla, 5 skills y configs) estaban commiteados
en git a pesar de que Release 84 los declaró "legacy / no operativos". Esta
contradicción podía confundir a los agentes y crear conflictos de modelo.

**Cambios:**
- `git rm` de `kilo.json`, `CLAUDE.md` y `.kilo/` (14 archivos eliminados del
  tracking; permanecen en disco local si existen).
- `.gitignore`: entradas para `kilo.json`, `CLAUDE.md`, `.kilo/`.
- `AGENTS.md` §6 y §9: redacción actualizada — los archivos ya no son "legacy
  que puede existir", sino "eliminados del repo, no recrear".
- `README.md`: fila de `.kilo/` eliminada de la tabla de docs; sección
  "Tooling IA" actualizada.

**No se modificó:** código funcional, rutas, SEO, schemas, auth, proxy, motor
de cálculo, ni ningún archivo de configuración operativa.

**Validación:** lint 0 errores.

---

## Release 86 — Auditoría GSC, Bing Webmaster Tools y GA4 (2026-06-20)

Auditoría integral de las tres plataformas de medición/indexación, con
corrección del único problema real detectado desde el repositorio.

**Diagnóstico (datos reales, 28 días):**
- GSC: propiedad `sc-domain` verificada; 8/9 URLs prioritarias indexadas
  (`/como-llegar` "Descubierta sin indexar"); 0 clics / 3 impresiones.
- Bing WMT: verificado vía `BingSiteAuth.xml` (200); IndexNow key pública
  consistente; dry-run OK (11 URLs, 0 privadas).
- GA4: conectado (165 usuarios/28d); GA4 frontend sin duplicar.

**Problema corregido (GA4 contaminado por intranet):**
GA4 y Clarity se cargaban en TODAS las rutas (incluida `/intranet/admin/*`),
haciendo que las páginas internas aparecieran entre las top pages de
marketing. Causa: `app/layout.tsx` montaba los `<Script>` sin filtro de
pathname. Corrección: nuevo componente `components/analytics-scripts.tsx`
(client, usa `usePathname()`) que excluye `/intranet`, `/preview`, `/api`.

**Informe completo:** `docs/seo-search-console-bing-ga-audit.md` (14 secciones:
resumen, GSC, Bing, IndexNow, GA4, eventos, cruce GSC+GA4, URLs prioritarias,
problemas técnicos/editoriales/autoridad, acciones aplicadas, acciones externas,
plan 7/14/30 días).

**Script reproducible:** `scripts/seo-audit-gsc-ga4.mjs` (consulta GSC + GA4 en
vivo, salida `scripts/.seo-audit.json`).

**Acciones externas documentadas (NO de código):** eliminar propiedad GSC con
typo "asocioshn", solicitar indexación de `/como-llegar`, añadir
`NEXT_PUBLIC_CLARITY_ID` en Vercel, marcar eventos como conversión en GA4 Admin,
excluir bots en GA4, redeploy.

**Archivos modificados:** `components/analytics-scripts.tsx` (nuevo),
`app/layout.tsx`, `scripts/seo-audit-gsc-ga4.mjs` (nuevo),
`docs/seo-search-console-bing-ga-audit.md` (nuevo), `.gitignore`.

**Validación:** lint 0 errores, build OK, test 397/397, validate:dates OK,
indexnow:dry OK, `seo-audit-gsc-ga4.mjs` GSC+GA4 conectados.

---

## Release 85 — CTA fusionado en landings locales + modelos IA no fijados en doc (2026-06-19)

**Punto 1 — CTA duplicado en landings locales (abogados-en-*):**
Las 3 landings de SEO local tenían dos bloques CTA consecutivos (uno dinámico
por ciudad y otro hardcoded "Nacaome, Valle"). Se fusionaron en un único bloque
con eyebrow, título, subtítulo y 3 botones (WhatsApp, solicitar consulta, llamar),
todos coherentes con la ciudad de la URL. Verificado en producción.

**Punto 2 — Modelos de IA no fijados en documentación:**
Los modelos de IA cambian dinámicamente según el entorno. README.md y AGENTS.md
ya no listan modelos concretos (GLM, DeepSeek, etc.) que queden obsoletos al
cambiar de modelo en ejecución. Las reglas aplican independientemente del modelo.

**Archivos modificados:** `components/marketing/landing-local.tsx`, `README.md`,
`AGENTS.md`.

**Validación:** lint 0 errores, build OK, test 397/397, deploy verificado en
producción (las 3 landings con CTA corregido).

---

## Release 84 — Actualización de tooling IA a OpenCode y Zcode (2026-06-19)

Normalización del protocolo de agentes IA. OpenCode y Zcode pasan a ser el
tooling activo. Kilo, SEOSenior y configuraciones `.kilo/` quedan como legacy.

**Cambios:**
- `AGENTS.md`: nueva sección §6 (herramientas y modelos de IA — sin fijar
  modelos concretos; reglas SEO autosuficientes).
- `README.md`: nueva sección "Tooling IA". Referencias a Kilo/SEOSenior
  eliminadas o marcadas como legacy.
- `CHANGELOG.md`: entrada actual (Release 84).
- No se modificó código funcional, rutas, SEO, schemas, auth, proxy ni motor
  de cálculo.

**Validación:** lint 0 errores, build OK, test 397/397.

---

## Release 83 — Normalización de marca como Pineda y Asociados (2026-06-19)

Unificación del nombre del proyecto bajo la marca "Pineda y Asociados" en
documentación, texto visible de la interfaz, metadatos y prompts de agentes.

**Cambios:**
- README, AGENTS, CHANGELOG, docs/: título normalizado.
- Intranet (sidebar, admin panel): "LEX HONDURAS" → "Pineda y Asociados".
- PDF (informes periciales): marca + email actualizados.
- `.kilo/agent/SEOSenior.md`: prompt actualizado.
- `docs/normalizacion-marca.md`: documento de decisión y reglas.

**No se modificaron:** rutas locales, nombres de proyecto Vercel, URLs
técnicas, valores de test, archivos legacy/backup.

**Validación:** lint 0 errores, build OK, test 397/397.

---

## Últimas releases

### Release 82 — Implementación de las 7 fases de la auditoría integral (2026-06-19)

Ejecución completa del plan de `docs/auditoria-repositorio-integral.md`. 7 commits
atómicos. Detalle en §19 del informe.

**Archivos clave:** 16 archivos modificados, 83 movidos a legacy.

**Validación:** lint OK, build OK, 397 tests OK, 37 E2E OK, validate:dates OK,
content:audit = 71 vencidos editoriales (pendiente humano).

---

### Release 81 — Endurecimiento de validadores y seguridad de endpoints críticos (2026-06-19)

**Correcciones:**
- Validadores: `MAX_DATE` dinámica (era hardcodeada → falsos positivos).
  **No se modificaron datos del blog** (verificado contra Neon).
- Webhook Resend: verificación de firma Svix (`lib/webhook-verify.ts`), escape
  HTML anti-XSS, 503 seguro en producción si falta `RESEND_WEBHOOK_SECRET`.
- OAuth callback: ya no devuelve `refresh_token` en body.
- Secreto OAuth filtrado eliminado de `oauth-get-refresh-token.mjs` (lee de env).
- `.env.example`: +`RESEND_WEBHOOK_SECRET`, +`OAUTH_CLIENT_ID`/`OAUTH_CLIENT_SECRET`.

**Archivos clave:** `scripts/validar-fechas-blog.ts`, `scripts/content-audit.ts`,
`app/api/email/inbound/route.ts`, `app/api/oauth/callback/route.ts`,
`lib/webhook-verify.ts` (nuevo), `scripts/oauth-get-refresh-token.mjs`.

**Validación:** lint OK, build OK, 382/382 tests OK, validate:dates ✅ (antes FAIL).

---

### Release 80 — Fase 1 + Fase 3 del plan de indexación: canonicalización + enlazado (2026-06-19)

**Punto 1 — Sitemap excluye posts canonicalizados** (`app/sitemap.ts`):
Posts con `canonicalUrl` apuntando a otra URL del propio dominio no aparecen
como URLs independientes en `sitemap.xml`.

**Punto 2 — Enlazado interno en `/hondurenos-en-espana`**:
Añadido `BlogHighlights` con 6 posts estratégicos.

**Punto 3 — Script de auditoría** (`scripts/auditar-indexacion-prioritaria.mjs`):
Health-check de 15 URLs prioritarias en producción.

**Validación:** lint OK, build OK, 382/382 tests OK, 37/37 E2E OK.

---

### Releases anteriores

Ver [`docs/legacy/CHANGELOG_ARCHIVE.md`](./docs/legacy/CHANGELOG_ARCHIVE.md)
para Releases 1–79.
