# SEO Live Summary

**Generado:** 2026-08-16T15:12:25.805Z

## Fuentes

| Fuente | Estado | Error |
|--------|--------|-------|
| gsc | ✅ | - |
| ga4 | ✅ | - |
| bing | ✅ | - |
| indexnow | ✅ | - |
| seoHealth | ❌ | Command failed: node scripts/seo-health-check.mjs --json |
| sitemap | ❌ | Command failed: node scripts/auditar-indexacion-prioritaria.mjs |

## Archivos de datos

- GSC: `data/google/gsc-live.json`
- GA4: `data/google/ga4-live.json`
- Bing: `data/bing/bing-live.json`
- Reporte Bing: `docs/audits/bing-live-report.md`

## Siguientes pasos

1. Si alguna fuente falló, verifica con `npm run seo:doctor`
2. Para re-autenticar: `npm run auth:google` y/o `npm run auth:bing`
3. Para datos frescos: `npm run seo:collect`
