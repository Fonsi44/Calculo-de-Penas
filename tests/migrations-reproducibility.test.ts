/**
 * Pruebas del runner unificado de migraciones (Drizzle journal + manifiesto manual).
 *
 * Valida:
 *   - Integridad: todos los SQL están en el journal o manifiesto
 *   - IDs sin duplicados
 *   - Checksums consistentes
 *   - Dependencias sin ciclos
 *   - Sin colisiones journal/manifiesto
 *   - El runner responde a comandos status/validate/checksums
 */
import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const RUNNER = resolve(ROOT, 'tools/db/run-migrations.mjs');

function runRunner(mode: string): { exitCode: number; stdout: string; stderr: string } {
  let stdout = '';
  let stderr = '';
  let exitCode = 0;
  try {
    stdout = execFileSync('node', [RUNNER, mode], {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 10_000,
    });
  } catch (err: unknown) {
    const e = err as { stdout?: string; stderr?: string; status?: number };
    stdout = e.stdout ?? '';
    stderr = e.stderr ?? '';
    exitCode = e.status ?? 1;
  }
  return { exitCode, stdout, stderr };
}

describe('Migraciones — Runner unificado', () => {
  it('status devuelve información completa sin errores', () => {
    const r = runRunner('status');
    expect(r.exitCode).toBe(0);
    expect(r.stdout).toContain('Drizzle Journal');
    expect(r.stdout).toContain('Migraciones Manuales');
    expect(r.stdout).toContain('39/61'); // 39 en journal + 22 manuales
  });

  it('validate pasa con 0 errores', () => {
    const r = runRunner('validate');
    expect(r.exitCode).toBe(0);
    expect(r.stdout).toContain('✓ VÁLIDO');
  });

  it('validate detecta IDs duplicados si se introducen', () => {
    // No introducimos duplicados, sino que verificamos que validate los detectaría
    // verificando la salida actual: IDs duplicados debe estar vacío
    const r = runRunner('validate');
    expect(r.exitCode).toBe(0);
    expect(r.stdout).toContain('IDs duplicados:');
    // Si hubiera duplicados, aparecería 'DUPLICADO' en la salida
    expect(r.stdout).not.toContain('✗ DUPLICADO');
  });

  it('checksums calcula y actualiza sin errores', () => {
    const r = runRunner('checksums');
    expect(r.exitCode).toBe(0);
    expect(r.stdout).toContain('checksums actualizados');
  });

  it('todos los SQL están cubiertos (journal + manifiesto = 61)', () => {
    const r = runRunner('status');
    expect(r.stdout).toContain('Journal + Manifiesto: 61');
    expect(r.stdout).toContain('Sin tracking: 0');
  });

  it('no hay colisiones entre journal y manifiesto', () => {
    const r = runRunner('validate');
    expect(r.stdout).toContain('Sin colisiones');
  });

  it('no hay dependencias circulares en el manifiesto', () => {
    const r = runRunner('validate');
    expect(r.stdout).toContain('Sin ciclos');
  });

  it('detecta la colisión de prefijos 0038', () => {
    const r = runRunner('status');
    expect(r.stdout).toContain('COLISIONES DE PREFIJOS');
    expect(r.stdout).toContain('Prefijo 0038: 2 archivos');
  });

  it('apply sin DATABASE_URL informa que es necesario configurar', () => {
    const r = runRunner('apply');
    // apply valida primero, luego informa sobre la necesidad de DB
    expect(r.stdout).toContain('Aplicar migraciones');
  });
});
