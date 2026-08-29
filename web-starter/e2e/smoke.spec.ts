import { test, expect } from '@playwright/test';

test.describe('Smoke visual — flujo starter', () => {
  test('home carga con hero y FAQ', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.getByRole('heading', { name: /Alternativa gratuita a Figma/i })).toBeVisible();
    await expect(page.getByText('Preguntas frecuentes')).toBeVisible();
  });

  test('about carga segunda página', async ({ page }) => {
    await page.goto('/about');
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.getByRole('heading', { name: 'Nosotros' })).toBeVisible();
    await expect(page.getByText('De plantilla a web en minutos')).toBeVisible();
  });

  test('navegación entre páginas', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('banner').getByRole('link', { name: 'Nosotros' }).click();
    await expect(page).toHaveURL('/about');
    await page.getByRole('banner').getByRole('link', { name: 'Inicio' }).click();
    await expect(page).toHaveURL('/');
  });
});
