---
status: current
owner: engineering
created: 2026-07-28
last_reviewed: 2026-07-28
review_due: 2026-10-28
supersedes: null
superseded_by: null
---
# Runbook de Backup y Restauración — Pineda y Asociados

**Última actualización:** 2026-07-12
**Fase:** 5 — Operaciones
**Propietario:** Administrador del sistema

---

## 1. Componentes y sus backups

| Componente | Proveedor | Backup nativo | RPO | RTO |
|------------|-----------|---------------|-----|-----|
| PostgreSQL (Neon) | Neon | Point-in-time recovery (PITR), 7 días de historia | < 1 min | < 5 min |
| Vercel Blob | Vercel | Retención de objetos, sin delete permanente inmediato | N/A (inmutable) | < 1 min |
| Variables de entorno | Vercel | No hay backup automático. Snapshots manuales. | Depende de snapshot | < 5 min (reconfigurar) |
| Código fuente | GitHub | Git history completo + ramas | Cada commit | < 2 min (redeploy) |

---

## 2. Restauración de base de datos (Neon)

### 2.1 Point-in-time recovery (PITR)

```bash
# 1. Ir a Neon Console → proyecto → Branches → Restore
# 2. Seleccionar timestamp deseado (máx 7 días atrás)
# 3. Crear rama de restauración
# 4. Verificar datos en la rama restaurada
# 5. Promover la rama o actualizar DATABASE_URL
```

### 2.2 Restauración desde snapshot manual (pg_dump)

```bash
# Backup (manual periódico):
pg_dump "$DATABASE_URL" --no-owner --no-acl -Fc > backup_$(date +%Y%m%d_%H%M%S).dump

# Restore:
pg_restore --clean --if-exists -d "$DATABASE_URL" backup_YYYYMMDD_HHMMSS.dump
```

### 2.3 Verificación post-restauración

```sql
-- Verificar tablas críticas
SELECT count(*) FROM usuarios WHERE active = true;
SELECT count(*) FROM blog_posts WHERE status = 'published';
SELECT count(*) FROM expedientes WHERE cerrado_en IS NULL;

-- Verificar integridad de embeddings
SELECT count(*), entidad_tipo FROM embeddings GROUP BY entidad_tipo;

-- Re-indexar embeddings si fue necesario restaurar a un punto pre-indexación
npm run rag:indexar -- --reset --aplicar
```

---

## 3. Restauración de Vercel Blob

- Vercel Blob no tiene "restore" como tal. Los objetos se almacenan con redundancia.
- Si un objeto se elimina accidentalmente, contactar a Vercel support (< 30 días).
- URLs de blob son permanentes mientras el objeto exista.
- No hay PITR: si se borra y no hay copia local, se pierde.

### Backup manual de blobs críticos

```bash
# Listar blobs (requiere token)
# Descargar blobs importantes:
node -e "
const { list } = require('@vercel/blob');
list({ token: process.env.BLOB_READ_WRITE_TOKEN }).then(r =>
  r.blobs.forEach(b => console.log(b.url))
);
"
```

---

## 4. Rotación de secretos

### 4.1 Procedimiento de rotación

| Secreto | Dónde vive | Impacto | Procedimiento |
|---------|-----------|---------|---------------|
| `JWT_SECRET` | Vercel env vars | Invalida TODAS las sesiones | 1. Generar nuevo secreto. 2. Mover actual a `JWT_SECRET_PREVIOUS`. 3. Poner nuevo en `JWT_SECRET`. 4. Redeploy. 5. Esperar 24h. 6. Eliminar `JWT_SECRET_PREVIOUS`. |
| `DEEPSEEK_API_KEY` | Vercel env vars | Chat + IA documental offline hasta redeploy | 1. Generar nueva key en DeepSeek. 2. Actualizar Vercel env var. 3. Redeploy. |
| `RESEND_API_KEY` | Vercel env vars | Correos transaccionales offline | Rotar en Resend dashboard + Vercel env var + redeploy. |
| `BLOB_READ_WRITE_TOKEN` | Vercel env vars | Uploads offline | Rotar en Vercel Blob dashboard + env var + redeploy. |
| `DATABASE_URL` | Vercel env vars | App entera offline | Coordinar con Neon (no rotar sin rama de staging). |
| `ENCRYPTION_KEY` | Vercel env vars | Datos cifrados ilegibles | **NO rotar sin migración de datos.** Requiere plan de recifrado completo. |
| `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` | Vercel env vars | GSC/GA4 offline | Rotar en Google Cloud Console + env var + redeploy. |
| `OAUTH_CLIENT_SECRET` | Vercel env vars | OAuth flows (solo admin) | Rotar en Google Cloud Console + env var + redeploy. |

### 4.2 Validación post-rotación

```bash
npm run seo:doctor    # Verificar GSC/GA4/Bing
npm run build         # Build sin errores
npm run test          # Tests pasan
curl -I https://www.pinedayasociadoshn.com  # HTTP 200
```

---

## 5. Monitoreo y alertas

### 5.1 Health checks

| Recurso | Endpoint/Comando | Frecuencia | Alerta si |
|---------|-----------------|------------|-----------|
| Web pública | `GET /api/health` | 5 min | != 200 |
| DB conectividad | `npm run db:check` | 15 min | timeout |
| SEO live data | `npm run seo:doctor` | Diario | ERROR count > 0 |
| Sitemap | `GET /sitemap.xml` | Diario | != 200 o vacío |
| Build | `npm run build` | Cada deploy | exit != 0 |

### 5.2 SLO (Service Level Objectives)

| Métrica | Objetivo | Medición |
|---------|----------|----------|
| Disponibilidad web pública | 99.9% mensual | Vercel Analytics |
| Tiempo de respuesta API (p95) | < 500ms | Vercel Analytics |
| Error rate API | < 1% | Vercel Analytics |
| Frescura datos SEO | < 7 días | `npm run seo:doctor` |

---

## 6. Plan de recuperación ante desastres (DRP)

### 6.1 Escenario: Neon DB caída total

1. Verificar status.neo.tech — si es outage de proveedor, esperar.
2. Si es permanente: restaurar desde último snapshot manual (pg_dump).
3. Crear nuevo proyecto Neon, cargar dump, actualizar DATABASE_URL.
4. Redeploy Vercel.
5. Re-indexar embeddings: `npm run rag:indexar -- --reset --aplicar`.

### 6.2 Escenario: Vercel Blob pérdida de datos

1. Si es outage, esperar (Vercel Status).
2. Si es permanente: re-subir documentos desde backups locales.
3. Los documentos legales críticos deben tener copia local en frío.

### 6.3 Escenario: Compromiso de secretos

1. Rotar TODOS los secretos inmediatamente (ver §4.1).
2. Invalidar todas las sesiones: cambiar `JWT_SECRET` (sin PREVIOUS).
3. Verificar logs de auditoría (`auditoria_eventos`) para actividad sospechosa.
4. Notificar a usuarios administradores.

---

## 7. Mantenimiento periódico

| Tarea | Frecuencia | Comando |
|-------|-----------|---------|
| Limpiar challenges 2FA expirados | Semanal | `npm run rag:indexar` incluye limpieza |
| Limpiar tokens reset expirados | Semanal | Automático (no requiere script) |
| Limpiar preview tokens expirados | Diario | Automático (DB maneja expiración) |
| Verificar integridad de índices | Mensual | `npm run db:check` |
| Auditar delitos (0-0 penas) | Trimestral | `npm run audit:delitos` |
| Backup manual DB (pg_dump) | Mensual | Ver §2.2 |
| Rotación de API keys externas | Semestral | Ver §4.1 |
