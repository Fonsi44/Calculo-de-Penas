# Roadmap de implementación — Plan maestro

> **Para:** Abogados y desarrollador
> **Propósito:** Guía cronológica para implementar el CRM completo. Ejecutar en orden.
> **Estimación total:** 18-25 horas de desarrollo + 1.5h del abogado (en paralelo)

---

## Instrucciones para el agente IA

1. Ejecuta este archivo en orden: Fase 0 → Fase 1 → Fase 2 → Fase 3 → Fase 4
2. Dentro de cada fase, completa los pasos en orden numérico
3. Cada paso referencia una guía detallada en docs/ (16-25)
4. Marca con [x] cada paso completado
5. Si un paso falla, detente y reporta el error antes de continuar
6. No saltar fases

---

## Fase 0: Prerrequisitos del abogado (paralelo al desarrollo)

> ⏱️ El abogado hace esto mientras el desarrollador avanza con Fase 1.
> No requiere conocimientos técnicos.

### docs/16 — WhatsApp Business en el teléfono del bufete

- [ ] 0.1 Descargar WhatsApp Business en el teléfono del bufete
- [ ] 0.2 Verificar número +34 661 911 574 con código SMS
- [ ] 0.3 Configurar perfil profesional (nombre, categoría, horario, dirección)
- [ ] 0.4 Poner logo del bufete como foto de perfil
- [ ] 0.5 Configurar mensaje de ausencia (fuera de horario)
- [ ] 0.6 Crear respuestas rápidas: /saludo, /direccion, /cita

### docs/17 — Meta Business + Token de WhatsApp

- [ ] 0.7 Crear cuenta en developers.facebook.com
- [ ] 0.8 Crear aplicación tipo "Negocio" → "Pineda y Asociados - CRM"
- [ ] 0.9 Agregar producto WhatsApp a la aplicación
- [ ] 0.10 Registrar número +34 661 911 574 (verificar por llamada)
- [ ] 0.11 Crear usuario del sistema (System User): "CRM Integration"
- [ ] 0.12 Generar token de acceso permanente (permiso: whatsapp_business_messaging)
- [ ] 0.13 Copiar token, ID del número, ID de cuenta comercial
- [ ] 0.14 Entregar token + IDs al desarrollador

### docs/18 — Resend (verificar dominio de correo)

- [ ] 0.15 Iniciar sesión en resend.com con alfonsroiget@gmail.com
- [ ] 0.16 Agregar dominio pinedayasocioshn.com
- [ ] 0.17 Agregar 3 registros DNS en el proveedor del dominio (MX, TXT, DKIM)
- [ ] 0.18 Verificar dominio en Resend (tocar "Verify")
- [ ] 0.19 Avisar al desarrollador que el dominio está verificado

### Entregables de Fase 0

Al completar esta fase, el abogado debe haber entregado al desarrollador:
- [ ] Token de acceso permanente (EAA...)
- [ ] ID del número de teléfono
- [ ] ID de la cuenta comercial
- [ ] Dominio de correo verificado en Resend

```
╔══════════════════════════════════════════════════════════════╗
║ FIN DE FASE 0                                               ║
║ Progreso: 0/19 (abogado) — puede continuar en paralelo      ║
╚══════════════════════════════════════════════════════════════╝
```

---

## Fase 1: Twenty CRM + Pipelines + Leads (8-10h)

> ⏱️ El desarrollador ejecuta esto. El abogado puede estar haciendo Fase 0 en paralelo.

### docs/19 — Instalar Twenty local con Docker

- [ ] 1.1 Verificar Docker Desktop + WSL2 funcionando
- [ ] 1.2 Crear directorio C:\Docker\twenty (fuera de OneDrive)
- [ ] 1.3 Descargar docker-compose.yml de Twenty GitHub
- [ ] 1.4 Descargar .env.example y crear .env
- [ ] 1.5 Generar ENCRYPTION_KEY con PowerShell
- [ ] 1.6 Ejecutar docker compose up -d
- [ ] 1.7 Verificar 4 servicios: server, worker, db, redis
- [ ] 1.8 Crear cuenta administradora en http://localhost:3000

### docs/20 — Pipelines, objetos y campos personalizados

- [ ] 1.9 Obtener API key de Twenty (Settings > API)
- [ ] 1.10 Crear objeto personalizado "Documento" con campos
- [ ] 1.11 Crear objeto personalizado "Cita" con campos
- [ ] 1.12 Crear objeto personalizado "LawyerAvailability" con campos
- [ ] 1.13 Agregar campos personalizados a Contact (leadSource, identityDocument, etc.)
- [ ] 1.14 Agregar campos personalizados a Deal (legalArea, procedureType, budgetStatus, etc.)
- [ ] 1.15 Crear pipeline "Captación" (6 etapas)
- [ ] 1.16 Crear pipeline "Caso Activo" (5 etapas)
- [ ] 1.17 Crear pipeline "Cerrados" (7 etapas de salida)

### Bridge API (Next.js)

- [ ] 1.18 Crear lib/twenty-client.ts (cliente HTTP para API de Twenty)
- [ ] 1.19 Crear app/api/twenty/webhook/route.ts (endpoint para recibir eventos)
- [ ] 1.20 Registrar webhook en Twenty (apuntar a localhost:3001/api/twenty/webhook)
- [ ] 1.21 Implementar pool de leads con optimistic locking (ETag)
- [ ] 1.22 Crear app/api/twenty/deals/assign/route.ts (asignación atómica)
- [ ] 1.23 Crear generador de número de caso LEX-YYYY-NNN
- [ ] 1.24 Actualizar /api/consulta para crear Contact + Deal en Twenty
- [ ] 1.24a Agregar variables TWENTY_API_URL y TWENTY_API_KEY a .env.local

```
╔══════════════════════════════════════════════════════════════╗
║ FIN DE FASE 1 — MVP FUNCIONAL (Fase 0 + 1 ≈ 10h)          ║
║ Progreso: 0/24 (desarrollador)                              ║
║                                                             ║
║ ✅ Twenty corriendo en localhost:3000                       ║
║ ✅ Leads de la web caen en Twenty automáticamente           ║
║ ✅ Pool de leads con asignación round-robin                ║
║ ✅ Números de caso automáticos LEX-YYYY-NNN                ║
║                                                             ║
║ Siguiente: Fase 2 (WhatsApp + notificaciones)               ║
╚══════════════════════════════════════════════════════════════╝
```

---

## Fase 2: WhatsApp API + Notificaciones (6-8h)

> ⏱️ Depende de: abogado completó Fase 0 (entregó token), desarrollador completó Fase 1

### docs/21 — WhatsApp Cloud API

- [ ] 2.1 Agregar variables WHATSAPP_* a .env.local
- [ ] 2.2 Crear app/api/whatsapp/route.ts (GET handshake + POST webhook)
- [ ] 2.3 Crear lib/whatsapp.ts (sendText, sendTemplate, sendButtons, sendDocument)
- [ ] 2.4 Crear lib/whatsapp-handler.ts (procesar mensajes entrantes)
- [ ] 2.5 Implementar normalización de teléfonos (+34)
- [ ] 2.6 Configurar webhook en Meta for Developers
- [ ] 2.7 Probar handshake con ngrok/cloudflared (túnel local)
- [ ] 2.8 Crear plantillas WhatsApp en WhatsApp Manager
- [ ] 2.9 Esperar aprobación de plantillas por Meta (24-48h)
- [ ] 2.10 Crear lib/whatsapp-retry.ts (reintentos + fallback email)
- [ ] 2.11 Crear lib/notification-service.ts (servicio central)
- [ ] 2.12 Probar flujo: mensaje entrante → crear lead → responder

```
╔══════════════════════════════════════════════════════════════╗
║ FIN DE FASE 2                                               ║
║ Progreso: 0/12                                              ║
║                                                             ║
║ ✅ WhatsApp conectado al CRM                                ║
║ ✅ Clientes reciben WhatsApp automáticos                    ║
║ ✅ Abogados ven conversaciones en dashboard                 ║
║                                                             ║
║ Siguiente: Fase 3 (Portal cliente + docs + citas)           ║
╚══════════════════════════════════════════════════════════════╝
```

---

## Fase 3: Portal Cliente + Documentos + Citas (6-8h)

> ⏱️ Depende de: Fases 1 y 2 completadas

### docs/22 — Magic Link + Portal

- [ ] 3.1 Crear tabla magic_tokens en schema.ts
- [ ] 3.2 Crear tabla documentos_caso en schema.ts
- [ ] 3.3 Ejecutar migración Drizzle
- [ ] 3.4 Crear lib/magic-link.ts (generar, validar, reenviar tokens)
- [ ] 3.5 Crear app/(public)/mi-caso/page.tsx (login via token)
- [ ] 3.6 Crear app/(public)/mi-caso/[dealId]/page.tsx (dashboard del caso)
- [ ] 3.7 Crear página de documentos (ver docs + subir)
- [ ] 3.8 Crear página de presupuesto (ver + aceptar/rechazar)
- [ ] 3.9 Crear página de citas (ver + agendar/reprogramar)
- [ ] 3.10 Crear API endpoints del portal (validate, documentos, presupuesto, citas)
- [ ] 3.11 Implementar subida de archivos con validación MIME + SHA-256
- [ ] 3.12 Implementar cálculo de slots disponibles
- [ ] 3.13 Implementar soft lock 5min en selección de cita
- [ ] 3.14 Implementar verificación de acceso (contactId match)
- [ ] 3.15 Implementar reenvío de magic link (pantalla expirado)

### docs/23 — Automatizaciones

- [ ] 3.16 Crear lib/notification-service.ts (servicio central)
- [ ] 3.17 Implementar notificaciones Captación (A1-A8)
- [ ] 3.18 Implementar notificaciones Caso Activo (B1-B6)
- [ ] 3.19 Implementar notificaciones Documentos (C1-C6)
- [ ] 3.20 Implementar notificaciones Citas (D1-D4)
- [ ] 3.21 Implementar notificaciones Seguridad (E1-E4)
- [ ] 3.22 Crear lib/twenty-handlers.ts (deal.created, deal.updated, document.updated)
- [ ] 3.23 Crear app/api/cron/reminders/route.ts (recordatorios automáticos)
- [ ] 3.24 Implementar escalamiento en 4 niveles

### docs/24 — Documentos por área

- [ ] 3.25 Crear data/documentos-por-area.ts
- [ ] 3.26 Agregar documentos de Derecho de Familia
- [ ] 3.27 Agregar documentos de Derecho Laboral
- [ ] 3.28 Agregar documentos de Derecho Penal
- [ ] 3.29 Agregar documentos de Derecho Civil/Notarial
- [ ] 3.30 Crear API endpoint GET /api/twenty/documentos?area=

```
╔══════════════════════════════════════════════════════════════╗
║ FIN DE FASE 3                                               ║
║ Progreso: 0/30                                              ║
║                                                             ║
║ ✅ Cliente accede por magic link                            ║
║ ✅ Sube documentos, acepta presupuestos                     ║
║ ✅ Agenda citas desde el portal                             ║
║ ✅ Automatizaciones completas operando                      ║
║                                                             ║
║ Siguiente: Fase 4 (Mejoras finales + puesta en marcha)      ║
╚══════════════════════════════════════════════════════════════╝
```

---

## Fase 4: Mejoras finales + puesta en marcha (3-5h)

> ⏱️ Todo funciona en local (sin VPS, sin Clouding, sin SAR, sin multi-bufete)

### docs/25 — Seguridad

- [ ] 4.1 Crear tabla activity_log en schema.ts + migración
- [ ] 4.2 Implementar logActivity() en todas las acciones del CRM
- [ ] 4.3 Configurar purga automática de logs (1 año)
- [ ] 4.4 Configurar roles en Twenty (admin, lawyer, assistant)
- [ ] 4.5 Verificar verificación de acceso en portal cliente
- [ ] 4.6 Configurar rate limiting en endpoints sensibles
- [ ] 4.7 Verificar TLS 1.3 y HSTS en desarrollo
- [ ] 4.8 Configurar backup diario de BD (script PowerShell)

### docs/20 — Pipeline transitions (rellenar reglas faltantes)

- [ ] 4.9 Completar reglas de transición para todas las etapas
- [ ] 4.10 Probar validaciones por etapa (legalArea requerida, etc.)

### docs/21 — Templates WhatsApp finales

- [ ] 4.11 Verificar que todas las plantillas están aprobadas por Meta
- [ ] 4.12 Probar envío de cada plantilla

### docs/22 — Portal final

- [ ] 4.13 Probar flujo completo: generar link → validar → ver caso → subir doc
- [ ] 4.14 Probar reprogramación de cita
- [ ] 4.15 Probar expiración y reenvío de magic link

```
╔══════════════════════════════════════════════════════════════╗
║ CRM COMPLETAMENTE OPERATIVO EN LOCAL                        ║
║                                                             ║
║ Progreso total: 0/19 + 24 + 12 + 30 + 15 = 100 pasos       ║
║                                                             ║
║ 🎉 SISTEMA LISTO PARA USO DIARIO 🎉                        ║
║                                                             ║
║ Próximo paso (post-Fase 4, no implementado aún):            ║
║ - Deploy a VPS (Clouding.io ~8€/mes)                        ║
║ - Dominio localhost:3000                          ║
║ - Facturación electrónica SAR (Fase 4+)                     ║
║ - Multi-bufete (Fase 4+)                                    ║
╚══════════════════════════════════════════════════════════════╝
```

---

## Resumen de tiempo y progreso

| Fase | Desarrollo | Abogado (paralelo) | Pasos | Completado |
|---|---|---|---|---|
| Fase 0 | — | ~1.5h | 19 | ○ |
| Fase 1 | 8-10h | — | 24 | ○ |
| Fase 2 | 6-8h | — | 12 | ○ |
| Fase 3 | 6-8h | — | 30 | ○ |
| Fase 4 | 3-5h | — | 15 | ○ |
| **Total** | **23-31h** | **1.5h** | **100** | **0%** |

> Los tiempos del abogado (Fase 0) se hacen en paralelo al desarrollo de Fase 1.
> Tiempo real hasta MVP funcional (Fase 0 + Fase 1): ~10h.




