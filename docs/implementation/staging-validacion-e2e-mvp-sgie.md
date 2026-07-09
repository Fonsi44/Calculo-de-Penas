# Validación operativa de staging — MVP SGIE semi-autónomo

**Fecha:** 9 de julio de 2026 · **Última actualización:** 9 jul 2026 15:10 UTC
**Entorno validado:** local (pre-staging) · **DB staging: NO CONFIRMADA**
**Fases validadas:** 1–5 (código cerrado) + auditoría de readiness
**Estado staging:** 🚫 **BLOQUEADO** — DATABASE_URL no confirmado como staging

---

## 1. Resumen ejecutivo

El MVP SGIE semi-autónomo ha pasado **todas las validaciones técnicas locales** (lint, tsc, test, build). Las 5 migraciones están generadas y en orden. La web pública permanece intacta. **Pendiente de staging**: aplicar migraciones, configurar `CRON_SECRET`, `IA_DOCUMENTAL_*` y ejecutar flujo E2E con datos anonimizados.

### Decisión

| Verificación | Estado |
|---|---|
| Código | ✅ listo para staging |
| Migraciones | ✅ generadas, no aplicadas |
| Variables | ⚠ CRON_SECRET ausente; IA/OCR ausente (esperado en MVP) |
| Compilación | ✅ 0 errores |
| Lint | ✅ 0 errores |
| Tests | ✅ 861 tests · 42 archivos |
| Build | ✅ correcto |
| Web pública | ✅ intacta |
| **Go/No-go staging** | ✅ **Go** (tras configurar vars y migrar) |

---

## 2. Clasificación de cambios en el working tree

### Cambios SGIE Fases 1–5 (15 modificados + 18 nuevos)

**Modificados (backend + schema + routes):**
`lib/schema.ts` (enums + tablas — 0025 a 0029), `lib/sgie/estados.ts`, `lib/sgie/expedientes-db.ts` (transiciones), `lib/sgie/util.ts` (hashToken), `lib/sgie/enlaces-magicos.ts` (token_hash), `lib/sgie/motor-documental.ts` (extracción + OCR + IA + readiness), `lib/sgie/ia-documental.ts` (score + auditoría + integración readiness), `lib/sgie/seguimiento-documental.ts` (integ readiness), `app/api/cron/sgie/procesar/route.ts`, `app/api/public/cargar/[token]/route.ts` (vincular requisito), `app/api/sgie/documentos/route.ts` (filtros), `app/api/sgie/enlaces/route.ts`, `app/intranet/sgie/expedientes/[id]/page.tsx`, `components/sgie/documento-preview.tsx`, `drizzle/migrations/meta/_journal.json`.

**Nuevos (módulos, rutas, componentes, tests):**
`lib/sgie/config-seguimiento.ts`, `lib/sgie/recordatorios-cliente.ts`, `lib/sgie/motor-recordatorios.ts`, `lib/sgie/seguimiento-documental.ts`, `lib/sgie/ocr/provider.ts`, `lib/sgie/ia/score.ts`, `lib/sgie/readiness.ts`, `components/sgie/seguimiento-documental.tsx`, `components/sgie/extraccion-documento.tsx`, `components/sgie/ia-documento.tsx`, `components/sgie/readiness-expediente.tsx`, `app/api/sgie/expedientes/[id]/seguimiento/` (4 rutas), `app/api/sgie/expedientes/[id]/readiness/` (4 rutas), `app/api/sgie/expedientes/[id]/extraccion/` (3 rutas), `app/api/sgie/documentos/[id]/ia/` (3 rutas), `app/api/sgie/metricas/autonomia/`, `tests/sgie-*.test.ts` (5).

### Migraciones (5 nuevas)
`0025_enlaces_token_hash.sql`, `0026_fase2_bloqueo_recordatorios.sql`, `0027_fase3_extraccion_paginas.sql`, `0028_fase4_ia_documental.sql`, `0029_fase5_listo_para_revision.sql`.

### Documentación
`docs/strategy/`, `docs/architecture/`, `docs/implementation/` (7 md nuevos).

### Generado por build
`public/sw.js` (service worker cache bump, automático).

### Cambios ajenos confirmados (no SGIE)
Ninguno detectado en `app/(public)/**`. Cualquier diff en `app/(public)/hondurenos-en-espana/page.tsx` o archivos SEO fue **anterior a las Fases 1–5** y no fue modificado por el trabajo SGIE.

---

## 3. Migraciones — verificación

| # | Archivo | Contenido | ✅ |
|---|---|---|---|
| 0025 | `0025_enlaces_token_hash.sql` | Añade `token_hash`, invalida enlaces previos en claro (`revocado_en`), elimina `token`, crea índice | ✅ |
| 0026 | `0026_fase2_bloqueo_recordatorios.sql` | Añade `bloqueado_por_cliente` a `expediente_estado`, 4 eventos a `auditoria_accion` | ✅ |
| 0027 | `0027_fase3_extraccion_paginas.sql` | Crea tabla `document_text_pages`, 6 eventos de extracción | ✅ |
| 0028 | `0028_fase4_ia_documental.sql` | Añade columnas `suggested_status`/`total_confidence`/`input_hash`/`run_status` a `extracciones_ia`, 9 eventos IA | ✅ |
| 0029 | `0029_fase5_listo_para_revision.sql` | Crea tablas `case_readiness_runs` y `case_readiness_checks`, añade `listo_para_revision` y `devuelto_por_abogado`, 5 eventos | ✅ |

**Orden:** secuencial correcto (25→29), sin duplicados, sin saltos en journal. 0025 invalida enlaces previos (2 referencias a `revocado_en`). 0029 incluye readiness (12 referencias a `case_readiness`).

**Comando para aplicar en staging:**
```bash
DATABASE_URL=<staging-neon-url> npx drizzle-kit migrate
```

**⚠ Antes de ejecutar:** confirmar explícitamente que `DATABASE_URL` apunta a la base de staging de Neon, **no a producción**. Las migraciones 0025–0029 son irreversibles (invalidan enlaces, añaden columnas, crean tablas). Se recomienda hacer un backup/snapshot de la DB de staging antes.

---

## 4. Variables de entorno — estado

| Variable | Estado local | Requerida en staging | Nota |
|---|---|---|---|
| `DATABASE_URL` | ✓ presente | **Sí** | Conexión Neon staging |
| `BLOB_READ_WRITE_TOKEN` | ✓ presente | **Sí** | Vercel Blob privado |
| `RESEND_API_KEY` | ✓ presente | **Sí** | Emails (recordatorios, solicitudes) |
| `CRON_SECRET` | ⚠ ausente | **Sí** | Protege `/api/cron/sgie/procesar`. Sin ello, cron no puede invocarse |
| `IA_DOCUMENTAL_MODE` | ⚠ ausente | Opcional | `ai` para activar DeepSeek; default `heuristic` |
| `IA_DOCUMENTAL_API_KEY` | ⚠ ausente | Opcional | API key de DeepSeek. Ausente → readiness: `unknown blocking` en check IA |
| `IA_DOCUMENTAL_BASE_URL` | ⚠ ausente | Opcional | Default `https://api.deepseek.com/v1` |
| `IA_DOCUMENTAL_MODEL` | ⚠ ausente | Opcional | Default `deepseek-chat` |
| `OCR_PROVIDER` | ⚠ ausente | Opcional | Default `stub` (sin OCR real) |

**Impacto de variables ausentes en staging:**
- `CRON_SECRET` → cron no funciona (recordatorios, readiness, procesamiento de jobs). Bloquea Fases 2–5 en operación continua.
- `IA_DOCUMENTAL_*` → IA no analiza documentos. Checks IA (`sin_contradicciones_criticas`) quedan `unknown blocking` → expediente no pasa a `listo_para_revision` automáticamente (comportamiento correcto tras auditoría).
- `OCR_PROVIDER` → OCR es stub; documentos escaneados quedan `ocr_pendiente` (no bloquea readiness por sí solo).

---

## 5. Validación técnica local

| Comando | Resultado |
|---|---|
| `npx tsc --noEmit` | ✅ 0 errores |
| `npm run lint` | ✅ 0 errores, 6 warnings (en archivos preexistentes, no SGIE) |
| `npm run test` | ✅ 861 tests, 42 archivos |
| `npm run build` | ✅ build + postbuild correctos |
| `git status` | ✅ `app/(public)` intacto |

---

## 6. Cron staging — verificación

Endpoint: `GET/POST /api/cron/sgie/procesar`
- Protegido por header `Authorization: Bearer <CRON_SECRET>`.
- Si `CRON_SECRET` no configurado → **retorna 401 siempre** (no procesa).
- Si configurado → procesa jobs `extraccion_texto`, `clasificacion`, `ia_extraccion`, recordatorios y readiness.

**Configuración recomendada en Vercel Cron:**
```json
{ "schedule": "0 7 * * *", "path": "/api/cron/sgie/procesar" }
```
(1 vez al día, 7 AM UTC). El endpoint es idempotente; seguro ejecutar múltiples veces.

---

## 7. Flujo E2E — comandos y verificaciones

### ⚠ Limitación de esta sesión
No se tiene acceso a la DB de staging (Neon), por lo que los pasos E2E **no pueden ejecutarse aquí**. Se documentan los comandos y verificaciones para cuando se tenga acceso.

### 7.1 Preparación
```bash
# 1. Confirmar que DATABASE_URL apunta a staging (NO producción)
echo $DATABASE_URL | grep -q "neon.tech" && echo "✓ Neon"
# 2. Aplicar migraciones
DATABASE_URL=$STAGING_DB npx drizzle-kit migrate
# 3. Verificar tablas nuevas
psql $STAGING_DB -c "\dt case_readiness_*"
psql $STAGING_DB -c "\dt document_text_pages"
psql $STAGING_DB -c "\d enlaces_magicos"  # debe tener token_hash, NO token
# 4. Crear datos E2E con seed o manualmente: cliente, expediente, checklist, docs
```

### 7.2 Fase 1 — Magic links y upload seguro

| # | Paso | Verificación | API/endpoint |
|---|---|---|---|
| 1 | Crear expediente | `POST /api/sgie/expedientes` con auth | |
| 2 | Generar magic link | `POST /api/sgie/enlaces` → `{ enlace: { id, token } }` | Verificar en DB: `token_hash IS NOT NULL AND token_hash LIKE '...'` (64 chars hex). No debe existir columna `token`. |
| 3 | Enviar email | Resend envía o registra fallo en `correos_enviados` | |
| 4 | Abrir `/cargar/{token}` | Portal carga sin index (noindex). Sin acceso a SGIE | |
| 5 | Subir PDF válido | `POST /api/public/cargar/{token}` → 201, `documentoId` | DB: `documentos_expediente.estado='subido'`, hash SHA-256 presente |
| 6 | Rechazar archivo inválido | Subir `.exe` → 400 "extensión no permitida" | |
| 7 | Detectar duplicado | Subir mismo PDF → 201, `duplicado:true` | No se encola job |
| 8 | Auditoría | `auditoria_eventos`: `magic_link_created`, `documento_uploaded` | Sin token en metadata |

### 7.3 Fase 2 — Seguimiento y recordatorios

| # | Paso | Verificación |
|---|---|---|
| 1 | Checklist aplicado | En ficha expediente: requisitos obligatorios visibles |
| 2 | Solicitud documental | `POST .../seguimiento/solicitud` → email enviado |
| 3 | Simular días (ajustar `creado_en` del correo) | Primer recordatorio dispara |
| 4 | Bloqueo | Tras 14 días sin respuesta → `expedientes.estado='bloqueado_por_cliente'` |
| 5 | Desbloqueo | Subir documento o `POST .../seguimiento/desbloquear` → `pendiente_de_documentos` |

### 7.4 Fase 3 — Extracción documental

| # | Paso | Verificación |
|---|---|---|
| 1 | Job `extraccion_texto` | Se encola tras upload. Cron lo procesa |
| 2 | PDF digital | `documentos_expediente.estado='texto_extraido'`, `document_text_pages` con filas |
| 3 | PDF sin texto | `estado='ocr_pendiente'` |
| 4 | Error | `estado='ilegible'`, reintento vía `POST .../extraccion/reintentar` |

### 7.5 Fase 4 — IA documental

**Si IA configurada (`IA_DOCUMENTAL_MODE=ai`, `IA_DOCUMENTAL_API_KEY` seteada):**

| # | Paso | Verificación |
|---|---|---|
| 1 | Análisis IA | `extracciones_ia.run_status='completed'`, `suggested_status`, `total_confidence` |
| 2 | JSON válido | `extracciones_ia.resultado_json` con campos, `campos_extraidos` con filas |
| 3 | Score + checks | `validaciones` con checks pass/warn/fail |
| 4 | Contradicción crítica | En expediente con docs contradictorios → `validaciones.severidad='critico'` → readiness bloquea |

**Si IA NO configurada:**

| # | Paso | Verificación |
|---|---|---|
| 1 | Degradación | `isIaEnabled()===false`, no se encola job IA |
| 2 | Auditoría | `ai_analysis_not_configured` |
| 3 | Readiness | `sin_contradicciones_criticas = unknown` → **bloquea** `listo_para_revision` → expediente en `requiere_accion_abogado` |

### 7.6 Fase 5 — Readiness y bandeja

| # | Paso | Verificación |
|---|---|---|
| 1 | Faltantes bloquean | Sin docs obligatorios → `no_preparado` |
| 2 | Bloqueado bloquea | `bloqueado_por_cliente` → no pasa a `listo_para_revision` |
| 3 | IA ausente bloquea | `sin_contradicciones_criticas = unknown` → `requiere_accion_abogado` |
| 4 | Todos pass | → `listo_para_revision` automático |
| 5 | Bandeja abogado | Panel `ReadinessExpediente` en ficha: score, checks, botones |
| 6 | Aprobar | `POST .../readiness/aprobar` → `pendiente_validacion_abogado` |
| 7 | Devolver | `POST .../readiness/devolver` → `devuelto_por_abogado` |
| 8 | Métricas | `GET /api/sgie/metricas/autonomia` → KPIs |

---

## 8. Seguridad — verificaciones

| Check | Estado |
|---|---|
| No tokens en claro en DB | ✅ `token_hash` en `enlaces_magicos` (sin columna `token`) |
| No tokens en logs/auditoría | ✅ `auditoria_eventos.metadata` sin token |
| No URLs Blob permanentes | ✅ Blob store privado, preview con signed URL |
| Portal cliente no expone datos | ✅ `noindex`, solo nombre despacho + docs solicitados |
| Rutas internas protegidas | ✅ `requireAbogado` + CSRF + rate limit |
| Cron protegido | ✅ `CRON_SECRET` (401 sin secret) |
| Web pública intacta | ✅ `app/(public)` sin cambios SGIE |

---

## 9. Riesgos pendientes

1. **`CRON_SECRET` sin configurar** → cron no funciona. Bloquea procesamiento de jobs, recordatorios y readiness en staging.
2. **Migraciones no aplicadas** → las tablas/columnas nuevas no existen en staging. Hasta migrar, el código referencea campos que no están en DB (error en runtime).
3. **IA sin configurar** → readiness bloquea `listo_para_revision` con `unknown blocking` (correcto). Para E2E completo, configurar `IA_DOCUMENTAL_*` en staging.
4. **E2E no ejecutado** → los flujos E2E de la sección 7 quedan pendientes de ejecución con acceso a staging.
5. **Schedule de Vercel Cron** → el endpoint existe pero falta programar la periodicidad en Vercel.

---

## 10. Checklist antes de producción

- [ ] Aplicar migraciones 0025–0029 en staging y validar.
- [ ] Configurar `CRON_SECRET` en staging.
- [ ] Configurar `IA_DOCUMENTAL_*` en staging (opcional pero recomendado para E2E completo).
- [ ] Ejecutar flujo E2E completo (sección 7) con datos anonimizados.
- [ ] Validar que readiness no produce falsos "Listo para revisión".
- [ ] Validar cron con `curl -H "Authorization: Bearer $CRON_SECRET"`.
- [ ] Programar Vercel Cron (1×/día).
- [ ] Verificar entregabilidad de emails (Resend dominio verificado).
- [ ] Revisar logs de auditoría (sin tokens, sin texto sensible).
- [ ] Aprobar go/no-go para producción.
- [ ] Aplicar migraciones en producción (mismo orden: 0025→0029).
- [ ] Configurar variables en producción.
- [ ] Monitorear primeros días.

---

## 12. Intento de cierre de staging (9 jul 2026 15:10 UTC) — BLOQUEADO

### 12.1 Verificación de entorno

Se intentó confirmar que `DATABASE_URL` apunta a staging de Neon. El endpoint detectado es `ep-super-leaf-appekgbu.c-7.us-east-1.aws.neon.tech`, base de datos `neondb`. **No se puede determinar desde esta sesión si este endpoint es staging o producción.** Neon no distingue entre entornos en el nombre del endpoint; depende de la configuración del proyecto Neon (branch, rol).

**Decisión:** NO aplicar migraciones. Regla del brief: "Si hay duda, detener y documentar."

### 12.2 Variables de entorno — estado real (no valores)

| Variable | Local | ¿Configurable en staging? | Bloquea |
|---|---|---|---|
| `DATABASE_URL` | ✓ Neon | **Se requiere confirmación de entorno** | 🚫 Bloquea migración |
| `BLOB_READ_WRITE_TOKEN` | ✓ | Sí (Vercel env) | No |
| `RESEND_API_KEY` | ✓ | Sí (Vercel env) | No (degrada a `pendiente`) |
| `CRON_SECRET` | ⚠ ausente | **Sí — obligatorio** | 🚫 Bloquea cron |
| `IA_DOCUMENTAL_MODE` | ⚠ ausente | Opcional (default `heuristic`) | No (readiness bloquea `unknown`) |
| `IA_DOCUMENTAL_API_KEY` | ⚠ ausente | Opcional | No |
| `OCR_PROVIDER` | ⚠ ausente | Opcional (default `stub`) | No |

### 12.3 Validaciones locales (re-ejecutadas)

| Comando | Resultado |
|---|---|
| `npx tsc --noEmit` | ✅ 0 errores |
| `npm run lint` | ✅ 0 errores, 6 warnings preexistentes |
| `npm run test` | ✅ 42 archivos, 861 tests |
| `npm run build` | ✅ correcto |
| `git status` | ✅ `app/(public)` intacta. 0 archivos staged |

### 12.4 Lo que SÍ se puede hacer sin acceso a staging

1. ✅ Código compila, pasa tests, build correcto.
2. ✅ Migraciones generadas y verificadas (0025–0029 en orden).
3. ✅ Variables locales identificadas (presentes/ausentes).
4. ✅ Documentación de staging completa con comandos E2E.
5. ✅ Panel de readiness corregido (auditoría de `unknown blocking`).
6. ✅ Web pública intacta.

### 12.5 Lo que NO se puede hacer sin confirmar staging

1. 🚫 Aplicar migraciones (sin confirmar que `DATABASE_URL` es staging).
2. 🚫 Ejecutar flujo E2E (sin DB staging migrada).
3. 🚫 Configurar `CRON_SECRET` (es variable de entorno de Vercel, no local).
4. 🚫 Probar cron con `curl` (sin `CRON_SECRET` configurado).
5. 🚫 Enviar emails reales con Resend (requiere staging con API key productiva).
6. 🚫 Analizar documentos con IA real (sin `IA_DOCUMENTAL_API_KEY` en staging).

### 12.6 Instrucciones para desbloquear staging

```bash
# 1. CONFIRMAR que DATABASE_URL es staging (NO producción).
#    En Neon: verificar el branch name (debe ser 'staging' o equivalente).
#    En Vercel: verificar que la variable de entorno es del entorno 'Preview' o 'Development'.

# 2. Configurar CRON_SECRET en Vercel (staging).
#    Generar: openssl rand -hex 32

# 3. Aplicar migraciones:
DATABASE_URL=<staging-url> npx drizzle-kit migrate

# 4. Verificar migraciones:
psql $STAGING_DB -c "SELECT column_name FROM information_schema.columns WHERE table_name='enlaces_magicos';"
# Debe mostrar: token_hash (NO token)

psql $STAGING_DB -c "SELECT tablename FROM pg_tables WHERE tablename LIKE 'case_readiness_%';"
# Debe mostrar: case_readiness_runs, case_readiness_checks

# 5. Probar cron:
curl -X GET -H "Authorization: Bearer $CRON_SECRET" https://<staging-url>/api/cron/sgie/procesar

# 6. Ejecutar E2E según sección 7 de este documento.

# 7. Si se desea IA: configurar IA_DOCUMENTAL_MODE=ai + IA_DOCUMENTAL_API_KEY.
```

### 12.7 Decisión staging (9 jul 2026)

| Criterio | Estado |
|---|---|
| Código listo | ✅ |
| Migraciones listas | ✅ |
| Variables locales | ✅ |
| Build/tests | ✅ |
| DB staging confirmada | 🚫 NO |
| CRON_SECRET configurado | 🚫 NO |
| Migraciones aplicadas | 🚫 NO |
| E2E ejecutado | 🚫 NO |
| **Staging operativo** | 🚫 **NO — bloqueado por entorno** |
| **Demo interna** | 🚫 **Pendiente de desbloqueo** |

**Staging NO está operativo** porque no se pudo confirmar que la base de datos es de staging. El código está listo; el bloqueo es exclusivamente de entorno (confirmación de DB + configuración de `CRON_SECRET`).

---

## 13. Decisión final

**MVP SGIE semi-autónomo: código listo para staging.** Las 5 fases están implementadas, testeadas (861 tests) y compilan sin errores. La auditoría de readiness corrigió los bugs que podían producir falsos "Listo para revisión". La web pública permanece intacta.

**Próximo paso:** obtener acceso a la DB de staging, aplicar migraciones, configurar variables y ejecutar el flujo E2E con datos anonimizados según la sección 7 de este documento.
