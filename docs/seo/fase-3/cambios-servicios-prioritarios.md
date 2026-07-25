# Cambios — Servicios jurídicos prioritarios (FASE 3 §23)

**Fecha:** 2026-07-25
**Rama:** `main` (HEAD inicial `a478f5d6`)
**Modo:** `IMPLEMENTACIÓN`
**Base:** FASE 1 + FASE 2 preservadas.

---

## 1. Tabla resumen por URL (instrucción §23)

| URL | Intención | H1 | Respuesta directa | Documentos | Proceso | FAQ | CTA | Schema | Estado jurídico |
| --- | --------- | -- | ----------------- | ---------- | ------- | --- | --- | ------ | --------------- |
| `/derecho-penal` | Abogado penalista en Nacaome y el sur de Honduras | `Abogados Penalistas en Nacaome, Valle — Defensa Penal Técnica` (sin cambios) | Sí (AnswerBlock existente refinado + campos del hub enriquecido) | Sí (5 ítems + nota urgencia) | Sí (8 pasos prudentes, sin plazos cerrados) | 8 (ampliada de 4) | `Solicitar atención por una detención, citación o audiencia` → `?motivo=derecho-penal` | Service + BreadcrumbList + FAQPage (HubFaq) | `needs_update` |
| `/servicios-juridicos/derecho-de-familia` | Abogado de familia en Nacaome: divorcio, custodia y alimentos | `Abogado de Familia en Nacaome` (refinado) | Sí (citable, sin cifras P01) | Sí (5 ítems + nota menores) | Sí (8 pasos) | 7 (ampliada de 4) | `Explicar mi situación familiar` → `?motivo=derecho-de-familia` | Service + BreadcrumbList + FAQPage | `needs_update` |
| `/servicios-juridicos/derecho-laboral` | Abogado laboral en Nacaome: despidos, prestaciones y reclamaciones | `Abogado Laboral en Nacaome` (refinado) | Sí (diferencia 13er/14er mes sin fechas nuevas) | Sí (6 ítems) | Sí (8 pasos) | 7 (ampliada de 3) | `Solicitar revisión inicial de mi situación laboral` → `?motivo=derecho-laboral` | Service + BreadcrumbList + FAQPage | `needs_update` |
| `/servicios-juridicos/derecho-civil-y-notarial` | Derecho civil y servicios notariales en Nacaome | `Derecho Civil y Servicios Notariales en Nacaome` (refinado, sin "notario") | Sí (coordina notario/tribunal/registro) | Sí (6 ítems) | Sí (8 pasos) | 7 (ampliada de 3) | `Consultar un contrato, propiedad, sucesión o trámite notarial` → `?motivo=derecho-civil-y-notarial` | Service + BreadcrumbList + FAQPage | `needs_update` |

---

## 2. Archivos modificados

### Datos
| Archivo | Cambio |
| ------- | ------ |
| `data/areas-juridicas.ts` | Nuevos tipos (`AreaDetailFields`, `FuenteGeneral`, `PasoProceso`, `BloqueSeparacion`); `AreaBase` y `HubPenal` extienden `AreaDetailFields`. Enriquecimiento de `derecho-de-familia`, `derecho-laboral`, `derecho-civil-y-notarial` (respuesta directa, situaciones, separación, documentos, proceso, autoridades, factores, errores, fuentes, CTA) y de `hubPenal`. FAQ ampliadas a 7-8 por área. Afirmaciones P01/P03/P04/P06 preservadas sin reforzar. |

### Componentes nuevos
| Archivo | Función |
| ------- | ------- |
| `components/marketing/service-detail-blocks.tsx` | Bloques presentacionales: RespuestaDirecta, SituacionesHabituales, SeparacionAudiencias, DocumentChecklist, ProcessList, InstitutionsBlock, FactorsThatVary, CommonMistakes, SourcesAndDisclaimer, ContextualCta. |
| `components/marketing/view-service-tracker.tsx` | Client wrapper que dispara `view_service` al montar (sin PII). |

### Páginas
| Archivo | Cambio |
| ------- | ------ |
| `app/(public)/servicios-juridicos/[slug]/page.tsx` | Imports de bloques FASE 3; renderizado condicional de los nuevos bloques (respuesta directa, situaciones, separación, documentos, proceso, autoridades, factores, errores) según campos opcionales del área; `SourcesAndDisclaimer`, `ContextualCta` (reemplaza ConsultationCTA cuando existe), `LegalReviewNotice`, `ViewServiceTracker`. |
| `app/(public)/derecho-penal/page.tsx` | Imports de bloques FASE 3; inserción de SituacionesHabituales, DocumentChecklist, ProcessList, InstitutionsBlock, FactorsThatVary, CommonMistakes entre «Su abogado» y «Grupos especializados»; `SourcesAndDisclaimer`, `ContextualCta`, `LegalReviewNotice`, `ViewServiceTracker` al cierre. `penalStages` existente se conserva. |

### Formulario
| Archivo | Cambio |
| ------- | ------ |
| `components/marketing/solicitar-consulta-form.tsx` | Ampliación de `MOTIVOS` (4 nuevos alineados con servicios); `MOTIVO_FROM_QUERY` (whitelist slug→motivo); `useEffect` que lee `?motivo=` validando contra la whitelist (doble validación: slug + motivo en catálogo). No reenvía el parámetro; no PII. |

### Lógica
| Archivo | Cambio |
| ------- | ------ |
| `lib/legal-review.ts` | `LEGAL_REVIEW_REGISTRY` ampliado con 4 páginas prioritarias en `needs_update` (familia, civil-notarial añadidas; laboral y derecho-penal con notas FASE 3 actualizadas). |

---

## 3. Títulos, descripciones y H1 (instrucción §17)

| URL | Title | H1 visible |
| --- | ----- | ---------- |
| `/derecho-penal` | `Abogado Penalista en Nacaome \| Defensa Penal` (sin cambios; ya cumple intención) | `Abogados Penalistas en Nacaome, Valle — Defensa Penal Técnica` |
| `/servicios-juridicos/derecho-de-familia` | `Derecho de Familia` (genérico, derivado de `area.titulo`) → **H1 refinado** a `Abogado de Familia en Nacaome`; title se mantiene derivado del data file (sin tocar meta para no romper canonicals) | `Abogado de Familia en Nacaome` (refinado en `heroTitle`) |
| `/servicios-juridicos/derecho-laboral` | `Derecho Laboral` (genérico) → **H1 refinado** a `Abogado Laboral en Nacaome` | `Abogado Laboral en Nacaome` (refinado en `heroTitle`) |
| `/servicios-juridicos/derecho-civil-y-notarial` | `Derecho Civil y Notarial` (genérico) → **H1 refinado** a `Derecho Civil y Servicios Notariales en Nacaome` (sin "notario") | `Derecho Civil y Servicios Notariales en Nacaome` (refinado en `heroTitle`) |

**Nota SEO:** los `title` (metadata) de las tres áreas dinámicas se derivan de
`area.titulo` vía `generateMetadata`. En FASE 3 se refinaron los `heroTitle`
(H1 visibles) y los `heroSubtitle`, pero **no se alteraron los slugs ni las
canonicals** (restricción §2, R19). Una mejora futura del `title` metadata de
estas tres áreas requeriría ampliar el data file con un campo `metaTitle`
opcional; se deja fuera del alcance de FASE 3 para no introducir regresiones.

---

## 4. Enlazado interno añadido

Cada página prioritaria ahora enlaza a:
- `/solicitar-consulta` (vía `ContextualCta` con `?motivo=`)
- `/despacho` (CTA secundario + enlace del bloque abogado)
- `/servicios-juridicos` (breadcrumbs, ya existente)
- Servicios relacionados (áreas, ya existente)
- Localidad principal (landings de especialidad, ya existente)
- Cómo llegar no se añade (no es intención presencial prioritaria en estas 4)

**No se enlaza masivamente a todas las localidades** (restricción §16). Los
enlaces internos **no atraviesan redirects** (verificados: todas las rutas
objetivo son reales y no están en la lista de 301 de `next.config.ts`).

---

## 5. Afirmaciones pendientes preservadas (autochequeo §13)

| Afirmación | Tratamiento en FASE 3 |
| ---------- | --------------------- |
| P01 (pensión 30-60%) | **Preservada sin reforzar**: FAQ familia reescrita a criterios generales; rango numérico retirado del cuerpo. |
| P03 (fechas aguinaldo) | **Preservada sin reforzar**: FAQ laboral reescrita sin fechas concretas. |
| P04 (cesantía 25 meses) | **Preservada sin reforzar**: FAQ laboral reescrita sin tope. |
| P06 (prescripción civil) | **Preservada sin reforzar**: FAQ civil reescrita sin plazos. |
| P09/P14/P15 (penal) | **No tocadas**: viven en `/derecho-penal/[slug]`, fuera de alcance. |
| P11/P12 (+15 años, foundingDate) | **No reforzadas** con nuevas ubicaciones. |
| Capacidad notarial | **No afirmada**: se coordina con notario. |

Ninguna página se marca como `verified`. Las 4 quedan `needs_update` hasta firma
humana del despacho.

---

## 6. Restricciones respetadas (autochequeo)

- [x] No se toca el blog (verificado por `git diff` en validación final).
- [x] No se toca SGIE/intranet/admin/auth/DB schema.
- [x] No se tocan páginas geográficas.
- [x] No se toca `/hondurenos-en-espana`.
- [x] No se cambian URLs indexadas (slugs intactos).
- [x] No se instalan dependencias.
- [x] No se prometen resultados ni respuesta inmediata.
- [x] No se publican P01-P15 como verificadas.
- [x] No se refuerza `foundingDate`, «+15 años», colegiación o especialidades pendientes.
- [x] No se inventan leyes, artículos, plazos, porcentajes, autoridades, procedimientos o resultados.
- [x] No se crean testimonios, casos, estadísticas o credenciales ficticias.
