---
status: current
owner: seo
created: 2026-08-03
last_reviewed: 2026-08-06
review_due: 2026-11-04
supersedes: null
superseded_by: null
---
# Auditoría del dominio canónico — Pineda y Asociados

**Fecha:** 2026-08-03
**Fuente:** verificación real de DNS, Vercel, HTML de producción, GSC, GA4 y Bing.
**Repositorio:** `Fonsi44/Calculo-de-Penas` (rama `feat/seo-data-intelligence-v2`)

## Conclusión

```
CANONICAL_PRODUCTION_ORIGIN = https://www.www.pinedayasociadoshn.com
VARIANTE_INVALIDA           = variante sin "da" en "asociados" (NO existe en DNS)
DOMAIN_SIGNAL_SPLIT         = NONE                   (todas las señales coinciden)
```

El dominio canónico inequívoco es **`www.www.pinedayasociadoshn.com`** (con "asociados", es decir
con la sílaba "da"). Cualquier variante que elimine la "da" de "asociados" (que
la escriba como "asocios") **no existe en el DNS público** (NXDOMAIN en 8.8.8.8)
y solo aparece como typo en mensajes históricos. No hay conflicto entre dominio
desplegado e indexado.

## Señales recopiladas

| Señal                                            | Valor                                                        | Coincide |
| ------------------------------------------------ | ------------------------------------------------------------ | -------- |
| `.env.example` `NEXT_PUBLIC_SITE_URL`            | `https://www.www.pinedayasociadoshn.com`                           | ✅       |
| `.env.example` comentario GSC                    | `sc-domain:pinedayasociadoshn.com`                             | ✅       |
| HTML producción — canonical                      | `https://www.www.pinedayasociadoshn.com`                           | ✅       |
| HTML producción — robots meta                    | `index, follow`                                              | ✅       |
| HTML producción — GA4 Measurement ID             | `G-L2PGBN3SWK` (presente)                                    | ✅       |
| `robots.txt` — Sitemap                           | `https://www.www.pinedayasociadoshn.com/sitemap.xml`               | ✅       |
| Sitemap index (producción)                       | 5 segmentos XML, origen canónico                             | ✅       |
| Vercel — dominio registrado                      | `pinedayasociadoshn.com` (registrar Vercel, expira 2027-06-05) | ✅       |
| Vercel — deployment Production                   | `justicia-verdadera-ezgrrxbke-…vercel.app` (Ready)           | ✅       |
| GSC — propiedad                                  | `https://www.www.pinedayasociadoshn.com/` (siteOwner)              | ✅       |
| GA4 — propiedad                                  | `541022095` · measurement `G-L2PGBN3SWK`                     | ✅       |
| Bing — sitio                                     | `https://www.www.pinedayasociadoshn.com/`                          | ✅       |
| DNS público (8.8.8.8) `www.www.pinedayasociadoshn.com` | resuelve → 64.29.17.1 / 216.198.79.1                         | ✅       |
| HTTP producción                                  | 200 en home y 22 URLs auditadas                              | ✅       |
| `lib/site.ts` / `normalizeSiteOrigin`            | usa `NEXT_PUBLIC_SITE_URL`                                   | ✅       |
| `llms.txt`                                       | URLs con `https://www.www.pinedayasociadoshn.com`                  | ✅       |

## Aliases y redirects

- Solo existe la variante `www`. No se detectó apex `pinedayasociadoshn.com` con
  respuesta duplicada: `www` es el origen elegido y el canonical en todas las
  páginas.
- No hay 200 duplicados entre variantes (la variante inválida, sin la "da" de
  "asociados", no resuelve en DNS).
- No se requiere ningún cambio de DNS: el dominio desplegado coincide con el
  indexado. **No se modifica DNS** (requeriría autorización adicional).

## Propiedades de medición

- **Search Console:** propiedad `https://www.www.pinedayasociadoshn.com/` (siteOwner) —
  la misma que consultan los extractores.
- **GA4:** propiedad `541022095`, measurement `G-L2PGBN3SWK` — coincide con el
  tag presente en producción.
- **Bing Webmaster:** sitio `https://www.www.pinedayasociadoshn.com/`.

## Protección contra reintroducción del typo

- Se añadió un **gate de enforce** (`scripts/seo-canonical-domain-enforce.mjs`,
  vía `npm run seo:canonical:check`) que deriva el dominio correcto de
  `.env.example` y falla si aparece la variante sin la "da" de "asociados" en
  archivos ejecutables o documentación operativa (excluye tests de protección y
  archives históricos).

## Recomendación

- Mantener `https://www.www.pinedayasociadoshn.com` como origen canónico único.
- En scripts y config, **nunca hardcodear** el dominio: usar
  `scripts/seo-data-config.mjs` → `canonicalOrigin()` (lee `NEXT_PUBLIC_SITE_URL`
  o `.env.example`), para evitar variantes con typo.
- No crear alias del apex ni de la variante inválida.
