# SEO Live Summary

**Generado:** 2026-07-12T08:04:24.741Z

## Fuentes

| Fuente | Estado | Error |
|--------|--------|-------|
| gsc | ❌ | Command failed: node scripts/google-search-console-live.mjs --json-only
ERROR: invalid_grant
 |
| ga4 | ❌ | Command failed: node scripts/google-analytics-live.mjs --json-only
ERROR: invalid_grant
 |
| bing | ✅ | - |
| indexnow | ✅ | - |
| seoHealth | ✅ | - |
| sitemap | ✅ | - |

## Archivos de datos

- GSC: `data/google/gsc-live.json`
- GA4: `data/google/ga4-live.json`
- Bing: `data/bing/bing-live.json`
- Reporte Bing: `docs/audits/bing-live-report.md`

## Siguientes pasos

1. Si alguna fuente falló, verifica con `npm run seo:doctor`
2. Para re-autenticar: `npm run auth:google` y/o `npm run auth:bing`
3. Para datos frescos: `npm run seo:collect`
