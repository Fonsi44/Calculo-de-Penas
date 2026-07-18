# SGIE — CHECKLIST MAESTRO DE IMPLEMENTACIÓN

## Estado general

- Proyecto: Justicia Verdadera — SGIE penal.
- Rama: `main`.
- Commit base: `c90fd7b`.
- Última actualización: 18 de julio de 2026.
- Fase actual: preparación documental para Fase 2.
- Última fase cerrada: Fase 1.
- Porcentaje global verificado: 25 %.
- Próximo objetivo: motor durable de procedimientos y automatización documental.

## Leyenda

- [x] Completado y validado.
- [ ] Pendiente.
- [ ] PARCIAL — existe una parte, falta el criterio indicado.
- [ ] BLOQUEADO — requiere decisión o integración externa.

## Invariantes que no deben romperse

- [x] Sin registro público; alta solo por invitación con token hash.
- [x] Cuenta, suspensión, sesión y acceso SGIE son estados separados.
- [x] RBAC y scope de expediente se resuelven en servidor.
- [x] Expedientes transaccionales; calendario privado y con control optimista.
- [x] Web pública separada del Admin operativo.

## Fase 1 — Núcleo Admin, identidad, RBAC y calendario

- [x] Invitaciones, roles, capacidades, SGIE y sesiones revocables.
- [x] Migraciones 0032 y 0033 validadas en Neon aislado.
- [x] Expedientes transaccionales, privacidad y conflictos de calendario.
- [x] CMS administrativo retirado sin retirar lectores públicos.
- [ ] PARCIAL — calendario de equipo real, DELETE explícito y E2E de día completo.

## Fase 2 — Procedimientos y automatización documental

- [ ] Plantillas versionadas, fases, transiciones y requisitos instanciados.
- [ ] Outbox documental, jobs durables, retry, backoff, locks y dead-letter.
- [ ] Subida, enlaces y deduplicación atómicos.
- [ ] OCR mediante adaptador, router IA, evidencia, confianza y revisión humana.
- [ ] Estados operativos visibles y E2E documental real.

## Fase 3 — Comunicaciones y portal del cliente

- [ ] Resend con plantillas, reglas, entregas, webhooks, rebotes e inbound.
- [ ] Portal seguro, solicitudes, recordatorios, cancelaciones y aprobación.
- [ ] Firma mediante adaptador independiente.

## Fase 4 — Experiencia del abogado y workspace

- [ ] Mi jornada, bandeja, workspace, riesgos y revisión por excepción.
- [ ] Comunicaciones, historial, próxima acción, operaciones por lote y calendario avanzado.

## Fase 5 — Copiloto, conocimiento y cierre productivo

- [ ] Base jurídica versionada, RAG con permisos y copiloto con evidencia.
- [ ] Contradicciones, cronología, readiness, paquetes, retención y observabilidad.
- [ ] Evaluación IA, E2E final, staging y validación productiva autorizada.

## Bloqueos actuales

- [ ] BLOQUEADO — snapshots Drizzle 0024–0033: crear baseline separada; no ejecutar `generate` histórico.
- [ ] BLOQUEADO — validación Resend real: falta destinatario técnico seguro.

## Decisiones jurídicas pendientes

- [ ] Política de dominios/correos externos y obligatoriedad de 2FA.
- [ ] Plantillas procesales aprobadas, reglas de transición y fuentes jurídicas.

## Integraciones pendientes

- [ ] OCR real, Resend completo, scheduler/worker y proveedor de firma.

## Migraciones

- [x] 0032 Admin, identidad, RBAC y calendario.
- [x] 0033 versión de calendario.
- [ ] Fase 2: workflow, outbox, jobs y documentos durables.

## Evidencias de validación

- [x] Lint, TypeScript, 917 pruebas, build y Drizzle check.
- [x] E2E Neon de Fase 1 y limpieza de fixtures.
- [ ] E2E documental, comunicaciones y OCR.

## Deuda técnica

- [ ] Compatibilidad temporal `usuarios.rol` junto a RBAC persistido.
- [ ] Snapshots Drizzle históricos y validación real de Resend.

## Próxima acción exacta

Leer Auditoría V2, este checklist y el handoff; después implementar en un único
prompt amplio la Fase 2, empezando por workflow/outbox/jobs sin rehacer Fase 1.

## Referencias cruzadas

- [Auditoría V2](../../AUDITORIA_COMPLETA_RECONSTRUCCION_INTRANET_SGIE_V2.md)
- [Contexto para chat nuevo](../handoffs/SGIE_NEW_CHAT_CONTEXT.md)
- [Handoff Fase 1 a Fase 2](../handoffs/fase-1-a-fase-2.md)
- [Arquitectura Fase 1](../architecture/fase-1-nucleo-admin-identidad-calendario.md)
- [Validación staging](../ops/fase-1-staging-validation.md)
- [Manifiesto de borrados](../handoffs/fase-1-deletion-manifest.md)
