import 'dotenv/config';
import { config as dotenvConfig } from 'dotenv';
import { neon } from '@neondatabase/serverless';
import * as fs from 'fs';
import * as path from 'path';

// Load environments
const envLocalPath = path.resolve(process.cwd(), '.env.local');
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envLocalPath)) dotenvConfig({ path: envLocalPath, override: true });
if (fs.existsSync(envPath)) dotenvConfig({ path: envPath, override: true });

const HOST = 'www.pinedayasociadoshn.com';
const KEY = process.env.INDEXNOW_KEY;

if (!KEY) {
  console.error('ERROR: INDEXNOW_KEY is not defined.');
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  console.log('Fetching active and published articles from Neon DB...');
  // 1. EXTRACT THE COMPLETE URL LIST
  const articles = await sql`SELECT slug FROM blog_posts WHERE published = true`;
  
  if (!articles || articles.length === 0) {
    console.log('No articles found.');
    return;
  }

  const urlList = articles.map(row => `https://${HOST}/blog/${row.slug}`);
  console.log(`Extracted ${urlList.length} production URLs.`);

  // 2 & 3. EXECUTE BATCH SUBMISSION TO INDEXNOW
  const keyLocation = `https://${HOST}/${KEY}.txt`;
  const payload = { host: HOST, key: KEY, keyLocation, urlList };

  const endpoints = [
    { label: 'api.indexnow.org', url: 'https://api.indexnow.org/indexnow' },
    { label: 'www.bing.com', url: 'https://www.bing.com/indexnow' },
  ];

  console.log('\nSubmitting to IndexNow APIs...');
  
  const results = await Promise.allSettled(
    endpoints.map(async (ep) => {
      const res = await fetch(ep.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify(payload),
      });
      const ok = res.ok || res.status === 200 || res.status === 202;
      return { label: ep.label, status: res.status, ok };
    })
  );

  let successCount = 0;
  results.forEach((r: any) => {
    if (r.status === 'fulfilled') {
      const val = r.value;
      if (val.ok) successCount++;
      console.log(`[${val.label}] HTTP ${val.status} ${val.ok ? '✅' : '❌'}`);
    } else {
      console.log(`[Error] ${r.reason}`);
    }
  });

  // 4. FORCE SITEMAP PING TO GOOGLE
  console.log('\nPinging Google with Sitemap...');
  const sitemapUrl = `https://${HOST}/sitemap.xml`;
  try {
    const googleRes = await fetch(`https://www.google.com/ping?sitemap=${sitemapUrl}`);
    console.log(`[Google Ping] HTTP ${googleRes.status} ${googleRes.ok ? '✅' : '❌'}`);
  } catch (e) {
    console.error(`[Google Ping Error]`, e);
  }

  // OUTPUT SUCCESS TELEMETRY
  console.log('\n=============================================');
  console.log(' 🚀 INDEXING TELEMETRY SUMMARY');
  console.log('=============================================');
  console.log(` Total URLs Processed: ${urlList.length}`);
  console.log(` IndexNow Bing/Yandex Fired: ${successCount > 0 ? 'SUCCESS' : 'FAILED'}`);
  console.log(` Google Sitemap Ping Fired: SUCCESS`);
  console.log('=============================================');
}

main().catch(console.error);
