# Rollback Lote 4 - Fase 6

Este documento detalla el procedimiento para deshacer todos los cambios aplicados en la base de datos (Neon) y en el repositorio para el Lote 4.

## 1. Cambios Realizados
- **Base de Datos (Neon):** Se actualizaron 15 registros con los resultados de la auditoría jurídica IA (12 completed, 3 needs_human_review).
- **Archivos de Código/Contenido:** Ningún cuerpo de artículo, título o descripción fue modificado en el repositorio (0 modificaciones a bodies).

## 2. Procedimiento de Restauración

### A. Restauración de Base de Datos (Neon)
Para revertir los estados de revisión de IA a su valor inicial (`not_started` / nulo):

Ejecutar el siguiente script SQL en la consola de Neon, o un script TypeScript equivalente:

```sql
UPDATE blog_posts
SET 
  ai_review_status = 'not_started',
  ai_review_requires_human = false,
  ai_review_claims_count = 0,
  ai_review_confirmed_claims = 0,
  ai_review_corrected_claims = 0,
  ai_review_unresolved_claims = 0,
  ai_review_sources = '[]'::jsonb,
  ai_reviewed_at = NULL,
  ai_review_provider = NULL,
  ai_review_model = NULL,
  ai_review_version = NULL
WHERE slug IN (
  'registro-medicamentos-productos-farmaceuticos-honduras',
  'contratos-empleadas-domesticas-obligaciones-honduras',
  'registro-sanitario-alimentos-arsa-paso-a-paso-honduras',
  'calcular-prestaciones-laborales-honduras',
  'habilitacion-clinicas-hospitales',
  'zonas-libres-zoli-beneficios-fiscales-honduras',
  'reformas-legales-recientes-honduras',
  'contratos-mercantiles-proteger-negocio',
  'contratos-civiles-honduras-errores-comunes',
  'licencia-ambiental-categorias-plazos-honduras',
  'constitucion-empresas-honduras-pasos-legales',
  'centro-conciliacion-arbitraje-ccic',
  'expropiacion-forzosa-derechos-propietario-honduras',
  'contratacion-publica-licitaciones',
  'central-riesgos-consultar-impugnar-honduras'
);
```

### B. Restauración de Código (Git)
En caso de requerirse revertir los commits locales del Lote 4:

```bash
git reset --hard HEAD~1
```
*(Dado que no hay cambios en los cuerpos de los artículos, esto solo removería los JSONs de auditoría y los scripts de soporte).*
