/**
 * Preview token management — Phase 2 replacement.
 *
 * Replaces JWT-based preview (content in URL) with opaque, random, server-side
 * tokens stored in the `preview_tokens` table. Tokens are single-use by default
 * and expire after 1 hour.
 *
 * Security:
 * - Token is 32-byte crypto-random base64url (not JWT).
 * - Content lives server-side in DB, never in the URL.
 * - Token consumption is compare-and-set (UPDATE WHERE consumedAt IS NULL).
 * - Expired tokens are never served.
 */
import { randomBytes } from 'crypto';
import { db } from '@/lib/db';
import { previewTokens } from '@/lib/schema';
import { and, eq, isNull, gt, lt } from 'drizzle-orm';

const PREVIEW_TTL_MS = 60 * 60 * 1000; // 1 hour

export interface CreatePreviewInput {
  title: string;
  body: string;
  category?: string;
  slug?: string;
  description?: string;
  createdBy: string;
}

export interface PreviewPayload {
  title: string;
  body: string;
  category: string;
  slug: string;
  description: string;
  createdBy: string;
  expiresAt: Date;
}

function generateToken(): string {
  return randomBytes(32).toString('base64url');
}

/**
 * Creates a preview token. Stores the content in DB and returns the opaque token.
 */
export async function createPreviewToken(input: CreatePreviewInput): Promise<string> {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + PREVIEW_TTL_MS);

  await db.insert(previewTokens).values({
    token,
    title: input.title,
    body: input.body,
    category: input.category || 'derecho-penal',
    slug: input.slug || 'preview',
    description: input.description || '',
    createdBy: input.createdBy,
    expiresAt,
  });

  return token;
}

/**
 * Looks up and consumes a preview token (compare-and-set).
 * Returns the content payload if valid, or null if expired/consumed/invalid.
 * The token is marked as consumed on first successful lookup, making it
 * single-use (the compare-and-set prevents race conditions).
 */
export async function consumePreviewToken(token: string): Promise<PreviewPayload | null> {
  // Compare-and-set: only consume if not already consumed and not expired.
  const rows = await db.update(previewTokens)
    .set({ consumedAt: new Date() })
    .where(and(
      eq(previewTokens.token, token),
      isNull(previewTokens.consumedAt),
      gt(previewTokens.expiresAt, new Date()),
    ))
    .returning({
      title: previewTokens.title,
      body: previewTokens.body,
      category: previewTokens.category,
      slug: previewTokens.slug,
      description: previewTokens.description,
      createdBy: previewTokens.createdBy,
      expiresAt: previewTokens.expiresAt,
    });

  if (rows.length === 0) return null;

  return {
    title: rows[0].title,
    body: rows[0].body,
    category: rows[0].category || 'derecho-penal',
    slug: rows[0].slug || 'preview',
    description: rows[0].description || '',
    createdBy: rows[0].createdBy,
    expiresAt: rows[0].expiresAt,
  };
}

/**
 * Revokes all unconsumed preview tokens for a user (e.g., on logout or
 * admin action). Returns the number of tokens revoked.
 */
export async function revokeUserPreviewTokens(userId: string): Promise<number> {
  const result = await db.update(previewTokens)
    .set({ consumedAt: new Date() })
    .where(and(
      eq(previewTokens.createdBy, userId),
      isNull(previewTokens.consumedAt),
      gt(previewTokens.expiresAt, new Date()),
    ));
  return result?.rowCount ?? 0;
}

/**
 * Cleans up expired tokens. Can be called from a periodic maintenance job.
 * Returns the number of deleted rows.
 */
export async function cleanupExpiredPreviewTokens(): Promise<number> {
  const result = await db.delete(previewTokens)
    .where(lt(previewTokens.expiresAt, new Date()));
  return result?.rowCount ?? 0;
}
