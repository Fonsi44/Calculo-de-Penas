# Fase 3 — Post-deploy: monitorización de indexación

**Fecha deploy:** 2026-07-04
**Sitemap enviado:** 2026-07-04 (212 URLs indexables)
**Build verificado en producción:** sitemap 212, redirects origen fuera, cross-cats SSR vivos, auto-linker vivo, RelatedCities vivo.

## Estado de producción validado (Googlebot)

| Recurso | Estado | Detalle |
|---|---|---|
| `/sitemap.xml` | ✅ 200 | 212 URLs (antes 219) |
| `/robots.txt` | ✅ 200 | Referencia sitemap, sin bloqueos estratégicos |
| Redirects origen en sitemap | ✅ 0 | Eliminados (antes 7) |
| Páginas noindex en sitemap | ✅ 0 | Confirmado |
| Cadenas 301→301 | ✅ 0 | Eliminada (pension-alimenticia) |
| `X-Robots-Tag` categorías | ✅ index, follow | Confirmado en las 8 pendientes |
| 8 categorías pendientes | ✅ 200, canonical OK | index, follow, title único |
| 8 servicios pendientes | ✅ 200 | Todos accesibles |
| Páginas legales | ✅ noindex, follow | Correcto por diseño |
| Cross-cats SSR | ✅ Vivo | "Explore otras áreas" en /blog/[categoria] |
| Auto-linker | ✅ Vivo | context-link + ciudades en bodies de posts |
| RelatedCities | ✅ Vivo | "Atendemos en el sur" en posts |

## Línea base GSC (inspección vía API)

| URL | Verdict | Último rastreo | Canonical Google |
|---|---|---|---|
| `/` | PASS | 2026-06-30 | ✓ correcta |
| `/blog/extranjeria-migracion` | NEUTRAL | nunca | — |
| `/servicios-juridicos/derecho-laboral` | NEUTRAL | nunca | — |
| `/abogado-penalista-choluteca` | NEUTRAL | nunca | — |

---

## Listas priorizadas para inspección manual en GSC

> **Instrucción:** En GSC → "Inspección de URLs" → pegar URL → "Solicitar indexación".
> Google limita a ~10 solicitudes/día. Priorizar de arriba abajo.

### Nivel 1 — URLs comerciales (redistribuyen autoridad interna)

Inspeccionar en este orden (1-2 por día, rotar):

1. `/servicios-juridicos` (hub, enlaza a 13 servicios + 10 ciudades)
2. `/servicios-juridicos/derecho-laboral`
3. `/servicios-juridicos/derecho-de-familia`
4. `/servicios-juridicos/derecho-mercantil-empresarial`
5. `/servicios-juridicos/derecho-aduanero-y-comercio-exterior`
6. `/servicios-juridicos/tributario-fiscal`
7. `/servicios-juridicos/extranjeria-en-honduras`
8. `/derecho-penal` (hub penal, enlaza a landings especializadas + 10 ciudades)
9. `/abogados-en-nacaome`
10. `/abogados-en-choluteca`

### Nivel 2 — Hubs de blog (8 categorías pendientes)

Inspeccionar tras las comerciales:

1. `/blog/extranjeria-migracion`
2. `/blog/conciliacion-arbitraje`
3. `/blog/derecho-aduanero`
4. `/blog/derecho-notarial`
5. `/blog/derecho-mercantil`
6. `/blog/derecho-ambiental`
7. `/blog/regulacion-sanitaria`
8. `/blog/noticias-legales`

### Nivel 3 — Posts informativos transaccionales

Solo si quedan solicitudes de cuota. Posts que enlazan a servicios y ciudades:
- `/blog/derecho-penal/estafas-fraudes-tipos-penales-honduras`
- `/blog/derecho-penal/que-hacer-si-me-detienen-en-honduras`
- `/blog/derecho-laboral/calcular-liquidacion-laboral-honduras`
- `/blog/derecho-de-familia/pension-alimenticia-honduras-guia-completa`

---

## Tabla de monitorización semanal

Actualizar cada 7 días con datos de GSC (Cobertura → "Descubierta: actualmente sin indexar").

| URL | Estado anterior | Estado actual | Último rastreo | Canonical declarada | Canonical Google | Indexación | Acción realizada | Fecha solicitud | Resultado |
|---|---|---|---|---|---|---|---|---|---|
| `/` | PASS | PASS | 2026-06-30 | self | self | Indexada | — | — | — |
| `/blog/extranjeria-migracion` | Pendiente | Pendiente | 1970-01-01 | self | — | No indexada | Sitemap enviado | 2026-07-04 | En espera |
| `/blog/conciliacion-arbitraje` | Pendiente | Pendiente | 1970-01-01 | self | — | No indexada | Sitemap enviado | 2026-07-04 | En espera |
| `/blog/derecho-aduanero` | Pendiente | Pendiente | 1970-01-01 | self | — | No indexada | Sitemap enviado | 2026-07-04 | En espera |
| `/blog/derecho-notarial` | Pendiente | Pendiente | 1970-01-01 | self | — | No indexada | Sitemap enviado | 2026-07-04 | En espera |
| `/blog/derecho-mercantil` | Pendiente | Pendiente | 1970-01-01 | self | — | No indexada | Sitemap enviado | 2026-07-04 | En espera |
| `/blog/derecho-ambiental` | Pendiente | Pendiente | 1970-01-01 | self | — | No indexada | Sitemap enviado | 2026-07-04 | En espera |
| `/blog/regulacion-sanitaria` | Pendiente | Pendiente | 1970-01-01 | self | — | No indexada | Sitemap enviado | 2026-07-04 | En espera |
| `/blog/noticias-legales` | Pendiente | Pendiente | 1970-01-01 | self | — | No indexada | Sitemap enviado | 2026-07-04 | En espera |
| `/servicios-juridicos/derecho-laboral` | Pendiente | Pendiente | 1970-01-01 | self | — | No indexada | Sitemap enviado | 2026-07-04 | En espera |
| `/servicios-juridicos/derecho-de-familia` | Pendiente | Pendiente | 1970-01-01 | self | — | No indexada | Sitemap enviado | 2026-07-04 | En espera |
| `/servicios-juridicos/derecho-mercantil-empresarial` | Pendiente | Pendiente | 1970-01-01 | self | — | No indexada | Sitemap enviado | 2026-07-04 | En espera |
| `/servicios-juridicos/tributario-fiscal` | Pendiente | Pendiente | 1970-01-01 | self | — | No indexada | Sitemap enviado | 2026-07-04 | En espera |
| `/servicios-juridicos/extranjeria-en-honduras` | Pendiente | Pendiente | 1970-01-01 | self | — | No indexada | Sitemap enviado | 2026-07-04 | En espera |
| `/servicios-juridicos/derecho-aduanero-y-comercio-exterior` | Pendiente | Pendiente | 1970-01-01 | self | — | No indexada | Sitemap enviado | 2026-07-04 | En espera |
| `/abogado-penalista-choluteca` | Pendiente | Pendiente | 1970-01-01 | self | — | No indexada | Sitemap enviado | 2026-07-04 | En espera |

---

## Rendimiento del sitemap en GSC

| Métrica | Valor anterior | Valor actual (post-deploy) |
|---|---|---|
| Sitemap enviado | 2026-06-23 | 2026-07-04 |
| URLs en sitemap | 218 | 212 |
| URLs descubiertas | 218 | Pendiente de re-proceso |
| URLs indexadas | 0 | Pendiente de re-proceso |
| Errores | 0 | 0 |

**Discrepancia esperada:** Google puede tardar 2-7 días en re-procesar el sitemap y reflejar el conteo de 212 URLs.

## Evolución esperada

| Plazo | Métrica esperada |
|---|---|
| **7 días** | Google re-procesa sitemap (212 URLs). Las 8 categorías pendientes empiezan a mostrar "Rastreada". Home y hubs comerciales re-rastreados con la nueva arquitectura de enlaces. |
| **14 días** | 30-50% de las 8 categorías pendientes pasan a "Indexada". Posts con auto-linking empiezan a recibir rastreo. Las URLs origen de redirect desaparecen del informe "Descubierta". |
| **30 días** | 60-80% de las categorías pendientes indexadas. 40-60% de servicios pendientes indexados. Aumento de impresiones en queries de derecho penal local y ciudades del sur. |
| **60 días** | Estabilización. Las URLs que sigan sin indexar requerirán análisis individual (posible thin content, falta de autoridad externa, o competencia). |
