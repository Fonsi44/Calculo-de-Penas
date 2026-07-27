import fs from 'fs';
import path from 'path';

function main() {
  const args = process.argv.slice(2);
  const loteNumStr = args.find(a => a.startsWith('--lote='))?.split('=')[1];
  if (!loteNumStr) {
    console.error("Missing --lote=N parameter");
    process.exit(1);
  }
  const loteNum = parseInt(loteNumStr);

  const planPath = path.join(__dirname, '../docs/audits/fase6-plan-ejecucion-lotes.json');
  const plan = JSON.parse(fs.readFileSync(planPath, 'utf-8'));
  const lote = plan.lotes.find((l: any) => l.numero === loteNum);
  if (!lote) {
    console.error(`Lote ${loteNum} not found in plan`);
    process.exit(1);
  }

  const loteDir = path.join(__dirname, `../docs/audits/fase6/lote-${loteNum}`);
  const summary = {
    lote: loteNum,
    total: lote.cantidad,
    completed: 0,
    corrected: 0,
    needs_human_review: 0,
    blocked: 0,
    detalles: [] as any[]
  };

  for (const slug of lote.slugs) {
    const postDir = path.join(loteDir, slug);
    const entradaPath = path.join(postDir, 'entrada.json');
    const pasadaAPath = path.join(postDir, 'pasada-a.json');
    const pasadaBPath = path.join(postDir, 'pasada-b.json');

    if (!fs.existsSync(pasadaAPath) || !fs.existsSync(pasadaBPath)) {
      console.warn(`Missing Pasada A or B for ${slug}, marking as needs_human_review`);
      summary.needs_human_review++;
      summary.detalles.push({ slug, estadoFinal: 'needs_human_review', razon: 'Falta Pasada A o B' });
      continue;
    }

    const entrada = JSON.parse(fs.readFileSync(entradaPath, 'utf-8'));
    const a = JSON.parse(fs.readFileSync(pasadaAPath, 'utf-8'));
    const b = JSON.parse(fs.readFileSync(pasadaBPath, 'utf-8'));

    let estadoFinal = 'completed';
    let razon = 'A y B coinciden plenamente';
    const correcciones = [];

    // Analyze disagreements
    // If Pasada B rejects A's findings, or suggests different status
    const proposedByA = a.estadoPropuesto || a.estadoFinal || a.status;
    const proposedByB = b.estadoPropuesto || b.estadoFinal || b.status;
    
    // Check for conflicting general status
    // Treat 'validado', 'completed', 'completado' as similar
    const normaliseStatus = (s: string) => {
      if (!s) return 'completed';
      const ls = s.toLowerCase();
      if (ls === 'validado' || ls === 'completed' || ls === 'completado' || ls === 'ready') return 'completed';
      return ls;
    };

    const normA = normaliseStatus(proposedByA);
    const normB = normaliseStatus(proposedByB);

    const requiresHuman = 
      a.needs_human_review === true || 
      b.needs_human_review === true || 
      a.requires_human === true || 
      b.requires_human === true || 
      a.requiresHuman === true || 
      b.requiresHuman === true || 
      b.estadoPropuesto === 'needs_human_review' || 
      a.estadoPropuesto === 'needs_human_review';

    if (requiresHuman) {
      estadoFinal = 'needs_human_review';
      razon = 'Uno o ambos subagentes indicaron que requiere revisión humana de abogado.';
    } else if (normA !== normB) {
      estadoFinal = 'needs_human_review';
      razon = `Discrepancia de estado propuesto: A propone "${proposedByA}", B propone "${proposedByB}"`;
    } else if (normA === 'blocked' || normB === 'blocked') {
      estadoFinal = 'blocked';
      razon = 'Bloqueado por uno o ambos subagentes';
    }

    // Match by claim text or id
    const getClaimKey = (c: any) => (c.claimId || c.id || c.claim || c.textoExacto || '').trim();

    const bClaimsList = b.claimsRevisados || b.claims || [];
    const bClaimsMap = new Map(bClaimsList.map((c: any) => [getClaimKey(c), c]));
    
    for (const c of (a.claims || [])) {
      const cKey = getClaimKey(c);
      const bRev = bClaimsMap.get(cKey) as any;
      
      const isA_Correction = 
        c.decision === 'corrected' || 
        c.verification_status === 'corrected' || 
        c.verdict === 'incorrecto' || 
        c.verdict === 'parcialmente_correcto';

      if (bRev) {
        // If Pasada B explicitly rejects or says disagree
        const decisionB = bRev.pasadaB_decision || bRev.decisionPasadaB || '';
        const isRejected = decisionB.toLowerCase().includes('rechaz') || bRev.acuerdo === false;

        if (isRejected) {
          // If B rejected A's correction and B wants it to stay as is
          // If the final status is completed/corrected, we can stay completed/corrected (no action or stay correct)
        }
        
        // If corrected and both agreed
        const isApprovedCorrection = isA_Correction && !isRejected;
        if (isApprovedCorrection) {
          correcciones.push({
            claimId: c.id || c.claim,
            textoAnterior: c.textoAnterior || c.textoExacto || c.claim,
            textoSustituto: c.correction || c.textoSustituto || (bRev.segundaFuente ? bRev.segundaFuente.fragmento : ''),
            fuente: c.source || c.fuentes?.[0] || {}
          });
        }
      } else if (isA_Correction) {
        // Corrected in A but B didn't explicitly review or agree?
        if (estadoFinal !== 'needs_human_review') {
          estadoFinal = 'needs_human_review';
          razon = `Claim corregido "${cKey.substring(0, 30)}..." en Pasada A no tiene contraparte en Pasada B`;
        }
      }
    }

    // If there are corrections, the status is 'corrected' unless it's overridden by needs_human_review/blocked
    if (correcciones.length > 0 && estadoFinal === 'completed') {
      estadoFinal = 'corrected';
      razon = 'Correcciones verificadas listas para aplicar';
    }

    // Increment counters
    if (estadoFinal === 'completed') summary.completed++;
    else if (estadoFinal === 'corrected') summary.corrected++;
    else if (estadoFinal === 'needs_human_review') summary.needs_human_review++;
    else if (estadoFinal === 'blocked') summary.blocked++;

    const decision = {
      slug,
      articleHash: entrada.bodyHash || a.articleHash || a.sha256_original || a.hash || '',
      fechaConsolidacion: new Date().toISOString(),
      estadoFinal,
      razon,
      correcciones,
      versionEsquema: '1.0'
    };

    fs.writeFileSync(path.join(postDir, 'decision-final.json'), JSON.stringify(decision, null, 2));
    summary.detalles.push({ slug, estadoFinal, razon, correcciones_count: correcciones.length });
  }

  fs.writeFileSync(path.join(loteDir, 'consolidacion-resumen.json'), JSON.stringify(summary, null, 2));
  console.log(`Consolidation for Lote ${loteNum} completed!`);
  console.log(`Completed: ${summary.completed}, Corrected: ${summary.corrected}, Needs Human: ${summary.needs_human_review}, Blocked: ${summary.blocked}`);
}

main();
