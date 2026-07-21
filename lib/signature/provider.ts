/**
 * SignatureProvider — abstracción desacoplada para P2-09.
 *
 * Cada adaptador implementa esta interfaz. El dominio SGIE nunca
 * importa SDKs de proveedores fuera del adaptador.
 */
export interface CreateEnvelopeInput {
  packageId: string;
  expedienteId: string;
  titulo: string;
  documentos: Array<{
    documentId: string;
    nombreNormalizado: string;
    hashSha256: string;
    mime: string | null;
    tamanoBytes: number | null;
    orden: number;
  }>;
  firmantes: Array<{
    signerId: string;
    nombre: string;
    email: string | null;
    rolDocumento: string;
    orden: number;
    obligatorio: boolean;
  }>;
  ordenFirma: boolean;
  callbackUrl: string;
  idempotencyKey: string;
}

export interface CreateEnvelopeResult {
  providerEnvelopeId: string;
  estado: string;
  providerMetadata: Record<string, unknown>;
}

export interface GetEnvelopeInput {
  providerEnvelopeId: string;
}

export interface EnvelopeSnapshot {
  providerEnvelopeId: string;
  estado: string;
  signers: Array<{
    providerSignerId: string;
    nombre: string;
    estado: string;
    signedAt: string | null;
    viewedAt: string | null;
    declinedAt: string | null;
    failureReason: string | null;
  }>;
  completedAt: string | null;
  declinedAt: string | null;
  cancelledAt: string | null;
  expiredAt: string | null;
  providerMetadata: Record<string, unknown>;
  documentosFirmados: Array<{
    providerArtifactId: string;
    nombre: string;
    mime: string;
    tamanoBytes: number;
    hashSha256: string;
    tipo: 'signed_document' | 'certificate' | 'audit_trail';
  }> | null;
}

export interface CancelEnvelopeInput {
  providerEnvelopeId: string;
  motivo: string;
}

export interface CancelEnvelopeResult {
  ok: boolean;
  estado: string;
}

export interface DownloadArtifactsInput {
  providerEnvelopeId: string;
}

export interface SignedArtifact {
  providerArtifactId: string;
  nombre: string;
  mime: string;
  tamanoBytes: number;
  buffer: Buffer;
  hashSha256: string;
  tipo: 'signed_document' | 'certificate' | 'audit_trail';
}

export interface VerifyWebhookInput {
  rawBody: string;
  headers: Record<string, string | string[] | undefined>;
}

export interface VerifiedWebhookEvent {
  provider: string;
  providerEnvelopeId: string;
  providerEventId: string;
  tipo: string;
  payload: Record<string, unknown>;
  occurredAt: string;
}

export interface SignatureProvider {
  readonly providerId: string;

  createEnvelope(input: CreateEnvelopeInput): Promise<CreateEnvelopeResult>;
  getEnvelope(input: GetEnvelopeInput): Promise<EnvelopeSnapshot>;
  cancelEnvelope(input: CancelEnvelopeInput): Promise<CancelEnvelopeResult>;
  downloadSignedArtifacts(input: DownloadArtifactsInput): Promise<SignedArtifact[]>;
  verifyWebhook(input: VerifyWebhookInput): Promise<VerifiedWebhookEvent>;
}
