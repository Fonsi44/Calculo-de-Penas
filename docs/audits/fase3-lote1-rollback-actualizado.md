# Fase 3 — Rollback actualizado del Lote 1 Penal

**Fecha:** 2026-07-26

---

## 1. Qué se puede revertir

El cierre correctivo del lote 1 tocó:

| Artefacto | Tipo | Reversibilidad |
|-----------|------|----------------|
| Estados `ai_review_status` en 14 de 15 artículos | DB Neon | ✅ Restaurables desde backup |
| `ai_review_requires_human` en 14 de 15 artículos | DB Neon | ✅ Restaurables desde backup |
| `drizzle/migrations/0038_colossal_gateway.sql` | Archivo eliminado | ✅ Recuperable de git history (commit anterior) |
| `lib/ai/review-invariants.ts` | Nuevo archivo | ✅ Eliminable |
| `components/blog/ai-review-notice.tsx` | Nuevo archivo | ✅ Eliminable (no integrado en ninguna página) |
| `scripts/fase3-reclasificar-lote1.ts` | Nuevo script | ✅ Eliminable |
| Tests `tests/fase3-*.test.ts(x)` | Nuevos | ✅ Eliminables |
| Entregables `docs/audits/fase3-lote1-*.md/.json` | Documentos | ✅ Eliminables |

**Lo que NO se tocó y NO requiere rollback:**
- `lib/schema.ts` (sin cambios en este cierre).
- `app/(public)/**` (sin cambios; el componente `AiReviewNotice` no se integró).
- `data/*.json` (fuentes canónicas intactas).
- Migración `0038_lively_silvermane.sql` (columnas ya aplicadas en Neon antes de este cierre).

---

## 2. Backup previo a la reclasificación

```
Ruta:     auditoria-blog/backup-pre-reclasificacion-2026-07-26T10-45-49-672Z.json
Filas:    15 (los slugs del lote 1)
Estado:   { "completed": 15 }  ← estado anterior a la reclasificación
```

Este backup contiene el snapshot completo de los 15 registros ANTES de la
reclasificación, incluyendo todos los campos `ai_review_*`.

---

## 3. Procedimiento de rollback de la reclasificación (si fuera necesario)

### Opción A — Script inverso (recomendado)

Restaura los 15 artículos a `completed` desde el backup. **Solo ejecutar si se
decide deshacer la reclasificación** (no recomendado: devolvería al estado
contradictorio original).

```bash
npx tsx -e "
import { config } from 'dotenv';
import { neon } from '@neondatabase/serverless';
import * as fs from 'fs';
config({ path: '.env.local' });
const sql = neon(process.env.DATABASE_URL);
const backup = JSON.parse(fs.readFileSync('auditoria-blog/backup-pre-reclasificacion-2026-07-26T10-45-49-672Z.json','utf8'));
await sql\`BEGIN\`;
for (const r of backup) {
  await sql\`
    UPDATE blog_posts
    SET ai_review_status = \${r.ai_review_status},
        ai_review_requires_human = \${r.ai_review_requires_human}
    WHERE slug = \${r.slug}
  \`;
}
await sql\`COMMIT\`;
console.log('Rollback aplicado a', backup.length, 'artículos');
"
```

### Opción B — Revertir commits de git

Los commits del cierre correctivo pueden revertirse con `git revert <sha>`:
```
04956fa7  test(fase3): invariants y tests DeepSeek
b9bb7c37  feat(fase3): componente AiReviewNotice
494f9f14  docs(fase3): correcciones, claims pendientes, fuentes
17af2ca6  feat(fase3): reclasificar estados del lote 1
336e0b7f  fix(migracion): eliminar duplicado 0038
```

`git revert` no borra historial; crea commits inversos. Cumple R19 (sin rebase,
sin force-push).

---

## 4. Rollback de la migración (no necesario)

La migración `0038_lively_silvermane.sql` añadió 5 columnas a `blog_posts`. Estas
columnas **ya existen en Neon** y son usadas por el flujo de revisión IA.
**No deben eliminarse** salvo decisión arquitectónica mayor.

Si se quisiera revertir (no recomendado):
```sql
ALTER TABLE blog_posts
  DROP COLUMN ai_review_provider,
  DROP COLUMN ai_review_requires_human,
  DROP COLUMN ai_research_provider,
  DROP COLUMN ai_search_queries_count,
  DROP COLUMN ai_official_sources_count;
```

El archivo eliminado `0038_colossal_gateway.sql` era un duplicado sin efecto
en DB; su eliminación **no requiere rollback** (no se aplicó nunca).

---

## 5. Verificación post-rollback (si se aplica)

Tras cualquier rollback, verificar:
```sql
SELECT slug, ai_review_status, ai_review_requires_human
FROM blog_posts
WHERE slug = ANY(ARRAY[
  'delitos-mas-comunes-honduras',
  /* ... los 15 slugs ... */
  'abogado-penalista-choluteca'
]);
```

Los invariantes de `lib/ai/review-invariants.ts` deben seguir cumpliéndose.

---

## 6. Hash de integridad del backup

El backup `backup-pre-reclasificacion-2026-07-26T10-45-49-672Z.json` puede
verificarse con:

```bash
shasum -a 256 auditoria-blog/backup-pre-reclasificacion-2026-07-26T10-45-49-672Z.json
```

Cualquier alteración del archivo se detectaría por cambio de hash.

---

## 7. Conclusión

El cierre correctivo es **totalmente reversible**:
- DB: backup previo + script inverso.
- Código: `git revert` de los 5 commits.
- Migración: las columnas no se eliminan (no aplica rollback).

**No se recomienda revertir la reclasificación**: devolvería al estado
contradictorio original (15 × `completed` con 79 claims no resueltos). El
estado actual (1 completed, 1 source_checked, 4 needs_human_review, 9 blocked)
es honesto y correcto.
