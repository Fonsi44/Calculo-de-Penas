import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { blogPosts } from '../../lib/schema';
import { inArray } from 'drizzle-orm';
import * as fs from 'fs';

async function main() {
  const sql = neon(process.env.DATABASE_URL!);
  const db = drizzle(sql);
  
  // IDs of Lote 30 articles based on auditoriablog.md
  const ids = [
    '39ab8adb-391e-4611-b3bd-a04b538b9086',
    '8bd4e0ab-3223-4945-b318-71cbf200b8ea',
    '70831e5c-2b4c-4fd9-bef6-d912a50baf3e',
    '3583815d-917a-4754-8366-26b1eb799cc2'
  ];

  const results = await db.select().from(blogPosts).where(inArray(blogPosts.id, ids));

  // Sort them to match the array order
  results.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));

  fs.writeFileSync('C:\\Proyectos\\Justicia Verdadera\\scratch\\current-lote30.json', JSON.stringify(results, null, 2));
  console.log('Saved to scratch/current-lote30.json');
}

main().catch(console.error);
