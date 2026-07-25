# FASE 4 — Cambios en páginas locales

Fecha: 2026-07-25
Modo: IMPLEMENTACIÓN

## Resumen de cambios

1. **Modelo territorial** (`data/landings-locales.ts`): tipo `LandingLocal` ampliado con `servedFrom`, `serviceModes`, `approximateTravelTime`, `distanceSource`, `distanceCheckedAt`, `localContext`, `institutions`. Helpers `DISTANCIA_APROX_NOTA` y `SEDE_CANONICA`.
2. **Distancia Choluteca**: unificada a **55 km** (campo y FAQ) coherente con `lib/legal-review.ts`. Antes 52 km en campo vs 55 km en FAQ.
3. **Bloques únicos** (`components/marketing/local-context-blocks.tsx`): `LocalAtencionBlock` (modalidad + distancia + aviso), `LocalInstitutionsBlock`, `LocalDocumentLogistics`. Montados en San Lorenzo, Goascorán, El Triunfo, San Marcos de Colón y Amapala.
4. **Tracker analítico** `ViewLocalPageTracker` → evento `view_local_page` (sin PII).
5. **Schema**: `Service` con `areaServed` por ciudad (NO `LocalBusiness` local), proveedor enlazado al `LegalService` canónico único.

## Detalle por página

| URL | Clasificación | Sede declarada | Contenido único | Distancia | CTA | Schema | Estado |
| --- | ------------- | -------------- | --------------- | --------- | --- | ------ | ------ |
| /abogados-en-nacaome | A | Sede física Nacaome | Alto (sede, plus code, secciones extra) | 0 | inverse + inline | WebPage+Service+FAQ+Breadcrumb | needs_update |
| /abogados-en-choluteca | A | Desde Nacaome (55 km) | Alto (Guasaule, contexto local) | 55 km | inverse + inline | WebPage+Service+FAQ+Breadcrumb | needs_update |
| /abogados-en-san-lorenzo | A | Desde Nacaome (17 km) | Puerto/mercantil + bloques Fase 4 | 17 km | inverse + inline | WebPage+Service+FAQ+Breadcrumb | needs_update |
| /abogados-en-goascoran | B | Desde Nacaome (35 km) | Frontera ES + bloques Fase 4 | 35 km | inverse + inline | WebPage+Service+FAQ+Breadcrumb | needs_update |
| /abogados-en-san-marcos-de-colon | B | Desde Nacaome (80 km) | Frontera NI (El Espino) + bloques | 80 km | inverse + inline | WebPage+Service+FAQ+Breadcrumb | needs_update |
| /abogados-en-el-triunfo | C | Desde Nacaome (65 km) | Sur Choluteca + bloques Fase 4 | 65 km | inverse + inline | WebPage+Service+FAQ+Breadcrumb | needs_update |
| /abogados-en-amapala | B | Desde Nacaome (40 km) | Isla/pesca + bloques Fase 4 | 40 km | inverse + inline | WebPage+Service+FAQ+Breadcrumb | needs_update |
| /abogados-en-pespire | C | Desde Nacaome (70 km) | Modelo territorial mínimo | 70 km | inverse + inline | WebPage+Service+FAQ+Breadcrumb | needs_update |
| /abogados-en-marcovia | C | Desde Nacaome (60 km) | Modelo territorial mínimo | 60 km | inverse + inline | WebPage+Service+FAQ+Breadcrumb | needs_update |
| /abogados-en-namasigue | C | Desde Nacaome (55 km) | Modelo territorial mínimo | 55 km | inverse + inline | WebPage+Service+FAQ+Breadcrumb | needs_update |
| /abogados-en-orocuina | C | Desde Nacaome (70 km) | Modelo territorial mínimo | 70 km | inverse + inline | WebPage+Service+FAQ+Breadcrumb | needs_update |
| /abogados-en-langue | C | Desde Nacaome (22 km) | Modelo territorial mínimo | 22 km | inverse + inline | WebPage+Service+FAQ+Breadcrumb | needs_update |
| /abogados-en-caridad | C | Desde Nacaome (30 km) | Modelo territorial mínimo | 30 km | inverse + inline | WebPage+Service+FAQ+Breadcrumb | needs_update |
| /abogados-en-alianza | C | Desde Nacaome (25 km) | Modelo territorial mínimo | 25 km | inverse + inline | WebPage+Service+FAQ+Breadcrumb | needs_update |
| /abogados-en-concepcion-de-maria | C | Desde Nacaome (65 km) | Modelo territorial mínimo | 65 km | inverse + inline | WebPage+Service+FAQ+Breadcrumb | needs_update |
| /abogados-en-san-antonio-de-flores | C | Desde Nacaome (55 km) | Modelo territorial mínimo | 55 km | inverse + inline | WebPage+Service+FAQ+Breadcrumb | needs_update |

## Distancias: fuentes y comprobación

| Origen | Destino | Ruta | Distancia | Tiempo aprox. | Fuente | Fecha |
| ------ | ------- | ---- | --------- | ------------- | ------ | ----- |
| Nacaome | Choluteca | Carretera Panamericana CA-1 | ~55 km | 60–75 min | Rome2Rio/Travelmath | 2026-07-25 |
| Nacaome | San Lorenzo | Carretera del Litoral/CA-1 | ~17 km | 20–30 min | Google Maps | 2026-07-25 |
| Nacaome | Goascorán | Carretera departamental | ~35 km | 40–55 min | Google Maps | 2026-07-25 |
| Nacaome | San Marcos de Colón | Carretera Panamericana CA-1 | ~80 km | ~90 min | Google Maps | 2026-07-25 |
| Nacaome | El Triunfo | Carretera Panamericana CA-1 | ~65 km | 75–90 min | Google Maps | 2026-07-25 |
| Nacaome | Amapala | Terrestre + acceso insular | ~40 km | varía | Google Maps | 2026-07-25 |

> Las distancias y tiempos son aproximados por carretera y pueden variar según el punto de salida, la ruta elegida, el tráfico y las condiciones de la vía.

## Validaciones

- Titles, descriptions y H1 únicos entre las 16 localidades (test §9-11).
- Sin intros ni FAQ repetidas en exceso (test §9-11).
- `servedFrom` apunta a Nacaome en todas las no-sede (test §7-8).
- Solo Nacaome `sedeFisica: true` (test §1-3).
