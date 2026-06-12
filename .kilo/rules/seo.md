# Reglas SEO persistentes — Pineda y Asociados

Estas reglas son vinculantes para toda modificación con impacto SEO en el proyecto. Cualquier agente o cambio debe respetarlas. En caso de conflicto, prevalecen las reglas de seguridad e integridad de datos sobre las SEO.

---

## R1. Una URL = una intención de búsqueda principal

Cada URL del sitio debe responder a una única intención de búsqueda clara: informacional, comercial, transaccional o navegacional. No se puede crear una URL nueva que intente responder a dos intenciones distintas simultáneamente.

## R2. Revisar canibalización antes de crear nuevas páginas

Antes de crear cualquier página, post, landing o contenido nuevo, se debe verificar:
- ¿Existe ya una URL que cubra esta intención?
- ¿Hay otra página posicionando para la misma keyword objetivo?
- Si existe, ¿se debe consolidar (301 + merge), canonicalizar, o diferenciar la intención?

Nunca crear una página nueva que compita con una existente sin resolver el conflicto primero.

## R3. Alinear title, H1, primer párrafo y headings con la intención

La coherencia semántica entre estos elementos es obligatoria:
- `<title>`: keyword principal al inicio, marca al final con `|`, 50-60 caracteres
- `<h1>`: contiene la keyword principal, único por página, alineado con title
- Primer `<p>`: responde a la intención de búsqueda, contiene la keyword principal
- H2-H6: jerarquía semántica sin saltos, subtemas reales

## R4. Evitar keyword stuffing y repetición artificial

- La keyword principal debe aparecer de forma natural, no forzada
- No repetir la misma keyword en cada heading sin variación semántica
- Usar variantes, sinónimos, términos relacionados y entidades del dominio legal
- La densidad de keywords no debe superar lo razonable para lenguaje natural (≈1-2% para la keyword principal)

## R5. No inventar datos, métricas, rankings ni ubicaciones

Prohibido afirmar o insinuar:
- Rankings o posiciones en Google que no estén verificados en GSC
- Métricas de tráfico sin fuente real (GA4, GSC)
- Datos de clientes, casos o resultados sin evidencia
- Ubicaciones (sedes, oficinas) que no existan
- Premios, certificaciones o afiliaciones no verificables

## R6. Priorizar cambios por impacto SEO

Todo cambio debe clasificarse según su impacto esperado:

| Nivel | Criterio | Acción |
|-------|----------|--------|
| 🔴 Crítico | Bloquea indexación o destruye tráfico | Corregir inmediatamente |
| 🟡 Importante | Reduce visibilidad o CTR | Planificar en el sprint actual |
| 🟢 Recomendable | Mejora marginal con bajo esfuerzo | Aplicar si no bloquea otras tareas |

## R7. Mantener coherencia entre contenido, arquitectura y enlazado interno

- La jerarquía de URLs debe reflejar la jerarquía temática del sitio
- Los breadcrumbs deben ser consistentes en toda la arquitectura
- Los enlaces internos deben usar anchors descriptivos (no "clic aquí")
- Las pillar pages enlazan a contenido de apoyo, y viceversa
- Ninguna página importante debe quedar huérfana (sin enlaces internos entrantes)

## R8. Datos estructurados obligatorios por tipo de página

| Tipo de página | Schemas requeridos |
|---------------|-------------------|
| Home | WebSite, Organization, LocalBusiness+LegalService, WebPage |
| Página de servicio | WebPage, Service, BreadcrumbList |
| Post del blog | WebPage, BlogPosting, BreadcrumbList |
| FAQ | WebPage, FAQPage |
| Página de contacto | WebPage, ContactPoint |
| Páginas legales | WebPage |

Los schemas JSON-LD deben renderizarse server-side (no client-side) y ser válidos según Schema.org.

## R9. No degradar el SEO existente

Cualquier modificación debe:
- No empeorar Core Web Vitals (LCP, TBT, CLS)
- No romper schemas JSON-LD existentes
- No eliminar o modificar canonical correctamente configurados
- No introducir redirecciones innecesarias
- No eliminar contenido que ya tenga tráfico orgánico (verificar primero en GSC/GA4 si hay datos disponibles)
- Mantener o mejorar la indexabilidad de todas las páginas

## R10. Validación obligatoria

Antes de considerar un cambio SEO como completado:
1. `npm run build` debe pasar sin errores
2. Verificar schemas JSON-LD con validator.schema.org (o inspección manual de estructura)
3. Verificar que el HTML servido contiene los cambios (no solo client-side)
4. Si el cambio afecta al sitemap, verificar `GET /sitemap.xml`
5. Si el cambio afecta a robots.txt, verificar `GET /robots.txt`
6. Marcar como NO VALIDADO cualquier verificación que no pueda ejecutarse

## R11. SEO local (Nacaome, Valle, Honduras)

- NAP (Name, Address, Phone) debe ser idéntico en todo el sitio
- LocalBusiness schema debe incluir `geo` con lat/lon reales
- Las páginas principales deben incluir keywords geográficas en title, H1 y contenido
- Las geo meta tags (`geo.region`, `geo.placename`, `geo.position`) deben estar presentes en el layout público
- La página de Google Business Profile debe estar vinculada desde el sitio

## R12. IndexNow y sitemap automático

- El sitemap se genera dinámicamente en `app/sitemap.ts`
- IndexNow envía URLs nuevas/modificadas automáticamente tras build (`scripts/submit-indexnow.mjs`)
- No modificar el endpoint de IndexNow sin coordinar con el sistema de build
- Las URLs del sitemap deben reflejar solo contenido indexable (no noindex, no canonicalizadas a otra URL)
