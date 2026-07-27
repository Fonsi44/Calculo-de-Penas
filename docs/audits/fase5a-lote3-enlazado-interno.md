# Fase 5A — Lote 3: Plan de enlazado interno

- **Fase:** 5A · **Lote:** 3 · **Fecha:** 2026-07-27

## Diagnóstico inicial

Los 15 artículos del Lote 3 tienen **0 enlaces internos** a otros posts del
blog (verificado en DB y producción). Esto genera contenido semi-huérfano y
pérdida de link juice.

## Criterios de enlazado (sin spam ni keyword stuffing)

1. Solo enlaces **contextualmente coherentes** (misma materia legal, código
   afín, o concepto explicado en otro artículo).
2. Máximo **2 enlaces internos añadidos por artículo** (conservador).
3. Anchor text descriptivo (no "haz clic aquí").
4. Enlaces a artículos de los Lotes 1, 2 y 3 (diversifica el grafo).
5. No enlazar a redirects (verificado previamente).

## Enlaces planificados (15 artículos × 1-2 enlaces)

| Slug origen | Anchor | Slug destino | Motivo |
|-------------|--------|--------------|--------|
| poder-legal-honduras-cuando-se-necesita | contratos mercantiles | contratos-mercantiles-esenciales-empresas-honduras | Materia notarial/mercantil afín |
| poder-legal-honduras-cuando-se-necesita | redactar una demanda | como-preparar-demanda-guia-no-abogados-honduras | Práctica legal afín (representación) |
| como-preparar-demanda-guia-no-abogados-honduras | reclamar una deuda | reclamar-deuda-legalmente-honduras | Proceso de demanda de cobro |
| banco-demanda-deuda-defensa-opciones-honduras | reclamar una deuda legalmente | reclamar-deuda-legalmente-honduras | Materia de cobro de deudas |
| reclamar-deuda-legalmente-honduras | demanda bancaria | banco-demanda-deuda-defensa-opciones-honduras | Defensa ante ejecución bancaria |
| contratos-mercantiles-esenciales-empresas-honduras | contratos de trabajo | contratos-trabajo-tipos-clausulas-honduras | Contratos laborales (subtipo mercantil) |
| contratos-trabajo-tipos-clausulas-honduras | contratos mercantiles | contratos-mercantiles-esenciales-empresas-honduras | Contratos empresariales |
| importar-china-guia-aduanera | Código Aduanero Centroamericano | codigo-aduanero-centroamericano | Marco legal aduanero |
| importar-mercancias-guia-aduanera | Código Aduanero Centroamericano | codigo-aduanero-centroamericano | Marco legal aduanero |
| codigo-aduanero-centroamericano | importar mercancías | importar-mercancias-guia-aduanera | Guía práctica de importación |
| patentes-requisitos-proceso-solicitud-honduras | contratos mercantiles | contratos-mercantiles-esenciales-empresas-honduras | Propiedad industrial/mercantil |
| adopcion-requisitos-proceso-honduras | unión de hecho | union-de-hecho-requisitos-derechos-honduras | Derecho de familia |
| union-de-hecho-requisitos-derechos-honduras | adopción | adopcion-requisitos-proceso-honduras | Derecho de familia |
| derechos-indigenas-consulta-previa-honduras | recurso de amparo | recurso-de-amparo-honduras-guia-completa | Garantías constitucionales |
| proteccion-datos-personales-derechos-arco-honduras | derecho de petición | (Lote 2: derecho-de-peticion-instituciones-honduras) | Derechos ciudadanos |
| recurso-de-amparo-honduras-guia-completa | derechos indígenas | derechos-indigenas-consulta-previa-honduras | Amparo y consulta previa |

## Verificación previa

- Todos los slugs destino existen en Neon (`published=true`) y responden 200.
- Ningún destino es redirect (verificado en §3).
- Anchor text descriptivo y natural en la frase del body.

## Resultado esperado

- 15 artículos pasarán de 0 a 1-2 enlaces internos contextuales.
- Mejora de link juice y descubribilidad.
- Sin keyword stuffing ni expansión artificial del contenido.
