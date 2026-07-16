# Pineda y Asociados — Protocolo canónico para agentes IA

Precisión, trazabilidad, verificación real. Ningún agente afirma que algo está
implementado si no lo ha comprobado con lectura de archivos, cambios reales y
comandos de validación. Este protocolo es permanente.

---

## 1. Flujo de trabajo obligatorio

1. Leer `AGENTS.md` (este archivo).
2. Ejecutar `git status` — entender estado del working tree.
3. Ejecutar `npm run seo:doctor` — verificar credenciales (obligatorio solo para tareas SEO/Analytics).
4. Ejecutar `npm run seo:collect` — recolectar datos live (obligatorio solo para tareas SEO/Analytics).
5. Revisar `docs/audits/seo-live-summary.md` para contexto actual si aplica.
6. Leer los archivos que se van a modificar (no asumir contenido).
7. Aplicar cambios pequeños y justificados.
8. Validar siempre en cambios de código: `npm run lint`, `npx tsc --noEmit`, `npm run test` y `npm run build`.
9. Documentar la acción: usar `CHANGELOG.md` para releases, `AUDIT_REPOSITORY_REPORT.md` para saneamientos, o `auditoria-acciones.md` para operaciones estándar.
10. No hacer push.

---

## 2. Reglas absolutas

| # | Regla |
|---|-------|
| R1 | Leer el archivo antes de editarlo. No asumir. |
| R2 | Una fuente de verdad por subsistema (ver tabla abajo). |
| R3 | No usar datos mock como solución final. Persistencia = DB. |
| R4 | No inventar datos legales. Citas verificables contra CP de Honduras. |
| R5 | No rediseñar la web pública (`app/(public)/**`). SEO sí; visual no. |
| R6 | No exponer la intranet. `/intranet/*`, `/admin/*` son PRIVADAS. |
| R7 | Un cambio lógico por commit. Commits atómicos en español con prefijo. |
| R8 | Validar siempre en cambios de código: `lint`, `tsc --noEmit`, `test` y `build`. |
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

### Fuentes de verdad

| Subsistema | Fuente |
|------------|--------|
| Blog | DB `blog_posts` vía `lib/blog-db.ts` |
| Categorías blog | `data/blog/categories.ts` (20) |
| FAQ | DB `faq_entries` vía `lib/faq-db.ts` |
| Categorías FAQ | `data/faq-categories.ts` (11) |
| Delitos CP | `data/delitos.json` (483, 100% verificados) |
| Páginas editables | DB `page_content` vía `lib/page-content-db.ts` |
| Schema DB | `lib/schema.ts` (66 tablas) |
| Config sitio | `lib/site.ts` |
| Artículos CP | `data/articulos_cp.json` (635+) |
| Constitución | `data/articulos_constitucion.json` (378) |
| Códigos legales | `data/codigo_trabajo.json`, `codigo_civil.json`, `codigo_comercio.json`, `codigo_tributario.json` |
| Áreas jurídicas | `data/areas-juridicas.ts` (13) |
| Landings locales | `data/landings-locales.ts` |
| SEO Live | `data/google/`, `data/bing/`, `data/seo/` (regenerable) |
| **RAG / Búsqueda semántica** | **DB `embeddings` vía `lib/rag/`** (índice vectorial pgvector) |

---

## 3. Seguridad

- **Auth:** JWT + bcrypt. Cookies `__Host-token` (HttpOnly, Secure, SameSite=Lax).
- **Proxy:** `proxy.ts` protege `/intranet/*` y `/api/*`. Rol admin para `/api/admin/*`.
- **Rate limiting:** login (5/60s), contacto (10/15min), calcular (30/min).
- **Sanitización:** `sanitize-html` en todo HTML de entrada.
- **Validación:** Zod en todas las rutas POST/PATCH/PUT.
- **NUNCA hardcodear:** `OAUTH_CLIENT_SECRET`, `RESEND_API_KEY`, `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`, `JWT_SECRET`, `INDEXNOW_KEY`.
- **NUNCA commitear:** `.env.local`, `.env`, `.secrets/`, `data/google/`, `data/bing/`, tokens, checkpoints, dumps y outputs live generados (ej. reportes bajo `data/seo/`, aunque allí sí se permiten fuentes canónicas como `canonical-paths.json`).
- Si un secreto está en git history, requiere rotación (el código no lo resuelve).

---

## 4. Validación por área

| Área | Comandos |
|------|----------|
| Cualquier cambio | `npm run lint && npx tsc --noEmit && npm run test && npm run build` |
| Schema DB | `npx drizzle-kit generate` |
| SEO / sitemap / robots | `build` + verificar `sitemap.xml` |
| Blog | `npm run validate:dates && npm run content:audit` |
| Contenido editorial | `npm run blog:normalizar` (dry-run) → `:aplicar` |
| IndexNow | `npm run indexnow:dry` |
| SEO Live | `npm run seo:doctor && npm run seo:collect` |
| SEO off-page | `npm run seo:health` |
| RAG / Indexación vectorial | `npm run rag:indexar` (dry-run) → `:aplicar` |
| RAG / Extraer PDFs | `npm run rag:extraer-pdfs` (dry-run) → `:aplicar` |

---

## 5. Sistema SEO Live

```bash
npm run seo:doctor       # diagnóstico de auths y datos (debe dar 0 ERROR)
npm run seo:collect       # recolecta GSC + GA4 + Bing + IndexNow + Health + Sitemap
npm run seo:gsc:live      # GSC: queries, páginas, CTR, posición (28d default)
npm run seo:ga4:live      # GA4: usuarios, sesiones, eventos, conversiones (28d default)
npm run seo:bing:live     # Bing: crawl stats, queries, backlinks
npm run indexnow:dry      # IndexNow dry-run (20 URLs prioritarias)
```

Datos generados: `data/google/gsc-live.json`, `data/google/ga4-live.json`,
`data/bing/bing-live.json`, `data/seo/live-summary.json`.
Reportes: `docs/audits/seo-live-summary.md`, `docs/audits/seo-live-action-plan.md`.

---

## 6. Sistema RAG (Retrieval Augmented Generation)

El sistema RAG usa **Neon (pgvector)** como vector store y **DeepSeek** (`deepseek-embedding`) para generar embeddings. Permite búsqueda semántica sobre toda la base de conocimiento del proyecto.

### Arquitectura

```
Contenido → Chunking → Embedding (DeepSeek) → pgvector (Neon) → Búsqueda semántica
```

### Fuentes indexadas en la tabla `embeddings`

| Fuente | Tipo `entidad_tipo` | Cantidad aprox |
|--------|---------------------|----------------|
| Blog posts (DB) | `blog_post` | ~149 posts (~400 chunks) |
| Código Penal | `articulo_cp` | 635 artículos |
| Constitución | `articulo_const` | 378 artículos |
| Código Civil | `codigo_civil` | 2,359 artículos |
| Código de Comercio | `codigo_comercio` | 1,693 artículos |
| Código de Trabajo | `codigo_trabajo` | 856 artículos |
| Código Tributario | `codigo_tributario` | 218 artículos |
| Delitos | `delito` | 483 delitos |
| FAQs | `faq` | 73 preguntas |
| Áreas jurídicas | `area_juridica` | 13 áreas |
| PDFs legales extraídos | `pdf_original` | 8 PDFs (~400 chunks) |

### Integraciones activas

1. **`scripts/blog-verify-fix.ts`**: Antes de llamar a DeepSeek para corregir un post, recupera contexto semántico relevante y lo inyecta en el prompt como "CONTEXTO ADICIONAL — BÚSQUEDA SEMÁNTICA (RAG)". Compatible con flag `--no-rag`.

2. **`app/api/chat/route.ts`**: El asistente virtual público recupera chunks relevantes al mensaje del usuario y los inyecta en el system prompt como contexto adicional.

### Scripts de indexación

```bash
npm run rag:extraer-pdfs            # Extrae texto de PDFs legales → data/pdfs-chunked/
npm run rag:extraer-pdfs:aplicar    # Aplica la extracción y guarda chunks
npm run rag:indexar                 # Indexa contenido en pgvector (dry-run)
npm run rag:indexar:aplicar         # Aplica indexación en DB
npm run rag:indexar -- --tipo blog  # Solo blog posts
npm run rag:indexar -- --tipo legal # Solo códigos legales
npm run rag:indexar -- --reset      # Re-indexar desde cero (limpia tabla)
```

### Módulos RAG (`lib/rag/`)

| Archivo | Propósito |
|---------|-----------|
| `config.ts` | Configuración centralizada (proveedor, modelo, topK, umbral) |
| `embeddings.ts` | Motor de embeddings (DeepSeek) + búsqueda vectorial en pgvector |
| `chunking.ts` | Estrategias de chunking por tipo de contenido |
| `retrieval.ts` | Orquestación: consulta → embedding → búsqueda → contexto formateado |

### Variables de entorno

```bash
EMBEDDINGS_PROVEEDOR=deepseek        # Proveedor de embeddings
EMBEDDINGS_API_KEY=                  # Opcional: si vacía, usa DEEPSEEK_API_KEY
EMBEDDINGS_MODELO=deepseek-embedding # Modelo de embeddings (1536 dims)
EMBEDDINGS_DIMENSIONES=1536
RAG_TOP_K=5                          # Chunks recuperados por consulta
RAG_MIN_SCORE=0.7                    # Umbral mínimo de similitud
```

### Seguridad RAG

- **Dry-run por defecto**: `npm run rag:indexar` sin `--aplicar` no escribe en DB.
- **La API key de DeepSeek** es la misma del chat (`DEEPSEEK_API_KEY`), nunca hardcodeada.
- **La tabla `embeddings`** es un índice de búsqueda, no una fuente primaria (R2). El contenido original sigue en sus fuentes canónicas.
- **Los chunks de contenido** se limitan a 2000 caracteres para controlar tokens.

---

## 7. Archivos que NO debe tocar la IA

- Web pública visual (`app/(public)/**/*.tsx`) — salvo SEO.
- Motor de cálculo (`lib/rules/v1/`).
- Schema DB (`lib/schema.ts`).
- Auth (`lib/auth.ts`), Proxy (`proxy.ts`).
- Datos de delitos (`data/delitos.json`, `data/delitos-estados.json`).
- Redirects 301 de `next.config.ts`.
- `auditoriatotal.mc` y `auditoriatotal.md` — solo lectura.

---

## 8. Formato de entrega

```

### Analítica pública

- Fuente cliente: `components/analytics-scripts.tsx`; helpers/eventos: `lib/analytics.ts`; configuración: `lib/site.ts`.
- GA4 directo y GTM son mutuamente excluyentes. No duplicar etiquetas ni enviar PII, consultas legales, nombres, correos, teléfonos o identificadores de expedientes.
- La analítica solo se monta en el layout público y excluye las rutas declaradas en `ANALYTICS_EXCLUDED_PREFIXES`.
- Variables: `NEXT_PUBLIC_GA_ID`, `NEXT_PUBLIC_GTM_ID`, `NEXT_PUBLIC_CLARITY_ID`, `NEXT_PUBLIC_ANALYTICS_TEST` y `NEXT_PUBLIC_ANALYTICS_DEBUG`.
- Validar cambios con las cuatro comprobaciones de código y, tras deploy, con Network (`gtag/js`, `g/collect`, `clarity.ms`) y GA4 Realtime/DebugView.
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
