# Fase 3 MVP — extracción documental, OCR y revisión asistente

**Fecha:** 9 de julio de 2026
**Base documental:** Fase 1 y Fase 2 (`docs/implementation/mvp-fase-1*` y `mvp-fase-2*`), auditoría y estudios de `docs/architecture/` y `docs/strategy/`.
**Carácter:** técnico y accionable. Sin IA (DeepSeek), sin OCR real todavía, sin SEJE, sin retención automatizada, sin tocar la web pública por esta fase.

---

## 1. Objetivo de la Fase 3

Crear el pipeline técnico de extracción documental: transformar documentos subidos en **texto estructurado y revisable por página**, con detección de escaneos, abstracción de OCR externo (stub por defecto), actualización de estados, auditoría del proceso y una vista mínima para que el asistente revise documentos extraídos o fallidos. **Sin IA de clasificación LLM.**

## 2. Qué ya existía (no rehecho)

El pipeline de extracción **ya estaba implementado** en `lib/sgie/motor-documental.ts`:
- `extraerTextoDePdf` (pdfjs-dist, por página, detecta `vacio`).
- `procesarDocumento` (cache por hash, marca `clasificando`, extrae, clasifica heurísticamente, imágenes → `clasificado`/`pendiente_abogado`, errores → `ilegible`, guarda en `metadata` y `extracciones_ia`).
- `procesarJobsPendientes` (runner idempotente: reclama/completa/falla, batch limit).
- `descargarBlob` (token + fallback dev).
- Cron ya lo invocaba (`/api/cron/sgie/procesar`).
- Enum `documento_estado` ya incluía: `texto_extraido`, `ocr_pendiente`, `ilegible`, `clasificando`, `clasificado`, `pendiente_abogado`.

## 3. Qué se implementó en la Fase 3

### 3.1 Schema (`lib/schema.ts`) y migración 0027
- **Nueva tabla `document_text_pages`**: `id`, `documento_id` (FK cascade), `extraction_id` (FK→`extracciones_ia`, set null), `page_number`, `text`, `method` (pdf_text/ocr/manual), `confidence` (real), `created_at`. Unique por (documento, page_number).
- **Enum `auditoria_accion`**: añadidos `document_extraction_started`, `document_extraction_completed`, `document_extraction_failed`, `document_requires_ocr`, `document_extraction_retried`, `document_manual_reviewed`.
- Import añadido: `real` de `drizzle-orm/pg-core`.
- Migración `drizzle/migrations/0027_fase3_extraccion_paginas.sql` + journal idx 27.
- **No se rompen** 0025 ni 0026. **No se toca** `documento_estado` (ya tenía los equivalentes).

### 3.2 OCR — abstracción + stub (`lib/sgie/ocr/provider.ts`)
- Interfaz `OcrProvider { name, isConfigured(), processDocument(input) → OcrResult }`.
- `getOcrProvider()`: lee `OCR_PROVIDER` (default `'stub'`). **Stub** por defecto: `isConfigured()===false`, `processDocument()` devuelve `{success:false}`. **Nunca inventa texto.**
- Provider real futuro (google/aws/azure) configurable por entorno, **sin instalar dependencias ahora**.

### 3.3 Motor documental (`lib/sgie/motor-documental.ts`) — extensiones
- `extraerTextoDePdf` ahora devuelve también `pages: PaginaExtraida[]`.
- **Guardado por página**: tras extracción exitosa, inserta filas en `document_text_pages` vinculadas a la `extracciones_ia` creada (limpia páginas previas en reintento).
- **OCR integrado**: cuando el PDF queda `vacio` o es imagen, llama a `getOcrProvider()`. Si está configurado → procesa y guarda páginas OCR; si es stub → mantiene `ocr_pendiente` + auditoría `document_requires_ocr`.
- **Auditoría específica**: `auditarExtraccion()` registra inicio/completado/fallo/ocr con `logSgie` (sin texto sensible; solo metadatos). Helper `sanitizarError()`.

### 3.4 Rutas API internas (auth `requireAbogado` + CSRF + rate limit + scope)
- `POST /api/sgie/documentos/[id]/extraccion/reintentar` — limpia páginas, fuerza `subido`, crea job, audita `document_extraction_retried`.
- `POST /api/sgie/documentos/[id]/extraccion/revisar` — marca `revisado` (→`aprobado`) o `requiere_nuevo_archivo` (→`incorrecto`), audita `document_manual_reviewed`.
- `GET  /api/sgie/documentos/[id]/extraccion` — estado, método, páginas (texto por página), error, confianza.
- `GET /api/sgie/documentos?requiereRevision=1` — listado de documentos en `ocr_pendiente`/`ilegible`/`pendiente_abogado`/`incorrecto`.

### 3.5 Vista asistente
- `components/sgie/extraccion-documento.tsx` (panel `ExtraccionDocumento`): estado, método, páginas, confianza, error, aviso de OCR, acciones (reintentar, marcar revisado, requerir nuevo archivo), texto por página colapsable.
- Integrado en `components/sgie/documento-preview.tsx` (el modal de preview existente), para que el asistente vea extracción + acciones al abrir un documento. **Sin rediseño**; usa el design system.

## 4. Tablas/campos/migraciones añadidas
- **Tabla nueva**: `document_text_pages`.
- **Enum**: 6 valores nuevos en `auditoria_accion`.
- **Migración**: `0027_fase3_extraccion_paginas.sql`.
- Sin cambios en `documento_estado` (reutilizado).

## 5. Cómo funciona el pipeline
1. Upload (Fase 1) encola job `extraccion_texto`.
2. Cron `/api/cron/sgie/procesar` (CRON_SECRET) → `procesarJobsPendientes` → `procesarDocumento`.
3. `procesarDocumento`: cache por hash → marca `clasificando` + audita inicio → descarga Blob → extrae PDF por página.
   - Texto suficiente → `texto_extraido` + guarda páginas + audita completado.
   - Sin texto → intenta OCR; si stub → `ocr_pendiente` + audita `document_requires_ocr`.
   - Error → `ilegible` + audita fallo.
4. Asistente ve extracción en el modal de preview; puede reintentar o revisar.

## 6. Decisión OCR
**Abstracción + stub por defecto.** Sin OCR real, el documento queda `ocr_pendiente` (estado claro, sin inventar texto). Provider real futuro configurable por `OCR_PROVIDER`, sin dependencias pesadas ahora.

## 7. Variables necesarias
- `DATABASE_URL` (Neon), `BLOB_READ_WRITE_TOKEN` (Blob privado), `CRON_SECRET` (cron).
- `OCR_PROVIDER` (opcional, default `stub`) + `OCR_*` credenciales cuando se active un proveedor real.
- `RESEND_API_KEY` (no usado en Fase 3, pero heredado).

## 8. Eventos de auditoría garantizados
`document_extraction_started`, `document_extraction_completed`, `document_extraction_failed`, `document_requires_ocr`, `document_extraction_retried`, `document_manual_reviewed`. **Sin texto sensible** (solo documentoId, expedienteId, método, páginas, error sanitizado).

## 9. Límites serverless / batch
- `procesarJobsPendientes(limite=5)` (LOTE_MAX del cron). Documentos pesados se procesan en el job, no en el request de upload.
- OCR (cuando esté activo) corre en el job; el stub no añade coste.

## 10. Resultado de pruebas (9 jul 2026)
| Comando | Resultado |
|---|---|
| `npx tsc --noEmit` | ✅ 0 errores |
| `npm run lint` | ✅ 0 errores, 0 warnings |
| `npm run test` | ✅ 828 tests, 39 archivos (incluye 12 nuevos de extracción) |
| `npm run build` | ✅ build + postbuild correctos |

## 11. git status — alcance de los cambios de Fase 3
Archivos modificados/nuevos **por la Fase 3** (backend SGIE + schema + componentes SGIE):
- Modificados: `lib/schema.ts`, `lib/sgie/motor-documental.ts`, `app/api/sgie/documentos/route.ts`, `components/sgie/documento-preview.tsx`, `drizzle/migrations/meta/_journal.json`.
- Nuevos: `lib/sgie/ocr/provider.ts`, `app/api/sgie/documentos/[id]/extraccion/` (reintentar, revisar, GET), `components/sgie/extraccion-documento.tsx`, `drizzle/migrations/0027_*.sql`, `tests/sgie-extraccion-documental.test.ts`.

> **⚠ Aviso de working tree:** `git status` muestra además otros archivos modificados ajenos a la Fase 3 (`.env.example`, `CHANGELOG.md`, `README.md`, `package.json`, `lib/email.ts`, `components/analytics-scripts.tsx`, scripts SEO, reportes SEO y `app/(public)/hondurenos-en-espana/page.tsx`). **Estos cambios son previos a esta fase y no fueron realizados por la Fase 3.** La Fase 3 no ha tocado `app/(public)/**`; el cambio en `hondurenos-en-espana/page.tsx` es un edit de metadatos SEO preexistente.

## 12. Riesgos pendientes
- **Aplicar migraciones 0025–0027 en staging/producción** (`drizzle-kit migrate`) — generadas, no aplicadas.
- **OCR real sin configurar**: los escaneos/imágenes quedan `ocr_pendiente` hasta activar un proveedor (documentado).
- **Integración E2E con Blob + pdfjs real** no cubierta por unitarios (depende de entorno); pendiente de validar con documentos reales anonimizados en staging.
- **`CRON_SECRET` y `BLOB_READ_WRITE_TOKEN`** deben configurarse en staging.
- **Schedule del cron** en Vercel (el endpoint existe; falta programar la periodicidad).

## 13. Qué queda para Fase 4
- IA (DeepSeek) para clasificación/extracción de campos (nombres, RTN, fechas, juzgado) sobre el texto ya extraído.
- Resumen ejecutivo del expediente.
- Verificación documento-expediente con IA (matriz de coincidencias y score).
- Todo sobre el texto extraído en `document_text_pages` (base lista en Fase 3).

## 14. Criterio — Fase 3 cerrada
**Sí, a nivel de código.** Cumple: job `extraccion_texto` procesado por cron; PDF digital con texto → `texto_extraido` + páginas guardadas; PDF escaneado/imagen → `ocr_pendiente` (stub) o procesado si OCR real; error → `ilegible` con reintento; asistente ve estado/texto/error en SGIE; texto no en portal público; auditoría de inicio/éxito/fallo/ocr/revisión sin texto sensible; sin DeepSeek/IA; lint/tsc/test/build verde.

**Pendiente de operación**: aplicar migraciones en staging, configurar OCR provider si se quiere procesar escaneos, y validar E2E con documentos reales anonimizados.
