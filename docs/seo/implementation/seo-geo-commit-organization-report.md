# Informe — Organización y confirmación de cambios pendientes en commits lógicos

**Fecha:** 2026-08-03
**Rama:** `feat/seo-geo-master-implementation`
**HEAD inicial:** `63dc2f0f`
**HEAD final:** `a13f9579` (13 commits locales, sin push)

---

## 1. Veredicto

```
SEO_GEO_COMMITS = PARTIAL
```

`PARTIAL`, no `COMPLETE`, por dos motivos verificados:

1. **El árbol de trabajo no queda completamente limpio:** quedan sin confirmar
   5 rutas, cada una justificada individualmente (§5): 3 artefactos de
   orquestación en la raíz y 2 rutas de una sesión de trabajo posterior e
   **incompleta** que no compila.
2. **La validación de la suite en el árbol tal cual está no es verde:** el
   `tsc` falla con 7 errores **todos localizados en los archivos excluidos en
   curso** (`scripts/audit-dynamic-content.ts`, `scripts/lib/dynamic-content.ts`).
   El árbol confirmado (los 13 commits) sí está verde y se demostró moviendo
   temporalmente esos archivos a un backup (§7). No se confirmaron por estar
   sintácticamente rotos (regla: ningún commit debe dejar archivos rotos).

El trabajo completo y seguro (hardening SEO/GEO + unidades preexistentes
coherentes) está confirmado en 13 commits con mensajes profesionales.

---

## 2. Estado inicial

- **Rama:** `feat/seo-geo-master-implementation`
- **HEAD inicial:** `63dc2f0f` (`docs(audit): close local secret sanitation incident`)
- **Archivos pendientes:** 93 rutas
  - **Modificados (tracked):** 66
  - **Eliminados:** 1 (`app/sitemap.ts`)
  - **Añadidos/no rastreados:** 26
- **Archivos sensibles detectados en pendientes:** ninguno. `.secrets/`,
  `test-results/`, `nul`, `auditoria-repositorio.zip`, `.env.local`, `.next/`
  y `node_modules/` están ignorados por `.gitignore`.
- **Hallazgo durante la auditoría:** una sesión de trabajo posterior a la
  implementación había añadido en el árbol scripts de auditoría de contenido
  dinámico **incompletos** (`scripts/lib/*`, `scripts/audit-dynamic-content.ts`)
  y ampliado `lib/content-policy.ts`; esos scripts no compilan (`tsc` 7
  errores). Se clasificaron como trabajo en curso ajeno a esta intervención y
  **no se confirmaron**.

---

## 3. Estrategia aplicada

- **Número de commits:** 13.
- **Criterio de agrupación:** por responsabilidad funcional (gobernanza,
  indexabilidad/sitemaps, política comercial, esquema/FAQ/accesibilidad,
  enlazado, gates, informe) + unidades preexistentes separadas (sidebar del
  blog, entorno OpenCode) + correcciones/trazabilidad surgidas de la
  validación.
- **Orden de dependencias:** implementación antes que tests dependientes; el
  sitemap refactor y sus tests se confirmaron juntos; el informe final es el
  último commit del bloque SEO.
- **División de archivos con responsabilidades mixtas:** se usó `git add -p`
  en `AGENTS.md` (gobernanza vs §7bis OpenCode), `package.json` (gates vs
  `opencode:doctor`), `data/landings-locales.ts` (indexabilidad vs claims),
  `lib/site.ts` (keywords vs schema), `lib/page-content-db.ts` (claims vs
  metodología), `app/(public)/despacho/page.tsx` (claims vs metodología),
  `app/(public)/page.tsx` (ciudades vs metodología),
  `components/marketing/public-footer.tsx`, `components/marketing/consultation-cta.tsx`
  y `scripts/audit-faq-contract.ts`.
- **Archivos generados:** se confirmaron solo los que el repositorio versiona
  intencionadamente y son deterministas: `public/llms.txt` (regenerado en
  postbuild), los CSV de auditoría FAQ bajo `docs/seo/current/` y el informe de
  enlaces interno. Se añadieron excepciones canónicas a `.gitignore` para
  `data/seo/local-landing-indexability.json` y `data/seo/sitemap-public-manifest.json`
  (fuentes de verdad, no outputs).
- **Cambios preexistentes:** el sidebar del blog y el entorno OpenCode
  (README, CHANGELOG, `.opencode/`, configs) se confirmaron en commits propios,
  sin mezclarlos con el hardening. Los `PROMPT_*.md`/`AUDITORIA_*.md` de la
  raíz no se confirmaron (documentos de orquestación en raíz, no canónicos).

---

## 4. Commits creados

| # | Hash | Mensaje | Archivos | +/− | Propósito |
|---|------|---------|----------|-----|-----------|
| 1 | `93802b26` | docs(seo): document public content governance decisions | 2 | +69/−1 | Decisión de autoría corporativa + AGENTS.md (R18/R23/R24, fuentes, gate) |
| 2 | `b410313c` | feat(seo): enforce public indexability and segmented sitemaps | 33 | +1014/−286 | Indexabilidad, 9 landings noindex, sitemap index + 5 segmentos, manifiesto, llms.txt, IndexNow, tests |
| 3 | `fb3c3b82` | feat(content): enforce verified commercial claims | 32 | +745/−123 | Política «Evaluación inicial confidencial», content-policy, claims, testimonios, tests |
| 4 | `ec05c12d` | feat(public-site): strengthen trust schema and accessibility | 13 | +275/−57 | Metodología 5 pasos, FAQ común, IDs JSON-LD, skip link, tests |
| 5 | `f43febb3` | feat(seo): audit and harden internal linking | 3 | +224/−11 | Enlaces relacionados filtrados + informe determinista de 53 casos |
| 6 | `339a2b40` | test(seo): add public contract regression gates | 2 | +213/−0 | Gate `seo:public-contract` + scripts npm |
| 7 | `ce26f871` | docs(seo): record public hardening implementation results | 1 | +316/−0 | Informe final del hardening (actualizado con hashes) |
| 8 | `2536a76c` | feat(blog): add magazine-style blog sidebar | 1 | +23/−3 | Sidebar del blog (cambio preexistente del usuario) |
| 9 | `40508292` | chore(opencode): add opencode development environment | 39 | +2626/−0 | Entorno OpenCode: configs, agentes, skills, comandos, doctor, README/CHANGELOG |
| 10 | `dc12271e` | test(seo): align FAQ audit artifacts and e2e with claims policy | 5 | +84/−86 | Especs E2E FAQ/blog y CSV de auditoría FAQ alineados con la política |
| 11 | `2c02bce6` | chore(seo): drop unused import in content policy test | 1 | +0/−1 | Lint baseline (warning de import sin usar) |
| 12 | `c399ac13` | fix(seo): align public contract gate with content policy engine | 1 | +5/−1 | Gate alineado con el motor de reglas real de content-policy |
| 13 | `a13f9579` | chore(seo): refresh llms.txt generated timestamp | 1 | +1/−1 | Re-sincroniza `llms.txt` con el output del build |

---

## 5. Archivos excluidos

| Archivo | Motivo | Acción tomada |
|---------|--------|---------------|
| `AUDITORIA_CUMPLIMIENTO_PLAN_MAESTRO_PINEDA_Y_ASOCIADOS_2026-08-02.md` | Artefacto de orquestación en la raíz; AGENTS.md §10 prohíbe documentación nueva en raíz | Sin confirmar, documentado |
| `PROMPT_AUDITORIA_INDEPENDIENTE_CIERRE_PR25.md` | Ídem (prompt de orquestador en raíz) | Sin confirmar, documentado |
| `PROMPT_OPTIMIZACION_PROFESIONAL_OPENCODE.md` | Ídem | Sin confirmar, documentado |
| `scripts/audit-dynamic-content.ts` | Trabajo de sesión posterior **incompleto**: no compila (referencias inexistentes, tipos rotos) | Sin confirmar, documentado; NO se descartó |
| `scripts/lib/` (`dynamic-content.ts`, `environment-guard.ts`) | Ídem: 7 errores de `tsc` en estos archivos | Sin confirmar, documentado; NO se descartó |

Nota: `lib/content-policy.ts` se confirmó en su versión ampliada (motor de
reglas) porque compila y es dependencia de `lib/page-content-db.ts`; los
scripts que usan su API extendida siguen en curso (no confirmados).

---

## 6. Seguridad

- **Escáneres ejecutados:**
  - `node tools/ci/repo-hygiene.mjs --quick` → **0 errores**, 1 aviso
    preexistente (Plan Maestro en raíz).
  - `npm run opencode:doctor` → **0 FAIL**, 7 WARN (baseline del entorno).
  - `git grep`/`rg` manuales sobre el diff y archivos sin rastrear para
    patrones de secretos (`AKIA*`, `sk-*`, claves privadas, `postgresql://…`,
    credenciales) → **0 coincidencias**.
  - Escaneo específico del commit OpenCode (`git show 40508292` y `git grep
    HEAD`) → **0 coincidencias** de claves o credenciales.
- **Confirmación:** no se añadieron secretos a ningún commit; no se confirmó
  `.env`, snapshots, dumps ni tokens.
- **Cambios en `.gitignore`:** se añadieron dos excepciones canónicas para
  `data/seo/local-landing-indexability.json` y
  `data/seo/sitemap-public-manifest.json` (fuentes de verdad bajo una regla que
  ignoraba `data/seo/*`).

---

## 7. Validaciones

Validación ejecutada sobre el **árbol confirmado** (los archivos excluidos en
curso se movieron temporalmente a un backup fuera del repo y se restauraron
después; el backup se conserva intacto):

| Comando | Exit | Resultado | Detalles |
|---------|-----:|-----------|----------|
| `npm run lint` | 0 | PASS | 0 errores; 3 warnings (baseline preexistente en `.local/`) |
| `npx tsc --noEmit` | 0 | PASS | 0 errores |
| `npm test` | 0 | PASS | 142 archivos / 2.408 tests verdes |
| `npm run build` | 0 | PASS | Next.js compila; postbuild regenera `llms.txt`; IndexNow dry-run excluye las 9 landings |
| `npm run seo:public-contract` | 0 | PASS | Gate unificado 0 errores |
| `npm run seo:faq-contract` | 0 | PASS | FAQ CONTRACT: PASS |
| `npm run legal:generated-cta-copy` | 0 | PASS | CTA validado (18 tests) |
| `npm run opencode:doctor` | 0 | PASS | 0 FAIL |

**Limitación del entorno:** `npx tsc --noEmit`, `npm test` y `npm run build`
**en el árbol tal cual está** fallan/son bloqueados únicamente por los 7
errores de los archivos excluidos en curso (`scripts/audit-dynamic-content.ts`,
`scripts/lib/dynamic-content.ts`); no por ningún commit creado. Se demostró la
verde de los commits con el desplazamiento temporal y restauración de esos
archivos.

---

## 8. Estado final

- **Rama:** `feat/seo-geo-master-implementation`
- **HEAD final:** `a13f9579`
- **Commits locales respecto a `origin`:** `ahead 14` (sin push).
- **Árbol de trabajo:** limpio para archivos rastreados (`git diff HEAD` y
  `git diff --cached` vacíos). Quedan **5 rutas sin rastrear** justificadas en
  §5 (3 artefactos de orquestación en raíz + 2 rutas de trabajo en curso roto).
- **Push:** no realizado (denegado por configuración del entorno).
- **Deploy:** no realizado. **Migraciones/IndexNow reales:** no ejecutados.
- **Producción:** no modificada.

---

## 9. Próximo paso

El repositorio queda preparado para continuar con el bloque de:

```
cierre de datos dinámicos, enlazado interno y validación E2E SEO/GEO
```

No se ejecuta este bloque todavía. Nota para ese bloque: el trabajo en curso
sin confirmar (`scripts/audit-dynamic-content.ts`, `scripts/lib/`) debe
completarse (corregir los 7 errores de `tsc`) y confirmarse en su propio
commit; además hay que limpiar las variantes de consulta gratuita en la DB
productiva y validar el sitemap de blog y Playwright sobre un entorno con DB.
