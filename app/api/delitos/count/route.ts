import { db } from '@/lib/db';
import { delitos } from '@/lib/schema';
import { count } from 'drizzle-orm';

export async function GET() {
  const result = await db.select({ total: count() }).from(delitos);
  return Response.json({ total: result[0].total });
}
