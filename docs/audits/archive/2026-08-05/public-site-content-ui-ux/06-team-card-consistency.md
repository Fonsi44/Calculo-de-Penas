# 06 — Consistencia de tarjetas y perfiles de equipo

## Diagnóstico

El equipo aparece mediante **seis representaciones**:

1. Portada: tres enlaces compactos, sin fotografía, con cargo y tres áreas.
2. `/despacho`: tres `Card` completas con monograma, credenciales condicionales, biografía y enlaces.
3. `/equipo/[slug]`: encabezado de perfil con fotografía, credenciales y descripción.
4. `/derecho-penal`: bloque específico de Danilo con fotografía, WhatsApp y perfil.
5. `/servicios-juridicos/[slug]`: bloque de abogado responsable definido en `AREA_LAWYER`.
6. `/solicitar-consulta`: resumen «Tres socios, atención directa» dentro del rail.

La repetición es legítima —el usuario necesita saber quién atenderá el caso—, pero la representación no debe reinventarse en cada ruta.

## Sistema canónico propuesto

| Variante | Uso | Contenido máximo | Ruta propietaria |
|---|---|---|---|
| `TeamCard compact` | Portada y menciones contextuales | nombre, cargo, 1 línea de áreas, enlace | `/despacho` |
| `TeamCard full` | Equipo completo | foto/monograma, nombre, cargo, 2–3 áreas, bio de 45–70 palabras, credenciales verificadas | `/despacho` |
| `ProfileHeader` | Perfil individual | foto real, H1, cargo, descripción, credenciales verificadas | `/equipo/[slug]` |
| `TeamReference` | Penal, servicios y locales | nombre, función en ese servicio, enlace al perfil; CTA solo si contextual | perfil individual |

## Migración propuesta

- La portada debe sustituir sus enlaces inline por `TeamCard compact`, o mostrar una sola franja «Conozca a los tres socios» si la página sigue siendo larga.
- `/despacho` debe ser el único lugar con las tres tarjetas completas.
- Penal y servicios no deben duplicar biografías generales: deben explicar **por qué ese profesional es relevante para esa materia** y enlazar al perfil.
- Consulta debe convertir el resumen del equipo en una línea de confianza, no en una mini tarjeta con icono y enlace.
- Las credenciales vacías nunca deben generar huecos ni placeholders.

## Riesgo blog

Los perfiles consultan atribuciones de artículos desde la DB. Cualquier refactor del encabezado o de las tarjetas debe preservar esa sección y no modificar `components/blog/**`, la autoría o el modelo de revisión editorial.

## Etiquetas

- Visual/estructura: `WAIT_UNTIL_2026-09-01`.
- Credenciales y afirmaciones profesionales: `REQUIRES_LEGAL_REVIEW`.
- Datos de perfiles: fuente única `lib/site.ts`.
