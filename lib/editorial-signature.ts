import { createHash } from 'node:crypto';
import { CANONICAL_REVIEWERS } from '@/lib/legal-review';
import { site } from '@/lib/site';

type EditorialSignatureType = 'firm' | 'lawyer';
type EditorialReviewOrigin =
  | 'firm_historical_review'
  | 'individual_lawyer_review'
  | 'pending_resignature';
type ArticlePublicationState =
  | 'published_firm_reviewed'
  | 'published_lawyer_signed'
  | 'draft'
  | 'pending_resignature'
  | 'outdated'
  | 'withdrawn';

type EditorialSignature = {
  type: EditorialSignatureType;
  name: string;
  profileUrl?: string | null;
  signedAt?: string | Date | null;
  reviewedContentHash?: string | null;
};

type ArticleEditorialState = {
  author: string;
  publisher: 'Pineda y Asociados';
  reviewOrigin: EditorialReviewOrigin;
  publicationState: ArticlePublicationState;
  signature: EditorialSignature | null;
  currentContentHash: string;
  signatureValid: boolean;
};

type EditorialArticle = {
  body: string;
  author?: string | null;
  published?: boolean | null;
  reviewStatus?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | Date | null;
  reviewedContentHash?: string | null;
  reviewOrigin?: string | null;
  signatureType?: string | null;
  signatureName?: string | null;
  signatureCandidate?: string | null;
  signatureValid?: boolean | null;
};

export type EditorialSignatureSchemaMode =
  | 'LEGACY_INSTITUTIONAL_MODE'
  | 'MIGRATED_SIGNATURE_MODE';

const LAWYER_PROFILE_URLS: Record<string, string> = {
  'Danilo Pineda Maradiaga': '/equipo/danilo-pineda-maradiaga',
  'Thania Marlene Paz': '/equipo/thania-marlene-paz',
  'Emil Barahona': '/equipo/emil-barahona',
};

export function hashEditorialContent(body: string): string {
  return createHash('sha256').update(body, 'utf8').digest('hex');
}

export function editorialSignatureSchemaMode(
  env: Record<string, string | undefined> = process.env,
): EditorialSignatureSchemaMode {
  return env.EDITORIAL_SIGNATURE_SCHEMA_READY === 'true'
    ? 'MIGRATED_SIGNATURE_MODE'
    : 'LEGACY_INSTITUTIONAL_MODE';
}

function normalizedStatus(status?: string | null): string {
  return status?.trim().toLowerCase() ?? '';
}

export function resolveArticleEditorialState(
  article: EditorialArticle,
  mode: EditorialSignatureSchemaMode = editorialSignatureSchemaMode(),
): ArticleEditorialState {
  const currentContentHash = hashEditorialContent(article.body);
  const status = normalizedStatus(article.reviewStatus);
  const author = article.author?.trim() || site.name;

  if (article.published === false || status === 'draft' || status === 'documentary_review') {
    return unsigned('draft');
  }
  if (status === 'withdrawn') return unsigned('withdrawn');
  if (status === 'outdated' || status === 'needs_update') return unsigned('outdated');
  if (status === 'pending_resignature' || status === 'lawyer_review_pending') {
    return unsigned('pending_resignature');
  }

  if (mode === 'MIGRATED_SIGNATURE_MODE') {
    const persistedHash = article.reviewedContentHash?.trim() ?? '';
    const persistedType = article.signatureType?.trim() ?? '';
    const persistedName = article.signatureName?.trim() ?? '';
    const persistedOrigin = article.reviewOrigin?.trim() ?? '';
    const firmValid =
      persistedOrigin === 'firm_historical_review'
      && persistedType === 'firm'
      && persistedName === 'Pineda y Asociados';
    const lawyerValid =
      persistedOrigin === 'individual_lawyer_review'
      && persistedType === 'lawyer'
      && CANONICAL_REVIEWERS.includes(persistedName);
    const valid =
      article.signatureValid === true
      && persistedHash.length === 64
      && persistedHash === currentContentHash
      && (firmValid || lawyerValid);
    return {
      author,
      publisher: 'Pineda y Asociados',
      reviewOrigin: lawyerValid ? 'individual_lawyer_review' : 'firm_historical_review',
      publicationState: lawyerValid ? 'published_lawyer_signed' : 'published_firm_reviewed',
      signature: firmValid || lawyerValid
        ? {
            type: lawyerValid ? 'lawyer' : 'firm',
            name: persistedName,
            profileUrl: lawyerValid ? LAWYER_PROFILE_URLS[persistedName] ?? null : '/despacho',
            signedAt: article.reviewedAt,
            reviewedContentHash: persistedHash || null,
          }
        : null,
      currentContentHash,
      signatureValid: valid,
    };
  }

  const individualSigner = article.reviewedBy?.trim();
  if (
    (status === 'verified' || status === 'lawyer_verified' || status === 'published_lawyer_signed')
    && individualSigner
    && CANONICAL_REVIEWERS.includes(individualSigner)
  ) {
    const reviewedContentHash = article.reviewedContentHash ?? currentContentHash;
    return {
      author,
      publisher: 'Pineda y Asociados',
      reviewOrigin: 'individual_lawyer_review',
      publicationState: 'published_lawyer_signed',
      signature: {
        type: 'lawyer',
        name: individualSigner,
        profileUrl: LAWYER_PROFILE_URLS[individualSigner] ?? null,
        signedAt: article.reviewedAt,
        reviewedContentHash,
      },
      currentContentHash,
      signatureValid: reviewedContentHash === currentContentHash,
    };
  }

  // Dato canónico confirmado por el despacho: la versión histórica publicada
  // fue revisada institucionalmente. La falta de firma individual no invalida
  // esa revisión ni cambia su indexación.
  const reviewedContentHash = article.reviewedContentHash ?? currentContentHash;
  return {
    author,
    publisher: 'Pineda y Asociados',
    reviewOrigin: 'firm_historical_review',
    publicationState: 'published_firm_reviewed',
    signature: {
      type: 'firm',
      name: 'Pineda y Asociados',
      profileUrl: '/despacho',
      signedAt: article.reviewedAt,
      reviewedContentHash,
    },
    currentContentHash,
    signatureValid: reviewedContentHash === currentContentHash,
  };

  function unsigned(publicationState: ArticlePublicationState): ArticleEditorialState {
    return {
      author,
      publisher: 'Pineda y Asociados',
      reviewOrigin: 'pending_resignature',
      publicationState,
      signature: null,
      currentContentHash,
      signatureValid: false,
    };
  }
}

export function isEditoriallyIndexable(
  article: EditorialArticle,
  mode: EditorialSignatureSchemaMode = editorialSignatureSchemaMode(),
): boolean {
  const state = resolveArticleEditorialState(article, mode);
  return article.published !== false
    && state.signatureValid
    && (
      state.publicationState === 'published_firm_reviewed'
      || state.publicationState === 'published_lawyer_signed'
    );
}
