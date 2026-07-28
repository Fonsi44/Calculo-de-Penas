---
status: current
owner: engineering
created: 2026-07-28
last_reviewed: 2026-07-28
review_due: 2026-10-28
supersedes: null
superseded_by: null
---
# Runbook — rotación de credenciales y sesiones (Fase 1)

## Antes del despliegue

1. Configurar `ENCRYPTION_KEY` aleatoria de al menos 32 caracteres en producción.
2. Conservar temporalmente la clave previa en `ENCRYPTION_KEY_PREVIOUS` solo si existen secretos TOTP cifrados antes de la Fase 1.
3. Aplicar la migración `0030_security_sessions_2fa.sql` en staging y verificar login, 2FA y cambio de contraseña.
4. Desplegar la aplicación y confirmar que el healthcheck y login normal responden.

## Rotación inmediata de cuentas auditadas

1. Un administrador cambia cada contraseña por una única, aleatoria y de al menos 14 caracteres.
2. El cambio incrementa `token_version`, por lo que sesiones previas quedan inválidas al comprobar `/api/auth/me`; solicitar cierre e inicio de sesión de todos los dispositivos.
3. Revisar los eventos de autenticación recientes y bloquear temporalmente cualquier cuenta con actividad anómala.
4. Activar 2FA únicamente después de comprobar que el challenge de cinco minutos funciona y no puede usarse como cookie.

## Rotación de ENCRYPTION_KEY

1. Añadir la clave nueva como `ENCRYPTION_KEY` y mover la anterior a `ENCRYPTION_KEY_PREVIOUS`.
2. Verificar el acceso TOTP de una cuenta de prueba y reenrolar de forma controlada los secretos que aún usen la clave antigua.
3. Cuando todos estén migrados o reenrolados, retirar `ENCRYPTION_KEY_PREVIOUS`.
4. Nunca registrar, copiar en tickets ni compartir secretos, TOTP, recovery codes o valores de variables.

## Reversión

Si hay fallo de descifrado, restaurar temporalmente la clave anterior como `ENCRYPTION_KEY`, no como `JWT_SECRET`, y detener nuevos enrolamientos hasta investigar. No revertir la separación de propósito de JWT ni reactivar challenges antiguos.
