# FASE 4 — Riesgo de páginas puerta (doorway pages)

Fecha: 2026-07-25
Modo: IMPLEMENTACIÓN

## Metodología

Análisis automático sobre `data/landings-locales.ts` (16 localidades),
implementado en `tests/fase4-local-espana.test.ts` (sección §9-11). Detecta:
- H1 idénticos.
- descriptions idénticas.
- titles SEO idénticos.
- intros idénticas.
- FAQ repetidas en exceso (>6 ciudades).
- Solo cambia el nombre del municipio.

Sin lanzar servidor; tests unitarios sobre datos. Rápidos y reproducibles en CI.

## Resultado del análisis

### Lo que DIFERENCIA las páginas (bueno)
- **H1 únicos** por ciudad (incluyen nombre + departamento).
- **Titles SEO** des-canibalizados por 3 ramas en `landingMetadata`
  (sede / ≤60 km / >60 km).
- **Descriptions** únicas en las 16.
- **Intro** propia por ciudad (geografía, frontera, puerto, etc.).
- **4 servicios** por página con descripciones que suelen mencionar la ciudad.
- **Distintos `postsRelacionados`** (varias ciudades comparten genéricos).
- **Distancias** variables por ciudad en FAQ y aviso.

### Lo que GENERA riesgo doorway (preocupante)
1. Estructura 100% idéntica en las 14 ciudades sin secciones propias
   (mismo orden Hero→Intro→Servicios→FAQ→Posts→CTA).
2. Frases FAQ plantilla, intercambiables entre ciudades de Choluteca.
3. Servicios con descripciones intercambiables ("Código Penal Decreto 130-2017").
4. Sin contenido transaccional único (casos, tarifas, horarios locales).

## Detalle por página (C, D, E)

| URL | Clasificación | Contenido repetido | Valor único real | Tráfico disponible | Riesgo | Acción futura |
| --- | ------------- | ------------------ | ---------------- | ------------------ | ------ | ------------- |
| /abogados-en-el-triunfo | C | FAQ plantilla, intro genérica | Sur de Choluteca, frontera NI | Pendiente GSC | Medio | Consolidar o enriquecer tras datos GSC |
| /abogados-en-pespire | C | FAQ "primera consulta sin costo" | Agropecuario | Pendiente | Medio-Bajo | Igual |
| /abogados-en-marcovia | C | FAQ plantilla | Camaronero, agrícola | Pendiente | Medio-Bajo | Igual |
| /abogados-en-namasigue | C | FAQ plantilla | Occidente Choluteca | Pendiente | Medio-Bajo | Igual |
| /abogados-en-orocuina | C | FAQ plantilla | Oriente Choluteca | Pendiente | Medio-Bajo | Igual |
| /abogados-en-langue | C | FAQ plantilla | Cercanía Nacaome (22 km) | Pendiente | Bajo | Igual |
| /abogados-en-caridad | C | FAQ urgencias plantilla | Litoral Pacífico | Pendiente | Medio-Bajo | Igual |
| /abogados-en-alianza | C | FAQ urgencias plantilla | Frontera ES | Pendiente | Medio-Bajo | Igual |
| /abogados-en-concepcion-de-maria | C | FAQ urgencias plantilla | Sur Choluteca | Pendiente | Medio-Bajo | Igual |
| /abogados-en-san-antonio-de-flores | C | FAQ urgencias plantilla | Oriente Choluteca | Pendiente | Medio-Bajo | Igual |

## Acciones aplicadas en Fase 4 (sin consolidar)

- **7 prioritarias** recibieron secciones únicas (`LocalAtencionBlock`,
  `LocalInstitutionsBlock`, `LocalDocumentLogistics`) o secciones propias.
- **9 secundarias** recibieron modelo territorial mínimo (`servedFrom`,
  `distanceSource`, `distanceCheckedAt`) para trazabilidad.
- Distancia Choluteca corregida (52 → 55 km) eliminando afirmación dudosa.
- Aviso de distancias aproximadas visible en todas las prioritarias.

## Pendiente (requiere datos y aprobación)

No se consolidan ni redirigen páginas en esta fase. La decisión requiere:
1. Datos reales de Search Console (impresiones, CTR, posicionamiento por URL).
2. Aprobación explícita del despacho.
3. Plan de redirecciones 301 y consolidación de contenido único.

Cronograma sugerido: revisar tras 90 días de observación (ver
`docs/seo/cierre-final-observacion.md`).
