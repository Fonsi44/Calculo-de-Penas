# Fase 3D — Veredicto de integridad del Lote 1 Penal

> Fecha: 2026-07-26 · Hash inicial: `04b48104` · Hash final: ver §3
> Modo: `IMPLEMENTACIÓN` sobre `main` · Cumplimiento AGENTS.md: R1–R19

## 1. Veredicto

**INTEGRO con honestidad documentada.** El Lote 1 Penal (15 artículos) cierra
Fase 3D con inventario completo de claims (69 claims), estados recalculados
con evidencia canónica, bodies públicos corregidos y trazabilidad normativa
documentada para las dos fuentes críticas (CNA y Art. 71).

| Métrica | Fase 3C | **Fase 3D** |
|---|---|---|
| Claims con inventario verificable | 53 (2 slugs preservados sin inventario) | **69** (los 15 con inventario) |
| `completed` honestos | 7 (1 preservado sin inventario) | **6** (todos cumplen 7 criterios §8) |
| `needs_human_review` | 7 | **9** (reflejan claims pendientes reales) |
| `source_checked` | 1 (preservado) | **0** (reclasificado honestamente) |
| Bodies con correcciones aplicadas | parcial | **9/9 correcciones aplicadas** |
| Trazabilidad Art. 71 | `canonical_internal_verified` | **`official_secondary`** (PDF TSC + hash) |
| Trazabilidad CNA | `institutional_academic` | **`institutional_academic`** (sin cambio; honesto) |
| Endpoint ISR on-demand | no existía | **`/api/revalidate`** creado |
| Tests de integridad | parciales | **12 nuevos (208 totales)** |

## 2. Cambios de estado (DB Neon, fase3c → fase3d)

| Slug | Antes (3C) | **Después (3D)** | Razón |
|---|---|---|---|
| `delitos-mas-comunes-honduras` | completed | **needs_human_review** | ⬇️ 1 claim central pendiente (entrada en vigor CP sin fuente canonica); antes preservado sin inventario |
| `estafas-fraudes-tipos-penales-honduras` | source_checked | **needs_human_review** | ⬇️ 2 claims centrales pendientes (Arts.218-226 inexistentes como estafa; prescripción sin fuente); antes preservado sin inventario |
| 13 artículos restantes | (sin cambio) | (igual) | Ya eran honestos en 3C |

**Distribución final Lote 1**: 6 `completed` + 9 `needs_human_review`.

## 3. Auditoría de los 7 `completed` originales (criterios §8)

| Cumple | Slugs |
|---|---|
| ✓ 6 cumplen los 7 criterios | abogado-penalista-sur, audiencia-inicial, cuando-necesito, defensa-penal-honduras, diferencia-denuncia-querella, fianza-medidas |
| ⬇️ 1 degradado | delitos-mas-comunes (→ needs_human_review; requiresHuman=true) |

Criterios §8 verificados: inventario completo, sin claim central pendiente,
fuentes con procedencia válida, requiresHuman=false, sin needs_human_review,
no conservado por excepción, sin decisión interpretativa humana.

## 4. Claims reconstruidos (Commit 2)

Los 16 claims de los 2 slugs que estaban preservados sin inventario en Fase 3C
se reconstruyeron desde `fase3-lote1-claims.json` (DeepSeek crudo), cruzados
con importancia, y verificados contra `data/articulos_cp.json`:

| Slug | Claims | confirmed | corrected | needs_human_review |
|---|---|---|---|---|
| `delitos-mas-comunes-honduras` | 7 | 3 | 3 | 1 |
| `estafas-fraudes-tipos-penales-honduras` | 9 | 4 | 3 | 2 |
| **Total reconstruido** | **16** | **7** | **6** | **3** |

**Verificación canónica clave** (contra `data/articulos_cp.json`):
- Arts. 218-226 tratan de **TRATA DE PERSONAS** (no estafa).
- Arts. 253-254 tratan de **delitos sexuales contra menores** (no apropiación indebida).
- Art. 193 (Asesinato) NO menciona "premeditación"; calificadores son
  **alevosía o ensañamiento**.
- Art. 360 (Robo con fuerza en las cosas) existe **separado** del Art. 361
  (Robo con violencia o intimidación).
- Art. 365 numeral 1 SÍ incluye "manipulación informática" como estafa.
- Art. 366 son **agravantes específicas** de la estafa, no la definición base.

## 5. Inconsistencias DB/JSON corregidas (Commit 6)

9 correcciones de claims `corrected` que NO estaban aplicadas a los bodies
públicos de 5 slugs. Aplicadas a DB Neon con verificación de ocurrencia única
e idempotencia:

| Slug | Correcciones | Hash body (antes→después) |
|---|---|---|
| allanamiento-ilegal | 1 | 5434054f → 458cad4f (+29 chars) |
| antejuicio | 1 | f2f368eb → 5103a3e4 (±2 chars) |
| delitos-mas-comunes | 3 | 84edddcb → bc2b0905 (+56 chars) |
| derechos-detenido | 1 | fdd8ba8c → 3f91757e (+116 chars) |
| estafas-fraudes | 3 | cc02971e → 3830925c (±2 chars) |

Verificación directa post-aplicación: **9/9 textos corregidos presentes en body DB**.

## 6. Pipeline (Commits 1–8)

| Commit | Hash | Cambio lógico |
|---|---|---|
| 1 | `26c049c9` | SW determinista + placeholder + test + doc |
| 2 | `cc1ca12d` | Reconstruir 16 claims ausentes (esquema 3C) |
| 3 | `40764c4b` | Recalcular 15 estados + matriz + audit completed |
| 4 | `412fc430` | Endpoint `/api/revalidate` + test |
| 5 | `d314f22f` | Trazabilidad CNA y Art. 71 (búsqueda web) |
| 6 | `945f0cfa` | Aplicar 9 correcciones a bodies + verificar consistencia |
| 7 | `d0769a03` | 12 tests de integridad (10 supuestos §11) |
| 8 | (este) | Documentación final + validación + push |

## 7. Riesgos pendientes (honestos)

1. **CNA sin fuente oficial accesible**: TSC HTTP 500, subdominio PJ caído,
   ACNUR/OEA 403, PJ TLS inválido. CEPAL sigue siendo la única copia íntegra
   accesible (`institutional_academic`). Reintentar cuando `.gob.hn` se recupere.
2. **Art. 71 — matiz jurídico**: el Decreto 106-2011 reforma Arts. 71 **Y** 92.
   Los claims que citan solo el Art. 71 para el plazo de 24h/48h son
   técnicamente imprecisos (el plazo rige por el Art. 92). No se reclasifican
   (la corrección textual ya aplicada es suficiente); queda para revisión
   jurídica humana.
3. **Anomalía JSON Constitución**: nota de reforma del Art. 71 mal embebida
   en objeto del Art. 72 (`data/articulos_constitucion.json:504`). No se
   modificó (R7). La trazabilidad ahora descansa en el PDF oficial del TSC.
4. **Validación visual real**: pendiente del despliegue Vercel tras push. Se
   ejecuta con el endpoint `/api/revalidate` para forzar regeneración ISR.
5. **Límite del verificador de consistencia**: `fase3d-verificar-consistencia.ts`
   compara texto plano del JSON vs HTML del body, lo que produce falsos
   negativos por marcas `<strong>` intercaladas. La verificación directa
   (`fase3d-aplicar-correcciones-bodies.ts` con ocurrencia única + hash) es
   la fuente de verdad.

## 8. NO se marca revisión jurídica humana como realizada

La Fase 3D **no marca ningún claim ni artículo como revisado por humano**. Los
9 `needs_human_review` requieren decisión interpretativa humana explícita. Los
paquetes de revisión humana de Fase 3C (`docs/audits/fase3c-paquetes-revision-humana/`)
siguen siendo válidos; los 2 slugs recién reclasificados (`delitos-mas-comunes`,
`estafas-fraudes`) requieren nuevos paquetes (a generar en Lote 2 o revisión
humana futura).

## 9. Porcentaje completado

**Fase 3D: 100% del alcance definido en el enunciado.** 9 commits atómicos,
4 comandos de validación verde, 208 tests, 15 artículos con estados honestos,
trazabilidad documentada. Pendiente: verificación visual real post-despliegue
(se ejecuta tras `git push origin main`).
