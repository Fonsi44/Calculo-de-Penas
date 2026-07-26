# Fase 4B — Incidencia: auditoría del commit `3769416d`

**Fecha:** 2026-07-26
**Modo:** IMPLEMENTACIÓN (commits locales + push autorizados por enunciado Fase 4B)
**Sección del enunciado:** §2

## 1. Contexto de la incidencia

El enunciado Fase 4B §2 pide auditar el commit `3769416d` porque se considera
"inesperado". La inspección revela una situación distinta: ese commit **no fue
colado en el árbol local sin permiso** — es, literalmente, **`origin/main`**.

```
HEAD local:   8c5a4122 docs(fase4a): validacion local e informe final del Lote 2
origin/main:  3769416d fix(seo): corregir validación Schema.org de Ahrefs
```

Los 7 commits de Fase 4A son **locales y pendientes de push**; se asientan
sobre `3769416d`, que ya está desplegado.

## 2. Inspección completa del commit

### Metadatos (`git show --format=fuller`)

| Campo | Valor |
|-------|-------|
| Hash | `3769416d8f2c04ddafc8153dc4f110aeb6c9a874` |
| Author | `fonsi <alfonsroiget@gmail.com>` |
| AuthorDate | Sun Jul 26 20:44:15 2026 +0200 |
| Commit | `fonsi <alfonsroiget@gmail.com>` |
| CommitDate | Sun Jul 26 20:44:15 2026 +0200 |
| Asunto | `fix(seo): corregir validación Schema.org de Ahrefs` |

**Autoría y commit son la misma persona** (no hay rebase ni cherry-pick ajeno).
La fecha coincide con la ventana de Fase 3E (commits SEO/Schema.org previos:
`26e9ce15`, `18236e0b`, `455f87ca`).

### Archivos modificados (`git show --stat`)

```
lib/site.ts                  | 49 +-------------------------------------------
scripts/validate-jsonld.mjs  |  8 ++++++++
tests/seo-protection.test.ts | 18 ++++++++++++++++
3 files changed, 27 insertions(+), 48 deletions(-)
```

### Naturaleza del cambio

`lib/site.ts`:

- `legalServiceSchema()`: `@type` pasa de
  `['LegalService','LocalBusiness','Attorney']` a `['LegalService','LocalBusiness']`
  y se elimina `serviceType` del nodo de negocio. Justificación documentada en
  comentarios: mezclar `Attorney` + `serviceType` con `LegalService`/`LocalBusiness`
  produce errores de validación Schema.org detectados por Ahrefs.
- `founderSchema()`, `thaniaSchema()`, `emilSchema()`: eliminado el bloque
  `areaServed` de los nodos `Person`. Schema.org no admite `areaServed` en
  `Person`; Ahrefs lo marca como error.

`scripts/validate-jsonld.mjs`: dos reglas nuevas que hacen explícita la
invariante (`Person` no puede llevar `areaServed`; `serviceType` solo en `Service`).

`tests/seo-protection.test.ts`: dos tests nuevos que blindan los cambios
(`legalServiceSchema` sin `Attorney`/`serviceType`; los tres `Person` sin
`areaServed`).

## 3. Verificación cruzada

- **¿Está en `origin/main`?** Sí. `git branch -r --contains 3769416d` lista
  `origin/main` y `origin/HEAD`.
- **¿Cambios presentes en el árbol actual?** Sí:
  - `lib/site.ts:305` → `'@type': ['LegalService', 'LocalBusiness']`.
  - Ausencia de `serviceType` en `legalServiceSchema()`.
  - Ausencia de `areaServed` en `founder/thania/emil`.
  - Tests presentes en `tests/seo-protection.test.ts:367`.
- **¿Alteran Schema.org/SEO/datos estructurados?** Sí, **mejorándolos**: quitan
  propiedades no admitidas. No introducen regresión; al contrario, resuelven
  errores reportados por Ahrefs.
- **¿Alteran producción?** Sí, ya está desplegado en `origin/main`. Es
  independiente del Lote 2.
- **¿Mezcla trabajo ajeno o un stash?** No. Author = Committer = fonsi; sin
  archivos ajenos; sin secretos; sin `.env`, ni dumps, ni temporales.
- **¿Los tests justifican los cambios?** Sí: dos tests reproducen exactamente
  la invariante que el cambio impone.

## 4. Decisión

### **MANTENER** (no revertir, no reescribir, no `--force`)

Justificación:

1. Es un commit **legítimo de Fase 3** (autoría única del usuario, ya desplegado).
2. Tiene **tests suficientes** y **justificación técnica documentada** en los
   propios comentarios del código.
3. **No contiene secretos** ni archivos ajenos (verificado en el diff).
4. **No introduce regresiones**: el cambio elimina errores de validación
   Schema.org reportados por Ahrefs; los tests blindan la invariante.
5. Es **reproducible** y verificable en cualquier momento con
   `npm run build && node scripts/validate-jsonld.mjs`.
6. Revertir un commit ya en producción mediante `git revert` reabriría los
   errores de validación Schema.org que corregía, **empeorando** el estado SEO
   del sitio. No es proporcionado.
7. **No reescribir historial**: política Git §5 del AGENTS.md y enunciado Fase 4B.

## 5. Conclusión

La "incidencia" se resuelve como **falsa alarma**: `3769416d` no es un commit
extraño en el árbol de Fase 4A, sino el **punto de partida legítimo** sobre el
que se asientan los 7 commits locales de Fase 4A pendientes de push.

Nada que revertir. Nada que reescribir. Nada que documentar como incidencia
activa más allá de este informe.

---

**Veredicto:** COMMIT LEGÍTIMO. MANTENER. SIN ACCIÓN.
