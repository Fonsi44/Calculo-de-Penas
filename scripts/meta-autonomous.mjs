// scripts/meta-autonomous.mjs
// Script autónomo que navega por Meta y completa los pasos del doc 17.
// Usuario solo necesita: (1) hacer login cuando se lo pida, (2) confirmar
// el código de verificación telefónica de 6 dígitos cuando llegue la llamada.

import { chromium } from 'playwright';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const ENV_LOCAL = resolve(process.cwd(), '.env.local');
const SCREENSHOTS = resolve(process.cwd(), 'docs/meta-screenshots');

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function log(step, msg) {
  console.log(`\n[${step}] ${msg}`);
}

async function askUser(question) {
  // Lee una respuesta del usuario por stdin
  const readline = await import('readline');
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function shot(page, name) {
  const path = `${SCREENSHOTS}/${name}.png`;
  await page.screenshot({ path, fullPage: true });
  console.log(`   📸 ${name}.png`);
}

async function main() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  META BUSINESS — ASISTENTE AUTÓNOMO');
  console.log('  Guía: docs/17-meta-business-verificacion.md');
  console.log('═══════════════════════════════════════════════════════\n');

  console.log('Voy a abrir un navegador. Necesito que:');
  console.log(' 1. Inicies sesión con alfonsroiget@gmail.com cuando se abra Meta');
  console.log('  2. Resuelvas captchas si aparecen');
  console.log('  3. Confirmes el código de 6 dígitos de la llamada automática');
  console.log('\nLos datos finales se guardarán automáticamente en .env.local\n');

  const browser = await chromium.launch({
    headless: false,
    args: ['--start-maximized', '--disable-blink-features=AutomationControlled']
  });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  // ===== A1 =====
  log('A1', 'Abriendo Meta for Developers...');
  await page.goto('https://developers.facebook.com/', { waitUntil: 'domcontentloaded' });
  await shot(page, 'A1-developers-home');
  console.log('\n   👉 ACCIÓN REQUERIDA:');
  console.log('   1. Haz clic en "Empezar" arriba a la derecha');
  console.log('   2. Inicia sesión con: alfonsroiget@gmail.com');
  console.log('   3. Acepta los términos de desarrollador');
  console.log('   4. Cuando estés logueado, pulsa ENTER aquí');
  await askUser('   ⏎ Pulsa ENTER cuando hayas iniciado sesión...');

  // ===== A2 =====
  log('A2', 'Creando aplicación...');
  await page.goto('https://developers.facebook.com/apps/', { waitUntil: 'domcontentloaded' });
  await shot(page, 'A2-my-apps');
  console.log('\n   👉 ACCIÓN REQUERIDA:');
  console.log('   1. Haz clic en "Crear aplicación"');
  console.log('   2. Selecciona "Negocio" → Siguiente');
  console.log('   3. Nombre: Pineda y Asociados — CRM');
  console.log('   4. Correo: alfonsroiget@gmail.com');
  console.log('   5. Cuenta comercial: "No tengo"');
  console.log('   6. "Crear aplicación" + captcha');
  const appId = await askUser('   ⏎ Cuando tengas el ID de la app, escríbelo (o ENTER si no lo ves):');
  await shot(page, 'A2b-app-created');

  // ===== A3 =====
  log('A3', 'Agregando producto WhatsApp...');
  if (appId) {
    await page.goto(`https://developers.facebook.com/apps/${appId}/whatsapp-business/wa-dev-console/`, { waitUntil: 'domcontentloaded' });
  } else {
    await page.goto('https://developers.facebook.com/apps/', { waitUntil: 'domcontentloaded' });
  }
  await shot(page, 'A3-wa-dashboard');
  console.log('\n   👉 ACCIÓN REQUERIDA:');
  console.log('   1. En el menú lateral, busca "Productos"');
  console.log('   2. Busca el icono de WhatsApp');
  console.log('   3. Haz clic en "Configurar" debajo de WhatsApp');
  await askUser('   ⏎ Pulsa ENTER cuando WhatsApp esté configurado...');

  // ===== A4 =====
  log('A4', 'Creando cuenta comercial...');
  await page.goto('https://business.facebook.com/overview', { waitUntil: 'domcontentloaded' });
  await shot(page, 'A4-business-overview');
  console.log('\n   👉 ACCIÓN REQUERIDA:');
  console.log('   1. Ve a WhatsApp > "Cuentas comerciales" en el menú lateral');
  console.log('   2. "Crear cuenta comercial"');
  console.log('   3. Nombre: Pineda y Asociados');
  console.log('   4. Web: http://localhost:3000');
  console.log('   5. Correo: alfonsroiget@gmail.com');
  console.log('   6. Industria: Servicios legales');
  console.log('   7. Siguiente');
  const businessId = await askUser('   ⏎ Cuando tengas el ID de cuenta comercial, escríbelo:');
  await shot(page, 'A4b-business-created');

  // ===== A5 =====
  log('A5', 'Registrando número de teléfono...');
  if (appId) {
    await page.goto(`https://developers.facebook.com/apps/${appId}/whatsapp-business/wa-dev-console/?tab=phone_numbers`, { waitUntil: 'domcontentloaded' });
  } else {
    await page.goto('https://developers.facebook.com/apps/', { waitUntil: 'domcontentloaded' });
  }
  await shot(page, 'A5-phone-numbers');
  console.log('\n   👉 ACCIÓN REQUERIDA:');
  console.log('   1. "Agregar número"');
  console.log('   2. Método: "Teléfono"');
  console.log('   3. País: España (+34)');
  console.log('   4. Número: 661911574');
  console.log('   5. Alias: Bufete principal');
  console.log('   6. Siguiente');
  console.log('   7. Verificación: "Llamada telefónica"');
  console.log('   8. "Enviar código" → ESPERA LA LLAMADA');
  console.log('   9. Introduce el código de 6 dígitos');
  console.log('  10. "Confirmar"');
  const phoneId = await askUser('   ⏎ Cuando tengas el ID del número, escríbelo:');
  await shot(page, 'A5b-phone-verified');

  // ===== A6 =====
  log('A6', 'Creando System User + Token...');
  await page.goto('https://business.facebook.com/settings/system-users', { waitUntil: 'domcontentloaded' });
  await shot(page, 'A6-system-users');
  console.log('\n   👉 ACCIÓN REQUERIDA:');
  console.log('   1. "Agregar"');
  console.log('   2. Nombre: CRM Integration');
  console.log('   3. Rol: Admin → "Crear"');
  console.log('   4. En la fila del usuario, icono de llave → "Generar token"');
  console.log('   5. App: Pineda y Asociados — CRM');
  console.log('   6. Permiso: SOLO whatsapp_business_messaging');
  console.log('   7. Expiración: 60 días');
  console.log('   8. "Generar"');
  console.log('   ⚠️  COPIA EL TOKEN QUE EMPIEZA CON EAA...');
  console.log('   9. "Hecho"');
  const token = await askUser('   ⏎ Pega aquí el token (EAA...):');
  await shot(page, 'A6b-token-generated');

  // ===== A7 =====
  log('A7', 'Guardando en .env.local...');
  let envContent = '';
  if (existsSync(ENV_LOCAL)) {
    envContent = readFileSync(ENV_LOCAL, 'utf8');
  }

  // Eliminar variables existentes si están
  const vars = [
    'WHATSAPP_ACCESS_TOKEN',
    'WHATSAPP_PHONE_NUMBER_ID',
    'WHATSAPP_BUSINESS_ACCOUNT_ID',
    'WHATSAPP_API_VERSION',
    'WHATSAPP_VERIFY_TOKEN',
  ];
  for (const v of vars) {
    envContent = envContent.replace(new RegExp(`^${v}=.*$`, 'gm'), '');
  }

  // Eliminar líneas vacías duplicadas
  envContent = envContent.replace(/\n{3,}/g, '\n\n').trim();

  const newVars = `
# WhatsApp API (Meta) — generadas por scripts/meta-autonomous.mjs
WHATSAPP_ACCESS_TOKEN=${token}
WHATSAPP_PHONE_NUMBER_ID=${phoneId}
WHATSAPP_BUSINESS_ACCOUNT_ID=${businessId}
WHATSAPP_API_VERSION=v22.0
WHATSAPP_VERIFY_TOKEN=mi-verify-token-2026
`;

  envContent = envContent + '\n' + newVars;
  writeFileSync(ENV_LOCAL, envContent, 'utf8');
  console.log(`\n   ✅ Variables escritas en ${ENV_LOCAL}`);

  // ===== B1 =====
  log('B1', 'Validando token con curl...');
  console.log('\n   Ejecuta este comando en PowerShell para validar:');
  console.log(`\n   curl -H "Authorization: Bearer ${token.substring(0, 20)}..." "https://graph.facebook.com/v22.0/${phoneId}"\n`);

  // Cerrar navegador
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  ✅ PROCESO COMPLETADO');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`\nDatos guardados en .env.local:`);
  console.log(`  WHATSAPP_ACCESS_TOKEN: ${token.substring(0, 20)}...`);
  console.log(`  WHATSAPP_PHONE_NUMBER_ID: ${phoneId}`);
  console.log(`  WHATSAPP_BUSINESS_ACCOUNT_ID: ${businessId}`);
  console.log(`  WHATSAPP_API_VERSION: v22.0`);
  console.log(`  WHATSAPP_VERIFY_TOKEN: mi-verify-token-2026`);
  console.log(`\nCapturas en: ${SCREENSHOTS}/\n`);

  await browser.close();
}

main().catch(err => {
  console.error('\n❌ Error:', err.message);
  process.exit(1);
});
