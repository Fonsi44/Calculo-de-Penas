import fs from 'node:fs';
import { dirname } from 'node:path';

export function arg(name, fallback = null) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

export const hasFlag = (name) => process.argv.includes(name);
export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function withRetry(operation, { attempts = 4, baseMs = 500 } = {}) {
  let last;
  for (let attempt = 0; attempt < attempts; attempt++) {
    try { return await operation(attempt); }
    catch (error) {
      last = error;
      const status = error?.code || error?.response?.status;
      if (attempt === attempts - 1 || !['EPERM', 'EBUSY', 'EMFILE', 429, 500, 502, 503, 504].includes(status)) throw error;
      await sleep(baseMs * 2 ** attempt + Math.floor(Math.random() * 100));
    }
  }
  throw last;
}

export async function atomicWrite(file, content) {
  fs.mkdirSync(dirname(file), { recursive: true });
  const temp = `${file}.${process.pid}.${Date.now()}.tmp`;
  try {
    await withRetry(() => fs.promises.writeFile(temp, content, 'utf8'));
    await withRetry(async () => {
      try { await fs.promises.rename(temp, file); }
      catch (error) {
        if (process.platform === 'win32' && ['EEXIST', 'EPERM'].includes(error.code)) {
          await fs.promises.rm(file, { force: true });
          await fs.promises.rename(temp, file);
          return;
        }
        throw error;
      }
    });
  } finally {
    await fs.promises.rm(temp, { force: true }).catch(() => {});
  }
}

export const atomicWriteJson = (file, value) => atomicWrite(file, JSON.stringify(value, null, 2));

function csvCell(value) {
  const text = value == null ? '' : typeof value === 'object' ? JSON.stringify(value) : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

export async function writeDatasetsCsv(file, datasets) {
  const rows = [];
  const keys = new Set(['dataset']);
  for (const [dataset, values] of Object.entries(datasets)) {
    for (const value of Array.isArray(values) ? values : []) {
      const row = { dataset, ...value };
      Object.keys(row).forEach((key) => keys.add(key));
      rows.push(row);
    }
  }
  const header = [...keys];
  const csv = [header.map(csvCell).join(','), ...rows.map((row) => header.map((key) => csvCell(row[key])).join(','))].join('\r\n');
  await atomicWrite(file, `${csv}\r\n`);
  return rows.length;
}

export function resolvePeriod(defaultDays = 28) {
  const end = arg('--end') ? new Date(`${arg('--end')}T00:00:00Z`) : new Date();
  const start = arg('--start') ? new Date(`${arg('--start')}T00:00:00Z`) : new Date(end.getTime() - Number(arg('--days', defaultDays)) * 86400000);
  if (Number.isNaN(start.valueOf()) || Number.isNaN(end.valueOf()) || start > end) throw new Error('Rango de fechas inválido');
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
}
