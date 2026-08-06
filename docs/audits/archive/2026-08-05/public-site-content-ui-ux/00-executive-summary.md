# 00 — Resumen ejecutivo

**Modo:** `AUDITORÍA`
**Fecha:** 2026-08-05
**Rama/SHA inspeccionados:** `main` / `711eb69dc582afada4c905800a3400a026a69da4`
**Veredicto:** `PUBLIC_SITE_CONTENT_UI_UX_AUDIT = PARTIAL`
**Completado:** **91 %**

## Veredicto

La web pública conserva una identidad jurídica reconocible y apropiada —azul navy, dorado como acento, Cormorant Garamond y Manrope—, pero todavía funciona como un conjunto de páginas optimizadas de forma sucesiva más que como un sistema editorial y visual único.

El problema principal ya no es una falta de componentes compartidos: existen canónicos útiles (`PageHero`, `Section`, `SectionHeader`, `ServiceCard`, `TrustBar`, `CTAGroup`, `ConsultationCTA`, `HubFaq`, `AnswerBlock`). El problema es que conviven con implementaciones inline y bloques muy especializados que repiten la misma función.

## Cifras auditadas

- **62 rutas públicas no-blog** inventariadas.
- **133 definiciones de sección** inspeccionadas, equivalentes a **518 instancias potenciales** al expandir las plantillas generadas; varias son condicionales.
- **29 variantes/componentes visuales relevantes** catalogados.
- **15 patrones activos de tarjeta**.
- **5 familias de hero**.
- **13 patrones de CTA**.
- **18 grupos de duplicación** y **15 claims prioritarios** documentados.

## Hallazgos críticos

1. **Conflicto comercial visible:** el código define como única formulación autorizada «Evaluación inicial confidencial», pero el template local todavía genera «Consulta confidencial sin costo» y «sin compromiso» en 16 rutas; la evidencia pública rastreada también conserva variantes antiguas. Requiere decisión humana, revisión legal y confirmación de la fuente dinámica.
2. **Demasiados sistemas de conversión:** `CTAGroup` tiene cuatro variantes, `ConsultationCTA` tres, y además existen `ContextualCta`, `CtaSpain`, `ContactStrip`, urgencias y CTAs inline específicos.
3. **Derecho Penal es la página más densa:** combina respuesta directa, perfil, situaciones, documentos, proceso, instituciones, factores, errores, grupos, tabla de etapas, urgencias, FAQ, artículos, cobertura y varios cierres.
4. **Seis representaciones del equipo:** portada, Despacho, perfil, Penal, páginas de servicio y Consulta no comparten una taxonomía visual completa.
5. **Deriva versión/caché:** el SHA actual ya simplifica Servicios y FAQ, mientras que copias públicas rastreadas muestran estructuras anteriores. Antes de implementar debe verificarse qué SHA y qué contenido DB están realmente en producción.

## Por qué el veredicto es PARTIAL

No se pudieron ejecutar nuevas capturas con navegador real en los cinco viewports solicitados ni inspeccionar directamente el contenido runtime de Neon. Se reutilizó como evidencia visual la línea base Playwright existente del repositorio (56 capturas, 14 rutas, 375/768/1280/1440) y se contrastó con el código del SHA actual y páginas públicas rastreadas. Tampoco se dispuso de un checkout local del repositorio para ejecutar `git status` o `git diff --check` sobre el árbol real; las validaciones se aplicaron a los artefactos generados.
