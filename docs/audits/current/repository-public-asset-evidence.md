---
status: current
owner: engineering
created: 2026-07-28
last_reviewed: 2026-07-28
review_due: 2026-08-04
supersedes: null
superseded_by: null
---

# Evidencia de consumidores de assets públicos

Consulta de solo lectura sobre `blog_posts.cover_image`, `blog_posts.og_image` y
`areas_juridicas.imagen`: 24 de los 40 candidatos históricos tienen consumidor
en DB. No se extrajo contenido personal ni cuerpos de artículos.

## Contratos DB

- `public/images/blog/registro-medicamentos-productos-farmaceuticos-honduras.webp`
- `public/images/blog/zonas-libres-zoli-beneficios-fiscales-honduras.webp`
- `public/images/blog/habilitacion-clinicas-hospitales-privados-honduras.webp`
- `public/images/blog/reformas-legales-recientes-honduras.webp`
- `public/images/blog/contratos-mercantiles-proteger-negocio.webp`
- `public/images/blog/contratos-civiles-honduras-errores-comunes.webp`
- `public/images/blog/constitucion-empresas-honduras-pasos-legales.webp`
- `public/images/blog/central-riesgos-consultar-impugnar-honduras.webp`
- `public/images/blog/centro-conciliacion-arbitraje-ccic-guia-honduras.webp`
- `public/images/blog/expropiacion-forzosa-derechos-propietario-honduras.webp`
- `public/images/blog/abogado-civil-choluteca.webp`
- `public/images/blog/pension-alimenticia-choluteca.webp`
- `public/images/blog/abogado-familia-choluteca.webp`
- `public/images/blog/abogados-en-san-marcos-de-colon-choluteca.webp`
- `public/images/blog/abogados-en-san-lorenzo.webp`
- `public/images/blog/abogados-en-pespire-choluteca.webp`
- `public/images/blog/abogado-empresas-san-lorenzo.webp`
- `public/images/blog/abogado-aduanero-san-lorenzo.webp`
- `public/images/blog/abogados-en-amapala-valle.webp`
- `public/images/blog/abogados-en-nacaome.webp`
- `public/images/blog/abogados-en-choluteca.webp`
- `public/images/blog/abogado-laboral-choluteca.webp`
- `public/images/blog/abogado-penalista-choluteca.webp`
- `public/images/blog/abogados-en-marcovia-choluteca.webp`

## Contratos externos

- `public/pinedayasociados-indexnow-key-2026.txt`: ubicación pública de
  verificación/clave IndexNow; se conserva aunque el nombre no esté importado.
- `public/.well-known/bbbbda6cdb1e4e2cbe8f6f81c1886f58.txt`: recurso
  `.well-known` direccionado externamente; se conserva por contrato URL.

Los 14 candidatos restantes no tenían referencia estática, DB ni contrato
externo conocido y se retiraron en un lote reversible validado por `npm run verify`.
