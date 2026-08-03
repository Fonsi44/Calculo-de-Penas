---
description: Valida el SEO estático de una página, ruta o del sitio (metadata, canonicals, JSON-LD, sitemap, robots). Ejecuta build + validadores locales. No ejecuta SEO Live ni IndexNow real.
agent: seo-geo-content
---

Valida el SEO estático del objetivo indicado. No ejecutes SEO Live (GSC/GA4/Bing)
ni IndexNow con envío real.

<target>
$ARGUMENTS
</target>

Procedimiento:

1. Localiza la página/ruta y su fuente de verdad (`lib/seo.ts`, `lib/site.ts`,
   metadata en el componente).
2. Revisa: metadata, canonical, robots, JSON-LD, `llms.txt`, enlazado interno
   y reglas editoriales (R13–R15, R18).
3. Para contenido jurídico, verifica contra fuentes canónicas (`data/`) y marca
   todo lo no verificable para revisión humana.
4. Ejecuta validadores locales:
   - `npm run build` (obligatorio para SEO estático)
   - `npm run seo:ahrefs` (si aplica)
   - `node tools/validate-jsonld.mjs` (si aplica)
   - `npm run seo:health`
5. Reporta PASS/WARN/FAIL por validación. No inventes datos legales ni
   credenciales. No publiques contenido pending.

Prohibido: IndexNow con envío real, SEO Live con credenciales sin autorización.
