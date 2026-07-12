/**
 * E2E Navigation — Web pública, SGIE y Admin en escritorio y móvil.
 *
 * @navigation
 *
 * Verifica navegación básica, carga de páginas clave y responsive.
 * NO verifica funcionalidad interna (eso es @critical).
 */
import { test, expect } from '@playwright/test';

test.describe('@navigation Navegación web pública', () => {
  const publicPages = [
    '/',
    '/blog',
    '/servicios-juridicos',
    '/derecho-penal',
    '/preguntas-frecuentes',
    '/despacho',
    '/solicitar-consulta',
    '/como-llegar',
    '/terminos',
    '/aviso-legal',
    '/politica-privacidad',
  ];

  for (const path of publicPages) {
    test(`Carga ${path} (HTTP 200)`, async ({ page }) => {
      const res = await page.goto(path);
      expect(res?.status()).toBe(200);
      // Verificar que no redirige a login
      await expect(page).not.toHaveURL(/\/intranet\/login/);
    });
  }

  test('Blog post individual carga correctamente', async ({ page }) => {
    // Buscar primer post del blog (puede variar, verificamos que la página no de 404)
    const res = await page.goto('/blog');
    expect(res?.status()).toBe(200);
    // Hacer clic en el primer enlace de post
    const firstPost = page.locator('a[href^="/blog/"]').first();
    if (await firstPost.isVisible()) {
      await firstPost.click();
      await expect(page).not.toHaveURL('/blog');
      // No debe ser 404
      await expect(page.locator('h1')).toBeVisible();
    }
  });
});

test.describe('@navigation Navegación intranet', () => {
  test('Login page carga correctamente', async ({ page }) => {
    const res = await page.goto('/intranet/login');
    expect(res?.status()).toBe(200);
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
  });

  test('Sin sesión, SGIE redirige a login', async ({ page }) => {
    await page.goto('/intranet/sgie');
    await page.waitForURL('**/intranet/login**', { timeout: 10000 });
  });

  test('Sin sesión, Admin redirige a login', async ({ page }) => {
    await page.goto('/intranet/admin');
    await page.waitForURL('**/intranet/login**', { timeout: 10000 });
  });
});
