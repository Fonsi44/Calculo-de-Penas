import { db } from '@/lib/db';
import { sql, eq, desc, and } from 'drizzle-orm';

export interface Baseline {
  id: string;
  organizationId: string | null;
  flowType: string;
  caseType: string | null;
  value: number;
  unit: string;
  source: string;
  approvedBy: string | null;
  validFrom: string;
  validUntil: string | null;
  sampleSize: number;
  confidence: number;
  version: string;
  active: boolean;
  methodologyVersion: string;
}

export async function getBaselines(organizationId?: string): Promise<Baseline[]> {
  const rows = await db.execute(sql`
    SELECT * FROM audit WHERE recurso='baseline' ${organizationId ? sql`AND recurso_id=${organizationId}` : sql``}
    ORDER BY creado_en DESC
  `);
  return [];
}

export async function calculateTimeSaved(
  flowType: string, observedMinutes: number,
  automatedMinutes: number, sampleSize: number,
): Promise<{ savedMinutes: number; confidence: number; isEstimate: boolean }> {
  if (observedMinutes <= 0 || automatedMinutes < 0) {
    return { savedMinutes: 0, confidence: 0, isEstimate: true };
  }
  const savedMinutes = Math.max(0, observedMinutes - automatedMinutes);
  const confidence = Math.min(95, Math.round((sampleSize / (sampleSize + 10)) * 100));
  return { savedMinutes, confidence, isEstimate: sampleSize < 5 };
}
