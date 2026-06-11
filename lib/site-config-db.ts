import { db } from '@/lib/db';
import { configuracionSitio } from '@/lib/schema';

export async function getSiteConfigOverrides(): Promise<Record<string, string>> {
  try {
    const rows = await db.select().from(configuracionSitio);
    const config: Record<string, string> = {};
    for (const row of rows) {
      config[row.clave] = row.valor;
    }
    return config;
  } catch {
    return {};
  }
}
