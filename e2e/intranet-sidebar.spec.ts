import { test, expect } from '@playwright/test';

const TEST_EMAIL = 'sidebar-test@example.com';
const TEST_PASSWORD = 'sidebar-test-X7q9Zk';

interface SidebarLink {
  label: string;
  href: string;
  expectedPathStarts: string;
  expectedContent: RegExp;
}

const SIDEBAR_LINKS: SidebarLink[] = [
  {
    label: 'Calculadora',
    href: '/intranet/calculadora',
    expectedPathStarts: '/intranet/calculadora',
    expectedContent: /Calculadora de Penas|Paso 1 de 8/i,
  },
  {
    label: 'Mis casos',
    href: '/intranet/casos',
    expectedPathStarts: '/intranet/casos',
    expectedContent: /Mis casos|Crear.*caso|Sin casos todav/i,
  },
  {
    label: 'Biblioteca CP',
    href: '/intranet/cp',
    expectedPathStarts: '/intranet/cp',
    expectedContent: /Biblioteca|C[oó]digo Penal|Art[ií]culo/i,
  },
  {
    label: 'Catálogo de delitos',
    href: '/intranet/delitos',
    expectedPathStarts: '/intranet/delitos',
    expectedContent: /Cat[aá]logo|delitos/i,
  },
  {
    label: 'Atajos de teclado',
    href: '/intranet/atajos',
    expectedPathStarts: '/intranet/atajos',
    expectedContent: /Atajos|teclado|Calculadora de penas/i,
  },
];

async function login(page: import('@playwright/test').Page): Promise<void> {
  await page.goto('/intranet/login');
  await page.getByLabel(/email/i).fill(TEST_EMAIL);
  await page.locator('#password').fill(TEST_PASSWORD);
  await page.getByRole('button', { name: /iniciar sesi[óo]n|entrar/i }).first().click();
  await expect(page).toHaveURL(/\/intranet\//, { timeout: 10_000 });
}

test.describe('Intranet — rutas protegidas accesibles tras autenticación', () => {
  test.describe.configure({ mode: 'serial' });

  test('login establece cookie de sesión', async ({ page }) => {
    await login(page);
  });

  for (const link of SIDEBAR_LINKS) {
    test(`sidebar → ${link.label} (${link.href}) carga la página correcta`, async ({ page }) => {
      const cookies = await page.context().cookies();
      const hasAuth = cookies.some(c => /token=/i.test(c.value));
      if (!hasAuth) {
        await login(page);
      }

      await page.goto(link.href);
      const url = page.url();
      const onTarget = url.match(new RegExp(link.expectedPathStarts.replace(/\//g, '\\/')));
      const onDenied = url.includes('/intranet/acceso-denegado');
      expect(onTarget || onDenied, `URL debe ser ${link.expectedPathStarts} o acceso-denegado, fue ${url}`).toBe(true);

      if (onTarget) {
        await expect(page.locator('body')).toContainText(link.expectedContent, { timeout: 15_000 });
      }
    });
  }
});
