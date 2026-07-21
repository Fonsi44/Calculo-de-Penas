/**
 * SandboxSignatureProvider — proveedor determinista para desarrollo y E2E.
 *
 * Implementa SignatureProvider sin depender de un servicio externo.
 * Simula flujos de firma con estados controlables. Útil para tests
 * y desarrollo local sin credenciales reales.
 */
import { createHash, randomUUID } from 'crypto';
import type { SignatureProvider, CreateEnvelopeInput, CreateEnvelopeResult, GetEnvelopeInput, EnvelopeSnapshot, CancelEnvelopeInput, CancelEnvelopeResult, DownloadArtifactsInput, SignedArtifact, VerifyWebhookInput, VerifiedWebhookEvent } from './provider';

interface SandboxEnvelope {
  providerEnvelopeId: string;
  packageId: string;
  titulo: string;
  estado: string;
  documentos: Array<{ documentId: string; nombreNormalizado: string; hashSha256: string; mime: string | null; orden: number }>;
  firmantes: Array<{ providerSignerId: string; signerId: string; nombre: string; email: string | null; rol: string; orden: number; obligatorio: boolean; estado: string; signedAt: string | null; viewedAt: string | null; declinedAt: string | null }>;
  idempotencyKey: string;
  creadoEn: string;
  completedAt: string | null;
  declinedAt: string | null;
  cancelledAt: string | null;
  expiredAt: string | null;
}

const sandboxStore = new Map<string, SandboxEnvelope>();

export class SandboxSignatureProvider implements SignatureProvider {
  readonly providerId = 'sandbox';

  async createEnvelope(input: CreateEnvelopeInput): Promise<CreateEnvelopeResult> {
    const existing = await this.findByKey(input.idempotencyKey);
    if (existing) {
      return { providerEnvelopeId: existing.providerEnvelopeId, estado: existing.estado, providerMetadata: {} };
    }

    const envId = `sbx-${randomUUID()}`;
    const envelope: SandboxEnvelope = {
      providerEnvelopeId: envId,
      packageId: input.packageId,
      titulo: input.titulo,
      estado: 'sent',
      documentos: input.documentos,
      firmantes: input.firmantes.map((f) => ({
        providerSignerId: `sbx-signer-${randomUUID()}`,
        signerId: f.signerId,
        nombre: f.nombre,
        email: f.email,
        rol: f.rolDocumento,
        orden: f.orden,
        obligatorio: f.obligatorio,
        estado: 'sent',
        signedAt: null,
        viewedAt: null,
        declinedAt: null,
      })),
      idempotencyKey: input.idempotencyKey,
      creadoEn: new Date().toISOString(),
      completedAt: null,
      declinedAt: null,
      cancelledAt: null,
      expiredAt: null,
    };
    sandboxStore.set(envId, envelope);
    return { providerEnvelopeId: envId, estado: 'sent', providerMetadata: {} };
  }

  async getEnvelope(input: GetEnvelopeInput): Promise<EnvelopeSnapshot> {
    const env = sandboxStore.get(input.providerEnvelopeId);
    if (!env) throw new SandboxError('NOT_FOUND', 'Envelope no encontrado', 404);

    return {
      providerEnvelopeId: env.providerEnvelopeId,
      estado: env.estado,
      signers: env.firmantes.map((f) => ({
        providerSignerId: f.providerSignerId,
        nombre: f.nombre,
        estado: f.estado,
        signedAt: f.signedAt,
        viewedAt: f.viewedAt,
        declinedAt: f.declinedAt,
        failureReason: null,
      })),
      completedAt: env.completedAt,
      declinedAt: env.declinedAt,
      cancelledAt: env.cancelledAt,
      expiredAt: env.expiredAt,
      providerMetadata: {},
      documentosFirmados: env.estado === 'completed' ? env.documentos.map((d) => ({
        providerArtifactId: `sbx-artifact-${d.documentId}`,
        nombre: `signed-${d.nombreNormalizado}`,
        mime: d.mime ?? 'application/pdf',
        tamanoBytes: 2048,
        hashSha256: createHash('sha256').update(`signed-${d.documentId}`).digest('hex'),
        tipo: 'signed_document' as const,
      })) : null,
    };
  }

  async cancelEnvelope(input: CancelEnvelopeInput): Promise<CancelEnvelopeResult> {
    const env = sandboxStore.get(input.providerEnvelopeId);
    if (!env) throw new SandboxError('NOT_FOUND', 'Envelope no encontrado', 404);
    if (['completed', 'declined', 'cancelled', 'expired'].includes(env.estado)) {
      return { ok: false, estado: env.estado };
    }
    env.estado = 'cancelled';
    env.cancelledAt = new Date().toISOString();
    return { ok: true, estado: 'cancelled' };
  }

  async downloadSignedArtifacts(input: DownloadArtifactsInput): Promise<SignedArtifact[]> {
    const env = sandboxStore.get(input.providerEnvelopeId);
    if (!env) throw new SandboxError('NOT_FOUND', 'Envelope no encontrado', 404);
    if (env.estado !== 'completed') throw new SandboxError('NOT_READY', 'El envelope no está completado', 409);

    return env.documentos.map((d) => {
      const buf = Buffer.from(`SIGNED-DOCUMENT-${d.documentId}-${Date.now()}`, 'utf8');
      return {
        providerArtifactId: `sbx-artifact-${d.documentId}`,
        nombre: `signed-${d.nombreNormalizado}`,
        mime: d.mime ?? 'application/pdf',
        tamanoBytes: buf.length,
        buffer: buf,
        hashSha256: createHash('sha256').update(buf).digest('hex'),
        tipo: 'signed_document',
      };
    });
  }

  async verifyWebhook(input: VerifyWebhookInput): Promise<VerifiedWebhookEvent> {
    const secret = process.env.SANDBOX_WEBHOOK_SECRET || 'sbx-whsec-dev';
    const sig = input.headers['x-sandbox-signature'] as string;
    if (!sig) throw new SandboxError('FORBIDDEN', 'Firma ausente', 403);
    const computed = createHash('sha256').update(`${input.rawBody}:${secret}`).digest('hex');
    if (sig !== computed) throw new SandboxError('FORBIDDEN', 'Firma inválida', 403);

    const payload = JSON.parse(input.rawBody);
    return {
      provider: 'sandbox',
      providerEnvelopeId: payload.providerEnvelopeId,
      providerEventId: payload.providerEventId ?? randomUUID(),
      tipo: payload.tipo ?? 'envelope.status_changed',
      payload,
      occurredAt: payload.occurredAt ?? new Date().toISOString(),
    };
  }

  private async findByKey(idempotencyKey: string): Promise<SandboxEnvelope | undefined> {
    for (const [, env] of sandboxStore) {
      if (env.idempotencyKey === idempotencyKey) return env;
    }
    return undefined;
  }

  /** Exclusivo para E2E/tests: simular transición de firma. */
  async _simulateSign(envelopeId: string, signerIndex: number): Promise<void> {
    const env = sandboxStore.get(envelopeId);
    if (!env || !['sent', 'partially_signed'].includes(env.estado)) return;
    const signer = env.firmantes[signerIndex];
    if (!signer) return;
    signer.estado = 'signed';
    signer.signedAt = new Date().toISOString();
    signer.viewedAt = new Date(Date.now() - 1000).toISOString();
    const allSigned = env.firmantes.every((f) => f.estado === 'signed');
    if (!allSigned) {
      env.estado = 'partially_signed';
    }
  }

  /** Exclusivo para E2E/tests: completar el envelope. */
  async _simulateComplete(envelopeId: string): Promise<void> {
    const env = sandboxStore.get(envelopeId);
    if (!env) return;
    for (const s of env.firmantes) {
      if (s.estado !== 'signed') {
        s.estado = 'signed';
        s.signedAt = new Date().toISOString();
      }
    }
    env.estado = 'completed';
    env.completedAt = new Date().toISOString();
  }

  /** Exclusivo para E2E/tests: declinar. */
  async _simulateDecline(envelopeId: string, signerIndex: number): Promise<void> {
    const env = sandboxStore.get(envelopeId);
    if (!env || !['sent', 'partially_signed'].includes(env.estado)) return;
    const signer = env.firmantes[signerIndex];
    if (!signer) return;
    signer.estado = 'declined';
    signer.declinedAt = new Date().toISOString();
    env.estado = 'declined';
    env.declinedAt = new Date().toISOString();
  }

  /** Exclusivo para E2E/tests: expirar. */
  async _simulateExpire(envelopeId: string): Promise<void> {
    const env = sandboxStore.get(envelopeId);
    if (!env || !['sent', 'partially_signed'].includes(env.estado)) return;
    env.estado = 'expired';
    env.expiredAt = new Date().toISOString();
  }
}

export class SandboxError extends Error {
  constructor(public code: string, message: string, public statusCode = 400) {
    super(message);
    this.name = 'SandboxError';
  }
}
