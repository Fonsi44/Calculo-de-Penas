# Fase 3 — Migración de base de datos del Lote 1

**Fecha:** 2026-07-26
**Modo:** `IMPLEMENTACIÓN` sobre `main`

---

## 1. Migración aplicada realmente en Neon

La fase Fase 3 introdujo 5 columnas nuevas en `blog_posts` para el flujo de
revisión IA con DeepSeek:

| Columna | Tipo | Default |
|---------|------|---------|
| `ai_review_provider` | varchar(100) | — |
| `ai_review_requires_human` | boolean | false |
| `ai_research_provider` | varchar(100) | — |
| `ai_search_queries_count` | integer | 0 |
| `ai_official_sources_count` | integer | 0 |

Estas columnas **ya existen en Neon** (verificadas por consulta directa) y están
**reflejadas en `lib/schema.ts`** (líneas 427, 436, 437, 438, 439).

---

## 2. Problema detectado: prefijo `0038` duplicado

Antes de este cierre, existían **tres** archivos con prefijo `0038_`:

```
drizzle/migrations/0038_colossal_gateway.sql              ← DUPLICADO (eliminado)
drizzle/migrations/0038_lively_silvermane.sql              ← CANÓNICO (en journal idx 38)
drizzle/migrations/0038_fase4a_sgie_schema_migrations.sql  ← sistema SGIE aparte
```

- `0038_colossal_gateway.sql` y `0038_lively_silvermane.sql` eran **idénticos** byte a byte (verificado con `diff`). El journal Drizzle solo referenciaba `0038_lively_silvermane`, por lo que `colossal_gateway` era un **duplicado huérfano** que rompería la reproducibilidad.
- `0038_fase4a_sgie_schema_migrations.sql` pertenece al **sistema SGIE** (gestiona su propia tabla `sgie_schema_migrations` y se aplica vía `scripts/e2e/apply-fase4-migrations.mjs`, no vía `__drizzle_migrations`). No está en el journal Drizzle y **no colisiona funcionalmente**, aunque su nombre comparte prefijo numérico. Se deja intacto (es de otra fase y tiene su propio aplicador).

---

## 3. Acción correctiva

- **Eliminado** `drizzle/migrations/0038_colossal_gateway.sql` (duplicado no referenciado).
- **Conservado** `drizzle/migrations/0038_lively_silvermane.sql` como migración canónica Fase 3.
- **Conservado** `drizzle/migrations/0038_fase4a_sgie_schema_migrations.sql` (sistema SGIE aparte).

---

## 4. Sincronización del journal y snapshot

- **Journal** (`drizzle/migrations/meta/_journal.json`): la entrada `idx: 38` referencia `tag: "0038_lively_silvermane"`, `version: "7"`. ✅ Sincronizado.
- **Snapshot** (`drizzle/migrations/meta/0038_snapshot.json`): contiene las 16 columnas `ai_review_*` / `ai_research_*` / `ai_official_sources_count` en `blog_posts` y la tabla `sgie_schema_migrations`. ✅ Coincide con `lib/schema.ts`.
- **Sin cambios manuales no versionados**: todas las columnas aplicadas en Neon tienen representación SQL + snapshot + schema.

---

## 5. Reproducibilidad

Una instalación nueva ejecutaría:

```bash
npx drizzle-kit migrate
```

Drizzle leería el journal, aplicaría las migraciones `0000` → `0038_lively_silvermane` en orden, y `0038_lively_silvermane.sql` ejecutaría los 5 `ALTER TABLE ... ADD COLUMN`. Como las columnas no existen en una DB vacía, **no hay conflicto**.

La migración **no es idempotente** (usa `ADD COLUMN` sin `IF NOT EXISTS`), pero esto es **correcto y esperado** para Drizzle: cada migración se ejecuta una sola vez y se registra en `__drizzle_migrations`. No se aplica dos veces.

---

## 6. Sistema SGIE (fase4a) — nota

`0038_fase4a_sgie_schema_migrations.sql` crea la tabla `sgie_schema_migrations`,
que es un **registro paralelo** al de Drizzle para las migraciones de la rama
Neon aislada SGIE. Se aplica con `scripts/e2e/apply-fase4-migrations.mjs`, que
calcula un hash SHA-256 del contenido y aborta si el hash cambia. Es
**idempotente** (`CREATE TABLE IF NOT EXISTS`).

No forma parte de la cadena Drizzle canónica y no afecta a la reproducibilidad
del schema de `blog_posts`.

---

## 7. Verificación de divergencia producción ↔ código

| Aspecto | Estado |
|---------|--------|
| Columnas en Neon | ✅ 5 columnas Fase 3 presentes |
| Columnas en `lib/schema.ts` | ✅ 5 columnas presentes (líneas 427–439) |
| Migración SQL versionada | ✅ `0038_lively_silvermane.sql` |
| Entrada en journal | ✅ `idx: 38` |
| Snapshot coherente | ✅ `0038_snapshot.json` |
| Duplicados eliminados | ✅ `colossal_gateway` borrado |

**No existe riesgo de divergencia** entre producción y código tras este cierre.

---

## 8. Conclusión

La migración Fase 3 es **reproducible**: parte de un snapshot correcto, está
registrada en el journal, su SQL coincide con el schema, y el duplicado que
rompía la cadena Drizzle ha sido eliminado. Una instalación nueva reproduce el
esquema sin errores.
