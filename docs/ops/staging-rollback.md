# Rollback de Staging

## Prioridades

1. **Kill switch**: desactivación inmediata mediante feature flags
2. **Flags**: desactivación progresiva de funcionalidades
3. **Rollback de deployment**: volver a versión anterior
4. **Restauración DB**: solo cuando sea imprescindible

## Kill switch

```typescript
import { activateKillSwitch, deactivateKillSwitch } from '@/lib/sgie/feature-flags';

// Activar
await activateKillSwitch('sgie.ai.classification', actorId, 'incidente en staging');

// Desactivar
await deactivateKillSwitch('sgie.ai.classification', actorId, 'incidente resuelto');
```

## Rollback de deployment

```bash
# Ver despliegues recientes
vercel list

# Rollback a despliegue específico
vercel rollback <deployment-id>
```

## Rollback lógico de jobs

Los jobs documentales usan outbox con idempotencia:
1. Desactivar procesamiento de jobs (flag o kill switch)
2. Revisar DLQ
3. Replay manual si es necesario
4. Reactivar procesamiento

## Recuperación DB

Solo si hay corrupción de datos:
1. Crear nueva rama desde backup
2. Actualizar DATABASE_URL
3. Verificar integridad
4. Señalizar a todo el equipo

## Tiempos

| Fase | Tiempo objetivo |
|------|----------------|
| Detección | < 5 minutos |
| Mitigación (kill switch) | < 1 minuto |
| Rollback deployment | < 10 minutos |
| Restauración DB | < 30 minutos |
| Recuperación total | < 1 hora |
