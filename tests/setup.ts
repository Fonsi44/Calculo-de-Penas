import '@testing-library/jest-dom';

/**
 * Salvaguarda anti-producción: si los tests definen DATABASE_URL, debe ser una
 * base aislada autorizada. Esto evita que una ejecución accidental contra
 * producción (p. ej. DATABASE_URL de Vercel copiada al .env.local) contamine o
 * destruya datos reales durante tests con escritura.
 *
 * No bloquea suites unitarias que no usan DB (DATABASE_URL ausente).
 */
if (process.env.DATABASE_URL) {
  try {
    // Import dinámico para no acoplar el setup a la resolución del módulo DB.
    const { assertSafeTestDatabaseUrl } = await import('@/lib/test-db-guard');
    assertSafeTestDatabaseUrl(process.env.DATABASE_URL);
  } catch (e) {
    // Abortar el proceso entero: un guard roto es preferible a correr tests
    // contra una DB no validada.
    console.error('[test-db-guard] Abortando suite de pruebas:', (e as Error).message);
    process.exit(1);
  }
}
