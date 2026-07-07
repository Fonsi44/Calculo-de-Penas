# CHANGELOG — Pineda y Asociados

Historial de cambios en orden cronológico inverso. Releases anteriores a Jul 2026
están resumidos; las entradas vigentes desde la reestructuración del changelog
(Release 91) mantienen detalle completo.

---

## [Unreleased] - 2026-07-07 — Refuerzo de Veracidad E-E-A-T y SEO/GEO

Implementación técnica para soportar entidades profesionales verificables sin inventar datos, cumpliendo los requisitos YMYL para sitios jurídicos.

### `feat(seo): soporte completo para entidades profesionales verificables (E-E-A-T)`

- **`lib/site.ts`**: añadida compatibilidad con variables de entorno para colegiación (CAH), LinkedIn y directorios de los tres abogados (`NEXT_PUBLIC_CAH_*`, `NEXT_PUBLIC_LINKEDIN_*`, `NEXT_PUBLIC_DIRECTORIO_*`).
- **Schema.org**: `hasCredential` condicionado a la existencia de CAH real. `sameAs` filtrado rigurosamente mediante el nuevo helper `validUrlsOnly` para evitar emitir URLs vacías o placeholders.
- **`.env.example`**: documentadas las nuevas variables con advertencia estricta de no inventar credenciales.

### `feat(ui): microcopy condicional de confianza E-E-A-T`

- **`app/(public)/page.tsx`**: panel informativo del Hero ahora muestra el distintivo "Colegiación CAH Verificada" solo si existen datos configurados.
- **`app/(public)/despacho/page.tsx`**: tarjetas del equipo actualizadas para renderizar condicionalmente los distintivos de CAH, LinkedIn y directorios jurídicos.

### `feat(geo): archivo llms.txt para motores de IA`

- **`scripts/generate-llms-txt.mjs`**: añadido bloque obligatorio de "Disclaimers Legales y Limitaciones" para clarificar que el contenido no es asesoría y que las herramientas son orientativas.
- **`public/llms.txt`**: regenerado automáticamente con los nuevos disclaimers.

### `docs`: Actualización de documentación de verificación E-E-A-T
- **`README.md`**: nueva sección explicando cómo completar la autoridad externa para levantar el bloqueo suave YMYL.

---

## [Unreleased] - 2026-07-07 — Eliminación completa de DeepSeek del chat público

El chat público ya no depende, no menciona, no llama ni requiere DeepSeek en
ningún escenario. Funciona exclusivamente con el motor de reglas local. Las
API keys de DeepSeek han sido borradas y el chat sigue operativo sin ellas.

### `refactor(chat)!: eliminación completa de DeepSeek del chat público`

- **`app/api/chat/route.ts`**: eliminada toda la lógica dual. El endpoint ahora
  es mono-flujo: rate-limit → Zod → guardrails → motor de reglas local. Sin
  bifurcación DeepSeek, sin imports de `deepseek.ts`, sin `CHAT_PROVIDER`.
- **`lib/chat/deepseek.ts`**: **ELIMINADO** (cliente DeepSeek del chat).
- **`lib/chat/system-prompt.ts`**: **ELIMINADO** (system prompt para LLM).
- **`lib/chat/knowledge-base.ts`**: eliminadas `buildKnowledgeBase()` y
  `buildRAGContext()` (funciones para inyectar contexto al LLM). Se conservan
  `PUBLIC_LINKS_ALLOWLIST` e `isAllowedPublicLink()` (utilidades de validación).
- **`lib/chat/config.ts`**: eliminados `CHAT_PROVIDER`, `config.deepseek`,
  `DEEPSEEK_*`, `generation` (temperature/maxTokens/timeout). El chat no
  requiere ninguna API key de IA.
- **`lib/chat/rules-engine.ts`**: único motor de respuestas. Sin cambios
  funcionales (solo comentario documental).

### `feat(legal): política de privacidad sin DeepSeek en el chat`

- **`app/(public)/politica-privacidad/page.tsx`**: sección 6 reescrita.
  "Sistema automatizado basado en reglas locales" (no IA generativa).
  "Los mensajes no se envían a ningún proveedor externo de IA". DeepSeek
  eliminado de la lista de encargados de tratamiento.
- **`lib/legal-content.ts`**: versión política 0.4 → 0.5.

### `chore(docs): README y .env.example sin DeepSeek en el chat`

- **`README.md`**: sección chat reescrita. "Motor de reglas local, sin LLM
  externo". Tabla de variables sin `DEEPSEEK_*` ni `CHAT_PROVIDER`. Nota
  explícita: las variables `DEEPSEEK_*` del `.env.example` pertenecen a
  RAG/embeddings y scripts de blog, NO al chat.
- **`.env.example`**: sección chat limpiada (solo `CHAT_ENABLED` y rate-limit).
  Variables `DEEPSEEK_*` movidas con nota "INDEPENDIENTE del chat público".

### Tests
- **`tests/api-chat.test.ts`**: reescrito mono-flujo. Eliminada la suite
  "modo deepseek (opt-in)". Añadidos tests de regresión: "funciona sin
  DEEPSEEK_API_KEY" y "no existe path que llame a DeepSeek". 12 tests.
- **`tests/chat-guardrails.test.ts`**: eliminada suite `system-prompt`
  (archivo eliminado). 22 tests (antes 27).
- **`tests/chat-rules-engine.test.ts`**: sin cambios (16 tests).

### Validaciones
- `npm run lint` ✅ · `npx tsc --noEmit` ✅ · `npm run build` ✅ (21.3s) ·
  `npm run test` ✅ (**789 tests**, 36 suites) · `npm run seo:doctor` ✅.

### Referencias DeepSeek fuera de alcance (subsistemas independientes del chat)
Estas referencias NO se modificaron porque pertenecen a subsistemas que no
afectan al chat público ni a los usuarios de la web:
- `lib/rag/` (embeddings, retrieval vectorial) — usa DeepSeek para embeddings.
- `scripts/blog-*.ts`, `scripts/seo-*.ts` — corrección editorial de posts.
- `lib/sgie/ia-documental.ts` — IA documental de la intranet (privado).
- `drizzle/migrations/meta/0023_snapshot.json` — snapshot de migración RAG.

### Riesgos pendientes
- **Revisión legal humana**: la política de privacidad ahora declara que el
  chat no usa IA generativa ni transmite a terceros. Conviene confirmar que
  la redacción cumple con el ordenamiento hondureño y RGPD/LOPDGDD.
- **Variables DeepSeek en RAG/scripts**: siguen existiendo para embeddings y
  corrección de blog. Si en el futuro se quiere eliminar DeepSeek por completo
  del proyecto, requerirá migrar el subsistema RAG a otro proveedor de
  embeddings (tarea separada, fuera de alcance).

---

## [Unreleased] - 2026-07-07 — Chat sin LLM externo: motor de reglas local por defecto

Eliminación de la dependencia operativa de DeepSeek en el chat. El asistente ahora
funciona por defecto con un **motor de reglas local** que no transmite mensajes a
ningún proveedor externo de IA. DeepSeek queda como opción **opt-in** (requiere
`CHAT_PROVIDER=deepseek` + `DEEPSEEK_API_KEY`).

### `feat(chat): motor de reglas local (CHAT_PROVIDER=rules) — sin DeepSeek por defecto`

- **Nuevo motor local (`lib/chat/rules-engine.ts`)**: detección de 14 intenciones
  (saludo, servicios, ubicación, horario, contacto, preparar consulta, caso urgente,
  identificar área, checklist, WhatsApp, formulario, privacidad, migrantes, no_entendido)
  mediante patrones regex + plantillas de respuesta prudente. Combina el clasificador
  de área legal (`sugerirAreaLegal`) y el detector de urgencia (`detectUrgency`).
  Sin transmisión a terceros.
- **Config (`lib/chat/config.ts`)**: añadida variable `CHAT_PROVIDER` con default
  `'rules'`. Valores: `'rules'` (local) | `'deepseek'` (opt-in, requiere API key).
  Mensaje inicial actualizado para reflejar modo local. Disclaimer ajustado
  ("Asistente automatizado" en vez de "Asistente de IA").
- **API route (`app/api/chat/route.ts`)**: refactorizado para rutear al motor local
  por defecto. DeepSeek solo se llama si `provider === 'deepseek'` Y API key presente.
  Si DeepSeek falla, cae al motor local como fallback (el chat nunca queda muerto).
- **Política de privacidad (`app/(public)/politica-privacidad/page.tsx`)**: sección 6
  reescrita. Modo local por defecto (no transmisión a terceros). DeepSeek como
  encargado condicional ("solo si se activa expresamente; en la configuración actual
  está desactivado").

### Funcionalidades conservadas sin LLM
- ✅ Mensaje inicial con aviso (sistema automatizado + no asesoría + privacidad)
- ✅ Quick replies de preconsulta
- ✅ Clasificador de área legal (12 áreas, heurística por keywords)
- ✅ Detector de urgencia (15 patrones server-side + banner visual + CTAs resaltados)
- ✅ Preparación de resumen de preconsulta (guía estructurada)
- ✅ Generador de mensaje WhatsApp (plantilla prudente con marcadores)
- ✅ Checklists documentales orientativos (11 áreas)
- ✅ Derivación a WhatsApp, llamada, correo o formulario
- ✅ Respuestas sobre servicios, ubicación, horario, contacto (datos locales)
- ✅ Guardrails de prompt injection (18 patrones), temas privados, asesoramiento definitivo
- ✅ Respuesta segura cuando no entiende (deriva a contacto humano)

### Tests
- `tests/chat-rules-engine.test.ts` — **NUEVO**: 16 tests (detección intención,
  urgencia, clasificación área, límites legales, no transmisión, generador WhatsApp,
  checklists).
- `tests/api-chat.test.ts`: reescrito con 3 suites (modo rules, validación/guardrails,
  modo deepseek opt-in). 13 tests.
- `tests/chat-guardrails.test.ts`: sin cambios (ya cubría guardrails compartidos).

### Validaciones
- `npm run lint` ✅ · `npx tsc --noEmit` ✅ · `npm run build` ✅ (27.1s, 361 páginas) ·
  `npm run test` ✅ (**796 tests**, 36 suites, +29 respecto al baseline de 767) ·
  `npm run seo:doctor` ✅ (18 OK).

### Limitaciones del modo sin LLM
- **Sin comprensión semántica profunda**: el motor detecta intenciones por keywords,
  no por comprensión del lenguaje natural. Mensajes muy ambiguos o reescritos pueden
  caer en `no_entendido`.
- **Sin respuestas generativas**: el motor usa plantillas fijas. No puede redactar
  resúmenes personalizados del caso del usuario como haría un LLM.
- **Sin RAG**: en modo local no se inyecta contexto de artículos legales (la integración
  RAG queda para el modo DeepSeek si se activa).
- **Tono más repetitivo**: las plantillas pueden sonar similares entre conversaciones
  distintas. Es la contrapartida de no alucinar.

### Riesgos pendientes
- **Revisión legal humana**: la política de privacidad refleja el modo local por defecto,
  pero conviene confirmar que la redacción cumple con el ordenamiento hondureño y, si
  aplica, RGPD/LOPDGDD.
- **DeepSeek no se elimina del código**: queda como integración opt-in para quien quiera
  reactivar el modo generativo. `DEEPSEEK_API_KEY` sigue siendo opcional (no obligatoria
  para el build).
- **Scripts RAG/blog** (`lib/rag/`, `scripts/blog-*.ts`) siguen usando DeepSeek para
  embeddings/corrección de posts — fuera del alcance de este cambio (subsistema separado
  del chat público).

---

## [Unreleased] - 2026-07-06 — Evolución del chat a asistente de preconsulta legal

Transformación del chat asistente de "orientador genérico" a **asistente de preconsulta legal**
con capacidades estructuradas, manteniendo intactos todos los límites legales/YMYL.

### `feat(chat): asistente de preconsulta — clasificador área, urgencia, resumen y WhatsApp`

- **System prompt (`lib/chat/system-prompt.ts`)**: reescrito con 7 funcionalidades de preconsulta
  (explicar servicios, clasificar área legal probable, detectar urgencia, preparar resumen de
  preconsulta, generar mensaje para WhatsApp/correo, checklists documentales orientativos,
  asistir al formulario). Transparencia IA obligatoria. Frases prohibidas explícitas ("usted
  ganará", "tiene derecho seguro", "la pena será exactamente", "demande", "haga esto para
  evitar responsabilidad"). Privacidad y minimización de datos antes de solicitar información.
  Regla especial RAG intacta.
- **Guardrails (`lib/chat/guardrails.ts`)**: añadida detección de urgencia server-side
  (`detectUrgency`, 15 patrones: detención, audiencia, denuncia, violencia intrafamiliar,
  menores, embargo, despido, vencimiento de plazo, citación, riesgo migratorio, amenaza,
  urgente, prisión preventiva). No bloquea: marca `urgent: true` para que el widget resalte
  CTAs de WhatsApp/teléfono. Refuerzo de prompt injection (+8 patrones: "finge ser", "modo god",
  "sin restricciones", "sobreescribe tus reglas", "system prompt", etc.).
- **API route (`app/api/chat/route.ts`)**: el flag `urgent` se propaga en la respuesta JSON
  (guardrail, fallback y deepseek) para que el widget pueda reaccionar.
- **Config (`lib/chat/config.ts`)**: mensaje inicial con triple aviso obligatorio (IA + no
  asesoría + privacidad). Quick replies de preconsulta: "Preparar consulta", "Identificar área
  legal", "Caso urgente", "Enviar WhatsApp", "Ir al formulario", "Soy hondureño en España".
- **Módulo preconsulta (`lib/chat/preconsulta.ts`)** — NUEVO: clasificador heurístico de área
  legal (`sugerirAreaLegal`, 12 áreas con keywords), checklists documentales orientativos
  (`CHECKLISTS_DOCUMENTALES`, 11 áreas), generador de mensaje WhatsApp prudente
  (`generarMensajeWhatsApp` con marcadores para datos faltantes).
- **Widget (`components/chat/chat-widget.tsx`)**: quick reply buttons al inicio (ocultos tras el
  primer mensaje), banner de urgencia con CTAs resaltados (ring + animate-pulse), detección
  client-side de área legal para analytics, manejo del flag `urgent` del backend.

### `feat(legal): política de privacidad documenta el chat/IA y proveedor DeepSeek`

- **Política de Privacidad (`app/(public)/politica-privacidad/page.tsx`)**: añadida sección 6
  "Asistente virtual de preconsulta (IA)" con naturaleza, datos tratados, datos no tratados,
  conservación (no almacenamiento), transmisión al proveedor y derecho a no usar la IA.
  Renumeradas secciones 7-10. DeepSeek añadido como encargado de tratamiento en sección 5.
- **Versión política (`lib/legal-content.ts`)**: bumped 0.2 → 0.3, "Junio 2026" → "Julio 2026".

### Tests
- `tests/chat-guardrails.test.ts`: +3 suites nuevas (detectUrgency, preconsulta-sugerirAreaLegal,
  preconsulta-generarMensajeWhatsApp, preconsulta-ChecklistsDocumentales). System prompt integrity
  ampliado (frases prohibidas, privacidad, funcionalidades preconsulta). 27 tests total (antes 13).

### Validaciones
- `npm run lint` ✅ · `npx tsc --noEmit` ✅ · `npm run build` ✅ (31.9s, 361 páginas) ·
  `npm run test` ✅ (767 tests, 35 suites, +13 respecto al baseline).

### Límites legales implementados
- El chat informa que es IA en el mensaje inicial y en el system prompt.
- No emite dictámenes, no promete resultados, no calcula probabilidades de éxito.
- Frases prohibidas explícitas en system prompt y guardrails.
- Detección de urgencia deriva inmediatamente a WhatsApp/teléfono.
- Minimización de datos: aviso de privacidad antes de solicitar información.
- No almacenamiento de conversaciones (historial solo en navegador del usuario).
- Prompt injection reforzado (server-side + system prompt).
- Política de privacidad documenta proveedor DeepSeek, finalidad, datos y no-retención.

### Riesgos restantes
- **Revisión legal humana recomendada** para confirmar que la sección 6 de la política de
  privacidad cumple con el ordenamiento hondureño y, si aplica, RGPD/LOPDGDD (tráfico España 41,8%).
- **Retention policy de DeepSeek**: el bufete no controla cuánto retiene DeepSeek los mensajes
  enviados; se documenta pero no se puede garantizar desde el código.
- **Datos sensibles voluntarios**: el sistema aconseja no compartirlos, pero no los bloquea
  técnicamente si el usuario los escribe (solo se advierte en política y system prompt).

---

## [Unreleased] - 2026-07-06 — Implementación Fase 1 auditoría SEO/GEO (tareas A-01 a A-04)

Ejecución de las 4 tareas de prioridad ALTA del `SEO_GEO_ACTION_PLAN.md`, generadas
por la auditoría integral SEO/GEO/YMYL (`AUDITORIA_SEO_GEO_LEGAL_PINEDA.md`).

### Verificación post-deploy en producción (2026-07-06)

Confirmación de que los cambios de Fase 1 están vivos en producción, sin regresiones.

- **Deploy verificado en producción:** enlace al Poder Judicial de Honduras
  (`https://www.poderjudicial.gob.hn/`) confirmado en `/despacho` (265.767 bytes) y
  en el footer de la home (249.519 bytes). `rel="noopener noreferrer"`, sin `nofollow`,
  texto prudente ("referencia institucional del sistema judicial hondureño").
- **Canonical coherente:** canonical = og:url = URL servida =
  `https://www.pinedayasociadoshn.com` (sin slash, normalización Next.js). Title 59 chars,
  1 `<h1>`, sin trailingSlash global.
- **Sitemap/robots:** ambos HTTP 200; sitemap 213 URLs (sin cambios); robots referencia
  sitemap correctamente.
- **Slug A-04 corregido:** 0 referencias al slug erróneo `derecho-ambiental-regulatorio`
  en el repo; URL correcta `/servicios-juridicos/ambiental-regulatorio` sirve 200.
- **Integridad confirmada:** JSON-LD, blog, RGPD/cookies, next.config.ts, proxy.ts,
  sameAs y CWV intactos (sin cambios en git diff).
- **A-01 sigue pendiente:** cadena apex 308→308 confirmada en vivo (2 saltos). Requiere
  configuración manual en Vercel → Domains → apex como redirect 301 a www.
- **Validaciones locales:** `lint` ✅, `tsc --noEmit` ✅, `build` ✅ (28.0s, 361 páginas),
  `seo:doctor` ✅ (18 OK), `test` ✅ (754 tests, 35 suites).
- **Progreso:** 92 % completado / 8 % restante (sin cambios: A-01 Vercel + A-04 detalle
  externo Bing/Screaming Frog). A-02, A-03 completadas y validadas en producción.

### Cierre técnico post-implementación (2026-07-06)

Re-validación y cierre operativo de los pendientes externos de Fase 1. Sin cambios
de código funcionales adicionales — solo documentación de procedimientos externos.

- **Re-validación local:** `lint` ✅, `tsc --noEmit` ✅, `build` ✅ (28.0s, 361 páginas),
  `seo:doctor` ✅ (18 OK / 1 ERROR gcloud externo / 4 PENDIENTE creds), `test` ✅ (754 tests, 35 suites).
- **Cierre externo A-01 (Vercel):** documentado procedimiento exacto en
  `AUDITORIA_SEO_GEO_LEGAL_PINEDA.md` § "Cierre técnico Fase 1". Estado verificado en vivo:
  cadena apex sigue en 2 saltos (308→308); requiere config manual en Vercel Domains.
- **Cierre externo A-02 (GSC/Bing):** documentado checklist de validación pasiva.
  Decisión local mantenida: no forzar `trailingSlash` global. Pendiente confirmación en
  GSC URL Inspection y Bing WMT SEO Report.
- **Cierre externo A-04 (Bing WMT/Screaming Frog):** documentado procedimiento de
  extracción, crawl, clasificación (5 tipos) y corrección. Prohibido redirigir 404 a
  home o crear páginas vacías. Criterio de cierre: 0 enlaces internos rotos corregibles.
- **Documentación actualizada:** `AUDITORIA_SEO_GEO_LEGAL_PINEDA.md` (sección "Cierre
  técnico Fase 1" con instrucciones operativas para Vercel, GSC, Bing WMT y Screaming
  Frog), `SEO_GEO_ACTION_PLAN.md` (sección "Cierre externo Fase 1").
- **Progreso:** 92 % completado / 8 % restante (sin cambios). Recomendación: desplegar
  + cerrar A-01 en Vercel (~10 min) → esperar indexación; A-04 en paralelo.

### `fix(seo): Fase 1 auditoría — enlace autoridad, canonical home y enlace roto`

- **A-03 (Enlace a autoridad jurídica)**: Añadido enlace al Poder Judicial de Honduras
  (`https://www.poderjudicial.gob.hn/`) en `/despacho` (tarjeta "Credenciales y
  especialidad") y en el footer (columna identidad). Refuerza E-E-A-T (Trustworthiness)
  en sitio YMYL jurídico. `rel="noopener noreferrer"`, sin `nofollow`, tono prudente.
  - `app/(public)/despacho/page.tsx`
  - `components/marketing/public-footer.tsx`
- **A-04 (Enlace interno roto)**: Corregido slug de servicio en `landing-local.tsx`:
  `derecho-ambiental-regulatorio` (404) → `ambiental-regulatorio` (canónico). Coherente
  con `data/areas-juridicas.ts`, `lib/internal-links.ts`, `public-footer.tsx` y
  `data/seo/canonical-paths.json`. Enlace latente (no se renderizaba actualmente) pero
  bug potencial si una landing local añadía un servicio ambiental.
  - `components/marketing/landing-local.tsx`
- **A-02 (Canonical home)**: Decisión documentada (sin cambio funcional). Next.js App
  Router normaliza el trailing slash de la raíz con `trailingSlash: false` (default):
  el HTML sirve `...com` sin slash, coherente entre canonical, og:url y URL servida.
  Bing no reporta errores de canonicalización (3.754 2xx, 16 priorityUrls sin "redirect").
  No se fuerza `trailingSlash: true` global (impactaría 213 URLs del sitemap, ~60
  redirects y todos los canonicals; riesgo de regresión > beneficio). Comentarios
  actualizados para reflejar la realidad.
  - `app/(public)/page.tsx` (comentario)
  - `app/(public)/layout.tsx` (comentario)
- **A-01 (Redirect apex)**: PENDIENTE EXTERNA. La cadena 308→308 en el dominio apex
  (`http://non-www` → `https://non-www` → `https://www`) es infraestructura de Vercel
  que intercepta antes de la app Next.js. `next.config.ts` ya declara los redirects
  (líneas 118–119) como defensa en profundidad. Requiere config manual en Vercel →
  Project Settings → Domains → apex como "Redirect to www" Permanent (301).

### Documentación generada/actualizada
- `AUDITORIA_SEO_GEO_LEGAL_PINEDA.md`: nueva sección "Implementación Fase 1 — 2026-07-06".
- `SEO_GEO_ACTION_PLAN.md`: A-01 a A-04 marcadas con estado (pendiente externa / completada / parcial).
- `SEO_AUDIT_CHECKLIST.md`: 2 ítems ⚠️→✅ (2.6, 7.8); 3 ítems ⚠️ actualizados (1.8, 1.10, 11.9). Total: 128✅ / 23⚠️ / 0❌ (85 %).

### Validaciones
- `npm run lint` ✅ limpio
- `npx tsc --noEmit` ✅ limpio
- `npm run build` ✅ Compiled successfully in 28.8s, 361 páginas estáticas, exit code 0
- `npm run seo:doctor` ✅ 18 OK / 1 ERROR (gcloud CLI no instalada, no relacionado) / 4 PENDIENTE

---

## [Unreleased] - 2026-07-06 — Saneamiento global del repositorio y mejoras SEO/GEO

Este saneamiento se separó en dos commits atómicos y semánticamente correctos: un `chore` técnico y un `feat(seo)` funcional.

### Commit 1: `chore: saneamiento global del repositorio y hardening operativo`
- **Fase 1 (Limpieza Básica)**: 
  - Eliminación segura de archivos temporales (`_tmp_*`, `_chat_*.png`, `auditoriablog_*.md`) y limpieza de la carpeta `scratch/`. Actualización de `.gitignore`.
  - Correcciones técnicas en `app/robots.ts` (permitidos `/_next/` para bots) y `tests/blog-verify-fix.test.ts` (typecheck fixes).
- **Fase 2 (Saneamiento Operativo)**:
  - Consolidación del directorio `scripts/`: Se creó `scripts/README.md` documentando el inventario.
  - Archivado histórico: Se movieron a `scripts/archive/` los scripts huérfanos/obsoletos.
  - Verificación de exclusión: Se confirmó que `archive/` está ignorado en el typecheck global.
- **Fase 3 (Consolidación SDK de IA)**:
  - Se eliminó con seguridad la dependencia legacy `@google/generative-ai`.
  - Se consolidó la conectividad sobre la SDK oficial `@google/genai` (Gemini) y se documentó el uso de `openai` como cliente para RAG/DeepSeek.
- **Fase 4 (Hardening de secretos y datos generados)**:
  - Se eliminaron del index de Git (vía `git rm --cached`) outputs generados: `data/corregir-checkpoint.json` y `data/gsc-*.json`.
  - Fortalecimiento de `.gitignore` bloqueando patrones `*token*.json`, `*secret*.json`, `*credential*.json`, `*checkpoint*.json` y `data/bing/`.
  - Creación de `data/README.md` estipulando la política de "Fuentes de verdad" (versionables) vs "Datos generados/Locales" (no versionables).
- **Fase 5 (Validación y Cierre)**:
  - Validación 100% exitosa en `lint`, `typecheck`, `test` (754 tests en 35 suites) y `build`.
  - Cierre formal del informe `AUDIT_REPOSITORY_REPORT.md`.

### Commit 2: `feat(seo): incorporar mejoras GEO y marcado estructurado para contenido`
- **Estructura Semántica**:
  - Ampliado el marcado estructurado del sitio y blog con señales GEO/SEO (`lib/schemas/blog.ts`, `lib/site.ts`).
  - Añadidas propiedades semánticas orientadas a asistentes (entidades `Organization`, `SpeakableSpecification`, idioma BCP-47).
  - Actualizado el script `scripts/corregir-articulos.ts` para inyectar bloques estructurales GEO puros (`geo-summary`, `geo-law`, `geo-data`) directamente en los bodies HTML.

---

## 2026-07-04 — Transformación coherente de la web pública (Release 110)

Reorganización integral de la web pública para eliminar la sensación de
"crecimiento por acumulación" y convertir el sitio en una experiencia coherente,
elegante y madura. Override de R5/Sección 6 autorizado por el usuario; el resto
del protocolo respetado (URLs/slugs intactos, tokens R16, commits atómicos).

### Arquitectura
- **`lib/areas-unified.ts`**: puente entre seed TS canónico y DB. Resuelve R2.
- **`lib/faq-unified.ts`**: documenta 4 orígenes de FAQ y expone helpers tipados.

### Componentes nuevos
- **`EditorialBlock`**: bloque narrativo tipográfico (eyebrow + serif + lista
  jerárquica) para sustituir grids de tarjetas clonadas.
- **`IconBadge`**: encapsula patrón icono-contenedor R16 (PENDIENTE de aplicar).
- Utilidades CSS `.section-breath`, `.rhythm-tight`.

### Variantes en componentes compartidos
- `BlogHighlights`: `layout="cards"|"list"|"minimal"`.
- `ConsultationCTA`: `variant="closing"|"inline"|"footer"` + props.
- `TrustBar`: `variant="expanded"|"compact"` + `limit`.

### Páginas transformadas
- **Home**: 12 → 7 secciones, 631 → 456 líneas (−28 %). Sin FAQ visual ni Equipo.
- **`/despacho`**: dueño canónico del Equipo y claims institucionales.
- **`/derecho-penal`**: sin foto duplicada, CTAs consolidados, contraste rítmico.
- **`/servicios-juridicos`**: misión catálogo, sin duplicar `/despacho`.
- **`/hondurenos-en-espana`**: reconectado al catálogo (RelatedServices).
- **Landings locales**: cierre coherente (ConsultationCTA inline).
- **5 landings cargo**: RelatedCities al pie (reconectadas al grafo).
- **`/solicitar-consulta`**: 3 cards Equipo → enlace compacto a `/despacho`.

### Validación
✅ lint + build + 754 tests + validate:dates + sitemap (213 URLs).

Ver detalle en `docs/audits/transformacion-web-publica.md`.

### Cierre (2026-07-04)
Cierre de los 3 pendientes del Release 110 y validación completa de SEO/indexación:
- **IconBadge aplicado** de forma quirúrgica (4 casos equivalentes); variantes
  incompatibles dejadas intactas y documentadas.
- **FAQ i18n home** renombrada a `FAQ_HOME_LEGACY`: rol declarado como
  structured-data (JSON-LD `FAQPage`), no UI, no fuente canónica. SEO intacto.
- **Fix SEO**: eliminado `@id` `FAQPage` duplicado en `/derecho-penal` y
  `/hondurenos-en-espana` (`areaSchemas` + `HubFaq` emitían el mismo bloque).
- **QA visual real** con Playwright: 22 capturas (11 rutas × desktop/móvil),
  0 overflow horizontal, 1 h1/página. Errores de consola preexistentes declarados.
- **SEO validado vía HTTP local**: sitemap 213 URLs, robots sin bloqueos,
  metadatos 18/18 OK, JSON-LD 0 duplicados, indexabilidad 0 errores.
- **Infraestructura**: `scripts/qa-visual-cierre.mjs` (QA reutilizable).

### Cierre de deuda runtime (2026-07-04)
Resuelto el error de hidratación React #418 declarado preexistente:
- **Causa raíz**: `ChatWidget` usaba `typeof document === 'undefined'` como
  branch server/client (SSR retornaba `null`, cliente renderizaba el portal) →
  mismatch de hidratación #418, que en producción cascada a `a[c] is not a function`.
- **Fix**: patrón `mounted` con `useSyncExternalStore` (determinista server/client).
- **`a[c] is not a function`**: NO es deuda del proyecto; es un error interno del
  script de terceros Microsoft Clarity en contexto headless.
- **Test de regresión**: `e2e/hydration.spec.ts` (8 rutas, 8/8 pasan).
- Validado: 0 errores de hidratación en 7 rutas × desktop/móvil en producción.

Sin push.

---

## 2026-07-04 — Ajuste fuerte de escala visual v2 (Release 109b)

Segunda pasada de compactación tras Release 109. Tokens agresivos que reducen
~30% la altura de secciones, ~30% espacios, ~22% componentes y ~30% el chat.
Reducción de texto controlada (~10% máx). Mantiene legibilidad (16px min),
botones accesibles (≥36px) y proporción profesional.

### Tokens actualizados (`app/globals.css`)
```
--ui-scale: 0.82         # antes 0.94
--font-scale: 0.90       # antes 0.98
--space-scale: 0.70      # antes 0.88
--section-scale: 0.68    # antes 0.86
--component-scale: 0.78  # antes 0.92
--chat-scale: 0.70       # antes 0.88
```

### Cambios aplicados
- **Root font-size**: mantenido `clamp(16px, 0.95rem + 0.15vw, 17px)`
- **Container/Section/Header**: reducción adicional ~25% en todos los espaciados
- **Home hero (page.tsx)**: padding `py-12/16/20` → `py-8/12/16`, título reducido
  un escalón, panel lateral iconos w-11→w-10, p-6→p-5, CTAs mt-8→mt-6.
- **PageHero**: padding `py-8/12/14` → `py-6/10/12`, title bajado a `text-xl/sm:text-2xl/lg:text-3xl`.
- **CTAGroup**: UrgencyCallout p-4→p-3.5, ContactStrip p-3→p-2.5 w-10→w-9.
- **TrustBar**: py-6/10→py-5/8, iconos w-10→w-9, gap reducido.
- **PublicHeader**: main-bar py-2→py-1.5, logo h-8→h-7, wordmark más fino.
- **PublicFooter**: py-10/14→py-8/12, logo h-12→h-10, gap-6→gap-5.
- **HubFaq**: py-10/14→py-8/12, title `text-xl/2xl`→`text-lg/xl`, padding compacto.
- **ServiceCard**: p-4/5→p-3.5/4, title `text-base/lg`→`text-sm/base`.
- **LandingLocal**: hero py-8/12→py-6/10, title bajado, NAP mt-5→mt-4.
- **ChatWidget**: maxWidth `clamp(16rem,25vw,20rem)`, maxHeight `min(480px, calc(100dvh-100px))`,
  botón w-10 h-10, todos los paddings reducidos ~30%.

### Criterio por resolución
| Resolución | Efecto esperado |
|---|---|
| 1366×768 | ~30% menos altura visual, 4-5 secciones visibles arriba del fold |
| 1440×900 | Equilibrada, elegante, proporción jurídica premium |
| 1920×1080 | No parece ampliada, anchos controlados |
| 768×1024 | Compacta pero cómoda, lectura fluida |
| 390×844 / 360×740 | Texto legible, menos scroll, chat no invasivo |

Sistema profesional de escala fluida para toda la web pública. Seis CSS custom
properties en `:root` controlan la densidad global. Sin zoom, sin hacks, sin
rediseño. El root font-size usa `clamp(16px, 0.95rem + 0.15vw, 17px)` para
mantener legibilidad (±2% variación). La compactación real se consigue en
spacing, secciones, componentes y chat.

### Tokens de escala (`app/globals.css`)
```
--ui-scale: 0.94        # global (no usar directamente)
--font-scale: 0.98      # texto continuo y títulos
--space-scale: 0.88     # paddings, margins, gaps
--section-scale: 0.86   # altura/padding vertical de secciones
--component-scale: 0.92 # cards, badges, botones, iconos
--chat-scale: 0.88      # widget del chat
```
Documentación inline: "Para web más COMPACTA baja todas ~0.05, para más AMPLIA
sube --space-scale y --section-scale".

### Componentes refactorizados
- **Section/Container/SectionHeader**: Container `px-4 sm:px-6` → `px-3 sm:px-5`,
  SPACING reducido un escalón, SectionHeader `mb-10` → `mb-8`.
- **PageHero**: padding vertical `py-10 md:py-14 lg:py-16` → `py-8 md:py-12 lg:py-14`.
  Títulos bajan un escalón (`text-3xl sm:text-4xl lg:text-5xl` → `text-2xl sm:text-3xl lg:text-4xl`).
- **CTAGroup**: botones inline/primary de `h-12` a `h-11` (44px ≥ 40px). Compact
  de `h-10` a `h-9` (36px ≥ 36px táctil). Gaps reducidos. UrgencyCallout y
  ContactStrip con padding e iconos reducidos.
- **TrustBar**: padding sección `py-8 md:py-12` → `py-6 md:py-10`. Iconos
  `w-11 h-11` → `w-10 h-10`.
- **PublicHeader**: barra principal `py-2.5 md:py-3` → `py-2 md:py-2.5`. Logo
  `h-9/h-12` → `h-8/h-11`. Nav `h-9` mantenido. Drawer móvil `h-11` → `h-10`
  (40px táctil).
- **PublicFooter**: padding `py-14 md:py-16` → `py-10 md:py-14`. Grid gap
  `gap-8 lg:gap-10` → `gap-6 lg:gap-8`. Logo `h-14 sm:h-16` → `h-12 sm:h-14`.
- **HubFaq**: sección padding reducido, title `text-2xl md:text-3xl` →
  `text-xl md:text-2xl`, summary/body padding compactado.
- **ServiceCard**: contenido `p-5 md:p-6` → `p-4 md:p-5`. Title `text-lg md:text-xl`
  → `text-base md:text-lg`.
- **LandingLocal**: hero padding reducido, title baje un escalón, NAP grid y CTA
  spacing compactados. Servicios grid `gap-5` → `gap-4`.
- **ChatWidget**: ancho fluido `clamp(18rem, 28vw, 23rem)` + `calc(100vw-2rem)`.
  Altura segura `min(620px, calc(100dvh - 120px))`. Botón flotante `w-11 h-11`.
  Cabecera, burbujas, CTA bar, input y disclaimer compactados con --chat-scale.

Chat conversacional orientado a conversión y orientación inicial, montado en la
web pública (`app/(public)/layout.tsx`). Conecta con DeepSeek v4 Flash vía
endpoint server-side `/api/chat`. La API key nunca sale del servidor; el widget
solo llama a la ruta relativa same-origin.

### Backend (`lib/chat/`, `app/api/chat/route.ts`)
- **Config centralizada** (`lib/chat/config.ts`): `CHAT_ENABLED`, `DEEPSEEK_API_KEY`, `DEEPSEEK_MODEL`, `DEEPSEEK_BASE_URL`, `CHAT_TEMPERATURE`, `CHAT_MAX_TOKENS`, `CHAT_TIMEOUT_MS`, límites de longitud y rate-limit.
- **System prompt canónico** (`system-prompt.ts`): texto verbatim del requerimiento; no abogado, no asesoramiento definitivo, no inventar leyes, derivar urgencias a WhatsApp/teléfono.
- **Base de conocimiento** (`knowledge-base.ts`): derivada de `data/areas-juridicas.ts` y `lib/site.ts`. Allowlist de enlaces públicos (`PUBLIC_LINKS_ALLOWLIST` + `isAllowedPublicLink`): el asistente solo puede citar páginas públicas, nunca rutas privadas/API/técnicas.
- **Guardrails server-side** (`guardrails.ts`): detección de prompt injection, temas privados/intranet, solicitudes de asesoramiento definitivo (cálculo de penas, estrategia, escritos). Respuestas prefijadas sin llamar al proveedor.
- **Cliente DeepSeek** (`deepseek.ts`): fetch con `AbortController` (timeout), reintentos en 429/5xx. Reutiliza patrón de `lib/sgie/ia-documental.ts`.
- **Endpoint `/api/chat`**: rate-limit doble (por IP + por sessionId vía `rateLimits`), validación Zod, guardrails, llamada al proveedor, fallback seguro. No revela configuración interna.

### Frontend (`components/chat/`)
- **Widget** (`chat-widget.tsx`): botón flotante `bottom-4 left-4` (no tapa el `FloatingContactRail` de la derecha). Panel con mensaje inicial, quick replies, CTAs (WhatsApp contextual, llamar, solicitar consulta), estados loading/error, scroll interno, cierre con Escape, aria-labels, foco visible. Disclaimer visible: "Este chat ofrece orientación inicial y no sustituye una consulta jurídica."
- **Salvaguarda anti-rutas-privadas**: además del montaje en layout público, el widget devuelve `null` en `/intranet`, `/admin`, `/login`, `/dashboard`, `/panel`, `/auth`, `/private`, `/api`, `/cargar`, `/preview`.
- **Analytics anónimos** (`chat-analytics.ts`): `chat_opened`, `chat_closed`, `chat_message_sent`, `chat_fallback_used`, `chat_whatsapp_clicked`, `chat_contact_clicked`, `chat_service_suggested`. Sin contenido de conversación.
- **sessionId** en `localStorage` (sin conversación completa); generado perezosamente en el primer envío.

### Fallback sin IA
Si falta `DEEPSEEK_API_KEY`, el modelo falla (timeout/HTTP error) o se agota el rate-limit, el widget sigue ofreciendo WhatsApp, llamada, contacto y servicios. Respuesta `source: fallback_*`.

### Modelo
`DEEPSEEK_MODEL=deepseek-v4-flash` (requerimiento del proyecto). Modificable por env: si el proveedor usa otro identificador oficial, basta cambiar la variable sin tocar código.

### Tests (24 nuevos, 754 totales)
`tests/api-chat.test.ts` (10) + `tests/chat-guardrails.test.ts` (14): aparece en públicas; no revela configuración; prompt injection bloqueado; intranet rechazada; asesoramiento definitivo deriva; fallback sin API key; allowlist impide rutas privadas; rate-limit 429; system prompt íntegro.

### Validación
`lint` ✓ (0 errores), `build` ✓ (ruta `/api/chat` generada), `test` ✓ (754/754).

---

## 2026-07-04 — Fase 2 advanced SEO/GEO/CRO/analytics (Release 107)

Segunda fase avanzada de SEO/GEO/performance/CRO sobre la rama `fase2-growth-seo`. 8 commits atómicos (a778d4b → 7829bf8). Validación final: `lint` ✓, `build` ✓ (360 rutas estáticas), `test` ✓ (730/730).

### Fix factual (commit a778d4b)
- **Página pilar** (`/guia-legal-abogados-honduras`): apellidos corregidos a la fuente canónica `lib/site.ts`. "Thania Pineda" → "Thania Marlene Paz", "Emil Hernández" → "Emil Barahona". Discrepancia detectada entre la pilar (recién creada) y los schemas Person/Organization que alimentan Knowledge Graph.
- Incluye WIP R106 del usuario (`.prose-pilar` y `.geo-snippet` en globals.css, refactor visual de servicios-juridicos/como-llegar/landing-local).

### Des-canibalización landings locales (commit 2d012a1)
- **Keyword canibalizadora eliminada**: `abogado penalista {ciudad}` ya no se incluye en las 16 landings locales (competía con las landings de cargo dedicadas `/abogado-penalista-nacaome` y `/abogado-penalista-choluteca`). Reemplazada por `bufete jurídico {ciudad}` no competitiva.
- **Titles SEO diferenciados por tipo de ciudad** (antes todas compartían `Abogados en {ciudad} | Pineda y Asociados`):
  - Sede física (Nacaome): `Abogados en Nacaome · Bufete con Sede en Valle` (46 chars)
  - Distancia ≤60 km: `Abogados en {ciudad} | Sur de Honduras` (~40 chars)
  - Distancia >60 km: `Abogados en {ciudad} | Bufete desde Nacaome` (~55 chars)
  - Todas ≤60 chars. Campo opcional `seoTitle` para override manual.

### Performance (commit 6353f47)
- Recompresión parcial de los 2 WebP >400 KB restantes (`delitos-ambientales`, `habeas-corpus`). Calidad 68 + resize 1600px. Ahorro: 485→472 KB y 485→474 KB (~25 KB total). Lock de archivo intermitente impidió aplicar calidad 60 + resize 1400. AVIF equivalente ya se sirve en Chrome/Edge/Firefox (402 y 388 KB).

### Enlazado página pilar (commit aa013f2)
La pilar `/guia-legal-abogados-honduras` solo recibía 1 enlace entrante. Era huérfana desde home, footer, landings locales y hubs. Añadidos enlaces contextuales (sin rediseño):
- **Home**: tercer link en sección FAQ (junto a blog y FAQ).
- **Footer**: entrada en columna "El Despacho".
- **Landing-local**: link al final del bloque intro (afecta a las 16 landings locales).
- **`/derecho-penal`** y **`/despacho`**: link tras "explore las ramas principales del derecho".

### GEO/LLMO — AnswerBlocks en hubs faltantes (commit a3ac75b + 7829bf8)
- **`/servicios-juridicos`**: AnswerBlock "¿Qué hace un bufete multidisciplinario en Honduras?" con respuesta sobre las 14 áreas y punto de contacto único.
- **`/hondurenos-en-espana`**: AnswerBlock "¿Puedo tramitar asuntos legales en Honduras residiendo en España?" con respuesta sobre poderes apostillados y seguimiento remoto.
- Ahora los 6 hubs comerciales principales tienen AnswerBlock (pilar, despacho, solicitar-consulta, derecho-penal, servicios-juridicos, hondurenos-en-espana).
- Fix build: `Section background="light"` inválido → `muted` (commit 7829bf8).

### GEO/LLMO — llms.txt con sección FAQ (commit 202680a)
- `scripts/generate-llms-txt.mjs`: nueva sección "Preguntas frecuentes (FAQ)" listando las 5 páginas con schema FAQPage (central + 4 hubs). Cada entrada con 1-liner descriptivo para que ChatGPT, Claude, Perplexity, Copilot y Gemini puedan localizar y citar respuestas directas.
- `public/llms.txt` regenerado: 159 líneas (era 151).

### CRO + analytics (commit 11e0c40)
- **`trackScrollDepth(percent)`** en `lib/analytics.ts`: gap cerrado (faltaba `scroll_depth` en el catálogo de eventos).
- **`analytics-listeners.tsx`**: listener `scroll` con umbrales 25/50/75/90% vía rAF + `Set` de disparados (una vez por umbral por carga de página). Listener pasivo.
- **`cta-buttons.tsx`**: `DEFAULT_MSG` de WhatsApp ampliado de "Vi su sitio web" a "Los contacto desde la web de Pineda y Asociados" (más específico, ayuda a filtrar leads por canal).

### Validación
- `npm run lint`: 0 errores.
- `npm run build`: 360 rutas estáticas.
- `npm test`: 730 tests (33 suites) pasados.
- `npx tsc --noEmit`: errores preexistentes en `tests/blog-verify-fix.test.ts` (presentes en `main`, no tocados en esta rama).

### Pendientes declarados (R11)
- **CSS 1412 líneas**: sin bloques `@layer` muertos identificables; requiere análisis dedicado. Fuera de scope.
- **Bundle admin libs**: ya aisladas por Turbopack (verificado Fase 1). No se requiere action.
- **PageSpeed live**: no se mide (sin Lighthouse sobre deploy real).
- **Recompresión WebP q60 + resize 1400**: lock intermitente impidió aplicación; AVIF equivalente sirve la versión optimizada en navegadores modernos.
- **FAQ dedicadas para 9 landings secundarias**: las actuales tienen plantilla + contexto local real; diferenciación total requeriría redacción editorial masiva (~36 Q&A).
- **SearchAction schema, VideoObject/HowTo**: sin buscador global, sin contenido de video.

---

## 2026-07-04 — Consolidación del sistema de diseño + auditoría pública integral (Release 106)

Segunda fase de la auditoría UX/UI. Tras la normalización de páginas principales en R105, se auditaron sistemáticamente todas las páginas públicas restantes (blog, contacto, legales, landings, subpáginas, guías) y se consolidó el sistema de diseño con nuevas utilidades CSS y normalización de componentes.

### Utilidades CSS nuevas
- **`.prose-pilar`** en `globals.css`: tipografía editorial para páginas de contenido extenso (guías legales, pilares). Similar a `.article-body` pero sin los marcadores § en h2. Max-width 42rem, h2 serif 1.5rem, line-height 1.78, responsive mobile.
- **`.geo-snippet`** en `globals.css`: bloque de respuesta directa optimizado para motores de IA (AEO/GEO). Fondo acent/5 con borde sutil, texto escaneable, padding controlado. Reemplaza los `bg-accent/5 rounded-2xl p-5 border border-accent/10` inline que se repetían en varias páginas.

### Páginas normalizadas (nuevas en R106)
- **`/como-llegar`**: el hero inline (section bg-primary con texto manual) se reemplazó por `PageHero` canónico + `Breadcrumbs` + `TrustBar`, alineándolo visualmente con el resto del sitio.
- **`/guia-legal-abogados-honduras`**: se aplicó la nueva clase `.prose-pilar` al contenido editorial (antes usaba `prose-pilar` sin definición CSS). Ahora tiene tipografía, espaciado y jerarquía consistentes con el sistema.
- **`/derecho-penal`**: los bloques GEO/AEO con `bg-accent/5 rounded-2xl` inline migraron a la nueva `.geo-snippet` (fuente única de verdad). Sin cambios visuales; solo consolidación técnica.

### Páginas auditadas sin cambios (ya consistentes)
- **Blog** (`/blog`, `/blog/[categoria]`, `/blog/[categoria]/[slug]`): usa `.article-body` (definido en R9), `BlogHero`, `FeaturedPosts`, `BlogExplorer`, `BlogSidebar`. Arquitectura sólida y consistente.
- **Contacto** (`/solicitar-consulta`): `PageHero` + `TrustBar` + `AnswerBlock` + formulario + tarjetas de abogados + `HubFaq`. Estructura completa y alineada.
- **Legales** (`/aviso-legal`, `/politica-privacidad`, etc.): todas usan `LegalDocument` + `LegalSection` + `LegalCallout`. Componentes dedicados con diseño propio para contenido regulatorio.
- **Landings locales** (`/abogados-en-*`): todas usan `LandingLocalView` + `BlogHighlights`. Patrón uniforme y escalable.
- **Subpáginas de servicios** (`/servicios-juridicos/[slug]`, `/derecho-penal/[slug]`): usan la misma arquitectura con `Breadcrumbs`, hero, bloques de abogado, secciones, FAQ y CTA.
- **Header/Footer/Floating buttons**: revisados. Header con sticky + glass + menú activo con indicador dorado. Footer con 5 columnas + disclaimer legal. FloatingContactRail con WhatsApp + teléfono + PWA install. Sin cambios necesarios.

### Arquitectura narrativa canónica por página
Todas las páginas públicas siguen ahora el mismo orden:
1. `Breadcrumbs`
2. `PageHero` (H1, subtitle, CTA opcional)
3. `TrustBar` (sellos de autoridad)
4. Bloque introductorio editorial (`IntroEditorial`, `AnswerBlock` o contenido)
5. Secciones jerarquizadas (`Section` + `SectionHeader`)
6. `ConsultationCTA` (CTA final premium)
7. `HubFaq` (FAQ acordeón, solo si aporta valor real)

### Validación
- `npm run lint`: 0 errores
- `npm run build`: 360 páginas estáticas
- `npm test`: 730 tests (33 suites) pasados

---

## 2026-07-04 — Auditoría UX/UI + sistema de diseño visual público (Release 105)

### Sistema de diseño
- **`components/marketing/intro-editorial.tsx`** (nuevo): componente reutilizable para bloques editoriales largos. Card premium con barra lateral dorada, fondo surface, sombra controlada, max-width de lectura óptimo, highlight opcional y CTA integrable. Reemplaza el uso de `prose` Tailwind crudo en páginas de servicios y contenido institucional.
- **`app/globals.css`**: nueva clase `.prose-editorial` con tipografía, ritmo y jerarquía consistentes para texto editorial largo (h2 serif, p con line-height 1.75, strong en text, links dorados, responsive mobile). Separada de `.article-body` (posts del blog) porque el contexto es distinto: páginas de servicios vs. artículos de blog.

### Páginas normalizadas
- **`/servicios-juridicos`**: el bloque introductorio de texto plano sin diseño se transformó en un `IntroEditorial` con card premium, barra lateral dorada, título jerarquizado y CTA suave de transición. El contenido respira, se escanea mejor y transmite profesionalismo.
- **`/derecho-penal`**: unificación de secciones duplicadas. "Urgencias penales" ahora es un bloque de acción concreta (no FAQ): incluye `UrgencyCallout` rojo + grid de pasos. "Preguntas frecuentes" generales migraron a `HubFaq` (acordeón con animación), eliminando la duplicidad visual y conceptual que confundía al usuario. Se diferencian claramente: urgencias = actuar ya; FAQ = informarse.
- **`/hondurenos-en-espana`**: el bloque editorial migró de `prose` crudo a `IntroEditorial` con la misma card premium. La sección FAQ migró de tarjetas planas a `HubFaq` acordeón.

### Componentes mejorados
- **`HubFaq`**: rediseño completo. Ahora usa el patrón `card-premium` del sistema: fondo surface, sombra multicapa sutil, borde dorado al expandir, chevron `ChevronDown` de lucide-react, animación grid-rows CSS. Consistencia visual con el resto del sitio.
- **Esquema FAQ duplicado**: en `/derecho-penal`, el JSON-LD FAQPage incluía las "urgencias" como preguntas FAQ. Corregido: las urgencias son pasos de acción, no preguntas FAQ. El esquema ahora solo incluye las preguntas generales, y `HubFaq` emite su propio FAQPage con `@id` estable para deduplicación.

### Criterios aplicados
- **Jerarquía visual**: cada página tiene un H1 único (hero), introducción editorial (IntroEditorial), secciones jerarquizadas con eyebrow+title+subtitle (SectionHeader), CTA relevante y FAQ solo si aporta valor.
- **Coherencia tipográfica**: títulos en Cormorant Garamond (serif), cuerpo en Manrope (sans). Eyebrows con `.eyebrow-label` o `.eyebrow-rule`. Títulos de sección con `.section-title` responsive.
- **Consistencia de cards**: `card-premium` (superficie con gradiente interno + sombra multicapa + halo dorado hover), `service-card-refined` (servicios con imagen + hover lift), `card-dark` (fondos oscuros).
- **Sombras**: tokens centralizados en CSS (`--shadow-card`, `--shadow-btn-*`). Sin sombras inline. R16 cumplido.
- **Radios**: `rounded-lg` (16px) canónico para cards. `rounded-xl` para envolturas editoriales.
- **Espaciado**: `Section` con `spacing="sm|md|lg"` consistente. `Container` con `max-w-7xl` por defecto.
- **Responsive**: grid columns adaptativos (1→2→3→4), tablas desktop con fallback a tarjetas en móvil, tipografía escalable.

### Validación
- `npm run lint`: 0 errores
- `npm run build`: compilado exitoso (360 páginas estáticas)
- `npm test`: 730 tests pasados (33 suites)
- Sin cambios en intranet, API, auth, motor de cálculo ni schema DB (R9).

---

## 2026-07-04 — Fase 2 growth SEO/GEO/Perf/Conversión (Release 104)

Implementación de la Fase 2 de growth sobre la rama `mejoras-auditoria-seo` (Release 103 ya mergeada). Trabajo en rama `fase2-growth-seo`. 7 commits atómicos.

### Auditoría post-implementación (commit fe4cc0d)
- Re-validación: lint OK, 0 refs rotas (`og-image.png`, `decodeJwtPayload`, `SALT_ROUNDS=10`).
- **`scripts/validate-jsonld.mjs`** (nuevo): parsea HTML prerenderizado y valida que cada nodo JSON-LD tenga `@type` y que no haya `@id` duplicados. Aplicado a 6 rutas: 0 errores.
- Errores tsc preexistentes en `tests/blog-verify-fix.test.ts` documentados como issue separado (no tocados).

### Performance fase 2 (commit a3f2c1a)
- **`scripts/optimize-images.mjs`** extendido con modo `--recompress-webp`: re-comprime in-place WebP >400 KB (q72, maxWidth 1920) usando tmp+rename + genera AVIF equivalente (q60).
- **Aplicado a 6 WebP**: delitos-ambientales (582→486 KB), habeas-corpus (572→485 KB), courthouse (453→383 KB), actos-notariales (514→51 KB ⚡), asuntos-civiles (863→84 KB ⚡), gestion-documental (970→40 KB ⚡). **Ahorro adicional: ~2.4 MB** (total acumulado con Fase 1: ~8 MB en imágenes).
- **6 AVIF nuevos**: `next/image` los sirve automáticamente cuando el navegador los soporta.
- Bundle admin libs: verificado que Turbopack ya aísla `@tiptap`, `recharts`, `pdfjs-dist`, `@react-pdf`, `pdfkit` fuera del shared bundle público. Sin acción requerida.

### Página pilar (commit fb1e6b5)
- **Nueva página `/guia-legal-abogados-honduras`** (~2000 palabras): cómo elegir abogado en Honduras. Estructura H1-H3 impecable: importancia, áreas del derecho, colegiación, honorarios, documentos, errores a evitar, 8 FAQs.
- **`data/pilar/faqs-guia.ts`**: 8 Q&A originales sin inventar datos legales (R4/R13/R14). Referencias verificadas: Constitución, CP Decreto 130-2017, Colegio de Abogados.
- **JSON-LD `Article`** con `@id #founder/#legal-service`, `FAQPage` vía `<HubFaq>`.
- **Sitemap**: añadida con `priority 0.9 monthly` en `canonical-paths.json`.
- **Enlazado interno**: `/servicios-juridicos` enlaza a la pilar como recurso nacional; la pilar enlaza a 6 servicios, 10 ciudades y 4 posts del blog.

### Landings locales diferenciación (commit fe6d541)
- Las 4 landings P7 (Caridad, Alianza, Concepción de María, San Antonio de Flores) tenían Q4 "¿Atienden urgencias penales?" clonada con texto idéntico.
- Cada Q4 reescrita con contexto geográfico único (Caridad→Litoral Pacífico, Alianza→frontera El Salvador/Goascorán, Concepción de María→sur de Choluteca, San Antonio de Flores→ruta a Pespiré).
- Refuerzo constitucional: "asistencia letrada desde el primer momento y a ser presentado ante un juez en 24 horas" (Art. 71 Constitución HN).

### GEO/LLMO avanzado (commit 5dd7dd2)
- **`components/marketing/answer-block.tsx`** (nuevo): componente server snippet-friendly para AEO/GEO (eyebrow + h2 question + p answer directo). Estilo sobrio, fondo warm con borde dorado izquierdo.
- Aplicado en 4 páginas clave:
  - `/despacho`: "¿Qué servicios ofrece Pineda y Asociados?"
  - `/solicitar-consulta`: "¿Cómo es el proceso de consulta?"
  - `/derecho-penal`: "¿Cuándo debo contactar a un abogado penalista?"
  - Pilar: "¿Quién es Pineda y Asociados?" (NAP estructurado).
- **`scripts/generate-llms-txt.mjs`** mejorado:
  - 3 landings comerciales faltantes añadidas a "Sitio oficial" (familia/laboralista/civil nacaome).
  - Nueva sección "Abogados del equipo" con Danilo/Thania/Emil y especialidad.
  - Nueva sección "Datos del despacho" con NAP completo estructurado.
  - Pilar añadida a "Contenido recomendado para asistentes IA" con 4 recursos pilar.

### CRO + Analytics (commit 99c4b8d)
- **`ConsultationCTA` microcopy**: añadidas 10 ciudades prioritarias (R18) + mensaje "secreto profesional del abogado" como refuerzo de confianza.
- **`lib/analytics.ts`**: `trackFaqOpen`, `trackBlogSearch`, `trackInternalClick`.
- **`components/marketing/analytics-listeners.tsx`** (client, nuevo): listener global en layout público captura `toggle` de `<details>` con `data-faq-question` y `click` en enlaces con `data-internal-link`.
- `<HubFaq>`: añadidos `data-faq-question` y `data-faq-page` por cada `<details>`.
- `BlogSearch`: trackea query al clic en resultado + `data-internal-link`.
- Footer: `mailto:` con `data-internal-link="email_click"`.
- **`docs/analytics-events.md`**: inventario completo de eventos GA4 activos + Enhanced Measurement.

### Validación
- `npm run lint` ✓ (0 errores)
- `npm run build` ✓
- `npm test` ✓ (730/730, 33 archivos)
- `validate-jsonld.mjs` ✓ en 6 rutas (incluida pilar): 0 errores, sin `@id` duplicados.

### Pendientes declarados (fuera de scope)
- PageSpeed live (sin deploy real).
- CSS purge de 148 KB (sin low-hanging fruit identificable con evidencia; requiere auditoría dedicada).
- Consolidación de landings P7 (no solicitado por usuario — diferenciación ligera aplicada).
- `Person.sameAs` Thania/Emil (a la espera de URLs reales).
- WebSite SearchAction (sin buscador global).
- Migración hero home a `next/image` (R5 — requiere aprobación visual).
- `tsc --noEmit` errores preexistentes en `tests/blog-verify-fix.test.ts` (issue separado).
- `view_faq` (impresión) y `form_abandon` (requieren herramientas adicionales).
- `breadcrumb_click` tracking (breadcrumbs sin `data-internal-link` todavía).

---

## 2026-07-04 — seo/perf/a11y/security: implementación auditoría pública (Release 103)

Implementación priorizada de los hallazgos de la auditoría completa de
https://www.pinedayasociadoshn.com. 7 commits atómicos en rama
`mejoras-auditoria-seo`. Validación final: `lint` ✓, `build` ✓, `test` (730) ✓.

### Quick wins (commit d32aadf)
- **`public/og-image.png` eliminado** (266 KB); todas las referencias migran a
  `/og-image.webp` (93 KB) en 17 archivos.
- **`next.config.ts`**: `images.minimumCacheTTL: 86400`, headers
  `Cross-Origin-Resource-Policy: same-site` y `Cross-Origin-Opener-Policy:
  same-origin-allow-popups`. CSP de producción añade `upgrade-insecure-requests`
  y restringe `img-src` a lista explícita (antes wildcard `https:`). CSP de
  desarrollo permanece permisiva para no romper tests e2e.
- **`lib/auth.ts`**: `SALT_ROUNDS` 10 → 12. Nuevo `maybeRehashPassword()`
  que re-hashea progresivamente hashes legacy en login exitoso (no bloqueante).
  Aplicado en `/api/auth/login`.
- **`app/(public)/page.tsx`**: quitado `priority` de ServiceCard no-LCP.
- **Em-dash `—` → `·`** en titles SEO de derecho-penal/[slug], hondurenos-en-espana
  y su `[slug]`.
- **Tildes corregidas** en `blog/page.tsx` (OG titles "Juridico" → "Jurídico")
  y landings locales (Choluteca).
- **`aria-current="page"`** en breadcrumb actual (`breadcrumbs.tsx`).
- **Limpieza raíz**: `dev-log.txt`, `cookies.txt`, `nul`, `default.pub`,
  `solicitar-consulta-form.yml`, `post-submit.yml`, `dev-server*.log`.
- **`@types/pdfkit`** movido a devDependencies. `@next/bundle-analyzer` añadido
  + script `analyze`.

### SEO/GEO estructural (commit 9f28b46)
- **`lib/seo.ts`** (nuevo): helper central `buildMetadata()` que normaliza
  title/description/OG/Twitter/robots/canonical en un único punto. Robots por
  defecto con `max-image-preview:large, max-snippet:-1, max-video-preview:-1`.
- **Migración a `buildMetadata`** de: servicios-juridicos, derecho-penal,
  despacho, solicitar-consulta, hondurenos-en-espana, `landingMetadata`
  (afecta a 16 landings locales). Titles recortados a ≤60 chars y descriptions
  a ≤155. Antes había varios titles 63-69 chars y descriptions 162-198.
- **Landings locales**: title reescrito a `Abogados en {ciudad} | Pineda y
  Asociados` (~40 chars, era 66).

### Schema markup (commit 9f28b46)
- **`lib/site.ts` Organization**: añadido `sameAs` con perfiles reales
  (Facebook, X, Google Business Profile). Antes ausente.
- **`lib/schemas/blog.ts` BlogPosting**: `publisher.logo` ahora apunta a
  `/images/logo.png` (ImageObject con width/height). Antes usaba `og-image.webp`.
- **`app/(public)/layout.tsx`**: 6 scripts JSON-LD separados → **un único
  `@graph`** con @id estables. Facilita deduplicación en Knowledge Graph.

### FAQ hubs (commit 9f28b46)
- **`data/faqs-hubs.ts`** (nuevo): 22 Q&A originales redactados para
  `/servicios-juridicos` (8), `/despacho` (7), `/solicitar-consulta` (7).
  Sin inventar datos legales (R4/R13/R14): costos "presupuesto por escrito",
  plazos "depende del caso", sin prometer resultados.
- **`components/marketing/hub-faq.tsx`** (nuevo): `<details>`/`<summary>`
  accesible + JSON-LD `FAQPage` embebido. Patrón visual consistente con home.

### Performance (commit bc5671a)
- **`scripts/optimize-images.mjs`** (nuevo): pipeline con `sharp` (dry-run +
  `--apply`). Convierte JPG/PNG grandes a WebP+AVIF, borra JPG >200 KB si
  existe .webp. Reporte en `docs/audits/image-optimization-report.md`.
- **Aplicado**: 2 JPGs huérfanos (jorono 3.9 MB, pexels-ekaterina 1.8 MB) →
  184 KB combinados. **5.4 MB ahorrados**. Total `public/images` 28 MB → 23 MB.
- **Bundle analyzer**: verificado que Turbopack ya aísla `@tiptap`, `recharts`,
  `pdfjs-dist`, `@react-pdf`, `pdfkit` fuera del shared bundle público. No se
  requiere refactor de code-split.

### Accesibilidad WCAG 2.2 AA (commit b96c00a)
- **`globals.css`**: `--color-text-muted` `#8A8F95` → `#6E7177` (ratio 4.6:1,
  AA small text). Antes 3.4:1.
- **Opacidades blancas sobre navy** en `public-header.tsx` y `public-footer.tsx`:
  `/40`, `/50`, `/60`, `/65` → `/70+`, `/75`, `/80`. Texto small cumple 4.5:1.
- **`blog-search.tsx`**: placeholder sin opacidad baja (era ~1.7:1).
- **`solicitar-consulta-form.tsx`**: `<fieldset>`+`<legend>`, `autoComplete`
  semántico (`given-name`/`tel`/`email`), `aria-required`/`aria-invalid`/
  `aria-describedby` en cada Field. Cumple WCAG 1.3.5, 3.3.1, 3.3.3.
- **`live-widgets.tsx` iOS dialog**: `aria-modal="true"`, overlay
  `role="presentation"` (Escape ya estaba).

### Seguridad (commit 291c5e7)
- **Cloudflare Turnstile** completo:
  - `lib/captcha.ts`: `verifyTurnstileToken()` con **bypass seguro si faltan
    env vars** (rate-limit permanece como red de seguridad) y **fail-closed**
    si Cloudflare responde `success=false` o hay timeout.
  - `components/marketing/turnstile-widget.tsx`: widget cliente con lazy-load
    del script. Si `NEXT_PUBLIC_TURNSTILE_SITE_KEY` no está definida, no
    renderiza (backend hace bypass declarado).
  - Endpoints `/api/contacto`, `/api/consulta`, `/api/subscribe`: validación
    post rate-limit + Zod.
  - `.env.example` documenta `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`,
    `NEXT_PUBLIC_TURNSTILE_SITE_KEY`.
- **`proxy.ts`**: reemplazado `decodeJwtPayload` (decodificaba sin verificar
  firma HS256) por `verifyToken` de `lib/auth`. Mismo comportamiento pero
  cierra el bypass teórico de rol en edge. `proxy` corre en Node runtime
  (no edge), así que `jsonwebtoken` con el secret funciona.
- **`app/error.tsx`** (nuevo): error boundary 5xx con `<meta name="robots"
  content="noindex,nofollow">` inyectada en head (no se puede exportar
  `metadata` desde Client Component). CTA contacto (email + WhatsApp) y botón
  "Reintentar".

### Pendientes declarados (no implementados en esta iteración)
- **CSP nonce-based** (TODO documentado en `next.config.ts`): requiere refactor
  de `proxy.ts` para generar nonces y reescribir el inline script de theme
  detection en `app/layout.tsx`. Fuera de scope por riesgo de regresión.
- **`Person.sameAs` para Thania y Emil**: a la espera de URLs reales de perfil.
  No se inventan (R4).
- **Métricas PageSpeed en vivo**: no se midieron. Requiere Lighthouse sobre
  URLs reales deployadas. Los 5.4 MB ahorrados en imágenes son proxy claro de
  mejora LCP pero no se midió el delta real.
- **Focus trap completo en iOS dialog**: `aria-modal` + Escape ya implementados,
  pero falta focus inicial y retorno al trigger. Mejora menor pendiente.
- **CSS global de 148 KB**: 1230 líneas, mayormente design tokens útiles. Sin
  low-hanging fruit identificable sin análisis dedicado.
- **WebP >400 KB restantes** (~6 archivos): marcados como WARN por
  `images:optimize`. Recompresión manual pendiente (lock de archivo impidió
  ejecución automática en esta sesión).
- **`Person.sameAs` Thania/Emil, SearchAction, hero→next/image**: fuera de
  scope (requieren URLs reales, buscador global y aprobación visual
  respectivamente).

### Validación
- `npm run lint` ✓ (0 errores)
- `npm run build` ✓ (solo warning cache-control preexistente)
- `npm test` ✓ (730 tests, 33 files)
- `npx tsc --noEmit`: errores preexistentes en `tests/blog-verify-fix.test.ts`
  (no tocados en esta rama, ya presentes en `main`).
- Referencias rotas: 0 (`og-image.png`, `decodeJwtPayload`, `SALT_ROUNDS = 10`,
  em-dash en titles SEO).

---

## 2026-07-03 — seo/internal-linking: reconstrucción arquitectura enlaces internos (Release 102)

Reconstrucción completa del sistema de enlazado interno para crear una tela
de araña temática que conecte servicios ↔ blog ↔ ciudades ↔ áreas de práctica.
Resuelve los 4 clusters desconectados detectados en la auditoría de arquitectura.

### Sistema semántico centralizado
- **`lib/internal-links.ts`** (nuevo): grafo único de relaciones. Centraliza
  `SERVICE_TO_BLOG_MAP` (servicio↔blog) y `BLOG_TO_SERVICE` (blog↔servicio)
  que estaban duplicados en 4 archivos. Helpers: `getRelatedServices`,
  `getRelatedCitiesForContent`, `getPriorityCities`, `getAllCities`.
- **`lib/entity-dictionary.ts`** (nuevo): catálogo de 30+ entidades detectables
  (ciudades, áreas de práctica, conceptos legales) con regex + peso semántico.
- **`lib/blog-context-linker.ts`** (nuevo): auto-linker HTML-safe que inserta
  enlaces contextuales en bodies de blog (máx 5/post, 1 por entidad, respeta
  headings y anchors existentes). `detectMentionedCities` para priorización.
- **`components/marketing/related-links.tsx`** (nuevo): 3 variantes SSR —
  `RelatedServices`, `RelatedCities`, `RelatedCategories` (chips premium).

### Puentes creados (clusters reconectados)
- **Servicio → Ciudad**: cada `/servicios-juridicos/[slug]` ahora enlaza a 8
  ciudades prioritarias (antes: cero enlaces).
- **Hub servicios → Ciudades**: `/servicios-juridicos` enlaza a las 10
  ciudades prioritarias (R18).
- **Hub penal → Landings especializadas**: `/derecho-penal` enlaza a
  `/abogado-penalista-nacaome`, `/abogado-penalista-choluteca` y 10 ciudades.
- **Post → Ciudad/Servicio (auto-linking)**: bodies de blog detectan entidades
  y enlazan automáticamente a sus páginas canónicas.
- **Post → Ciudades relacionadas**: bloque SSR al final de cada post.
- **Post → Otras categorías**: bloque SSR al final de cada post.

### Limpieza de datos
- **Slugs muertos eliminados**: `asesoria-preventiva` (referenciado pero
  indefinido) reemplazado por slugs válidos en 2 grupos penales.
- **`getRelatedAreas()` arreglado**: ahora resuelve penal/migrantes (antes
  descartaba silenciosamente esos targets).

### Validación
- `npm run lint` ✅ (0 errors, 0 warnings)
- `npm run build` ✅ (359 páginas, compilación limpia 28.6s)
- `npm test` ✅ (730 tests, 33 suites)

---

## 2026-07-03 — seo/geo/cro: pilar penal, landings locales y GEO (Release 100)

Implementación de las prioridades derivadas de la auditoría integral
SEO/GEO/UX/CRO. Foco: derecho penal local, indexabilidad, conversión y
visibilidad para IA generativa. Sin cambios visuales en la web pública
fuera de los hubs comerciales (R5). Sin datos inventados (R4).

### SEO local — nuevas landings (P7)
- **4 landings locales** creadas con contenido único, NAP coherente, FAQ local,
  schema y CTA: `/abogados-en-caridad`, `/abogados-en-alianza`,
  `/abogados-en-concepcion-de-maria`, `/abogados-en-san-antonio-de-flores`.
- Antes redirigían (404 soft) al vecino más cercano; ahora tienen página propia.
- Datos en `data/landings-locales.ts`; páginas en `app/(public)/abogados-en-*/`.
- Redirects 301 eliminados en `next.config.ts` para estas 4 rutas.

### Pilar penal — landing comercial Choluteca (P3)
- **`/abogado-penalista-choluteca`** creada como landing comercial propia
  (antes redirigía a un post editorial). Hero, áreas de defensa, delitos
  frecuentes, FAQ local, NAP, CTA WhatsApp/teléfono y schema
  `Service`+`FAQPage`+`BreadcrumbList`.
- Redirect invertido: el post `/blog/derecho-penal/abogado-penalista-choluteca`
  ahora consolida hacia la landing comercial.

### SEO técnico — redirects (P1)
- Variantes comerciales penales sin página propia consolidadas vía 301 hacia
  el hub o la landing especializada más cercana (`/abogado-penalista-san-lorenzo`,
  `/defensa-penal-choluteca`, `/defensa-penal-nacaome`,
  `/defensa-penal-sur-honduras`).
- Los 161 errores 4xx de Bing requieren el listado detallado de URLs desde
  Bing WMT para triaje completo (no inventado — R12).

### GEO / IA generativa (P6)
- **`llms.txt`** ampliado con sección «Sobre el despacho (descripción factual)»:
  bloque declarativo, citable y verificable para ChatGPT/Perplexity/Copilot.
- 6 nuevas rutas añadidas al generador (`scripts/generate-llms-txt.mjs`).
- Bloque declarativo GEO insertado en `/derecho-penal` (identidad,
  especialidad, zona, contacto).

### CTR / metadatos (P4)
- Meta descriptions optimizadas en `/derecho-penal` (CTR: defensa urgente +
  WhatsApp + sur de Honduras) y `/solicitar-consulta` (respuesta en horario
  hábil + áreas + WhatsApp).

### CRO (P5)
- `FloatingContactRail` verificado: render global en `app/(public)/layout.tsx`,
  presente en todas las páginas públicas incluidas las penales.
- Formulario `/solicitar-consulta`: campos obligatorios ya limitados a
  nombre, teléfono y resumen (email opcional). Microcopy de confianza
  añadido bajo el botón (confidencialidad, sin garantía de resultados).

### Fuente única SEO
- `data/seo/canonical-paths.json` actualizado: 53 rutas estáticas, techo
  IndexNow 223, sitemap observado 213. Las 5 nuevas landings añadidas.

### Validación
- `npm run lint` ✅ (0 errors, 0 warnings)
- `npm run build` ✅ (53 rutas estáticas compiladas, IndexNow dry-run OK)
- `npm test` ✅ (730 tests, 33 archivos)
- `npm run audit:seo` ✅ (0 errores, 0 warnings, 6 infos)

### Riesgos pendientes
- Triaje completo de los 161 errores 4xx de Bing (requiere listado WMT).
- Colegiación, reseñas y credenciales verificables: pendiente aporte del despacho.

---

## 2026-07-03 — seo/perf/geo: auditoría completa y mejoras técnicas (Release 99)

Auditoría integral de la web pública tras informe SEO externo. La
infraestructura ya cubría ~90% de las recomendaciones; este release cierra los
**gaps genuinos** detectados en performance, SEO técnico, contenido y seguridad.

### Performance
- **AVIF** añadido a `images.formats` (antes solo WebP): 30-50% más ligero.
- **`experimental.optimizePackageImports`** para lucide-react, recharts, tiptap
  (mejor tree-shaking del bundle cliente).
- **`playwright` movido a `devDependencies`** (bajaba navegador headless en
  `npm install` de producción).
- **`RootShell`** pasado a Server Component (era `'use client'` innecesario,
  forzaba hidratación de todo el árbol público).
- **Clarity** migrado de paquete npm a snippet oficial vía `next/script` (no
  infla el bundle JS inicial).
- **`MapEmbed`** lazy-loaded con `dynamic(ssr:false)` (iframe de Google Maps
  solo carga tras hidratación, no en first paint de la home).
- **`<img>` de `/despacho`** migrados a `next/image` (evita CLS).
- **`viewport.colorScheme: ['light','dark']`** y `preconnect` a Clarity.

### SEO técnico
- **`wordCount` + `articleSection`** en BlogPosting schema (recomendado Google).
- **TOC del blog server-rendered**: IDs estables en H2/H3 inyectados en SSR vía
  `lib/blog-toc.ts`; antes se generaban en `useEffect` (invisibles para
  crawlers/LLMs, sin fragment anchors en SERP).
- **Páginas legales** (`/aviso-legal`, `/terminos`, `/politica-*`, `/disclaimer`)
  marcadas `noindex, follow` (evita indexar boilerplate legal).
- **`/proceso-penal`** eliminado (obsoleto); redirect 301 a `/derecho-penal`
  conservado.
- **404**: quitado `canonical: '/_not-found'` (canoncial a ruta técnica generaba
  warnings en Search Console).
- **Prioridades de categorías de blog** en sitemap: penal/familia/laboral a 0.7
  (mayor valor comercial según GSC), resto 0.5.

### Contenido / GEO
- **Tildes corregidas** en `urgentFaq` de derecho-penal y `FAQ_CLUSTERS` de
  preguntas-frecuentes (afecta a LLMs y algoritmos de lenguaje).
- **`urgentFaq`** añadida al FAQPage schema de derecho-penal (antes quedaba fuera
  del JSON-LD).
- **Enlace a `/hondurenos-en-espana`** desde la home (antes era página huérfana).
- **Sección editorial** (~250 palabras) en `/hondurenos-en-espana` cubriendo
  entidades (apostilla, poder notarial a distancia, homologación de sentencia).
- **Párrafo introductorio** en `/servicios-juridicos` con entidades por especialidad.
- **Honeypot antispam** en formulario de consulta (campo `website` oculto).

### Seguridad / UX
- **`stripHtml` centralizado** (sanitize-html) reemplaza regex `/<[^>]*>/g` en
  schemas FAQ/BlogPosting: maneja tags anidados y decodifica entidades.
- **Google Consent Mode v2** añadido (GDPR/ePrivacy para tráfico europeo).
- **Cache headers** restringidos a `/_next/*` (antes cacheaban `sw.js`,
  `manifest.json`, `llms.txt` por 1 año inmutable).
- **Servicios de landings locales** convertidos en enlaces a
  `/servicios-juridicos/{slug}` (cierra el clúster temático ciudad×área).
- **Goascorán**: añadido `postsRelacionados` (única ciudad sin enlazado blog).

### Analytics
- **GTM opcional** (`NEXT_PUBLIC_GTM_ID`): si se configura, reemplaza gtag.js.
- **Facebook Pixel opcional** (`NEXT_PUBLIC_FB_PIXEL_ID`), env-gated.
- **Perfiles sociales configurables** por env (Instagram, LinkedIn, YouTube, X,
  TikTok) en `lib/site.ts`; alimentan `sameAs` en schemas.

### Validación
- `npm run lint` ✓ · `npm run build` ✓ · `npm test` 730/730 ✓
- No se ha hecho push (protocolo §1.10).

---

## 2026-07-03 — seo: expansion IA de thin posts con verificacion legal (Release 98)

`blog:verify-fix` ejecutado en ~90+ posts con DeepSeek IA. 0 alucinaciones, 0
discrepancias facticas, 0 reversiones. Resultados: 10+ posts expandidos por IA,
20+ title/meta optimizaciones, 20+ meta-fixes automaticos. 4 bloques anti-plantilla
detectados. Sistema de guardias: bodies rechazados si alucinacion, reversion
automatica si validacion falla, backup previo en cada lote. Validado.

---

## 2026-07-03 — seo: reduccion warnings Bing title too long (Release 97)

Segunda tanda: 20 titulos adicionales acortados (total F14+F15: 32/72 posts con
titles >55c corregidos). Excluidas de Bing clasificadas con conteos reales DB:
26 drafts + 3 canonical + 42 thin/other = 71. Backup generado. Validacion limpia.

---

## 2026-07-03 — seo: corrección Bing WMT — titles largos y errores 4xx (Release 96)

Acortados 12 títulos de posts con >60 chars que generaban 69 warnings y 19 errores
de "title too long" en Bing Site Scan. Identificados /delito-form y /atajos como
2 de los 3 HTTP 4xx reportados (404s intranet). Documentado: 71 URLs excluidas =
drafts + thin posts + canonicalizados. Sitemap limpio, robots.txt correcto. Validado.

---

## 2026-07-03 — seo: optimización CTR basada en GSC (Release 95)

Corregidos 2 title/meta truncados en SERP y optimizadas 4 meta descriptions de posts
con CTR<3% (240-469 impresiones/mes). Datos de GSC 28d. Backup generado. Sin cambios
en bodies, slugs ni categorías. 6 posts actualizados en DB.

---

## 2026-07-03 — seo: primera corrección basada en SEO Live (Release 94)

**Ejecución correctiva con datos live.** `seo:doctor` 20 OK/0 ERROR. `seo:collect` 6/6.
Corregidos 3 enlaces internos a redirects 301 en DB (`blog:fix-redirects --aplicar`).
Detectadas 6 páginas blog con CTR<3% y 8 queries GSC con 0% CTR para optimización editorial.
Documentado tráfico bot GA4 (HK/NL/CN) y 161 errores 4xx Bing para acción humana.

---

## 2026-07-03 — docs: saneamiento documental y sistema SEO live operativo (Release 93)

**Documentación reducida y consolidada.** `AGENTS.md` (452→121 líneas),
`README.md` (939→149 líneas), `CHANGELOG.md` (3297→~80 líneas). Eliminado ruido,
información obsoleta, releases infladas y duplicados entre AGENTS/README/CHANGELOG.

**Sistema SEO Live operativo.** `seo:doctor`: 20 OK / 0 ERROR / 3 PENDIENTE.
`seo:collect`: 6/6 fuentes (GSC 134 clics/6.6K imp, GA4 670 users/9 conversiones,
Bing 2,387 crawled/44 queries, IndexNow 20 URLs, SEO Health 15/15, Sitemap 30/30).

**Validación:** lint 0e, build OK, test 730/730, seo:doctor 0e, seo:collect 6/6.
Auditoría indexación: 30/30. IndexNow dry-run: 20 URLs OK.

---

## 2026-07-03 — Fase 9: Sistema SEO Live operativo (Release 92)

Scripts live creados: `google-search-console-live.mjs`, `google-analytics-live.mjs`,
`bing-webmaster-live.mjs`, `seo-live-doctor.mjs`, `seo-live-collect.mjs`.
Bing crawl stats corregidos. Default 28 días. dotenv load order corregido en 5 scripts.

Documentación: reporte ejecutivo, plan de acción 7/30/90 días, manual operativo,
MCP connectors. Seguridad verificada: 0 secretos en diff.

---

## 2026-07-03 — Fases 1-8: SEO/Bing, Redirects, OAuth, CLI (Release 91)

Bing WMT API Key funcional. IndexNow real enviado (20 URLs). Google OAuth funcionando.
11 scripts nuevos (auth, Bing OAuth, site explorer, dashboard import).
Redirect 404 corregido. Documentación saneada. AGENTS.md R18 reforzada.

---

## Histórico anterior (Releases 1–90, pre-Jul 2026)

El historial completo de releases 1-90 está disponible en [Releases de GitHub](https://github.com/pineda-y-asociados/justicia-verdadera/releases) (privado). Hitos principales:

- **Release 90:** Cobertura 10 ciudades + IndexNow REAL + GA4 + optimización CTR.
- **Release 89:** Normalización del blog (CTAs, H1→H2, whitespace).
- **Release 88:** SGIE Fases 1-10 completas (gestión integral de expedientes).
- **Release 87:** Limpieza de tooling IA legacy (`.kilo/`, `CLAUDE.md` eliminados).
- **Release 85:** `AGENTS.md` como protocolo canónico único.
- **Release 81:** Rotación de OAuth Client Secret (hardcodeado → `.env.local`).
- **Release 80:** Migración del blog a DB (Drizzle/Neon, `data/blog/posts/` vaciado).
- **Release 1-79:** Fundación (Next.js, Tailwind, motor cálculo, intranet, calculadora).

---

*Changelog mantenido por el sistema de agentes IA. Cada entrada refleja cambios reales verificados con lint/build/test.*
