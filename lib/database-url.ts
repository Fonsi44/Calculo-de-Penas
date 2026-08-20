/**
 * Validación de DATABASE_URL sin abrir conexión ni revelar el valor.
 * Un string no vacío no basta: Neon/pg rechazan valores no parseables
 * (p. ej. placeholders de secretos) con TypeError: Invalid URL.
 */
export function isUsableDatabaseUrl(url: string | undefined | null): boolean {
  if (!url || url.includes('placeholder') || url.includes('localhost:5432/placeholder')) {
    return false;
  }
  try {
    const parsed = new URL(url);
    return Boolean(
      parsed.hostname
      && (parsed.protocol === 'postgres:' || parsed.protocol === 'postgresql:'),
    );
  } catch {
    return false;
  }
}
