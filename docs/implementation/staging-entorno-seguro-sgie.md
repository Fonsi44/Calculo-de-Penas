# Entorno staging seguro — MVP SGIE semi-autónomo

**Fecha:** 9 de julio de 2026
**Estado staging:** 🚫 **NO EXISTE** — requiere creación de DB Neon + configuración de variables
**Referencia:** `docs/ops/staging-neon-final-status.md` (8 jul 2026) — confirma staging no disponible

---

## 1. Diagnóstico

### 1.1 Estado actual

| Elemento | Estado | Evidencia |
|---|---|---|
| DB staging Neon | 🚫 **No existe** | `docs/ops/staging-neon-final-status.md`: "DATABASE_URL staging/preview disponible: no" |
| `CRON_SECRET` | 🚫 Ausente | `.env.local` no lo contiene; `.env.example` no lo referencia |
| Código SGIE | ✅ Listo | 861 tests, lint/tsc/build verde |
| Migraciones 0025–0029 | ✅ Generadas | En `drizzle/migrations/`, orden correcto en journal |
| Web pública | ✅ Intacta | `app/(public)` sin cambios SGIE |
| `DATABASE_URL` local | ⚠ Sin confirmar entorno | Neon endpoint `ep-super-leaf-...` — no distinguible staging/prod |

### 1.2 Por qué no existe staging

El proyecto Pineda y Asociados tiene **una sola base de datos Neon** (`neondb` en endpoint `ep-super-leaf-appekgbu`). No se ha creado un branch o proyecto separado para staging. La configuración de Vercel (`vercel.json`) no referencia entornos diferenciados. El archivo `.env.example` deja `DATABASE_URL=` vacío (se espera que el desarrollador lo complete).

---

## 2. Estrategia recomendada: crear DB staging en Neon

### 2.1 Opción A — Branch de Neon (recomendada)

Neon soporta **branching** (similar a Git). Crear un branch `staging` desde el branch principal (`main`):

1. En Neon Console → proyecto → Branches → Create branch
2. Nombre: `staging`
3. Source: `main` (o el branch por defecto)
4. Copiar la nueva `DATABASE_URL` del branch `staging`
5. Configurar en Vercel como variable de entorno del entorno **Preview**

**Ventaja:** datos separados, no afecta producción, fácil de recrear.

### 2.2 Opción B — Proyecto Neon separado

Crear un proyecto Neon nuevo específico para staging:

1. Neon Console → New Project
2. Nombre: `pineda-staging` (o similar)
3. Región: `us-east-1` (misma que producción para latencia)
4. Copiar `DATABASE_URL`
5. Configurar en Vercel Preview

**Ventaja:** aislamiento total de producción.

### 2.3 Recomendación

**Opción A (branch)** es más rápida y ligera. Si el volumen de staging lo justifica, **Opción B** da más aislamiento.

---

## 3. Variables de entorno necesarias en staging (Vercel Preview)

### 3.1 Obligatorias para que el MVP SGIE funcione

| Variable | ¿Dónde? | Propósito | Cómo obtenerla |
|---|---|---|---|
| `DATABASE_URL` | Vercel Preview | Conexión a DB staging Neon | Copiar del branch/proyecto Neon staging |
| `BLOB_READ_WRITE_TOKEN` | Vercel Preview | Vercel Blob privado para docs | Vercel Dashboard → Storage → Blob → token |
| `RESEND_API_KEY` | Vercel Preview | Emails (solicitudes, recordatorios) | Resend Dashboard → API Keys |
| `CRON_SECRET` | Vercel Preview | Protege `/api/cron/sgie/procesar` | **Generar nuevo** (ver sección 4) |
| `JWT_SECRET` | Vercel Preview | Autenticación intranet | Generar nuevo (`openssl rand -hex 32`) |

### 3.2 Opcionales (el sistema degrada sin ellas)

| Variable | Sin ella |
|---|---|
| `IA_DOCUMENTAL_MODE=ai` + `IA_DOCUMENTAL_API_KEY` | IA no analiza; readiness: `unknown blocking` → bloquea `listo_para_revision` |
| `OCR_PROVIDER` | OCR es stub; docs escaneados quedan `ocr_pendiente` |
| `RESEND_FROM_EMAIL` | Usa dominio verificado por defecto |

### 3.3 NO configurar en staging

- `ENABLE_INDEXNOW_SUBMIT=true` — solo en producción
- `GOOGLE_*` (SEO/Analytics) — solo en producción para no contaminar métricas
- Webhooks de producción (Resend inbound, WhatsApp)

---

## 4. Configuración de `CRON_SECRET`

### 4.1 Generar (ejecutar una vez, no commitear el valor)

```bash
openssl rand -hex 32
# Ejemplo de salida (NO USAR ESTE): a1b2c3d4e5f6...
```

### 4.2 Configurar

1. Vercel Dashboard → proyecto → Settings → Environment Variables
2. Seleccionar entorno: **Preview** (NO Production)
3. Key: `CRON_SECRET`
4. Value: el valor generado
5. Marcar "Sensitive" (no se mostrará en logs)
6. Guardar

### 4.3 Verificar

```bash
# Sin secret → debe devolver 401
curl -X GET https://<staging-url>/api/cron/sgie/procesar
# → {"error":"No autorizado"}

# Con secret → debe devolver 200
curl -X GET -H "Authorization: Bearer <CRON_SECRET>" https://<staging-url>/api/cron/sgie/procesar
# → {"ok":true, "procesados":0, ...}
```

---

## 5. Migraciones — comandos seguros

### 5.1 Checklist antes de migrar

- [ ] `DATABASE_URL` apunta **inequívocamente** a la DB staging (NO producción)
- [ ] Confirmado viendo el nombre del branch en Neon Console (`staging`)
- [ ] `CRON_SECRET` configurado en Vercel Preview
- [ ] `BLOB_READ_WRITE_TOKEN` configurado (o aceptar fallback local)
- [ ] Backup/snapshot de la DB staging hecho (opcional pero recomendado)
- [ ] Código compilado y testedo localmente (`npm run build`, `npm run test`)

### 5.2 Aplicar migraciones

```bash
# 1. Verificar que la URL es staging
echo $DATABASE_URL | grep -q "staging" && echo "✓ staging" || echo "⚠ VERIFICAR"

# 2. Aplicar (0025 → 0029 en orden)
DATABASE_URL=<staging-url> npx drizzle-kit migrate

# 3. Verificar tablas nuevas
psql $STAGING_DB -c "
SELECT tablename FROM pg_tables 
WHERE tablename IN ('case_readiness_runs','case_readiness_checks','document_text_pages')
ORDER BY tablename;
"
# Debe devolver: case_readiness_checks, case_readiness_runs, document_text_pages

# 4. Verificar token_hash (NO token)
psql $STAGING_DB -c "
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name='enlaces_magicos' AND column_name IN ('token_hash','token');
"
# Debe mostrar: token_hash (sí), token (NO)

# 5. Verificar enums nuevos
psql $STAGING_DB -c "
SELECT e.enumlabel FROM pg_enum e 
JOIN pg_type t ON e.enumtypid = t.oid 
WHERE t.typname='expediente_estado' AND e.enumlabel IN ('listo_para_revision','devuelto_por_abogado','bloqueado_por_cliente');
"
# Debe mostrar los 3
```

---

## 6. Validaciones locales (pre-staging)

Ejecutar antes de desplegar a staging:

```bash
npx tsc --noEmit         # TypeScript
npm run lint              # ESLint
npm run test              # 861 tests
npm run build             # build + postbuild
git status                # verificar que app/(public) intacto
```

---

## 7. Criterios para permitir migraciones en staging

| Criterio | ¿Cumplido? |
|---|---|
| `DATABASE_URL` confirmado como staging (branch `staging` en Neon) | 🚫 No |
| `CRON_SECRET` configurado en Vercel Preview | 🚫 No |
| `BLOB_READ_WRITE_TOKEN` disponible | ✅ Local |
| Código compila y tests pasan | ✅ |
| Web pública intacta | ✅ |
| Migraciones generadas y en orden | ✅ |

**Las migraciones NO se aplican** hasta que los dos primeros criterios estén en verde.

---

## 8. Criterios para ejecutar E2E en staging

1. Migraciones aplicadas (sección 5.2).
2. `CRON_SECRET` configurado y verificado (sección 4.3).
3. Al menos un usuario (abogado/admin) creado en la DB staging.
4. Al menos un tipo de procedimiento (seed `drizzle/seed-sgie-procedimientos.ts`).
5. Cliente ficticio y expediente ficticio creados.
6. Documento PDF digital de prueba (anonimizado).
7. Flujo E2E según `docs/implementation/staging-validacion-e2e-mvp-sgie.md` sección 7.

---

## 9. Riesgos pendientes

1. 🚫 **No existe DB staging** — hay que crearla (branch Neon o proyecto nuevo).
2. 🚫 **`CRON_SECRET` ausente** — sin él, cron no funciona.
3. ⚠ **Una sola DB Neon** — el proyecto actual tiene una sola base; migrar sin crear staging podría afectar el entorno compartido.
4. ⚠ **Seed de datos staging** — se necesitan datos anonimizados para E2E (clientes, expedientes, documentos).
5. ⚠ **Vercel Preview vs Development** — verificar qué entorno de Vercel se usa para staging (Preview recomendado).

---

## 10. Resumen: ¿listo para migrar staging?

**No.** Staging no existe como entorno separado. Hay que:

1. **Crear DB staging en Neon** (branch `staging` o proyecto nuevo) — 5 minutos.
2. **Configurar `CRON_SECRET`** en Vercel Preview — 2 minutos.
3. **Configurar `DATABASE_URL`** de staging en Vercel Preview — 1 minuto.
4. **Aplicar migraciones 0025–0029** — 30 segundos.
5. **Ejecutar E2E** — 15-30 minutos.

Tiempo total estimado para tener staging operativo: **~30 minutos** (mayormente operaciones de configuración en Neon y Vercel).

**El código está listo.** El bloqueo es 100% de infraestructura, no de código.
