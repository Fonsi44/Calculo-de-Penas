# Fase 3 — Invalidación del Lote 1 Penal

**Fecha:** 2026-07-26

## Motivo

La ejecución anterior del primer lote penal es **inválida** porque:

1. Utilizó **GPT-4o** como modelo de análisis (`scripts/fase3-ejecutor-openai.ts`)
2. Registró incorrectamente **"Gemini 3.6 Flash"** como `ai_review_model`
3. La trazabilidad es falsa: el proveedor real (OpenAI) no coincide con el declarado (Gemini)

## Acción de invalidación

- **Script:** `scripts/fase3-invalidar-lote1.ts --aplicar`
- **Backup:** `auditoria-blog/backup-2026-07-26-08-39.json`
- **SHA-256:** `1a86eceaec899bdd6d808c5e422f43049bf04c1ada73391911753e2de2b72329`
- **Fecha del backup:** 2026-07-26 08:39 UTC (anterior a la ejecución inválida)

## Resultado

- **15 registros restaurados** en transacción
- **Body** restaurado al estado pre-modificación
- **updated_at** restaurado al valor original
- **ai_review_* (10 campos)** reseteados a defaults
- **15/15 verificaciones** correctas post-restauración

## Slugs del lote invalidado

1. delitos-mas-comunes-honduras
2. allanamiento-ilegal-violacion-domicilio-honduras
3. diferencia-denuncia-querella-acusacion-honduras
4. derechos-detenido-honduras-guia-constitucional
5. antejuicio-en-honduras
6. abogado-penalista-sur-honduras
7. defensa-penal-honduras
8. violencia-domestica-ruta-legal-honduras
9. audiencia-inicial-proceso-penal-honduras
10. cuando-prescribe-delito-en-honduras
11. defensa-penal-menores-edad-honduras
12. fianza-medidas-cautelares-proceso-penal-honduras
13. estafas-fraudes-tipos-penales-honduras
14. cuando-necesito-abogado-penalista-honduras
15. abogado-penalista-choluteca

## Archivo de claims inválido

`docs/audits/revision-ia-blog-claims.json` → archivado como `docs/audits/fase3-lote1-invalidado-gpt4o.json`
