/**
 * E2E Navigation — Web pública en escritorio y móvil.
 *
 * @navigation
 *
 * Verifica navegación básica, carga de páginas clave y responsive.
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
    });
  }

  test('Blog post individual carga correctamente', async ({ page }) => {
    const res = await page.goto('/blog');
    expect(res?.status()).toBe(200);
    const rejectOptionalCookies = page.getByRole('button', { name: 'Rechazar opcionales' });
    if (await rejectOptionalCookies.isVisible()) {
      await rejectOptionalCookies.click();
    }
    const firstPost = page.locator('a[href^="/blog/"]:not([href$="/feed.xml"]):not([href*="/category/"])').first();
    if (await firstPost.isVisible()) {
      await firstPost.click();
      await expect(page).not.toHaveURL('/blog');
      await expect(page.locator('h1')).toBeVisible();
    }
  });
});

test.describe('@navigation Rutas internas retiradas', () => {
  test('Intranet responde 404', async ({ page }) => {
    const res = await page.goto('/intranet/login');
    expect(res?.status()).toBe(404);
  });

  test('Admin responde 404', async ({ page }) => {
    const res = await page.goto('/admin');
    expect(res?.status()).toBe(404);
  });
});
