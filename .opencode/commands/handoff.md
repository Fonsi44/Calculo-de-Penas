---
description: Produce el informe de handoff para ChatGPT (orquestador) según el formato AGENTS.md §9. Debe incluir estado, archivos, validaciones, riesgos y próximo paso recomendado.
agent: task-executor
---

Genera el informe de handoff para el orquestador externo (ChatGPT) sobre el
trabajo ejecutado. Usa exactamente el formato de `AGENTS.md` §9.

<contexto>
$ARGUMENTS
</contexto>

El informe debe incluir:

- Porcentaje completado y restante.
- Archivos modificados (con motivo principal por archivo).
- Dependencias instaladas (si hubo).
- Agentes, skills y comandos creados o modificados.
- MCP configurados y estado real (verificado, no asumido).
- Estado LSP (operativo o no).
- Comandos ejecutados y resultado de cada uno.
- Errores corregidos.
- Riesgos pendientes (BLOQUEANTE / NO BLOQUEANTE / REQUIERE REINICIO /
  REQUIERE DECISIÓN DEL ORQUESTADOR).
- NO VALIDADO: todo lo que no fue verificado.
- Cambios locales preexistentes preservados: sí/no.
- Commit: NO REALIZADO · Push: NO REALIZADO · Merge: NO REALIZADO ·
  Deploy: NO REALIZADO.
- Próximo paso recomendado (sin ejecutarlo).

Regla: sé veraz (R11/R12). No declares validado lo que no se ejecutó. No
avances a otra fase.
