# FASE 4 — Cambios en Hondureños en España

Fecha: 2026-07-25
Modo: IMPLEMENTACIÓN

## Objetivo

Delimitar jurisdiccionalmente el alcance del servicio: el despacho actúa en
materias sujetas al **derecho hondureño**; determinados procedimientos en
España requieren actuación personal o asistencia de un profesional habilitado
en ese país. Sin inventar colaboraciones ni atribuir competencias españolas.

## Cambios aplicados

1. **`SpainJurisdictionNotice`** (`components/marketing/spain-jurisdiction-notice.tsx`):
   aviso visible y reutilizable, montado en el hub y en las 3 subpáginas.
   Texto adaptado del §10 del pliego.
2. **Bloque de alcance por jurisdicción** (hub): tres columnas (Desde
   Honduras / Coordinable desde España / Requiere actuación en España).
3. **Guía de envío seguro de documentación** (hub, §13): recomendaciones de
   prudencia, sin prometer cifrado o almacenamiento seguro no implementados.
4. **`CtaSpain`** (`components/marketing/cta-spain.tsx`): CTA contextual con
   `?motivo=hondurenos-en-espana#formulario`; dispara `cta_spain`.
5. **`ViewSpainServiceTracker`** (subpáginas): evento `view_spain_service`.
6. **Whitelist**: `MOTIVO_FROM_QUERY` ampliada con `hondurenos-en-espana` →
   `'Asunto desde España'` (motivo aceptado por backend).
7. **Sin sede en España**: el JSON-LD del hub no declara `postalAddress`
   ni dirección española. Schema `Service` con `areaServed` Honduras/España,
   proveedor canónico en Nacaome.

## Detalle por servicio (subáreas)

| URL | Servicio | Clasificación A–F | Actuación HN | Requiere España | Documentos | CTA | Estado |
| --- | -------- | ----------------- | ------------ | --------------- | ---------- | --- | ------ |
| /hondurenos-en-espana | Hub | — | Sí | Orientación | Poderes, apostilla, envío seguro | CtaSpain + ConsultationCTA | needs_update |
| /hondurenos-en-espana/gestion-documental-y-legalizacion | Gestión documental y legalización | B (coordinación documental) | Apostilla, protocolización, registro en HN | Algunos trámites personales | Copias, apostilla, traducción | ContactStrip + ConsultationCTA | needs_update |
| /hondurenos-en-espana/actos-notariales-internacionales | Actos notariales internacionales | A (actuación notarial HN) + C (orientación) | Otorgamiento en HN, coordinación con notaría española para poderes | Apostilla y envío | Poder, acta, apostilla | ContactStrip + ConsultationCTA | needs_update |
| /hondurenos-en-espana/asuntos-civiles-y-familiares-desde-el-extranjero | Asuntos civiles y familiares | A (actuación HN) + C (orientación) | Divorcio, custodia, sucesiones en HN; homologación de sentencias | Comparecencia y poder según caso | Sentencia, poder, apostilla | ContactStrip + ConsultationCTA | needs_update |

### Leyenda de clasificación (§10)

- **A. Actuación jurídica en Honduras**: el despacho asume directamente.
- **B. Coordinación documental**: apostilla, traducción, envío, protocolización.
- **C. Orientación general**: información y guía; no representación directa en ES.
- **D. Requiere profesional habilitado en España**: se orienta, no se asume.
- **E. Trámite personal del interesado**: comparecencia ante autoridad española.
- **F. Servicio no confirmado**: no se ofrece.

## Aviso jurisdiccional obligatorio (texto canónico)

> Pineda y Asociados asesora y representa en los aspectos sujetos al derecho
> hondureño. Determinados procedimientos en España deben realizarse
> personalmente o con asistencia de un profesional habilitado en ese país.
> Antes de contratar, el despacho indicará el alcance concreto del servicio y
> las actuaciones que puede asumir.

## Restricciones respetadas

- No se afirma ejercicio del derecho español.
- No se afirma representación ante tribunales españoles.
- No se inventan colaboraciones con despachos o profesionales españoles.
- No se ofrecen plazos o requisitos dudosos en extranjería/nacionalidad ES.
- No se afirma sede en España.
- P01–P15 siguen sin marcarse como `verified`.
