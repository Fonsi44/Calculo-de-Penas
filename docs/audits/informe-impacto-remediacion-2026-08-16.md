---
status: current
owner: seo
created: 2026-08-16
last_reviewed: 2026-08-16
review_due: 2026-08-30
supersedes: null
---

# INFORME DE IMPACTO DE LA REMEDIACIÓN - 2026-08-16

**Ventana de extracción:** GSC/GA4 `dataState: final`, fin `2026-08-16`.  
**JSON gitignored:** `data/google/impacto-remediacion-2026-08-16.json`.  
**Auth:** GSC ADC; GA4 property `541022095` (service account en `.secrets/`, sin imprimir valores).

## Resumen ejecutivo

- Estado general: **NO APLICABLE (sin deploy)** — no es un informe de 7 ni 14 días post-implementación.
- Hallazgos clave:
  1. Producción `https://www.pinedayasociadoshn.com/` sigue con titles, TOC `<a href="#">`, footer, `robots.txt` y hero de privacidad **pre-parche** (mismos FAIL que `verificacion-post-deploy-2026-08-16.md`).
  2. Rama local `fix/allow-production-editorial-upsert` @ `767b4d2`. No hay PR abierto de `feat/remediacion-seo-2026-08` (`gh pr list` = `[]`).
  3. GSC 7d (2026-08-09→2026-08-16) = misma ventana ya usada como línea base temprana: sitio 206 clics / 9715 imp / CTR 2.12% / pos 6.1. Las 5 URLs A.1: **0 clics**.
  4. Fragmentos `#` de prescripción: 5 filas, **847 imp / 7d** y **2736 imp / 28d**. Promedio diario 7d ≈ 106 vs 28d ≈ 94 — **no hay descenso**; el TOC crawlable sigue en vivo.
  5. GA4 7d: 170 sesiones, `whatsapp_click` 7, `contact_form_submit` 0, `email_click` 0. Comparación UI «Público canónico»: `NOT_VERIFIED`.
- Recomendación: **no ajustar snippets ni hacer rollback** (no hay release). Ejecutar `docs/audits/instrucciones-go-live-2026-08-16.md`. Repetir este informe **7 y 14 días después del merge a producción**.

No se afirma causalidad. 7d vs 28d se normaliza abajo con **promedio diario** (8 días de calendario 9–16 ago; 29 días 19 jul–16 ago).

---

## Análisis GSC (7d actuales vs 28d, ambos pre-parche)

Sitio:

| Ventana | Clics | Imp | CTR | Pos | Clics/día |
|---------|------:|----:|----:|----:|----------:|
| 7d (9–16 ago) | 206 | 9715 | 2.12% | 6.1 | 25.8 |
| 28d (19 jul–16 ago) | 741 | 31933 | 2.32% | 6.0 | 25.6 |

Sitio **estable**. CTR 7d un poco más bajo; posición casi igual.

5 URLs del paquete A.1:

| URL | 7d clics | 7d imp | 7d CTR | 7d pos | 28d clics | 28d imp | 28d CTR | 28d pos | Clics/día 7d | Clics/día 28d | Umbral | Lectura |
|-----|---------:|-------:|-------:|-------:|----------:|--------:|--------:|--------:|-------------:|--------------:|--------|---------|
| Divorcio | 0 | 367 | 0.00% | 7.6 | 14 | 1845 | 0.76% | 7.7 | 0 | 0.48 | CTR > 1.5% | **No medible** (snippet viejo). Posición estable |
| Detención | 0 | 178 | 0.00% | 5.8 | 3 | 772 | 0.39% | 6.4 | 0 | 0.10 | CTR > 1.0% | **No medible**. Pos 7d no peor |
| Despacho | 0 | 27 | 0.00% | 6.5 | 1 | 121 | 0.83% | 5.9 | 0 | 0.03 | CTR > 1.0% | Muestra chica |
| Nacionalidad ES | 0 | 37 | 0.00% | 8.3 | 0 | 137 | 0.00% | 8.2 | 0 | 0 | — | Estable en 0 clics |
| FAQ | 0 | 15 | 0.00% | 6.9 | 0 | 35 | 0.00% | 7.1 | 0 | 0 | — | Title de 70 caracteres sigue en vivo |

Fragmentos `#` (`prescripcion-deudas-plazos-honduras#`):

| Ventana | Filas | Clics | Imp | Imp/día | Umbral (&lt; 50 imp en 28d post-TOC) |
|---------|------:|------:|----:|--------:|--------------------------------------|
| 7d | 5 | 2 | 847 | ~106 | No aplica (TOC no cambió) |
| 28d | 5 | 3 | 2736 | ~94 | Línea base: **muy por encima** de 50 |

Cita API (7d):  
`#marco-legal-…` 179 imp; `#como-se-interrumpe-…` 179 imp; `#plazos-de-prescripcion-…` 173 imp.

---

## Análisis GA4 (7d vs 28d, property `541022095`)

Filtro UI «Público canónico»: **NOT_VERIFIED**. Overview sin dimensión de comparación.

| Métrica | 7d | 28d | /día 7d | /día 28d |
|---------|----:|----:|--------:|---------:|
| Usuarios | 141 | 440 | 17.6 | 15.2 |
| Sesiones | 170 | 561 | 21.3 | 19.3 |
| Pageviews | 228 | 746 | 28.5 | 25.7 |
| Duración media (s) | 244 | 233 | — | — |
| Rebote | 27.6% | 28.5% | — | — |
| Eventos | 902 | 2970 | 113 | 102 |
| Key events | 8 | 20 | 1.0 | 0.7 |
| `(not set)` landing | 9 | 30 | 1.1 | 1.0 |
| `whatsapp_click` | 7 | 14 | 0.88 | 0.48 |
| `contact_form_submit` | 0 | 2 | 0 | 0.07 |
| `email_click` | 0 | 0 | 0 | 0 |
| `lead_generated` | 0 | 2 | 0 | 0.07 |

Landings 7d de URLs A.1: divorcio 2 sesiones; despacho 1. Detención / FAQ / nacionalidad: no en top 50.

Umbrales del prompt (28d): `contact_form_submit` > 3 → **no** (2); `whatsapp_click` > 15 → **no** (14); `email_click` > 0 → **no**. No atribuir a la remediación.

WhatsApp /día 7d > 28d: muestra chica; **no** es éxito del paquete.

---

## Verificación de parches en producción

`GET` 2026-08-16 ~17:39 UTC.

| Ítem | Esperado post-parche | Resultado | Estado |
|------|----------------------|-----------|--------|
| Divorcio title | mutuo acuerdo, causal y plazos | `Divorcio en Honduras: vías, requisitos y plazos` | FAIL |
| Detención title | derechos, 24 h y qué no firmar | `¿Qué hacer si me detienen en Honduras? Guía práctica` | FAIL |
| Despacho title | Abogados colegiados en Nacaome, Valle \| Equipo | `Bufete de Abogados en Nacaome \| Nuestro Equipo` | FAIL |
| FAQ title | Honorarios y primera consulta \| FAQ | `Preguntas frecuentes… \| Pineda y Asociados` | FAIL |
| Nacionalidad title | …hondureños: plazos | `…requisitos y plazos` | FAIL |
| Footer Tegucigalpa | presente | ausente | FAIL |
| TOC prescripción | `<button type="button">` | `<a href="#cuando-prescribe-…">` | FAIL |
| `robots.txt` Bingbot | Crawl-delay: 2 | sin Crawl-delay | FAIL |
| Privacidad | sin «Ley de Protección de Datos de Honduras» | cadena en hero | FAIL |

**0/9** checks de código en vivo. No hay 14d post-deploy: el deploy no ocurrió.

---

## Conclusiones y próximos pasos

Los datos de GSC/GA4 de hoy describen el **sitio sin remediación**. Comparar 7d con 28d solo sirve como línea base; **no** como impacto.

Causas de «no mejora» de CTR en las 5 URLs: el snippet no cambió; Google no tiene title nuevo que indexar. Fragmentos `#`: el HTML del TOC no cambió.

Próximos pasos:

1. Go-live: `docs/audits/instrucciones-go-live-2026-08-16.md` (script `--create-branch`, PR, titular, merge).
2. El día del merge: anotar SHA y hora; esa fecha es T0.
3. T0+7 y T0+14: repetir este prompt (nuevo archivo `informe-impacto-remediacion-AAAA-MM-DD.md`).
4. Entonces sí aplicar umbrales CTR divorcio/detención y hashes &lt; 50 imp en 28d.
5. GA4 UI (fuera de git): comparación «Público canónico»; marcar `email_click`.

No rollback. No IndexNow real. No mezclar con el PR editorial.
