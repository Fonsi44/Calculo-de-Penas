# Automatizaciones — Guía de implementación completa

> **Para:** Desarrollador
> **Propósito:** Implementar las 30+ automatizaciones event-driven del CRM
> **Depende de:** Twenty configurado (docs/20), WhatsApp API (docs/21), Portal (docs/22)

---

## 1. Arquitectura de automatizaciones

```
Twenty emite webhook (deal.updated, document.updated, etc.)
  → Bridge API: /api/twenty/webhook
    → Handler identifica el evento
    → Ejecuta acciones (whatsapp, email, crear tarea, etc.)
    → Registra en audit log
```

---

## 2. Tabla completa de automatizaciones

### 2.1 Pipeline Captación

| # | Trigger | Condición | Acción | Código ref |
|---|---|---|---|---|
| A1 | deal.created | pipeline=Captación | WhatsApp bienvenida lead | notify("lead.created") |
| A2 | deal.updated | stage→Contactado | WhatsApp "Su caso está siendo revisado" | notify("lead.contacted") |
| A3 | deal.updated | stage→Consulta agendada | WhatsApp cita confirmada + crear Appointment | notify("appointment.scheduled") |
| A4 | cita creada | scheduledAt - 24h | WhatsApp recordatorio | scheduleReminder() |
| A5 | deal.updated | stage→Consulta realizada | Si falta legalArea en 1h: alerta abogado | validateConsulta() |
| A6 | deal.updated | stage→Presupuesto enviado | WhatsApp presupuesto listo | notify("budget.sent") |
| A7 | deal.updated | budgetStatus=accepted | WhatsApp bienvenida caso + generar caseNumber | notify("budget.accepted") |
| A8 | lead.assigned | 48h sin stage→Contactado | Alerta abogado: "Lead sin contactar" | checkStaleLead() |

### 2.2 Pipeline Caso Activo

| # | Trigger | Condición | Acción |
|---|---|---|---|
| B1 | deal.updated | stage→Apertura | Magic link al portal |
| B2 | deal.updated | stage→Instrucción | WhatsApp: "Su caso está en proceso" |
| B3 | deal.updated | stage→Seguimiento  | Alertar si +30 días sin actividad |
| B4 | deal.updated | stage→Cierre | WhatsApp resumen final |
| B5 | deal inactivo | 30 días sin cambios | Alerta abogado: "Caso sin avances" |
| B6 | deal inactivo | 90 días sin cambios | Alerta admin: "Caso abandonado" |

### 2.3 Documentos

| # | Trigger | Condición | Acción |
|---|---|---|---|
| C1 | document.created | isRequiredForCase=true | WhatsApp solicitar documento |
| C2 | document.updated | status=submitted | Notificar abogado: "Cliente subió [doc]" |
| C3 | document.updated | status=rejected | WhatsApp motivo + link portal |
| C4 | document.updated | status=rejected + rejectionCount≥3 | Escalar al admin |
| C5 | document.pending | 7 días sin submitted | WhatsApp recordatorio |
| C6 | document.pending | 14 días sin submitted | Email + notificar abogado |

### 2.4 Citas

| # | Trigger | Condición | Acción |
|---|---|---|---|
| D1 | appointment.created | status=scheduled | WhatsApp confirmar cita |
| D2 | appointment.updated | status=confirmed_by_client | Notificar abogado |
| D3 | appointment.updated | status=cancelled | WhatsApp confirmación cancelación |
| D4 | appointment.scheduledAt | pasó 1h sin completed | Alerta abogado: "¿Se realizó la cita?" |

### 2.5 Seguridad y pool

| # | Trigger | Condición | Acción |
|---|---|---|---|
| E1 | lead.assigned | (ninguna) | Notificar abogado: "Tiene un lead nuevo" |
| E2 | lead.assigned | 7 días sin avanzar | Alerta admin: "Lead abandonado" |
| E3 | magic link generado | (ninguna) | Registrar en audit log |
| E4 | intento fallido | 3 en 5 min | Bloquear IP 30 min |

---

## 3. Implementación del servicio de notificaciones

Crear `lib/notification-service.ts`:

```typescript
// lib/notification-service.ts
// Servicio central de notificaciones

type TriggerEvent =
  | 'lead.created' | 'lead.contacted'
  | 'appointment.scheduled' | 'appointment.reminder_24h'
  | 'appointment.completed' | 'appointment.cancelled'
  | 'document.requested' | 'document.submitted' | 'document.rejected'
  | 'budget.sent' | 'budget.accepted' | 'budget.rejected'
  | 'case.opened' | 'case.status_update' | 'case.closed'
  | 'lead.stale' | 'documents.overdue_7d' | 'documents.overdue_14d';

interface NotificationData {
  phone?: string;
  email?: string;
  dealId: string;
  metadata: Record<string, any>;
}

export async function notify(event: TriggerEvent, data: NotificationData) {
  const template = getTemplateForEvent(event);
  if (!template) {
    console.warn(`[notify] Sin template para: ${event}`);
    return;
  }

  // 1. Intentar WhatsApp
  if (data.phone) {
    const variables = mapVariables(template, data);
    const result = await sendWithRetry(() =>
      sendTemplate(data.phone!, template.name, variables)
    );

    if (result.ok) {
      return logNotification(event, data.dealId, 'whatsapp', true);
    }
  }

  // 2. Fallback a email
  if (data.email) {
    const emailSent = await sendEmailBackup(data.email, event, data.metadata);
    return logNotification(event, data.dealId, 'email', emailSent);
  }

  // 3. Si no hay ni WhatsApp ni email: log de error
  console.error(`[notify] No se pudo notificar evento ${event} para deal ${data.dealId}`);
  return logNotification(event, data.dealId, 'none', false);
}
```

---

## 4. Handlers de webhook

Crear `lib/twenty-handlers.ts`:

```typescript
// lib/twenty-handlers.ts
// Manejadores para cada evento de Twenty

export async function handleDealCreated(deal: any) {
  if (deal.pipelineId === 'captacion') {
    await notify('lead.created', {
      phone: deal.contactPhone,
      dealId: deal.id,
      metadata: { nombre: deal.contactName },
    });
  }
}

export async function handleDealUpdated(deal: any, previousStage?: string) {
  // Captación
  if (deal.pipelineId === 'captacion') {
    switch (deal.stageId) {
      case 'contactado':
        if (previousStage === 'nuevo_contacto') {
          await notify('lead.contacted', { phone: deal.contactPhone, dealId: deal.id, metadata: {} });
        }
        break;
      case 'consulta_agendada':
        await notify('appointment.scheduled', { phone: deal.contactPhone, dealId: deal.id, metadata: {
          fecha: deal.appointmentScheduledAt,
          abogado: deal.lawyerName,
        }});
        break;
      case 'presupuesto_enviado':
        await notify('budget.sent', { phone: deal.contactPhone, dealId: deal.id, metadata: {
          monto: deal.amount,
        }});
        break;
    }
  }

  // Caso Activo
  if (deal.pipelineId === 'caso_activo') {
    if (deal.stageId === 'apertura' && previousStage !== 'apertura') {
      await notify('case.opened', { phone: deal.contactPhone, dealId: deal.id, metadata: {
        caseNumber: deal.caseNumber,
      }});
    }
  }

  // Budget aceptado
  if (deal.budgetStatus === 'accepted' && deal.previousBudgetStatus === 'sent') {
    await notify('budget.accepted', { phone: deal.contactPhone, dealId: deal.id, metadata: {
      caseNumber: deal.caseNumber,
    }});
  }
}

export async function handleDocumentUpdated(doc: any) {
  switch (doc.status) {
    case 'submitted':
      await notify('document.submitted', { phone: null, dealId: doc.dealId, metadata: {
        docName: doc.name,
      }});
      break;
    case 'rejected':
      const rejectionCount = await countDocumentRejections(doc.id);
      if (rejectionCount >= 3) {
        // Escalar a admin
        await notifyAdmin({
          type: 'DOCUMENT_REJECTION_ESCALATION',
          dealId: doc.dealId,
          docName: doc.name,
          rejectionCount,
        });
      } else {
        await notify('document.rejected', { phone: doc.contactPhone, dealId: doc.dealId, metadata: {
          docName: doc.name,
          motivo: doc.rejectionReason,
          nota: doc.rejectionNote,
        }});
      }
      break;
  }
}
```

---

## 5. Programa recordatorios (cron)

Crear `app/api/cron/reminders/route.ts` (usar node-schedule (local)):

```typescript
// app/api/cron/reminders/route.ts
// Se ejecuta cada hora vía node-schedule

export async function GET(request: Request) {
  const now = new Date();

  // 1. Citas en 24h → enviar recordatorio
  const upcomingAppointments = await getAppointmentsInRange(
    new Date(now.getTime() + 23 * 60 * 60 * 1000),
    new Date(now.getTime() + 25 * 60 * 60 * 1000)
  );

  for (const apt of upcomingAppointments) {
    await notify('appointment.reminder_24h', {
      phone: apt.contactPhone,
      dealId: apt.dealId,
      metadata: { fecha: apt.scheduledAt, hora: apt.scheduledAt },
    });
  }

  // 2. Documentos pendientes >7 días → recordatorio
  const overdueDocs = await getDocumentsPending(7);
  for (const doc of overdueDocs) {
    await notify('documents.overdue_7d', {
      phone: doc.contactPhone,
      dealId: doc.dealId,
      metadata: { docName: doc.name, daysOverdue: 7 },
    });
  }

  // 3. Leads abandonados >7 días
  const staleDeals = await getStaleDeals(7);
  for (const deal of staleDeals) {
    await notify('lead.stale', { phone: null, dealId: deal.id, metadata: {
      abogado: deal.lawyerName,
      daysSinceAssignment: 7,
    }});
  }

  return Response.json({
    reminders: upcomingAppointments.length,
    overdueDocs: overdueDocs.length,
    staleDeals: staleDeals.length,
  });
}

export const dynamic = 'force-dynamic';
export const maxDuration = 60;
```

---

## 6. Escalamiento en 4 niveles

```typescript
// lib/escalation.ts

type EscalationLevel = 1 | 2 | 3 | 4;

interface EscalationRule {
  level: EscalationLevel;
  condition: (resource: any) => boolean;
  notify: string[];       // Quién recibe
  channel: 'whatsapp' | 'email' | 'dashboard';
  message: string;
}

const ESCALATION_RULES: EscalationRule[] = [
  {
    level: 1,
    condition: (lead) => lead.daysSinceAssignment >= 2,
    notify: ['lawyer'],
    channel: 'dashboard',
    message: 'Tiene un lead sin contactar en más de 2 días',
  },
  {
    level: 2,
    condition: (lead) => lead.daysSinceAssignment >= 7,
    notify: ['lawyer'],
    channel: 'email',
    message: 'Lead abandonado. Revise o solicite reasignación.',
  },
  {
    level: 3,
    condition: (doc) => doc.rejectionCount >= 3,
    notify: ['admin'],
    channel: 'email',
    message: 'Documento rechazado 3 veces. Se requiere intervención manual.',
  },
  {
    level: 4,
    condition: (deadline) => deadline.isOverdue,
    notify: ['admin', 'lawyer'],
    channel: 'whatsapp',
    message: 'Plazo vencido. Actúe inmediatamente.',
  },
];

export async function evaluateEscalation(resource: any, rules: EscalationRule[]) {
  for (const rule of rules) {
    if (rule.condition(resource)) {
      await notifyEscalation(rule, resource);
    }
  }
}
```

---

## Progreso

- [ ] 1. Crear lib/notification-service.ts (servicio central)
- [ ] 2. Implementar notificaciones de pipeline Captación (A1-A8)
- [ ] 3. Implementar notificaciones de pipeline Caso Activo (B1-B6)
- [ ] 4. Implementar notificaciones de documentos (C1-C6)
- [ ] 5. Implementar notificaciones de citas (D1-D4)
- [ ] 6. Implementar notificaciones de seguridad/pool (E1-E4)
- [ ] 7. Crear lib/twenty-handlers.ts (deal.created, deal.updated, document.updated)
- [ ] 8. Crear app/api/cron/reminders/route.ts (recordatorios automáticos)
- [ ] 9. Implementar escalamiento en 4 niveles
- [ ] 10. Configurar node-schedule (local) para recordatorios
- [ ] 11. Probar flujo: crear lead → WhatsApp bienvenida
- [ ] 12. Probar escalamiento: 3 rechazos de documento → admin notificado

