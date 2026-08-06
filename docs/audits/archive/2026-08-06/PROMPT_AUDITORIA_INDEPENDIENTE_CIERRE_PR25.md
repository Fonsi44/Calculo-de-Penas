# PROMPT — AUDITORÍA INDEPENDIENTE DE CIERRE DEL PR #25 CONTRA EL PLAN MAESTRO SEO/GEO

## Rol y modo obligatorio

Actúa como **auditor técnico senior independiente**, no como continuador complaciente de la implementación anterior.

Declara al comenzar:

```text
MODO = AUDITORÍA
ESCRITURA EN REPOSITORIO = PROHIBIDA
COMMITS = PROHIBIDOS
PUSH = PROHIBIDO
MERGE = PROHIBIDO
DEPLOY = PROHIBIDO
MIGRACIONES = PROHIBIDAS
LLAMADAS EXTERNAS = SOLO LECTURA/GET
```

Lee primero `AGENTS.md` completo y respeta especialmente sus modos de operación, preservación del árbol de trabajo, fuentes de verdad, seguridad, Git, validaciones y formato de entrega.

Esta ejecución es exclusivamente de inspección y verificación. No debes corregir archivos, crear informes dentro del repositorio, modificar el PR, resolver conversaciones, marcarlo Ready, hacer merge, desplegar ni aplicar migraciones.

---

# 1. Objetivo

Realizar una **auditoría completa, adversarial y basada en evidencias** del repositorio y del PR:

```text
Repositorio: Fonsi44/Calculo-de-Penas
PR: #25
Base: main
Head: feat/seo-geo-master-implementation
HEAD remoto esperado al iniciar: 63dc2f0f6d5113ff6f3bde14a01bcf43cee742dc
```

El objetivo es determinar con precisión:

1. qué partes del plan maestro están realmente implementadas;
2. qué partes están únicamente documentadas o afirmadas, pero no demostradas;
3. qué validaciones son reproducibles;
4. qué validaciones dependen de staging, secretos o comprobación humana;
5. qué regresiones, inconsistencias, deuda técnica o riesgos siguen abiertos;
6. si el PR está realmente cerca de terminar;
7. qué trabajo mínimo falta antes de autorizar merge y producción.

No aceptes porcentajes, documentos de cierre, CSV, ledgers, comentarios del PR ni resultados históricos como prueba suficiente por sí solos. Cada afirmación importante debe enlazarse con código, diff, test, workflow, log, artefacto reproducible o comprobación directa.

---

# 2. Fuentes canónicas que debes contrastar

Lee y cruza como mínimo:

```text
AGENTS.md
docs/roadmaps/completed/plan-maestro-seo-geo-contenido-2026-07-28.md
docs/seo/current/master-implementation-status.md
docs/seo/current/master-plan-implementation-ledger.csv
docs/seo/current/pr25-final-technical-closure.md
docs/audits/current/final-release-readiness.csv
docs/audits/current/pr25-final-diff-inventory.csv
docs/audits/current/seo-geo-master-final-ledger.csv
docs/operations/final-manual-production-checklist.md
docs/audits/current/manual-form-validation-preflight.md
docs/audits/current/preview-production-database-isolation-incident.md
package.json
.github/workflows/*
```

También inspecciona todas las rutas de código, migraciones, scripts, tests, datos y documentación modificadas por el PR. No excluyas archivos por tamaño o por haber sido generados.

---

# 3. Comprobación inicial obligatoria

Antes de evaluar la implementación, registra:

```bash
git status --short --branch
git rev-parse HEAD
git rev-parse origin/main
git rev-parse origin/feat/seo-geo-master-implementation
git branch --show-current
git diff --check
git diff --name-status
git diff --cached --name-status
git log --oneline --decorate -n 20
```

Después consulta GitHub en modo solo lectura usando `gh` o API:

```bash
gh pr view 25 --repo Fonsi44/Calculo-de-Penas \
  --json number,state,isDraft,mergeable,baseRefName,headRefName,headRefOid,commits,files,additions,deletions,statusCheckRollup,url,title,body

gh pr checks 25 --repo Fonsi44/Calculo-de-Penas
gh pr diff 25 --repo Fonsi44/Calculo-de-Penas --name-only
gh api repos/Fonsi44/Calculo-de-Penas/pulls/25/files --paginate
gh api repos/Fonsi44/Calculo-de-Penas/pulls/25/reviews --paginate
gh api repos/Fonsi44/Calculo-de-Penas/pulls/25/comments --paginate
gh api repos/Fonsi44/Calculo-de-Penas/issues/25/comments --paginate
```

Confirma o corrige estos datos observados previamente:

```text
PR OPEN
PR DRAFT
PR UNMERGED
mergeable = true
94 commits
306 archivos modificados
32.076 adiciones
1.702 eliminaciones
HEAD remoto = 63dc2f0f...
CI = SUCCESS
Lighthouse CI = SUCCESS
Vercel = SUCCESS
GitGuardian = FAILURE por incidente 35247669
review threads = 0
```

Si cualquiera cambió, usa el estado actual y documenta la diferencia.

## Advertencia sobre el árbol local

Existe o existió un cambio local preexistente sin stagear en:

```text
app/(public)/blog/page.tsx
```

No lo modifiques, no lo stages y no lo descartes.

Debes separar claramente:

1. **estado remoto auditado del PR**;
2. **estado local adicional no contenido en GitHub**;
3. impacto potencial de ese delta local;
4. si dicho delta debe resolverse antes de cualquier merge.

Una auditoría exclusivamente remota no puede declarar validado un cambio local no commitado.

---

# 4. Auditoría de integridad Git y del PR

Comprueba:

- que la rama head desciende legítimamente de la base;
- que no hay commits inesperados, merges accidentales o reescrituras;
- que el PR no está atrasado respecto a `main`;
- que los 94 commits tienen alcance coherente;
- que no hay archivos binarios, temporales, secretos, dumps, backups o outputs live indebidamente versionados;
- que `.gitignore` no permite accidentalmente fuentes sensibles;
- que los archivos con `0 additions / 0 deletions` en la API no sean blobs opacos o evidencia imposible de revisar;
- que el diff real coincide con el inventario documental;
- que no existan modificaciones fuera del alcance SEO/GEO, formularios, accesibilidad y seguridad declarados;
- que web pública, intranet, SGIE y administración sigan aislados;
- que no se haya modificado producción desde el PR;
- que no exista una migración aplicada de forma implícita por build, startup, preview o script.

Detecta documentación obsoleta o inconsistente. Como mínimo, verifica:

- el cuerpo del PR todavía cita checks de un HEAD anterior (`6fba987c`) aunque el HEAD actual sea `63dc2f0f...`;
- URLs de Preview y SHA de deployment históricos frente al deployment actual;
- diferencias entre `master-implementation-status.md`, `pr25-final-technical-closure.md`, el cuerpo del PR y GitHub;
- cualquier documento que diga “cerrado”, “listo”, “100 %” o equivalente sin corresponder al HEAD actual.

Clasifica cada inconsistencia como:

```text
STALE_BUT_HARMLESS
MISLEADING_RELEASE_EVIDENCE
MERGE_BLOCKER
```

---

# 5. Matriz completa del plan maestro

Convierte el plan maestro en una matriz auditable con **una fila por requisito verificable**.

Incluye como mínimo:

```text
ID
sección_del_plan
requisito
estado
evidencia_primaria
archivo_o_ruta
test_o_comando
resultado_reproducido
dependencia_externa
riesgo
acción_restante
```

Estados permitidos:

```text
IMPLEMENTADO_Y_REPRODUCIDO
IMPLEMENTADO_NO_REPRODUCIDO
PARCIAL
SOLO_DOCUMENTADO
BLOQUEADO_EXTERNO
NO_IMPLEMENTADO
NO_APLICA_JUSTIFICADO
CONTRADICCIÓN
```

No agrupes toda una fase como completada si contiene requisitos individuales sin validar.

Debes cubrir las secciones 0–26 del plan, sus fases, gates, entregables y la **Definition of Done** completa.

Verifica especialmente:

- fuente única de identidad;
- nombres canónicos de los tres abogados;
- perfiles individuales;
- autoría humana;
- revisión jurídica real;
- estados editoriales;
- artículos pending fuera del sitemap y módulos públicos;
- home como URL dominante para “abogados en Nacaome”;
- canibalización;
- landings municipales;
- FAQ;
- enlazado interno;
- metadata y títulos;
- JSON-LD;
- breadcrumbs;
- `llms.txt`;
- CTAs;
- formularios;
- inventario completo del blog;
- SEO técnico;
- Search Console;
- tests automáticos;
- entregables previstos.

---

# 6. Auditoría del blog y de la integridad editorial

Audita directamente:

```text
lib/blog.ts
lib/blog-db.ts
lib/blog-attribution.ts
lib/legal-review.ts
lib/editorial-cutover.ts
lib/editorial-signature.ts
lib/preview-blog-fixtures.ts
lib/blog-html-sanitizer.ts
lib/blog-table-transformer.ts
lib/blog-link-normalizer.ts
lib/blog-pagination.ts
data/blog/*
data/seo/*
drizzle/migrations/0059_blog_editorial_signatures.sql
lib/db/schema/core.ts
app/(public)/blog/**
```

Demuestra o refuta:

- 175 artículos totales;
- 135 publicados;
- 40 pendientes;
- 135 firmas válidas;
- cero cambios de body, hash, firma, fecha o estado en contenidos históricos;
- ausencia de propuestas pending en el render público;
- ausencia de fallback silencioso a fixtures limitados;
- comportamiento seguro cuando la DB devuelve cero filas;
- separación real entre Preview, staging y Production;
- compatibilidad cuando `EDITORIAL_SIGNATURE_SCHEMA_READY=false`;
- comportamiento cuando se activa `true`;
- imposibilidad de activar cutover sin aprobación humana válida;
- imposibilidad de publicar propuestas mediante variables mal configuradas;
- que los redirects y canonicals preservan rutas históricas;
- paginación completa, estable y sin duplicados;
- búsqueda sobre el universo completo;
- exclusión correcta de pendientes;
- un único disclaimer;
- equivalencia de tablas transformadas;
- rechazo seguro de tablas complejas;
- que sanitización no elimina información silenciosamente;
- que no hay N+1, cargas completas innecesarias ni regresiones relevantes de rendimiento.

Inspecciona la migración `0059` como si fuera a entrar en producción:

- idempotencia;
- locks;
- defaults;
- nullability;
- índices;
- compatibilidad hacia atrás;
- rollback real;
- orden de despliegue;
- lectura por código antiguo;
- escritura por código nuevo;
- recuperación ante migración parcial;
- riesgo de pérdida o invalidación de firmas.

No apliques ninguna migración.

---

# 7. SEO técnico, GEO y arquitectura pública

Audita código y salida construida para:

- canonical autorreferente correcto;
- una sola variante `www`;
- HTTPS;
- robots;
- sitemap index;
- sitemaps separados;
- exclusión de noindex, drafts, redirects, 404, filtros y pendientes;
- `lastmod` real;
- redirect 301;
- 410 cuando corresponda;
- búsqueda interna no indexable;
- Preview, intranet y admin no indexables;
- un H1;
- jerarquía H2/H3;
- `lang=es-HN`;
- HTML crítico rastreable;
- enlaces HTML reales;
- imágenes con dimensiones;
- alt;
- tablas accesibles o transformación equivalente;
- IDs de encabezados;
- metadata única;
- títulos no truncados;
- `Article`/`BlogPosting`;
- `Person`;
- `ProfilePage`;
- `Organization`;
- `LegalService`;
- `WebSite`;
- `BreadcrumbList`;
- author/reviewer enlazables;
- paridad entre HTML y JSON-LD;
- ausencia de claims no verificados;
- `llms.txt` generado desde datos canónicos y sin pending.

Haz muestreo adversarial sobre páginas prioritarias y, cuando sea posible, valida todas mediante scripts.

---

# 8. Seguridad, privacidad y formularios

Audita como mínimo:

```text
app/api/consulta/route.ts
app/api/contacto/route.ts
app/api/email/inbound/route.ts
app/api/public-config/route.ts
app/api/revalidate/route.ts
app/api/whatsapp/route.ts
components/marketing/solicitar-consulta-form.tsx
components/marketing/turnstile-widget.tsx
lib/captcha.ts
lib/email.ts
lib/safe-public-form-logger.ts
proxy.ts
next.config.ts
.env.example
```

Comprueba:

- Zod;
- límites de tamaño;
- rate limit;
- CSRF/origin cuando corresponda;
- Turnstile cliente/servidor;
- fail-open/fail-closed explícito;
- bypass accidental;
- enumeración;
- replay;
- SSRF;
- open redirect;
- inyección de cabeceras;
- HTML/email injection;
- PII en logs;
- secretos en respuestas;
- secretos en cliente;
- configuración pública mínima;
- inbound email autenticado;
- revalidación protegida;
- WhatsApp sin filtraciones;
- CSP;
- cookies;
- caché;
- errores sin datos sensibles;
- degradación segura cuando faltan variables.

Inspecciona el hallazgo de GitGuardian `35247669` sin revelar su valor.

Determina independientemente si es:

```text
TRUE_SECRET
FALSE_POSITIVE_EDITORIAL_HASH
INDETERMINATE_REQUIRES_OWNER
```

No aceptes la clasificación previa sin revisar tipo, archivo, contexto, uso y entropía. No reescribas historial.

---

# 9. CI, workflows y reproducibilidad

Inspecciona todos los workflows y los logs del HEAD actual.

Distingue con precisión:

```text
VALIDADO_EN_GITHUB_ACTIONS
VALIDADO_SOLO_LOCALMENTE
VALIDADO_SOLO_EN_PREVIEW
VALIDADO_MANUALMENTE
NO_REPRODUCIDO
BLOQUEADO_POR_SECRETOS
```

Verifica que CI realmente ejecute lo que afirma la documentación.

Audita:

- `npm run verify`;
- lint;
- typecheck;
- unit tests;
- build;
- knip;
- Lighthouse;
- E2E;
- contratos SEO;
- contratos de seguridad;
- accesibilidad;
- tablas;
- staging DB;
- artefactos;
- cache;
- variables placeholder;
- condiciones que omiten jobs;
- `continue-on-error`;
- exclusiones;
- tests flakey;
- assertions hardcodeadas;
- mocks que invaliden el resultado;
- evidencia generada antes o después del commit correcto.

Confirma especialmente la afirmación:

```text
REMOTE_TABLE_GATE = BLOCKED_BY_MISSING_STAGING_SECRETS
```

Determina si esto es aceptable para merge o si debe añadirse un gate remoto reproducible antes de producción.

---

# 10. Validaciones locales

Sin modificar archivos tracked, ejecuta la batería proporcionada por el repositorio.

Primero inventaría scripts relevantes desde `package.json`. Después ejecuta, como mínimo, si el entorno lo permite:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run verify
```

Ejecuta también todos los gates SEO/GEO, seguridad, accesibilidad, crawl, FAQ, perfiles, claims, blog, paginación, tablas, migraciones y readiness que el propio PR declare como obligatorios.

No des por PASS un comando:

- no ejecutado;
- abortado;
- saltado;
- ejecutado con fixtures distintos de producción;
- ejecutado contra una DB incorrecta;
- que use evidencia antigua;
- que genere resultado hardcodeado;
- que ignore errores;
- que requiera secretos inexistentes.

Para cada comando registra:

```text
comando
exit_code
duración
entorno
fuente_de_datos
SHA_auditado
resultado
advertencias
artefactos
```

Los outputs efímeros no deben quedar versionados. Al finalizar comprueba que el árbol tracked permanece igual.

---

# 11. Revisión manual del Preview

Obtén la Preview correspondiente al **HEAD actual**, no reutilices una URL histórica sin comprobar el deployment SHA.

En modo lectura, valida:

- home;
- despacho;
- servicios;
- perfiles;
- blog;
- categorías;
- artículos prioritarios;
- FAQ;
- formularios;
- sitemap;
- robots;
- `llms.txt`;
- redirects;
- 404;
- móvil;
- dark mode;
- impresión;
- consola;
- hidratación;
- accesibilidad;
- overflow;
- CTAs;
- enlaces;
- ausencia de pending;
- ausencia de datos de staging visibles.

No envíes formularios reales ni provoques efectos externos.

Para Turnstile, persistencia y correo, limita la auditoría a preflight y diseño técnico. Clasifica la prueba end-to-end real como manual pendiente si requiere enviar datos o email.

---

# 12. Búsqueda de regresiones y deuda técnica

Haz una revisión específica de:

- código muerto;
- scripts duplicados;
- helpers solapados;
- fuentes de verdad duplicadas;
- flags incompatibles;
- defaults peligrosos;
- variables no documentadas;
- migraciones manuales fuera de Drizzle;
- archivos generados versionados sin necesidad;
- tests que prueban implementación en lugar de comportamiento;
- snapshots frágiles;
- cobertura insuficiente en ramas críticas;
- problemas de caché en Next.js;
- dinámico/estático incorrecto;
- acceso DB durante build;
- uso de placeholders en producción;
- errores de tipado ocultos;
- casts inseguros;
- `try/catch` que silencien errores;
- performance;
- accesibilidad;
- seguridad;
- SEO;
- mantenibilidad.

No propongas refactors cosméticos si no reducen un riesgo real del merge.

---

# 13. Criterio de veredicto

El veredicto final debe ser uno de estos:

```text
READY_FOR_OWNER_MANUAL_GATES
READY_FOR_MERGE
FIXES_REQUIRED_BEFORE_MERGE
NOT_READY
BLOCKED_BY_EXTERNAL_DEPENDENCIES
```

No declares `READY_FOR_MERGE` mientras exista cualquiera de estos casos:

- defecto P0 o P1;
- documentación de release materialmente falsa;
- HEAD no auditado por los gates;
- migración productiva insegura;
- pérdida o sustitución de contenido;
- mezcla Preview/Production;
- fallo de seguridad no resuelto;
- secretos reales;
- CI verde por omisiones críticas;
- cambio local relevante no resuelto;
- pruebas manuales obligatorias pendientes que puedan invalidar el flujo principal.

---

# 14. Formato obligatorio del informe final

Entrega una única respuesta Markdown. No crees archivos dentro del repositorio.

## A. Veredicto ejecutivo

```text
Veredicto:
Confianza:
HEAD auditado:
Base auditada:
PR:
¿Falta poco realmente?:
Número de bloqueos de merge:
Número de pendientes manuales:
Número de riesgos no bloqueantes:
```

## B. Hallazgos ordenados por severidad

Usa:

```text
P0 — crítico
P1 — bloquea merge
P2 — corregir pronto
P3 — mejora no bloqueante
```

Para cada hallazgo:

```text
ID
severidad
título
evidencia
archivo y líneas
impacto
cómo reproducir
corrección mínima recomendada
bloquea merge: sí/no
```

## C. Matriz completa del plan maestro

Incluye todos los requisitos y la Definition of Done, no solo un resumen por fase.

## D. Estado de validaciones

Tabla con:

```text
gate
local/remoto/manual
SHA
resultado
reproducido
limitaciones
```

## E. Integridad editorial

Incluye cifras reconstruidas y diferencias respecto a los documentos existentes.

## F. Seguridad y privacidad

Incluye GitGuardian, formularios, PII, secretos y endpoints.

## G. Producción y migraciones

Indica exactamente qué ocurriría en este orden:

```text
merge
deployment
migración 0059
activación de flags
cutover
rollback
```

Señala cualquier orden inseguro.

## H. Diferencias entre GitHub y árbol local

Incluye el estado de `app/(public)/blog/page.tsx` y cualquier otro cambio no remoto.

## I. Lista mínima de trabajo restante

Agrupa exclusivamente en:

```text
BLOQUE 1 — correcciones técnicas imprescindibles
BLOQUE 2 — gates manuales/externos
BLOQUE 3 — merge y despliegue controlado
```

No fragmentes innecesariamente. El objetivo es terminar con el menor número posible de bloques.

## J. Próximo prompt recomendado

Redacta al final **un único prompt de implementación**, solo si encuentras correcciones necesarias. Debe abarcar todas las correcciones técnicas imprescindibles en un bloque coherente, sin ejecutar merge ni producción.

Si no hay correcciones técnicas, redacta un único prompt de cierre manual y release controlada.

## K. Formato AGENTS.md §9

Termina también con:

```text
Porcentaje completado:
Porcentaje restante:
Archivos modificados: ninguno
Comandos ejecutados:
Resultado de cada comando:
Errores corregidos: ninguno, auditoría read-only
Riesgos pendientes:
NO VALIDADO:
Próximo paso recomendado:
```

El porcentaje es únicamente orientativo. El veredicto debe basarse en gates y evidencias.

---

# 15. Prohibiciones finales

No:

- modifiques archivos;
- generes commits;
- hagas push;
- hagas merge;
- cambies el estado Draft;
- resuelvas GitGuardian;
- edites el cuerpo del PR;
- despliegues;
- apliques migraciones;
- escribas en Production;
- envíes formularios;
- envíes emails;
- alteres staging;
- reveles secretos;
- descartes cambios locales;
- uses `git reset --hard`;
- uses `git clean -fd`;
- presentes evidencia histórica como si fuera del HEAD actual;
- declares “todo correcto” sin matriz completa y reproducción independiente.

El criterio rector es:

> No demostrar que los informes dicen que el PR está terminado, sino demostrar si el código del HEAD actual cumple realmente el plan maestro y puede avanzar con seguridad.
