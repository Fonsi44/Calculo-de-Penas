/**
 * Fase 4A — Generar docs de fuentes y correcciones propuestas.
 *
 * Lee docs/audits/fase4a-lote2-claims-finales.json y produce:
 *   - docs/audits/fase4a-lote2-fuentes.md            (catálogo de fuentes oficiales/institucionales)
 *   - docs/audits/fase4a-lote2-correcciones-propuestas.md (claims corrected con texto sustituto)
 *
 * Las correcciones se generan SOLO cuando hay evidencia canónica o de fuente
 * oficial. Los claims sin evidencia firme quedan como needs_human_review
 * (no se inventa redacción sustituta).
 *
 * Uso:
 *   npx tsx scripts/fase4a-generar-fuentes-correcciones.ts
 */
import * as fs from 'fs';
import * as path from 'path';

const ROOT = process.cwd();
const AUDITS = path.join(ROOT, 'docs', 'audits');

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
  canonEncontrado: { articulo: string; tema?: string; epigrafe?: string } | null;
  pertinente: boolean;
  textoAnterior: string | null;
  textoSustituto: string | null;
  fuenteCorreccion: string | null;
  fragmento: string | null;
}

// --- Catálogo de fuentes oficiales/institucionales usadas en la investigación
// (verificadas vía WebSearch/WebFetch en dominios .gob.hn y organismos que
// reproducen normas oficiales).
const FUENTES_OFICIALES = [
  {
    titulo: 'Código de Familia de Honduras (Decreto 76-84)',
    institucion: 'Poder Judicial de Honduras — CEDIJ',
    url: 'https://www.poderjudicial.gob.hn/Cedij/Cdigos/Codigo%20de%20Familia%20(Actualizado%20con%20Reformas%20Ley%20de%20Adopciones).pdf',
    procedencia: 'official_primary',
    decretoNorma: 'Decreto 76-84',
    descripcion:
      'Texto oficial consolidado del Código de Familia. Regula pensión alimenticia (Arts. 207-225, 211 orden de obligados), divorcio (Arts. 236-243) y retención judicial de hasta el 50% del salario por incumplimiento alimentario.',
  },
  {
    titulo: 'Código de Familia de Honduras (biblioteca legislativa)',
    institucion: 'Tribunal Superior de Cuentas de Honduras',
    url: 'https://www.tsc.gob.hn/biblioteca/index.php/codigos/608-codigo-de-familia',
    procedencia: 'official_primary',
    decretoNorma: 'Decreto 76-84',
    descripcion:
      'Índice oficial del TSC con enlace al texto íntegro del Decreto 76-84 y sus reformas (Decreto 31-2015).',
  },
  {
    titulo: 'Código de Familia (reproducción institucional)',
    institucion: 'Organización de Estados Americanos (OEA)',
    url: 'https://www.oas.org/dil/esp/Codigo_de_Familia_Honduras.pdf',
    procedencia: 'institutional_academic',
    decretoNorma: 'Decreto 76-84',
    descripcion:
      'Reproducción íntegra del Código de Familia hospedada por la OEA. Clasificada como institucional (reproduce norma oficial hondureña).',
  },
];

// --- Correcciones propuestas con evidencia firme (canon del repo o fuente oficial)
// Solo se documenta corrección cuando hay seguridad. El resto queda needs_human_review.
interface Correccion {
  claimId: string;
  slug: string;
  textoAnterior: string;
  textoSustituto: string;
  motivo: string;
  fuente: string;
  articulo: string;
  fragmento: string;
  impactoBody: string;
}

function construirCorrecciones(claims: Claim[]): Correccion[] {
  const out: Correccion[] = [];
  for (const c of claims) {
    if (c.decision !== 'corrected') continue;
    // Pensión alimenticia porcentaje: Arts. 1069 y 1230 del blog son del Código
    // Civil PERO tratan temas ajenos (asignación desde día cierto / tutores y
    // herencias). La regulación real de pensión está en Código de Familia.
    if (
      c.slug === 'pension-alimenticia-porcentaje-honduras-2026' &&
      (c.articuloMencionado === 'Art. 1069 CF' || c.articuloMencionado === 'Art. 1230 CF')
    ) {
      out.push({
        claimId: c.id,
        slug: c.slug,
        textoAnterior: c.textoExacto,
        textoSustituto: 'Código de Familia (Arts. 211 y siguientes)',
        motivo:
          'El artículo citado (Código Civil) no regula pensión alimenticia: Art. 1069 CC trata "asignación desde día cierto" y Art. 1230 CC trata "tutores, curadores y partición de herencias". La pensión alimenticia se regula en el Código de Familia (Decreto 76-84), Arts. 211 y ss.',
        fuente: 'Poder Judicial de Honduras — CEDIJ (poderjudicial.gob.hn)',
        articulo: 'Art. 211 y ss. Código de Familia',
        fragmento:
          'Art. 211 CF establece el orden jerárquico de familiares con derecho a alimentos; Arts. 217-225 fijan la obligación y el monto según necesidades y capacidad.',
        impactoBody:
          'Reemplazar la cita "Artículo 1069/1230 del Código Civil" por la referencia correcta al Código de Familia.',
      });
    }
    if (
      c.slug === 'pension-alimenticia-porcentaje-honduras-2026' &&
      c.articuloMencionado === 'Art. 1593 CF'
    ) {
      out.push({
        claimId: c.id,
        slug: c.slug,
        textoAnterior: c.textoExacto,
        textoSustituto: 'Código de Familia (Decreto 76-84)',
        motivo:
          'El Código de Familia no llega al Art. 1593 (su articulado no supera los 500). Cita numérica inválida; debe sustituirse por referencia genérica al Código de Familia.',
        fuente: 'Poder Judicial de Honduras — CEDIJ (poderjudicial.gob.hn)',
        articulo: 'Código de Familia (Decreto 76-84)',
        fragmento: 'El Código de Familia de Honduras no contiene un Art. 1593.',
        impactoBody: 'Eliminar o sustituir el número de artículo inexistente.',
      });
    }
  }
  return out;
}

function main() {
  const claimsJson = JSON.parse(
    fs.readFileSync(path.join(AUDITS, 'fase4a-lote2-claims-finales.json'), 'utf8'),
  );
  const claims: Claim[] = claimsJson.claims;
  const correcciones = construirCorrecciones(claims);

  // --- fuentes.md ---
  const fuentesMd = [
    '# Fase 4A — Fuentes del Lote 2',
    '',
    `**Fecha:** ${new Date().toISOString()}`,
    '**Clasificación de procedencia:** `official_primary` | `official_secondary` | `institutional_academic` | `canonical_internal_verified` | `commercial_secondary` | `unverified`',
    '',
    '> Reglas (§6 del enunciado): no se usan blogs ni webs comerciales como fuente',
    '> primaria. Una fuente institucional solo cuenta cuando reproduce una norma',
    '> oficial con trazabilidad. No se inventan páginas, artículos ni URLs.',
    '',
    '## 1. Fuentes oficiales e institucionales verificadas',
    '',
    '| Título | Institución | Procedencia | Decreto/Norma | URL |',
    '|--------|------------|-------------|---------------|-----|',
  ];
  for (const f of FUENTES_OFICIALES) {
    fuentesMd.push(
      `| ${f.titulo} | ${f.institucion} | \`${f.procedencia}\` | ${f.decretoNorma} | ${f.url} |`,
    );
  }
  fuentesMd.push('', '## 2. Descripción detallada', '');
  for (const f of FUENTES_OFICIALES) {
    fuentesMd.push(`### ${f.titulo}`, '', `- **Institución:** ${f.institucion}`, `- **Procedencia:** \`${f.procedencia}\``, `- **Decreto/Norma:** ${f.decretoNorma}`, `- **URL:** ${f.url}`, `- **Descripción:** ${f.descripcion}`, '');
  }
  fuentesMd.push(
    '## 3. Fuentes canónicas internas del repositorio',
    '',
    'Para verificación automática de existencia/pertinencia de artículos citados:',
    '',
    '| Archivo | Cobertura | Uso |',
    '|---------|-----------|-----|',
    '| `data/codigo_civil.json` | 2359 arts. (Art. 1 CC – Art. 2372 CC) | Verificación citas CC |',
    '| `data/codigo_comercio.json` | Arts. Código Comercio | Verificación citas Co |',
    '| `data/codigo_trabajo.json` | Arts. Código Trabajo | Verificación citas CT |',
    '| `data/codigo_tributario.json` | Arts. Código Tributario | Verificación citas Tr |',
    '| `data/codigo_familia_verificado.json` | 11 arts. clave (207-244) | Verificación parcial CF |',
    '| `data/codigo_procesal_penal_verificado.json` | Arts. clave CPP | Verificación parcial CPP |',
    '| `data/articulos_cp.json` | 635 arts. Código Penal | Verificación citas CP |',
    '| `data/articulos_constitucion.json` | 378 arts. Constitución | Verificación citas Const. |',
    '',
    '> **Limitación declarada:** los canónicos `codigo_familia_verificado.json` y',
    '> `codigo_procesal_penal_verificado.json` solo contienen los artículos que el',
    '> despacho usa para cálculo de penas, no el código completo. Los claims sobre',
    '> artículos fuera de ese subconjunto requieren verificación externa (se marcan',
    '> `needs_human_review` si no hay fuente oficial accesible).',
    '',
    '## 4. Resumen de cobertura de claims',
    '',
    `- Total claims: ${claimsJson.totalClaims}`,
    `- confirmed: ${claimsJson.porDecision.confirmed ?? 0}`,
    `- corrected: ${claimsJson.porDecision.corrected ?? 0} (con corrección propuesta: ${correcciones.length})`,
    `- needs_human_review: ${claimsJson.porDecision.needs_human_review ?? 0}`,
    `- unsupported: ${claimsJson.porDecision.unsupported ?? 0}`,
    '',
  );
  fs.writeFileSync(path.join(AUDITS, 'fase4a-lote2-fuentes.md'), fuentesMd.join('\n'));

  // --- correcciones-propuestas.md ---
  const corrMd = [
    '# Fase 4A — Correcciones propuestas del Lote 2',
    '',
    `**Fecha:** ${new Date().toISOString()}`,
    '',
    '> Solo se proponen correcciones respaldadas por fuente canónica verificable o',
    '> fuente oficial hondureña. Los claims interpretativos o sin evidencia firme',
    '> NO reciben redacción sustituta (quedan en `needs_human_review`).',
    '',
    `## Total: ${correcciones.length} correcciones con evidencia firme`,
    '',
  ];
  for (const c of correcciones) {
    corrMd.push(
      `## ${c.claimId} — \`${c.slug}\``,
      '',
      `- **Texto anterior:** ${c.textoAnterior}`,
      `- **Texto sustituto:** ${c.textoSustituto}`,
      `- **Motivo:** ${c.motivo}`,
      `- **Fuente:** ${c.fuente}`,
      `- **Artículo:** ${c.articulo}`,
      `- **Fragmento:** ${c.fragmento}`,
      `- **Impacto en el body:** ${c.impactoBody}`,
      '',
    );
  }
  corrMd.push(
    '## Claims corrected SIN sustitución automática',
    '',
    'Los siguientes claims están marcados `corrected` pero no tienen sustitución',
    'automática porque requieren decisión editorial humana sobre la redacción:',
    '',
  );
  const sinSust = claims.filter(
    (c) => c.decision === 'corrected' && !correcciones.some((co) => co.claimId === c.id),
  );
  if (sinSust.length === 0) {
    corrMd.push('_(ninguno: todos los corrected tienen sustitución propuesta)_', '');
  } else {
    for (const c of sinSust) {
      corrMd.push(
        `- **${c.id}** (\`${c.slug}\`): ${c.articuloMencionado} — ${c.motivo.slice(0, 100)}…`,
      );
    }
    corrMd.push('');
  }
  corrMd.push(
    '## Aplicación',
    '',
    'Las correcciones se aplican en la Fase 4A §8 mediante',
    '`scripts/fase4a-aplicar-correcciones.ts` con dry-run, ocurrencia única, hash',
    'antes/después e idempotencia. La aplicación al body se verifica después.',
    '',
  );
  fs.writeFileSync(path.join(AUDITS, 'fase4a-lote2-correcciones-propuestas.md'), corrMd.join('\n'));

  console.log(`OK: ${correcciones.length} correcciones propuestas con evidencia firme.`);
  console.log(`   ${sinSust.length} claims corrected requieren redacción humana.`);
  console.log('  -> docs/audits/fase4a-lote2-fuentes.md');
  console.log('  -> docs/audits/fase4a-lote2-correcciones-propuestas.md');
}

main();
