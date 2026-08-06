# 14 — Informe final de auditoría integral

## 1. Veredicto ejecutivo

`PUBLIC_SITE_CONTENT_UI_UX_AUDIT = PARTIAL`

**91 % completado.** Se auditó el código de `main` en `711eb69dc582afada4c905800a3400a026a69da4`, el inventario canónico de rutas, las fuentes de contenido y la evidencia pública disponible. La limitación principal es la ausencia de nuevas capturas reales en los cinco viewports solicitados y de lectura runtime directa de la DB.

## 2. Identidad visual actual

La identidad es sólida: navy, dorado, superficies cálidas, títulos serif y texto sans. Transmite despacho jurídico profesional sin depender de una estética genérica. Debe preservarse. La inconsistencia proviene de variaciones acumuladas en heroes, tarjetas, iconos, secciones, CTA y perfiles.

## 3. Inventario de rutas

**62 rutas no-blog:** 8 principales/auxiliares, 3 perfiles, 13 servicios, 7 subservicios penales, 3 España, 16 locales genéricas, 5 locales especializadas, 1 guía y 6 legales.

## 4. Secciones auditadas

**133 definiciones**, equivalentes a **518 instancias potenciales** al expandir templates. Las páginas con bloques condicionales pueden renderizar menos.

## 5. Componentes visuales distintos

**29 variantes/componentes relevantes** documentados en `05-component-visual-consistency.csv`.

## 6. Patrones de tarjeta

**15 patrones activos:** servicio, problema, local-service, feature premium, information, team compact, team full, profile/contextual lawyer, process table, process mobile, FAQ, contact, location, urgency y blog custom.

## 7. Variantes de hero

**5 familias:** home custom, `PageHero`, service detail custom, local inline y profile split.

## 8. Variantes de CTA

**13 patrones:** cuatro `CTAGroup`, tres `ConsultationCTA`, urgencia, dos ContactStrip, ContextualCta, CtaSpain y CTA custom de abogado.

## 9. Repeticiones exactas

«Presupuesto por escrito», «Abogado responsable», «+15 años», «Evaluación confidencial», «defensa penal como pilar», «sin costo» y «sin compromiso» aparecen en componentes compartidos y copias específicas. La repetición de «sin costo/sin compromiso» es crítica por contradecir la política de marketing del repositorio.

## 10. Repeticiones conceptuales

Metodología, confianza, equipo coordinado, cobertura, confidencialidad, procesos, urgencia, selección de servicio, FAQ preconsulta y CTA final se reformulan en varios sistemas visuales.

## 11. Portada vs Despacho

La portada anticipa razones, equipo y método. Debe conservar solo una prueba resumida y enlazar. Despacho debe ser propietario de historia, misión, equipo completo, metodología, asignación, credenciales y límites.

## 12. Portada vs Servicios

La portada debe orientar por problema y destacar cuatro áreas. Servicios debe concentrar buscador y catálogo completo. No deben coexistir tres inventarios antes de la decisión.

## 13. Despacho vs perfiles

Despacho presenta el equipo; los perfiles prueban identidad individual. Las biografías generales no deben repetirse en Penal/Servicios; allí basta relevancia contextual y enlace.

## 14. Servicios vs áreas

El hub responde «qué área»; la página de área responde «qué hacemos, qué preparar y cuál es el proceso». Los bloques condicionales de áreas deben limitarse a 8–10 secciones.

## 15. FAQ general vs locales

FAQ general: contratación, confidencialidad, presupuesto, canales y cobertura general. FAQ local: sede/modalidad/distancia. FAQ de área: preguntas jurídicas específicas. No copiar respuestas entre niveles.

## 16. Inconsistencias de diseño

Cinco heroes, seis representaciones del equipo, quince patrones de tarjeta, icon boxes 36/44 px, custom blog cards, notices con semántica de error y múltiples cierres.

## 17. Inconsistencias responsive

La tabla penal mantiene versiones desktop y móvil del mismo contenido en DOM; esto aumenta longitud semántica y mantenimiento. Las cuadrículas de tarjetas producen alturas muy largas en móvil. El formulario compite con un rail extenso.

## 18. Problemas de jerarquía

Penal y España acumulan secciones con peso visual similar. La repetición de `SectionHeader` y backgrounds alternos no establece qué recordar. Los CTAs contextuales y finales compiten.

## 19. Problemas de densidad

Mayor riesgo: Penal; después España, servicio detallado, Despacho y Consulta. La línea base histórica ya registraba alturas excesivas; el SHA actual ha simplificado algunas rutas, pero no las más complejas.

## 20. Problemas de conversión

Demasiadas acciones equivalentes, copy de cierre largo, claims contradictorios y formulario sin dominio absoluto del primer viewport.

## 21. Componentes canónicos

`PageHero`, `Section`, `SectionHeader`, `ServiceCard`, `IconBadge`, `AnswerBlock`, `HubFaq`, `CTAGroup`, `ConsultationCTA`, `LegalDocument`, `Breadcrumbs`, `BlogHighlights` y nuevas variantes documentadas de Team/Process/Notice sin crear familias paralelas.

## 22. Componentes a retirar/absorber

Hero custom de servicios/local, RespuestaDirecta, procesos paralelos, instituciones paralelas, custom blog cards, ContextualCta/CtaSpain y dead coverage components, sujeto a verificación.

## 23. Contenido a mover

Historia/equipo/método → Despacho; dirección completa → Cómo llegar; contratación/FAQ corporativa → FAQ; catálogo completo → Servicios; jurisdicción → España hub.

## 24. Contenido a resumir

Razones de portada, método de portada, team references, cobertura, CTAs finales, FAQ de hubs, listas penales y España.

## 25. Contenido a eliminar

TrustBar tras formulario, índices de FAQ con un solo cluster, procesos duplicados, claims no confirmados, CTAs duplicados y tarjetas que solo repiten un enlace ya visible.

## 26. Arquitectura propuesta

Definida en `09-information-architecture.md` con propietario canónico por tema y ocho recorridos.

## 27. Sistema de diseño

Definido en `10-design-system-proposal.md`: cinco superficies, cinco familias de card, cinco CTA semánticos, cinco familias de hero explícitas y tokens existentes.

## 28. Propuesta por página

Definida en `11-page-by-page-proposal.md` con permanencias, fusiones, traslados, eliminaciones, CTA y longitud objetivo.

## 29. Quick wins

- Verificar SHA/DB/caché de producción read-only.
- Resolver política comercial y localizar todos los claims.
- Documentar TeamCard/CTA/FAQ propietarios.
- Preparar tests de contenido duplicado y política comercial.
- Sustituir custom blog cards por uso local del canónico, sin tocar blog.
- Revalidar código muerto.

## 30. Esperar al 2026-09-01

Reordenar, fusionar, eliminar, cambiar copy, CTA, FAQ, hero, cards, enlaces internos o HTML semántico de las URLs experimentales.

## 31. Riesgos blog

Perfiles, BlogHighlights/BlogCard, header/footer y tokens globales. No modificar comportamiento global sin pruebas específicas del blog.

## 32. Orden recomendado

1. Decisiones comerciales/legales y verificación de producción.
2. Congelamiento hasta medición.
3. Sistema canónico de Team/CTA/Hero/Card.
4. Portada/Servicios/Consulta.
5. Penal/España.
6. Servicios dinámicos/locales.
7. Limpieza técnica y regresión.

## 33. Criterios de aceptación futuros

- Sin cambios en title/meta/H1/slug/canonical no autorizados.
- Máximo una fuente canónica por tema.
- Máximo un CTA final y un sistema urgente.
- Máximo 8–10 secciones en páginas de servicio; 6–8 en hubs no penales.
- Un solo contenido semántico para responsive.
- WCAG AA, foco visible, 44 px táctil.
- 0 claims prohibidos.
- 0 cambios internos del blog.
- Capturas 1440×900, 1280×800, 768×1024, 390×844 y 360×800.
- Tests de rutas, H1, overflow, schema, enlaces y visual regression.

## 34. Decisiones humanas pendientes

Política de precio de evaluación; evidencia de claims; cobertura habitual; jerarquía de WhatsApp/teléfono/formulario; profundidad del blog en páginas comerciales; alcance de testimonios futuros; prioridades de fotografías reales.
