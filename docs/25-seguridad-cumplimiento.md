# Seguridad y cumplimiento normativo

> **Para:** Desarrollador
> **Propósito:** Implementar auditoría, control de acceso, protección de datos y compliance legal hondureño
> **Fase:** Transversal (aplica a Fases 1-4)

---

## 1. Auditoría de actividad

### 1.1 Tabla de auditoría (Neon PostgreSQL)

Agregar a `lib/schema.ts`:

```typescript
export const activityLog = pgTable('activity_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  actorType: varchar('actor_type', { length: 10 }).notNull(), // lawyer, client, system
  actorId: varchar('actor_id', { length: 100 }).notNull(),
  action: varchar('action', { length: 50 }).notNull(),
  resourceType: varchar('resource_type', { length: 30 }).notNull(),
  resourceId: uuid('resource_id'),
  metadata: jsonb('metadata').default({}),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: varchar('user_agent', { length: 200 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Índices
// - resourceType + resourceId (historial de un recurso)
// - actorId + createdAt (actividad de un actor)
// - action + createdAt (métricas)
// - createdAt (para purga por retención)
```

### 1.2 Helper de auditoría

```typescript
// lib/audit.ts (ampliar el existente)

type AuditAction =
  | 'lead.created' | 'lead.assigned'
  | 'deal.moved_to_stage'
  | 'document.submitted' | 'document.rejected'
  | 'appointment.confirmed' | 'appointment.cancelled'
  | 'magic_link.sent' | 'magic_link.used'
  | 'magic_link.unauthorized_access'
  | 'user.login' | 'user.login_failed'
  | 'budget.sent' | 'budget.accepted'
  | 'notification.sent';

export async function logActivity(opts: {
  actorType: 'lawyer' | 'client' | 'system';
  actorId: string;
  action: AuditAction;
  resourceType: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
}) {
  try {
    await db.insert(activityLog).values({
      actorType: opts.actorType,
      actorId: opts.actorId,
      action: opts.action,
      resourceType: opts.resourceType,
      resourceId: opts.resourceId || null,
      metadata: opts.metadata || null,
      ipAddress: opts.ip || null,
      userAgent: opts.userAgent?.slice(0, 200) || null,
    });
  } catch (e) {
    console.warn('[audit] Error al registrar:', opts.action, e);
  }
}
```

### 1.3 Retención de logs

```sql
-- Retención: 1 año para logs detallados
-- Datos de caso: 5 años post-cierre (requisito legal HN)

-- Purga automática (cron mensual)
DELETE FROM activity_log
WHERE createdAt < NOW() - INTERVAL '1 year';

-- Purga de datos de caso cerrado >5 años
-- Se ejecuta manualmente con confirmación del abogado
```

---

## 2. Control de acceso basado en roles (RBAC)

### 2.1 Roles en Twenty

| Rol | Permisos |
|---|---|
| admin | Ve todos los Deals. Reasigna leads. Configura pipelines. Desactiva abogados. Recibe escalamientos. |
| lawyer | Ve sus Deals asignados. Ve pool de leads. Se asigna leads. Crea Contacts/Deals. No ve Deals ajenos. |
| assistant | Mismos permisos que lawyer pero sin crear/eliminar Deals. Gestiona documentos y citas. |

### 2.2 Roles en el portal cliente

| Rol | Permisos |
|---|---|
| cliente | Ve SOLO sus Deals (por contactId). Edita SOLO sus datos. Sube docs SOLO a sus Deals. Confirma/rechaza SOLO sus presupuestos. |

### 2.3 Verificación de acceso en cada ruta del portal

```typescript
// Middleware de verificación para portal
async function requirePortalAccess(token: string, dealId: string) {
  const session = await validateMagicLink(token);
  if (!session.ok) {
    return { error: 'No autorizado', status: 401 };
  }

  const deal = await getDealFromTwenty(dealId);
  if (deal.contactId !== session.contactId) {
    // Intento de acceso a caso ajeno
    await logActivity({
      actorType: 'client',
      actorId: session.contactId,
      action: 'magic_link.unauthorized_access',
      resourceType: 'deal',
      resourceId: dealId,
    });
    return { error: 'No tienes acceso a este caso', status: 403 };
  }

  return null; // OK
}
```

---

## 3. Protección de datos (Ley Honduras)

### 3.1 Cumplimiento

| Norma | Medida |
|---|---|
| Ley de Protección de Datos Personales (Decreto 154-2021) | Consentimiento explícito en formularios. Cliente acepta política al usar el portal. Datos eliminables a solicitud (ARCO). |
| Secreto profesional (Código de Ética del Abogado HN) | Datos de casos solo visibles por el abogado asignado. Admin con acceso limitado a métricas. |
| Conservación de expedientes | 5 años post-cierre. Luego: opción de anonimizar o eliminar. |

### 3.2 Encriptación

| Capa | Medida |
|---|---|
| Transporte | TLS 1.3 en todos los endpoints. HSTS ya configurado. |
| Magic link tokens | SHA-256 hash en DB. Token raw solo en URL y memoria. |
| Documentos | Almacenados con nombres hasheados. URLs con expiración. |
| Conexión DB | PostgreSQL con SSL/TLS obligatorio. |
| Secretos | JWT_SECRET, WHATSAPP_TOKEN, RESEND_API_KEY en .env.local / .env.local |

### 3.3 Rate limiting

```typescript
// El rate limiting ya existe en lib/rate-limit.ts
// Usar en:
// - /api/portal/validate: 5 req/min por IP
// - /api/whatsapp webhook: 100 req/min
// - Magic link generation: 3 req/hora por teléfono
```

---

## 4. Plan de respuesta a incidentes

| Fase | Acción |
|---|---|
| Detección | Monitoreo de activity_log. Alertas en 3+ intentos fallidos de acceso. |
| Contención | Deshabilitar magic link. Rotar tokens de acceso. |
| Investigación | Revisar activity_log: quién, cuándo, qué datos. |
| Notificación | Informar al cliente afectado si sus datos fueron expuestos. |
| Recuperación | Restaurar desde backup. Aplicar parches. |
| Post-mortem | Documentar causa raíz. Prevenir recurrencia. |

---

## 5. Backups

```powershell
# PostgreSQL backup (local)
pg_dump -h localhost -U postgres -d twenty_crm > "backup_$(Get-Date -Format yyyy-MM-dd).sql"

# Automatizar con cron en Windows:
# Programar tarea en Windows Task Scheduler que ejecute el dump diario
```

---

## Progreso

- [ ] 1. Crear tabla activity_log en schema.ts
- [ ] 2. Ejecutar migración Drizzle
- [ ] 3. Implementar logActivity() helper
- [ ] 4. Agregar logging a todas las acciones del CRM
- [ ] 5. Configurar purga automática de logs (1 año)
- [ ] 6. Configurar roles en Twenty (admin, lawyer, assistant)
- [ ] 7. Implementar verificación de acceso en portal cliente
- [ ] 8. Configurar rate limiting en endpoints sensibles
- [ ] 9. Verificar TLS 1.3 y HSTS
- [ ] 10. Configurar backup automático diario de BD

