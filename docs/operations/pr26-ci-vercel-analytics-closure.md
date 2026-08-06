---
status: current
owner: engineering
created: 2026-08-03
last_reviewed: 2026-08-03
review_due: 2026-11-03
supersedes: docs/audits/archive/2026-08-06/seo-data-intelligence-2026-08-03.md
superseded_by: null
---

# Cierre PR #26 — CI/Vercel/analítica de conversiones

**Fecha:** 2026-08-03 · **Rama:** `feat/seo-data-intelligence-v2` · **PR:** #26 · **Base:** `main`

## 1. Veredicto

```
PR26_RELEASE = COMPLETE
```

El PR #26 se fusionó a `main` (squash, commit `f25fbcaf`), Production se
redesplegó automáticamente y los smoke tests de producción pasaron. Pendientes
restantes solo externos: key event `email_click` en GA4 (dashboard) y muestra de
CrUX.

## 2. Estado inicial

- Rama: `feat/seo-data-intelligence-v2` · HEAD inicial: `2780d49a`
- CI: **FAIL** en el gate `Verify` (run 30842311477, job 91782111311)
- Vercel: **Error** en el build de Preview (deployment `5PjcxSZU2UHvAFeb1hx97qmK7pFD`)
- Preview: no arrancaba · PR: en draft, checks CI y Vercel en rojo

## 3. Causa raíz de CI

```
primer error : knip: "La deuda knip aumentó: files, binaries" (exit 1)
comando      : npm run verify → repo:knip (node tools/ci/knip-baseline.mjs)
archivo      : tools/ci/knip-baseline.json
causa        : Los scripts operativos del sistema SEO (seo-data-audit/report/
               content-action-plan) se invocan dinámicamente vía spawnSync en
               seo-data-cli.mjs (knip no rastrea esa referencia) y el doctor
               usa los binarios gcloud/bq. files 58→61, binaries 6→8.
corrección   : Baseline alineado (mismo patrón del repo, commit 1bad9c83).
               Además, generate-llms-txt.mjs ahora escribe solo con cambios
               semánticos (determinismo: árbol limpio tras builds repetidos).
test regresión: npm run verify → PASS (lint 0 err, tsc limpio, 2451 tests,
               build, knip exceeded=[]). verify 2x deja el árbol limpio.
```

## 4. Causa raíz de Vercel

```
fase    : prerender (Collecting page data) de /blog/[categoria]/[slug]
mensaje : "[blog-source] La Preview canónica requiere SEO_PREVIEW_BLOG_DATA_MODE
          =database o full-public-snapshot; no existe fallback implícito."
causa   : Las variables de Preview aisladas estaban scoped a la rama
          feat/seo-geo-master-implementation; la rama nueva no las heredaba.
corrección: Variables Preview + rama añadidas (no secretas):
          SEO_PREVIEW_BLOG_DATA_MODE=limited-test-fixtures,
          SEO_ALLOW_LIMITED_TEST_FIXTURES=true, SEO_PREVIEW_BLOG_EXPECTED_MIN=1.
          Sin cambios en Production ni en la DB.
deployment nuevo: justicia-verdadera-ehpxn9j6g-fonsi-roiget-s-projects.vercel.app
          → Status: Ready (build verde)
```

Nota: el Preview queda detrás de **Deployment Protection (SSO) de Vercel**; el
contenido real no es accesible vía HTTP/browser sin sesión autenticada del
propietario. El build es Ready y Lighthouse CI validó el render real de la app.

## 5. Instrumentación (§9)

| Evento                                           | Disparador                                                                         | Consentimiento | PII                                                                             | Key event                                                  | Prueba                                |
| ------------------------------------------------ | ---------------------------------------------------------------------------------- | -------------- | ------------------------------------------------------------------------------- | ---------------------------------------------------------- | ------------------------------------- |
| `contact_form_view`                              | Montaje del formulario                                                             | Consent Mode   | No                                                                              | No (micro)                                                 | `conversion-instrumentation.test.ts`  |
| `contact_form_start`                             | Primer campo editado (1x)                                                          | Consent Mode   | No                                                                              | No                                                         | idem                                  |
| `contact_form_submit`                            | **HTTP 2xx** (solicitud persistida)                                                | Consent Mode   | No (`form_name`, `page_path`, `service_area`, `submission_status`, `transport`) | **Sí (ya configurado)**                                    | éxito→1 submit; error→0; doble clic→1 |
| `contact_form_error`                             | Error controlado (validation/turnstile/rate_limit/network/server/delivery/unknown) | Consent Mode   | No (categoría + campo)                                                          | No                                                         | sin texto del usuario                 |
| `phone_click` / `whatsapp_click` / `email_click` | Clic en canal                                                                      | Consent Mode   | No                                                                              | phone/whatsapp **Sí**; email **REQUIRES_DASHBOARD_ACTION** | helpers + delegación data-event       |
| `consultation_cta_click`                         | CTA principal de consulta                                                          | Consent Mode   | No                                                                              | No (micro)                                                 | helpers                               |

Guard anti-doble-envío (`status==='sending'`). Sin consentimiento no se carga
gtag → cero eventos GA4 (verificado en test).

## 6. Bing (§12)

| Clasificación        | Cantidad | Acción  |
| -------------------- | -------- | ------- |
| OK (200)             | 202      | Ninguna |
| CURRENT_INTERNAL_404 | 0        | Ninguna |

La API de Bing no expone detalle por URL. Crawl del sitemap actual (202 URLs) +
cruce con enlaces internos: **0 errores 4xx actuales**. Los agregados
`4xx=1.042`/`crawlErrors=1.238` son histórico/externo/ruido de bots.
Entregables: `docs/seo/current/bing-crawl-error-classification.csv`,
`bing-crawl-remediation.md`, `bing-crawl-classification-summary.json`.

## 7. Runtime y Lighthouse

- **Runtime contract contra Preview:** PASS — 2 PASS (public-contract,
  jsonld-entity-ids), 0 FAIL, 7 SKIPPED_WITH_REASON (requieren DB local o app
  local corriendo: content-audit, blog-contract, internal-links,
  sitemap-validate-runtime, e2e, a11y, lighthouse).
- **Lighthouse CI:** PASS (5m26s) — home, servicios-juridicos, derecho-penal,
  abogados-en-nacaome (lab, no datos reales de usuarios). Se ejecuta en este PR
  por tocar `components/marketing/**`.
- **CrUX:** `SKIPPED_WITH_REASON` (`insufficient_field_data`) — pendiente
  externo, no técnico. No se inventan métricas.

## 8. Seguridad (§8)

- Sin secretos versionados: service account GA4 en `.secrets/` (gitignored);
  `git ls-files` sin entradas de `.secrets`, `data/google`, `data/bing`.
- GitGuardian Security Checks: **PASS**.
- Sin PII ni rutas locales del usuario en los archivos del PR (escaneo: 0 hits
  en archivos nuevos; los 16 hits del repo son preexistentes y son nombres de
  variables, no valores).
- Sin escrituras en Production DB · sin IndexNow real (postbuild en dry-run,
  requiere `ENABLE_INDEXNOW_SUBMIT=true`).
- El build es hermético: los recolectores SEO no se ejecutan durante
  build/postbuild/import.

## 9. Validaciones

| Comando                                  | Exit | Resultado          | Detalles                                                  |
| ---------------------------------------- | ---- | ------------------ | --------------------------------------------------------- |
| `npm run verify`                         | 0    | PASS               | lint 0 err · tsc limpio · 2451 tests · build · knip       |
| `npm run verify` (2ª vez)                | 0    | PASS               | árbol limpio (determinismo)                               |
| `npm run deploy:preflight`               | 0    | PASS               | gates pre-deploy sin credenciales live                    |
| `npm run lint`                           | 0    | PASS               | 0 errores (3 avisos preexistentes en `.local/`)           |
| `npx tsc --noEmit`                       | 0    | PASS               | —                                                         |
| `npm test`                               | 0    | PASS               | 146 archivos / 2451 tests                                 |
| `npm run build`                          | 0    | PASS               | —                                                         |
| `npm run seo:public-contract`            | 0    | PASS               | 170 tests                                                 |
| `npm run seo:runtime-contract` (Preview) | 0    | PASS               | 2 PASS / 0 FAIL / 7 SKIPPED                               |
| `npm run test:a11y`                      | —    | NO EJECUTADO       | requiere app corriendo; cubierto por Lighthouse CI (a11y) |
| `npm run seo:data doctor`                | 0    | PARTIAL (esperado) | canónico PASS, gcloud/bq PASS, Bing API key               |
| `npm run seo:data audit`                 | 0    | PARTIAL            | 2 avisos de title preexistentes, sin errores críticos     |
| `git diff --check`                       | 0    | PASS               | —                                                         |
| CI GitHub                                | —    | PASS               | Higiene/Lint/TypeScript/Tests/Build 2m36s                 |
| Lighthouse CI                            | —    | PASS               | 5m26s                                                     |
| Vercel                                   | —    | PASS               | Preview Ready                                             |

## 10. Commits (sobre los 5 del bloque SEO)

| Hash       | Mensaje                                                                              | Propósito           |
| ---------- | ------------------------------------------------------------------------------------ | ------------------- |
| `ef162376` | fix(ci): pipeline verify determinista y baseline knip alineado                       | Causa raíz CI       |
| `73ff672a` | ci: exponer gates de despliegue individuales y añadir deploy:preflight               | Mejora CI + paridad |
| `044c2194` | feat(analytics): medir conversiones reales de consulta sin PII                       | Instrumentación §9  |
| `6d554b52` | fix(seo): clasificar y remediar errores de rastreo de Bing                           | Clasificación §12   |
| `55dbccc1` | docs(analytics): registrar plan de medición, nombres estables y estado de key events | Documentación       |

## 11. GitHub

- Checks finales: **5/5 verdes** en HEAD `047d66ae` (Higiene/Lint/TSC/Tests/Build ✓ 3m22s · Vercel ✓ · Lighthouse ✓ 5m38s · GitGuardian ✓ · Preview Comments ✓).
- PR #26: **MERGED** (squash) · merge commit `f25fbcaf` · mergedBy Fonsi44 · 2026-08-03T20:11:29Z.
- Merge con `--admin` autorizado expresamente por el propietario (protección de
  rama exigía revisión aprobatoria; el autor no puede auto-aprobar).
  `required_linear_history=true` → squash.

## 12. Vercel

- Preview: `justicia-verdadera-ehpxn9j6g-fonsi-roiget-s-projects.vercel.app` → **Ready** (SSO-protected).
- **Production: desplegada y verificada.** Deployment `13hl312dd` (Ready),
  alias `https://www.pinedayasociadoshn.com`, creado 3s tras el merge (rama main).
- **Smoke tests de Production (16/16 OK):** home, despacho, servicios,
  solicitar-consulta, blog, artículo, perfil, FAQ → 200 `text/html`;
  sitemap index + 5 segmentos → 200 `application/xml`; robots.txt y llms.txt
  → 200 `text/plain`. Canonicals correctos (home y artículo self-canonical);
  robots.txt disallows `/intranet/`, `/admin/`, `/api/`, `/calculadora/`,
  `/casos/`, `/cp/`, `/delitos/`, `/atajos/`, `/preview/`, `/404`.
- Formulario verificado sin envío real (GET). Sin IndexNow real.

## 13. Estado final

- Rama `feat/seo-data-intelligence-v2`: HEAD `047d66ae` (integrada en main).
- `main` local y `origin/main`: **`f25fbcaf`** (merge squash del PR #26). Árbol
  local limpio (una línea en blanco externa sin commitear, preservada).
- Checks: 5/5 verdes. PR #26: MERGED.
- Deployment: Preview Ready; **Production Ready y verificada** (`13hl312dd`,
  alias canónico).

## 14. Pendientes (solo externos reales)

1. **`email_click` key event en GA4**: `REQUIRES_DASHBOARD_ACTION` (la service
   account no tiene permiso de escritura). Acción: GA4 → Propiedad 541022095 →
   Key events → nuevo → `email_click` (ONCE_PER_EVENT).
2. **CrUX**: `insufficient_field_data` hasta ganar volumen (externo).
3. **Medición 28 días** de `contact_form_submit`/`consultation_cta_click` para
   validar la instrumentación con datos reales.

> El merge, el deploy de Production y los smoke tests quedaron completados
> (2026-08-03).
