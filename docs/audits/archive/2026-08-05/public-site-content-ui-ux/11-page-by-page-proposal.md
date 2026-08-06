# 11 — Propuesta página por página

## Portada `/`

**Orden objetivo:** Hero → orientación por problema → cuatro áreas → prueba de confianza compacta → tres razones → equipo resumido/enlace → tres pasos → guías 3 → CTA final.

- Permanece: propuesta, selector, cuatro áreas, CTA.
- Fusionar: hero panel + TrustBar.
- Trasladar: razones/metodología/equipo extensos a Despacho.
- Eliminar: listados territoriales largos del CTA.
- Longitud objetivo: 4.500–6.500 px desktop; 7.000–9.000 móvil.

## Despacho `/despacho`

**Orden objetivo:** Hero → quiénes somos → historia/misión/visión → equipo completo → metodología → asignación/contratación → confianza/límites → FAQ 4 → CTA.

- Fusionar misión, compromisos y valores en dos bloques editoriales.
- Mantener equipo como fuente canónica.
- Mover preguntas de honorarios a FAQ global, dejando enlace.
- Evitar Stats/Live si no aportan evidencia estable o repiten horario.

## Servicios `/servicios-juridicos`

**Orden objetivo:** Hero → buscador → respuesta breve → catálogo completo → cobertura breve → FAQ de catálogo 4 → guías 3 → CTA.

- El código actual ya eliminó parte del antiguo triple selector; verificar despliegue.
- No añadir tabla de orientación aparte del buscador y catálogo.
- Diferenciar prioridad sin crear otra familia de tarjeta.

## Derecho Penal `/derecho-penal`

**Orden objetivo:** Hero/urgencia → respuesta → abogado breve → grupos → «qué preparar» (situaciones+documentos+errores) → etapas penales → FAQ 5 → cobertura breve → guías 3 → fuentes/CTA.

- Fusionar Situaciones, Documentos, Factores y Errores en un bloque con pestañas/columnas, sin ocultar contenido esencial.
- Elegir entre `ProcessList` y la tabla de etapas; no ambos como procesos equivalentes.
- Mantener urgencia diferenciada; máximo un callout y dos acciones.
- Reducir enlaces finales de cuatro a dos.

## Hondureños en España

**Orden objetivo:** Hero → respuesta/trámites → alcance jurisdiccional unificado → tres subservicios → envío de documentos → FAQ 5 → relacionados → guías 3 → CTA.

- Fusionar aviso jurisdiccional y tres cards de alcance.
- No usar rojo de error para una limitación profesional neutral.
- Evitar repetir las mismas listas en hub y subservicios.

## Consulta

**Orden objetivo:** Hero breve → formulario + bloque compacto de contacto/privacidad → urgencia penal → FAQ 4 → ubicación resumida → footer.

- Formulario debe dominar el primer viewport.
- Rail: contacto+privacidad; urgencia separada.
- Eliminar TrustBar después del formulario.
- Tres tarjetas de visita → una franja con dirección y enlace a Cómo llegar.

## FAQ

**Orden objetivo:** Hero breve → FAQ corporativa agrupada → enlaces a seis áreas → CTA.

- Si solo existe un cluster, eliminar índice de chips.
- Máximo 8–12 preguntas corporativas en total.
- No copiar preguntas sustantivas de áreas.

## Páginas locales

**Orden objetivo:** Hero local/NAP → contexto verificable → 3–4 servicios relevantes → logística/distancia → FAQ local 3–4 → CTA.

- Conservar una fuente de datos (`data/landings-locales.ts`).
- Eliminar claims genéricos largos y corregir «sin costo/sin compromiso».
- No convertir las 16 rutas en clones: la diferencia debe venir de contexto, instituciones, modalidad y logística reales, no de cambiar colores o tarjetas.

## Páginas de servicio

**Orden objetivo:** Hero → respuesta → situaciones/qué incluye → documentos/proceso → abogado breve → FAQ → relacionados/guías → CTA.

- Máximo 8–10 secciones renderizadas.
- Los bloques condicionales deben agruparse por función, no aparecer cada uno como una nueva franja de color.
- Lead magnet solo cuando tenga valor propio y medición; no junto a dos CTAs.

## Perfiles

**Orden objetivo:** ProfileHeader → áreas → experiencia/credenciales → atribuciones verificadas → referencia al equipo → disclaimer → CTA.

- No repetir historia completa del despacho.
- Preservar datos dinámicos de autoría sin auditar el blog.

## Legales

Mantener `LegalDocument`, header y footer. Solo corregir diferencias de espaciado o foco si no alteran el texto jurídico y tras revisión legal.
