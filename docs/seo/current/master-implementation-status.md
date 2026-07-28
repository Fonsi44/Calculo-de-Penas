# Estado de implementación SEO/GEO

Fecha de corte: 2026-07-28

## Veredicto

`FASE 3 IMPLEMENTADA EN PREVIEW`. La home es la única URL comercial primaria
para Nacaome; la landing de oficina tiene intención operativa secundaria y el
artículo conserva intención informativa. Los 175 artículos están clasificados,
40 prioridades tienen mejora documental aplicada en la capa pending, patches
seguros y paquetes concretos para revisión. La publicación en Production sigue
bloqueada por la puerta editorial y la revisión jurídica humana.

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

## Blog

- Registros totales actuales: 175.
- Publicados actuales: 134.
- No publicados: 41.
- Estado histórico de 141: snapshot previo documentado en
  `docs/blog-duplicity-report.md`; no representa la DB actual.
- `lawyer_verified`: 0.
- Legacy `reviewed`: 131; no se equipara a revisión jurídica.
- Autor genérico o vacío: 175.
- Por contrato de seguridad editorial, ninguno es indexable/sitemap hasta una
  revisión jurídica humana real y una migración editorial autorizada.

## Implementación documental de Fase 3

- 40 artículos agrupados en cinco lotes: penal, laboral, familia,
  civil-notarial y mercantil.
- 14 remediaciones prioritarias de title y meta registradas.
- 72 relaciones claim-documento en el registro jurídico: documentos
  verificados y fuentes oficiales que requieren concreción adicional separadas.
- 53 clusters sin objetivo público seguro documentados; no se enlazan artículos
  `lawyer_review_pending` solo para satisfacer una métrica.
- 40 patches dry-run con hash de body, `updatedAt`, estado esperado,
  transacción, drift check y rollback. Production está explícitamente prohibida.

## Bloqueos posteriores a la Fase 3

- Revisión jurídica humana específica para convertir artículos concretos a
  `lawyer_verified`.
- Autorización productiva para escrituras de DB, redirects, deployment y merge.
- La DB exclusiva de Vercel Preview no contiene artículos publicados. El
  frontend ya no falla si faltan columnas operativas de revisión IA: `/blog`
  responde 200 sin resultados y las rutas de posts ausentes responden 404.
- La Fase 4 debe validar los claims con los abogados, resolver fuentes ambiguas,
  autorizar patches concretos y decidir el cutover. La Fase 3 no atribuye
  revisiones jurídicas inexistentes.

## Verificación de Preview

- Deployment `dpl_J9JbPDDwo4k7Lxo9WmFszmMMyqhU`: `Ready`.
- Portada, despacho, servicios y tres perfiles: respuesta correcta.
- Perfil de Danilo: un H1 y tres bloques JSON-LD observados.
- Checks del Draft PR #25: CI completa, Lighthouse, GitGuardian y Vercel en
  verde.
