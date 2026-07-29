# Estado de implementación SEO/GEO

Fecha de corte: 2026-07-28

## Veredicto

`FASE 4 TÉCNICAMENTE COMPLETADA — AUTORIZACIÓN PRODUCTIVA REQUERIDA`. La home es la única URL comercial primaria para Nacaome; la
landing de oficina tiene intención operativa secundaria y el artículo conserva
intención informativa. Los 175 artículos están clasificados y las 40 prioridades
disponen de propuesta individual, cuerpo completo, metadata, respuesta directa,
claim, fuente, pregunta jurídica, patch y rollback. La publicación en Production
sigue bloqueada por la puerta editorial y la revisión jurídica humana.

## Base y trazabilidad

- Base limpia: `origin/main` en `57aa3edd39ea1aed769d8cd7eb807ac71eb47602`.
- Rama: `feat/seo-geo-master-implementation`.
- Plan canónico: 1.616 líneas, SHA-256
  `23a57890193c318341cf907cfb49cc4c908a699f619810f584e8261469c0fb42`.
- PR #23 auditado; solo se portaron cambios demostrables. No se portaron
  patches o paquetes vacíos ni inventarios con valores mock.

## Datos live

- GSC: 340 clics, 14.055 impresiones y 467 pares consulta×página.
- GA4: 156 usuarios en la extracción disponible.
- Bing: 6.932 URLs rastreadas y 290 consultas.
- `seo:doctor`: 21 OK, 0 ERROR, 2 pendientes opcionales.

## Firma editorial y blog

- Registros totales actuales: 175.
- Publicados actuales: 134.
- No publicados: 41.
- Estado histórico de 141: snapshot previo documentado en
  `docs/blog-duplicity-report.md`; no representa la DB actual.
- 134 publicados con revisión institucional histórica confirmada por el despacho.
- 134 hashes persistidos y coincidentes en Neon staging aislado.
- 134 firmas institucionales válidas; 0 firmas individuales activadas.
- 134 artículos indexables antes y después; 0 retiradas.
- 40 propuestas nuevas separadas en `PENDING_RESIGNATURE`.
- Release A está preparado; Release B permanece bloqueado por firma.

## Infraestructura conservada y corrección editorial de Fase 3

- 40 artículos agrupados en cinco lotes: penal, laboral, familia,
  civil-notarial y mercantil.
- La capa anterior de títulos, metas, respuestas, fuentes, paquetes y patches
  está marcada `INVALID_GENERIC_SCAFFOLD_DO_NOT_APPLY`.
- Las 72 relaciones claim-documento anteriores no se presumen válidas; deben
  reconstruirse y verificarse individualmente.
- 53 clusters sin objetivo público seguro documentados; no se enlazan artículos
  `lawyer_review_pending` solo para satisfacer una métrica.
- Se conservan hashes y datos de deriva como evidencia de reconstrucción.
  Production está explícitamente prohibida.
- El gate `npm run seo:phase3-quality` valida 40 propuestas, cinco lotes de ocho
  y cero duplicaciones o sustituciones semánticas por encima del umbral.
- Diez artículos representativos —dos por lote— se cargan únicamente en Preview.
  Mantienen `lawyer_review_pending`, `noindex` y no atribuyen `reviewedBy`.

## Bloqueos posteriores a la Fase 4

- Autorización productiva agrupada para 0059, modo migrado, merge y Release A.
- Confirmación futura por allowlist para cualquier firma individual.
- La DB exclusiva de Vercel Preview no contiene artículos publicados. El
  frontend ya no falla si faltan columnas operativas de revisión IA: `/blog`
  responde 200 sin resultados y las rutas de posts ausentes responden 404.
- Las 40 propuestas no forman parte de Release A y requieren nueva firma antes
  de cualquier publicación.

## Verificación de Preview

- Deployment `dpl_J9JbPDDwo4k7Lxo9WmFszmMMyqhU`: `Ready`.
- Portada, despacho, servicios y tres perfiles: respuesta correcta.
- Perfil de Danilo: un H1 y tres bloques JSON-LD observados.
- Checks del Draft PR #25: CI completa, Lighthouse, GitGuardian y Vercel en
  verde.
