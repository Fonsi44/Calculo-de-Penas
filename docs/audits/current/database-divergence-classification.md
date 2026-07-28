---
status: current
owner: engineering
created: 2026-07-28
last_reviewed: 2026-07-28
review_due: 2026-08-04
supersedes: null
superseded_by: null
---

# Clasificación de divergencias de base de datos

## Resultado reproducido

El inventario semántico conservado en `.local/schema-diff-pr20.json` contiene
exactamente **82 diferencias bajo `public`**:

| Clasificación | Objetos | Decisión |
|---|---:|---|
| `TRACKING_ONLY` | 45 | 42 posiciones ordinales de columnas y 3 constraints UNIQUE equivalentes a índices UNIQUE ya presentes. |
| `REQUIRED_BY_HEAD` | 36 | 36 funciones aportadas por `pgcrypto`, requerido por la migración 0025 y presente en la canónica. |
| `CLONE_LEGACY_SAFE` | 1 | El enum `auditoria_accion` tiene tres valores append-only adicionales, sin consumidores en HEAD. |
| `UNKNOWN` | 0 | Ninguno. |

La clasificación fila por fila está en
`docs/audits/current/database-divergence-classification.csv`.

## Causa raíz

1. El comparador trataba `ordinal_position` como parte del contrato de una
   columna, aunque PostgreSQL no permite reordenar columnas sin recrear tablas
   y el orden no cambia el contrato nominal usado por la aplicación.
2. El clon no contiene la extensión `pgcrypto`, aunque la migración
   `0025_enlaces_token_hash.sql` la exige. Las 36 funciones son una sola
   ausencia de extensión, no 36 decisiones independientes.
3. Tres unicidades fueron creadas históricamente como constraints en el clon y
   como índices únicos en la canónica. El índice subyacente y las columnas
   protegidas son equivalentes.
4. PostgreSQL conserva tres valores históricos adicionales en
   `auditoria_accion`; no hay consumidores en HEAD y retirarlos sería una
   operación destructiva sin beneficio contractual.

## Resolución verificada

- El comparador contractual ignora únicamente posición ordinal y conserva
  `compatibility: ORDINAL_POSITION_ONLY` como evidencia.
- Las tres constraints se normalizan solo cuando existe el mismo índice UNIQUE
  canónico sobre las mismas columnas.
- El enum del clon se acepta únicamente como superconjunto append-only del
  conjunto requerido.
- `manual-0058` garantiza `pgcrypto` de forma aditiva e idempotente.
- El inventario regenerado reporta `publicDrift: 0`.
- Los seeds contractuales coinciden por claves naturales y contenido; las
  filas adicionales del clon están clasificadas como configuración mutable o
  datos operativos.
- El plan firmado sobre HEAD
  `ab88a1bf4db89711b5fedb4fc0b84d349a636c07` resultó `EQUIVALENTE`.
- El baseline se aplicó al clon no productivo: 39 Drizzle + 21 manuales.
- Segunda ejecución: 0 aplicadas, 60 omitidas por tracking.

No se ha escrito en Production ni se ha aplicado ninguna migración productiva.
