# CHANGELOG — Pineda y Asociados

> **Versión del changelog:** Jun 2026 — reestructurado. Histórico completo en
> [`docs/legacy/CHANGELOG_ARCHIVE.md`](./docs/legacy/CHANGELOG_ARCHIVE.md).

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
