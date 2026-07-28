---
status: current
owner: engineering
created: 2026-07-28
last_reviewed: 2026-07-28
review_due: 2026-10-28
supersedes: null
superseded_by: null
---
# ADR-003: Job queue strategy

**Fecha:** 2026-07-18. **Estado:** IMPLEMENTADO.

## Contexto

El SGIE necesita procesar documentos de forma asíncrona y durable: extracción de texto, clasificación, OCR, procesamiento IA y envío de comunicaciones. Estos procesos deben ejecutarse sin bloquear la respuesta HTTP, con reintentos automáticos ante fallos transitorios y sin perder trabajos.

Se evaluaron tres estrategias:
1. Cola externa (Redis Bull, RabbitMQ, SQS).
2. PGQ (PostgreSQL como cola con `LISTEN`/`NOTIFY`).
3. Tabla de jobs con polling y `FOR UPDATE SKIP LOCKED`.

## Decisión

**Implementar cola de trabajos directamente en PostgreSQL** usando una tabla `jobs_sgie` con polling vía `FOR UPDATE SKIP LOCKED`, backoff exponencial con jitter y dead-letter queue en tabla separada.

## Detalles de implementación

### Por qué `FOR UPDATE SKIP LOCKED`

```sql
UPDATE "jobs_sgie"
SET "estado" = 'en_proceso', "locked_at" = NOW(), "lock_expires_at" = NOW() + INTERVAL '5 minutes', "worker_id" = $1
WHERE "id" IN (
  SELECT "id" FROM "jobs_sgie"
  WHERE "estado" = 'pendiente' AND ("next_run_at" IS NULL OR "next_run_at" <= NOW())
  ORDER BY "priority" DESC, "creado_en" ASC
  LIMIT $2 FOR UPDATE SKIP LOCKED
)
RETURNING *
```

- `FOR UPDATE` bloquea las filas seleccionadas para que otros workers no las procesen.
- `SKIP LOCKED` (PostgreSQL 9.5+) omite filas ya bloqueadas por otros workers, evitando contención.
- Esto permite N workers en paralelo sin necesidad de un coordinador externo.
- Atomicidad: el UPDATE y el bloqueo ocurren en la misma sentencia.

### Por qué exponencial backoff con jitter

Cuando un job falla:
```typescript
const baseDelayMs = 60_000; // 1 minuto
const maxDelayMs = 86_400_000; // 24 horas
const delay = Math.min(Math.pow(2, intentosActuales) * baseDelayMs, maxDelayMs);
const jitter = Math.random() * 0.3 * delay; // 30% jitter
const nextRun = new Date(Date.now() + delay + jitter);
```

Progresión de reintentos: 1 min → 2 min → 4 min → 8 min → 16 min → 32 min → 64 min → 128 min → 256 min → 512 min → 1024 min (~17h) → 24h.

El jitter del 30% evita el "thundering herd" cuando múltiples jobs fallan simultáneamente. Sin jitter, todos los jobs reintentarían exactamente al mismo tiempo.

### Por qué dead-letter queue

Cuando un job excede `maxIntentos` (default 3), se mueve a `dead_letter_jobs` con:
- El payload original completo
- El error final y código de error
- El número total de intentos
- El `correlationId` para trazabilidad

Esto evita que jobs permanentemente fallidos sigan reintentando y desperdiciando recursos. La DLQ permite inspección manual y reintento selectivo vía `reintentarJob()`.

### Por qué no un servicio de cola externo

| Factor | PostgreSQL | Redis/SQS |
|--------|-----------|-----------|
| Complejidad operativa | Cero (ya tenemos DB) | Nuevo servicio que monitorear |
| Durabilidad | Garantizada por PostgreSQL | Depende del servicio |
| Consistencia transaccional | La misma transacción DB puede insertar job y datos | Requiere patrón outbox o 2PC |
| Costo | Incluido en DB actual | Extra |
| Latencia | Polling (segundos) | Inmediata (push) |

Para el volumen del SGIE (decenas de jobs por hora, no miles por segundo), el polling cada 1 minuto del cron es suficiente. La latencia de segundos es aceptable para procesamiento documental.

## Consecuencias

- **Positivas**: cero dependencias externas, consistencia transaccional con los datos del dominio, idempotencia nativa vía `idempotencyKey`.
- **Negativas**: polling no es adecuado para latencia < 1 segundo. La tabla `jobs_sgie` puede convertirse en cuello de botella si hay miles de jobs pendientes (mitigado con índices en `estado`, `next_run_at` y `priority`).
- **Riesgo**: locks abandonados si un worker muere. Mitigado con `recuperarLocksAbandonados(15 min)` que libera jobs con `lock_expires_at` vencido.

## Referencias

- Implementación: `lib/sgie/jobs-db.ts`
- Worker cron: `app/api/cron/sgie/procesar/route.ts`
- Esquema: `drizzle/migrations/0034_fase2_workflows_outbox_jobs.sql`
- Documentación de arquitectura: `docs/architecture/fase-2-nucleo-durable-documentos-comunicaciones.md`
