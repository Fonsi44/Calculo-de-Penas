#!/usr/bin/env node
/**
 * Google OAuth — Login vía navegador (gcloud ADC)
 *
 * Abre el navegador para que el propietario inicie sesión con su Google/Gmail.
 * Las credenciales se guardan en el ADC del sistema (~/.config/gcloud/).
 * NUNCA se exponen tokens ni secretos.
 *
 * Requisito: gcloud CLI instalada
 *   https://cloud.google.com/sdk/docs/install
 *
 * Uso:
 *   npm run auth:google        # iniciar login
 *   npm run auth:google:status  # verificar estado
 */

import { config } from 'dotenv';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import os from 'node:os';
import { resolveGcloudCli, runGcloud } from './gcloud-cli.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
config({ path: resolve(ROOT, '.env.local') });
config({ path: resolve(ROOT, '.env') });

function hasGcloud() {
  return Boolean(resolveGcloudCli());
}

function gcloud(args) {
  const parsed = args.match(/(?:[^\s"]+|"[^"]*")+/g)?.map((part) => part.replace(/^"|"$/g, '')) || [];
  const result = runGcloud(parsed);
  return result.ok ? result.stdout : null;
}

async function main() {
  const mode = process.argv[2] || 'auth';

  if (!hasGcloud()) {
    console.log('gcloud CLI no está instalada.\n');
    console.log('Instalación:');
    
    const platform = os.platform();
    if (platform === 'win32') {
      console.log('  Windows: https://cloud.google.com/sdk/docs/install#windows');
      console.log('  O con winget: winget install Google.CloudSDK');
    } else if (platform === 'darwin') {
      console.log('  macOS: brew install google-cloud-sdk');
    } else {
      console.log('  Linux: https://cloud.google.com/sdk/docs/install#linux');
    }
    
    console.log('\nTras instalar, ejecuta: npm run auth:google');
    process.exit(1);
  }

  if (mode === 'status' || mode === 'check') {
    const account = gcloud('auth application-default print-access-token 2>nul');
    if (account === null) {
      console.log('❌ No autenticado. Ejecuta: npm run auth:google');
      process.exit(1);
    }
    
    const whoami = gcloud('auth list --filter=status:ACTIVE --format="value(account)"');
    console.log('✅ Google autenticado');
    if (whoami) console.log(`   Cuenta activa: ${whoami}`);
    
    // Verificar ADC file
    const adcPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (adcPath && fs.existsSync(adcPath)) {
      console.log(`   ADC file: ${adcPath}`);
    } else {
      const defaultAdc = resolve(os.homedir(), '.config', 'gcloud', 'application_default_credentials.json');
      if (fs.existsSync(defaultAdc)) {
        console.log(`   ADC file: ${defaultAdc}`);
      } else {
        console.log('   ⚠️  No se encontró ADC file.');
      }
    }
    
    // Verificar acceso a GSC/GA4 si hay project config
    const ga4Prop = process.env.GOOGLE_ANALYTICS_PROPERTY_ID;
    const gscUrl = process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL;
    if (ga4Prop) console.log(`   GA4 Property configurada: ${ga4Prop}`);
    if (gscUrl) console.log(`   GSC Site configurado: ${gscUrl}`);
    return;
  }

  // Modo auth: abrir navegador
  console.log('Google OAuth — Login por navegador\n');
  console.log('Se abrirá tu navegador. Inicia sesión con tu cuenta de Google/Gmail');
  console.log('que tenga acceso a Search Console, GA4 y Google Business Profile.\n');

  try {
    const login = runGcloud(['auth', 'application-default', 'login'], { inherit: true });
    if (!login.ok) throw new Error('Falló gcloud ADC login');
    console.log('\n✅ Autenticación completada.');
    
    const whoami = gcloud('auth list --filter=status:ACTIVE --format="value(account)"');
    if (whoami) console.log(`   Cuenta: ${whoami}`);
    console.log('   Verifica con: npm run auth:google:status');
  } catch {
    console.log('\n❌ Error en la autenticación. Verifica que gcloud esté instalada correctamente.');
    process.exit(1);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
