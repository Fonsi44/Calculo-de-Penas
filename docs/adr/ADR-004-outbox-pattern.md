---
status: current
owner: engineering
created: 2026-07-28
last_reviewed: 2026-07-28
review_due: 2026-10-28
supersedes: null
superseded_by: null
---
# ADR-004: Transactional outbox pattern

**Fecha:** 2026-07-18. **Estado:** IMPLEMENTADO.

## Contexto

El SGIE necesita emitir eventos de dominio (documento subido, workflow instanciado, comunicación solicitada) que deben ser procesados de forma fiable. El desafío es la consistencia entre la operación de negocio y la publicación del evento: si el evento se publica antes del commit de la transacción, puede haber eventos huérfanos; si se publica después, puede perderse si el publisher falla.

## Decisión

**Implementar el patrón transactional outbox**: los eventos se insertan en la tabla `outbox_events` dentro de la **misma transacción DB** que la operación de negocio. Un worker independiente (`despacharEventos()`) lee los eventos pendientes y los procesa.

## Detalles de implementación

### Flujo

```
Operación de negocio (ej: subir documento)
  │
  ├─ 1. BEGIN TRANSACTION
  ├─ 2. INSERT documentos_expediente
  ├─ 3. INSERT outbox_events (event_type='document.uploaded')
  ├─ 4. INSERT jobs_sgie (tipo='extraccion_texto')
  └─ 5. COMMIT (todo o nada)

Worker outbox (cada minuto)
  │
  ├─ 1. SELECT ... FOR UPDATE SKIP LOCKED
  ├─ 2. Procesar evento
  └─ 3. UPDATE status = 'completed'
```

### Tabla

```sql
CREATE TABLE outbox_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(100) NOT NULL,
  aggregate_id VARCHAR(100),
  aggregate_type VARCHAR(100),
  payload JSONB NOT NULL DEFAULT '{}',
  status VARCHAR(30) NOT NULL DEFAULT 'pending',  -- pending|enviando|completed|failed
  intentos INTEGER DEFAULT 0,
  max_intentos INTEGER DEFAULT 3,
  error TEXT,
  locked_at TIMESTAMPTZ,
  lock_expires_at TIMESTAMPTZ,
  worker_id VARCHAR(100),
  correlation_id VARCHAR(64),
  creado_en TIMESTAMPTZ DEFAULT now(),
  procesado_en TIMESTAMPTZ
);
```

### Eventos definidos

| Evento | Agregado | Cuándo se emite |
|--------|----------|-----------------|
| `case.created` | case | Expediente creado |
| `workflow.instantiated` | workflow | Workflow instanciado desde plantilla |
| `document.uploaded` | document | Documento recibido vía carga pública o admin |
| `document.processing.requested` | document | Abogado solicita procesar documento |
| `document.processed` | document | Pipeline documental completado |
| `document.review.required` | document | IA detecta confianza baja y requiere revisión |
| `requirement.completed` | requirement | Requisito documental cumplido |
| `communication.requested` | communication | Comunicación solicitada al sistema |
| `communication.cancelled` | communication | Comunicación cancelada |

### Idempotencia

El worker `despacharEventos()` usa el mismo patrón `FOR UPDATE SKIP LOCKED` que los jobs. Los eventos se procesan una sola vez: si un worker falla después de marcar `completed`, el siguiente ciclo no lo reprocesa porque el `WHERE status = 'pending'` lo excluye.

Los eventos bloqueados por un worker caído se recuperan vía `recuperarEventosBloqueados()` después de 30 minutos.

## Por qué no CDC / Debezium

| Factor | Outbox pattern | CDC (Debezium) |
|--------|---------------|----------------|
| Complejidad operativa | Baja (tabla + worker) | Alta (Kafka Connect + Debezium + Kafka) |
| Consistencia | Inmediata (misma transacción) | Depende de posición de log |
| Latencia | Segundos (polling) | Milisegundos (streaming) |
| Costo operativo | Ninguno extra | Cluster Kafka + Connect |
| Visibilidad | Consulta SQL directa | Requiere herramientas adicionales |

Para el SGIE, donde los eventos se generan por acciones de usuarios (decenas por hora), la latencia de segundos es aceptable y la simplicidad operativa de una tabla adicional outweighs los beneficios del CDC.

## Consecuencias

- **Positivas**: consistencia transaccional garantizada, visibilidad directa (SQL a `outbox_events`), sin dependencias externas, idempotente.
- **Negativas**: los eventos no se procesan hasta el próximo ciclo de polling (hasta 1 minuto). No hay reordenamiento de eventos — se procesan en orden de creación.
- **No implementado**: el worker actualmente solo marca como `completed` sin enviar realmente a un broker externo. Si en el futuro se necesita Kafka/RabbitMQ, el outbox provee la cola de eventos para publicar con exactly-once semantics.

## Referencias

- Implementación: `lib/sgie/outbox.ts`
- Worker: `app/api/cron/sgie/procesar/route.ts` (invoca `despacharEventos()`)
- Esquema: `drizzle/migrations/0034_fase2_workflows_outbox_jobs.sql`
-Jsona: `docs/architecture/fase-2-nucleo-durable-documentos-comunicaciones.md`
