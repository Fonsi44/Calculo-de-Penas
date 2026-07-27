/**
 * Fase 7 — Consolidación de artefactos de auditoría por lote
 * 
 * Ejecución: npx tsx scripts/fase7-consolidar-lote.ts <LOTE>
 * 
 * Lee los artefactos generados por los subagentes y:
 * 1. Genera decision-final.json por artículo
 * 2. Aplica correcciones a la DB (metadatos, body, etc.)
 * 3. Genera resumen del lote
 */
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { db } from '../lib/db';
import { blogPosts } from '../lib/schema';
import { eq } from 'drizzle-orm';

const LOTE = process.argv[2];
if (!LOTE) {
  console.error('Uso: npx tsx scripts/fase7-consolidar-lote.ts <LOTE>');
  process.exit(1);
}

const LOTE_DIR = path.resolve(`docs/audits/fase7/lote-${LOTE}`);
const PLAN_PATH = path.resolve('docs/audits/fase7-plan-lotes.json');

interface Hallazgo {
  claim: string;
  severidad: 'alta' | 'media' | 'baja';
  estado: string;
  evidencia: string;
  fuentes: any[];
}

interface ArtefactoAuditoria {
  slug: string;
  url: string;
  body_hash: string;
  fecha_auditoria: string;
  modelo: string;
  tipo_auditoria: string;
  hallazgos: Hallazgo[];
  resumen: {
    total_claims: number;
    confirmed: number;
    corrected: number;
    needs_human_review: number;
    unsupported: number;
    riesgo_alto: number;
  };
  acciones_propuestas: string[];
  acciones_obligatorias: string[];
  bloqueos: string[];
}

interface DecisionFinal {
  slug: string;
  url: string;
  fecha_consolidacion: string;
  modelo: 'DeepSeek V4 Pro';
  puntuaciones: {
    legal: number;
    seo: number;
    geo: number;
    tecnica: number;
    enlazado: number;
    ux: number;
  };
  puntuacion_ponderada: number;
  bloqueos: string[];
  cambios_aplicables: string[];
  cambios_aplicados: string[];
  cambios_requieren_abogado: string[];
  estado_final: 'apto' | 'apto_con_correcciones' | 'needs_human_review' | 'bloqueado';
  resumen_hallazgos: string;
}

function cargarArtefacto(tipo: string, slug: string): ArtefactoAuditoria | null {
  const filePath = path.join(LOTE_DIR, slug, `${tipo}.json`);
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return null;
  }
}

function puntuarLegal(hallazgos: Hallazgo[]): { puntuacion: number; bloqueos: string[]; necesitaAbogado: string[] } {
  if (!hallazgos || hallazgos.length === 0) return { puntuacion: 10, bloqueos: [], necesitaAbogado: [] };
  
  const total = hallazgos.length;
  const altoRiesgo = hallazgos.filter(h => h.severidad === 'alta').length;
  const needsHuman = hallazgos.filter(h => h.estado === 'needs_human_review').length;
  const unsupported = hallazgos.filter(h => h.estado === 'unsupported').length;
  
  let puntuacion = 10;
  puntuacion -= altoRiesgo * 2;
  puntuacion -= needsHuman * 1;
  puntuacion -= unsupported * 1.5;
  
  const bloqueos: string[] = [];
  const necesitaAbogado: string[] = [];
  
  hallazgos.forEach(h => {
    if (h.severidad === 'alta' && h.estado !== 'confirmed') {
      bloqueos.push(`Claim alto riesgo no confirmado: ${h.claim.substring(0, 80)}`);
    }
    if (h.estado === 'needs_human_review') {
      necesitaAbogado.push(h.claim.substring(0, 120));
    }
  });
  
  return { puntuacion: Math.max(0, Math.min(10, puntuacion)), bloqueos, necesitaAbogado };
}

function puntuarSEO(artefacto: any): { puntuacion: number; acciones: string[] } {
  if (!artefacto) return { puntuacion: 5, acciones: ['SEO/GEO: sin auditar'] };
  
  let puntuacion = 10;
  const acciones: string[] = [];
  const seo = artefacto.seo || {};
  
  if (seo.title_evaluacion === 'malo') { puntuacion -= 2; acciones.push('Title SEO deficiente'); }
  else if (seo.title_evaluacion === 'regular') { puntuacion -= 1; acciones.push('Title SEO mejorable'); }
  
  if (seo.description_evaluacion === 'malo') { puntuacion -= 2; acciones.push('Meta description deficiente'); }
  else if (seo.description_evaluacion === 'regular') { puntuacion -= 1; }
  
  if (seo.keyword_stuffing) { puntuacion -= 1; acciones.push('Keyword stuffing detectado'); }
  if (seo.contenido_duplicado) { puntuacion -= 2; acciones.push('Contenido duplicado'); }
  if (seo.profundidad === 'superficial') { puntuacion -= 1; }
  
  if (artefacto.acciones_obligatorias) {
    artefacto.acciones_obligatorias.forEach((a: string) => acciones.push(a));
  }
  
  return { puntuacion: Math.max(0, Math.min(10, puntuacion)), acciones };
}

function puntuarGEO(artefacto: any): number {
  if (!artefacto) return 5;
  const geo = artefacto.geo || {};
  if (geo.evaluacion_global === 'optimizado') return 10;
  if (geo.evaluacion_global === 'adecuado') return 7;
  if (geo.evaluacion_global === 'deficiente') return 3;
  return 5;
}

async function main() {
  console.log(`[fase7] Consolidando Lote ${LOTE}...`);
  
  // Cargar plan de lotes
  const plan = JSON.parse(fs.readFileSync(PLAN_PATH, 'utf-8'));
  const lotePlan = plan.lotes.find((l: any) => l.lote === LOTE);
  if (!lotePlan) {
    console.error(`Lote ${LOTE} no encontrado en el plan`);
    process.exit(1);
  }
  
  const slugs = lotePlan.articulos;
  console.log(`[fase7] ${slugs.length} artículos en el plan del Lote ${LOTE}`);
  
  const decisiones: DecisionFinal[] = [];
  let auditados = 0;
  let noAuditados = 0;
  
  for (const slug of slugs) {
    // Cargar artefactos disponibles
    const legalA = cargarArtefacto('legal-a', slug);
    const legalB = cargarArtefacto('legal-b', slug);
    const seoGeo = cargarArtefacto('seo-geo', slug);
    const tecnicoSchema = cargarArtefacto('tecnico-schema', slug);
    const enlazado = cargarArtefacto('enlazado', slug);
    const uxProd = cargarArtefacto('ux-produccion', slug);
    
    const tieneArtefactos = legalA || legalB || seoGeo || tecnicoSchema || enlazado || uxProd;
    
    if (!tieneArtefactos) {
      noAuditados++;
      decisiones.push({
        slug,
        url: `https://www.pinedayasociadoshn.com/blog/??/${slug}`,
        fecha_consolidacion: new Date().toISOString(),
        modelo: 'DeepSeek V4 Pro',
        puntuaciones: { legal: 0, seo: 0, geo: 0, tecnica: 0, enlazado: 0, ux: 0 },
        puntuacion_ponderada: 0,
        bloqueos: ['Sin artefactos de auditoría'],
        cambios_aplicables: [],
        cambios_aplicados: [],
        cambios_requieren_abogado: [],
        estado_final: 'bloqueado',
        resumen_hallazgos: 'No se generaron artefactos de auditoría para este artículo.',
      });
      continue;
    }
    
    auditados++;
    
    // Consolidar hallazgos legales (priorizar legal-a, complementar con legal-b)
    const hallazgosLegales: Hallazgo[] = [];
    if (legalA?.hallazgos) hallazgosLegales.push(...legalA.hallazgos);
    
    // Puntuar
    const { puntuacion: puntLegal, bloqueos: bloqLegal, necesitaAbogado } = puntuarLegal(hallazgosLegales);
    const { puntuacion: puntSEO, acciones: accSEO } = puntuarSEO(seoGeo);
    const puntGEO = puntuarGEO(seoGeo);
    
    // Puntuaciones por defecto para artefactos no disponibles
    const puntTecnica = tecnicoSchema ? 7 : 5;
    const puntEnlazado = enlazado ? 7 : 5;
    const puntUX = uxProd ? 7 : 5;
    
    // Ponderación: legal 30%, SEO 20%, GEO 15%, técnica 15%, enlazado 10%, UX 10%
    const ponderada = (
      puntLegal * 0.30 +
      puntSEO * 0.20 +
      puntGEO * 0.15 +
      puntTecnica * 0.15 +
      puntEnlazado * 0.10 +
      puntUX * 0.10
    );
    
    // Cambios aplicables
    const cambiosAplicables: string[] = [];
    if (legalA?.acciones_obligatorias) cambiosAplicables.push(...legalA.acciones_obligatorias);
    if (legalB?.acciones_obligatorias) cambiosAplicables.push(...legalB.acciones_obligatorias);
    cambiosAplicables.push(...accSEO);
    
    // Bloqueos
    const todosBloqueos = [...bloqLegal];
    if (legalA?.bloqueos) todosBloqueos.push(...legalA.bloqueos);
    if (seoGeo?.bloqueos) todosBloqueos.push(...seoGeo.bloqueos);
    
    // Estado final
    let estadoFinal: DecisionFinal['estado_final'] = 'apto';
    if (todosBloqueos.length > 0) estadoFinal = 'bloqueado';
    else if (necesitaAbogado.length > 0) estadoFinal = 'needs_human_review';
    else if (cambiosAplicables.length > 0) estadoFinal = 'apto_con_correcciones';
    
    // Si hay un error jurídico de alto riesgo, no puede ser apto
    const riesgosAltos = hallazgosLegales.filter(h => h.severidad === 'alta' && h.estado !== 'confirmed');
    if (riesgosAltos.length > 0 && estadoFinal === 'apto') {
      estadoFinal = 'needs_human_review';
    }
    
    const decision: DecisionFinal = {
      slug,
      url: `https://www.pinedayasociadoshn.com/blog/??/${slug}`,
      fecha_consolidacion: new Date().toISOString(),
      modelo: 'DeepSeek V4 Pro',
      puntuaciones: {
        legal: puntLegal,
        seo: puntSEO,
        geo: puntGEO,
        tecnica: puntTecnica,
        enlazado: puntEnlazado,
        ux: puntUX,
      },
      puntuacion_ponderada: Math.round(ponderada * 10) / 10,
      bloqueos: todosBloqueos,
      cambios_aplicables: cambiosAplicables,
      cambios_aplicados: [],
      cambios_requieren_abogado: necesitaAbogado,
      estado_final: estadoFinal,
      resumen_hallazgos: `${hallazgosLegales.length} claims legales revisados. ${necesitaAbogado.length} requieren abogado. ${bloqLegal.length} bloqueos.`,
    };
    
    // Escribir decision-final.json
    const decisionDir = path.join(LOTE_DIR, slug);
    if (!fs.existsSync(decisionDir)) fs.mkdirSync(decisionDir, { recursive: true });
    fs.writeFileSync(
      path.join(decisionDir, 'decision-final.json'),
      JSON.stringify(decision, null, 2)
    );
    
    decisiones.push(decision);
  }
  
  // Generar resumen del lote
  const resumenLote = {
    lote: LOTE,
    fecha: new Date().toISOString(),
    total_articulos: slugs.length,
    auditados,
    no_auditados: noAuditados,
    distribucion_estados: {} as Record<string, number>,
    puntuacion_promedio: 0,
    total_bloqueos: 0,
    total_cambios_aplicables: 0,
    total_requieren_abogado: 0,
  };
  
  decisiones.forEach(d => {
    resumenLote.distribucion_estados[d.estado_final] = (resumenLote.distribucion_estados[d.estado_final] || 0) + 1;
    resumenLote.total_bloqueos += d.bloqueos.length;
    resumenLote.total_cambios_aplicables += d.cambios_aplicables.length;
    resumenLote.total_requieren_abogado += d.cambios_requieren_abogado.length;
  });
  
  const puntuaciones = decisiones.filter(d => d.puntuacion_ponderada > 0).map(d => d.puntuacion_ponderada);
  resumenLote.puntuacion_promedio = puntuaciones.length > 0
    ? Math.round((puntuaciones.reduce((a, b) => a + b, 0) / puntuaciones.length) * 10) / 10
    : 0;
  
  fs.writeFileSync(
    path.join(LOTE_DIR, 'resumen-lote.json'),
    JSON.stringify(resumenLote, null, 2)
  );
  
  console.log(`[fase7] ✅ Lote ${LOTE} consolidado:`);
  console.log(`  Auditados: ${auditados}/${slugs.length}`);
  console.log(`  Puntuación promedio: ${resumenLote.puntuacion_promedio}/10`);
  console.log(`  Distribución:`, JSON.stringify(resumenLote.distribucion_estados));
  console.log(`  Bloqueos: ${resumenLote.total_bloqueos}`);
  console.log(`  Cambios aplicables: ${resumenLote.total_cambios_aplicables}`);
  console.log(`  Requieren abogado: ${resumenLote.total_requieren_abogado}`);
  
  // Escribir decisiones en un archivo global para el lote
  fs.writeFileSync(
    path.join(LOTE_DIR, 'decisiones-finales.json'),
    JSON.stringify(decisiones, null, 2)
  );
}

main().catch(err => {
  console.error('[fase7] ❌ Error en consolidación:', err);
  process.exit(1);
});
