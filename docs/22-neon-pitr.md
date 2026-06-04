# Neon — Point-in-Time Recovery (PITR)

## Estado actual

Neon Free tier incluye **PITR de 7 días**. Esto significa que podemos restaurar
la base de datos a cualquier momento dentro de los últimos 7 días.

## Por qué es importante

- **Borrado accidental**: Si alguien ejecuta `DELETE FROM delitos WHERE true`,
podemos volver al estado de hace 5 minutos.
- **Migración rota**: Si una migración falla a mitad, podemos volver atrás.
- **Auditoría**: Si hay duda sobre cuándo se insertó un registro problemático.

## Cómo restaurar (interfaz web)

1. Ir a https://console.neon.tech
2. Seleccionar proyecto `calculo-de-penas-nextjs`
3. Click en "Restore" (esquina superior derecha)
4. Seleccionar fecha/hora objetivo (slider de 7 días)
5. Neon crea un **branch temporal** con los datos al punto seleccionado
6. Verificar en el branch temporal
7. Si OK, promover a producción con "Set as primary"

## Cómo restaurar (CLI con `neonctl`)

Requiere instalar `neonctl` (no está en este proyecto todavía, se haría en Fase E).

```bash
# Login
neonctl auth

# Listar proyectos
neonctl projects list

# Ver ventana de restore disponible
neonctl branches list --project-id <PROJECT_ID>

# Crear branch con PITR
neonctl branches create \
  --project-id <PROJECT_ID> \
  --name "restore-2026-06-04-pre-test" \
  --parent main \
  --restore <ISO_TIMESTAMP>

# Ejemplo: restaurar a "2026-06-04 14:30:00 UTC"
# ISO: 2026-06-04T14:30:00Z
neonctl branches create \
  --project-id prj_xxx \
  --name "restore-test" \
  --parent main \
  --restore "2026-06-04T14:30:00Z"
```

## Limitaciones del free tier

| Límite | Free | Pro ($19/mes) |
|--------|------|---------------|
| PITR window | 7 días | 30 días |
| Almacenamiento | 0.5 GB | 10 GB |
| Compute | 191.9h/mes | 300h/mes |
| Branching | 10 branches | 100 branches |
| Proyectos | 1 (este) | ilimitado |

**Decisión**: 7 días es suficiente para detectar errores humanos en menos de una
semana. Si el proyecto crece, evaluar Pro.

## Prueba de PITR (recomendada, no urgente)

Una vez al mes, hacer un "fire drill" para confirmar que el restore funciona:

1. Anotar timestamp actual: `date -u +%Y-%m-%dT%H:%M:%SZ`
2. Crear una tabla temporal: `CREATE TABLE pitr_test (id serial)`
3. Esperar 1-2 minutos
4. Crear branch de restore a timestamp del paso 1
5. Conectar al branch y verificar que `pitr_test` NO existe
6. Conectar al main y verificar que `pitr_test` SÍ existe
7. Limpiar: `DROP TABLE pitr_test` en main, eliminar branch

**Estado**: Pendiente de ejecutar (Fase B3).

## Riesgos

- **No hay backups fuera de Neon**: Si Neon cae (improbable pero posible) y
nuestro proyecto es el único afectado, perdemos los datos. **Mitigación**: export
semanal vía `pg_dump` (no implementado, Fase E).

- **El restore no es instantáneo**: Crear branch con PITR toma ~30s. Si tenemos
un incidente crítico, podemos perder 1-2 minutos de tráfico legítimo.

## Checklist de restore (en caso de incidente)

- [ ] 1. NO entrar en pánico
- [ ] 2. Verificar el problema (es realmente la DB? logs de Vercel, queries lentas?)
- [ ] 3. Anotar el momento EXACTO del incidente
- [ ] 4. Crear branch de restore en Neon
- [ ] 5. Verificar branch temporal
- [ ] 6. Si es un borrado total: promover branch a main
- [ ] 7. Si es parcial: extraer datos del branch y mergear a main
- [ ] 8. Comunicar a usuarios si aplica
- [ ] 9. Post-mortem: ¿cómo prevenir?

## Roadmap

- [ ] **Fase B3**: Ejecutar primera prueba de PITR (fire drill)
- [ ] **Fase E**: Configurar `pg_dump` semanal a Object Storage (R2/S3)
- [ ] **Fase E**: Instalar `neonctl` y documentar flujo CLI
- [ ] **Fase E**: Configurar alerta Neon (storage > 80% compute hours)
