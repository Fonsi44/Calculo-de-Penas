#!/usr/bin/env node
import { config } from 'dotenv';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { google } from 'googleapis';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
config({ path: resolve(root, '.env') });
config({ path: resolve(root, '.env.local'), override: true });

const propertyId = process.env.GOOGLE_ANALYTICS_PROPERTY_ID;
const expectedMeasurementId = process.env.NEXT_PUBLIC_GA_ID;
const clientId = process.env.OAUTH_CLIENT_ID;
const clientSecret = process.env.OAUTH_CLIENT_SECRET;
const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

if (!propertyId || !clientId || !clientSecret || !refreshToken) {
  console.error('ERROR: faltan variables server-side para consultar Analytics Admin.');
  process.exit(1);
}

const auth = new google.auth.OAuth2(clientId, clientSecret, 'http://localhost:3000');
auth.setCredentials({ refresh_token: refreshToken });
const admin = google.analyticsadmin({ version: 'v1beta', auth });
const property = `properties/${propertyId}`;

function mask(value) {
  if (!value) return '(ausente)';
  if (value.startsWith('G-')) return `${value.slice(0, 6)}${'*'.repeat(Math.max(4, value.length - 6))}`;
  return `${value.slice(0, 3)}…${value.slice(-3)}`;
}

async function optional(label, operation) {
  try {
    return { label, ok: true, data: (await operation()).data };
  } catch (error) {
    return { label, ok: false, error: error.message?.slice(0, 160) || String(error) };
  }
}

const [propertyResult, streamsResult, filtersResult, retentionResult, keyEventsResult] = await Promise.all([
  optional('property', () => admin.properties.get({ name: property })),
  optional('streams', () => admin.properties.dataStreams.list({ parent: property, pageSize: 200 })),
  optional('filters', () => admin.properties.dataFilters.list({ parent: property, pageSize: 200 })),
  optional('retention', () => admin.properties.getDataRetentionSettings({ name: `${property}/dataRetentionSettings` })),
  optional('keyEvents', () => admin.properties.keyEvents.list({ parent: property, pageSize: 200 })),
]);

const streams = streamsResult.data?.dataStreams || [];
const webStreams = streams.filter((stream) => stream.type === 'WEB_DATA_STREAM');
const matched = webStreams.find((stream) => stream.webStreamData?.measurementId === expectedMeasurementId);

console.log('GA4 Admin — configuración verificada');
console.log(`Property: ${mask(propertyId)} | acceso: ${propertyResult.ok ? 'OK' : 'ERROR'}`);
if (propertyResult.ok) {
  console.log(`Zona horaria: ${propertyResult.data.timeZone || '(ausente)'}`);
  console.log(`Moneda: ${propertyResult.data.currencyCode || '(ausente)'}`);
}
console.log(`Streams web: ${webStreams.length}`);
for (const stream of webStreams) {
  console.log(`- Stream ${mask(stream.name?.split('/').pop())} | Measurement ${mask(stream.webStreamData?.measurementId)} | URL ${stream.webStreamData?.defaultUri || '(ausente)'}`);
}
console.log(`Correspondencia Property↔Measurement: ${matched ? 'VALIDADA' : 'NO VALIDADA'}`);
console.log(`Filtros: ${filtersResult.ok ? (filtersResult.data.dataFilters?.length || 0) : 'NO DISPONIBLE'}`);
console.log(`Retención: ${retentionResult.ok ? (retentionResult.data.eventDataRetention || '(ausente)') : 'NO DISPONIBLE'}`);
console.log(`Eventos clave: ${keyEventsResult.ok ? (keyEventsResult.data.keyEvents?.length || 0) : 'NO DISPONIBLE'}`);

if (!matched) process.exitCode = 2;
