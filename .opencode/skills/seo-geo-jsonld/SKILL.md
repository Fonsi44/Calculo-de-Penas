---
name: seo-geo-jsonld
description: SEO técnico y GEO del proyecto — metadata, canonical, robots, sitemaps, JSON-LD, llms.txt, entidades, answer-first, enlazado interno y noindex. Usar para cambios de SEO estático o contenido optimizado. Para contenido jurídico, ver legal-content-safety.
---

# SEO / GEO / JSON-LD — Pineda y Asociados

## Fuentes y centralización

- Metadata centralizada en `lib/seo.ts` (`buildMetadata`) y `lib/site.ts`.
- Sitemaps, robots, `llms.txt` generados en build.
- Validadores locales: `seo:ahrefs`, `validate-jsonld.mjs`, `seo:health`.

## Reglas editoriales SEO

- R13: posts 600–1200 palabras (ampliación IA 800–1000 sin inventar datos).
- R14: disclaimer en `<LegalDisclaimer>`, nunca en body.
- R15: un solo `<h1>` por página de post.
- R18: footer/home solo 10 ciudades prioritarias (Nacaome, Choluteca, San
  Lorenzo, Goascorán, San Marcos de Colón, El Triunfo, Marcovia, Pespire,
  Namasigüe, Orocuina).
- `NEXT_PUBLIC_NOINDEX=true` en staging; canonical correcto en producción.

## Procedimiento

1. Localizar la página o entidad objetivo.
2. Aplicar cambios de metadata/JSON-LD con datos verificables (R4).
3. Validar con build + validadores locales.

## Validaciones

- `npm run build` + `npm run seo:ahrefs` / `node tools/validate-jsonld.mjs`.
- `npm run seo:health`.

## Anti-patrones

- Inventar citas legales, credenciales (CAH), directorios o URLs.
- Duplicar canonicals o metadata contradictoria.
- Publicar contenido pending sin revisión humana.

## Detenerse y pedir intervención

- Contenido jurídico sin fuente canónica o sin revisión humana.
- Cambio de redirects 301 en `next.config.ts` sin autorización.
