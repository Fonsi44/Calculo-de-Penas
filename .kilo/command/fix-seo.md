---
description: Corrige problemas SEO detectados en una auditoría previa. Aplica correcciones on-page, schemas, metadatos, headings y enlazado según prioridad. Usa los hallazgos de /auditar-seo como base.
agent: SEO Senior
---
Corrige problemas SEO específicos detectados en el sitio.

Si se especifica un hallazgo concreto (número o descripción), corrige solo ese.
Si no se especifica, revisa los hallazgos de la última auditoría y corrige por orden de prioridad (críticos primero).

Para cada corrección:
1. Identifica el archivo exacto a modificar
2. Lee el archivo actual para entender el contexto
3. Aplica el cambio mínimo necesario
4. Verifica que no rompe otros elementos (schemas, canonical, indexabilidad)
5. Ejecuta `npm run build` para validar que compila
6. Marca como VALIDADO o NO VALIDADO según corresponda

No modifiques la arquitectura del framework ni las APIs. Céntrate en:
- Metadatos (title, description, OG, Twitter Cards)
- Schemas JSON-LD
- Headings (H1-H6)
- Enlazado interno
- Contenido editorial (textos, no estructura visual)
- Sitemap y robots.txt
- SEO local (NAP, geo tags)

$ARGUMENTS
