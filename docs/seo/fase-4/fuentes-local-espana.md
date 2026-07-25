# FASE 4 — Fuentes locales y Honduras–España

Fecha: 2026-07-25
Modo: IMPLEMENTACIÓN

## Fuentes cartográficas (distancias y tiempos)

| Ruta | Fuente | Valor publicado | Fecha comprobación |
| ---- | ------ | --------------- | ------------------ |
| Nacaome–Choluteca | Rome2Rio / Travelmath | ~55 km, 60–75 min | 2026-07-25 |
| Nacaome–San Lorenzo | Google Maps | ~17 km, 20–30 min | 2026-07-25 |
| Nacaome–Goascorán | Google Maps | ~35 km, 40–55 min | 2026-07-25 |
| Nacaome–San Marcos de Colón | Google Maps | ~80 km, ~90 min | 2026-07-25 |
| Nacaome–El Triunfo | Google Maps | ~65 km, 75–90 min | 2026-07-25 |
| Nacaome–Amapala | Google Maps (terrestre + insular) | ~40 km, varía | 2026-07-25 |

> Las distancias y tiempos son aproximados por carretera y pueden variar según
> el punto de salida, la ruta elegida, el tráfico y las condiciones de la vía.

## Fuentes institucionales (referencias generales)

| Institución | Competencia | Uso |
| ----------- | ----------- | --- |
| Juzgados de Letras de Valle | Sede judicial departamental (civil, penal, familia, laboral) | Referencia en landings de Valle |
| Juzgados de Letras de Choluteca | Sede judicial departamental | Referencia en landings de Choluteca |
| Municipalidad de Nacaome | Gobierno local | Contexto Nacaome |
| Autoridad Marítima Portuaria | Operaciones del puerto de San Lorenzo | Contexto San Lorenzo |
| Frontera de Guasaule / El Espino | Pasos fronterizos con Nicaragua | Contexto Choluteca/SMC |
| Puente La Amistad | Paso fronterizo Honduras–El Salvador | Contexto Goascorán/Alianza |

## Fuentes jurídicas (no inventadas)

- Código Penal de Honduras (Decreto 130-2017 y reformas 119-2019, 46-2020,
  93-2021, 59-2024): referencia general en landings y servicios.
- Constitución de Honduras: derecho a abogado desde el primer momento y
  presentación ante juez en 24 horas (FAQ de urgencias penales).
- Resto de citas legales: cubiertas por la auditoría jurídica de Fase 1
  (`docs/seo/fase-1/revision-juridica-fase1.md`); los ítems P01–P15 siguen
  **pendientes de validación humana** y no se publican como verificados.

## Fuentes de identidad del despacho

- `lib/site.ts`: NAP canónico (dirección, teléfono, email, horario, geo).
- `lib/legal-review.ts`: registro declarativo de revisión jurídica (todas las
  entradas en `needs_update`; ninguna `verified`).

## Fuentes de la sección España

- Documentación pública sobre apostilla (Convenio de La Haya), poderes
  notariales y coordinación consular: uso orientativo, sin afirmar plazos
  exactos no verificados (P13 sigue pendiente).
- No se citan despachos ni profesionales españoles concretos (no existen
  colaboraciones confirmadas).

## Restricciones respetadas

- Ningún dato legal inventado.
- Ninguna oficina, coordenada, teléfono o distancia ficticia.
- Ningún colaborador español inventado.
- Ninguna afirmación `P01–P15` marcada como verificada.
