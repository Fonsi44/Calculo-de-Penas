# Backup y Restauración de Staging

## Método de backup

Neon ofrece protección nativa mediante:
1. **Branching**: crear una rama es un snapshot instantáneo.
2. **Restore Points**: punto de restauración explícito (configurable en Neon Console).
3. **Backups automáticos**: Neon realiza backups diarios con 7 días de retención.

## Procedimiento de backup manual

```bash
neonctl branches create --name backup-$(date +%Y%m%d)
```

## Retención

- Snapshots de branching: indefinido (se eliminan manualmente)
- Backups automáticos Neon: 7 días
- Restore points: persistentes hasta eliminación

## Restauración

1. Identificar rama de backup o restore point
2. Crear nueva rama desde el punto de restauración
3. Verificar integridad de datos
4. Actualizar DATABASE_URL de staging si es necesario

## RPO / RTO

| Métrica | Objetivo |
|---------|----------|
| RPO (Recovery Point Objective) | 24 horas |
| RTO (Recovery Time Objective) | 1 hora (creación de rama) |

## Prueba de restauración

Se ha realizado una restauración sintética:
1. Crear rama temporal desde el punto de restauración
2. Verificar datos sintéticos recuperables
3. Eliminar rama temporal

## Responsables

- Desarrollo: revisión semanal de backups
- DevOps: configuración de alertas de backup fallido
