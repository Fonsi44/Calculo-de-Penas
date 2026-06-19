/**
 * Verificación de firma de webhooks de Resend (vía Svix).
 *
 * Resend firma sus webhooks con Ed25519 usando el secreto que aparece en el
 * panel (Resend → Webhooks → tu webhook → "Signing secret", formato
 * `whsec_...`). Las cabeceras son las estándar de Svix:
 *   - `svix-id`        (msg id)
 *   - `svix-timestamp` (segundos desde epoch)
 *   - `svix-signature` (lista de firmas `v1,base64(...)` separadas por espacio)
 *
 * El mensaje firmado es: `${svix-id}.${svix-timestamp}.${rawBody}`.
 * El secreto `whsec_...` se decodifica base64-url y se usa como clave privada
 * para derivar la clave pública de verificación (X25519/Ed25519).
 *
 * Implementación basada en la documentación oficial de Svix (sin dependencia
 * externa, usando `crypto` nativo de Node). Referencia:
 * https://github.com/svix/svix-webhooks / https://resend.com/docs/dashboard/webhooks
 */
import { createPublicKey, createPrivateKey, verify, type KeyObject } from 'node:crypto';

const TOLERANCE_SECONDS = 5 * 60; // 5 min de ventana anti-replay

function base64UrlDecode(input: string): Buffer {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/');
  const pad = padded.length % 4 === 0 ? padded : padded + '='.repeat(4 - (padded.length % 4));
  return Buffer.from(pad, 'base64');
}

export interface VerifyResult {
  ok: boolean;
  reason?: string;
}

/**
 * Verifica la firma de un webhook de Resend/Svix.
 *
 * @param rawBody  Cuerpo crudo de la petición (string o Buffer).
 * @param headers  Cabeceras de la petición (case-insensitive keys aceptadas).
 * @param secret   Secreto `whsec_...` del webhook (de `RESEND_WEBHOOK_SECRET`).
 * @returns `{ ok: true }` si la firma es válida, o `{ ok: false, reason }`.
 */
export function verifyResendWebhook(
  rawBody: string | Buffer,
  headers: Record<string, string | string[] | undefined>,
  secret: string,
): VerifyResult {
  const getHeader = (name: string): string | undefined => {
    const lower = name.toLowerCase();
    for (const [k, v] of Object.entries(headers)) {
      if (k.toLowerCase() === lower) {
        return Array.isArray(v) ? v[0] : v;
      }
    }
    return undefined;
  };

  const msgId = getHeader('svix-id');
  const timestamp = getHeader('svix-timestamp');
  const signatureHeader = getHeader('svix-signature');

  if (!msgId || !timestamp || !signatureHeader) {
    return { ok: false, reason: 'Faltan cabeceras svix-id/svix-timestamp/svix-signature' };
  }

  // Anti-replay: rechazar timestamps fuera de la ventana de tolerancia.
  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) {
    return { ok: false, reason: 'svix-timestamp no es un número válido' };
  }
  const nowSec = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSec - ts) > TOLERANCE_SECONDS) {
    return { ok: false, reason: `svix-timestamp fuera de ventana (${ts} vs ahora ${nowSec})` };
  }

  // El secreto de Svix viene como `whsec_<base64url>`. Decodificamos la parte
  // útil y la usamos como clave privada Ed25519 para derivar la pública.
  const secretPart = secret.startsWith('whsec_') ? secret.slice('whsec_'.length) : secret;
  let privateKeyDer: Buffer;
  try {
    privateKeyDer = base64UrlDecode(secretPart);
  } catch {
    return { ok: false, reason: 'RESEND_WEBHOOK_SECRET no es base64url válido' };
  }

  let publicKey: KeyObject;
  try {
    // El signing secret de Svix es una clave privada Ed25519 en formato
    // PKCS#8 DER. Creamos la clave privada y derivamos la pública (SPKI),
    // que es la que se usa para verificar la firma del webhook.
    const privateKey = createPrivateKey({
      key: privateKeyDer,
      format: 'der',
      type: 'pkcs8',
    });
    publicKey = createPublicKey(privateKey);
  } catch {
    return { ok: false, reason: 'No se pudo derivar la clave pública de verificación desde el secreto' };
  }

  const body = typeof rawBody === 'string' ? Buffer.from(rawBody) : rawBody;
  const signedMessage = Buffer.from(`${msgId}.${timestamp}.`);
  const message = Buffer.concat([signedMessage, body]);

  // `svix-signature` puede contener varias firmas `v1,xxx v1,yyy`. Aceptamos
  // cualquiera que valide.
  const signatures = signatureHeader.split(' ').filter((s) => s.startsWith('v1,'));
  if (signatures.length === 0) {
    return { ok: false, reason: 'svix-signature sin firmas v1' };
  }

  for (const sig of signatures) {
    const sigBytes = base64UrlDecode(sig.slice('v1,'.length));
    try {
      if (verify(null, message, publicKey, sigBytes)) {
        return { ok: true };
      }
    } catch {
      // firma malformada: probar la siguiente
    }
  }

  return { ok: false, reason: 'Ninguna firma v1 coincide' };
}
