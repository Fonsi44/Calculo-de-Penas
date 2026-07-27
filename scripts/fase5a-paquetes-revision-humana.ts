/**
 * Fase 5A — Generar paquetes de revisión humana para el Lote 3.
 *
 * Para cada artículo cuyo estado NO es 'completed', genera un paquete
 * Markdown con: claim, texto, importancia, norma, fuentes, contradicción,
 * pregunta concreta, opciones, impacto, propuesta prudente y campos vacíos
 * para revisor, fecha, decisión y observaciones.
 *
 * Lee:
 *   - docs/audits/fase5a-lote3-estados-finales.json
 *   - docs/audits/fase5a-lote3-claims-finales.json
 * Escribe:
 *   - docs/audits/fase5a-lote3-revision-humana/index.md
 *   - docs/audits/fase5a-lote3-revision-humana/<slug>.md (uno por artículo)
 *
 * Uso:
 *   npx tsx scripts/fase5a-paquetes-revision-humana.ts
 */
import * as fs from 'fs';
import * as path from 'path';

const ROOT = process.cwd();
const AUDITS = path.join(ROOT, 'docs', 'audits');
const OUTDIR = path.join(AUDITS, 'fase5a-lote3-revision-humana');

function main() {
  fs.mkdirSync(OUTDIR, { recursive: true });

  const estados = JSON.parse(
    fs.readFileSync(path.join(AUDITS, 'fase5a-lote3-estados-finales.json'), 'utf8'),
  );
  const claimsData = JSON.parse(
    fs.readFileSync(path.join(AUDITS, 'fase5a-lote3-claims-finales.json'), 'utf8'),
  );
  const claimsPorSlug = new Map<string, any[]>();
  for (const c of claimsData.claims) {
    if (!claimsPorSlug.has(c.slug)) claimsPorSlug.set(c.slug, []);
    claimsPorSlug.get(c.slug)!.push(c);
  }

  const pendientes = estados.estados.filter(
    (e: any) => e.estadoFinal !== 'completed',
  );

  const index: string[] = [
    '# Fase 5A — Lote 3: Paquetes de revisión humana',
    '',
    `- **Fase:** 5A · **Lote:** 3`,
    `- **Fecha:** ${new Date().toISOString()}`,
    `- **Artículos pendientes:** ${pendientes.length} (de 15)`,
    '',
    'Cada archivo `<slug>.md` contiene un paquete estructurado para revisión',
    'jurídica humana. Los campos del revisor (decisión, fecha, observaciones)',
    'están vacíos y deben ser completados por el abogado revisor.',
    '',
    '## Índice',
    '',
    '| # | Slug | Estado | Claims pendientes | Archivo |',
    '|---|------|--------|-------------------|---------|',
  ];

  let n = 0;
  for (const e of pendientes) {
    n++;
    const claims = (claimsPorSlug.get(e.slug) || []).filter(
      (c) =>
        c.decision === 'needs_human_review' ||
        c.decision === 'unsupported' ||
        c.decision === 'ambiguous' ||
        c.decision === 'corrected',
    );
    index.push(
      `| ${n} | ${e.slug} | ${e.estadoFinal} | ${claims.length} | [${e.slug}.md](./${e.slug}.md) |`,
    );

    // Generar paquete por artículo
    const body: string[] = [
      `# Revisión humana — ${e.slug}`,
      '',
      `- **Estado actual:** ${e.estadoFinal}`,
      `- **Razón:** ${e.razon}`,
      `- **Total claims:** ${e.totalClaims} · **Centrales:** ${e.centrales}`,
      `- **Confirmados:** ${e.centralConfirmed} · **Corregidos:** ${e.centralCorrected} · **Sin resolver:** ${e.centralUnresolved}`,
      `- **Fuentes oficiales:** ${e.officialSources}`,
      '',
      '---',
      '',
      '## Claims pendientes de revisión',
      '',
    ];

    for (const c of claims) {
      body.push(`### Claim \`${c.id}\` — ${c.decision} (${c.importancia})`);
      body.push('');
      body.push(`- **Texto exacto:** ${c.textoExacto}`);
      body.push(`- **Contexto:** ${(c.contexto || '').slice(0, 250)}`);
      body.push(`- **Norma mencionada:** ${c.normaMencionada}`);
      body.push(`- **Artículo mencionado:** ${c.articuloMencionado || '(sin cita)'}`);
      body.push(`- **Tipo:** ${c.tipo}`);
      body.push(`- **Motivo de la clasificación:** ${c.motivo}`);
      if (c.fuenteCanonicaVerificada)
        body.push(`- **Fuente canónica verificada:** ${c.fuenteCanonicaVerificada}`);
      if (c.fragmento) body.push(`- **Fragmento canon:** ${(c.fragmento || '').slice(0, 200)}`);
      body.push('');
      body.push('**Pregunta para el revisor:** ¿La afirmación es jurídicamente');
      body.push('correcta tal como está, requiere sustitución por la cita correcta,');
      body.push('o debe eliminarse?');
      body.push('');
      body.push('**Opciones:**');
      body.push('- (a) Confirmar (la afirmación y cita son correctas).');
      body.push('- (b) Corregir (definir texto sustituto y fuente).');
      body.push('- (c) Eliminar (la afirmación no es verificable).');
      body.push('- (d) Requiere más investigación (especificar).');
      body.push('');
      body.push('**Propuesta prudente:** dejar el claim como `needs_human_review`');
      body.push('hasta que el revisor decida. No modificar el body sin decisión explícita.');
      body.push('');
      body.push('**Campos del revisor (vacíos — no completar por IA):**');
      body.push('- Revisor: ________');
      body.push('- Fecha: ________');
      body.push('- Decisión: ________');
      body.push('- Observaciones: ________');
      body.push('');
      body.push('---');
      body.push('');
    }

    fs.writeFileSync(path.join(OUTDIR, `${e.slug}.md`), body.join('\n'));
  }

  fs.writeFileSync(path.join(OUTDIR, 'index.md'), index.join('\n') + '\n');
  console.log(`OK: ${pendientes.length} paquetes generados en ${OUTDIR}`);
}

main();
