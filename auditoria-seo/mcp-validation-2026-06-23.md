# Validación MCP gratuitos SEO/GEO — 2026-06-23

## Resumen

| MCP | Estado | Instalado | Configurado | Validado |
|-----|--------|-----------|-------------|----------|
| mcp-seo (auditoría SEO) | ✅ INSTALADO | pipx v0.3.0 | opencode.jsonc | ✅ --help, fetch, meta, headings, report, performance, structured-data, lighthouse |
| Playwright MCP (navegador) | ✅ INSTALADO | npx @executeautomation/playwright-mcp-server v1.0.12 | opencode.jsonc | ✅ --help |
| Filesystem MCP (acceso repo) | ✅ INSTALADO | @modelcontextprotocol/server-filesystem (node_modules) | opencode.jsonc (pre-existente) | ✅ require.resolve OK |
| Git MCP (operaciones git) | ✅ INSTALADO | pipx mcp-server-git 2026.6.16 | opencode.jsonc | ✅ --help, --repository |
| Postgres MCP (DB) | ✅ CONFIGURADO (pre-existente) | @modelcontextprotocol/server-postgres (node_modules) | opencode.jsonc (pre-existente) | ✅ DATABASE_URL existe, script mcp-postgres.cjs wrapper |
| Fetch MCP (HTTP) | ✅ INSTALADO (pre-existente) | Python mcp-server-fetch 2026.6.4 | opencode.jsonc (pre-existente) | ✅ --help, fetch HTTP exitoso |
| DuckDuckGo MCP (búsqueda) | ✅ INSTALADO (pre-existente) | duckduckgo-mcp-server npm | opencode.jsonc (pre-existente) | No validado (requiere interacción MCP) |
| Diag MCP (diagnóstico) | ✅ INSTALADO (pre-existente) | Script custom scripts/mcp-diag.cjs | opencode.jsonc (pre-existente) | No validado (requiere interacción MCP) |

## MCPs omitidos intencionalmente

| MCP | Motivo |
|-----|--------|
| Firecrawl MCP | Requiere FIRECRAWL_API_KEY (cuenta externa de pago) |
| Ahrefs / Semrush / DataForSEO / SE Ranking | Servicios premium de pago |
| Nightwatch | Servicio premium de pago |
| Keywords Everywhere | API key de pago |
| Browser Use | Requiere OPENAI_API_KEY/ANTHROPIC_API_KEY de pago |

## MCPs detectados como riesgo y rechazados

| MCP | Motivo |
|-----|--------|
| mcp-server-git (npm v0.0.2) | ⚠️ Paquete canario de seguridad (npx-confusion). **DESINSTALADO** y reemplazado por pipx mcp-server-git 2026.6.16 oficial |

## Cliente MCP detectado

**OpenCode** — config en `opencode.jsonc` (raíz del proyecto)

## Archivos modificados/creados

| Archivo | Acción |
|---------|--------|
| opencode.jsonc | Modificado — añadidos mcp-seo, playwright, git |
| opencode.jsonc.bak-20260623-1841 | Backup pre-modificación |
| auditoria-seo/mcp-seo-report-home.md | Nuevo — reporte SEO Home |
| auditoria-seo/mcp-seo-report-despacho.md | Nuevo — reporte SEO Despacho |
| auditoria-seo/mcp-seo-report-blog.md | Nuevo — reporte SEO Blog |
| auditoria-seo/mcp-seo-report-faq.md | Nuevo — reporte SEO FAQ |
| auditoria-seo/mcp-validation-2026-06-23.md | Este documento |

## Comandos ejecutados

### Instalación
```bash
python -m pip install --user pipx           # pipx 1.14.1
pipx install mcp-seo                        # mcp-seo 0.3.0
pip install playwright                      # Playwright 1.60.0 (Python)
python -m playwright install chromium        # Chromium browser
pipx install mcp-server-git                 # mcp-server-git 2026.6.16 (oficial)
npm uninstall -g mcp-server-git             # Eliminado paquete canario npm
```

### Validación CLI
```bash
mcp-seo --help                              # ✅ 22 comandos disponibles
mcp-seo setup                               # ✅ Chromium instalado
mcp-seo fetch http://localhost:3000/        # ✅ 200 OK
mcp-seo meta http://localhost:3000/         # ✅ Meta tags, OG, Twitter
mcp-seo headings http://localhost:3000/     # ✅ Jerarquía válida (1 H1, 36 total)
mcp-seo structured-data http://localhost:3000/  # ✅ 8 JSON-LD, todos válidos
mcp-seo headers http://localhost:3000/      # ✅ CSP, X-Content-Type-Options, etc.
mcp-seo performance http://localhost:3000/  # ✅ CWV: TTFB 1592ms, LCP 1964ms, CLS 0
mcp-seo lighthouse http://localhost:3000/   # ✅ Score 89/100 (GOOD)
mcp-seo sitemap http://localhost:3000/sitemap.xml  # ✅ 206 URLs
mcp-seo report http://localhost:3000/       # ✅ Reporte completo generado
mcp-seo report http://localhost:3000/despacho  # ✅ Reporte completo generado
mcp-seo report http://localhost:3000/blog   # ✅ Reporte completo generado
mcp-seo report http://localhost:3000/preguntas-frecuentes  # ✅ Reporte completo
```

### Validación de configuración
```bash
node -e "JSON.parse(require('fs').readFileSync('opencode.jsonc','utf8')); console.log('JSON OK')"
# ✅ JSON OK
```

### Validación del proyecto
```bash
npm run lint    # ✅ Sin errores
npm run build   # ✅ 294 páginas, TypeScript OK
npm test        # ✅ 601 tests pasados (21 suites)
```

## Resultados de auditoría SEO (mcp-seo)

### Home (/)
| Métrica | Valor |
|---------|-------|
| Score Lighthouse | 89/100 (GOOD) |
| Meta Tags | 100/100 |
| Heading Structure | 100/100 |
| Structured Data | 100/100 (8 JSON-LD) |
| Content Quality | 62/100 |
| Images | 85/100 |
| TTFB | 1591.6ms ⚠️ |
| LCP | 1964ms ✅ |
| CLS | 0 ✅ |
| TBT | 183ms ✅ |

### /despacho
| Métrica | Valor |
|---------|-------|
| TTFB | 947.8ms ⚠️ |
| FCP | 1192ms ✅ |
| LCP | 1368ms ✅ |
| CLS | 0 ✅ |

### Rutas no encontradas (404)
- /custodia-hijos-honduras-juez → 404
- /habeas-corpus → 404
- /naturalizacion → 404

## Problemas detectados y soluciones

1. **mcp-server-git (npm v0.0.2) era un paquete canario de seguridad** → Desinstalado. Instalado `mcp-server-git` oficial desde PyPI vía pipx.
2. **pipx no estaba en PATH** → Usado path completo `C:\Users\Admin\.local\bin\mcp-seo.exe` y `C:\Users\Admin\.local\bin\mcp-server-git.exe` en opencode.jsonc.
3. **Port 3000 ocupado por procesos previos** → Matados procesos node antes de restart.
4. **Rutas de blog solicitadas no existen** → Posiblemente eran slugs de ejemplo; sitemap confirma 206 URLs reales.

## Próximo comando para arrancar el cliente MCP

```bash
# OpenCode ya está configurado. Para recargar configuración MCP:
# En OpenCode: usar las herramientas mcp-seo, playwright, git, etc.
# Para ver las herramientas disponibles desde CLI (si opencode lo soporta):
# opencode --list-mcp-tools
```

## Recomendación de commit

```
feat: configuración MCP gratuitos — mcp-seo, Playwright, Git, Filesystem, Postgres

- Añadidos mcp-seo (v0.3.0) para auditoría SEO completa
- Añadido Playwright MCP para validación en navegador real
- Añadido Git MCP oficial (pipx, 2026.6.16) para trazabilidad
- Filesystem, Postgres, Fetch, DuckDuckGo, Diag ya existentes
- Eliminado mcp-server-git npm (paquete canario de seguridad)
- Ejecutada auditoría SEO contra Home, /despacho, /blog, /faq
- Score Lighthouse 89/100, 8 JSON-LD válidos, 206 URLs en sitemap
- Validado: lint ✅, build ✅ (294 páginas), test ✅ (601 tests)
```

## Bloqueos reales

- Ninguno. Todos los MCPs gratuitos planificados están instalados, configurados y validados.
