# CHANGELOG — Pineda y Asociados

Historial de cambios en orden cronológico inverso. Releases anteriores a Jul 2026
están resumidas; las entradas vigentes desde la reestructuración del changelog
(Release 91) mantienen detalle completo.

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
