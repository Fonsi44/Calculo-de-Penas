#!/usr/bin/env node
/**
 * Schema inventory and diff between canonical_pr20 and clone neondb.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..', '..');
const OUT = resolve(ROOT, '.local');

async function inventory(sql, label) {
  const cols = (await sql.query(`SELECT c.table_name||'.'||c.column_name AS key, format_type(a.atttypid,a.atttypmod) AS full_type, c.is_nullable, pg_get_expr(ad.adbin,ad.adrelid) AS default_expr FROM information_schema.columns c JOIN pg_attribute a ON a.attrelid=(quote_ident(c.table_schema)||'.'||quote_ident(c.table_name))::regclass AND a.attname=c.column_name AND a.attnum>0 AND NOT a.attisdropped LEFT JOIN pg_attrdef ad ON ad.adrelid=a.attrelid AND ad.adnum=a.attnum WHERE c.table_schema='public' ORDER BY c.table_name,c.ordinal_position`)).rows;
  const idxs = (await sql.query("SELECT indexname, indexdef FROM pg_indexes WHERE schemaname='public' ORDER BY tablename,indexname")).rows;
  const enums = (await sql.query("SELECT t.typname, e.enumlabel FROM pg_type t JOIN pg_enum e ON t.oid=e.enumtypid ORDER BY t.typname, e.enumsortorder")).rows;
  const r = { cols, idxs, enums };
  mkdirSync(OUT,{recursive:true});
  writeFileSync(resolve(OUT,label+'-schema-inventory.json'), JSON.stringify(r,null,2));
  console.log(`${label}: ${cols.length} cols, ${idxs.length} idx, ${enums.filter((v,i,a)=>a.findIndex(x=>x.typname===v.typname)===i).length} enum types`);
  return r;
}

(async ()=>{
  const {Pool}=await import('@neondatabase/serverless');
  const cUrl=process.argv[2], clUrl=process.argv[3];
  if(!cUrl||!clUrl){console.error('args: <canonical_url> <clone_url>');process.exit(1);}
  const pc=new Pool({connectionString:cUrl,max:1,connectionTimeoutMillis:20000});
  const pcl=new Pool({connectionString:clUrl,max:1,connectionTimeoutMillis:20000});
  try{
    await pc.query('SELECT 1'); await pcl.query('SELECT 1');
    const sq={query:(t,p)=>pc.query(t,p)}, sql={query:(t,p)=>pcl.query(t,p)};
    const canon=await inventory(sq,'canonical'), clone=await inventory(sql,'clone');
    
    const diff=(a,b,key)=>{const ma={},mb={};for(const x of a)ma[x[key]||x.indexname||x.typname||x.key]=x;for(const x of b)mb[x[key]||x.indexname||x.typname||x.key]=x;
      const all=[...new Set([...Object.keys(ma),...Object.keys(mb)])];
      return {onlyA:all.filter(k=>ma[k]&&!mb[k]),onlyB:all.filter(k=>!ma[k]&&mb[k]),diff:all.filter(k=>ma[k]&&mb[k]&&JSON.stringify(ma[k])!==JSON.stringify(mb[k]))};};
      
    const colDiff=diff(canon.cols,clone.cols,'key');
    const idxDiff=diff(canon.idxs,clone.idxs,'indexname');
    const enumDiff=diff(canon.enums,clone.enums,'typname');
    const doc={columns:colDiff,indexes:idxDiff,enums:enumDiff};
    writeFileSync(resolve(OUT,'schema-diff-pr20.json'),JSON.stringify(doc,null,2));
    console.log(`\nColumns: ${colDiff.onlyB.length} clone-only, ${colDiff.onlyA.length} canon-only, ${colDiff.diff.length} different`);
    console.log(`Indexes: ${idxDiff.onlyB.length} clone-only, ${idxDiff.onlyA.length} canon-only, ${idxDiff.diff.length} different`);
    console.log(`Enums: ${enumDiff.onlyB.length} clone-only, ${enumDiff.onlyA.length} canon-only, ${enumDiff.diff.length} different`);
    if(colDiff.onlyB.length>0)console.log('\nClone-only columns:',colDiff.onlyB.slice(0,20).join(', ')+(colDiff.onlyB.length>20?`...(+${colDiff.onlyB.length-20})`:''));
    if(idxDiff.onlyB.length>0)console.log('\nClone-only indexes:',idxDiff.onlyB.slice(0,20).join(', '));
    if(enumDiff.onlyB.length>0)console.log('\nClone-only enums:',enumDiff.onlyB.join(', '));
  }finally{await pc.end();await pcl.end();}
})();
