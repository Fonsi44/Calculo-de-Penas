import fs from 'fs';
import path from 'path';

function main() {
  const dataDir = path.resolve(process.cwd(), 'data');
  const seoDir = path.join(dataDir, 'seo');
  const googleDir = path.join(dataDir, 'google');
  const bingDir = path.join(dataDir, 'bing');

  const gscPath = path.join(googleDir, 'gsc-live.json');
  const ga4Path = path.join(googleDir, 'ga4-live.json');
  const bingPath = path.join(bingDir, 'bing-live.json');
  const indexabilityPath = path.join(seoDir, 'url-indexability-audit.json');

  let gscData: any = {};
  try { gscData = JSON.parse(fs.readFileSync(gscPath, 'utf-8')); } catch(e){}

  let ga4Data: any = {};
  try { ga4Data = JSON.parse(fs.readFileSync(ga4Path, 'utf-8')); } catch(e){}

  let bingData: any = {};
  try { bingData = JSON.parse(fs.readFileSync(bingPath, 'utf-8')); } catch(e){}

  let indexabilityData: any[] = [];
  try { indexabilityData = JSON.parse(fs.readFileSync(indexabilityPath, 'utf-8')); } catch(e){}

  const currentPath = path.join(seoDir, 'seo-snapshot-current.json');
  const mdPath = path.join(seoDir, 'seo-snapshot-current.md');
  const prevPath = path.join(seoDir, 'seo-snapshot-previous.json');

  const snapshot = {
    date: new Date().toISOString(),
    gsc: {
      clicks: gscData.summary?.clicks || 0,
      impressions: gscData.summary?.impressions || 0,
      ctr: gscData.summary?.ctr || 0,
      position: gscData.summary?.position || 0,
      topPages: (gscData.pages || []).slice(0, 10),
      topQueries: (gscData.queries || []).slice(0, 10),
    },
    ga4: {
      users: ga4Data.overview?.totalUsers || 0,
      sessions: ga4Data.overview?.sessions || 0,
      views: ga4Data.overview?.pageViews || 0,
      topPages: (ga4Data.topPages || []).slice(0, 10)
    },
    bing: {
      crawled: bingData.summary?.crawled || 0,
      crawlErrors: bingData.summary?.crawlErrors || 0,
      indexErrors: bingData.summary?.indexErrors || 0
    },
    indexability: {
      total: indexabilityData.length,
      correct: indexabilityData.filter(d => d.status.includes('correcta')).length,
      orphans: indexabilityData.filter(d => d.status.includes('Huérfano')).length
    }
  };

  const historyDir = path.join(seoDir, 'history');
  if (!fs.existsSync(historyDir)) {
    fs.mkdirSync(historyDir, { recursive: true });
  }

  // Guardar actual a previous si existe actual pero estamos regenerando
  if (fs.existsSync(currentPath)) {
     const existingCurrent = fs.readFileSync(currentPath, 'utf-8');
     fs.writeFileSync(prevPath, existingCurrent);
     
     // También guardar en history con la fecha del snapshot que estamos rotando
     try {
       const existingJson = JSON.parse(existingCurrent);
       const dateStr = new Date(existingJson.date).toISOString().split('T')[0];
       fs.writeFileSync(path.join(historyDir, `seo-snapshot-${dateStr}.json`), existingCurrent);
     } catch (e) {
       // ignorar si no se pudo parsear
     }
  }

  fs.writeFileSync(currentPath, JSON.stringify(snapshot, null, 2));

  let md = `# SEO Snapshot — ${new Date().toLocaleDateString()}\n\n`;
  
  if (fs.existsSync(prevPath)) {
    const prev = JSON.parse(fs.readFileSync(prevPath, 'utf-8'));
    md += `*Comparado con snapshot anterior del: ${new Date(prev.date).toLocaleDateString()}*\n\n`;
    
    const clickDiff = snapshot.gsc.clicks - (prev.gsc.clicks || 0);
    const impDiff = snapshot.gsc.impressions - (prev.gsc.impressions || 0);
    
    md += `## Deltas GSC\n`;
    md += `- **Clics**: ${snapshot.gsc.clicks} (${clickDiff >= 0 ? '+' : ''}${clickDiff})\n`;
    md += `- **Impresiones**: ${snapshot.gsc.impressions} (${impDiff >= 0 ? '+' : ''}${impDiff})\n\n`;
  } else {
    md += `*Este snapshot sirve como baseline inicial.*\n\n`;
  }

  md += `## Resumen Global\n`;
  md += `- **Google Search Console**: ${snapshot.gsc.clicks} clics, ${snapshot.gsc.impressions} impresiones, CTR: ${(snapshot.gsc.ctr * 100).toFixed(2)}%\n`;
  md += `- **Google Analytics 4**: ${snapshot.ga4.users} usuarios, ${snapshot.ga4.views} vistas\n`;
  md += `- **Bing WMT**: ${snapshot.bing.crawled} rastreadas, ${snapshot.bing.crawlErrors} errores de rastreo\n`;
  md += `- **Indexabilidad**: ${snapshot.indexability.correct} correctas, ${snapshot.indexability.orphans} huérfanas / revisables de un total de ${snapshot.indexability.total} URLs procesadas.\n\n`;

  md += `## Top Páginas (GSC Clics)\n`;
  snapshot.gsc.topPages.forEach((p: any) => {
    md += `- ${p.page}: ${p.clicks} clics (${p.impressions} imp)\n`;
  });

  fs.writeFileSync(mdPath, md);
  console.log('Snapshot generado:', mdPath);
}

main();
