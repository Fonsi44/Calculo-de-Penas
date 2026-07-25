#!/usr/bin/env node
import { config } from 'dotenv';
import { resolve } from 'node:path';
import fs from 'node:fs';

const root = resolve(import.meta.dirname, '..');
config({ path: resolve(root, '.env') });
config({ path: resolve(root, '.env.local'), override: true });

const gaId = process.env.NEXT_PUBLIC_GA_ID?.trim() || '';
const gtmId = process.env.NEXT_PUBLIC_GTM_ID?.trim() || '';
const formSource = fs.readFileSync(
  resolve(root, 'components', 'marketing', 'solicitar-consulta-form.tsx'),
  'utf8',
);

const checks = [
  ['GA4 Measurement ID', !gaId || /^G-[A-Z0-9]{6,14}$/i.test(gaId)],
  ['GTM container ID', !gtmId || /^GTM-[A-Z0-9]{4,12}$/i.test(gtmId)],
  ['Proveedor GA4/GTM exclusivo', !(gaId && gtmId)],
  ['Clarity Project ID', !process.env.NEXT_PUBLIC_CLARITY_ID || /^[a-z0-9]{6,20}$/i.test(process.env.NEXT_PUBLIC_CLARITY_ID)],
  ['Consent component', fs.existsSync(resolve(root, 'components', 'cookie-consent.tsx'))],
  ['Analytics helper', fs.existsSync(resolve(root, 'lib', 'analytics.ts'))],
  ['Conversión de formulario instrumentada', formSource.includes('trackContactFormSubmit')],
  ['output ignorado', fs.readFileSync(resolve(root, '.gitignore'), 'utf8').split(/\r?\n/).includes('/output/')],
];

for (const [name, ok] of checks) console.log(`${ok ? 'OK' : 'ERROR'} ${name}`);
const failures = checks.filter(([, ok]) => !ok).length;
console.log(`Resumen: ${checks.length - failures}/${checks.length} checks válidos`);
process.exitCode = failures ? 1 : 0;
