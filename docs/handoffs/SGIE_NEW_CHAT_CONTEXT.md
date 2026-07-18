# Contexto para un chat nuevo — Justicia Verdadera SGIE

## Proyecto

Justicia Verdadera es un SGIE penal para Honduras, construido con Next.js,
TypeScript, Drizzle/PostgreSQL Neon y Vitest. El objetivo es transformar la
intranet en un sistema de trabajo jurídico seguro: expediente, documentos,
requisitos, automatización y revisión humana.

## Forma de trabajo

Usar un único prompt amplio por fase. El usuario ejecuta, devuelve el resultado
completo, el orquestador revisa y se corrige o se avanza. No crear microfases,
no hacer commit/push/merge/despliegue sin autorización y no iniciar trabajo fuera
de la fase solicitada.

## Fuentes de verdad

1. `AUDITORIA_COMPLETA_RECONSTRUCCION_INTRANET_SGIE_V2.md`.
2. `docs/roadmap/SGIE_IMPLEMENTATION_CHECKLIST.md`.
3. Código, migraciones y tests actuales.
4. `docs/handoffs/fase-1-a-fase-2.md`.
5. `docs/architecture/fase-1-nucleo-admin-identidad-calendario.md` y
   `docs/ops/fase-1-staging-validation.md`.
6. `docs/handoffs/fase-1-deletion-manifest.md`.

## Fase 1

Estado: cerrada editorialmente tras esta corrección. Implementó invitaciones,
auth, RBAC, acceso SGIE, expedientes transaccionales, calendario privado y
optimista, migraciones 0032/0033 y retirada del CMS Admin. Se validó en Neon
aislado. Invariantes: sin registro público, tokens hash, servidor autoritativo,
scope de expediente, calendario privado y web pública separada. Deuda: snapshots
Drizzle, Resend real y compatibilidad temporal de rol legado.

## Fase 2

Objetivo exacto: procedimientos y automatización documental durable. Integrar
el modelo existente de expedientes, requisitos, documentos, enlaces, jobs y
auditoría; no rehacer invitaciones, RBAC, SGIE, expediente transaccional ni
calendario. Implementar plantillas/fases/transiciones, outbox, jobs con retry,
OCR adaptado, router IA, evidencia, confianza, revisión humana y estados visibles.

## Restricciones

- Sin registro público; alta por invitación y tokens hash.
- Acceso SGIE separado y RBAC centralizado en servidor.
- No romper web pública ni usar datos/clientes reales.
- No producción, commit, push, merge o despliegue sin autorización.
- No ejecutar `drizzle-kit generate` para reconstruir snapshots históricos.

## Prompt de arranque para un chat nuevo

```text
Lee primero AUDITORIA_COMPLETA_RECONSTRUCCION_INTRANET_SGIE_V2.md, luego
docs/roadmap/SGIE_IMPLEMENTATION_CHECKLIST.md y
docs/handoffs/SGIE_NEW_CHAT_CONTEXT.md. Revisa el repositorio real y continúa
únicamente con Fase 2: procedimientos y automatización documental durable.
No rehagas Fase 1, no modifiques la web pública, no uses producción ni datos
reales, y no hagas commit/push/merge/despliegue. Responde con un único prompt
amplio y operativo para ejecutar la fase, con validaciones y criterios de cierre.
```

## Referencias cruzadas

- [Auditoría V2](../../AUDITORIA_COMPLETA_RECONSTRUCCION_INTRANET_SGIE_V2.md)
- [Checklist maestro](../roadmap/SGIE_IMPLEMENTATION_CHECKLIST.md)
- [Handoff Fase 1 a Fase 2](fase-1-a-fase-2.md)
- [Arquitectura Fase 1](../architecture/fase-1-nucleo-admin-identidad-calendario.md)
- [Validación staging](../ops/fase-1-staging-validation.md)
- [Manifiesto de borrados](fase-1-deletion-manifest.md)
