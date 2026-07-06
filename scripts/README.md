# Scripts del repositorio

Este directorio centraliza las herramientas y automatizaciones del repositorio. A continuación se presenta su inventario y reglas de uso seguro para evitar daños en la base de datos de producción o regresiones en SEO.

## Scripts operativos
Scripts de uso general referenciados por `package.json` para procesos de CI, linting y mantenimiento básico:
- `check-db-state.ts`: Verificador del estado actual de migraciones y base de datos.
- `corregir-articulos.ts`: Automatización de limpieza sobre artículos defectuosos.

## Scripts manuales con precaución
Utilidades manuales que pueden afectar al entorno local o de QA:
- `qa-visual-cierre.mjs`, `playwright-audit.mjs`, `visual-regression.cjs`: Pruebas visuales e2e (requieren configuración).
- `e2e-start.mjs`, `cleanup-e2e-users.mjs`: Utilidades de prueba manual (no conectadas a CI).
- `load-env.cjs`, `mcp-diag.cjs`, `mcp-postgres.cjs`: Utilidades de configuración local para MCP y entorno.
- `auth-*-cli.mjs`: CLI interactivos para obtener tokens de Vercel y Google.

## Scripts SEO
Scripts de indexación y auditoría de Search Console, Bing y Health:
- `submit-indexnow.mjs`: Motor de IndexNow usado post-build.
- `seo-health-check.mjs`, `seo-indexability-audit.mjs`, `auditar-indexacion-prioritaria.mjs`: Health checkers principales.
- `google-search-console-live.mjs`, `bing-webmaster-live.mjs`: Scripts de obtención de métricas live.
- `generate-llms-txt.mjs`: Genera el directorio .txt post-build.

## Scripts RAG / datos
Operaciones intensivas de embeddings y parseo:
- `rag-indexar.ts`: Indexación de contenido al motor pgvector.
- `rag-extraer-pdfs.ts`: Procesamiento de PDFs legales locales.

## Scripts de base de datos
Auditorías a las colecciones estáticas de datos:
- `auditar-cp.js`, `auditar-delitos.js`: Lectura y validación de JSONs en `data/`. No escriben en Postgres.

## Scripts archivados
Ubicados en `scripts/archive/` (excluidos del typecheck en `tsconfig.json`). Son herramientas históricas de una sola vez que ya cumplieron su propósito o están desactualizadas (ej. `fetch-lote1.ts`, `recover-full.ts`, scripts legacy de migración y bash).

## Candidatos a consolidación
- `seo-live-doctor.mjs` vs `seo-auth-doctor.mjs`: Ambas validan tokens SEO. Deben unificarse en Fase 3.
- `bing-auth-link.mjs` vs `bing-oauth-device.mjs`: Existen múltiples formas de autenticación para Bing.
- Scripts de validación de blog (`blog-verify-fix.ts`, `validar-blog.ts`, `audit-blog-seo.ts`): Hay solapamiento funcional que debe reducirse en Fase 3.

## Reglas de uso seguro
1. **Solo de lectura por defecto**: Todo script nuevo debe diseñarse usando un flag `--aplicar` o equivalente. Su ejecución base (dry-run) jamás debe hacer mutaciones.
2. **Referenciados en package**: Ejecuta los scripts usando `npm run <nombre-script>`. Esto asegura que se inyectan correctamente las variables y compiladores (`tsx`, `node`).
3. **No exponer tokens**: Los scripts que utilizan APIs de Google, Bing o base de datos no deben imprimir keys bajo ningún motivo.
4. **Archivo temporal**: Archiva herramientas temporales en `scripts/archive/` y añádelas al `exclude` en `tsconfig.json` para no afectar el Typecheck global.

## Variables de entorno y SDKs de Inteligencia Artificial
La mayoría de los scripts consumen del `.env.local` inyectado automáticamente:
- `DATABASE_URL`: Necesaria para utilidades RAG o verificaciones DB.
- `GEMINI_API_KEY`: API Key para usar la SDK oficial de Google AI.
- `DEEPSEEK_API_KEY` o `EMBEDDINGS_API_KEY`: Para la generación de embeddings.

### SDK Oficial de IA
Se ha estandarizado el repositorio para usar la nueva SDK oficial **`@google/genai`**.
**No utilices `@google/generative-ai`**, ya que ha sido removida del proyecto por ser legacy.
- **RAG / Embeddings**: Usa `openai` compatible con DeepSeek (ver `lib/rag/embeddings.ts`).
- **Generación / Revisión (Gemini)**: Usa `@google/genai`.
*Advertencia*: No ejecutes scripts de IA (ej. `corregir:articulos`) en modo de escritura (`--aplicar`) sin revisar primero un dry-run, ya que mutan directamente la base de datos de producción.
Después:
- Ejecutar suite de pruebas: `npm run test` y comprobar que no se ha introducido ninguna ruptura indirecta de SEO ni de la lógica del sitio público (`app/robots.ts`, etc).
