# Portal Cliente — Magic Link + Documentos + Citas

> **Para:** Desarrollador
> **Propósito:** Implementar el portal del cliente con acceso mediante magic link, subida de documentos y gestión de citas
> **Depende de:** Twenty funcionando (docs/19), pipelines configurados (docs/20)

---

## 1. Resumen

El portal del cliente permite que un cliente del bufete acceda a su caso sin contraseña. Recibe un enlace mágico por WhatsApp y desde ahí puede ver documentos, presupuestos, citas y más.

Rutas del portal:

| Ruta | Propósito |
|---|---|
| /mi-caso | Login via token (leer token de query param) |
| /mi-caso/expirado | Token expirado |
| /mi-caso/[dealId] | Dashboard del caso |
| /mi-caso/[dealId]/documentos | Documentos solicitados + subir |
| /mi-caso/[dealId]/presupuesto | Ver + aceptar/rechazar |
| /mi-caso/[dealId]/citas | Ver + agendar/reprogramar |

---

## 2. Modelo de datos (tablas en Neon PostgreSQL)

Agregar a `lib/schema.ts`:

```typescript
// Tabla: magic_tokens
export const magicTokens = pgTable('magic_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  contactId: uuid('contact_id').notNull(),
  dealId: uuid('deal_id'),
  telefono: varchar('telefono', { length: 20 }).notNull(),
  token: varchar('token', { length: 64 }).notNull().unique(), // SHA-256
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  usedAt: timestamp('used_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Tabla: documentos_caso
export const documentosCaso = pgTable('documentos_caso', {
  id: uuid('id').primaryKey().defaultRandom(),
  dealId: uuid('deal_id').notNull(),
  nombre: varchar('nombre', { length: 255 }).notNull(),
  tipo: varchar('tipo', { length: 20 }).notNull(), // solicitado, subido_cliente, subido_abogado
  status: varchar('status', { length: 20 }).notNull().default('pendiente'),
  fileUrl: varchar('file_url', { length: 500 }),
  version: integer('version').default(1),
  hashSha256: varchar('hash_sha256', { length: 64 }), // Control de duplicados
  solicitadoEn: timestamp('solicitado_en', { withTimezone: true }).defaultNow(),
  subidoEn: timestamp('subido_en', { withTimezone: true }),
  notas: text('notas'),
  intentosRechazo: integer('intentos_rechazo').default(0),
});

// Ejecutar migración:
// npx drizzle-kit generate && npx drizzle-kit push
```

---

## 3. Magic link — Generación y validación

Crear `lib/magic-link.ts`:

```typescript
// lib/magic-link.ts

import crypto from 'crypto';
import { db } from '@/lib/db';
import { magicTokens } from '@/lib/schema';
import { eq, and, gt, isNull } from 'drizzle-orm';

const TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 días

// ─── Generar magic link ───

export async function generateMagicLink(contactId: string, dealId: string, telefono: string): Promise<string> {
  // 1. Invalidar tokens anteriores del mismo contacto
  await db.update(magicTokens)
    .set({ usedAt: new Date() })
    .where(and(
      eq(magicTokens.contactId, contactId),
      isNull(magicTokens.usedAt),
      gt(magicTokens.expiresAt, new Date()), // solo los no expirados
    ));

  // 2. Generar nuevo token
  const rawToken = crypto.randomBytes(32).toString('base64url');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  // 3. Guardar en DB
  await db.insert(magicTokens).values({
    contactId,
    dealId,
    telefono,
    token: tokenHash,
    expiresAt: new Date(Date.now() + TOKEN_EXPIRY_MS),
  });

  // 4. Construir URL
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  return `${siteUrl}/mi-caso?token=${rawToken}`;
}

// ─── Validar magic link ───

export async function validateMagicLink(rawToken: string): Promise<{
  ok: boolean;
  contactId?: string;
  dealId?: string;
  error?: 'expirado' | 'invalido' | 'ya_usado';
}> {
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  const record = await db.query.magicTokens.findFirst({
    where: eq(magicTokens.token, tokenHash),
  });

  if (!record) {
    return { ok: false, error: 'invalido' };
  }

  if (record.usedAt) {
    return { ok: false, error: 'ya_usado' };
  }

  if (new Date() > record.expiresAt) {
    return { ok: false, error: 'expirado' };
  }

  // Token válido: extender ventana deslizante (+7 días)
  await db.update(magicTokens)
    .set({ expiresAt: new Date(Date.now() + TOKEN_EXPIRY_MS) })
    .where(eq(magicTokens.id, record.id));

  return {
    ok: true,
    contactId: record.contactId,
    dealId: record.dealId,
  };
}

// ─── Reenviar magic link ───

export async function resendMagicLink(telefono: string): Promise<string | null> {
  const contact = await findContactByPhone(telefono);
  if (!contact) return null;

  const activeDeal = await getActiveDeal(contact.id);
  if (!activeDeal) return null;

  const link = await generateMagicLink(contact.id, activeDeal.id, telefono);

  // Enviar WhatsApp
  await sendTemplate(telefono, 'magic_link_reenvio', {
    '1': link,
  });

  return link;
}
```

---

## 4. Páginas del portal

### 4.1 Login via token

Crear `app/(public)/mi-caso/page.tsx`:

```typescript
// app/(public)/mi-caso/page.tsx
// Página de entrada: recibe token de query param, valida, redirige

import { redirect } from 'next/navigation';
import { validateMagicLink } from '@/lib/magic-link';

export default async function MiCasoPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md text-center">
          <Scale className="w-16 h-16 text-primary/30 mx-auto mb-4" />
          <h1 className="text-xl font-bold mb-2">Acceso al portal</h1>
          <p className="text-text-secondary mb-6">
            Ingresa el enlace que recibiste por WhatsApp para ver tu caso.
          </p>
          <p className="text-sm text-text-muted">
            ¿No tienes enlace? Pídelo a tu abogado o llama al +34 661 911 574.
          </p>
        </div>
      </div>
    );
  }

  const session = await validateMagicLink(token);

  if (!session.ok) {
    if (session.error === 'expirado') {
      redirect('/mi-caso/expirado');
    }
    return <ErrorPagina mensaje="Enlace inválido" />;
  }

  redirect(`/mi-caso/${session.dealId}`);
}
```

### 4.2 Dashboard del caso

Crear `app/(public)/mi-caso/[dealId]/page.tsx`:

```typescript
// app/(public)/mi-caso/[dealId]/page.tsx
// Vista principal del caso para el cliente

export default async function DealPage({
  params,
  searchParams,
}: {
  params: Promise<{ dealId: string }>;
  searchParams: Promise<{ token: string }>;
}) {
  const { dealId } = await params;
  const { token } = await searchParams;

  const session = await validateMagicLink(token);
  if (!session.ok) redirect('/mi-caso');

  const deal = await getDealFromTwenty(dealId);
  if (deal.contactId !== session.contactId) {
    return <ErrorPagina mensaje="No tienes acceso a este caso" />;
  }

  return (
    <div className="min-h-screen bg-background p-4 max-w-lg mx-auto">
      <HeaderCliente nombre={deal.contactName} />
      
      <Card className="mb-4">
        <h2 className="font-bold">Estado del caso</h2>
        <p>{deal.stageName}</p>
        <p>Abogado: {deal.lawyerName}</p>
        {deal.nextImportantDate && (
          <p>Próxima fecha: {formatDate(deal.nextImportantDate)}</p>
        )}
      </Card>

      <AccionesRapidas dealId={dealId} token={token} />
      
      <DocumentosResumen dealId={dealId} token={token} />
      
      <PresupuestoResumen dealId={dealId} token={token} />
      
      <CitasResumen dealId={dealId} token={token} />
    </div>
  );
}
```

### 4.3 Subida de documentos

```typescript
// app/(public)/mi-caso/[dealId]/documentos/page.tsx

export default async function DocumentosPage({ params, searchParams }) {
  const { dealId } = await params;
  const { token } = await searchParams;
  const session = await validateMagicLink(token);
  if (!session.ok) redirect('/mi-caso');

  const documentos = await getDocumentos(dealId);

  return (
    <div className="min-h-screen bg-background p-4 max-w-lg mx-auto">
      <h1 className="text-lg font-bold mb-4">Documentos</h1>

      {/* Documentos solicitados por el abogado */}
      <h2 className="font-semibold mb-2">Solicitados por tu abogado</h2>
      {documentos.filter(d => d.tipo === 'solicitado').map(doc => (
        <DocumentoCard
          key={doc.id}
          doc={doc}
          token={token}
          dealId={dealId}
        />
      ))}

      {/* Subir nuevo documento */}
      <FormSubirDocumento dealId={dealId} token={token} />
    </div>
  );
}
```

---

## 5. API endpoints del portal

Crear en `app/api/portal/`:

| Ruta | Método | Descripción |
|---|---|---|
| /api/portal/validate | POST | Validar magic link |
| /api/portal/:dealId/documentos | GET | Listar documentos |
| /api/portal/:dealId/documentos | POST | Subir documento |
| /api/portal/:dealId/presupuesto | GET | Ver presupuesto |
| /api/portal/:dealId/presupuesto | POST | Aceptar/rechazar |
| /api/portal/:dealId/citas | GET | Próximas citas |
| /api/portal/:dealId/citas | POST | Agendar/reprogramar |
| /api/portal/:dealId/contacto | GET | Datos del contacto |
| /api/portal/:dealId/contacto | PUT | Editar datos personales |

```typescript
// app/api/portal/[dealId]/documentos/route.ts

export async function POST(
  request: Request,
  { params }: { params: Promise<{ dealId: string }> }
) {
  const token = request.headers.get('x-magic-token');
  const session = await validateMagicLink(token);
  if (!session.ok) return Response.json({ error: 'No autorizado' }, { status: 401 });

  const dealId = (await params).dealId;
  const formData = await request.formData();
  const file = formData.get('file') as File;
  const docId = formData.get('docId') as string;

  // Validaciones
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/heic'];
  if (!allowedTypes.includes(file.type)) {
    return Response.json({ error: 'Formato no permitido. Usa PDF, JPG, PNG o HEIC' }, { status: 400 });
  }
  if (file.size > 15 * 1024 * 1024) {
    return Response.json({ error: 'Archivo demasiado grande (máx 15 MB)' }, { status: 400 });
  }

  // Calcular hash SHA-256 para detectar duplicados
  const buffer = await file.arrayBuffer();
  const hash = crypto.createHash('sha256').update(Buffer.from(buffer)).digest('hex');

  // Verificar si el documento ya fue subido (mismo hash = mismo contenido)
  const existing = await findDocumentVersion(dealId, docId, hash);
  if (existing) {
    return Response.json({
      error: 'DUPLICATE_FILE',
      message: 'Este archivo ya fue subido anteriormente (mismo contenido)',
      version: existing.version,
    }, { status: 409 });
  }

  // Subir archivo (a local storage o S3)
  const fileUrl = await storeFile(file, { dealId, docId, version: existing.version + 1 });

  // Actualizar DB
  const doc = await updateDocumentStatus(docId, 'submitted', {
    version: existing.version + 1,
    fileUrl,
    hashSha256: hash,
    subidoEn: new Date(),
  });

  // Notificar al abogado
  await notify('document.submitted', {
    dealId,
    phone: session.telefono,
    documentName: doc.nombre,
  });

  return Response.json({ ok: true, doc });
}
```

---

## 6. Citas — Cálculo de slots disponibles

```typescript
// lib/appointments.ts

export async function getAvailableSlots(
  lawyerId: string,
  date: string,  // YYYY-MM-DD
  modality: 'phone' | 'office' | 'home_visit'
): Promise<Slot[]> {
  // 1. Obtener disponibilidad del abogado
  const availability = await getLawyerAvailability(lawyerId);
  const dayOfWeek = new Date(date).getDay();
  const dayConfig = availability.find(a => a.dayOfWeek === dayOfWeek);
  if (!dayConfig) return [];  // No trabaja ese día

  // 2. Generar slots teóricos
  const slots: Slot[] = [];
  let time = parseTime(dayConfig.startTime);
  const endTime = parseTime(dayConfig.endTime);
  const breakStart = dayConfig.breakStart ? parseTime(dayConfig.breakStart) : null;
  const breakEnd = dayConfig.breakEnd ? parseTime(dayConfig.breakEnd) : null;

  while (time + dayConfig.slotDurationMinutes <= endTime) {
    // Saltar pausa
    if (breakStart && breakEnd && time >= breakStart && time < breakEnd) {
      time = breakEnd;
      continue;
    }

    slots.push({ time: formatTime(time), available: true });
    time += dayConfig.slotDurationMinutes;
  }

  // 3. Obtener citas ya agendadas
  const booked = await getBookedAppointments(lawyerId, date);
  const bookedTimes = new Set(booked.map(a => formatTime(a.scheduledAt)));

  // 4. Marcar ocupados
  for (const slot of slots) {
    if (bookedTimes.has(slot.time)) {
      slot.available = false;
    }
    // Límite: máximo 2 citas de oficina simultáneas
    if (modality === 'office') {
      const concurrent = booked.filter(a =>
        a.modality === 'office' && formatTime(a.scheduledAt) === slot.time
      ).length;
      if (concurrent >= 2) slot.available = false;
    }
  }

  return slots;
}

// Soft lock de 5 minutos mientras el cliente decide
const softLocks = new Map<string, number>(); // slotKey -> timestamp

export function acquireSoftLock(slotKey: string): boolean {
  const now = Date.now();
  const locked = softLocks.get(slotKey);
  if (locked && now - locked < 5 * 60 * 1000) return false; // Lock activo
  softLocks.set(slotKey, now);
  return true;
}
```

---

## 7. Reprogramación de citas

```typescript
export async function rescheduleAppointment(
  appointmentId: string,
  newDate: string,
  newTime: string,
  newModality: AppointmentModality,
  requestedBy: 'client' | 'lawyer'
) {
  const appointment = await getAppointment(appointmentId);
  
  // Verificar disponibilidad del nuevo slot
  const slots = await getAvailableSlots(appointment.lawyerId, newDate, newModality);
  const target = slots.find(s => s.time === newTime);
  if (!target?.available) {
    return { ok: false, error: 'SLOT_NOT_AVAILABLE' };
  }

  // Actualizar cita
  await updateAppointment(appointmentId, {
    scheduledAt: combineDateAndTime(newDate, newTime),
    modality: newModality,
    status: 'rescheduled',
    rescheduleRequestedAt: new Date(),
    rescheduleRequestedBy: requestedBy,
  });

  // Notificar
  if (requestedBy === 'client') {
    await notifyLawyer(appointment.lawyerId, 'appointment.rescheduled_by_client', { ... });
  } else {
    await notifyClient(appointment.contactId, 'appointment.rescheduled_by_lawyer', { ... });
  }

  return { ok: true };
}
```

---

## 8. Prevención de accesos indebidos

Cada ruta del portal debe verificar que el contacto dueño del token es el mismo que el contacto del Deal:

```typescript
// Middleware para rutas del portal
async function verifyPortalAccess(token: string, dealId: string): Promise<Response | null> {
  const session = await validateMagicLink(token);
  if (!session.ok) {
    return Response.json({ error: 'Token inválido o expirado' }, { status: 401 });
  }

  const deal = await getDealFromTwenty(dealId);
  if (deal.contactId !== session.contactId) {
    // Intento de acceso a caso ajeno
    await auditLog.create({
      action: 'magic_link.unauthorized_access',
      actorId: session.contactId,
      resourceId: dealId,
      metadata: { reason: 'contact_mismatch' },
    });
    return Response.json({ error: 'No tienes acceso a este caso' }, { status: 403 });
  }

  return null; // Acceso permitido
}
```

---

## Progreso

- [ ] 1. Crear tablas magic_tokens y documentos_caso en schema.ts
- [ ] 2. Ejecutar migración Drizzle
- [ ] 3. Crear lib/magic-link.ts (generar, validar, reenviar)
- [ ] 4. Crear app/(public)/mi-caso/page.tsx (login via token)
- [ ] 5. Crear app/(public)/mi-caso/[dealId]/page.tsx (dashboard)
- [ ] 6. Crear páginas: documentos, presupuesto, citas
- [ ] 7. Crear API endpoints del portal (validate, documentos, presupuesto, citas)
- [ ] 8. Implementar subida de archivos con validación MIME + hash
- [ ] 9. Implementar cálculo de slots disponibles
- [ ] 10. Implementar soft lock de 5 min en selección de cita
- [ ] 11. Implementar reprogramación de citas
- [ ] 12. Implementar verificación de acceso (contactId match)
- [ ] 13. Implementar reenvío de magic link (pantalla expirado)
- [ ] 14. Probar flujo completo: generar link → validar → ver caso → subir doc


