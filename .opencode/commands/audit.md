---
description: Auditoría de solo lectura del repositorio (arquitectura, inconsistencias, seguridad, deuda técnica). No edita nada. Usa repo-auditor y security-reviewer.
agent: repo-auditor
---

Realiza una auditoría de **solo lectura** del alcance indicado. No edites ni
modifiques ningún archivo.

<scope>
$ARGUMENTS
</scope>

Divide el trabajo entre `repo-auditor` (arquitectura/inconsistencias/deuda) y
`security-reviewer` (seguridad/secretos/PII) cuando el alcance lo justifique.

Requisitos:

1. Lee `AGENTS.md` (secciones relevantes).
2. Ejecuta `git status --short --branch` y registra el estado inicial.
3. Para cada hallazgo usa el formato: severidad, `archivo:línea`, evidencia y
   recomendación (sin implementarla).
4. No modifiques, elimines ni instales nada. No ejecutes comandos con efectos.
5. Distingue problema real de decisión de diseño.
6. Devuelve hallazgos ordenados por severidad (CRÍTICO → BAJO).
