# Fase 3B — Plan de rollback del Lote 1 Penal

**Fecha:** 2026-07-26
**Modo:** `IMPLEMENTACIÓN` sobre `main`

---

## 1. Resumen ejecutivo

La Fase 3B es **totalmente reversible**. Todos los cambios sobre la DB se respaldaron con
backups reproducibles (JSON con SHA-256), y los cambios de código viven en commits atómicos
que pueden revertirse con `git revert`. No se realizaron operaciones destructivas ni
irreversibles.

| Tipo de cambio | Reversibilidad | Mecanismo |
|----------------|----------------|-----------|
| Bodies de 5 artículos (15 correcciones) | ✅ Total | `scripts/restaurar-blog-backup.ts` con backup pre-Fase 3B |
| Estados AI de 15 artículos | ✅ Total | `scripts/fase3-reclasificar-lote1.ts` o backup pre-reclasif |
| Meta description fianza | ✅ Total | Restaurar desde backup |
| Código (commits) | ✅ Total | `git revert <hash>` |
| `staticPageGenerationTimeout` | ✅ Total | Eliminar la línea (restaura default 60s) |

---

## 2. Backups reproducibles generados

| Backup | Ruta | Contenido |
|--------|------|-----------|
| Pre-correcciones editoriales | `auditoria-blog/backup-pre-fase3b-2026-07-26T13-11-53-371Z.json` | 15 filas: slug, title, body, bodySha256, estado AI completo, updatedAt |
| Pre-reclasificación | `auditoria-blog/backup-pre-reclasif-fase3b-2026-07-26T13-21-58-855Z.json` | 15 filas: estado AI completo + body + bodySha256 |
| Bodies volcados (inspección) | `auditoria-blog/fase3b-bodies-2026-07-26T13-11-53-371Z.json` | 15 bodies HTML para análisis de claims |

Cada backup incluye **hash SHA-256** del body para verificar integridad antes/después de
cualquier restauración.

---

## 3. Procedimientos de rollback

### 3.1 Revertir correcciones editoriales (5 artículos)

```bash
# Restaurar bodies desde el backup pre-Fase 3B
npx tsx scripts/restaurar-blog-backup.ts \
  auditoria-blog/backup-pre-fase3b-2026-07-26T13-11-53-371Z.json --aplicar
```

Verificación: comparar `bodySha256` antes y después con el backup.

### 3.2 Revertir estados AI (15 artículos)

```bash
# Opción A: re-ejecutar el reclasificador Fase 3 (clasificación original)
npx tsx scripts/fase3-reclasificar-lote1.ts --aplicar

# Opción B: restaurar desde backup pre-reclasif Fase 3B
npx tsx scripts/restaurar-blog-backup.ts \
  auditoria-blog/backup-pre-reclasif-fase3b-2026-07-26T13-21-58-855Z.json --aplicar
```

### 3.3 Revertir cambios de código (commits atómicos)

Los commits de Fase 3B son atómicos y reversibles con `git revert`:

```bash
# Ver commits de Fase 3B
git log --oneline --grep="fase3b" main

# Revertir un commit específico (ej. el de integración AiReviewNotice)
git revert 96c4df13

# Revertir toda la Fase 3B (en orden inverso)
git revert --no-commit 96c4df13 6f778679 76118967 9f0ea36f
git commit -m "revert: deshacer Fase 3B completa"
```

**Hashes de commits Fase 3B:**
- `9f0ea36f` — docs(fase3b): fuentes oficiales y claims finales
- `76118967` — fix(fase3b): correcciones editoriales y recálculo de estados
- `6f778679` — fix(fase3b): eliminar hardcodeo de 'completed' + validación semántica
- `96c4df13` — feat(fase3b): integrar AiReviewNotice + SEO

### 3.4 Revertir `staticPageGenerationTimeout`

Eliminar las líneas añadidas en `next.config.ts` (líneas 96-109 aprox.) restaura el default
de 60s. Sin riesgo.

### 3.5 Revertir meta description fianza

```bash
# Restaurar desde backup pre-Fase 3B (que tiene la meta original)
# o manualmente con UPDATE directo
```

---

## 4. Verificación post-rollback

Tras cualquier rollback, ejecutar:

```bash
npm run lint && npx tsc --noEmit && npm run test && npm run build
npx tsx scripts/fase3-validar-lote.ts  # validar estados AI
```

Comparar `bodySha256` de los 15 artículos contra el backup aplicado para confirmar integridad.

---

## 5. Puntos de no-retorno

**No hay puntos de no-retorno en la Fase 3B.** Todos los cambios son reversibles.

El único cambio con efecto externo sería un **push a `origin/main` y despliegue Vercel**
(BLOQUE 6), que publica los cambios. Antes de eso, todo es local y reversible. Si el
despliegue revelara un problema, el procedimiento sería:

1. `git revert` del commit problemático (o de toda la Fase 3B).
2. `git push origin main` (Vercel redespliega automáticamente).
3. Verificar producción.

No se usa `--force` ni se reescribe historial (cumple §5 de AGENTS.md).

---

## 6. Trazabilidad de backups

Los backups **NO se commitean** (están en `auditoria-blog/`, gitignored por §6 de AGENTS.md).
Se conservan localmente para rollback. Si se necesita restauración tras pérdida local, los
datos también están en:

- `docs/audits/fase3b-lote1-claims-finales.json` (commiteado) — clasificación de claims
- `docs/audits/fase3b-lote1-estados-finales.json` (commiteado) — estados finales
- Los commits atómicos (commiteados) — código y scripts

La DB Neon conserva historial de transacciones para auditoría adicional.
