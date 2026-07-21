/**
 * DropboxSignProvider — adaptador real para Dropbox Sign (HelloSign).
 *
 * Implementa SignatureProvider usando la API REST v3 de Dropbox Sign.
 * Usa autenticación Basic Auth (API key como username).
 */
import { createHash, randomUUID } from 'crypto';
import type { SignatureProvider, CreateEnvelopeInput, CreateEnvelopeResult, GetEnvelopeInput, EnvelopeSnapshot, CancelEnvelopeInput, CancelEnvelopeResult, DownloadArtifactsInput, SignedArtifact, VerifyWebhookInput, VerifiedWebhookEvent, ResendNotificationInput } from './provider';

function authHeader(): string {
  const key = process.env.DROPBOX_SIGN_API_KEY || '';
  if (!key) throw new DropboxSignError('CONFIG', 'DROPBOX_SIGN_API_KEY no configurada', 500);
  return `Basic ${Buffer.from(`${key}:`).toString('base64')}`;
}

function isTestMode(): boolean {
  return process.env.DROPBOX_SIGN_TEST_MODE === 'true';
}

function isProductionAllowed(): boolean {
  return process.env.DROPBOX_SIGN_PRODUCTION_ENABLED === 'true';
}

function apiUrl(path: string): string {
  const base = process.env.DROPBOX_SIGN_BASE_URL || 'https://api.hellosign.com/v3';
  return `${base}${path}`;
}

export class DropboxSignProvider implements SignatureProvider {
  readonly providerId = 'dropboxsign';

  async createEnvelope(input: CreateEnvelopeInput): Promise<CreateEnvelopeResult> {
    const testMode = isTestMode();

    // Production guard: reject non-test mode unless explicitly enabled
    if (!testMode && !isProductionAllowed()) {
      throw new DropboxSignError('CONFIG', 'DROPBOX_SIGN_PRODUCTION_ENABLED debe ser true para usar test_mode=false', 403);
    }

    const form = new FormData();
    form.append('title', input.titulo);
    form.append('subject', input.titulo);
    form.append('message', 'Documento para firma electrónica — Pineda y Asociados');
    if (testMode) form.append('test_mode', '1');

    input.firmantes.forEach((f, i) => {
      form.append(`signers[${i}][email_address]`, f.email || `${f.nombre.toLowerCase().replace(/\s+/g, '.')}@no-email.test`);
      form.append(`signers[${i}][name]`, f.nombre);
      if (input.ordenFirma) form.append(`signers[${i}][order]`, String(f.orden));
    });

    // Adjuntar archivos
    if (input.files && input.files.length > 0) {
      input.files.forEach((file, i) => {
        form.append(`file[${i}]`, new Blob([new Uint8Array(file.buffer)], { type: file.mime }), file.nombre);
      });
    } else {
      // Archivo placeholder si no se proporcionan buffers
      const placeholderPdf = '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R>>endobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n190\n%%EOF';
      form.append('file[0]', new Blob([new TextEncoder().encode(placeholderPdf)], { type: 'application/pdf' }), 'placeholder.pdf');
    }

    form.append('metadata', JSON.stringify({
      packageId: input.packageId,
      expedienteId: input.expedienteId,
      idempotencyKey: input.idempotencyKey,
    }));

    const resp = await fetch(apiUrl('/signature_request/send'), {
      method: 'POST',
      headers: { Authorization: authHeader() },
      body: form,
    });

    const data = await resp.json() as Record<string, unknown>;
    if (!resp.ok) {
      throw new DropboxSignError('PROVIDER', `Dropbox Sign error: ${(data as Record<string, unknown>).error_msg || resp.statusText}`, resp.status);
    }

    const sigReq = data.signature_request as Record<string, unknown>;
    return {
      providerEnvelopeId: sigReq.signature_request_id as string,
      estado: 'sent',
      providerMetadata: { isComplete: sigReq.is_complete, signingUrl: sigReq.signing_url, detailsUrl: sigReq.details_url },
    };
  }

  async getEnvelope(input: GetEnvelopeInput): Promise<EnvelopeSnapshot> {
    const resp = await fetch(apiUrl(`/signature_request/${input.providerEnvelopeId}`), {
      headers: { Authorization: authHeader() },
    });
    const data = await resp.json() as Record<string, unknown>;
    if (!resp.ok) throw new DropboxSignError('PROVIDER', `Dropbox Sign error: ${(data as Record<string, unknown>).error_msg || resp.statusText}`, resp.status);

    const sr = data.signature_request as Record<string, unknown>;
    const signatures = (sr.signatures || []) as Array<Record<string, unknown>>;
    const isComplete = sr.is_complete as boolean;
    const isDeclined = !!sr.is_declined;
    const isCancelled = !!sr.is_cancelled;

    let estado: string;
    if (isComplete) estado = 'completed';
    else if (isDeclined) estado = 'declined';
    else if (isCancelled) estado = 'cancelled';
    else estado = hasAnySignature(signatures) ? 'partially_signed' : 'sent';

    return {
      providerEnvelopeId: sr.signature_request_id as string,
      estado,
      signers: signatures.map((s) => ({
        providerSignerId: (s.signature_id as string) || '',
        nombre: (s.signer_name as string) || '',
        estado: s.status_code as string || 'awaiting_signature',
        signedAt: (s.signed_at || s.last_reminded_at) ? new Date(Number(s.signed_at || s.last_reminded_at) * 1000).toISOString() : null,
        viewedAt: s.last_viewed_at ? new Date(Number(s.last_viewed_at) * 1000).toISOString() : null,
        declinedAt: s.declined_at ? new Date(Number(s.declined_at) * 1000).toISOString() : null,
        failureReason: (s.decline_reason as string) || null,
      })),
      completedAt: null,
      declinedAt: null,
      cancelledAt: null,
      expiredAt: null,
      providerMetadata: {
        title: sr.title,
        isComplete,
        isDeclined: !!isDeclined,
        isCancelled: !!isCancelled,
        signingUrl: sr.signing_url,
        detailsUrl: sr.details_url,
      },
      documentosFirmados: isComplete ? [{
        providerArtifactId: `${input.providerEnvelopeId}-files`,
        nombre: 'signed-documents.pdf',
        mime: 'application/pdf',
        tamanoBytes: 0,
        hashSha256: '',
        tipo: 'signed_document' as const,
      }] : null,
    };
  }

  async cancelEnvelope(input: CancelEnvelopeInput): Promise<CancelEnvelopeResult> {
    const resp = await fetch(apiUrl(`/signature_request/cancel/${input.providerEnvelopeId}`), {
      method: 'POST',
      headers: { Authorization: authHeader(), 'Content-Type': 'application/json' },
    });
    if (!resp.ok) {
      const errData = await resp.json() as Record<string, unknown>;
      return { ok: false, estado: (errData as Record<string, unknown>).error_msg as string || 'unknown' };
    }
    return { ok: true, estado: 'cancelled' };
  }

  async resendNotification(input: ResendNotificationInput): Promise<void> {
    const resp = await fetch(apiUrl(`/signature_request/remind/${input.providerEnvelopeId}`), {
      method: 'POST',
      headers: { Authorization: authHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ email_address: '' }),
    });
    if (!resp.ok) {
      const errData = await resp.json() as Record<string, unknown>;
      throw new DropboxSignError('PROVIDER', `Error reenviando: ${(errData as Record<string, unknown>).error_msg || resp.statusText}`, resp.status);
    }
  }

  async downloadSignedArtifacts(input: DownloadArtifactsInput): Promise<SignedArtifact[]> {
    const resp = await fetch(apiUrl(`/signature_request/files/${input.providerEnvelopeId}`), {
      headers: { Authorization: authHeader() },
    });
    if (!resp.ok) {
      const errData = await resp.json() as Record<string, unknown>;
      throw new DropboxSignError('PROVIDER', `Error downloading: ${(errData as Record<string, unknown>).error_msg || resp.statusText}`, resp.status);
    }

    // Dropbox Sign returns the file as a PDF stream or a ZIP for multiple files
    const contentType = resp.headers.get('content-type') || 'application/pdf';
    const isZip = contentType.includes('zip') || input.providerEnvelopeId.includes('bulk');
    const buf = Buffer.from(await resp.arrayBuffer());
    const hash = createHash('sha256').update(buf).digest('hex');

    return [{
      providerArtifactId: `${input.providerEnvelopeId}-${isZip ? 'zip' : 'pdf'}`,
      nombre: isZip ? 'signed-documents.zip' : 'signed-document.pdf',
      mime: contentType,
      tamanoBytes: buf.length,
      buffer: buf,
      hashSha256: hash,
      tipo: 'signed_document',
    }];
  }

  async verifyWebhook(input: VerifyWebhookInput): Promise<VerifiedWebhookEvent> {
    const secret = process.env.DROPBOX_SIGN_WEBHOOK_SECRET || process.env.DROPBOX_SIGN_API_KEY || '';
    const providedSig = input.headers['dropbox-sign-event-hash'] as string;
    if (!providedSig) throw new DropboxSignError('FORBIDDEN', 'Dropbox-Sign-Event-Hash header ausente', 403);

    const computed = createHash('sha256').update(`${input.rawBody}${secret}`).digest('hex');
    if (computed !== providedSig) throw new DropboxSignError('FORBIDDEN', 'Firma HMAC inválida', 403);

    const payload = JSON.parse(input.rawBody) as Record<string, unknown>;
    const event = (payload.signature_request || payload.event || payload) as Record<string, unknown>;
    return {
      provider: 'dropboxsign',
      providerEnvelopeId: (event.signature_request_id || payload.signature_request_id) as string,
      providerEventId: (event.event_hash || randomUUID()) as string,
      tipo: normalizeEventType((event.event_type as string) || (payload.event_type as string) || 'unknown'),
      payload,
      occurredAt: (event.event_time || new Date().toISOString()) as string,
    };
  }
}

function hasAnySignature(signatures: Array<Record<string, unknown>>): boolean {
  return signatures.some((s) => s.status_code === 'signed');
}

function normalizeEventType(type: string): string {
  const map: Record<string, string> = {
    signature_request_sent: 'envelope.sent',
    signature_request_viewed: 'envelope.viewed',
    signature_request_signed: 'envelope.signed',
    signature_request_all_signed: 'envelope.completed',
    signature_request_declined: 'envelope.declined',
    signature_request_cancelled: 'envelope.cancelled',
    signature_request_downloadable: 'envelope.completed',
    signature_request_email_bounce: 'envelope.bounced',
    signature_request_remind: 'envelope.reminded',
  };
  return map[type] || type;
}

function getEstado(statusCode: string, isComplete: boolean, isDeclined: boolean): string {
  if (isComplete) return 'completed';
  if (isDeclined) return 'declined';
  if (statusCode === 'signed') return 'partially_signed';
  if (statusCode === 'viewed') return 'viewed';
  if (statusCode === 'awaiting_signature') return 'sent';
  return 'sent';
}

export class DropboxSignError extends Error {
  constructor(public code: string, message: string, public statusCode = 400) {
    super(message);
    this.name = 'DropboxSignError';
  }
}
