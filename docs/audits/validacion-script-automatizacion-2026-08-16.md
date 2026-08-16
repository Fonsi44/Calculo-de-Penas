---
status: current
owner: seo
created: 2026-08-16
last_reviewed: 2026-08-16
review_due: 2026-08-17
supersedes: null
---

# VALIDACIÓN DEL SCRIPT DE AUTOMATIZACIÓN - 2026-08-16

Fuentes: `scripts/apply-remediacion.sh`, `scripts/patch-utils.js`, `docs/audits/plan-implementacion-final-2026-08-16.md`.  
**No** se ejecutó `./scripts/apply-remediacion.sh` en caliente. **No** se escribieron archivos de producto.

## Resumen ejecutivo

- Estado general: **APROBADO** (con advertencias operativas, sin riesgos críticos de destrucción)
- Número de parches validados: **14/14 archivos**, **21/21 pasos** (`APPLIED` en dry-run)
- Riesgos críticos: **ninguno** (`rm -rf`, `git reset --hard`, `git clean`, `sed -i`, force-push, deploy, IndexNow real, `gh pr merge`: 0 ocurrencias)

Condiciones para ejecutar en desarrollo:

1. `--create-branch` (hoy la rama es `fix/allow-production-editorial-upsert`).
2. Primera corrida **sin** `--push`.
3. **Sin** `--skip-validate`.

---

## A. Revisión estática del script

### `apply-remediacion.sh`

- `set -euo pipefail`. `ROOT` vía `BASH_SOURCE`. Shebang bash (portable macOS/Linux; no depende de zsh).
- Lista blanca de 14 rutas entre comillas; `git add -- "${ALLOWED_FILES[@]}"` respeta paréntesis de `app/(public)/...`.
- Working tree: falla si hay suciedad **fuera** de la lista blanca + `docs/audits/` + los dos scripts. Correcto para no mezclar el PR editorial.
- Rama fija `feat/remediacion-seo-2026-08`. `--create-branch` hace `git fetch` + `git switch -c … origin/main` y crea `backup/pre-remediacion-seo-2026-08`.
- `--dry-run` llama `node scripts/patch-utils.js --dry-run`, **omite** lint/tsc/vitest, Lighthouse y commit/push.
- Validación alineada al plan: `lint`, `tsc --noEmit`, vitest fase2 + crawl-contract + blog-metadata-only.
- **No** hay `sed -i` (el helper es Node). El único `sed` es `sed -n '2,14p' "$0"` en `--help` (solo lectura).
- **No** IndexNow, merge, Vercel deploy ni `gh pr merge`.
- `--push` hace commit + `git push -u origin HEAD` + `gh pr create` **sin confirmación interactiva**. Es el riesgo operativo más alto (no de corrupción).
- `--skip-validate` existe y no está en el bloque de uso del encabezado.
- `npm ci` solo si falta `node_modules` (instalación; no es destructivo).
- Lighthouse opcional: `e2e:start:public` en background + `kill $pid`; artefactos en `/tmp`, no en `docs/`.

### `patch-utils.js`

- Reemplazo **literal** (`indexOf` / `replace` de string, no regex, no `sed`).
- `relToAbs` rechaza rutas fuera de `ALLOWED_FILES`.
- `replaceOnce`: exige **1** ocurrencia; si el texto nuevo ya está y el viejo no → `SKIP`; si no hay viejo ni nuevo → `FAIL` y **no escribe ese archivo**.
- Escritura: copia `.bak` → `writeFileSync` → `unlinkSync(.bak)`. El backup **no persiste**; la fuente de rollback es Git.
- `--dry-run`: `changed && !DRY_RUN` impide escritura. Comprobado: `git status` de código de producto intacto tras el dry-run de esta validación.
- Idempotente en re-ejecución (`SKIP`).
- `insertOverrides` usa `String.replace` (primera ocurrencia) sobre el ancla `'poder-legal-honduras-cuando-se-necesita'`.

---

## B. Simulación de dry-run

Comando (solo lectura): `node scripts/patch-utils.js --dry-run`  
Resultado: `failed: false`. 14 archivos `ok: true`, `written: false`, `dryRunWouldWrite: true`. 21 pasos `APPLIED`.

Las 14 rutas existen en el disco. Cadenas **viejas** presentes; cadenas **nuevas** ausentes (el árbol aún no está parcheado). Tras el dry-run no hay `.bak` ni diffs de producto.

`./scripts/apply-remediacion.sh --dry-run` **no** se lanzó: en esta rama fallaría la precondición de nombre de rama (diseño correcto).

---

## C. Matriz de parches

| Archivo | Patrón buscado (resumen) | ¿Existe? | Reemplazo = plan | Riesgo |
|---------|--------------------------|----------|------------------|--------|
| `data/blog/blog-metadata-overrides.ts` | bloque pensión-guía title/desc | ✅ | ✅ (title/meta B.3) | Bajo |
| mismo | insert 3 claves antes de `poder-legal` | ✅ ancla | ✅ divorcio / nacionalidad / pensión % | Bajo |
| mismo | bloque detención | ✅ | ✅ A.1 | Bajo |
| `app/(public)/despacho/page.tsx` | `buildMetadata` title/desc | ✅ | ✅ A.1 | Bajo |
| `app/(public)/preguntas-frecuentes/page.tsx` | title + desc + twitter + og | ✅ (3 pasos) | ✅ `absolute` FAQ | Bajo |
| `data/landings-locales.ts` | `heroTitle` Nacaome | ✅ | ✅ B.1 | Bajo |
| mismo | sufijo intro `/como-llegar` | ✅ intro actual | ✅ prosa (no JSX) | Bajo |
| `tests/fase2-arquitectura-publica.test.ts` | expect `heroTitle` | ✅ | ✅ obligatorio del plan | Bajo |
| `components/blog/blog-toc.tsx` | comentario + `<a>`/`pushState` | ✅ | ✅ `<button>` A.2 | Bajo |
| `components/marketing/public-footer.tsx` | ancla párrafo juzgados | ✅ | ✅ desambiguación A.5 | Bajo |
| `lib/legal-content.ts` | default privacidad 0.5 / ley innominada | ✅ | ✅ 0.6 + Arts. 76–80 | Bajo |
| `app/(public)/politica-privacidad/page.tsx` | segundo `<p>` §1 | ✅ | ✅ CAH + Código Civil | Bajo |
| `app/robots.ts` | `ALLOWED_CRAWLER_USER_AGENTS.map` | ✅ | ✅ Bingbot + `crawlDelay: 2` | Bajo |
| `scripts/seo-live-collect.mjs` | `override: true` + `timeout: 120_000` | ✅ | ✅ `false` / `180_000` | Bajo |
| `scripts/google-search-console-live.mjs` | `override: true` (comillas dobles) | ✅ | ✅ `false` | Bajo |
| `scripts/google-analytics-live.mjs` | `override: true` | ✅ | ✅ `false` | Bajo |
| `scripts/bing-webmaster-live.mjs` | `override: true` (comillas dobles) | ✅ | ✅ `false` | Bajo |

Alineación con el plan: el test fase2 está en la lista blanca (el paquete de diffs no lo listaba; el plan de implementación sí). Correcto: sin él vitest falla.

---

## D. Riesgos y advertencias

| ID | Nivel | Hecho |
|----|-------|--------|
| R1 | Alto (operativo) | `--push` commitea y empuja sin prompt. No usar en la primera corrida. |
| R2 | Medio | El helper **no es transaccional entre archivos**: si el archivo 12 fallara, 1–11 ya estarían escritos. En **este** árbol el dry-run predice 14/14 OK. Re-run es idempotente (`SKIP` + reintento del que falló). |
| R3 | Medio | `.bak` se borra al éxito. Rollback = `git checkout` / rama `backup/pre-remediacion-seo-2026-08`, no el `.bak`. |
| R4 | Medio | `--create-branch` con `docs/audits/*.md` modificados y rastreados puede hacer que `git switch` falle o arrastre esos diffs. Preferir working tree de código limpio. |
| R5 | Bajo | No hay `sed`; no hay colisión de delimitadores `/` ni de `sed -i` de macOS. |
| R6 | Bajo | Rutas con espacios/paréntesis: Node `path.join` + bash arrays entrecomillados. OK. |
| R7 | Bajo | `--push` **no** añade `apply-remediacion.sh` ni `patch-utils.js`. El PR de remediación será solo los 14 archivos de producto (aceptable). |
| R8 | Bajo | Lighthouse: `require('/tmp/jv-lh-local-home')` asume el JSON en esa ruta exacta. Si una versión de Lighthouse añade `.report.json`, el parseo falla (no el parche). No es gate. |
| R9 | Bajo | Hero de privacidad en **DB** (`page_content`) no lo cubre el script. Curl post-deploy puede seguir viendo «Ley de Protección de Datos». Editorial, no fallo del script. |
| R10 | Bajo | `ERR_OSSL_UNSUPPORTED` de GSC/GA4 sigue siendo residual; C.2 no reordena el auth. El script no corre `seo:collect` (bien: no pisa `seo-live-summary.md`). |
| R11 | Info | `--skip-validate` no documentado en el header. No usarlo. |

Riesgo alto de **borrar el repo**: no. `unlinkSync` solo del `.bak` del archivo permitido.

---

## E. Plan de contingencia

| Situación | Acción |
|-----------|--------|
| Dry-run / patrón `FAIL` | No ejecutar el wrapper en caliente. Ajustar `patch-utils.js` o aplicar a mano el archivo citado. |
| Wrapper para en precondiciones (rama / tree sucio) | `--create-branch` o stash **solo** de código ajeno. No `git reset --hard`. |
| Parche parcial (R2) | `git diff --stat` de la lista blanca. Re-ejecutar el helper (idempotente) o `git checkout -- <archivo>` de los ya tocados. |
| lint/tsc/vitest FAIL tras escribir | No `--push`. Revertir con `git checkout --` los 14 paths o `git restore`. |
| `--push` por error | No force-push. Cerrar el PR; `git revert` si ya está en remoto. |
| Lighthouse / `:3100` | Ignorar para el merge. Matar el PID si queda colgado (`/tmp/jv-e2e-start-remediacion.log`). |
| Privacidad con la ley en Preview | Admin `page_content`, no más código. |

---

## F. Recomendación final

**APROBADO** para ejecutar en desarrollo.

Secuencia:

```bash
chmod +x scripts/apply-remediacion.sh
./scripts/apply-remediacion.sh --create-branch --dry-run
./scripts/apply-remediacion.sh --create-branch
# Revisar git diff de los 14 archivos. lint/tsc/vitest ya van en el wrapper.
# --push solo con autorización expresa del titular.
```

No mezclar con `fix/allow-production-editorial-upsert`. No IndexNow real. No merge a `main` ni producción desde el script.

Mejoras opcionales (no bloquean): (1) abortar todo el helper antes de escribir si **cualquier** paso fallaría (simulación previa en memoria); (2) prompt `yes` antes de `--push`; (3) documentar `--skip-validate` o eliminarlo.
