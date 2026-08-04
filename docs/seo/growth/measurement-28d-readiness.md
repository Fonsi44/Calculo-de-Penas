# Informe de preparación — Medición 28 días SEO Growth (lotes 1–9)

**Veredicto:** `SEO_GROWTH_28D_MEASUREMENT = WAITING_FOR_MEASUREMENT_DATE`

**Fecha de preparación:** 2026-08-04 (UTC-6, zona del sistema)
**Umbral de medición:** 2026-09-01 (faltan 28 días)
**Rama/HEAD:** `main` @ `095845b4` (limpio, en sync con `origin/main`, 0 PRs abiertos)

---

## 1. Decisión temporal (obligatoria)

La fecha actual del sistema es **2026-08-04**, **anterior** al umbral **2026-09-01**.
Conforme a la regla temporal obligatoria:

- **NO** se ejecuta la medición real.
- **NO** se descargan datos para comparación prematura.
- Solo se ejecutaron modos `check`, `dry-run` y diagnósticos sin escritura.
- No se inventan resultados.
- No se modifica contenido, metadata ni datos de producción.

---

## 2. Estado de integridad verificado (por código)

Ejecutado: `npm run seo:growth:reconcile:check` (modo `--check`, sin escritura).

| Invariante | Valor esperado | Verificado |
|---|---|---|
| total_unique | 175 | ✅ 175 |
| published_unique | 135 | ✅ 135 |
| unpublished_unique | 40 | ✅ 40 |
| optimized_unique | 104 | ✅ 104 |
| keep_no_change_unique | 23 | ✅ 23 |
| insufficient_data_unique | 8 | ✅ 8 |
| external_deferred_unique | 0 | ✅ 0 |
| Duplicados entre lotes | 0 | ✅ 0 |
| Solapamientos aprob/diferido | 0 | ✅ 0 |
| Solapamientos pub/no-pub | 0 | ✅ 0 |
| Solapamientos sel/no-pub | 0 | ✅ 0 |
| Sin clasificar | 0 | ✅ 0 |

Desglose aprobados verificado: `APPROVED_TITLE_META_H1=30 + APPROVED_TITLE_META=61 + APPROVED_METADATA_ONLY=13 = 104`.
Desglose diferidos verificado: `KEEP_NO_CHANGE=23 + INSUFFICIENT_DATA=8 = 31`.
Veredicto reconciliación: `SEO_GROWTH_ALL_BATCHES = COMPLETE_RECONCILED` (sin drift).

---

## 3. Manifiestos y ventanas

- 9 manifiestos presentes (`batch-1..9-experiment-manifest.csv`), 135 filas.
- **104 filas optimizadas** con ventana de medición **completa** `2026-08-04 → 2026-09-01` (28 días).
- **31 filas diferidas** con ventana vacía (correcto: no se miden).
- Ventanas por lote: lote 1=13, lote 2=11, lote 3=12, lote 4=9, lote 5=10, lote 6=12, lote 7=15, lote 8=11, lote 9=11 (total 104).
- Patches aprobados presentes por lote (misma distribución 104).
- Baselines históricos **intactos** (no regenerados ni sobrescritos).

---

## 4. Fuentes de datos y credenciales (estado de preparación)

Diagnóstico ejecutado: `npm run seo:doctor` (solo lectura). Resultado: **OK 16 · ERROR 2 · PENDIENTE 5**.

| Fuente | Estado | Observación |
|---|---|---|
| Google ADC | ✅ | Autenticado, credenciales locales, datos LIVE disponibles |
| GSC datos LIVE | ✅ | 621 clics, 26491 impresiones (preparado para consulta 28d) |
| GA4 datos LIVE | ✅ | 883 usuarios (preparado para consulta 28d) |
| Bing datos LIVE | ✅ | 7885 rastreadas, 375 queries |
| IndexNow key | ✅ | Presente (no se enviará en esta fase) |
| GSC Site URL (`GOOGLE_SEARCH_CONSOLE_SITE_URL`) | ⚠️ ERROR doctor | No configurada en `.env`; **no bloqueante**: `google-search-console-live.mjs` autodescubre vía `sites.list` |
| GA4 Property (`GOOGLE_ANALYTICS_PROPERTY_ID`) | ⚠️ ERROR doctor | No configurada en `.env`; **no bloqueante**: `google-analytics-live.mjs` autodescubre vía Admin API |

Los 2 ERROR del doctor son de configuración recomendada, no de acceso roto: ambos scripts
live tienen autodescubrimiento funcional y los datos LIVE se obtienen correctamente.
`.env`/`.env.local` se consideran `UNTRUSTED`: **no se modifican**.

Scripts disponibles para la medición (2026-09-01):
`seo:gsc:live` (`--days`), `seo:ga4:live` (`--days`), `seo:bing:live`, `seo:doctor`, `seo:collect`.

---

## 5. Fallos técnicos bloqueantes

**Ninguno.** No se requiere corrección técnica para habilitar la futura medición.
No se crearon scripts nuevos de medición (se hará en la fase de medición real).

---

## 6. Checklist de preparación

- [x] Inventario reconciliado verificado por código (175/135/40/104/23/8).
- [x] 9 manifiestos presentes con baselines intactos.
- [x] 104 URLs optimizadas con ventana completa 2026-08-04 → 2026-09-01.
- [x] 31 diferidas correctamente excluidas de la medición.
- [x] Credenciales GSC/GA4/Bing funcionales (datos LIVE disponibles).
- [x] Sin fallos técnicos bloqueantes.
- [x] `main` limpio, en sync, sin PRs abiertos.
- [ ] Carpeta `measurement-2026-09-01/` — se creará en la fecha de medición.
- [ ] Script de medición post-28d — se creará en la fecha de medición.

---

## 7. Próximo paso

El **2026-09-01** (o posterior) ejecutar el proceso completo:
extracción GSC/GA4/Bing, cálculo de métricas por URL, clasificación determinista
(`CLEAR_WIN`…`EXPERIMENT_INVALIDATED`), análisis global, revisión de la cola
diferida (71 entradas), artefactos en `docs/seo/growth/measurement-2026-09-01/`,
tests y PR. Veredicto esperado entonces: `SEO_GROWTH_28D_MEASUREMENT = COMPLETE`.
