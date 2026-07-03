#!/usr/bin/env node
/**
 * Vercel CLI — Login y estado
 *
 * Abre el navegador para autenticar con Vercel.
 * No muestra variables de entorno secretas.
 *
 * Uso:
 *   npm run auth:vercel        # login
 *   npm run auth:vercel:status  # estado del proyecto
 */

import { execSync } from 'node:child_process';
import { config } from 'dotenv';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
config({ path: resolve(ROOT, '.env.local') });
config({ path: resolve(ROOT, '.env') });

function hasVercel() {
  try { execSync('vercel --version', { stdio: 'pipe' }); return true; }
  catch { return false; }
}

function vc(args) {
  try { return execSync(`vercel ${args}`, { encoding: 'utf-8', stdio: 'pipe', cwd: ROOT }).trim(); }
  catch { return null; }
}

async function main() {
  const mode = process.argv[2] || 'auth';

  if (!hasVercel()) {
    console.log('Vercel CLI no está instalada.');
    console.log('Instalación: npm i -g vercel');
    console.log('Luego: npm run auth:vercel');
    process.exit(1);
  }

  if (mode === 'status' || mode === 'check') {
    const whoami = vc('whoami');
    if (!whoami) {
      console.log('❌ No autenticado. Ejecuta: npm run auth:vercel');
      process.exit(1);
    }
    console.log('✅ Vercel autenticado');

    // Mostrar info del proyecto sin secretos
    const project = vc('project ls 2>nul');
    if (project) {
      const lines = project.split('\n').filter(l => l.includes('pineda'));
      if (lines.length > 0) console.log(`   Proyectos:\n${lines.join('\n')}`);
    }

    // Verificar deployment reciente
    const deploy = vc('ls --limit 1 2>nul');
    if (deploy && deploy.length > 0) {
      console.log('   Último deploy:');
      console.log(deploy.split('\n').slice(0, 3).join('\n'));
    }
    return;
  }

  // Modo auth
  console.log('Vercel — Login por navegador\n');
  console.log('Se abrirá tu navegador. Inicia sesión con tu cuenta de Vercel.\n');

  try {
    execSync('vercel login', { stdio: 'inherit', cwd: ROOT });
    console.log('\n✅ Autenticación completada.');

    const whoami = vc('whoami');
    if (whoami) console.log(`   Cuenta: ${whoami}`);
    console.log('   Vincula el proyecto: vercel link');
  } catch {
    console.log('\n❌ Error en la autenticación.');
    process.exit(1);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
