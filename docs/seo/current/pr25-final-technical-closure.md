# PR #25 — Cierre técnico final (Paso 13, corregido)

> Estado: **CIERRE TÉCNICO COMPLETO en el ámbito automatizado; PASO 13 =
> BLOCKED** en tanto el propietario no valide visualmente el Preview
> autenticado (Vercel SSO impide validar el render del deployment con fetch).
> La autorización humana de merge, la validación manual de formularios y el
> despliegue a Production quedan **fuera** de este cierre.

## Resumen ejecutivo

La PR `feat/seo-geo-master-implementation` consolida 13 fases técnicas del
plan maestro SEO/GEO de Pineda y Asociadas más la sustitución de tablas del
blog. Todos los gates automatizados están en verde sobre el HEAD de la
corrección. La PR permanece **Draft, OPEN, UNMERGED**.

## Fases (pasos 1–13 + Bloque B)

| Paso | Alcance | Estado | Gate |
|------|---------|--------|------|
| 1 | Enlaces del blog | CERRADO | seo:blog-links-audit |
| 2 | Privacidad de formularios | AUTOMATIZADO PASS / manual PENDING | security:public-form-logs (79 tests) |
| 3 | Sanitización HTML | CERRADO | security:blog-html |
| 4 | Metadata y CTA | CERRADO | seo:blog-metadata-only, legal:generated-cta-copy |
| 5 | Redirects y rutas | CERRADO | seo:blog-route-contract |
| 6 | FAQ | CERRADO | seo:faq-contract (79 source_rows) |
| 7 | Paginación | CERRADO | seo:blog-pagination-contract |
| 8 | Robots y sitemaps | CERRADO | seo:crawl-contract |
| 9 | Perfiles y autoridad | CERRADO | seo:lawyer-profile-contract |
| 10 | Claims y schema | CERRADO | seo:public-claims-contract |
| 11 | Rendimiento del blog | CERRADO | seo:blog-performance-contract |
| 12 | Accesibilidad | CERRADO | a11y:public-contract (67 tests E2E) |
| Bloque B | Sustitución de tablas | CERRADO | seo:blog-table-cards-contract (estática + E2E 72 casos + consolidate) |
| 13 | Cierre técnico | CIERRE AUTOMATIZADO; BLOCKED en validación visual | batería §18 completa |

## Integridad editorial (inviolable)

```
articles_checked       = 175
published_articles     = 135
published_signatures   = 135 (válidas)
pending_resignatures   = 40 (propuestas, sin tocar)
body_changes           = 0
hash_changes           = 0
signature_changes      = 0
editorial_date_changes = 0
editorial_state_changes= 0
production_writes      = 0
```

## Sustitución de tablas (Bloque B) — evidencia real

Pipeline render-only: `body → sanitizeBlogSourceHtml → transformBlogTablesForRender
→ injectContextLinks → sanitizeBlogRenderedHtml → HTML final`.

Gate `seo:blog-table-cards-contract` (4 fases):

1. **Unit tests**: 41 tests (casos estructurales, spans, equivalencia).
2. **Auditoría estática** sobre staging: `tables_found=6 tables_transformed=6
   untransformable=0 represented_source_cells=source_cells=93 final_table_tags=0
   information_losses=0 text_equivalence_failures=0 link_equivalence_failures=0`.
3. **E2E Playwright**: 72 casos (6 artículos × 4 viewports × light/dark + print),
   derivados de `blog-table-expected-cases.json` (no lista a mano). Verifica en
   navegador real: `tables_in_dom=0`, fichas visibles, títulos/labels esperados,
   `overflow<=1px`, `axe_critical/serious/contrast=0`, `console_errors=0`.
4. **Consolidate**: valida SHA, cobertura (0 missing, 0 stale), genera
   `blog-table-runtime-validation.csv` desde JSON reales.

Caso despidos (`/blog/derecho-laboral/despido-laboral-honduras-guia-completa`):
4 fichas (Despido justificado, injustificado, indirecto, fuerza mayor) + labels
"Causa según el Artículo 112 CT" y "Derecho a indemnización", verificado en E2E.

### Política de spans (rowspan/colspan) — NO soportados como fichas

- El inventario real confirma: **`published_tables_with_rowspan = 0`** y
  **`published_tables_with_colspan = 0`** entre los 6 artículos publicados con tablas.
- Una tabla con rowspan o colspan se clasifica `COMPLEX_SPAN_MATRIX`, es **no
  transformable**, y registra `information_losses += 1` + `untransformableTables += 1`.
- El gate **falla antes** de que esa tabla llegue al sanitizer final (nunca se
  permite que `sanitizeBlogRenderedHtml` elimine contenido silenciosamente).
- Se corrigió el bug de doble decremento de rowspan en `buildGrid`.
- Tests cubren: rowspan=2, colspan=2, rowspan+colspan, encabezado con colspan,
  celda de datos con rowspan — todos verifican **rechazo seguro y explícito**.
- **Una futura tabla publicada con spans bloqueará el gate** y requerirá mapping
  explícito (slug + tableIndex) o implementación específica.

### Tablas headerless (sin th ni thead)

- Se clasifican `HEADERLESS_DATA`, no transformables, `information_losses += 1`.
- **No se inventa copy jurídico** ("Dato 1", "Dato 2") en HTML público.
- Opciones válidas: inferencia segura probada, mapping explícito, o fallo del gate
  `UNMAPPED_HEADERLESS_TABLE`.

## Batería final ejecutada (§18)

- 19 contratos SEO/a11y/security/legal/governance/docs/migrations: **PASS**
- gate de tablas con E2E real: **PASS** (113 tests totales)
- lint: **0 errores** (3 warnings preexistentes en `.local/gen-postconditions.mjs`)
- typecheck: **0 errores**
- build: **PASS**
- verify (knip baseline): **exceeded=[]** (files=58, types=109, unlisted=0)
- 2 builds deterministas consecutivos: `llms.txt` SHA estable
- git diff --check: OK

## Seguridad

- HTML activo: 0 (sanitizer con SOURCE_BLOG_TAGS/RENDERED_BLOG_TAGS).
- PII en logs: 0 (79 tests de privacidad).
- Endpoints privados: protegidos por proxy + auth.
- Tablas del blog: 0 etiquetas de tabla en HTML final (defense-in-depth + gate
  que rechaza no transformables antes del sanitizer).
- CSP/cookies/headers: verificados por governance y a11y contract.

## GitGuardian (histórico, falso positivo, separado)

- Incidente `35247669`: **falso positivo**. Es una huella SHA-256 editorial
  (firma institucional) en `docs/seo/current/blog-recovery-diff.csv` (commit
  `1470f3c9`), **no una credencial real**.
- **No requiere rotación** salvo que el propietario descubra independientemente
  una credencial real.
- Ningún commit del Paso 12/Bloque B/13 introduce secretos nuevos.
- Acción del propietario: cierre manual como falso positivo en el dashboard de
  GitGuardian, con la justificación "firma editorial, no credencial".
- **No** se reescribe historial. **No** se modifican hashes editoriales para
  silenciar el scanner.

## Preview visual — PENDING_MANUAL

El deployment de Preview está protegido por **Vercel SSO/Deployment Protection**
(responde 302 → `vercel.com/sso-api`). Un `fetch` sin credenciales recibe la
página "Login – Vercel", no el contenido renderizado. Por tanto:

- La validación E2E **local** (webServer propio) pasó: 113 tests, fichas
  verificadas, 0 tablas en DOM, axe/overflow/console limpios.
- La validación **visual del deployment de Preview** la debe realizar el
  propietario autenticado, con la checklist de
  `docs/ops/final-manual-production-checklist.md` (sección Preview).

Mientras no se reciba confirmación expresa del propietario:

```
PASO 13 = BLOCKED
PREVIEW_VISUAL = PENDING_MANUAL
```

## Pendientes (responsabilidad del propietario)

1. **Validación visual del Preview autenticado** (checklist en
   `docs/ops/final-manual-production-checklist.md`).
2. **Validación manual** de Turnstile, persistencia y entrega de email.
3. **Cierre manual** del incidente GitGuardian como falso positivo.
4. **Autorización humana de merge** (la PR sigue Draft).
5. **Despliegue Production** (no realizado).

## Prohibiciones respetadas

- 0 Production writes, 0 migraciones aplicadas, 0 Production deployments.
- 0 force push, 0 merge, 0 reescritura de historial.
- PR permanece Draft. No se avanzó a ningún paso posterior ni se marcó
  Ready for Review.
