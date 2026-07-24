# Observabilidad de Staging

## Logs estructurados

Los logs de staging se obtienen mediante Vercel Logs:
```bash
vercel logs <deployment-url>
```

Cada log debe incluir:
- timestamp ISO
- nivel (info, warn, error)
- correlation_id (UUID v4)
- entorno (staging)
- servicio (nextjs, cron, job)
- ruta de API
- duración en ms
- resultado (ok, error, degraded)

## Métricas

Registradas mediante Vercel Web Analytics y Speed Insights.
Métricas clave para staging:

| Métrica | Objetivo |
|---------|----------|
| Peticiones API | < 1% error rate |
| Latencia API p95 | < 1500 ms |
| Jobs fallidos | 0 |
| DLQ | 0 |
| DB disponible | 100% |
| IA disponible | > 99% |

## Alertas mínimas

| Alerta | Umbral | Acción |
|--------|--------|--------|
| Error rate API | > 1% en 5m | Revisar logs |
| Jobs fallidos | > 0 en 15m | Revisar cron |
| DB no disponible | Cualquier fallo | Revisar Neon |
| DeepSeek caído | 3+ timeouts seguidos | Activar modo heuristic |

## Health endpoint

- `GET /api/health` — estado del proceso
- `GET /api/health/readiness` — readiness completo (DB, migraciones, Blob, cron, email, IA)
