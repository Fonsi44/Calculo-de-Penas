# MCP SEO Connectors — Guía de configuración

Conecta MCPs (OpenCode, ZCode, Cursor, etc.) a las credenciales locales de
Google Search Console, Google Analytics, Bing Webmaster Tools, filesystem y git
sin pegar secretos en configuraciones ni chats.

## Arquitectura de acceso

```
.env.local (gitignored)
  ├── INDEXNOW_KEY          → Bing WMT API Key
  ├── BING_CLIENT_ID        → Bing OAuth (Azure AD)
  ├── GOOGLE_SERVICE_ACCOUNT_EMAIL  → GSC/GA4 service account
  ├── GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
  ├── GOOGLE_ANALYTICS_PROPERTY_ID  → GA4 property
  ├── GOOGLE_SEARCH_CONSOLE_SITE_URL → GSC site
  └── OAUTH_CLIENT_ID / OAUTH_CLIENT_SECRET → Google OAuth

~/.config/gcloud/application_default_credentials.json (sistema, gitignored)
  └── Google ADC (gcloud auth application-default login)

.secrets/bing-oauth.json (local, gitignored)
  └── Bing OAuth token + refresh_token
```

## MCPs disponibles en el proyecto

### MCPs conectados (en tiempo de ejecución)

| MCP | Propósito | Configuración |
|-----|-----------|---------------|
| `mcp-seo` | Auditoría SEO técnica, metadatos, sitemap, robots, structured data, Core Web Vitals, mobile, headings, links, imágenes | URL como parámetro |
| `filesystem` | Lectura/escritura local en el repo | Ruta del proyecto |
| `git` | Status, diff, log, commit | Repo local |
| `postgres` | Consultas DB (`DATABASE_URL` de entorno) | Variable de entorno |
| `playwright` | Navegación real, screenshots, renderizado | Browser engine |
| `fetch` | Peticiones HTTP | URLs públicas |
| `duckduckgo` | Búsqueda web, SERP/GEO | Queries públicas |

### MCPs conceptuales (no implementados, usar CLI como alternativa)

Dado que Google Search Console, Google Analytics y Bing WMT requieren OAuth
real (no solo API key) y no existen MCPs oficiales para estas APIs, se usa
la capa CLI descrita en `docs/seo/auth-cli.md` como alternativa funcional.

La capa CLI:
1. Autentica con OAuth real (navegador + gcloud ADC / Device Code)
2. Guarda credenciales localmente (gitignored)
3. Expone comandos `npm run seo:gsc:live`, `seo:ga4:live`, `seo:bing:live`
4. Produce JSONs en `data/google/` y `data/bing/`

Los agentes IA leen estos JSONs mediante el MCP `filesystem` (ya conectado)
para acceder a datos reales de la web sin necesidad de MCPs específicos de
Google/Bing.

## Flujo de trabajo del agente IA

```
1. Agente verifica credenciales → npm run seo:doctor
2. Agente recolecta datos → npm run seo:collect
3. Agente lee resultados → MCP filesystem: data/google/gsc-live.json
4. Agente analiza + produce recomendaciones
```

## Configuración de ejemplo para OpenCode / ZCode

Ver `docs/seo/mcp.example.json` para una configuración de referencia.

## Variables de entorno para MCPs

Las variables de entorno se pasan al runtime del agente, NUNCA se pegan en
archivos de configuración dentro del repo:

```bash
# Google
GOOGLE_SERVICE_ACCOUNT_EMAIL=xxx
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY=xxx
GOOGLE_ANALYTICS_PROPERTY_ID=xxx
GOOGLE_SEARCH_CONSOLE_SITE_URL=https://www.pinedayasociadoshn.com/

# Bing
INDEXNOW_KEY=xxx
BING_CLIENT_ID=xxx

# DB
DATABASE_URL=xxx
```

Estas variables se leen desde `.env.local` en los scripts CLI, o desde el
entorno de ejecución del agente para los MCPs.
