import fs from 'fs';
import path from 'path';

function loadJson(p: string) {
  try { return JSON.parse(fs.readFileSync(p, 'utf-8')); } catch (e) { return null; }
}

function main() {
  const bodiesPath = path.join(__dirname, '../docs/audits/fase6-lote4-bodies.json');
  const bodies = loadJson(bodiesPath);
  if (!bodies) throw new Error("No bodies found");

  let applied = 0;
  
  bodies.forEach((post: any) => {
    const revisionPath = path.join(__dirname, `../docs/audits/fase6-lote4-revision-${post.slug}.json`);
    const revision = loadJson(revisionPath);
    if (!revision) {
      console.log(`Revisión pendiente para: ${post.slug}`);
      return;
    }

    if (revision.estado_final) {
      post.aiReviewStatus = revision.estado_final;
    }

    if (revision.correcciones && Array.isArray(revision.correcciones)) {
      revision.correcciones.forEach((c: any) => {
        if (c.texto_anterior && c.texto_nuevo) {
          post.body = post.body.replace(c.texto_anterior, c.texto_nuevo);
          applied++;
        }
      });
    }
  });

  fs.writeFileSync(bodiesPath, JSON.stringify(bodies, null, 2));
  console.log(`Correcciones aplicadas: ${applied}`);
}

main();
