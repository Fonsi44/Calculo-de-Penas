# Fase 3 — Cierre correctivo del Lote 1 Penal

**Fecha:** 2026-07-26
**Modo:** `IMPLEMENTACIÓN` sobre `main` (commits locales atómicos, sin push)
**Alcance:** 15 slugs del lote 1 penal. Los otros 119 artículos quedan fuera de alcance.

---

## 1. Veredicto del lote 1

**El lote 1 NO estaba cerrado correctamente antes de esta intervención.**
La afirmación de que los 15 artículos estaban "completados" era **falsa**: 79 de
99 claims seguían sin resolver y solo 5 fuentes oficiales habían sido abiertas.

Tras el cierre correctivo, el lote 1 queda **reclasificado con honestidad**:
1 artículo realmente verificado, 1 parcialmente verificado, 4 que requieren
revisión humana y 9 bloqueados por falta de fuentes. La contradicción central
(15 × `completed` con 79 claims no resueltos) queda **resuelta**.

El lote 1 está **cerrado como intervención técnica**, pero **no está verificado
jurídicamente en su totalidad**. No debe presentarse al público como contenido
plenamente contrastado salvo en el único artículo `completed`.

---

## 2. Contradicciones encontradas

| # | Contradicción | Estado |
|---|---------------|--------|
| C1 | 15 artículos en `completed` con 79 claims `unsupported`/`ambiguous` | ✅ Resuelta (reclasificación aplicada) |
| C2 | DeepSeek marcó `completed` solo por producir JSON válido | ✅ Resuelta (semántica de estados corregida) |
| C3 | 8 correcciones aplicadas sin trazabilidad documental uniforme | ⚠️ Documentada (ver `fase3-lote1-correcciones-verificadas.md`) |
| C4 | 5 fuentes oficiales para 99 claims = cobertura insuficiente | ⚠️ Registrada como pendiente (ver `fase3-lote1-fuentes-ampliadas.md`) |
| C5 | Código Procesal Penal (Decreto 9-99-E) no localizado | ⚠️ Pendiente (afecta a artículos procesales) |
| C6 | Migración `0038` duplicada (`colossal_gateway` vs `lively_silvermane`) | ✅ Resuelta (eliminado duplicado) |
| C7 | Ejecución anterior con GPT-4o declarada como Gemini | ✅ Resuelta (invalidada y reejecutada con DeepSeek) |

---

## 3. Estados anteriores (pre-reclasificación)

Fuente: `auditoria-blog/backup-pre-reclasificacion-2026-07-26T10-45-49-672Z.json`

| Slug | Estado anterior |
|------|-----------------|
| (los 15 slugs) | `completed` |

**Distribución:** `{ "completed": 15 }`

Los 15 artículos habían sido marcados `completed` por la ejecución DeepSeek del
2026-07-26 12:30 UTC, basándose únicamente en que el modelo produjo una
respuesta JSON válida, sin verificar que los claims centrales estuvieran
confirmados o corregidos con fuente.

---

## 4. Estados finales (post-reclasificación)

Fuente: `docs/audits/fase3-lote1-estados.json` + verificación en Neon.

| Slug | Estado final | Claims (cf/co/un) | Centrales unres | Fuentes | Humana |
|------|--------------|-------------------|-----------------|---------|--------|
| delitos-mas-comunes-honduras | `completed` | 4/3/0 | 0 | 7 | No |
| estafas-fraudes-tipos-penales-honduras | `source_checked` | 4/3/2 | 1 | 7 | No |
| allanamiento-ilegal-violacion-domicilio-honduras | `needs_human_review` | 1/1/5 | 4 | 1 | Sí |
| antejuicio-en-honduras | `needs_human_review` | 1/1/2 | 2 | 2 | Sí |
| defensa-penal-honduras | `needs_human_review` | 1/0/6 | 4 | 1 | Sí |
| derechos-detenido-honduras-guia-constitucional | `needs_human_review` | 1/0/5 | 5 | 1 | Sí |
| abogado-penalista-choluteca | `blocked` | 0/0/3 | 1 | 0 | No |
| abogado-penalista-sur-honduras | `blocked` | 0/0/2 | 1 | 0 | No |
| audiencia-inicial-proceso-penal-honduras | `blocked` | 0/0/7 | 5 | 0 | No |
| cuando-necesito-abogado-penalista-honduras | `blocked` | 0/0/2 | 1 | 0 | No |
| cuando-prescribe-delito-en-honduras | `blocked` | 0/0/11 | 10 | 0 | No |
| defensa-penal-menores-edad-honduras | `blocked` | 0/0/17 | 11 | 0 | No |
| diferencia-denuncia-querella-acusacion-honduras | `blocked` | 0/0/4 | 2 | 0 | No |
| fianza-medidas-cautelares-proceso-penal-honduras | `blocked` | 0/0/4 | 3 | 0 | Sí |
| violencia-domestica-ruta-legal-honduras | `blocked` | 0/0/9 | 9 | 0 | No |

**Distribución final:** `{ "completed": 1, "source_checked": 1, "needs_human_review": 4, "blocked": 9 }`

---

## 5. Semántica de estados aplicada

| Estado | Criterio (resumen) |
|--------|--------------------|
| `completed` | 0 claims centrales unresolved + ≥1 fuente oficial + contenido coincide con evidencia |
| `source_checked` | Claims centrales mayormente cubiertos; quedan claims centrales o secundarios sin resolver |
| `needs_human_review` | ≥1 claim central sin confirmar o contradicción entre fuentes o falta norma esencial |
| `blocked` | Sin acceso a fuentes esenciales y claims centrales sin confirmar |
| `corrected` | Transitorio: corregido pero sin verificación final |

**Regla rectora:** un artículo con claims centrales sin resolver **nunca** puede
ser `completed`. La producción de JSON válido por DeepSeek no es condición
suficiente para `completed`.

---

## 6. Invariantes validados

Implementados en `lib/ai/review-invariants.ts`:

```
confirmed + corrected + unresolved <= claims_count
completed => unresolved_central = 0
completed => official_sources_count > 0
needs_human_review => ai_review_requires_human = true
ai_reviewed_at != reviewed_at
```

Verificación post-aplicación: los 15 artículos cumplen los 5 invariantes en Neon.

---

## 7. Procedimiento de reclasificación

1. **Backup previo:** `auditoria-blog/backup-pre-reclasificacion-2026-07-26T10-45-49-672Z.json` (15 filas, estados anteriores = `completed`).
2. **Script:** `scripts/fase3-reclasificar-lote1.ts` con `--dry-run` (revisión) → `--aplicar` (transacción).
3. **Transacción:** `BEGIN` → 14 `UPDATE` (1 artículo sin cambio) → `COMMIT`.
4. **Verificación post:** 15/15 filas con el estado propuesto.
5. **Sin cambios fuera del lote:** los 15 slugs están en lista explícita; `WHERE slug = ANY(${SLUGS_LOTE1})`.

---

## 8. Pendientes explícitos (no resueltos en este cierre)

- **Ampliación de fuentes** para claims centrales de los 14 artículos no `completed` (§7 del enunciado). Requiere autorización expresa para ejecutar Google Search live.
- **Localización del Código Procesal Penal** (Decreto 9-99-E) para artículos procesales (audiencia inicial, fianza, allanamiento, denuncia vs querella).
- **Revisión humana jurídica** de los 4 `needs_human_review`. **No se marcaron revisiones humanas** en este cierre (no hay revisor humano válido); solo se dejó `ai_review_requires_human = true` para que el flujo editorial lo retome.
- **Integración del aviso público** `AiReviewNotice` en `app/(public)/blog/[categoria]/[slug]/page.tsx`. El componente se crea pero **no se integra** sin autorización (R5: no rediseñar web pública).

---

## 9. Trazabilidad

| Artefacto | Ruta |
|-----------|------|
| Claims con importancia | `docs/audits/fase3-lote1-claims-con-importancia.json` |
| Estados (propuesta/final) | `docs/audits/fase3-lote1-estados.json` |
| Backup pre-reclasificación | `auditoria-blog/backup-pre-reclasificacion-2026-07-26T10-45-49-672Z.json` |
| Evidencia runtime | `docs/audits/fase3-runtime-evidence.json` |
| Respuesta DeepSeek cruda | `docs/audits/fase3-lote1-deepseek.json` |
| Búsquedas Google | `docs/audits/fase3-lote1-google-search.json` |
| Invalidación GPT-4o | `docs/audits/fase3-lote1-invalidacion.md` |

---

## 10. ¿Lote 1 realmente cerrado?

**Como intervención técnica: SÍ.** La contradicción está resuelta, los estados
son honestos, los invariantes se cumplen, la migración es reproducible, el build
pasa y los entregables existen.

**Como verificación jurídica integral: NO.** 14 de 15 artículos requieren
trabajo adicional (fuentes, revisión humana o desbloqueo). El lote 1 queda en
estado **controlado y documentado**, listo para que el equipo jurídico decida el
siguiente paso, pero no debe presentarse al público como verificado salvo en el
único artículo `completed` (`delitos-mas-comunes-honduras`).

**No se autoriza continuar con el lote 2** hasta que se decida el tratamiento
de los 14 artículos pendientes.
