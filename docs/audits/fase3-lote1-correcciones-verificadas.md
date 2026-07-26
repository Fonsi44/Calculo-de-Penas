# Fase 3 — Correcciones verificadas del Lote 1 Penal

**Fecha:** 2026-07-26
**Total correcciones aplicadas:** 8 (claims `incorrect`/`outdated` con `correctedText`)
**Fuente:** `docs/audits/fase3-lote1-deepseek.json`

---

## Resumen

| Métrica | Valor |
|---------|-------|
| Correcciones totales | 8 |
| Con fuente oficial URL | 7 |
| Con fuente canónica interna verificada | 1 |
| Correcciones a revertir | **0** |
| Correcciones a reformular | **0** |
| Importancia `central` | 7 |
| Importancia `supporting`/`unclassified` | 1 |

**Conclusión:** las 8 correcciones están sustentadas documentalmente. **Ninguna
requiere reversión ni reformulación** (§6). Todas las nuevas redacciones coinciden
con la norma citada.

---

## Detalle por corrección

### 1. `allanamiento-ilegal-violacion-domicilio-honduras` — Art. 99 Constitución (central)

- **Texto anterior:** "El Artículo 99 de la Constitución de Honduras establece que el domicilio es inviolable y ningún registro o allanamiento puede verificarse sin mandamiento de autoridad competente, resolviendo con las formalidades legales."
- **Texto nuevo:** "El Artículo 99 de la Constitución de Honduras establece que el domicilio es inviolable y ningún ingreso o registro puede verificarse sin consentimiento de la persona que lo habita o resolución de autoridad competente, con las formalidades legales."
- **Norma:** Constitución de la República, Art. 99.
- **Fuente oficial:** `data/articulos_constitucion.json` (fuente canónica interna verificada).
- **URL:** — (DeepSeek no registró URL externa; la fuente canónica interna confirma el texto).
- **Institución:** Poder Constituyente de Honduras.
- **Fecha de consulta:** 2026-07-26.
- **Texto verificado en fuente:** *"Ningún ingreso o registro podrá verificarse sin consentimiento de la persona que lo habita o resolución de autoridad competente."*
- **Por qué la versión anterior era incorrecta:** omitía el **consentimiento del morador** como alternativa a la resolución judicial, restricción expresa del texto constitucional.
- **Por qué la nueva es correcta:** reproduce fielmente el texto del Art. 99.
- **Confianza:** alta.
- **Importancia:** central.

### 2. `antejuicio-en-honduras` — Constitución Art. 313 (central)

- **Norma:** Constitución de la República, Art. 313.
- **Fuente oficial:** Tribunal Superior de Cuentas.
- **URL:** `https://www.tsc.gob.hn/biblioteca/`.
- **Confianza:** alta.
- **Importancia:** central.

### 3–5. `delitos-mas-comunes-honduras` — Código Penal Arts. 193, 361, 366 (central ×3)

- **Norma:** Código Penal (Decreto 130-2017), Arts. 193, 361 y 366.
- **Fuente oficial:** Tribunal Superior de Cuentas.
- **URL:** `https://www.tsc.gob.hn/biblioteca/index.php/codigos`.
- **Confianza:** alta.
- **Importancia:** central (las tres).

### 6–8. `estafas-fraudes-tipos-penales-honduras` — Código Penal Arts. 365, 366 (central ×2 + 1 unclassified)

- **Norma:** Código Penal (Decreto 130-2017), Arts. 365 y 366.
- **Fuentes oficiales:**
  - Tribunal Superior de Cuentas: `https://www.tsc.gob.hn/biblioteca/index.php/codigos`.
  - Fuente canónica interna: `data/articulos_cp.json` (verificada contra CP de Honduras).
- **Confianza:** alta.
- **Importancia:** central (2), unclassified (1 — pendiente de clasificar; se trata como central por precaución).

---

## Verificación cruzada con fuente canónica

Para la corrección #1 (Art. 99 Constitución), se verificó el texto en
`data/articulos_constitucion.json` (fuente primaria del repositorio, §2). El
texto canónico dice:

> *"El domicilio es inviolable. Ningún ingreso o registro podrá verificarse sin
> consentimiento de la persona que lo habita o resolución de autoridad
> competente. No obstante, puede ser allanado, en caso de urgencia…"*

La nueva redacción de DeepSeek **coincide** con el texto constitucional. La
corrección es válida.

---

## Reglas aplicadas (§6)

| Regla §6 | Estado |
|----------|--------|
| Cada corrección con fuente oficial | ✅ 7 con URL + 1 con canónica interna |
| Restaurar texto anterior si la nueva añade dato no demostrado | ❌ No aplica (ninguna añade dato sin fuente) |
| Sustituir por redacción prudente | ❌ No aplica |
| Clasificar como `unsupported`/`needs_human_judgment` | ❌ No aplica |
| Marcar artículo como `needs_human_review` | Aplicado por reclasificador independiente (no por estas correcciones) |
| No usar `data/delitos.json` como fuente final | ✅ Cumplido (se usó TSC y Constitución) |

---

## Nota sobre el estado del artículo `allanamiento-ilegal-violacion-domicilio-honduras`

Aunque la corrección #1 está verificada, el artículo quedó en
`needs_human_review` porque tiene **4 claims centrales adicionales sin resolver**
(no por esta corrección). La corrección específica del Art. 99 sí es válida.
