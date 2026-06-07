import { chromium } from 'playwright';

const WAIT = 5000;

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  const browser = await chromium.launch({ headless: false, args: ['--start-maximized'] });
  const context = await browser.newContext({ viewport: null });
  const page = await context.newPage();

  console.log('\n═══════════════════════════════════════════');
  console.log('  META BUSINESS — ASISTENTE DE CONFIGURACION');
  console.log('═══════════════════════════════════════════\n');

  // A1: Ir a Meta for Developers
  console.log('PASO A1 — REGISTRO EN META FOR DEVELOPERS');
  console.log('URL: https://developers.facebook.com\n');
  await page.goto('https://developers.facebook.com', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);

  const loginBtn = page.getByRole('button', { name: /empezar|comenzar|login|iniciar sesion/i }).first();

  if (await loginBtn.isVisible().catch(() => false)) {
    console.log('No estas logueado en Meta.');
    console.log('Por favor, inicia sesion en la ventana del navegador.');
    console.log('Correo: alfonsroiget@gmail.com');
    console.log('Esperando login (max 5 minutos)...');
    try {
      await page.waitForURL('**/docs/**', { timeout: 300000 });
    } catch {
      console.log('Continuando manualmente...');
    }
    console.log('Login detectado. Continuando...\n');
  }

  // Abrir guia WhatsApp Cloud API
  console.log('PASO A2 — GUIAS WHATSAPP CLOUD API');
  await page.goto('https://developers.facebook.com/docs/whatsapp/cloud-api/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'docs/meta-step-01-docs.png', fullPage: true });
  console.log('Captura: docs/meta-step-01-docs.png\n');

  // Ir a Mis Aplicaciones
  console.log('PASO A3 — CREAR APLICACION');
  await page.goto('https://developers.facebook.com/apps/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  const createBtn = page.getByRole('button', { name: /crear aplicacion/i }).first();
  if (await createBtn.isVisible().catch(() => false)) {
    console.log('Boton "Crear aplicacion" visible.');
  }
  await page.screenshot({ path: 'docs/meta-step-02-my-apps.png', fullPage: true });
  console.log('Captura: docs/meta-step-02-my-apps.png');
  console.log('Haz clic en "Crear aplicacion" si es necesario.\n');

  // WhatsApp Manager
  console.log('PASO A4 — WHATSAPP MANAGER');
  console.log('URL: https://business.facebook.com/wa/manager');
  await page.goto('https://business.facebook.com/wa/manager', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'docs/meta-step-03-wa-manager.png', fullPage: true });
  console.log('Captura: docs/meta-step-03-wa-manager.png\n');

  // System Users
  console.log('PASO A5 — SYSTEM USER + TOKEN');
  console.log('Guia: https://developers.facebook.com/docs/facebook-login/access-tokens');
  console.log('Navegando a Business Settings > System Users...');
  await page.goto('https://business.facebook.com/settings/system-users', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'docs/meta-step-04-system-user.png', fullPage: true });
  console.log('Captura: docs/meta-step-04-system-user.png\n');

  console.log('=== PROCESO COMPLETADO ===');
  console.log('Capturas guardadas en docs/');
  console.log('Datos para anotar en .env.local:');
  console.log('  WHATSAPP_ACCESS_TOKEN=<token_de_system_user>');
  console.log('  WHATSAPP_PHONE_NUMBER_ID=<ID_del_numero>');
  console.log('  WHATSAPP_BUSINESS_ACCOUNT_ID=<ID_cuenta_comercial>');
  console.log('  WHATSAPP_VERIFY_TOKEN=<tu_verify_token>');

  await browser.close();
}

main().catch(err => { console.error('Error:', err); process.exit(1); });
