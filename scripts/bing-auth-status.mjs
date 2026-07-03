#!/usr/bin/env node
/**
 * Bing WMT — Verificar estado del token OAuth
 * Uso: npm run bing:auth:status
 */

import { config } from 'dotenv';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
config({ path: resolve(ROOT, '.env.local') });
config({ path: resolve(ROOT, '.env') });

function mask(s) { return s ? s.substring(0, 8) + '...' : '(vacío)'; }

async function main() {
  const tokenPath = resolve(ROOT, '.secrets', 'bing-oauth.json');
  
  if (!fs.existsSync(tokenPath)) {
    console.log('❌ No autorizado — no hay token guardado.');
    console.log('Ejecuta: npm run bing:auth');
    process.exit(1);
  }

  const token = JSON.parse(fs.readFileSync(tokenPath, 'utf-8'));
  const now = Date.now();
  const expiresIn = token.expires_at ? Math.round((token.expires_at - now) / 1000) : null;

  console.log('Bing WMT — Estado de autorización\n');
  console.log(`  Autenticado:     ${expiresIn > 0 ? '✅ SÍ' : '❌ NO (expirado)'}`);
  console.log(`  Expira en:       ${expiresIn > 0 ? expiresIn + 's' : 'expirado'}`);
  if (expiresIn > 0) {
    console.log(`  Fecha expiración: ${new Date(token.expires_at).toLocaleString()}`);
  }
  console.log(`  Refresh token:   ${token.refresh_token ? '✅ disponible' : '❌ no disponible'}`);
  console.log(`  Scope:           ${token.scope || 'desconocido'}`);
  console.log(`  Guardado desde:   ${token.savedAt ? new Date(token.savedAt).toLocaleString() : '?'}`);

  // Verificar acceso real a la API
  if (expiresIn > 0) {
    try {
      const res = await fetch(
        `https://ssl.bing.com/webmaster/api.svc/json/GetUserSites?apikey=${process.env.INDEXNOW_KEY || ''}`,
        { headers: { Authorization: `Bearer ${token.access_token}` } }
      );
      const data = await res.json();
      if (data.d) {
        console.log(`\n  Sitios accesibles: ${data.d.length}`);
        data.d.forEach(s => console.log(`    ${s.Url} — verificado: ${s.IsVerified}`));
      }
    } catch {
      console.log('\n  ⚠️ No se pudo verificar acceso a la API.');
    }
  }

  console.log(`\n  Token: ${mask(token.access_token)} (nunca compartir)`);
  if (expiresIn <= 0 && token.refresh_token) {
    console.log('\n  Para renovar, ejecuta npm run bing:auth nuevamente.');
  }
}

main().catch(e => { console.error(e); process.exit(1); });
