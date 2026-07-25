# Clasificación de servicios secundarios — FASE 3 §21

**Fecha:** 2026-07-25
**Rama:** `main`
**Modo:** `IMPLEMENTACIÓN`

Esta clasificación **no reescribe** las páginas secundarias en FASE 3. Solo las
evalúa según la evidencia disponible en el repo y propone acciones futuras.
**No se eliminan, noindex ni redirigen páginas en esta fase.**

---

## Escala de clasificación (instrucción §21)

| Clase | Significado |
| ----- | ----------- |
| **A** | Servicio principal demostrado (evidencia robusta en el repo) |
| **B** | Servicio complementario |
| **C** | Servicio que requiere mayor evidencia |
| **D** | Servicio coordinado o limitado |
| **E** | Página candidata a consolidación |

---

## Matriz de clasificación

| URL | Slug | Clasificación | Evidencia disponible | Riesgo | Acción futura |
| --- | ---- | ------------- | -------------------- | ------ | ------------- |
| `/servicios-juridicos/derecho-mercantil-empresarial` | `derecho-mercantil-empresarial` | **A** | Subservicios detallados (constitución de sociedades, contratos mercantiles, fusiones, marcas); abogada asignada (Thania); categorías de blog relacionadas. | Bajo | Mantener como servicio principal. Posible FASE 4: enriquecer con documentos y proceso (como en FASE 3). |
| `/servicios-juridicos/derecho-bancario-y-financiero` | `derecho-bancario-y-financiero` | **B** | Subservicios definidos; sin abogado asignado explícitamente en `AREA_LAWYER`. | Medio | Confirmar abogado responsable; enriquecer evidencia antes de promover. |
| `/servicios-juridicos/tributario-fiscal` | `tributario-fiscal` | **B** | Subservicios sólidos (ISR, ISV, SAR, precios de transferencia); sin abogado asignado. P05/SAR son verosímiles pero sin cita verificada en la página. | Medio | Confirmar especialista tributario; validar referencias al SAR. |
| `/servicios-juridicos/derecho-administrativo-y-servicio-civil` | `derecho-administrativo-y-servicio-civil` | **B** | Subservicios definidos; abogada asignada (Thania). Recursos administrativos y contencioso-administrativo. | Bajo | Mantener como complementario. Posible enriquecimiento FASE 4. |
| `/servicios-juridicos/derecho-aduanero-y-comercio-exterior` | `derecho-aduanero-y-comercio-exterior` | **B** | Subservicios definidos; sin abogado asignado. Solapamiento natural con mercantil y tributario. | Medio | Confirmar evidencia operativa; considerar consolidación con tributario si hay solape. |
| `/servicios-juridicos/regulacion-sanitaria` | `regulacion-sanitaria` | **C** | Subservicios definidos pero menos evidencia de casos reales; sin abogado asignado; ARSA referenciada. | Medio-Alto | Requiere mayor evidencia antes de promover. Posible consolidación con administrativo. |
| `/servicios-juridicos/ambiental-regulatorio` | `ambiental-regulatorio` | **C** | Subservicios definidos (MiAmbiente, licencia ambiental); sin abogado asignado. | Medio-Alto | Requiere mayor evidencia; niche técnico. |
| `/servicios-juridicos/propiedad-intelectual` | `propiedad-intelectual` | **C** | Subservicios definidos (marcas, patentes); sin abogado asignado; referencias al Instituto de la Propiedad. | Medio-Alto | Requiere evidencia de casos; considerar si volumen lo justifica como página propia. |
| `/servicios-juridicos/conciliacion-y-arbitraje` | `conciliacion-y-arbitraje` | **B** | Subservicios definidos; transversal a varias áreas; referencia a centros de arbitraje. | Medio | Mantener como complementario transversal; enlazar desde áreas principales. |
| `/servicios-juridicos/extranjeria-en-honduras` | `extranjeria-en-honduras` | **B** | Subservicios definidos; **P05 (naturalización 7 años)** pendiente de validar; abogado no asignado explícitamente. | Medio | Validar P05 antes de cualquier promoción; posiblemente consolidar con `hondurenos-en-espana` si hay solape. |
| `/derecho-penal/*` (7 subpáginas) | grupos penales | **A** (dependientes del hub A) | Subpáginas del hub penal principal; abogado asignado (Danilo). **P09/P14/P15** viven aquí. | Medio | FASE futura: revisión jurídica de P09/P14/P15 (pendiente FASE 3, fuera de alcance). |
| `/hondurenos-en-espana` + 3 subpáginas | hub migratorio ES | **D** | Coordinación documental HN; muchos trámites requieren profesional en España (matriz A-F FASE 1). | Medio | Mantener delimitación jurisdiccional (FASE 1). **No tocar en FASE 3** (restricción). |
| `/abogado-civil-nacaome`, `/abogado-de-familia-nacaome`, `/abogado-laboralista-nacaome`, `/abogado-penalista-nacaome`, `/abogado-penalista-choluteca` | landings especialidad | **A** (landings locales) | Landings geográficas con abogado asignado. Algunas con afirmaciones P (P02 familia). | Medio | Mantener; **no tocar en FASE 3** (páginas geográficas, restricción). |

---

## Resumen por clase

| Clase | Cantidad | Acción FASE 3 |
| ----- | -------- | ------------- |
| **A** (principal) | 4 (mercantil, penal hub, landings principales) | Mantener |
| **B** (complementario) | 7 (bancario, tributario, administrativo, aduanero, conciliación, extranjería, y subpáginas penales) | Mantener; posiblemente enriquecer en FASE 4 |
| **C** (mayor evidencia) | 3 (sanitaria, ambiental, propiedad intelectual) | No promover; evaluar consolidación futura |
| **D** (coordinado/limitado) | 1 (hondurenos-en-espana) | Mantener delimitación HN/ES |
| **E** (consolidación) | 0 candidatas firmes | No hay consolidación recomendada en FASE 3 |

---

## Acciones explícitamente NO realizadas en FASE 3

- **No se eliminan** páginas.
- **No se aplica `noindex`** a ninguna página.
- **No se redirige** ninguna URL.
- **No se reescriben** las páginas secundarias.
- **No se tocan** `/hondurenos-en-espana` (restricción §2).
- **No se tocan** las landings geográficas (restricción §2).

La clasificación queda como insumo para una FASE 4 futura (no iniciada).
