import { isStagingEnvironment, getEnvironmentName } from '@/lib/staging-guard';

const ALLOWED_DOMAINS = new Set(['example.com', 'pinedayasociadoshn.com']);
const ALLOWED_EMAILS = new Set<string>([]);

const STAGING_ONLY_DESTINATIONS = [
  'alfonsroiget@gmail.com',
];

export function isEmailAllowed(recipient: string): boolean {
  if (!isStagingEnvironment()) return true;
  const email = recipient.toLowerCase().trim();
  if (ALLOWED_EMAILS.has(email)) return true;
  const domain = email.split('@')[1];
  if (domain && ALLOWED_DOMAINS.has(domain.toLowerCase())) return true;
  if (STAGING_ONLY_DESTINATIONS.includes(email)) return true;
  return false;
}

export interface EmailRedirectionResult {
  originalTo: string[];
  redirectedTo: string[];
  isStaging: boolean;
  stagingTag: string;
}

export function resolveStagingRecipients(originalTo: string[]): EmailRedirectionResult {
  const env = getEnvironmentName();
  if (env === 'production') {
    return { originalTo, redirectedTo: originalTo, isStaging: false, stagingTag: '' };
  }
  const allowed = originalTo.filter((r) => isEmailAllowed(r));
  if (allowed.length === 0 && originalTo.length > 0) {
    const fallback = process.env.CONTACT_NOTIFICATION_EMAIL ?? 'alfonsroiget@gmail.com';
    return {
      originalTo,
      redirectedTo: [fallback],
      isStaging: true,
      stagingTag: `[STAGING:${env}]`,
    };
  }
  return {
    originalTo,
    redirectedTo: allowed,
    isStaging: true,
    stagingTag: `[STAGING:${env}]`,
  };
}

export function buildStagingSubject(originalSubject: string): string {
  if (!isStagingEnvironment()) return originalSubject;
  const env = getEnvironmentName();
  return `[STAGING:${env}] ${originalSubject}`;
}

export function buildStagingHtml(originalHtml: string, originalTo: string[]): string {
  if (!isStagingEnvironment()) return originalHtml;
  return `<div style="background:#fff3cd;border:2px solid #ffc107;padding:12px;margin-bottom:16px;border-radius:8px;">
    <strong>⚠️ ENTORNO DE STAGING</strong>
    <p style="margin:4px 0 0;font-size:13px;color:#856404;">
      Este correo se ha generado desde un entorno de <strong>${getEnvironmentName().toUpperCase()}</strong>.
      No está dirigido a destinatarios reales.
    </p>
    <p style="margin:2px 0 0;font-size:12px;color:#856404;">
      Destinatario original: ${originalTo.join(', ')}
    </p>
  </div>
  ${originalHtml}`;
}
