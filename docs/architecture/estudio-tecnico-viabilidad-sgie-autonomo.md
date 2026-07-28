---
status: current
owner: engineering
created: 2026-07-28
last_reviewed: 2026-07-28
review_due: 2026-10-28
supersedes: null
superseded_by: null
---
# Estudio técnico de viabilidad SGIE semi-autónomo

**Fecha:** 9 de julio de 2026
**Base documental:**
- `docs/strategy/plan-maestro-mejora-sgie-admin-integracion.md` (visión funcional)
- `docs/strategy/especializacion-sgie-honduras-abogados.md` (especialización jurídica)

**Tipo de documento:** Técnico, arquitectónico y accionable. No implementa código, no modifica la web pública, no crea componentes UI.
**Inspección del repositorio realizada:** `package.json`, `lib/schema.ts` (67 tablas Drizzle), `lib/rag/config.ts` (RAG con pgvector). Este estudio se fundamenta en el stack real detectado, no en suposiciones.

---

## 1. Título

Estudio técnico de viabilidad SGIE semi-autónomo.

---

## 2. Objetivo

Este documento **traduce la visión funcional a una arquitectura técnica viable**. Toma los requisitos del SGIE semi-autónomo —preparar expedientes completos, gestionar la relación documental con el cliente, prevalidar con IA y escalar solo excepciones al abogado— y determina si el stack actual (Vercel + Neon + Resend + Blob + IA) es suficiente, qué componentes adicionales hacen falta y cómo deben encajar.

### 2.1 Stack detectado en el repositorio (base del estudio)

| Componente | Estado real en el repo | Evidencia |
|---|---|---|
| Next.js | `next@16.2.7` | `package.json` |
| Hosting | Vercel (serverless) | `@vercel/blob`, `@vercel/speed-insights` |
| Base de datos | Neon Postgres serverless | `@neondatabase/serverless` + `drizzle-orm` |
| Schema | 67 tablas Drizzle, **ninguna operativa de SGIE** (expedientes/clientes/documentos) | `lib/schema.ts` |
| Vectorial | pgvector habilitado, tabla `embeddings` | `vector` importado en `lib/schema.ts`, `lib/rag/` |
| Almacenamiento documental | Vercel Blob | `@vercel/blob@^2.4.1` |
| Emails | Resend | `resend@^6.12.4` |
| IA clientes | OpenAI + Google GenAI | `openai`, `@google/genai` |
| PDF | Extracción digital y generación | `pdfjs-dist`, `pdfkit`, `@react-pdf/renderer` |
| Auth/Sanitización | JWT, bcrypt, sanitize-html, Zod | `jsonwebtoken`, `bcryptjs`, `sanitize-html`, `zod` |
| **Cola de jobs** | **No presente** | sin Inngest/QStash/Trigger.dev |
| **OCR (escaneos)** | **No presente** | solo extracción de PDF digital |

**Conclusión inicial:** la base es sólida para el frontend/API/DB/emails/almacenamiento, pero faltan tres piezas críticas para la autonomía: **(1) modelo de datos SGIE**, **(2) cola de jobs duraderos**, **(3) OCR para documentos escaneados**. El resto del estudio detalla cómo cubrirlas.

---

## 3. Resumen ejecutivo de viabilidad

### 3.1 Veredicto por componente

| Componente | Clasificación | Comentario |
|---|---|---|
| Vercel (Next.js serverless) | **Viable ahora** (con matices) | Adecuado para UI y API; no para procesamiento pesado en request. |
| Neon Postgres | **Viable ahora** | Fuente de verdad de metadatos; **no** para blobs. |
| Resend | **Viable ahora** | Cubre solicitud, recordatorios, confirmaciones. |
| Vercel Blob / S3 / R2 | **Viable con ajustes** | Blob ya integrado; evaluar coste y límites vs S3/R2 para volumen. |
| DeepSeek V4 Flash | **Requiere validación técnica** | Modelo a confirmar para clasificación/extracción/resumen; verificar disponibilidad real del modelo y coste. |
| Jobs asíncronos / cron / cola | **Requiere validación técnica** | No existe cola hoy; Vercel Cron cubre parte, pero hace falta cola duradera. |
| Auditoría y permisos | **Viable con ajustes** | RBAC y auth ya existen; hay que extender a expedientes y acciones críticas. |
| OCR de escaneos | **No presente → requiere decisión** | No hay OCR; necesario para PDFs escaneados y fotos. |
| Integración SEJE / fuentes oficiales | **No recomendable en MVP** | Pendiente de validación jurídica/técnica; solo referencia manual. |

### 3.2 Clasificación global

- **Viable ahora:** frontend, API, DB de metadatos, emails, almacenamiento documental, auth/permisos base.
- **Viable con ajustes:** RBAC extendido por expediente, auditoría de acciones críticas, Vercel Blob en producción.
- **Requiere validación técnica:** modelo IA final (DeepSeek V4 Flash), cola de jobs, OCR, umbrales de confianza.
- **No recomendable en MVP:** integración automática con SEJE u otras fuentes oficiales, retención documental automatizada (pendiente de aprobación legal).

---

## 4. Arquitectura técnica propuesta

### A. Frontend / Intranet

- **Next.js 16 en Vercel** (App Router, serverless).
- **SGIE** (`/intranet/sgie/*`): área operativa privada.
- **Admin** (`/intranet/admin/*`): área de gobierno privada.
- **Portal de carga documental por enlace mágico**: página pública **técnica y aislada** de la web pública. No pertenece a `app/(public)/**`; es una ruta de servicio (p. ej. `/upload/[token]`) sin acceso a la intranet.

> **Aislamiento de la web pública:** la web pública (`app/(public)/**`) no se modifica. El portal de carga es una ruta de servicio independiente, no navegacional, sin impacto SEO ni visual en la web pública.

### B. Backend / API

Route Handlers (`app/api/...`) en serverless:

- **servicios de expedientes** (alta, estados, ficha judicial, bitácora);
- **servicios de documentos** (registro, versiones, descarga firmada);
- **servicios de tokens mágicos** (emisión, validación, revocación);
- **servicios de emails** (composición con plantillas, envío vía Resend, registro de eventos);
- **servicios de IA** (orquestación del pipeline documental, llamada al modelo, registro de confianza/fuentes);
- **servicios de auditoría** (registro inmutable de acciones críticas, consulta, exportación).

### C. Base de datos — Neon Postgres

Fuente de verdad de **metadatos**. Tablas operativas SGIE propuestas (hoy inexistentes): clientes, expedientes, documentos, solicitudes documentales, checklists, tokens mágicos, eventos, tareas, alertas, auditoría, jobs, resultados IA. (Detalle en sección 15.)

**Regla absoluta:** en Neon se guarda **metadato, hash y referencias**, nunca el binario del documento.

### D. Almacenamiento documental

- **Vercel Blob, S3 o Cloudflare R2** para los binarios.
- **No guardar PDFs pesados en Neon** (solo metadatos, hash y URLs internas).
- **Signed URLs** para upload/download con expiración corta.
- Control de **caducidad y permisos**; no exponer URLs permanentes públicas.

### E. Emails — Resend

- Solicitud documental, recordatorios escalonados, confirmación de recepción, solicitud de corrección, avisos internos.
- Plantillas versionadas y gobernadas desde Admin (sección 14 del plan maestro).

### F. Jobs asíncronos

- **Vercel Cron** para revisiones periódicas ligeras (recordatorios, expiraciones, detección de bloqueos).
- **Cola duradera** (Inngest, Upstash QStash o Trigger.dev) para jobs pesados: **no procesar documentos pesados dentro de una request normal** (límites serverless). **Pendiente de validación técnica** la elección final (sección 21).

### G. IA documental

- **DeepSeek V4 Flash** para análisis de texto extraído (clasificación, extracción, resumen, contradicciones). **Requiere validación técnica**: confirmar disponibilidad real del modelo, coste y calidad por caso de uso.
- Posible **DeepSeek V4 Pro** para casos complejos.
- **OCR/extracción previa** si el documento es escaneado (hoy inexistente).
- **Embeddings y búsqueda semántica** vía el RAG existente (`lib/rag/`, pgvector) si aplica para recuperación de contexto.

---

## 5. Flujo técnico de solicitud documental automática

Paso a paso (orquesta frontend, API, DB, Blob, Resend y jobs):

1. Se crea expediente (Neon: `cases`).
2. SGIE identifica tipo de expediente (`case_types`).
3. SGIE carga checklist desde Admin (`case_checklists`, `checklist_items`).
4. SGIE crea solicitudes documentales pendientes (`document_requests`).
5. SGIE genera enlace mágico (`magic_links`).
6. SGIE guarda **hash del token** en Neon (nunca el token en claro).
7. Resend envía email al cliente con el enlace.
8. Cliente abre el portal de carga (`/upload/[token]`).
9. El token se valida (hash, expiración, usos, scope).
10. Cliente sube documentos.
11. El archivo se guarda en Blob/S3 (signed URL de escritura).
12. Se registra el documento en Neon (`documents`: metadatos, hash, URL interna).
13. Se lanza un **job de procesamiento** (cola duradera).
14. SGIE confirma recepción (email + evento en bitácora).
15. SGIE actualiza el checklist.
16. SGIE decide si falta algo (comparación con checklist).
17. SGIE envía recordatorios si falta documentación (job periódico).
18. SGIE marca **“Listo para revisión”** solo si todo cumple (reglas + confianza IA ≥ umbral).

---

## 6. Diseño técnico del enlace mágico

- **Token aleatorio seguro** (alta entropía, p. ej. 32+ bytes, CSPRNG).
- **Guardar solo el hash** del token en Neon (bcrypt o argon2 para tokens sensibles, o SHA-256 si se acepta revocación inmediata; **Pendiente de validación técnica**).
- **Expiración** configurable por tipo de expediente.
- **Scope por expediente** (un enlace no abre otros expedientes).
- **Scope por documento solicitado** (opcional: solo ciertos items del checklist).
- **Límite de usos** (contador, decremento atómico).
- **Revocación** (estado del registro).
- **Email asociado** (para verificación visual y OTP).
- **IP / user-agent opcional** (logs, no como control estricto por NAT/CGNAT).
- **Logs de acceso** (apertura, subida, error).
- **No dar acceso al SGIE interno** (el token solo autoriza subida al portal).
- **Página pública técnica aislada de la web pública** (ruta de servicio, sin cabeceras de SEO indexable, `noindex`).
- **Protección contra subida masiva** (rate limit por token y por IP).
- **Validación de tipo MIME y tamaño** (allowlist de extensiones, tamaño máximo por archivo y por sesión).
- **OTP adicional para expedientes sensibles** (familia, penal): código de un solo uso al email o SMS.

---

## 7. Portal de carga documental para cliente

Vista funcional, **mínima y segura**, sin exponer la intranet ni la web pública:

- pantalla con **nombre del despacho** (identificación, no navegación);
- **lista de documentos solicitados** (del checklist del expediente);
- **estado de cada documento** (pendiente, recibido, rechazado, requiere corrección);
- botón **subir** por documento;
- **instrucciones** claras (formato, tamaño, legibilidad);
- **confirmación de recepción** tras subida;
- **aviso de caducidad** del enlace;
- **reemplazo de documento** si la política lo permite (antes de validación);
- **no mostrar información sensible innecesaria** (no filtrar datos del expediente más allá de lo estricto para la subida);
- **no permitir navegar por otros expedientes** (scope estricto por token).

---

## 8. Seguimiento automático del expediente

Estados técnicos y eventos que los cambian:

| Estado | Evento que lo dispara |
|---|---|
| `pendiente_documentacion` | alta de expediente con checklist |
| `solicitud_enviada` | creación del magic link + email enviado |
| `primer_recordatorio` | job de recordatorio tras X días sin recepción |
| `segundo_recordatorio` | job de recordatorio escalado |
| `bloqueado_por_cliente` | umbrales de inactividad superados |
| `documentacion_recibida` | recepción de todos los documentos obligatorios |
| `en_procesamiento` | job de pipeline documental en curso |
| `prevalidado_ia_reglas` | pipeline con confianza ≥ umbral y sin contradicciones |
| `requiere_revision_humana` | confianza < umbral o documento dudoso |
| `listo_para_revision` | expediente completo según definición por materia |
| `devuelto_por_abogado` | decisión del abogado con observaciones |
| `cerrado` | cierre del expediente |

### 8.1 Eventos que cambian el estado

- **Recepción de documento:** avanza de `solicitud_enviada`/`recordatorio` a `documentacion_recibida` si el checklist se completa, o mantiene pendencia si faltan obligatorios.
- **Inactividad:** job de detección de bloqueos mueve a `bloqueado_por_cliente` según configuración de Admin.
- **Resultado del pipeline:** `prevalidado_ia_reglas` o `requiere_revision_humana`.
- **Cumplimiento de la definición por materia:** `listo_para_revision` (regla compuesta, gobernada desde Admin).
- **Decisión del abogado:** `devuelto_por_abogado` (con motivo) o `cerrado`.

---

## 9. Motor de reglas

Cómo **Admin gobierna** la autonomía de SGIE (configuración versionada y auditada):

- **checklists por tipo de expediente** (qué documentos aplican a cada materia/tipo);
- **documentos obligatorios, condicionales y opcionales** (prioridad de cada ítem del checklist);
- **plazos de recordatorio** (días entre primer/segundo recordatorio, umbral de bloqueo);
- **reglas de escalado** (qué dispara la bandeja del abogado — sección 15 del plan maestro);
- **umbrales de confianza IA** (mínimo para prevalidar, mínimo para escalar);
- **plantillas de email** (versión activa por tipo de comunicación);
- **estados permitidos** (máquina de estados por tipo de expediente);
- **acciones que requieren abogado** (firme, cierre, decisión jurídica sensible).

El motor de reglas es **configurable, versionado y auditable**; cada cambio deja registro (autor, versión, fecha, diff).

---

## 10. Pipeline técnico de procesamiento documental

Pasos (ejecutados en un job de cola, no en request):

1. archivo recibido (referencia en Blob);
2. validación técnica (tipo, tamaño, integridad);
3. hash (deduplicación y trazabilidad);
4. extracción de texto (PDF digital con `pdfjs-dist`);
5. OCR si hace falta (escaneos — componente a decidir, sección 12);
6. normalización de texto;
7. análisis con DeepSeek V4 Flash;
8. extracción de campos (identidad, RTN, fechas, juzgado, etc.);
9. clasificación documental;
10. comparación con el checklist esperado;
11. comparación con los datos del expediente;
12. detección de contradicciones;
13. score de confianza;
14. estado sugerido (prevalidado / advertencia / revisión / rechazo);
15. registro en auditoría y en `ai_runs`/`ai_extractions`;
16. notificación o escalado según el estado sugerido.

---

## 11. Uso de DeepSeek V4 Flash

> **Nota de evidencia:** el repo usa clientes `openai` y `@google/genai`, y el RAG está parametrizado por `EMBEDDINGS_PROVEEDOR`. El uso de **DeepSeek V4 Flash como modelo principal es una propuesta**: su nombre exacto, disponibilidad y coste están **Pendientes de validación técnica**. El cliente `openai` es compatible con la API de DeepSeek vía `baseURL`, por lo que la integración es factible técnicamente sin cambiar de SDK.

Capacidades a evaluar:

- análisis de texto extraído;
- clasificación de documentos;
- extracción de nombres, fechas, RTN/identidad, número de expediente, juzgado, partes;
- resumen documental;
- detección de contradicciones;
- sugerencia de documentos faltantes;
- generación de resumen ejecutivo del expediente;
- generación de borradores de correo.

### 11.1 Límites (no negociables)

- DeepSeek **no debe aprobar jurídicamente**;
- **no debe firmar**;
- **no debe cerrar expedientes**;
- **no debe sustituir al abogado**;
- **no debe ser única fuente de verdad**;
- toda salida debe tener **confianza, fuentes y trazabilidad** (modelo, versión, prompt, entrada referenciada).

---

## 12. OCR y extracción de texto

Estado actual: `pdfjs-dist` cubre **PDF digital** (con capa de texto). **No hay OCR** para escaneos ni imágenes.

Opciones a evaluar (todas **Pendientes de validación técnica**):

- **extracción directa de PDF digital** — ya disponible (`pdfjs-dist`);
- **OCR para escaneos** — candidatos: Tesseract (on-prem, coste cero pero calidad limitada en español/Honduras), servicios cloud (Google Document AI, AWS Textract, Azure Document Intelligence) con mejor calidad y coste por página;
- **procesamiento de imágenes** (fotos de documentos): preprocesamiento (deskew, binarización) antes del OCR;
- **normalización de texto** (reconstrucción de estructura, limpieza);
- **fallback si el OCR falla**: marcar como `requiere_revision_humana` y escalar al asistente, **nunca** inventar texto.

**Criterio de elección (propuesta):** para un MVP, combinar `pdfjs-dist` (PDF digital) + un servicio cloud de OCR para escaneos (calidad/coste); validar con documentos reales anonimizados antes de fijar proveedor.

---

## 13. Verificación de correspondencia documento-expediente

Matriz de comprobación que decide el estado sugerido de cada documento:

| Campo | Origen esperado | Origen extraído |
|---|---|---|
| expediente esperado | `cases` | clasificación del documento |
| cliente esperado | `clients` | nombres detectados |
| identidad/RTN esperada | `clients` | RTN/identidad detectada |
| tipo documental esperado | `checklist_items` | clasificación IA |
| número de expediente judicial esperado | ficha judicial | texto detectado |
| materia | `case_types` | inferencia del documento |
| fecha | — | fecha detectada |
| partes | `cases` | nombres detectados |
| juzgado | ficha judicial | texto detectado |
| confianza IA | — | score del modelo |

### 13.1 Resultado de la verificación

- **aceptado / prevalidado** (coincidencia exacta, confianza ≥ umbral);
- **aceptado con advertencia** (coincidencia parcial, confianza media);
- **requiere corrección del cliente** (documento ilegible o claramente erróneo);
- **requiere revisión del asistente** (duda operativa, no jurídica);
- **requiere revisión del abogado** (contradicción o decisión jurídica);
- **rechazado** (no corresponde al expediente, tipo erróneo).

---

## 14. Seguridad y privacidad

- **RBAC por rol** (matriz del plan maestro, sección 8).
- **Permisos por expediente** (no solo por módulo).
- **Tokens mágicos hasheados**, con expiración y revocación.
- **Signed URLs** para upload/download; no exponer URLs permanentes.
- **Cifrado en tránsito** (TLS) y en reposo (Blob/Neon por defecto del proveedor).
- **Control de descarga** (autorización por usuario y expediente).
- **Logs** de acceso a documentos sensibles.
- **Auditoría** de acciones críticas.
- **Protección de datos sensibles** (familia, penal): marcas de confidencialidad y acceso restringido.
- **Límites por tamaño** de archivo y por sesión.
- **Antivirus/malware** como **recomendación** (scan de subidas) — **Pendiente de validación técnica**.
- **Backups** de Neon y Blob.
- **Política de retención** **pendiente de aprobación legal** (no automatizar eliminaciones).

---

## 15. Modelo de datos propuesto

Entidades a añadir al schema (`lib/schema.ts`). No implementa código; define propósito, campos principales y relaciones. Los nombres siguen la convención observada en el repo (Drizzle, snake_case en DB).

| Entidad | Propósito | Campos principales | Relaciones |
|---|---|---|---|
| `users` | identidad | id, email, rol, estado, último_acceso | → roles, audit_events |
| `roles` | catálogo de roles | id, nombre, permisos (jsonb) | ← users |
| `clients` | clientes | id, nombre/razón, identidad/RTN, contacto, estado | → cases |
| `cases` | expedientes | id, número_interno, número_judicial, materia, tipo, estado_sgie, estado_judicial, responsable, ficha_judicial (jsonb) | → clients, case_types, documents, tasks, alerts, case_timeline_events |
| `case_types` | tipos/materias | id, nombre, materia, definición_completa (jsonb) | → case_checklists |
| `case_checklists` | checklist por tipo | id, tipo_id, versión, estado | → checklist_items |
| `checklist_items` | ítems de checklist | id, checklist_id, documento, prioridad (oblig./cond./opc.) | → document_requests, documents |
| `document_requests` | solicitudes documentales | id, caso_id, ítem_id, estado, magic_link_id | → magic_links, documents |
| `documents` | documentos | id, caso_id, solicitud_id, tipo, hash, storage_url, estado, revisor, confianza | → document_versions, ai_extractions |
| `document_versions` | versiones | id, documento_id, hash, storage_url, creado | ← documents |
| `magic_links` | enlaces mágicos | id, token_hash, caso_id, scope (jsonb), expira, usos, estado, email | → document_requests, audit_events |
| `email_templates` | plantillas | id, tipo, versión, variables (jsonb), estado, responsable | ← email_events |
| `email_events` | envíos | id, plantilla_id, destinatario, estado, error, retry, fecha | → email_templates |
| `reminders` | recordatorios | id, caso_id, tipo, fecha, estado | → cases |
| `tasks` | tareas | id, caso_id, origen (manual/auto), responsable, estado, fechas | → cases |
| `alerts` | alertas | id, caso_id, tipo, severidad, estado, resolución | → cases |
| `audit_events` | auditoría | id, actor, acción, recurso, motivo, fecha, metadata (jsonb) | → users, magic_links |
| `ai_runs` | ejecuciones de IA | id, documento_id/caso_id, modelo, versión, prompt_hash, estado, fecha | → ai_extractions, ai_confidence_scores |
| `ai_extractions` | extracciones | id, run_id, campo, valor, fuente | ← ai_runs |
| `ai_confidence_scores` | confianza | id, run_id, score, umbral, decisión | ← ai_runs |
| `case_timeline_events` | bitácora | id, caso_id, tipo_evento, metadata, autor, fecha | → cases |
| `background_jobs` | jobs | id, tipo, payload (jsonb), estado, intentos, error, próxima_ejecución | — |

> **Convención y validación:** los nombres exactos y los índices se validan en la fase T2 (modelo de datos) contra el schema real. Este listado es una **propuesta**; la fuente de verdad final del schema es `lib/schema.ts` (R2).

---

## 16. Emails con Resend

Tipos y metadatos:

| Tipo | Disparador | Destinatario |
|---|---|---|
| solicitud documental | creación de magic link | cliente |
| primer recordatorio | job de recordatorio | cliente |
| segundo recordatorio | job escalado | cliente |
| aviso de bloqueo | detección de bloqueo | cliente |
| confirmación de recepción | recepción de documento | cliente |
| documento rechazado / corrección | resultado del pipeline | cliente |
| expediente listo para revisión | cumplimiento de definición | abogado |
| aviso interno al abogado | excepción crítica | abogado |
| aviso interno al asistente | tarea operativa | asistente |

Por cada email: **disparador, plantilla (versión), variables, destinatario, logs, retry y auditoría**. Los retries y el logging de eventos viven en `email_events`.

---

## 17. Jobs y cron

| Job | Tipo recomendado | Nota |
|---|---|---|
| inmediato tras subida | cola duradera | pipeline documental, no en request |
| procesamiento IA | cola duradera | puede ser lento; con reintentos |
| recordatorio | Vercel Cron (diario) | barre expedientes en espera |
| expiración de enlaces | Vercel Cron | marca magic links caducados |
| detección de bloqueos | Vercel Cron | mueve a `bloqueado_por_cliente` |
| recalcular estado del expediente | cola duradera (on-event) + cron de reconciliación | consistencia de estados |
| generar resumen | cola duradera | cuando el expediente está completo |
| limpieza segura | Vercel Cron | solo con política aprobada; sin eliminación de documentos hasta aprobación legal |

**Reparto:** Vercel Cron para lo periódico y ligero; **cola duradera** (Inngest/QStash/Trigger.dev) para lo pesado y con reintentos. La elección del proveedor de cola está **Pendiente de validación técnica** (sección 21).

---

## 18. Observabilidad y auditoría

- **logs de cada upload** (token, IP, tamaño, resultado);
- **logs de emails** (envío, entrega, apertura opcional, fallo, retry);
- **logs de IA** (modelo, versión, confianza, entradas referenciadas);
- **bitácora del expediente** (`case_timeline_events`, inmutable para eventos críticos);
- **auditoría de acciones críticas** (`audit_events`);
- **métricas de jobs** (cola, éxito, fallo, latencia);
- **errores y reintentos**;
- **panel de fallos** (cola de errores accionables para operaciones).

---

## 19. Pruebas necesarias

- tests unitarios (servicios, reglas, plantillas);
- tests de integración (DB, Blob, Resend, cola);
- tests E2E (flujos completos de expediente);
- tests de permisos (RBAC por rol y por expediente);
- tests de magic link (emisión, validación, expiración, revocación, scope);
- tests de expiración;
- tests de upload (tipo, tamaño, subida masiva, reemplazo);
- tests de IA con **fixtures** (documentos de prueba anonimizados);
- tests de documentos incorrectos;
- tests de documentos de otro expediente (escapar del scope);
- tests de documentos ilegibles (OCR fallback a revisión humana);
- tests de recordatorios (timings y escalado);
- tests de auditoría (registro inmutable de acciones críticas).

---

## 20. Riesgos técnicos

### 20.1 Límites serverless

- Timeouts y memoria: procesar documentos en request es inviable; obliga a cola.
- Cold starts en jobs críticos.

### 20.2 Documentos pesados

- Coste de almacenamiento y ancho de banda en Blob/S3.
- Extracción lenta de PDFs grandes.

### 20.3 OCR imperfecto

- Errores en escaneos de baja calidad, especialmente identidad/RTN y juzgados.
- Falsos negativos que marcan documentos como dudosos innecesariamente.

### 20.4 IA con alucinaciones

- Datos extraídos inventados (identidad, fechas, juzgado).
- Mitigación: exigir fuentes y confianza; nunca usar IA como única fuente.

### 20.5 Falsos positivos / negativos

- Documento aceptado que no corresponde (riesgo de silencio).
- Documento rechazado sin motivo (fricción con el cliente).

### 20.6 Falsos “Listo para revisión”

- El riesgo más grave: escalar al abogado un expediente incompleto o mal prevalidado.
- Mitigación: umbral de confianza conservador, verificación documento-expediente y reglas de escalado.

### 20.7 Exposición accidental de documentos

- URLs filtradas, token mal protegido, permisos por expediente fallidos.
- Mitigación: signed URLs cortas, tokens hasheados, scope estricto.

### 20.8 Tokens mal protegidos

- Almacenamiento en claro, sin expiración o sin revocación.
- Mitigación: solo hash, expiración, límite de usos, OTP en sensibles.

### 20.9 Costes IA

- Volumen de documentos × coste por token; posibles picos.
- Mitigación: cache de extracciones por hash, modelo Flash para lo rutinario, Pro solo cuando hace falta.

### 20.10 Colas fallidas

- Jobs atascados, reintentos infinitos, eventos perdidos.
- Mitigación: DLQ, panel de fallos, reconciliación por cron.

### 20.11 Emails no entregados

- Buzón lleno, spam, dominio no verificado.
- Mitigación: dominio verificado en Resend, eventos de entrega, canal alternativo.

### 20.12 Dependencia de proveedores externos

- Vercel, Neon, Resend, Blob/S3, proveedor IA: cada uno es un punto de fallo.
- Mitigación: monitorización, reintentos, plan de contingencia por proveedor.

---

## 21. Decisiones técnicas pendientes

- **Vercel Blob vs S3 vs R2** (coste, límites, integración).
- **Inngest vs QStash vs Trigger.dev** (cola duradera).
- **OCR elegido** (Tesseract vs servicio cloud).
- **Modelo IA final** (DeepSeek V4 Flash: confirmar nombre/disponibilidad/coste).
- **Embedding model** (RAG ya usa OpenAI/DeepSeek configurable; confirmar).
- **Antivirus/malware** (proveedor y punto de escaneo).
- **Política de retención** (pendiente de aprobación legal).
- **Umbrales de confianza** (prevalidación vs escalado).
- **Límites de tamaño** (por archivo y por expediente).
- **Duración de magic links** (por materia/sensibilidad).
- **Canal alternativo si email falla** (SMS, WhatsApp Business, portal).

---

## 22. Roadmap técnico

| Fase | Objetivo | Herramientas | Entregables | Criterios de aceptación | Riesgos |
|---|---|---|---|---|---|
| **T1** | Auditoría técnica del repo actual | lectura de schema, deps, RAG | informe de brechas | brechas listadas y priorizadas | descubrir dependencias ocultas |
| **T2** | Modelo de datos | Drizzle + Neon | schema de entidades SGIE | migración generada y aplicada en staging | migración de datos existentes |
| **T3** | Magic links y upload seguro | API + Blob + bcrypt/hash | emisión, validación, revocación, portal de carga | tests de token pasan | seguridad del token |
| **T4** | Resend y plantillas | Resend + Admin | tipos de email, versiones, logs | entregabilidad verificada | spam, dominio |
| **T5** | Jobs y recordatorios | Vercel Cron + cola elegida | recordatorios, expiraciones, bloqueos | jobs fiables con reintentos | cola caída |
| **T6** | Pipeline documental | cola + extracción + normalización | hash, extracción, OCR fallback | pipeline estable en fixtures | OCR imperfecto |
| **T7** | IA con DeepSeek V4 Flash | cliente IA + ai_runs | clasificación, extracción, resumen | confianza y fuentes en cada salida | alucinaciones |
| **T8** | Verificación documento-expediente | matriz de la sección 13 | estados sugeridos | baja tasa de falsos positivos/negativos | falsos “Listo para revisión” |
| **T9** | Bandeja “Listo para revisión” | SGIE UI + reglas | marca, dashboard abogado | flujo completo probado E2E | UX del abogado |
| **T10** | Pruebas, seguridad y despliegue | test suite + seguridad | E2E, permisos, auditoría | suite verde, auditoría de seguridad | brechas de seguridad |

Cada fase **no modifica la web pública** y **no implementa integración SEJE**.

---

## 23. Conclusión de viabilidad

- **¿Es viable técnicamente?** Sí. El stack base (Next.js/Vercel + Neon + Blob + Resend + auth existente) cubre la mayoría del SGIE semi-autónomo.
- **¿Con qué stack?** Next.js 16 en Vercel, Neon Postgres (metadatos + pgvector), Vercel Blob/S3/R2 (binarios), Resend (emails), Vercel Cron + cola duradera a elegir, DeepSeek V4 Flash (IA de texto) + OCR a elegir (escaneos), clientes IA ya presentes (`openai`/`@google/genai`).
- **¿Qué partes son MVP?** Modelo de datos, magic links + upload seguro, emails con Resend, jobs de recordatorio/bloqueo, pipeline de extracción de PDF digital, bandeja “Listo para revisión” y auditoría.
- **¿Qué partes son fase avanzada?** OCR de escaneos, IA de verificación documento-expediente con confianza alta, cola duradera sofisticada, OTP para sensibles, y cualquier integración con SEJE/fuentes oficiales.
- **¿Qué no se debe automatizar sin abogado?** Firma, aprobación jurídica, cierre de expediente y cualquier decisión jurídica sensible. La IA solo prepara, sugiere y alerta.
- **¿Qué validaciones son obligatorias antes de producción?** Modelo IA final (nombre/coste/calidad), proveedor de cola, OCR elegido, umbrales de confianza, seguridad de tokens, auditoría de acciones críticas, y pruebas E2E con documentos reales anonimizados.

---

## Registro de certeza

- **VALIDADO por inspección del repo:** Next.js 16, Vercel, Neon (Drizzle, 67 tablas, pgvector), `@vercel/blob`, `resend`, clientes `openai`/`@google/genai`, `pdfjs-dist`, auth con JWT+bcrypt, sanitize-html, Zod, RAG existente (`lib/rag/`).
- **VALIDADO por ausencia:** no hay tablas operativas de SGIE, no hay cola de jobs, no hay OCR. Estas son brechas reales, no suposiciones.
- **Pendiente de validación técnica:** nombre/disponibilidad/coste de DeepSeek V4 Flash; proveedor de cola (Inngest/QStash/Trigger.dev); OCR; Blob vs S3 vs R2; umbrales de confianza; antivirus.
- **No recomendable en MVP:** integración SEJE/fuentes oficiales; retención documental automatizada (pendiente de aprobación legal).
- **Fuera del alcance:** web pública, código, diseño visual, componentes UI.
