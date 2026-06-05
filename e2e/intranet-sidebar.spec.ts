import { test, expect } from '@playwright/test';

const TEST_EMAIL = `sidebar-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@test.local`;
const TEST_PASSWORD = 'sidebar-test-X7q9Zk';
const TEST_NAME = 'Sidebar Test User';

interface SidebarLink {
  label: string;
  href: string;
  /** URL final tras pasar por rewrites (calculadora, casos, etc.) o canónica (intranet) */
  expectedPathStarts: string;
  /** Texto único esperado en la página destino para confirmar que carga el módulo correcto */
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

test.describe('Intranet — sidebar navega a cada página correctamente', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async ({ request }) => {
    const res = await request.post('/api/auth/register', {
      data: { email: TEST_EMAIL, password: TEST_PASSWORD, nombre: TEST_NAME },
    });
    expect([200, 409], 'registro del usuario de prueba').toContain(res.status());
  });

  test('login establece cookie de sesión', async ({ page }) => {
    await page.goto('/intranet/login');
    await page.getByLabel(/email/i).fill(TEST_EMAIL);
    await page.locator('#password').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /iniciar sesi[óo]n|entrar/i }).first().click();
    await expect(page).toHaveURL(/\/intranet\/dashboard$/, { timeout: 10_000 });
  });

  for (const link of SIDEBAR_LINKS) {
    test(`sidebar → ${link.label} (${link.href}) carga la página correcta`, async ({ page }) => {
      // Re-login si la cookie se perdió entre tests
      const cookies = await page.context().cookies();
      const hasAuth = cookies.some(c => /token=/i.test(c.value));
      if (!hasAuth) {
        await page.goto('/intranet/login');
        await page.getByLabel(/email/i).fill(TEST_EMAIL);
        await page.locator('#password').fill(TEST_PASSWORD);
        await page.getByRole('button', { name: /iniciar sesi[óo]n|entrar/i }).first().click();
        await expect(page).toHaveURL(/\/intranet\/dashboard$/, { timeout: 10_000 });
      }

      // Click directo en el link del sidebar (es el selector canónico)
      const sidebarLink = page.getByRole('link', { name: new RegExp(`^${link.label}$`) });
      await expect(sidebarLink, `link "${link.label}" debe existir en el sidebar`).toBeVisible();
      await sidebarLink.click();

      // Espera a que la URL cambie al destino esperado (no anclar al inicio:
      // la URL completa incluye "http://host:puerto/...").
      await expect(page).toHaveURL(new RegExp(link.expectedPathStarts.replace(/\//g, '\\/')), { timeout: 15_000 });

      // Espera a que la red se calme para evitar flakiness
      await page.waitForLoadState('networkidle', { timeout: 15_000 });

      // Verifica que la página destino cargó el contenido del módulo correcto
      const bodyText = await page.locator('body').innerText();
      expect(bodyText, `página "${link.label}" debe mostrar contenido esperado`).toMatch(link.expectedContent);
    });
  }
});
