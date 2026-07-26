/**
 * Fase 4A — Generar paquetes de revisión humana.
 *
 * Para cada artículo cuyo estado derivado es `needs_human_review`, crea un
 * paquete con los campos del enunciado §11:
 *   artículo, slug, claim, texto actual, norma relacionada, fuentes,
 *   fragmentos, contradicción, pregunta concreta para el abogado, opciones de
 *   resolución, impacto, redacción prudente propuesta, campos vacíos para
 *   revisor/fecha/decisión/observaciones.
 *
 * NO marca la revisión humana como realizada (campos vacíos para el revisor).
 *
 * Salida:
 *   - docs/audits/fase4a-lote2-revision-humana/index.md
 *   - docs/audits/fase4a-lote2-revision-humana/<slug>.md (uno por artículo)
 *
 * Uso:
 *   npx tsx scripts/fase4a-paquetes-revision-humana.ts
 */
import * as fs from 'fs';
import * as path from 'path';

const ROOT = process.cwd();
const AUDITS = path.join(ROOT, 'docs', 'audits');
const DIR = path.join(AUDITS, 'fase4a-lote2-revision-humana');

interface Claim {
  id: string;
  slug: string;
  textoExacto: string;
  contexto: string;
  tipo: string;
  importancia: string;
  normaMencionada: string;
  articuloMencionado: string;
  decision: string;
  motivo: string;
  canonEncontrado: { articulo: string; tema?: string } | null;
  fragmento: string | null;
}

function main() {
  fs.mkdirSync(DIR, { recursive: true });
  const estados = JSON.parse(
    fs.readFileSync(path.join(AUDITS, 'fase4a-lote2-estados-finales.json'), 'utf8'),
  );
  const claims: Claim[] = JSON.parse(
    fs.readFileSync(path.join(AUDITS, 'fase4a-lote2-claims-finales.json'), 'utf8'),
  ).claims;
  const items: { slug: string; title?: string }[] = JSON.parse(
    fs.readFileSync(path.join(AUDITS, 'blog-inventario.json'), 'utf8'),
  );
  const itemPorSlug = new Map(items.map((i) => [i.slug, i]));

  const pendientes = estados.estados.filter(
    (e: { estadoFinal: string }) => e.estadoFinal === 'needs_human_review',
  );

  const index = [
    '# Fase 4A — Paquetes de revisión humana del Lote 2',
    '',
    `**Fecha:** ${new Date().toISOString()}`,
    '**Estado:** PENDIENTE de revisión jurídica humana. No marcar como realizada.',
    '',
    `Total de artículos que requieren revisión humana: **${pendientes.length}**`,
    '',
    '| Artículo | Claims pendientes | Archivo |',
    '|----------|-------------------|---------|',
  ];

  for (const p of pendientes) {
    const slug = p.slug;
    const item = itemPorSlug.get(slug);
    const titulo = item?.title ?? slug;
    const nombreArchivo = `${slug}.md`;
    const claimsArticulo = claims.filter(
      (c) =>
        c.slug === slug &&
        (c.decision === 'needs_human_review' ||
          c.decision === 'corrected' ||
          c.decision === 'unsupported' ||
          c.decision === 'ambiguous'),
    );
    index.push(`| ${titulo} | ${claimsArticulo.length} | [${nombreArchivo}](./${nombreArchivo}) |`);

    const md: string[] = [];
    md.push(`# Revisión humana — ${titulo}`, '');
    md.push(`**Slug:** \`${slug}\``);
    md.push(`**Estado derivado:** \`needs_human_review\``);
    md.push(`**Fecha de generación:** ${new Date().toISOString()}`);
    md.push('');
    md.push('> Este paquete NO constituye revisión jurídica realizada. Los campos del');
    md.push('> revisor están vacíos a propósito. La decisión final corresponde a un');
    md.push('> abogado del despacho.', '');
    md.push('---', '');

    for (const c of claimsArticulo) {
      md.push(`## Claim \`${c.id}\``, '');
      md.push(`- **Texto actual en el body:** ${c.textoExacto}`);
      md.push(`- **Contexto:** ${c.contexto.slice(0, 200)}${c.contexto.length > 200 ? '…' : ''}`);
      md.push(`- **Tipo:** ${c.tipo} | **Importancia:** ${c.importancia}`);
      md.push(`- **Norma mencionada:** ${c.normaMencionada}`);
      md.push(`- **Artículo mencionado:** ${c.articuloMencionado || '(ninguno)'}`);
      md.push(`- **Decisión automática:** \`${c.decision}\``);
      md.push(`- **Motivo automático:** ${c.motivo}`);
      md.push(`- **Canon encontrado:** ${c.canonEncontrado ? `${c.canonEncontrado.articulo} (tema: ${c.canonEncontrado.tema ?? 'n/a'})` : 'ninguno'}`);
      md.push(`- **Fragmento canónico:** ${c.fragmento ?? 'no disponible'}`);
      md.push('');
      md.push('### Pregunta concreta para el abogado', '');
      const pregunta = preguntaPorTipo(c);
      md.push(`> ${pregunta}`, '');
      md.push('### Opciones de resolución', '');
      md.push('- [ ] Confirmar el texto tal cual (justificar con fuente oficial).');
      md.push('- [ ] Corregir la cita/artículo (indicar sustitución).');
      md.push('- [ ] Eliminar la afirmación por no verificable.');
      md.push('- [ ] Replantear con redacción más prudente.');
      md.push('');
      md.push('### Redacción prudente propuesta (sugerencia, no vinculante)', '');
      md.push(`> ${redaccionPrudente(c)}`, '');
      md.push('### Campos para el revisor', '');
      md.push('- **Revisor:** ____________________');
      md.push('- **Fecha:** ____________________');
      md.push('- **Decisión:** ____________________');
      md.push('- **Observaciones:** ____________________');
      md.push('- **Fuente oficial verificada (URL/decreto/página):** ____________________');
      md.push('');
      md.push('---', '');
    }

    fs.writeFileSync(path.join(DIR, nombreArchivo), md.join('\n'));
  }

  index.push('', '## Reglas', '');
  index.push('- Ningún paquete se considera resuelto hasta que un abogado llene los campos.');
  index.push('- La revisión IA NO sustituye a la revisión jurídica humana (invariante 5).');
  index.push('- Resuelto un claim, el estado del artículo se recalcula con `deriveReviewStatus`.');
  index.push('');
  fs.writeFileSync(path.join(DIR, 'index.md'), index.join('\n'));

  console.log(`OK: ${pendientes.length} paquetes de revisión humana generados.`);
  console.log(`  -> ${DIR}/index.md + ${pendientes.length} archivos por artículo.`);
}

function preguntaPorTipo(c: Claim): string {
  if (c.tipo === 'norma' && c.decision === 'unsupported') {
    return `¿El artículo/norma "${c.articuloMencionado}" es realmente aplicable a este caso? No se encontró en el canon del repo. Verifique en La Gaceta o el código oficial.`;
  }
  if (c.tipo === 'norma' && c.decision === 'corrected') {
    return `La cita "${c.articuloMencionado}" no es pertinente o no existe. ¿Cuál es la referencia normativa correcta que debe aparecer en el body?`;
  }
  if (c.tipo === 'plazo') {
    return `El plazo "${c.textoExacto}" debe verificarse contra la norma aplicable. ¿Es correcto y procede de qué artículo?`;
  }
  if (c.tipo === 'pena') {
    return `La pena "${c.textoExacto}" debe confirmarse contra el Código Penal vigente. ¿Es exacta y corresponde al delito referido?`;
  }
  if (c.tipo === 'requisito') {
    return `El requisito "${c.textoExacto}" (porcentaje jurídico) debe verificarse. ¿Es el límite legal correcto y en qué norma está?`;
  }
  return `¿Es verificable jurídicamente esta afirmación? Indique fuente oficial.`;
}

function redaccionPrudente(c: Claim): string {
  if (c.tipo === 'plazo' || c.tipo === 'pena' || c.tipo === 'requisito') {
    return `Recomendable formular como "conforme al artículo X de [norma], el plazo/pena/límite aplicable es …" una vez verificada la fuente exacta.`;
  }
  return `Si no se puede verificar la cita con fuente oficial, reformular eliminando la referencia concreta o sustituyéndola por la norma correcta.`;
}

main();
