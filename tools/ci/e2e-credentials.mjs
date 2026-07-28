#!/usr/bin/env node
/**
 * Credenciales sintéticas E2E — fuente única de contraseñas para staging.
 *
 * Estas contraseñas:
 * - Son exclusivas del entorno E2E staging aislado (branch Neon no producción).
 * - No autentican contra ningún servicio real.
 * - Solo funcionan en la base de datos e2e_pr20 (branch e2e-staging-pr20).
 * - Se hashean con bcrypt cost 12 antes de insertarse.
 * - Se exponen a los specs via E2E_* env vars (el runner las exporta).
 *
 * Este módulo es consumido por:
 *   - tools/ci/seed-e2e.mjs  (para hashear e insertar en DB)
 *   - tools/ci/run-e2e-staging.mjs  (para exportar E2E_* env vars a Playwright)
 *
 * NO importar desde tests ni código de producción.
 */
export const E2E_PASSWORDS = {
  admin:            'TestAdmin123!',
  lawyerA:          'TestAbogadoA123!',
  lawyerB:          'TestAbogadoB123!',
  twoFactorUser:    'Test2FA123!',
  authUser:         'e2e-test-password-X7q9Zk',
  sidebarUser:      'sidebar-test-X7q9Zk',
  unauthorizedUser: 'TestUnauthorized123!',
};

/**
 * TOTP secret para twoFactorUser. Es el secret de test de RFC 6238
 * (base32 "JBSWY3DPEHPK3PXP" → hex "48656c6c6f21" = "Hello!"), no
 * una clave real de 2FA.
 */
export const E2E_TOTP_SECRET_BASE32 = 'JBSWY3DPEHPK3PXP';
