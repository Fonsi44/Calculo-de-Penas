# Plan de acción priorizado

## Criterio

Prioridad = impacto × explotabilidad × frecuencia × alcance, ajustado por esfuerzo y dependencias. Ninguna acción de este documento fue implementada durante la auditoría.

## Acciones inmediatas — 0 a 72 horas

| ID | Acción | Severidad origen | Esfuerzo | Dependencias | Riesgo del cambio | Criterio de aceptación |
|---|---|---:|---:|---|---|---|
| P0-01 | Rotar las dos contraseñas usadas en auditoría, únicas por cuenta; revocar sesiones | Alta | 1–2 h | Admin operativo | Bloqueo si no se coordina | `PENDIENTE OPERATIVO`: runbook creado, credenciales no cambiadas desde repositorio |
| P0-02 | Separar challenge 2FA de token de sesión | Crítica | 1–2 d | Auth + tests + despliegue coordinado | Alto | `IMPLEMENTADO`; pendiente aplicar migración y validación staging |
| P0-03 | Corregir scope de cliente en SELECT y UPDATE | Alta | 1 d | DB test aislada | Medio | `IMPLEMENTADO`; pendiente prueba de integración con DB aislada |
| P0-04 | Desactivar temporalmente 2FA opt-in si no puede desplegarse P0-02 de inmediato | Crítica | 1 h | Decisión de riesgo | Medio | no se ofrece falsa garantía; plan y ventana de remediación documentados |
| P0-05 | Mitigar preview: exigir sesión y sanitizar HTML; dejar de incluir body en URL | Alta | 1–2 d | almacenamiento efímero/DB | Medio | URL opaca, no contiene payload, XSS test bloqueado, noindex/no-store |
| P0-06 | Reautorizar Google OAuth para GSC/GA4 | Media | 30–60 min | Propietario Google | Bajo | `seo:collect` 6/6 y timestamp actual |

## Corto plazo — 1 a 2 semanas

| ID | Acción | Esfuerzo | Dependencias | Riesgo | Criterio de aceptación |
|---|---:|---:|---|---|---|
| P1-01 | Implementar página canónica de recuperación y confirmar token | 2–3 d | UX, email, auth | Medio | enlace de email resuelve 200; token válido/expirado/usado cubierto E2E |
| P1-02 | Convertir `/api/descargar` a POST protegido y PDF cacheado | 1–2 d | frontend público (SEO visual no requerido) | Bajo | GET sin side effect; rate limit/CAPTCHA; PII no aparece en URL |
| P1-03 | Actualizar dependencias altas explotables | 2–4 d | rama dedicada, lockfile | Medio-Alto | `npm audit`: 0 altas aplicables al runtime o excepción documentada |
| P1-04 | Eliminar logs PII y normalizar errores 500 | 1 d | observabilidad | Bajo | tests prueban respuesta neutra; logs contienen ID, no email/body |
| P1-05 | Servir documentos privados mediante proxy/URL firmada temporal | 2–4 d | Vercel Blob | Medio | acceso fuera de scope 404/403; URL expira; preview funciona en navegador |
| P1-06 | Aislar E2E en DB efímera con guard de seguridad | 2–3 d | Neon preview/local Postgres | Medio | suite se niega ante DB no-test y limpia todos los fixtures |
| P1-07 | Añadir tests de auth/role/object matrix | 3–5 d | P0-02/P0-03 | Bajo | cobertura de auth/proxy/scope >80 % líneas y ramas críticas |

## Medio plazo — 3 a 8 semanas

| ID | Acción | Esfuerzo | Dependencias | Criterio de aceptación |
|---|---:|---:|---|---|
| P2-01 | Separar dependencias de tooling/MCP del runtime web | 3–5 d | CI/deploy | bundle/runtime no instala servidores MCP innecesarios |
| P2-02 | Eliminar endpoint demo MCP y `verboseLogs` | 0,5 d | inventario consumidores | ruta deja 404 o se mueve a entorno interno |
| P2-03 | Clave dedicada y versionada para cifrado 2FA | 2–4 d | KMS/env + migración | rotación JWT no invalida TOTP; migración/recovery probado |
| P2-04 | Presupuesto de rendimiento y bundle en CI | 2–3 d | Lighthouse/analizador | límites por JS/LCP/INP y reporte por PR |
| P2-05 | Implementar rediseño SGIE por iteraciones | 3–6 sem | investigación usuarios | tareas críticas completan con menos pasos y WCAG 2.2 AA |
| P2-06 | Simplificar Admin y permisos granulares | 3–6 sem | roles/IA | dashboard por excepciones, módulos por capacidad, pruebas de rol |

## Largo plazo — 2 a 6 meses

| ID | Acción | Esfuerzo | Dependencias | Criterio de aceptación |
|---|---:|---:|---|---|
| P3-01 | Runbook DR Neon+Blob+secrets y restore trimestral | 1–2 sem + ejercicios | Operaciones | RPO/RTO aprobados y restore con evidencia |
| P3-02 | Observabilidad SLO/alertas y trazas de flujo | 2–4 sem | proveedor | alertas por auth, jobs, correo, OCR, SEO freshness y errores |
| P3-03 | Threat modeling anual y pentest autorizado | 1–2 sem | remediaciones previas | informe independiente sin críticas/altas abiertas |
| P3-04 | Gobernanza de datos/retención PII | 2–4 sem | legal/operaciones | inventario, minimización, retención y borrado auditado |

## Diez prioridades principales

1. Corregir bypass de 2FA.
2. Corregir IDOR/BOLA de clientes.
3. Rotar credenciales y revocar sesiones.
4. Retirar payload y XSS del preview.
5. Reparar recuperación de contraseña.
6. Remediar dependencias altas aplicables.
7. Hacer privada y mediada la descarga/preview documental.
8. Aislar E2E de producción y automatizar cleanup.
9. Reautorizar GSC/GA4 y alertar por frescura.
10. Probar restore y formalizar RPO/RTO.

## Secuencia recomendada de entrega

Cada cambio lógico debe ir en un commit atómico en español. Para P0-02 y P0-03: test de regresión primero, implementación mínima, lint/typecheck/test/build, prueba en staging con cuentas separadas, revisión de seguridad y despliegue con rollback. El rediseño no debe comenzar hasta cerrar P0/P1 de seguridad para evitar consolidar flujos inseguros.
