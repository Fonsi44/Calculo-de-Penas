/**
 * Configuración compartida de datos SEO — Pineda y Asociados.
 *
 * Fuente única del origen canónico: NEXT_PUBLIC_SITE_URL (env) con fallback a
 * .env.example. NUNCA hardcodear el dominio en otros scripts: importar desde
 * aquí evita variantes con typo (p. ej. "la variante sin "da" en "asociados"").
 */
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/** Lee una clave de .env.example (devuelve el valor sin comillas). */
export function readEnvExampleValue(key) {
  try {
    const line = fs
      .readFileSync(resolve(ROOT, ".env.example"), "utf8")
      .split("\n")
      .find((l) => l.trim().startsWith(`${key}=`));
    return line ? line.trim().split("=", 2)[1].replace(/^"|"$/g, "") : null;
  } catch {
    return null;
  }
}

/** Origen canónico: NEXT_PUBLIC_SITE_URL (env) con fallback a .env.example. */
export function canonicalOrigin() {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL;
  if (fromEnv && /^https:\/\/[^\s/]+/.test(fromEnv)) {
    return fromEnv.replace(/\/+$/, "");
  }
  const fromExample = readEnvExampleValue("NEXT_PUBLIC_SITE_URL");
  if (fromExample) return fromExample.replace(/\/+$/, "");
  return null;
}

/** Enmascara un valor sensible para logs/informes. */
export function mask(value) {
  if (!value) return "[no configurada]";
  const s = String(value);
  if (s.length <= 8) return "*".repeat(s.length);
  return `${s.slice(0, 3)}…${s.slice(-3)}`;
}

export { ROOT };
