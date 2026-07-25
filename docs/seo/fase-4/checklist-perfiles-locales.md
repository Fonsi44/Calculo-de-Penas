# FASE 4 — Checklist de perfiles locales (GBP y Bing Places)

Fecha: 2026-07-25
Modo: IMPLEMENTACIÓN (solo documentación)

> No se modifican perfiles externos en esta fase: requiere autenticación y
> autorización específica del despacho. Este checklist orienta la revisión
> humana posterior.

## Google Business Profile (GBP)

URL actual conocida: `https://maps.app.goo.gl/xqbpe5n5ufXkH4ff6` (en `lib/site.ts`).

| Punto | Estado | Acción requerida |
| ----- | ------ | ---------------- |
| Nombre comercial | Pendiente de confirmar | Verificar que coincida con "Pineda y Asociados" |
| Categoría principal | Pendiente | Sugerido: "Bufete de abogados" / "Abogado" |
| Dirección | Pendiente | Debe ser la sede canónica de Nacaome (GGJ7+239) |
| Teléfono | Pendiente | Debe coincidir con `site.phone` (+504 9536-3724) |
| Horario | Pendiente | Lun–Sáb 7:00–20:00 (igual que `site.hours`) |
| URL del sitio | Pendiente | `https://www.pinedayasociadoshn.com` |
| Servicios listados | Pendiente | Alinear con las áreas de `data/areas-juridicas.ts` |
| Fotos | Pendiente | Aportar fotos reales del despacho (sin inventar) |
| Reseñas | Pendiente | No inventar; solicitar reales a clientes |
| Preguntas y respuestas | Pendiente | Responder con datos verificados |
| Coordenadas | Pendiente | `site.geo` (13.5300375, -87.487265625) |
| Duplicados | Pendiente | Auditar y reclamar/eliminar duplicados |
| Coherencia NAP | Pendiente | NAP idéntico en web, GBP y citas |

## Bing Places for Business

| Punto | Estado | Acción requerida |
| ----- | ------ | ---------------- |
| Perfil existente | Pendiente | Verificar existencia; crear si no existe |
| NAP | Pendiente | Idéntico al canónico |
| Categoría | Pendiente | Igual que GBP |
| URL | Pendiente | Dominio canónico |

## Otras citas locales (NAP consistency)

- Directorios locales hondureños y portales jurídicos: auditar y unificar NAP.
- Evitar variantes del nombre ("Pineda & Asociados", "Bufete Pineda") que
  rompen la coherencia.

## Restricciones

- No se inventan reseñas ni cuentas ficticias.
- No se recomiendan perfiles falsos.
- Cualquier cambio en GBP/Bing Places requiere credenciales válidas y
  autorización expresa del despacho.
