-- Reconciliación PR #20: garantizar la extensión requerida por 0025.
--
-- Algunas bases históricas contienen el schema funcional de enlaces mágicos,
-- pero no conservan pgcrypto. La base canónica creada desde cero sí la
-- contiene porque 0025 ejecuta este mismo contrato.
--
-- Aditiva e idempotente. No modifica datos.

CREATE EXTENSION IF NOT EXISTS pgcrypto;
