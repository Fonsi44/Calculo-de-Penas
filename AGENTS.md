# Pineda y Asociados — Protocolo canónico para agentes IA

Precisión, trazabilidad, verificación real. Ningún agente afirma que algo está
implementado si no lo ha comprobado con lectura de archivos, cambios reales y
comandos de validación. Este protocolo es permanente.

---

## 0. Modos de operación

Todo agente opera en uno de estos tres modos. El modo debe declararse al inicio
de la tarea y respetarse hasta el final.

| Modo | Lectura | Escritura | Commits | Llamadas externas | Instalaciones / migraciones |
|------|---------|-----------|---------|-------------------|------------------------------|
| **`AUDITORÍA`** | Sí, **sin exclusiones** | No | No | Solo GET sin efectos | No |
| **`IMPLEMENTACIÓN`** | Sí | Cambios autorizados, pequeños y trazables | Commits locales atómicos permitidos (ver §5) | Solo con autorización expresa | Solo con autorización expresa |
| **`VERIFICACIÓN`** | Sí | No | No | Solo comprobaciones de solo lectura | No |

**Ningún archivo, subsistema o directorio queda excluido de lectura durante una
auditoría.** La lectura es siempre libre. Las restricciones de la §7 (auth,
proxy, schema DB, motor de cálculo, datos legales, redirects, web pública) se
aplican **únicamente a modificaciones no autorizadas**, nunca a la inspección.

Los agentes pueden **detectar, documentar y recomendar** problemas
arquitectónicos en cualquier archivo, aunque no puedan corregirlos sin
autorización. La capacidad de observación es total; la de modificación, acotada.

---

## 1. Flujo de trabajo obligatorio

1. Leer `AGENTS.md` (este archivo).
2. Ejecutar `git status` y confirmar que la rama activa es `main` (ver R19).
   Si no es `main`, detenerse inmediatamente y volver a `main` sin descartar cambios.
3. **Solo para tareas SEO/Analytics live:** `npm run seo:doctor` (debe dar 0
   ERROR) y `npm run seo:collect`. Revisar `docs/audits/seo-live-summary.md`.
4. Leer los archivos que se van a modificar (no asumir contenido).
5. Aplicar cambios pequeños y justificados (modo `IMPLEMENTACIÓN`).
6. Validar según la matriz de la §4 (no siempre hace falta la suite completa).
7. Documentar la acción: `CHANGELOG.md` para releases,
   `AUDIT_REPOSITORY_REPORT.md` para saneamientos, `auditoria-acciones.md`
   para operaciones estándar.
8. No hacer push.

---

## 2. Fuentes de verdad

Una fuente de verdad por subsistema. El contenido original vive en estas
fuentes; los índices derivados (como `embeddings`) no son fuente primaria.

| Subsistema | Fuente |
|------------|--------|
| Blog | DB `blog_posts` vía `lib/blog-db.ts` |
| Categorías blog | `data/blog/categories.ts` |
| FAQ | DB `faq_entries` vía `lib/faq-db.ts` |
| Categorías FAQ | `data/faq-categories.ts` |
| Delitos CP | `data/delitos.json` (100 % verificables contra CP de Honduras) |
| Páginas editables | DB `page_content` vía `lib/page-content-db.ts` |
| Schema DB | `lib/schema.ts` |
| Config sitio | `lib/site.ts` |
| Artículos CP | `data/articulos_cp.json` |
| Constitución | `data/articulos_constitucion.json` |
| Códigos legales | `data/codigo_trabajo.json`, `codigo_civil.json`, `codigo_comercio.json`, `codigo_tributario.json` |
| Áreas jurídicas | `data/areas-juridicas.ts` |
| Landings locales | `data/landings-locales.ts` |
| SEO Live | `data/google/`, `data/bing/`, `data/seo/` (regenerable) |
| RAG / Búsqueda semántica | DB `embeddings` vía `lib/rag/` (índice vectorial pgvector) |

---

## 3. Reglas absolutas

| # | Regla |
|---|-------|
| R1 | Leer el archivo antes de editarlo. No asumir. |
| R2 | Una fuente de verdad por subsistema (ver §2). |
| R3 | No usar datos mock como solución final. Persistencia = DB. |
| R4 | No inventar datos legales. Citas verificables contra CP de Honduras. |
| R5 | No rediseñar la web pública (`app/(public)/**`). SEO sí; visual no. |
| R6 | No exponer la intranet. `/intranet/*`, `/admin/*` son PRIVADAS. |
| R7 | Un cambio lógico por commit. Commits atómicos en español con prefijo. |
| R8 | Validar según la matriz de la §4 (no siempre suite completa). |
| R9 | No cambiar arquitectura sin justificación técnica. |
| R10 | No modificar configuración de modelos, proveedores o APIs externas. |
| R11 | Clasificar con honestidad: `IMPLEMENTADO`, `VALIDADO`, `NO VALIDADO`, `PENDIENTE`, `RIESGO`. |
| R12 | No usar verbos complacientes. "hecho/listo/completado" solo si es exacto. |
| R13 | Posts 600–1200 palabras guía. Ampliación IA → 800–1000 sin inventar datos legales. |
| R14 | Disclaimer legal en componente `<LegalDisclaimer>`, nunca en body del post. |
| R15 | Un solo `<h1>` por página de post (el título). Body usa `<h2>`/`<h3>`. |
| R16 | Design tokens canónicos: radius `rounded-lg`, sombras vía `.btn-shadow-*`, icono `w-11 h-11`. Dorado solo acento. |
| R17 | IA en blog: verificar contra fuentes canónicas. Dry-run por defecto. Sin relleno genérico. |
| R18 | Footer/Home: solo 10 ciudades prioritarias (Nacaome, Choluteca, San Lorenzo, Goascorán, San Marcos de Colón, El Triunfo, Marcovia, Pespire, Namasigüe, Orocuina). |
| R19 | **Rama única de trabajo: `main`.** Prohibido crear ramas, worktrees, forks, PRs o merges. Todo el trabajo se realiza directamente sobre `main`. Si la rama activa no es `main`, detenerse y volver a `main` sin descartar cambios. No ejecutar `git merge`, `git pull` de otras ramas, `git cherry-pick` entre ramas ni `git rebase`. No crear PRs en GitHub. |

---

## 4. Matriz de validación proporcional

La validación universal (`lint` + `tsc` + `test` + `build`) no es siempre
necesaria ni proporcionada. Aplíquese según el tipo de cambio:

| Tipo de cambio | Validación mínima |
|----------------|-------------------|
| **Documentación** (`.md`) | Formato, enlaces internos rotos, coherencia. No requiere build ni suite. |
| **Código localizado** (un módulo, una ruta, un componente) | `npm run lint` + `npx tsc --noEmit` + pruebas relacionadas al módulo. |
| **Cambios transversales / seguridad / auth / DB / configuración** | `npm run lint && npx tsc --noEmit && npm run test && npm run build`. |
| **SEO estático** (sitemap, robots, schema, metadata) | `npm run build` + validadores locales (`seo:ahrefs`, `validate-jsonld.mjs`). |
| **Datos live** (GSC, GA4, Bing, IndexNow) | Solo cuando sean necesarios, existan credenciales válidas y el usuario lo haya autorizado expresamente. |

Comandos base: `npm run lint`, `npm run typecheck` (`tsc --noEmit`),
`npm run test` (Vitest), `npm run build` (Next.js).

### Validación por área

| Área | Comandos |
|------|----------|
| Schema DB | `npx drizzle-kit generate` |
| Blog | `npm run validate:dates && npm run content:audit` |
| Contenido editorial | `npm run blog:normalizar` (dry-run) → `:aplicar` |
| IndexNow | `npm run indexnow:dry` |
| SEO Live | `npm run seo:doctor && npm run seo:collect` |
| SEO off-page | `npm run seo:health` |
| RAG / Indexación vectorial | `npm run rag:indexar` (dry-run) → `:aplicar` |
| RAG / Extraer PDFs | `npm run rag:extraer-pdfs` (dry-run) → `:aplicar` |

---

## 5. Política Git

- **`AUDITORÍA`:** no se crean commits. El árbol de trabajo debe quedar
  inalterado o, si se generan artefactos de inspección, devueltos a su estado.
- **`IMPLEMENTACIÓN`:** pueden crearse **commits locales atómicos** (un cambio
  lógico por commit, mensaje en español con prefijo `feat`/`fix`/`chore`/`docs`).
- **Nunca se hace push** sin orden expresa del usuario.
- **Prohibido crear ramas, feature branches o worktrees.** Todo el trabajo se
  realiza directamente sobre `main` (R19).
- **Prohibido ejecutar `git merge`, `git pull` de otras ramas, `git cherry-pick`
  entre ramas, `git rebase` o cualquier operación que mezcle líneas de desarrollo.**
- **Prohibido crear Pull Requests en GitHub.**
- Si la rama activa no es `main`, **detenerse inmediatamente**. No ejecutar
  ningún comando. Volver a `main` con `git checkout main` (sin descartar cambios
  pendientes). Si hay cambios sin versionar, guardarlos con `git stash` temporal.

---

## 6. Seguridad

- **Auth:** JWT con propósito explícito + bcrypt + 2FA TOTP. Cookies
  `__Host-token` (HttpOnly, Secure, SameSite=Lax). Ver `lib/auth.ts`.
- **Proxy:** `proxy.ts` protege `/intranet/*` y `/api/*`. Rol admin para
  `/api/admin/*`. Corre en Node runtime (verifica firma HS256).
- **Rate limiting:** login (5/60s), contacto (10/15min), calcular (30/min).
- **Sanitización:** `sanitize-html` en todo HTML de entrada.
- **Validación:** Zod en todas las rutas POST/PATCH/PUT.
- **NUNCA hardcodear** secretos: `OAUTH_CLIENT_SECRET`, `RESEND_API_KEY`,
  `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`, `JWT_SECRET`, `ENCRYPTION_KEY`,
  `INDEXNOW_KEY`, `DEEPSEEK_API_KEY`, `IA_DOCUMENTAL_API_KEY`, `CRON_SECRET`.
- **NUNCA commitear:** `.env.local`, `.env`, `.secrets/`, `data/google/`,
  `data/bing/`, tokens, checkpoints, dumps y outputs live generados (p. ej.
  reportes bajo `data/seo/`, aunque allí sí se permiten fuentes canónicas como
  `canonical-paths.json`).
- **No revelar valores de secretos.** Si un agente detecta uno, informa solo su
  ubicación y tipo, nunca su contenido.
- Si un secreto está en git history, requiere rotación en el proveedor (el
  código no lo resuelve).

---

## 7. Archivos y subsistemas sensibles (modificación restringida)

La lectura es siempre libre (§0). La **modificación no autorizada** de estos
archivos está restringida por su criticidad; cualquier cambio requiere
autorización explícita y validación completa (suite + build):

- Web pública visual (`app/(public)/**/*.tsx`) — salvo SEO.
- Motor de cálculo (`lib/rules/v1/`).
- Schema DB (`lib/schema.ts`).
- Auth (`lib/auth.ts`), Proxy (`proxy.ts`).
- Datos de delitos (`data/delitos.json`, `data/delitos-estados.json`).
- Redirects 301 de `next.config.ts`.
- `auditoriatotal.mc` y `auditoriatotal.md` — **solo lectura**.

Los agentes pueden auditar y reportar problemas en cualquiera de estos archivos.

---

## 8. Subsistemas externos (manuales especializados)

Los manuales operativos extensos viven bajo `docs/`, no en este protocolo.
`AGENTS.md` solo fija las reglas de comportamiento.

- **SEO Live** (GSC + GA4 + Bing + IndexNow + Health): manual operativo en
  [`docs/seo/live-data-access.md`](docs/seo/live-data-access.md). Scripts:
  `seo:doctor`, `seo:collect`, `seo:gsc:live`, `seo:ga4:live`, `seo:bing:live`.
  Datos generados (no versionar): `data/google/`, `data/bing/`, `data/seo/`.
  Reportes: `docs/audits/seo-live-summary.md`, `docs/audits/seo-live-action-plan.md`.
- **RAG** (búsqueda semántica): índice en DB `embeddings` (pgvector) vía
  `lib/rag/` (`config.ts`, `embeddings.ts`, `chunking.ts`, `retrieval.ts`).
  Proveedor de embeddings configurado en `.env.example` (`EMBEDDINGS_*`).
  Scripts: `rag:indexar` (dry-run) → `:aplicar`, `rag:extraer-pdfs`. Dry-run por
  defecto; la tabla `embeddings` es índice, no fuente primaria (R2).
- **Analítica pública:** fuente cliente `components/analytics-scripts.tsx`;
  helpers de eventos `lib/analytics.ts`; configuración `lib/site.ts`. GA4 directo
  y GTM son **mutuamente excluyentes**. No duplicar etiquetas ni enviar PII,
  consultas legales, nombres, correos, teléfonos o identificadores de
  expedientes. Se monta solo en el layout público y excluye las rutas de
  `ANALYTICS_EXCLUDED_PREFIXES`. Variables: `NEXT_PUBLIC_GA_ID`,
  `NEXT_PUBLIC_GTM_ID`, `NEXT_PUBLIC_CLARITY_ID`, `NEXT_PUBLIC_ANALYTICS_TEST`,
  `NEXT_PUBLIC_ANALYTICS_DEBUG`.
- **Chat público:** motor de reglas local, **sin LLM externo**. Endpoint
  `POST /api/chat` (rate-limit → Zod → guardrails → motor de reglas). No envía
  mensajes a terceros. Las variables `DEEPSEEK_*` pertenecen a RAG/scripts de
  blog, **no al chat**.

---

## 9. Formato de entrega

```
Porcentaje completado:
Porcentaje restante:
Archivos modificados:
Comandos ejecutados:
Resultado de cada comando:
Errores corregidos:
Riesgos pendientes:
NO VALIDADO:
Próximo paso recomendado:
```
