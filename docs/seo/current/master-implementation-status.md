# Estado de implementación SEO/GEO

Fecha de corte: 2026-07-29

## Veredicto

`INCIDENTE DE INVENTARIO EN RECUPERACIÓN — PRODUCCIÓN BLOQUEADA`. La Preview
canónica había sustituido silenciosamente el inventario histórico por 15
fixtures. La causa está corregida localmente y la base staging aislada contiene
141/141 fuentes históricas, pero el incidente no se cerrará hasta validar una
nueva Preview desplegada. La publicación en Production continúa bloqueada.

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
- Baseline histórico reconciliado: 141 rutas, compuesto por 134 artículos
  actualmente publicados, 1 artículo informativo de Nacaome restaurado en
  Preview y 6 rutas locales consolidadas mediante redirect.
- Los siete cuerpos que explican la diferencia continúan conservados en
  Production y en la base staging aislada; no se han borrado.
- 134 publicados con revisión institucional histórica confirmada por el despacho.
- 135 hashes persistidos y coincidentes en Neon staging aislado, incluyendo el
  artículo informativo de Nacaome recuperado.
- 135 firmas institucionales válidas en staging; 0 firmas individuales activadas.
- Production permanece con 134 artículos indexables; Preview recuperada simula
  135 artículos y 6 redirects sin retirar ninguna ruta histórica.
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
- Las diez propuestas representativas ya no se superponen sobre las versiones
  históricas de la Preview canónica. Permanecen separadas en los artefactos
  editoriales con estado `PENDING_RESIGNATURE`.

## Incidente de inventario del blog

- Causa raíz 1: `getPublishedPosts` y `getPostBySlug` sustituían una consulta
  vacía por `data/seo/preview-blog-fixtures.json`.
- Causa raíz 2: ese archivo contenía 15 entradas: 4 copias sanitizadas, 10
  propuestas pendientes y 1 fixture sintético.
- Causa raíz 3: `lib/blog.ts` superponía 10 cuerpos propuestos sobre cuerpos
  históricos en la lectura pública.
- Causa raíz 4: la búsqueda del hub serializaba solo 80 de 134 metadatos.
- Causa raíz 5: faltaba el redirect de la ruta histórica
  `/blog/practica-legal/abogados-en-nacaome`.
- Corrección: origen explícito `database`, `full-public-snapshot` o
  `limited-test-fixtures`; la Preview canónica exige una fuente completa y
  falla si recibe menos de 134 publicados.
- Estado staging: 141 filas históricas, 135 publicadas, 6 redirects, 0 cuerpos
  distintos y 0 fixtures sintéticos.
- Evidencia: `blog-recovery-inventory.csv`, `blog-recovery-diff.csv` y
  `npm run seo:blog-inventory-recovery`.

## Bloqueos posteriores a la Fase 4

- Autorización productiva agrupada para 0059, modo migrado, merge y Release A.
- Confirmación futura por allowlist para cualquier firma individual.
- La Preview principal debe validarse contra la rama Neon aislada con 141
  fuentes históricas; no puede degradarse a fixtures limitados.
- Las 40 propuestas no forman parte de Release A y requieren nueva firma antes
  de cualquier publicación.

## Verificación de Preview

- La deployment afectada permanece como evidencia del incidente y mostraba 15
  fixtures.
- PR #25 restaurada a Draft.
- Nueva Preview de recuperación: pendiente de commit, push y validación de las
  141 rutas.
