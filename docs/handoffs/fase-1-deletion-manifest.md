# Manifiesto de borrados — Fase 1

Fecha: 18 de julio de 2026. Fuente de comparación: `HEAD` antes de esta
corrección. Decisión conservadora: la documentación se restaura; solo permanece
eliminado código exclusivo del CMS/Admin retirado y sus pruebas asociadas.

| Ruta | Estado inicial | Decisión | Categoría | Motivo | Dependencias comprobadas |
|---|---|---|---|---|---|
| 74 rutas `.md`, `.mc` y `.csv` de raíz, `auditoria-seo/`, `auditoria_seo/`, `docs/auditoria/` y `docs/audits/` | Eliminado | RESTAURADO | B | Auditorías, informes, decisiones y evidencia histórica no afectan runtime. | Restauración exacta desde `HEAD`; búsqueda de secretos sin hallazgo real. |
| `app/api/admin/{analytics,areas-juridicas,blog,cache-revalidate,categorias-*,faq,medios,menus,pages,preview,redirects,search-console,seo,site-config,tags,upload,visual-editor}/**` | Eliminado | MANTENER ELIMINADO | A | APIs de escritura, preview, configuración y analítica del CMS/Admin retirado. | Navegación Admin y build; no hay import dinámico activo. |
| `app/intranet/admin/{blog,config,faq,medios,menus,pages,seo,servicios,sgie/usuarios}/**` | Eliminado | MANTENER ELIMINADO | A | Pantallas CMS, configuración pública y duplicado de usuarios. | Layout Admin actual no las enlaza; build correcto previo. |
| `components/admin/{base-*,chart-card,dashboard-charts,data-table,empty-state,integration-status-card,metric-card,page-block-*,page-metadata-panel,page-visual-editor,trend-badge,visual-editor-*}.tsx` | Eliminado | MANTENER ELIMINADO | A | Componentes exclusivos de dashboard CMS/editor visual. | Búsqueda de imports activos sin referencias. |
| `components/ui/rich-text-editor.tsx` | Eliminado | MANTENER ELIMINADO | A | Editor de contenido CMS retirado. | Búsqueda de imports activos sin referencias. |
| `lib/visual-editor/{components,script,styles}.ts` | Eliminado | MANTENER ELIMINADO | A | Infraestructura del editor visual retirado. | Búsqueda de imports activos sin referencias. |
| `tests/admin-api.test.ts` | Eliminado | MANTENER ELIMINADO | A | Prueba exclusiva de APIs de categorías, tags, redirects y áreas del CMS. | Sus rutas se retiraron deliberadamente. |
| `tests/e2e/critical-preview.spec.ts` | Eliminado | MANTENER ELIMINADO | A | Prueba exclusiva del endpoint de preview CMS retirado. | Endpoint `/api/admin/preview` eliminado. |
| `tests/e2e/critical-upload.spec.ts` | Eliminado | MANTENER ELIMINADO | A | Prueba exclusiva de `/api/admin/upload` CMS retirado. | Endpoint retirado; subida documental SGIE no se elimina. |

## Totales

- Borrados encontrados inicialmente: **139**.
- Borrados funcionales conservados: **65**.
- Documentos históricos restaurados: **74**.
- Artefactos temporales descartados: **0**.
- Ambiguos restaurados: **0**; se aplicó conservación a toda documentación.
- Archivos con posible secreto: **0**. Las coincidencias revisadas fueron plantillas,
  URLs de ejemplo o identificadores jurídicos, no credenciales.

No se eliminaron lectores públicos, tablas, schema ni datos. La documentación
restaurada no reactiva rutas administrativas ni modifica el bundle de runtime.

## Inventario exhaustivo y reproducibilidad

La tabla anterior clasifica cada ruta por su familia funcional. Para conservar
el inventario exacto, sin copiar una lista propensa a desactualizarse, la fuente
reproducible es el diff de Git aplicado sobre el commit base:

```powershell
git diff --name-status c90fd7b --
```

En el estado de esta corrección, el resultado se interpreta de forma cerrada:

- toda ruta `D` que termine en `.md`, `.mc` o `.csv` pertenece a **B** y fue
  restaurada (74 rutas);
- las 65 rutas `D` restantes pertenecen a **A** y son exactamente las familias
  funcionales enumeradas en la tabla (APIs/pantallas/componentes/editor/tests
  exclusivos del CMS/Admin);
- no hay rutas en **C** ni **D**; una ruta no clasificable se habría restaurado
  antes de esta entrega.

Así el manifiesto mantiene tanto el detalle verificable por ruta como el criterio
de decisión, sin depender de un listado manual divergente.
