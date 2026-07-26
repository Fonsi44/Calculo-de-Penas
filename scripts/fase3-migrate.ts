import { config } from 'dotenv';
import { neon } from '@neondatabase/serverless';
import path from 'path';
import fs from 'fs';

// Load .env.local
const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
  config({ path: envLocalPath, override: true });
} else {
  config();
}

async function run() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is missing");
  }

  const sql = neon(process.env.DATABASE_URL);

  console.log("Iniciando migración manual de campos Fase 3...");

  const queries = [
    `ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "ai_review_status" varchar(50) DEFAULT 'not_started';`,
    `ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "ai_reviewed_at" timestamp with time zone;`,
    `ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "ai_review_model" varchar(100);`,
    `ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "ai_review_version" varchar(100);`,
    `ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "ai_review_confidence" varchar(50);`,
    `ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "ai_review_sources" jsonb DEFAULT '[]'::jsonb;`,
    `ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "ai_review_claims_count" integer DEFAULT 0;`,
    `ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "ai_review_confirmed_claims" integer DEFAULT 0;`,
    `ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "ai_review_corrected_claims" integer DEFAULT 0;`,
    `ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "ai_review_unresolved_claims" integer DEFAULT 0;`
  ];

  for (const q of queries) {
    console.log(`Ejecutando: ${q}`);
    await (sql as any).query(q);
  }

  console.log("Migración exitosa!");
}

run().catch(console.error);
