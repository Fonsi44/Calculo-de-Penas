# Plan de reescritura de contenido thin/plantilla — Blog

> **Fecha:** 2026-06-19
> **Generado por:** Fase 5 de la auditoría integral (`docs/auditoria-repositorio-integral.md`)
> **Fuente de datos:** `scripts/detectar-posts-plantilla.ts` ejecutado contra producción (Neon).
> **Estado de los datos:** 159 posts publicados. **49 ALTO riesgo, 109 MEDIO, 1 BAJO.**
> **Naturaleza:** pendiente **editorial** (decisión humana), no bug técnico.

---

## 1. Contexto

El detector mide "marcadores" (señales de contenido específico y diferenciado: datos
concretos, plazos, referencias legales, ejemplos) sobre 10 posibles. Un post con 0/10
marcadores es contenido genérico que no aporta valor diferenciado y compite mal en
búsquedas. Adicionalmente mide conteo de palabras y CTAs duplicados.

**La mitigación técnica ya está activa** (`app/sitemap.ts` → `THIN_POST_SLUGS`):
los posts identificados como thin bajan a `priority: 0.3` en el sitemap para que
Google priorice el rastreo de URLs de mayor calidad. **No eliminar `THIN_POST_SLUGS`
hasta que cada post listado se reescriba o consolide.**

---

## 2. Distribución actual (159 posts)

| Severidad | Posts | Acción |
|---|---|---|
| 🔴 ALTO (0/10 marcadores) | 49 | Reescribir o consolidar primero |
| 🟠 MEDIO (1-4 marcadores, secciones plantilla) | 109 | Eliminar secciones plantilla, añadir valor |
| 🟢 BAJO (≥5 marcadores) | 1 | Revisión opcional |

---

## 3. Estrategia por tipo de post

No todos los 49 ALTO se resuelven igual. Clasificación operativa:

### 3.1 — Landings locales y perfiles de abogado (reescribir a money page)
Estos posts compiten con las landings `/abogados-en-*`. Opciones:
- **Consolidar** vía `canonical_url` → landing (ya hecho para algunos en Fase 1/3 SEO).
- **Reescribir** como guía local profunda (no duplicar la landing, complementarla).

Posts: `abogado-civil-choluteca`, `abogado-familia-choluteca`, `abogado-empresas-san-lorenzo`,
`abogados-en-choluteca`, `abogados-en-san-lorenzo`, `abogados-en-nacaome`,
`pineda-asociados-bufete-multidisciplinario-honduras`.

### 3.2 — Guías temáticas thin (reescribir con valor legal concreto)
Añadir: plazos reales, artículos del CP/Código específicos, documentos necesarios,
costes orientativos, proceso paso a paso. Mínimo 800-1200 palabras útiles.

Posts: `sanciones-administrativas-como-defenderse-honduras`, `contratos-franquicia-aspectos-legales-honduras`,
`expropiacion-forzosa-derechos-propietario-honduras`, `importar-mercancias-guia-legal-aduanera-honduras`,
`impuestos-pequenas-empresas-guia-basica-honduras`, `facturacion-electronica-obligaciones-requisitos-sar-honduras`,
`registro-sanitario-alimentos-arsa-paso-a-paso-honduras`, `visas-inversion-inversionista-rentista-pensionado-honduras`,
`usucapion-prescripcion-adquisitiva-honduras`, `adopcion-requisitos-proceso-honduras`,
`delitos-ambientales-como-denunciarlos-honduras`, `costos-honorarios-abogados-como-funcionan-honduras`,
`defensa-penal-menores-edad-honduras`, `etapa-investigacion-proceso-penal-honduras`,
`centro-conciliacion-arbitraje-ccic-guia-honduras`, `sobreseimiento-definitivo-provisional-diferencias-honduras`,
`presentar-denuncia-conadeh-honduras`, `habilitacion-clinicas-hospitales-privados-honduras`,
`tarjetas-credito-intereses-cargos-defensa-honduras`, `union-de-hecho-requisitos-derechos-honduras`,
`abogados-en-amapala-valle`, `derecho-de-peticion-instituciones-honduras`,
`sar-notifica-fiscalizacion-que-hacer-honduras`, `arraigo-social-laboral-hondurenos-espana`,
`contratacion-publica-licitaciones-empresas-honduras`, `responsabilidad-medica-mala-praxis-honduras`,
`contratos-confidencialidad-nda-secreto-comercial-honduras`, `tributar-espana-bienes-honduras-guia-fiscal`,
`competencia-desleal-como-denunciar-honduras`, `allanamiento-ilegal-violacion-domicilio-honduras`,
`lavado-activos-obligaciones-cumplimiento-empresas-honduras`, `titulos-valores-cheques-sin-fondo-honduras`,
`refugio-asilo-quien-puede-solicitarlo-honduras`, `herencias-transfronterizas-bienes-honduras-espana`,
`fianza-medidas-cautelares-proceso-penal-honduras`, `como-obtener-rtn-personas-empresas-honduras`,
`libertad-expresion-redes-sociales-honduras`, `constituir-empresa-guia-paso-a-paso-honduras`,
`prescripcion-deudas-plazos-honduras`.

### 3.3 — Posibles canibalizaciones (verificar contra landings/hubs)
Antes de reescribir, comprobar si ya existe una URL que cubra la intención
(ver `.kilo/rules/seo.md` R2). Si canibaliza, fusionar con redirect 301.

---

## 4. Criterios de calidad para la reescritura

Cada post reescrito debe cumplir (ver README §"Estrategia editorial"):

- [ ] ≥ 800 palabras de contenido sustancial (no relleno).
- [ ] 5/10 marcadores mínimo (datos legales concretos: artículos, plazos, importes, documentos).
- [ ] H1 único, alineado con `<title>` y primer párrafo (`.kilo/rules/seo.md` R3).
- [ ] Jerarquía H2/H3 sin saltos, sin headings plantilla idénticos entre posts.
- [ ] Enlaces internos descriptivos hacia posts/hubs relacionados (R7).
- [ ] Disclaimer legal al final.
- [ ] Sin CTAs duplicados (el detector mide esto).
- [ ] `updated_at` actualizado al publicar la reescritura.
- [ ] `last_reviewed_at` y `next_review_due_at` recalculados (+3 meses).

Tras reescribir un post, **quitar su slug de `THIN_POST_SLUGS`** en `app/sitemap.ts`
para que vuelva a `priority: 0.8`.

---

## 5. Workflow recomendado

1. **Lote piloto (5 posts ALTO)**: elegir 5 de alto valor comercial, reescribir, validar
   con `npx tsx scripts/detectar-posts-plantilla.ts` (deben pasar a BAJO/MEDIO).
2. **Medir impacto** (GSC, 2-4 semanas): impresiones/clicks de los reescritos vs. baseline.
3. **Escalar** según resultados, en lotes de 10-15 posts por sprint.
4. **Decisiones de consolidación**: posts que canibalizen landings → redirect 301
   (añadir a `next.config.ts` `redirects()` + `canonical_url` en DB) en lugar de reescribir.

---

## 6. Estado de la mitigación técnica

| Mecanismo | Estado |
|---|---|
| `THIN_POST_SLUGS` en `app/sitemap.ts` (priority 0.3) | ✅ Activo (~48 slugs) |
| Redirects 301 de canibalización en `next.config.ts` | ✅ Activos (varios clusters) |
| `canonical_url` en posts → landings | ✅ Aplicado a posts `abogados-en-*` |
| Exclusión de posts canonicalizados del sitemap | ✅ Fase 1 Release 80 |
| Detector `scripts/detectar-posts-plantilla.ts` | ✅ Operativo |
| Reescritura editorial de los 49 ALTO | ⏳ **PENDIENTE EDITORIAL** |

---

## 7. Lo que NO hay que hacer

- ❌ Eliminar `THIN_POST_SLUGS` antes de reescribir (quitaría la mitigación).
- ❌ Marcar posts como reescritos sin pasar el detector (falsear el estado).
- ❌ Recalcular `next_review_due_at` sin haber revisado realmente el contenido
  (eso fue lo que generó los 71 "vencidos" — fueron marcados sin revisión real).
- ❌ Reescribir sin verificar canibalización primero (R2).
