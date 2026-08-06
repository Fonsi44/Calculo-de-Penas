---
status: current
owner: engineering
created: 2026-08-03
last_reviewed: 2026-08-06
review_due: 2026-11-04
supersedes: null
superseded_by: null
---
# Decisión temporal: autoría corporativa del blog

**Fecha:** 2026-08-03
**Estado:** vigente (excepción temporal autorizada por el propietario)
**Ámbito:** blog público, JSON-LD de artículos, sitemap, `llms.txt`

## Decisión adoptada

La autoría pública de los artículos del blog de Pineda y Asociados seguirá
siendo temporalmente la corporativa (`Pineda y Asociados`), manteniendo la
variante canónica que ya utiliza el repositorio. Esta excepción es consciente
y temporal respecto al criterio del Plan Maestro SEO/GEO, que recomienda autor
individual para los artículos indexables.

## Alcance

- Aplica a todo el blog publicado y a la cola editorial.
- La marca puede seguir figurando como autor, firmante y editor.
- La revisión institucional histórica (`published_firm_reviewed`) continúa
  siendo válida para indexación durante la vigencia de esta excepción.

## Motivo

Mantener la autoría corporativa temporalmente por decisión expresa del
propietario del sitio. No se ha completado la migración de autoría individual
ni la firma por abogado de los artículos, y no debe sustituirse la autoría por
abogados individuales sin la confirmación previa del despacho.

## Elementos que quedan fuera de esta implementación

Queda expresamente prohibido, salvo autorización expresa posterior:

- sustituir la autoría del blog por abogados individuales;
- modificar en masa el campo `author`;
- eliminar el fallback corporativo;
- cambiar la firma institucional por firma individual;
- modificar los estados editoriales solo para satisfacer el requisito de
  autoría individual;
- alterar la cola de 40 propuestas editoriales por esta cuestión;
- cambiar `author` o `reviewedBy` en JSON-LD por motivos relacionados con esta
  decisión;
- crear migraciones de base de datos para obligar a usar autores individuales;
- bloquear la indexación actual exclusivamente porque el autor sea el bufete.

## Riesgo pendiente

Riesgo YMYL medio: Google valora positivamente un autor humano identificable
en contenidos jurídicos. Mientras el autor sea corporativo, el E-E-A-T de los
artículos depende de la entidad `Organization` y de los perfiles públicos de
los abogados del equipo. La indexación actual se conserva por decisión del
propietario; no debe presentarse como cumplimiento total del Plan Maestro.

## Condición para reconsiderarla en el futuro

La excepción se reconsiderará cuando:

1. el despacho confirme la asignación de abogado responsable por área y
   autorice la firma individual; y
2. se complete la revisión jurídica y la firma (hash) de los artículos
   publicados y de la cola de propuestas.

Hasta entonces, ningún agente puede cambiar la autoría del blog sin
autorización expresa del propietario.
