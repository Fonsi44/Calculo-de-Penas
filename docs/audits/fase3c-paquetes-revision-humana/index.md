# Fase 3C — Paquetes de revisión humana (Lote 1 Penal)

**Fecha:** 2026-07-26
**Modo:** `IMPLEMENTACIÓN` sobre `main`
**Alcance:** 7 artículos del Lote 1 que quedaron en `needs_human_review` tras Fase 3C y requieren decisión jurídica humana.

**IMPORTANTE:** Ningún paquete tiene campos de revisor rellenados. La revisión jurídica humana NO ha sido realizada.

---

## Índice por prioridad

Criterio de orden (enunciado §6):
1. Riesgo de información jurídica incorrecta
2. Impacto público
3. Centralidad del claim
4. Facilidad de resolución

| # | Prioridad | Slug | Archivo | Claims pendientes | Motivo principal |
|---|-----------|------|---------|-------------------|------------------|
| 1 | 🔴 Alta | `defensa-penal-menores-edad-honduras` | [paquete.md](./defensa-penal-menores-edad-honduras.md) | 1 | Efecto de antecedentes juveniles sobre reincidencia adulta |
| 2 | 🔴 Alta | `antejuicio-en-honduras` | [paquete.md](./antejuicio-en-honduras.md) | 2 | Numeración post-reforma constitucional; alcance funcional del antejuicio |
| 3 | 🟡 Media | `cuando-prescribe-delito-en-honduras` | [paquete.md](./cuando-prescribe-delito-en-honduras.md) | 3 | Causas de suspensión de prescripción; efecto "consumada" |
| 4 | 🟡 Media | `derechos-detenido-honduras-guia-constitucional` | [paquete.md](./derechos-detenido-honduras-guia-constitucional.md) | 2 | Cita imprecisa Art. 119 CPP; plazo hábeas corpus |
| 5 | 🟡 Media | `violencia-domestica-ruta-legal-honduras` | [paquete.md](./violencia-domestica-ruta-legal-honduras.md) | 1 | Plazo denuncia vs. prescripción acción penal |
| 6 | 🟢 Baja | `allanamiento-ilegal-violacion-domicilio-honduras` | [paquete.md](./allanamiento-ilegal-violacion-domicilio-honduras.md) | 1 | Horario específico de allanamiento |
| 7 | 🟢 Baja | `abogado-penalista-choluteca` | [paquete.md](./abogado-penalista-choluteca.md) | 1 | Verificación autoridades judiciales locales Choluteca |

---

## Resumen agregado

- **Artículos en `needs_human_review`:** 7
- **Claims pendientes totales:** 11
- **Artículos desbloqueados en Fase 3C:** 4 (pasaron de `blocked` a `completed`/`needs_human_review`)
- **Artículos en `completed`:** 7
- **Artículos en `source_checked`:** 1

---

## Cómo usar estos paquetes

Cada paquete es independiente y contiene:

- Título y slug del artículo
- Estado actual de revisión AI
- Lista de claims pendientes (con texto exacto, norma y fragmento)
- Contradicciones detectadas
- Pregunta concreta que debe resolver el abogado
- Opciones de decisión con impacto
- Propuesta de redacción prudente
- Campos vacíos para identificación del revisor, fecha, decisión y observaciones

**El revisor humano debe:**
1. Leer el paquete completo.
2. Consultar la norma citada (URL o PDF de trabajo).
3. Decidir entre las opciones propuestas.
4. Rellenar los campos de decisión y observaciones.
5. Devolver el paquete para que el equipo técnico aplique la corrección.

**No debe:** marcar paquetes como revisados sin haberlos leído íntegramente.
