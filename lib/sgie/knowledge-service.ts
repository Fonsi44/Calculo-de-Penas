/**
 * KnowledgeService — Fase 4B-6. Base de conocimiento jurídica versionada.
 */
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';
import { createHash } from 'crypto';

function sha256(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}

export async function createKnowledgeSource(input: {
  organizationId?: string; title: string; type: string; content: string;
  jurisdiction?: string; authority?: string; officialId?: string;
  tags?: string[]; sensitivity?: string; actorId: string;
}): Promise<{ id: string }> {
  const id = crypto.randomUUID();
  await db.execute(sql`
    INSERT INTO knowledge_sources (id, organization_id, jurisdiction, authority, type, title, official_id, sensitivity, tags, estado, created_by)
    VALUES (${id}::uuid, ${input.organizationId}::uuid, ${input.jurisdiction}, ${input.authority}, ${input.type}, ${input.title}, ${input.officialId}, ${input.sensitivity || 'internal'}, ${JSON.stringify(input.tags || [])}::jsonb, 'draft', ${input.actorId}::uuid)
  `);
  const vid = crypto.randomUUID();
  const hash = sha256(input.content);
  await db.execute(sql`
    INSERT INTO knowledge_versions (id, source_id, version, content, content_hash, estado, created_by)
    VALUES (${vid}::uuid, ${id}::uuid, 1, ${input.content}, ${hash}, 'draft', ${input.actorId}::uuid)
  `);
  return { id };
}

export async function submitForReview(sourceId: string): Promise<void> {
  await db.execute(sql`
    UPDATE knowledge_versions SET estado='pending_legal_review' WHERE source_id=${sourceId}::uuid AND estado='draft'
  `);
}

export async function approveVersion(sourceId: string, version: number, reviewerId: string): Promise<void> {
  await db.execute(sql`
    UPDATE knowledge_versions SET estado='approved', reviewed_by=${reviewerId}::uuid, reviewed_at=NOW()
    WHERE source_id=${sourceId}::uuid AND version=${version} AND estado='pending_legal_review'
  `);
}

export async function publishVersion(sourceId: string, version: number, actorId: string): Promise<void> {
  await db.execute(sql`
    UPDATE knowledge_versions SET estado='published_internal', approved_by=${actorId}::uuid, approved_at=NOW(), published_at=NOW()
    WHERE source_id=${sourceId}::uuid AND version=${version} AND estado='approved'
  `);
  await db.execute(sql`UPDATE knowledge_sources SET estado='published_internal' WHERE id=${sourceId}::uuid`);
}

export async function withdrawSource(sourceId: string): Promise<void> {
  await db.execute(sql`UPDATE knowledge_sources SET estado='withdrawn' WHERE id=${sourceId}::uuid`);
  await db.execute(sql`UPDATE knowledge_versions SET estado='withdrawn' WHERE source_id=${sourceId}::uuid AND estado IN ('approved','published_internal')`);
}
