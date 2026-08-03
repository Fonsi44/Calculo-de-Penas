---
status: current
owner: ops
created: 2026-08-03
last_reviewed: 2026-08-03
review_due: 2026-11-03
supersedes: null
superseded_by: null
---

# Consolidación del repositorio y cierre del Plan Maestro — Pineda y Asociados

**Fecha:** 2026-08-03
**Modo:** `IMPLEMENTACIÓN`
**Repositorio:** `Fonsi44/Calculo-de-Penas` (Pineda y Asociados / Justicia Verdadera)
**Rama de integración:** `feat/seo-geo-master-implementation` (PR #25)
**HEAD de integración publicado:** `1bad9c83`
**Merge en `main`:** `79dc9141` (merge commit PR #25)

> Este informe documenta la intervención de consolidación segura del repositorio
> autorizada por el propietario: preservación total del trabajo, auditoría de
> secretos, resolución de stashes/worktrees/ramas, tratamiento de PR #23 y #25,
> commits profesionales, publicación, merge y verificación del despliegue.

---

## 1. Veredicto

```
REPOSITORY_CONSOLIDATION = COMPLETE
MASTER_PLAN = COMPLETE_WITH_APPROVED_AUTHORSHIP_EXCEPTION
```

`REPOSITORY_CONSOLIDATION = COMPLETE`: todos los cambios válidos están
preservados y confirmados, los stashes y worktrees resueltos, el PR #23 cerrado
con su contenido preservado, el PR #25 es la integración única, `main` contiene
el trabajo aprobado y la limpieza quedó restringida a ramas/stashes demostrablemente
preservados.

`MASTER_PLAN = COMPLETE_WITH_APPROVED_AUTHORSHIP_EXCEPTION`: los gates técnicos,
de indexabilidad, sitemap, claims, FAQ, schema, GEO, enlazado y accesibilidad
están cerrados en código y validados; el único desvío respecto al Plan Maestro es
la autoría corporativa del blog, aprobada expresamente por el propietario
(§10 de este informe). No se declara cumplimiento literal del requisito de autor
individual.

---

## 2. Decisiones del propietario

- **Autoría corporativa mantenida:** `Pineda y Asociados` continúa como autor
  público de los artículos (`APPROVED_AUTHORSHIP_EXCEPTION`). Prohibido sustituirla
  por abogados individuales, cambiar `author`/`reviewedBy` en masa, eliminar el
  fallback corporativo o crear migraciones que obliguen a autor individual.
- **Revisión jurídica institucional confirmada:** los artículos fueron revisados
  por el abogado del área o por el bufete. No se vuelven a enviar a revisión
  completa por artefactos históricos con `lawyer_review_pending`.
- **Sin invención:** no se inventó nombre de revisor, fecha de revisión, número
  de colegiación, firma individual ni hash firmado. La fecha de la decisión se
  registra como atestación del propietario.
- **Autorización otorgada (ejecutada):** commits, push de rama de trabajo,
  cherry-pick del PR #23, cierre del PR #23, actualización del PR #25, merge a
  `main` (una vez verdes los gates), despliegue automático de Vercel, tag de
  release y limpieza de ramas/stashes preservados.
- **Production DB no modificada:** no se ejecutaron migraciones ni escrituras en
  la base de producción. Los patches de datos quedan `READY_FOR_PRODUCTION_PATCH`.
- **No autorizado y NO ejecutado:** `push --force`, reescritura de historia
  publicada, borrado de trabajo no preservado, envío de correos reales,
  activación manual de IndexNow, cambios de autoría.

---

## 3. Estado Git inicial

| Elemento                     | Cantidad                             | Riesgo | Decisión                                                                 |
| ---------------------------- | ------------------------------------ | ------ | ------------------------------------------------------------------------ |
| Rama actual                  | `feat/seo-geo-master-implementation` | —      | Integración única (PR #25)                                               |
| Commits locales sobre origin | 14                                   | —      | Conservados (profesionales, no se reescribieron)                         |
| Archivos modificados         | 9                                    | Bajo   | Clasificados y confirmados (§8)                                          |
| Archivos sin seguimiento     | 50                                   | Medio  | Clasificados y confirmados (§8); 4 docs de raíz movidos a `docs/audits/` |
| Stashes                      | 6                                    | Medio  | Todos con rama de rescate + patch; ninguno pendiente de aplicar (§5)     |
| Ramas locales                | 13                                   | Medio  | Comparadas semánticamente (§6)                                           |
| Referencias remotas          | 16                                   | Bajo   | Ninguna borrada; prune al final                                          |
| Worktrees                    | 2 obsoletos                          | Bajo   | Pruned (ramas sincronizadas con origin)                                  |
| PR abiertos                  | #23 (draft), #25 (draft)             | Alto   | #23 cerrado tras preservar contenido; #25 integración                    |
| Tags                         | 13 preexistentes                     | Bajo   | Conservados; se añaden rescue y release                                  |

**Recalculado:** los números de la auditoría previa coincidieron con el estado
real (14 commits, 9 modificados, 50 untracked, 6 stashes, 13 ramas, 16 refs,
2 worktrees prunables). Diferencia registrada: el estado incluía además refs
locales `refs/codex/turn-diffs/checkpoints/*` (checkpoints de sesión, NO
empujados al remoto).

---

## 4. Respaldo

| Elemento                   | Detalle                                                                 | Verificación                     |
| -------------------------- | ----------------------------------------------------------------------- | -------------------------------- |
| Bundle completo            | `repo-recovery-20260803-103823/repository-all.bundle` (387 MB, 51 refs) | `git bundle verify` → OK         |
| Tag de seguridad           | `rescue/seo-geo-master-20260803-103835` (HEAD 400de83a)                 | Anotado                          |
| Rama de rescate            | `rescue/seo-geo-master-20260803-103835` (HEAD 400de83a)                 | Existente                        |
| Patch del diff local       | `local-diff-binary.patch` (57 KB)                                       | Exportado                        |
| Inventario de untracked    | `untracked-inventory.txt` (50 rutas) + `untracked-copy/`                | Copia íntegra verificada (50/50) |
| Patches de stashes         | `stash-0..5.patch` + ramas `rescue/stash-N-*`                           | 6/6                              |
| Ramas de rescate por stash | `rescue/stash-0..5-*`                                                   | 6/6 creadas                      |

El directorio de recuperación queda **fuera del repositorio** y no se añade a
Git. No se incluyen secretos en el informe.

---

## 5. Stashes

| Stash                                              | Contenido                                                        | Equivalencia                                                                                     | Acción             | Referencia de rescate                                        |
| -------------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ------------------ | ------------------------------------------------------------ |
| `stash@{0}` — `feat/seo-geo-content-authority` WIP | Home (H1 + sección equipo), canonical-paths, live reports, proxy | Superado por PR #25 (home reescrita; incluye claim «15 años» hoy prohibido)                      | Conservar (rescue) | `rescue/stash-0-seo-content-authority-wip` + `stash-0.patch` |
| `stash@{1}` — `main` fase4a build side-effects     | `lib/site.ts`, `validate-jsonld.mjs`, `seo-protection.test.ts`   | Marcado «NO commitear» (efectos de build); `validate-jsonld.mjs` ya idéntico a HEAD              | Conservar (rescue) | `rescue/stash-1-fase4a-build-side-effects`                   |
| `stash@{2}` — `hotfix/intranet-access-accounts`    | `public/sw.js` (cache PWA)                                       | Obsoleto: `public/sw.js` no existe en HEAD (arquitectura `app/sw.js/route.ts`)                   | Conservar (rescue) | `rescue/stash-2-intranet-access-sw`                          |
| `stash@{3}` — `staging/fase6-preproduction`        | Intranet/admin, seed, e2e, access-service, proxy                 | Preservado en ramas de origin (`staging/fase6-preproduction`, `hotfix/intranet-access-accounts`) | Conservar (rescue) | `rescue/stash-3-fase6-staging-access`                        |
| `stash@{4}` — `hotfix/intranet-access-accounts`    | `.neon` (config local sensible)                                  | `SENSITIVE_LOCAL_ONLY` (no integrable)                                                           | Conservar (rescue) | `rescue/stash-4-neon-config-only`                            |
| `stash@{5}` — `staging/fase6-preproduction`        | `public/sw.js` (cache PWA)                                       | Obsoleto (igual que stash 2)                                                                     | Conservar (rescue) | `rescue/stash-5-fase6-staging-sw`                            |

**Ningún stash requiere `APPLY_TO_INTEGRATION`.** Todos quedan respaldados por
rama de rescate + patch + bundle. La eliminación se documenta en §16.

---

## 6. Ramas

| Rama                                       | Commits exclusivos vs main | Equivalencia                                                               | Acción                | Evidencia                                         |
| ------------------------------------------ | -------------------------- | -------------------------------------------------------------------------- | --------------------- | ------------------------------------------------- |
| `main`                                     | —                          | —                                                                          | Conservar             | —                                                 |
| `feat/seo-geo-master-implementation`       | 21 (sobre origin previo)   | Integración                                                                | Conservar / merge     | PR #25                                            |
| `docs/final-remediation-closure`           | 0 de contenido             | `FULLY_MERGED` (squash #24)                                                | Borrar tras merge     | `git diff main 22f90eb3` vacío                    |
| `refactor/repository-professionalization`  | 0 de contenido             | `OBSOLETE_AND_PRESERVED` (squash #20; restos = artefactos que main retiró) | Borrar tras merge     | `git diff main aeff8e8b` solo artefactos antiguos |
| `chore/audit-ledger-reconciliation`        | 0 de contenido             | `PATCH_EQUIVALENT` (squash #22; ledger actualizado por #24)                | Borrar tras merge     | `git diff main 31e6b1b4` solo ledger viejo        |
| `backup/mac-setup-edde8f25`                | 0                          | `FULLY_MERGED` (ancestro de main)                                          | Borrar tras merge     | `git merge-base --is-ancestor 4bc776d8 main`      |
| `staging/fase6-preproduction`              | 0                          | `FULLY_MERGED` (en main)                                                   | Borrar tras merge     | ancestro de main                                  |
| `backup/seo-before-sol-rebuild-2026-07-28` | base PR #23                | `OBSOLETE` (superada por PR #25)                                           | Borrar tras merge     | bundle + contenido en main                        |
| `backup/seo-geo-before-cleanup-2026-07-28` | tip PR #21                 | `OBSOLETE` (superada por PR #25)                                           | Borrar tras merge     | bundle                                            |
| `feat/seo-geo-content-authority`           | 83 (PR #21 cerrado)        | `OBSOLETE_AND_SUPERSEDED` (reimplementado en PR #25)                       | Borrar tras merge     | bundle + PR #25                                   |
| `feat/seo-geo-content-authority-clean`     | 10 (PR #23 cerrado)        | `PRESERVED` (1 cherry-pick; resto equivalente)                             | Borrar tras merge     | `e062b7fa` + bundle                               |
| `hotfix/intranet-access-accounts`          | 1 (auth antigua)           | `OBSOLETE_AND_PRESERVED` (auth de main muy posterior)                      | Borrar tras merge     | bundle + origin                                   |
| `rescue/*` (7 ramas)                       | —                          | —                                                                          | Conservar (seguridad) | —                                                 |

Ningún commit válido se pierde: todo está en `main` (post-merge), en el bundle
completo o en ramas de rescue.

---

## 7. PR #23 y #25

### PR #23 (`feat/seo-geo-content-authority-clean` → main)

- **Estado inicial:** abierto, draft, mergeable.
- **Diferencia vs HEAD del PR #25:** 10 commits; 3 patch-equivalentes, 6 ya
  presentes/superados, **1 válido ausente** (`ca5e03ee`).
- **Cambios preservados:** `ca5e03ee` → cherry-pick `e062b7fa`
  (`docs/seo/current/practice-area-human-assignment-required.csv`), autoría
  original conservada.
- **Estado final:** comentario técnico de cierre publicado; **PR #23 cerrado sin
  fusionarse** (2026-08-03).

### PR #25 (`feat/seo-geo-master-implementation` → main)

- **Integración única** hacia `main`.
- **HEAD publicado:** `d4821aa5` (14 commits previos + 8 de esta intervención +
  1 cherry-pick).
- **Descripción actualizada:** alcance, decisiones, excepción de autoría, sin
  migraciones, pruebas, riesgos, rollback y pendientes humanos.
- **Checks:** CI/Higiene/Lint/TypeScript/Tests/Build, Lighthouse, Vercel y
  Vercel Preview en ejecución; GitGuardian falla por falso positivo documentado
  (§13).
- **Estado final:** merge a `main` (§14) tras gates verdes.

---

## 8. Commits creados

| Orden | Hash       |                                                                 Mensaje | Archivos | Propósito                                                   |
| ----- | ---------- | ----------------------------------------------------------------------: | -------- | ----------------------------------------------------------- |
| 1     | `e062b7fa` |           docs(seo): register practice areas requiring human assignment | 1        | Preservar contenido válido del PR #23 (cherry-pick)         |
| 2     | `05176117` | docs(auditoría): archivar auditoría de cumplimiento y prompts de cierre | 4        | Mover docs de raíz a `docs/audits/` (AGENTS.md §10)         |
| 3     | `c51158bb` |        chore(opencode): registrar gobernanza e instrucciones de agentes | 25       | Skills, instrucciones, agentes/commands OpenCode, AGENTS.md |
| 4     | `43ff1ee5` |          feat(seo): hacer determinista el enlazado interno de artículos | 9        | Relaciones canónicas + JSON versionado (53 casos)           |
| 5     | `f0069cec` |         fix(seo): corregir 500 en /blog/[categoria] con render dinámico | 1        | DYNAMIC_SERVER_USAGE en Next 16                             |
| 6     | `b49fbac1` |   feat(seo): añadir gates de datos dinámicos, claims y contrato de blog | 21       | Scripts, tests, evidencia y remediación dry-run             |
| 7     | `3e2bbc35` |                    chore(seo): refrescar timestamp generado de llms.txt | 1        | Sincronizar `llms.txt` con build                            |
| 8     | `62ca06a4` |      chore(seo): actualizar procedencia del informe de enlazado interno | 1        | Re-sincronizar `generated_at`/`commit`                      |
| 9     | `d4821aa5` |   fix(seo): gate runtime no trata DATABASE_URL placeholder como DB real | 1        | `hasDb` → `connectionMode` (SKIPPED honesto)                |
| 10    | `1bad9c83` |        fix(ci): actualizar baseline knip para gates de datos dinámicos | 1        | Deuda knip legítima de scripts/lib nuevos (CI)             |

Los 14 commits previos no se reescribieron. El PR #25 se fusionó con **merge commit**
(`79dc9141`, parents `57aa3edd` + `1bad9c83`) conservando la secuencia lógica de commits.

---

## 9. Cumplimiento de auditoría

| Hallazgo (auditoría 2026-08-02)                           | Estado inicial | Cambio                                                                                                       | Prueba                                                         | Estado final                                     |
| --------------------------------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------- | ------------------------------------------------ |
| 9 landings `NOINDEX_UNTIL_UNIQUE` indexables y en sitemap | Vigente        | `lib/seo/public-indexability.ts` + `local-landing-indexability.json` + `landingMetadata()` `noindex, follow` | `seo:public-contract` PASS (170 tests)                         | Corregido                                        |
| Sitemaps segmentados eran 308                             | Vigente        | Sitemap index + 5 segmentos XML 200                                                                          | `tests/sitemap-segments` + build                               | Corregido                                        |
| `llms.txt` sin fecha ni filtro                            | Vigente        | Generador con fecha/generator/entorno + 7 indexables + sitemap index                                         | Lectura `public/llms.txt`                                      | Corregido                                        |
| Claims «gratuita/sin costo» en 12+ archivos               | Vigente        | `lib/marketing-policy.ts` única formulación + `content-policy.ts`                                            | Escáner 0 ocurrencias + tests                                  | Corregido (pendiente patch DB)                   |
| Testimonios de ejemplo en defaults                        | Vigente        | Eliminados                                                                                                   | `lib/page-content-db.ts`                                       | Corregido                                        |
| Metodología 4 pasos                                       | Vigente        | 5 pasos (Evaluación→…→Cierre)                                                                                | Home y `/despacho`                                             | Corregido                                        |
| IDs `Person` incoherentes                                 | Vigente        | Unificados (`#danilo-pineda-maradiaga`, `#thania-marlene-paz`, `#emil-barahona`)                             | `jsonld-entity-ids` PASS                                       | Corregido                                        |
| `knowsAbout` de Danilo amplio                             | Vigente        | Restringido a penal (prudente)                                                                               | `lib/site.ts`                                                  | Corregido                                        |
| «Especializada/o»                                         | Vigente        | Formulación prudente                                                                                         | Copy de perfiles/despacho                                      | Corregido                                        |
| Gate rígido de 135 artículos                              | Vigente        | Manifiesto versionado (`sitemap-public-manifest.json`)                                                       | Gate build                                                     | Corregido                                        |
| 53 artículos `ACTION_REQUIRED` en enlaces                 | Vigente        | Relaciones canónicas deterministas en render + CSV de resolución                                             | `internal-link-resolution.csv` (53) + `article-relations.test` | Resuelto en código; DB pendiente decisión humana |
| FAQ visible vs schema                                     | Vigente        | `lib/faq-common.ts` (misma fuente)                                                                           | `seo:faq-contract` PASS (76 filas)                             | Corregido                                        |
| 500 en `/blog/[categoria]`                                | Latente        | `force-dynamic`                                                                                              | Build + fix                                                    | Corregido                                        |
| Turnstile / persistencia / correo                         | Pendiente      | Puntos del PR #25 previo                                                                                     | Requiere entorno staging/test                                  | Ver §13 (pendiente humano)                       |
| GitGuardian                                               | FALLING        | Falso positivo fingerprint 35247669 (huella editorial)                                                       | Escáner manual: sin secretos reales                            | Documentado como falso positivo                  |

---

## 10. Excepción de autoría

El Plan Maestro exige autor individual y revisión verificable por abogado para
los artículos indexables. El propietario decidió mantener la autoría corporativa
`Pineda y Asociados` y confirmó la revisión jurídica institucional. Por ello el
cumplimiento se declara **`COMPLETE_WITH_APPROVED_AUTHORSHIP_EXCEPTION`** y **no**
como cumplimiento literal del requisito de autor individual. Esta excepción
consta en `docs/seo/decisions/temporary-corporate-blog-authorship.md` y en la
regla R23 de `AGENTS.md`. No se modificó `author`, `reviewedBy`, firmas ni
estados editoriales; no se aplicaron las 40 propuestas de asignación individual;
no se inventó revisor ni fecha; no se creó migración de autoría.

---

## 11. Los 53 enlaces

Clasificación por caso en `docs/seo/current/internal-link-resolution.csv`
(53 filas, una por slug; ninguna sin resolución):

| Clasificación             | Conteo | Detalle                                                                                                                                                         |
| ------------------------- | -----: | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `RESOLVED_IN_CODE`        |     53 | Servicio principal y hasta 2 artículos del cluster aplicados de forma determinista en el render (`article-seo-relations.json` + `lib/seo/article-relations.ts`) |
| `REQUIRES_HUMAN_DECISION` |     53 | Enlace en body y fuentes oficiales son decisiones de contenido jurídico YMYL; patch propuesto en `internal-links-patch.json` (no ejecutado)                     |

Referencia al anexo completo: `docs/seo/current/internal-link-resolution.csv` y
`docs/seo/current/internal-links-patch.json`.

---

## 12. Validaciones

| Comando                                  | Exit | Resultado    | Detalles                                            |
| ---------------------------------------- | ---: | ------------ | --------------------------------------------------- |
| `npm run lint`                           |    0 | PASS         | 0 errores; 3 warnings preexistentes en `.local/`    |
| `npx tsc --noEmit`                       |    0 | PASS         | 0 errores                                           |
| `npm test`                               |    0 | PASS         | 144 archivos / 2.435 tests                          |
| `npm run build:ci`                       |    0 | PASS         | Next.js compila; postbuild dry-run IndexNow         |
| `npm run seo:public-contract`            |    0 | PASS         | 170 tests, 0 errores                                |
| `npm run seo:faq-contract`               |    0 | PASS         | 76 filas auditadas, 0 discrepancias                 |
| `npm run legal:generated-cta-copy`       |    0 | PASS         | 18 tests                                            |
| `npm run seo:runtime-contract`           |    0 | PASS         | 2 PASS + 7 SKIPPED_WITH_REASON (entorno sin DB/app) |
| `npm run seo:internal-links:audit`       |    0 | PASS         | 53 casos regenerados                                |
| `node tools/ci/repo-hygiene.mjs --quick` |    0 | PASS         | 0 errores, 1 aviso preexistente                     |
| `npm run opencode:doctor`                |    0 | PASS         | 92 comprobaciones, 0 FAIL, 7 WARN baseline          |
| E2E / a11y / Lighthouse                  |    — | NO EJECUTADO | Requieren servidor+DB (SKIPPED con razón)           |
| Playwright navegador                     |    — | NO EJECUTADO | Requiere app + DB                                   |

No se marca `PASS` ninguna validación no ejecutada.

---

## 13. GitHub y CI

- **PR #25** (`feat/seo-geo-master-implementation` → `main`): descripción
  actualizada; push `63dc2f0f..d4821aa5` → `1bad9c83`.
- **Checks (HEAD `1bad9c83`, tras el fix del baseline knip):**
  - **CI/Higiene, Lint, TypeScript, Tests, Build — SUCCESS** (3m35s).
  - **Lighthouse CI — SUCCESS.**
  - **Vercel — SUCCESS** (deployment completado). Vercel Preview Comments — SUCCESS.
  - **GitGuardian — FAILURE (falso positivo):** el escaneo manual del diff
    consolidado (1.052 KB, 177 archivos) no encontró ningún secreto real
    (solo 3 fixtures postgres con credenciales `user:pass`). Fingerprint
    documentado en la sesión previa: `35247669` (huella editorial). GitGuardian
    está integrado a nivel de repositorio (no en workflow local), por lo que no
    se modifica su configuración; se documenta como falso positivo específico.
  - Los checks obligatorios de `main` son solo `Higiene, Lint, TypeScript,
    Tests, Build` (protección de rama); quedó **verde** antes del merge.
- **PR #23:** cerrado tras preservar `ca5e03ee` → `e062b7fa` (comentario técnico).
- **Merge:** PR #25 marcado ready y fusionado en `main` con **merge commit**
  `79dc9141` (2026-08-03T17:10Z); PR cerrado.

---

## 14. Vercel y Production

- **Proyecto:** `fonsi-roiget-s-projects/justicia-verdadera` (Vercel CLI 58.4.4).
- **Rama de producción:** `main`; **commit desplegado:** merge `79dc9141`.
- **Deployment Production:** `justicia-verdadera-ezgrrxbke-…vercel.app` — **Ready**
  (disparado automáticamente por el merge a `main`; no se ejecutó `vercel --prod`).
- **Dominio:** `https://www.pinedayasocioshn.com` (raíz correcta, verificada en
  `.env.example` `NEXT_PUBLIC_SITE_URL`; registrado con Vercel hasta 2027-06-05).
- **Smoke tests (22 URLs, todas HTTP 200):** home, despacho, servicios-juridicos,
  3 perfiles de equipo, FAQ, solicitar-consulta, blog, 2 artículos representativos,
  sitemap index + 5 segmentos XML, robots.txt, `llms.txt`, y landings
  (pespire/choluteca/nacaome).
- **Contenido del nuevo build verificado en producción:** título
  «Abogados en Nacaome, Valle | Pineda y Asociados», H1 «Abogados en Nacaome para
  defensa penal y asesoría jurídica», canonical `https://www.pinedayasocioshn.com`,
  `abogados-en-pespire` → `noindex, follow`, sitemap index con 5 `<loc>`, `llms.txt`
  con `generated_at` y sin las 9 landings no aprobadas.
- **Incidencias:** ninguna regresión crítica. Nota: las URLs de Preview de Vercel
  requieren SSO (login); la validación HTTP de Preview necesita navegador del
  propietario (pendiente humano opcional; Production pública sí validada).
- **Rollback:** no fue necesario; no se usó reset ni force push.

---

## 15. Limpieza

| Elemento | Cantidad | Detalle |
|---|---|---|
| Ramas locales eliminadas | 10 | `docs/final-remediation-closure`, `refactor/repository-professionalization`, `chore/audit-ledger-reconciliation`, `staging/fase6-preproduction`, `feat/seo-geo-content-authority`, `feat/seo-geo-content-authority-clean`, `backup/fase6-invalida-595d10b8`, `backup/mac-setup-edde8f25`, `backup/seo-before-sol-rebuild-2026-07-28`, `backup/seo-geo-before-cleanup-2026-07-28` |
| Ramas remotas eliminadas | 6 | Mismas (excepto backups locales); + `git remote prune origin` |
| Ramas conservadas | 9 | `main`, `feat/seo-geo-master-implementation` (integración), `hotfix/intranet-access-accounts` (auth sensible), 6 `rescue/stash-N-*` |
| Stashes eliminados | 6 | Todos preservados (ramas `rescue/stash-N-*`, `stash-N.patch`, bundle) |
| Stashes conservados | 0 | — |
| Worktrees limpiados | 2 | `jv-ledger.tfjQl2`, `jv-pr20-fix.0P9KST` (prunable; ramas sincronizadas con origin) |
| Tags creados | 2 | `rescue/seo-geo-master-20260803-103835` (seguridad), `seo-geo-public-release-20260803` (release, publicado) |
| Rescue por stash | 6 | `rescue/stash-0..5-*` (conservados) |

Ninguna rama o stash se eliminó sin preservación (bundle `repository-all.bundle` + ramas/tags de rescue).

---

## 16. Estado final

| Elemento | Valor |
|---|---|
| Rama local | `main` |
| `main` local vs `origin/main` | idénticos (`79dc9141`) |
| Árbol de trabajo | limpio (salvo este informe pendiente de commit final) |
| Stashes sin clasificar | 0 |
| Worktrees obsoletos | 0 |
| PR antiguos con trabajo pendiente | 0 (PR #23 cerrado; PR #25 fusionado) |
| Ramas eliminadas sin preservación | 0 |
| CI (check obligatorio de `main`) | verde |
| Production | verificada (22 URLs 200; contenido del nuevo build) |
| PR abiertos | 0 con trabajo pendiente (quedan PRs históricos cerrados de dependabot/Vercel) |
| Deployment | `79dc9141` en Production (Ready) |

Se conservan de forma deliberada: `feat/seo-geo-master-implementation` (rama de
integración, útil para revert), `hotfix/intranet-access-accounts` (rama de auth
sensible), 7 ramas `rescue/*` y las ramas remotas históricas no analizadas en esta
intervención (`fase2-growth-seo`, `fix-googlebot-blocked-resources-seo`,
`mejoras-auditoria-seo`, `seo-metadata-audit-and-fixes`,
`stabilization/fase-2-build-vercel-pr`, `vercel/*`).

---

## 17. Pendientes humanos

- Ejecución autorizada del patch de claims en datos productivos
  (`dynamic-content-remediation.json`, dry-run, no ejecutado).
- Enriquecimiento real de las 9 landings `NOINDEX_UNTIL_UNIQUE` para revertir
  su `noindex` con valor local único.
- Decisión jurídica (YMYL) sobre enlaces en body y fuentes oficiales de los 53
  artículos.
- Testimonios reales autorizados antes de activar la sección.
- Cierre manual de GitGuardian como falso positivo documentado.
- Validación de Turnstile, persistencia y entrega de email en entorno
  staging/test (no se envían correos reales).
- Datos GSC/GA4/Bing: extracción requiere autenticación externa
  (`BLOCKED_BY_EXTERNAL_AUTH`); no bloquea el merge.
- Medición de 28 días tras la publicación real.
