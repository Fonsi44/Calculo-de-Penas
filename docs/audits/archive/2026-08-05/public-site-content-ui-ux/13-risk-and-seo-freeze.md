# 13 — Riesgos y congelamiento SEO

## Congelamiento

La medición de 28 días concluye el **2026-09-01**. Hasta entonces, las recomendaciones se clasifican así:

### `SAFE_BEFORE_MEASUREMENT`

- Documentación, inventarios y matriz de propietarios.
- Verificación read-only de SHA desplegado, contenido DB y cachés.
- Preparación de tests visuales/semánticos sin despliegue.
- Revisión de código muerto sin eliminarlo.
- Tokenización estrictamente equivalente solo si no se despliega o si SEO autoriza.

### `WAIT_UNTIL_2026-09-01`

- Reordenar secciones.
- Cambiar texto visible, H2/H3, claims o CTA.
- Fusionar/eliminar bloques.
- Cambiar jerarquía de cards o prominencia de botones.
- Sustituir hero si altera HTML, orden semántico o Core Web Vitals/conversión.
- Cambiar FAQs visibles o schema.

### `REQUIRES_SEO_REVIEW`

- Cualquier cambio en las 104 URLs experimentales.
- Canibalización entre landings locales, especializadas, hubs y servicios.
- Cambios de enlazado interno a escala.
- Cambios de contenido principal o intención.

### `REQUIRES_LEGAL_REVIEW`

- Claims de gratuidad/sin compromiso.
- Cobertura geográfica, presencia en juzgados, credenciales y años.
- Avisos jurisdiccionales y urgencias.
- Confidencialidad, secreto profesional y límites de resultados.

### `REQUIRES_CONTENT_DB_CHANGE`

- Home, Despacho, Servicios, Penal, España y Consulta cuando el texto venga de `page_content`.
- FAQ corporativa desde `faq_entries`.
- Cualquier claim publicado desde DB que no coincida con defaults del código.

## Riesgo de afectar al blog

Componentes/datos compartidos detectados:

- `BlogHighlights` y `BlogCard`.
- Perfiles que leen atribuciones de `blog_posts`.
- Categorías/nombres del blog utilizados en perfiles y bloques relacionados.
- `PublicHeader`/`PublicFooter` y tokens globales.

Regla: los cambios de páginas no-blog deben hacerse con props/variantes locales o migraciones de uso, no modificando el comportamiento global del blog. No tocar artículos, H1, metadatos, autoría, categorías, buscador ni enlazado interno del blog.

## Deriva producción/rama

El código de `711eb69dc582afada4c905800a3400a026a69da4` muestra Servicios y FAQ simplificados, mientras que el rastreo público disponible conserva versiones anteriores más largas y claims no canónicos. Posibles causas: caché de buscador, despliegue anterior, contenido DB distinto o revalidación ISR. Debe verificarse por GET:

1. SHA de deployment de producción.
2. HTML actual con cache bypass autorizado.
3. claves activas de `page_content` y FAQ en lectura.
4. revalidación/ISR, sin invalidar caché durante esta misión.

## Decisiones humanas pendientes

- ¿La evaluación inicial es gratuita, de pago o depende del caso?
- ¿Qué significa exactamente «atención directa sin intermediarios»?
- ¿Qué evidencia respalda «más de 15 años» y «presencia activa en juzgados»?
- ¿Qué ciudades constituyen cobertura habitual frente a diligencias puntuales?
- ¿Qué nivel de protagonismo debe tener el blog en páginas comerciales?
- ¿Se preserva un perfil institucional o se priorizan fotografías reales de equipo/oficina?
