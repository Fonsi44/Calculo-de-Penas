# Cambios de contenido — FASE 2

**Fecha:** 2026-07-25
**Rama:** `main`
**Modo:** `IMPLEMENTACIÓN`
**Base:** arquitectura definida en `arquitectura-paginas-centrales.md`.

---

## 1. Tabla de cambios por URL (instrucción FASE 2 §16)

| URL | Intención anterior | Intención final | H1 | CTA principal | Cambios principales | Afirmaciones pendientes evitadas |
| --- | ------------------ | --------------- | -- | ------------- | ------------------- | -------------------------------- |
| `/` | Presentar el despacho + áreas | Presentar y **dirigir al problema correcto** | «Defensa penal y asesoría jurídica en Nacaome y Honduras» (existente) | Consulta + WhatsApp + teléfono | **+ Selector por problema** (6 entradas a páginas reales); **+ bloque Honduras–España**; **+ bloque Confianza y límites** | No se añaden cifras; no se afirma «los mejores/líderes/éxito garantizado»; +15 años se mantiene solo en EditorialBlock existente sin nuevas cifras |
| `/despacho` | Identidad y método | Demostrar identidad, método y confianza con datos reales | H1 vía PageHero (existente) | Consulta | **+ bloque Cómo se asignan los asuntos**; **+ bloque Presupuesto y contratación**; **+ bloque Confianza y límites** (límites explícitos) | No se publica nº de colegiación hardcodeado (solo badges condicionales); no se añaden cifras de antigüedad nuevas |
| `/servicios-juridicos` | Catálogo de áreas | Organizar las áreas **por necesidad** + catálogo completo | H1 vía PageHero (existente) | Consulta + WhatsApp | **+ bloques por necesidad** (Personas y familia / Empresas / Sectores regulados / Resolución de conflictos / Honduras–España) antes del catálogo completo | No se eliminan servicios; no se destaca como especialidad lo pendiente de evidencia |
| `/solicitar-consulta` | Conversión | Conversión + contacto (absorbe `/contacto`) | H1 vía PageHero (existente) | Formulario + llamada + WhatsApp | **+ campos formulario** (medio preferido, localidad, urgencia, condicionales); **+ confirmación ampliada** (plazo prudente, urgencia penal, no aceptación implícita, no originales, datos) | No se promete respuesta inmediata; no se solicita PII sensible (documentos, tarjetas, menores) |
| `/como-llegar` | Cómo llegar | Facilitar visita a sede real + matizar zonas atendidas | H1 vía PageHero (existente) | Google Maps + indicaciones + llamada | **+ aclaración sede única vs zonas atendidas**; **+ matiz distancias aproximadas**; **+ evento click_maps** | No se afirma accesibilidad/estacionamiento no confirmados; no se crean datos cartográficos nuevos |
| `/preguntas-frecuentes` | Dudas legales | **Contratación y funcionamiento** (sin duplicar derecho material) | H1 vía PageHero (existente) | Consulta | **+ preguntas en `bufete-honorarios`**: presupuesto, qué pasa después del primer contacto, urgencias, confidencialidad, documentos, extranjero; **matiz de medios de pago** | No se publican P01–P15; no se duplican respuestas jurídicas de servicios; no se afirma pago fraccionado como política general |
| `/contacto` | (301 → `/solicitar-consulta`) | Sin página propia | — | — | Redirección 301 existente respetada; contenido consolidado en `/solicitar-consulta` | — |
| `/faq` | (301 → `/preguntas-frecuentes`) | Sin página propia | — | — | Redirección 301 existente respetada | — |

---

## 2. Cambios en archivos

### Páginas (Server Components)

| Archivo | Cambio |
| ------- | ------ |
| `app/(public)/page.tsx` | Imports (`Globe`, `ProblemSelector`, `TrustLimits`); inserta selector por problema, bloque Honduras–España y bloque Confianza y límites. |
| `app/(public)/despacho/page.tsx` | Import `TrustLimits`; añade bloques «Cómo se asignan los asuntos», «Presupuesto y contratación» y «Confianza y límites». |
| `app/(public)/servicios-juridicos/page.tsx` | Import `ServiceBlocks`; añade sección «Servicios por tipo de necesidad». |
| `app/(public)/solicitar-consulta/page.tsx` | Sin cambios estructurales (el formulario vive en el componente cliente). |
| `app/(public)/como-llegar/page.tsx` | Import `TrackedMapsLink`; reemplaza `<a>` de Google Maps; añade aclaración sede/zonas y matiz de distancias; limpia imports sin uso. |
| `app/(public)/preguntas-frecuentes/page.tsx` | Sin cambios estructurales (la FAQ vive en `data/faq.ts` y DB). |

### Componentes nuevos (design system existente, R5/R16)

| Archivo | Función |
| ------- | ------- |
| `components/marketing/problem-selector.tsx` | Selector por problema (6 entradas a páginas reales). |
| `components/marketing/trust-limits.tsx` | Bloque Confianza (elementos confirmados) + Límites (lo que no se garantiza). |
| `components/marketing/service-blocks.tsx` | Agrupación de áreas por necesidad. |
| `components/marketing/tracked-maps-link.tsx` | Enlace a mapas con evento `click_maps`. |

### Componente modificado

| Archivo | Cambio |
| ------- | ------ |
| `components/marketing/solicitar-consulta-form.tsx` | Campos iniciales + condicionales (FASE 2); confirmación ampliada; eventos `consultation_form_view/start/error`; `Field` con `icon` opcional; nuevo `SelectField`. |

### Datos

| Archivo | Cambio |
| ------- | ------ |
| `data/faqs-hubs.ts` | Import `site`; corrige horario divergente («8-17» → `site.hoursShort`); deriva WhatsApp de `site`; suaviza P10 («colegiados» categórico → «abogados en ejercicio»); añade preguntas de contratación a `FAQ_SOLICITAR_CONSULTA`. |
| `data/faq.ts` | Amplía `bufete-honorarios` con preguntas de presupuesto, después del contacto, urgencias, confidencialidad, documentos, extranjero; matiza medios de pago; retira pregunta de prescripción (duplicaba derecho material/P06). |

### Lógica

| Archivo | Cambio |
| ------- | ------ |
| `lib/validation.ts` | `consultaSchema` ampliado con campos opcionales (medio, localidad, urgencia, condicionales). |
| `lib/analytics.ts` | Nuevos helpers FASE 2: `trackConsultationFormView/Start/Error`, `trackClickMaps`, `trackViewService`, `trackViewTeamSection` (sin PII). |
| `app/api/consulta/route.ts` | Agrega campos opcionales al `resumen` que se persiste y envía por email (sin migrar schema DB). |

### Documentación nueva

| Archivo |
| ------- |
| `docs/seo/fase-2/arquitectura-paginas-centrales.md` |
| `docs/seo/fase-2/cambios-contenido.md` (este archivo) |
| `docs/seo/fase-2/eventos-conversion.md` |
| `docs/seo/fase-2/validacion-final.md` |

### Tests nuevos

| Archivo |
| ------- |
| `tests/fase2-paginas-centrales.test.ts` (30 tests) |

---

## 3. Títulos, descripciones y H1 (instrucción §11)

| URL | title | H1 visible |
| --- | ----- | ---------- |
| `/` | `site.tagline` (absoluto) | «Defensa penal y asesoría jurídica en Nacaome y Honduras» |
| `/despacho` | `Bufete de Abogados en Nacaome \| 15+ Años de Experiencia` | vía PageHero |
| `/servicios-juridicos` | `Servicios Jurídicos en Nacaome \| 14 Áreas` | vía PageHero |
| `/solicitar-consulta` | `Consulte a un Abogado en Nacaome, Valle` | vía PageHero |
| `/como-llegar` | `Cómo Llegar al Bufete en Nacaome, Valle` | vía PageHero |
| `/preguntas-frecuentes` | `Preguntas Frecuentes en Honduras` | vía PageHero |

No se han modificado titles/descriptions de páginas fuera del alcance (R5,
restricción §11). Cada página mantiene un title único y una intención
diferenciada.

---

## 4. Enlazado interno añadido

- **Inicio → áreas reales**: selector por problema enlaza a `/derecho-penal`,
  `/servicios-juridicos/derecho-de-familia`, `/servicios-juridicos/derecho-laboral`,
  `/servicios-juridicos/derecho-civil-y-notarial`, `/hondurenos-en-espana`,
  `/solicitar-consulta`.
- **Inicio → /despacho** (bloque confianza), **→ /hondurenos-en-espana** (bloque España).
- **/servicios-juridicos**: bloques por necesidad enlazan a las 14 áreas + `/hondurenos-en-espana`.
- **/despacho → /derecho-penal**, `/servicios-juridicos/derecho-de-familia`, `/servicios-juridicos/derecho-laboral` (existentes).
- **/como-llegar → /solicitar-consulta#formulario** (existente), botón Google Maps tracked.

---

## 5. Afirmaciones pendientes preservadas

Las afirmaciones P01–P15 de FASE 1 **no se han publicado como verificadas**.
En particular:

- **P10 (colegiación CAH)**: faqs-hubs reformulada a «abogados en ejercicio en
  Honduras»; el nº solo se publica vía badges condicionales (`NEXT_PUBLIC_CAH_*`).
- **P11/P12 (fundación/+15 años)**: no se añaden nuevas ubicaciones de la cifra;
  `foundingDate` no se toca en esta fase.
- **P01/P02 (pensión)**: no se publican rangos en FAQ central.
- **Pago fraccionado**: retirada la afirmación categórica; se pospone a la
  contratación.

---

## 6. Restricciones respetadas (autochequeo)

- [x] No se ha tocado el blog (verificado por test `git diff`).
- [x] No se ha tocado SGIE/intranet/admin/auth/DB schema.
- [x] No se han creado artículos ni páginas geográficas nuevas.
- [x] No se han cambiado URLs indexadas (`/contacto` y `/faq` siguen como 301).
- [x] No se instalan dependencias nuevas.
- [x] No se prometen resultados, respuesta inmediata ni plazos cerrados.
- [x] No se publican afirmaciones P01–P15 como verificadas.
