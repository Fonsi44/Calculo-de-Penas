# Inventario previo — Servicios jurídicos prioritarios (FASE 3)

**Fecha:** 2026-07-25
**Rama:** `main` (HEAD inicial `a478f5d6`)
**Modo:** `IMPLEMENTACIÓN`
**Base:** FASE 1 (`docs/seo/fase-1/`) y FASE 2 (`docs/seo/fase-2/`) preservadas en el árbol de trabajo.

---

## Nota sobre arquitectura

La instrucción FASE 3 lista cuatro URLs prioritarias. La arquitectura real del
repo las distribuye en dos rutas:

| URL pedida | Ruta real | Archivo fuente | Tipo |
| ---------- | --------- | -------------- | ---- |
| `/servicios-juridicos/derecho-penal` | **`/derecho-penal`** (hub penal) | `app/(public)/derecho-penal/page.tsx` | Página estática propia |
| `/servicios-juridicos/derecho-de-familia` | `/servicios-juridicos/derecho-de-familia` | `app/(public)/servicios-juridicos/[slug]/page.tsx` + `data/areas-juridicas.ts` | Página dinámica |
| `/servicios-juridicos/derecho-laboral` | `/servicios-juridicos/derecho-laboral` | `app/(public)/servicios-juridicos/[slug]/page.tsx` + `data/areas-juridicas.ts` | Página dinámica |
| `/servicios-juridicos/derecho-civil-y-notarial` | `/servicios-juridicos/derecho-civil-y-notarial` | `app/(public)/servicios-juridicos/[slug]/page.tsx` + `data/areas-juridicas.ts` | Página dinámica |

`/servicios-juridicos/derecho-penal` existe como `ServiceCard` en el índice de
servicios y enlaza al hub `/derecho-penal` (no es una página propia bajo
`/servicios-juridicos/`). No se cambia la URL indexada (R19, restricción §2).

---

## 1. Derecho Penal — `/derecho-penal`

| Campo | Contenido |
| --- | --- |
| URL canónica | `https://www.pinedayasociadoshn.com/derecho-penal` |
| Archivo fuente | `app/(public)/derecho-penal/page.tsx` (519 líneas) + `data/areas-juridicas.ts` (`hubPenal`) |
| H1 actual | `Abogados Penalistas en Nacaome, Valle — Defensa Penal Técnica` (vía `PageHero` desde `hubPenal.heroTitle`) |
| Title actual | `Abogado Penalista en Nacaome \| Defensa Penal` (45 chars, vía `buildMetadata`) |
| Description actual | `Abogado penalista en Nacaome, Valle. Defensa urgente en detenciones, audiencias, medidas cautelares y recursos. Consulta confidencial. WhatsApp {whatsappDisplay}.` (154 chars) |
| Intención principal | `Abogado penalista en Nacaome y el sur de Honduras` |
| Intenciones secundarias | defensa penal Valle · asistencia a detenidos · audiencia inicial · juicio oral · recursos/casación · medidas cautelares · urgencia penal |
| Contenido duplicado | `hubPenal.heroSubtitle` y `AnswerBlock` comparten frase base; subservicios detallados también en `/derecho-penal/[slug]` |
| Afirmaciones jurídicas sensibles | `penalStages` usa plazos prudentes («Horas iniciales», «24-48 horas según el caso», «Plazos perentorios») — **sin** cifras P09/P14/P15. `urgentFaq` describe actuación, no penas. P09/P14/P15 viven en `/derecho-penal/[slug]` (FUERA de alcance FASE 3). |
| Profesional relacionado | Danilo Pineda Maradiaga (`FOUNDER_PROFILE`) — bloque «Su abogado penalista» ya presente. |
| CTA actual | `CTAGroup` (WhatsApp + llamada) en hero + `ConsultationCTA` al cierre + `UrgencyCallout`. No hay CTA contextual con `?motivo=`. |
| FAQ actuales | 4 FAQ en `hubPenal.faqs` (visibles vía `HubFaq` y en JSON-LD) + 5 «Urgencias penales» solo visibles (no JSON-LD). |
| Schema actual | `Service` + `BreadcrumbList` (vía `<Breadcrumbs>`) + `FAQPage` (vía `<HubFaq>`, `@id #faqpage`). |
| Enlaces entrantes y salientes | **Entrantes:** home, `/despacho`, `/servicios-juridicos`, landings penales (`/abogado-penalista-nacaome`, `/abogado-penalista-choluteca`). **Salientes:** blog penal, `/preguntas-frecuentes`, `/servicios-juridicos`, `/despacho`, `/guia-legal-abogados-honduras`, ciudades. |
| Riesgos | P11/P12 (+15 años, `foundingDate`) ya presentes y preservados (no se refuerzan). P09/P14/P15 fuera de alcance. |

---

## 2. Derecho de Familia — `/servicios-juridicos/derecho-de-familia`

| Campo | Contenido |
| --- | --- |
| URL canónica | `https://www.pinedayasociadoshn.com/servicios-juridicos/derecho-de-familia` |
| Archivo fuente | `app/(public)/servicios-juridicos/[slug]/page.tsx` + `data/areas-juridicas.ts:88` (`areasGenerales[0]`) |
| H1 actual | `Derecho de Familia en Honduras` (`heroTitle`, vía hero de `[slug]`) |
| Title actual | `Derecho de Familia` (`area.titulo`, literal — genérico, sin intención geográfica) |
| Description actual | derivada de `area.descripcion` vía `buildServiceMetaDescription` (recorta 120-155 chars) |
| Intención principal | `Abogado de familia en Nacaome: divorcio, custodia y alimentos` |
| Intenciones secundarias | divorcio mutuo acuerdo/contencioso · custodia · régimen visitas · pensión alimentos · sucesiones · violencia intrafamiliar · mediación |
| Contenido duplicado | `heroSubtitle` y `descripcion` repiten «divorcios, custodia, pensión de alimentos». Subservicios detallados. |
| Afirmaciones jurídicas sensibles | **P01 (30%-60% pensión, línea 120)** presente en FAQ — afirmación pendiente, NO se publica como verificada, NO se refuerza. Se preserva. |
| Profesional relacionado | Thania Marlene Paz (`THANIA_PROFILE`) — bloque «Su abogado/a» vía `AREA_LAWYER['derecho-de-familia']`. |
| CTA actual | `CTAGroup` en hero + `ConsultationCTA` cierre + WhatsApp directo al abogado. No CTA contextual. |
| FAQ actuales | 4 FAQ en `area.faqs` (visibles y en JSON-LD vía `areaSchemas`). Incluye P01. |
| Schema actual | `Service` + `FAQPage` (vía `areaSchemas`, `@id {url}#faqpage`) + `BreadcrumbList` (vía `<Breadcrumbs>`). |
| Enlaces entrantes y salientes | **Entrantes:** home (selector por problema), `/despacho`, `/servicios-juridicos`, `/abogado-de-familia-nacaome`. **Salientes:** áreas relacionadas (civil/notarial, conciliación, laboral), `/abogado-de-familia-nacaome`, `/despacho`, ciudades. |
| Riesgos | P01 (rango pensión) en FAQ visible — **preservar sin reforzar**. P02 (15-50%) vive en `/abogado-de-familia-nacaome` (fuera de alcance). |

---

## 3. Derecho Laboral — `/servicios-juridicos/derecho-laboral`

| Campo | Contenido |
| --- | --- |
| URL canónica | `https://www.pinedayasociadoshn.com/servicios-juridicos/derecho-laboral` |
| Archivo fuente | `app/(public)/servicios-juridicos/[slug]/page.tsx` + `data/areas-juridicas.ts:136` (`areasGenerales[1]`) |
| H1 actual | `Derecho Laboral en Honduras` (`heroTitle`) |
| Title actual | `Derecho Laboral` (`area.titulo`, literal — genérico) |
| Description actual | derivada de `area.descripcion` vía `buildServiceMetaDescription` |
| Intención principal | `Abogado laboral en Nacaome: despidos, prestaciones y reclamaciones` |
| Intenciones secundarias | despido injustificado · prestaciones · aguinaldo · décimo tercer mes · riesgos profesionales · acoso laboral · casación laboral · asesoría empleadores |
| Contenido duplicado | `heroSubtitle` y `descripcion` repiten «prestaciones, despidos, aguinaldo». Subservicios detallados. |
| Afirmaciones jurídicas sensibles | **P03 (fechas aguinaldo, línea 168)** y **P04 (cesantía 25 meses, línea 167)** presentes en FAQ — pendientes, **preservar sin reforzar**. F04 (recargos horas extras) ya corregido en FASE 1 en `/preguntas-frecuentes`. |
| Profesional relacionado | Emil Barahona (`EMIL_PROFILE`) — bloque «Su abogado/a» vía `AREA_LAWYER['derecho-laboral']`. |
| CTA actual | `CTAGroup` en hero + `ConsultationCTA` + WhatsApp directo. No CTA contextual. |
| FAQ actuales | 3 FAQ en `area.faqs` (visibles y en JSON-LD). Incluyen P03/P04. |
| Schema actual | `Service` + `FAQPage` (vía `areaSchemas`) + `BreadcrumbList`. |
| Enlaces entrantes y salientes | **Entrantes:** home, `/despacho`, `/servicios-juridicos`, `/abogado-laboralista-nacaome`. **Salientes:** áreas relacionadas (conciliación, mercantil, civil/notarial), `/abogado-laboralista-nacaome`, `/despacho`, ciudades. |
| Riesgos | P03/P04 en FAQ visible — **preservar sin reforzar**. No calculadoras ni fórmulas. Diferenciar décimo tercer mes (aguinaldo) sin añadir fechas/sustantivas nuevas. |

---

## 4. Derecho Civil y Notarial — `/servicios-juridicos/derecho-civil-y-notarial`

| Campo | Contenido |
| --- | --- |
| URL canónica | `https://www.pinedayasociadoshn.com/servicios-juridicos/derecho-civil-y-notarial` |
| Archivo fuente | `app/(public)/servicios-juridicos/[slug]/page.tsx` + `data/areas-juridicas.ts:181` (`areasGenerales[2]`) |
| H1 actual | `Derecho Civil y Notarial` (`heroTitle`) |
| Title actual | `Derecho Civil y Notarial` (`area.titulo`, literal — genérico) |
| Description actual | derivada de `area.descripcion` vía `buildServiceMetaDescription` |
| Intención principal | `Abogado civil y servicios notariales en Nacaome` |
| Intenciones secundarias | contratos · compraventas · arrendamientos · hipotecas · sucesiones · protocolización · cobros judiciales · daños y perjuicios · poderes notariales |
| Contenido duplicado | `heroSubtitle` y `descripcion` repiten «compraventas, arrendamientos, hipotecas, sucesiones». Subservicios detallados. |
| Afirmaciones jurídicas sensibles | **P06 (prescripción civil 5/10/20 años, línea 214)** presente en FAQ — pendiente, **preservar sin reforzar**. **P08 (herederos forzosos)** vive en `/preguntas-frecuentes` (fuera de alcance). No se afirma capacidad notarial del despacho (no confirmada). |
| Profesional relacionado | Thania Marlene Paz (`THANIA_PROFILE`) — bloque «Su abogado/a» vía `AREA_LAWYER['derecho-civil-y-notarial']`. |
| CTA actual | `CTAGroup` en hero + `ConsultationCTA` + WhatsApp directo. No CTA contextual. |
| FAQ actuales | 3 FAQ en `area.faqs` (visibles y en JSON-LD). Incluye P06. |
| Schema actual | `Service` + `FAQPage` (vía `areaSchemas`) + `BreadcrumbList`. |
| Enlaces entrantes y salientes | **Entrantes:** home, `/despacho`, `/servicios-juridicos`, `/abogado-civil-nacaome`. **Salientes:** áreas relacionadas (familia, mercantil, conciliación), `/abogado-civil-nacaome`, `/despacho`, ciudades. |
| Riesgos | P06 en FAQ visible — **preservar sin reforzar**. No atribuir a una institución un trámite que requiere varias. No afirmar que todo es notarial. Title no debe decir «notario» (capacidad notarial no confirmada). |

---

## Notas sobre Search Console

La instrucción §3 indica: «No presentes hipótesis de Search Console como datos
confirmados». Este inventario se construye por **inspección directa del código**
y de la documentación FASE 1/FASE 2, sin consultar GSC. Cualquier hipótesis de
tráfico o impresiones se registra como tal (no como dato confirmado) en
`fuentes-servicios-prioritarios.md`.
