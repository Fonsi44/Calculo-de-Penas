# Fase 4B — Plan de rollback

**Fecha:** 2026-07-26
**Modo:** IMPLEMENTACIÓN
**Rango enviado a `origin/main`:** `95b41d35..88b18cb8` (rango completo Fase 4B)
**Commits Fase 4B:** 7 (con prefijo `fase4b`) + 1 commit SEO de cierre (`88b18cb8`, `fix(seo)`)

> ⚠️ Este plan se aplica **solo** si se detecta una regresión en producción
> tras el deploy de `88b18cb8`. No se ejecuta de forma preventiva.

> **Corrección Fase 4C (2026-07-26):** el conteo original de este documento
> declaraba "4 commits Fase 4B" y el rango `95b41d35..5037fcaf`. Eso reflejaba
> únicamente la primera remesa de Fase 4B (incidencia, integridad, estados y
> tests). La fase continuó con 3 commits más (`0dc703de`, `f4e097d2`,
> `3f58907d`) y el cierre SEO `88b18cb8`. El número real es **7 commits con
> prefijo `fase4b`** + 1 commit `fix(seo)` de cierre vinculado. El commit
> `95b41d35` **no es de Fase 4B** (es `fix(ux): evitar CTA duplicado en hub
> España`); se referencia solo como punto de partida del rango.

## 1. Ámbito de los cambios Fase 4B

Los 4 commits enviados son **puramente aditivos en documentación, scripts y
tests**. **No modifican datos en DB, ni código productivo, ni configuración
visual, ni Schema.org, ni SEO.** Cambios concretos:

| Tipo | Archivos | ¿Afecta a runtime? |
|------|----------|---------------------|
| Documentación | `docs/audits/fase4b-*.md`, `docs/audits/fase4a-lote2-revision-humana/custodia-hijos-honduras-juez.md`, `docs/audits/fase4a-lote2-revision-humana/index.md` | NO |
| Scripts TS (no ejecutados en build) | `scripts/fase4b-integridad-correcciones.ts`, `scripts/fase4b-recalcular-estados.ts` | NO |
| Artefactos JSON | `docs/audits/fase4b-integridad-correcciones.json`, `docs/audits/fase4b-estados-definitivos.json` | NO |
| Tests | `tests/fase4b-integridad.test.ts` | NO (solo Vitest) |

**Consecuencia:** el deploy de `5037fcaf` en Vercel produce **exactamente el
mismo bundle productivo** que el deploy anterior (`95b41d35`). Ningún cambio
de Fase 4B toca el código que Next.js empaqueta. Si hay una regresión en
producción, **no es imputable a Fase 4B**: será del commit `95b41d35`
(`fix(ux): evitar CTA duplicado en hub España`) o de un commit anterior.

## 2. Componentes a restaurar en caso de rollback

### 2.1. Bodies de los 15 artículos del Lote 2

**No hubo cambios de body en Fase 4B.** Las 3 correcciones aplicadas al body
de `pension-alimenticia-porcentaje-honduras-2026` se hicieron en Fase 4A
(commit `181f9446`), no en Fase 4B. Fase 4B solo **verificó** que estaban
aplicadas. Por tanto, no hay bodies que restaurar por Fase 4B.

Si se quisiera revertir las correcciones del Lote 2 (Fase 4A), los textos
originales están documentados en `scripts/fase4a-aplicar-correcciones.ts`
(campo `buscar` de cada `CORRECCIONES`) y la operación inversa sería
reemplazar `reemplazar` por `buscar`. **No se recomienda** porque las
correcciones corrigen citas legales erróneas (Arts. 1069/1230/1593 CC →
Código de Familia).

### 2.2. Metadatos (title/description)

**Sin cambios en Fase 4B.** Ningún metadato de los 15 artículos fue tocado.

### 2.3. Claims y estados

Los artefactos `fase4a-lote2-claims-finales.json` y
`fase4a-lote2-estados-finales.json` **no se modificaron** en Fase 4B. Los
nuevos artefactos son:
- `fase4b-integridad-correcciones.json` (reclasificación de los 8 corrected)
- `fase4b-estados-definitivos.json` (recálculo honesto)

Estos conviven con los de Fase 4A; no los sobrescriben. Para "eliminar" la
reclasificación, basta con ignorar los artefactos Fase 4B y volver a los de
Fase 4A.

### 2.4. Commit `3769416d`

**Decisión Fase 4B §2: MANTENER** (no revertido). Ver
`docs/audits/fase4b-incidencia-commit-3769416d.md`.

Si a pesar de la auditoría se decidiera revertirlo (no recomendado), el
comando sería:

```bash
git revert 3769416d
```

Nunca `git reset` ni `git push --force`. El revert abre un commit nuevo que
revierte los cambios de `lib/site.ts`, `scripts/validate-jsonld.mjs` y
`tests/seo-protection.test.ts`. **Reabriría los errores de validación
Schema.org que el commit corregía** (Ahrefs volvería a reportarlos), por lo
que no se recomienda.

### 2.5. Commits de Fase 4B (7 commits `fase4b` + 1 cierre SEO)

Para revertirlos manteniendo el historial (recomendado), en orden inverso al
de aplicación:

```bash
# Cierre SEO (vinculado a Fase 4B/4C)
git revert 88b18cb8   # fix(seo): limpiar schema Service y enlaces redirigidos
# Commits fase4b
git revert 3f58907d   # docs(fase4b): validacion visual 15/15 PASS
git revert f4e097d2   # feat(fase4b): validacion productiva, estados en DB y spec visual
git revert 0dc703de   # docs(fase4b): plan de rollback (este mismo documento)
git revert 5037fcaf   # test(fase4b): coherencia de claims cuerpos y estados
git revert 8f1086e6   # fix(fase4b): recalcular estados definitivos del lote 2
git revert 4ef6a0cd   # fix(fase4b): cerrar integridad de claims
git revert 3f8f163b   # docs(fase4b): documentar incidencia commit 3769416d
git push origin main
```

Esto crea 8 commits de revert. Dado que los commits `fase4b` son aditivos en
docs/scripts/tests, eliminarlos no afecta al bundle productivo. El único que
toca código productivo es `88b18cb8` (schema Service + `landings-locales.ts`);
revertirlo restaura `keywords`/`inLanguage` en el schema y los
`postsRelacionados` a slugs redirigidos (que es justo lo que ese commit quitó).

### 2.6. Deployment Vercel

Vercel mantiene un historial de deployments por commit SHA. Para restaurar el
deployment anterior a `5037fcaf`:

1. Identificar el deployment del SHA objetivo (`95b41d35` o anterior).
2. En el dashboard de Vercel → Proyecto → Deployments → "Promote to
   Production" del deployment objetivo.

Alternativamente, un `git revert` seguido de push genera un nuevo deployment
con el código restaurado.

## 3. Procedimiento recomendado de rollback

Dado que los commits `fase4b` (6 de los 7) **no afectan a producción**, el procedimiento más simple es:

```bash
# 1. Verificar que la regresión NO proviene de los commits fase4b:
#    comparar bundle de 88b18cb8 vs 95b41d35. Si son idénticos salvo por
#    schema/landings (cambio de 88b18cb8), los commits fase4b son inocentes.

# 2. Si la regresión es del cierre SEO 88b18cb8 (schema/landings):
git revert --no-edit 88b18cb8
git push origin main

# 3. Si la regresión es de los commits fase4b (improbable, docs/scripts/tests):
git revert --no-edit 3f58907d f4e097d2 0dc703de 5037fcaf 8f1086e6 4ef6a0cd 3f8f163b
git push origin main

# 4. Si la regresión es de 95b41d35 (fix CTA hub España), revertir ese:
git revert --no-edit 95b41d35
git push origin main
```

## 4. Verificación post-rollback

Tras cualquier revert:

```bash
npm run lint && npx tsc --noEmit && npm run test && npm run build
```

Los 1704 tests deben seguir pasando, salvo que se hayan eliminado los
artefactos Fase 4B (en cuyo caso los tests de `tests/fase4b-integridad.test.ts`
fallarán al no encontrar los JSON y habrá que eliminarlos también).
