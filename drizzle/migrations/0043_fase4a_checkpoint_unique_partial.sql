-- Migration 0043: Corrige UNIQUE de case_summary_checkpoints
--
-- El UNIQUE absoluto sobre expediente_id (migración 0041) impedía tener
-- histórico de checkpoints (invalidados + vigente). Lo cambiamos a UNIQUE
-- parcial solo para vigentes, permitiendo N invalidados + 1 vigente por
-- expediente. Esto es coherente con el flujo de resumen incremental:
-- invalidar previo + insertar nuevo vigente en transacción.
--
-- Idempotente.

-- 1. Eliminar el constraint UNIQUE absoluto (creado por 0041). El nombre real
--    generado por Drizzle es case_summary_checkpoints_expediente_id_key; el
--    nombre lógico .unique() es case_summary_checkpoints_expediente_id_unique.
--    Dropeamos ambos por si acaso.
ALTER TABLE "case_summary_checkpoints" DROP CONSTRAINT IF EXISTS "case_summary_checkpoints_expediente_id_unique";
ALTER TABLE "case_summary_checkpoints" DROP CONSTRAINT IF EXISTS "case_summary_checkpoints_expediente_id_key";

-- 2. UNIQUE parcial: solo un vigente por expediente.
CREATE UNIQUE INDEX IF NOT EXISTS "case_summary_checkpoints_vigente_unique"
  ON "case_summary_checkpoints"("expediente_id") WHERE "estado" = 'vigente';
