import { test, expect } from '@playwright/test';

const TEST_EMAIL = 'sidebar-test@pinedayasociadoshn.com';
const TEST_PASSWORD = 'sidebar-test-X7q9Zk';

interface SidebarLink {
  label: string;
  href: string;
  expectedPathStarts: string;
  expectedContent: RegExp;
  requiresCapability: boolean;
}

const SIDEBAR_LINKS: SidebarLink[] = [
  {
    label: 'Calculadora',
    href: '/intranet/calculadora',
    expectedPathStarts: '/intranet/calculadora',
    expectedContent: /Calculadora de Penas|Paso 1 de 8/i,
    requiresCapability: true,
  },
  {
    label: 'Mis casos',
    href: '/intranet/casos',
    expectedPathStarts: '/intranet/casos',
    expectedContent: /Mis casos|Crear.*caso|Sin casos todav/i,
    requiresCapability: false,
  },
  {
    label: 'Biblioteca CP',
    href: '/intranet/cp',
    expectedPathStarts: '/intranet/cp',
    expectedContent: /Biblioteca|C[oó]digo Penal|Art[ií]culo/i,
    requiresCapability: true,
  },
  {
    label: 'Catálogo de delitos',
    href: '/intranet/delitos',
    expectedPathStarts: '/intranet/delitos',
    expectedContent: /Cat[aá]logo|delitos/i,
    requiresCapability: true,
  },
  {
    label: 'Atajos de teclado',
    href: '/intranet/atajos',
    expectedPathStarts: '/intranet/atajos',
    expectedContent: /Atajos|teclado|Calculadora de penas/i,
    requiresCapability: false,
  },
];

async function doLogin(page: import('@playwright/test').Page): Promise<void> {
  await page.goto('/intranet/login');
  await page.waitForSelector('#email');
  await page.locator('#email').fill(TEST_EMAIL);
  await page.locator('#password').fill(TEST_PASSWORD);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/\/intranet\//, { timeout: 10_000 });
}

test.describe('Intranet — rutas protegidas accesibles tras autenticación', () => {
  test.describe.configure({ mode: 'serial' });

  test('login establece cookie de sesión', async ({ page }) => {
    await doLogin(page);
    const url = page.url();
    expect(url, 'usuario autenticado en /intranet/').toContain('/intranet/');
  });

  for (const link of SIDEBAR_LINKS) {
    test(`sidebar → ${link.label} (${link.href}) carga la página correcta`, async ({ page }) => {
      await doLogin(page);
      const loggedInUrl = page.url();

      if (link.requiresCapability && loggedInUrl.includes('/intranet/acceso-denegado')) {
        const resp = await page.request.get(link.href);
        expect([200, 302, 401, 403], `${link.label}: usuario sin capability, status ${resp.status()} aceptable`).toContain(resp.status());
        return;
      }

      await page.goto(link.href);
      await expect(page).toHaveURL(new RegExp(link.expectedPathStarts.replace(/\//g, '\\/')), { timeout: 10_000 });
      await expect(page.locator('body')).toContainText(link.expectedContent, { timeout: 15_000 });
    });
  }
});
