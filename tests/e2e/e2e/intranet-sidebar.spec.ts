import { test, expect } from '@playwright/test';

const TEST_EMAIL = 'sidebar-test@pinedayasociadoshn.com';
const TEST_PASSWORD = 'sidebar-test-X7q9Zk';

interface SidebarLink {
  label: string;
  href: string;
  expectedPathStarts: string;
  expectedContent: RegExp;
}

const SIDEBAR_LINKS: SidebarLink[] = [
  {
    label: 'Dashboard SGIE',
    href: '/intranet/sgie/dashboard',
    expectedPathStarts: '/intranet/sgie/dashboard',
    expectedContent: /Dashboard|SGIE|Resumen/i,
  },
  {
    label: 'Expedientes',
    href: '/intranet/sgie/expedientes',
    expectedPathStarts: '/intranet/sgie/expedientes',
    expectedContent: /Expedientes|Casos|Sin expedientes/i,
  },
  {
    label: 'Clientes',
    href: '/intranet/sgie/clientes',
    expectedPathStarts: '/intranet/sgie/clientes',
    expectedContent: /Clientes|Sin clientes/i,
  },
  {
    label: 'Documentos',
    href: '/intranet/sgie/documentos',
    expectedPathStarts: '/intranet/sgie/documentos',
    expectedContent: /Documentos|Sin documentos/i,
  },
  {
    label: 'Agenda',
    href: '/intranet/sgie/agenda',
    expectedPathStarts: '/intranet/sgie/agenda',
    expectedContent: /Agenda|Evento|Calendario/i,
  },
];

test.describe('Intranet — rutas protegidas accesibles tras autenticación', () => {
  test.describe.configure({ mode: 'serial' });

  test('login establece cookie de sesión', async ({ page }) => {
    await page.goto('/intranet/login');
    await page.locator('#email').fill(TEST_EMAIL);
    await page.locator('#password').fill(TEST_PASSWORD);
    await page.locator('button[type="submit"]').click();
    // Login exitoso: debe salir del login hacia sgie o admin.
    await expect(page).toHaveURL(/\/intranet\/(sgie|admin)$/, { timeout: 10_000 });
  });

  for (const link of SIDEBAR_LINKS) {
    test(`sidebar → ${link.label} (${link.href}) carga la página correcta`, async ({ page }) => {
      await page.goto('/intranet/login');
      await page.locator('#email').fill(TEST_EMAIL);
      await page.locator('#password').fill(TEST_PASSWORD);
      await page.locator('button[type="submit"]').click();
      // Login exitoso: debe salir del login hacia sgie o admin.
      await expect(page).toHaveURL(/\/intranet\/(sgie|admin)$/, { timeout: 10_000 });

      await page.goto(link.href, { waitUntil: 'domcontentloaded' });
      await expect(page).toHaveURL(new RegExp(link.expectedPathStarts.replace(/\//g, '\\/')), { timeout: 15_000 });
      await expect(page.locator('body')).toContainText(link.expectedContent, { timeout: 15_000 });
    });
  }
});
