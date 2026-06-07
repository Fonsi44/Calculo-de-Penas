import { chromium } from 'playwright';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const ENV_LOCAL = resolve(process.cwd(), '.env.local');

function log(step, msg) {
  console.log(`\n[${step}] ${msg}`);
}

async function askUser(question) {
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
  const path = `docs/meta-screenshots/${name}.png`;
  await page.screenshot({ path, fullPage: true });
  console.log(`   📸 ${name}.png`);
}

async function main() {
  console.log('\n═══════════════════════════════════════════════');
  console.log('  REGISTRO NÚMERO WHATSAPP +34 661911574');
  console.log('═══════════════════════════════════════════════\n');

  const browser = await chromium.launch({
    headless: false,
    args: ['--start-maximized', '--disable-blink-features=AutomationControlled']
  });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  // ===== Ir a WhatsApp Manager =====
  log('A5', 'Abriendo WhatsApp Manager...');
  await page.goto('https://business.facebook.com/wa/manager?business_id=1603799175088577', { waitUntil: 'domcontentloaded' });
  await shot(page, 'A5a-wa-manager');
  await new Promise(r => setTimeout(r, 3000));

  console.log('\n📋 PASO A5 — REGISTRAR NÚMERO REAL');
  console.log('========================================');
  console.log('Vas a ver WhatsApp Manager en el navegador.');
  console.log('');

  const action = await askUser('👉 ¿Ves el botón "Agregar número"? Responde si/no/ya: ');

  if (action === 'ya' || action === 'hecho') {
    console.log('\n   ✅ Genial, continuemos.');
  } else {
    console.log('\n1. Busca "Números de teléfono" en el menú lateral');
    console.log('2. Haz clic en "Agregar número"');
    console.log('3. Selecciona el país: España (+34)');
    console.log('4. Número: 661911574');
    console.log('5. Alias: Bufete principal');
    console.log('6. Haz clic en Siguiente');
    await askUser('\n⏎ Pulsa ENTER cuando hayas llegado al paso de verificación...');
  }

  await shot(page, 'A5b-verification-screen');

  console.log('\n📞 VERIFICACIÓN POR LLAMADA:');
  console.log('1. Elige "Llamada telefónica"');
  console.log('2. Haz clic en "Enviar código"');
  console.log('3. ⏰ ESPERA la llamada automática al +34 661911574');
  console.log('4. Escucha el código de 6 dígitos');

  const codigo = await askUser('\n👉 ¿Qué código de 6 dígitos escuchaste? (escribe solo los números): ');

  // Intentar meter el código
  console.log(`\nIntentando ingresar código: ${codigo}`);

  // Buscar el input de código y escribirlo
  try {
    // Try various possible selectors for the verification code input
    const codeInput = await page.locator('input[type="text"][inputmode="numeric"], input[autocomplete="one-time-code"], input[data-testid*="code"], input[name*="code"], input[placeholder*="código"], input[placeholder*="code"], input[maxlength="6"]').first();
    if (await codeInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await codeInput.click();
      await codeInput.fill(codigo);
      console.log('   ✅ Código ingresado en el formulario');
      await new Promise(r => setTimeout(r, 2000));
    }
  } catch (e) {
    console.log('   ⚠️ No pude ingresar el código automáticamente. Introdúcelo manualmente.');
    await askUser('   ⏎ Pulsa ENTER cuando hayas ingresado el código y confirmado...');
  }

  await shot(page, 'A5c-phone-registered');

  console.log('\n🔍 Buscando el ID del número registrado...');

  // Try to get phone number ID via API with the new number
  const token = "EAATVJrWddZCABRghdRoapKEb6pgRkXchUyGTqN7sR7pcWM6Jl8Y84pJWhDWayYaBwOSmuXH87jRQxF5CBYiBdSgBqp5PXvKKwAsAfgCV6XLDzSbgE9WAtZB9loTyiXnVLsZAkhSdZBwCZCG4c2p0IGddqNnf8g2oZBmjsfpFSFzO8PDfZAcFxZBcU9x6XQDNvdsUvTyTDIDMgoYtMTqmV4kv8MjgMZC21LI87gSwRMkPFyYZCHI8RIeX0oGZCUIRqpLyn7fY26nWaRZARtBhIQZCdjrBgbuY2rAZDZD";
  const { execSync } = await import('child_process');

  try {
    const result = execSync(
      `curl -s -H "Authorization: Bearer ${token}" "https://graph.facebook.com/v22.0/1353396563559138/phone_numbers"`,
      { encoding: 'utf8' }
    );
    console.log(`   📡 Phone numbers: ${result}`);

    const data = JSON.parse(result);
    if (data.data && data.data.length > 0) {
      for (const phone of data.data) {
        console.log(`   - ${phone.display_phone_number} (ID: ${phone.id})`);
      }
      // Use the first phone number ID
      const phoneId = data.data[0].id;
      console.log(`\n✅ Phone Number ID: ${phoneId}`);

      // Save to .env.local
      let envContent = '';
      if (existsSync(ENV_LOCAL)) {
        envContent = readFileSync(ENV_LOCAL, 'utf8');
      }

      // Remove existing WhatsApp vars
      for (const v of ['WHATSAPP_ACCESS_TOKEN', 'WHATSAPP_PHONE_NUMBER_ID', 'WHATSAPP_BUSINESS_ACCOUNT_ID', 'WHATSAPP_API_VERSION', 'WHATSAPP_VERIFY_TOKEN']) {
        envContent = envContent.replace(new RegExp(`^${v}=.*$`, 'gm'), '');
      }
      envContent = envContent.replace(/\n{3,}/g, '\n\n').trim();

      const newVars = `
# WhatsApp API (Meta)
WHATSAPP_ACCESS_TOKEN=${token}
WHATSAPP_PHONE_NUMBER_ID=${phoneId}
WHATSAPP_BUSINESS_ACCOUNT_ID=1353396563559138
WHATSAPP_API_VERSION=v22.0
WHATSAPP_VERIFY_TOKEN=mi-verify-token-2026
`;
      envContent = envContent + '\n' + newVars;
      require('fs').writeFileSync(ENV_LOCAL, envContent, 'utf8');
      console.log(`\n   ✅ Variables guardadas en ${ENV_LOCAL}`);

      // Validate with curl
      console.log('\n🔍 Validando token con GET /me...');
      const validate = execSync(
        `curl -s -H "Authorization: Bearer ${token}" "https://graph.facebook.com/v22.0/${phoneId}"`,
        { encoding: 'utf8' }
      );
      console.log(`   📡 Response: ${validate}`);
    }
  } catch (e) {
    console.log(`   ⚠️ Error: ${e.message}`);
    console.log('\n📝 Anota manualmente el ID del número y lo guardaremos después.');
  }

  console.log('\n═══════════════════════════════════════════════');
  console.log('  ✅ PROCESO COMPLETADO');
  console.log('═══════════════════════════════════════════════');

  await browser.close();
}

main().catch(err => {
  console.error('\n❌ Error:', err.message);
  process.exit(1);
});
