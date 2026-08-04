/**
 * Auditoría editorial del lote SEO 1 (18 URLs) → produce:
 *   - docs/seo/growth/batch-1-editorial-review.csv
 *   - docs/seo/growth/batch-1-approved-patch.json
 *   - docs/seo/growth/batch-1-deferred-patch.json
 *
 * Reglas (AGENTS.md §4/§5 y PROMPT §3-§6):
 *   - Sin lenguaje de plantilla ("Resuelve [keyword]", "Sin compromiso",
 *     "pasos concretos, requisitos y fuentes oficiales").
 *   - Sin años no verificados ("2026"), sin "penas" no verificadas.
 *   - Preservar precisión jurídica (poder notarial, hábeas corpus).
 *   - No añadir hechos legales nuevos: solo metadata alineada con el alcance
 *     ya cubierto en el body (METADATA_ONLY). Las cifras legales (plazos,
 *     porcentajes, semanas) quedan fuera del copy nuevo.
 *   - Validación contra lib/content-policy (claims comerciales, testimonios,
 *     garantías de éxito, superlativos).
 *   - title ≤ 60, meta ≤ 160.
 *
 * Uso: npx tsx scripts/seo-growth-batch1-editorial.ts
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve, join } from "node:path";
import { createHash } from "node:crypto";
import { scanContentPolicyViolations } from "../lib/content-policy";
import { META_TITLE_MAX } from "../lib/seo";

const ROOT = process.cwd();
const GROWTH_DIR = resolve(ROOT, "docs/seo/growth");
const SRC_PATCH = join(GROWTH_DIR, "batch-1-title-meta-patch.json");

const META_DESC_MAX = 160;
const MIN_TITLE = 20;

interface SourceEntry {
  url: string;
  slug: string;
  category: string;
  gsc_evidence: string;
  current: { title: string; meta: string; h1: string; http_status: number };
}

export type EditorialClassification =
  | "APPROVED_TITLE_META_H1"
  | "APPROVED_TITLE_META"
  | "APPROVED_METADATA_ONLY"
  | "NO_CHANGE"
  | "REMOVE_FROM_BATCH";

export interface EditorialDecision {
  classification: EditorialClassification;
  /** Nuevo título visible/H1 (se escribe en title + meta_title si se indica). */
  title?: string;
  /** Nueva meta description (meta_description). */
  meta: string;
  /** true → no tocar title (H1); solo meta_title/meta_description. */
  keepH1?: boolean;
  reason: string;
  legalNotes: string;
}

const DECISIONS: Record<string, EditorialDecision> = {
  // ── APPROVED_TITLE_META_H1 ────────────────────────────────────────────
  "empleador-no-paga-salario-honduras": {
    classification: "APPROVED_TITLE_META_H1",
    title: "No me paga el salario en Honduras: qué hacer y reclamar",
    meta: "Qué hacer si su empleador no le paga el salario en Honduras: comprobantes que conservar, reclamación ante la autoridad laboral y vías para cobrar lo adeudado.",
    reason:
      'Title actual desalineado (habla de despido injustificado) frente a la URL/consulta "no paga salario". Se alinea title/meta/H1 al hecho real sin promesas ni cifras.',
    legalNotes:
      'METADATA_ONLY: sin cifras nuevas. "Reclamación ante la autoridad laboral" es genérico y ya está en el body. No se añaden artículos ni montos.',
  },
  "derecho-de-peticion-instituciones-honduras": {
    classification: "APPROVED_TITLE_META_H1",
    title: "Derecho de petición en Honduras: cómo ejercerlo",
    meta: "El derecho de petición (art. 80 de la Constitución) permite dirigirse a instituciones en Honduras: cómo presentarlo y qué hacer si no responde.",
    reason:
      'Title actual ("Guía Completa") y meta con "¡Obtenga respuesta!" (promocional). Se normaliza y se mantiene la base constitucional ya citada en el body.',
    legalNotes:
      "Art. 80 de la Constitución: ya presente en la meta y el body actuales (restatement, no claim nuevo).",
  },
  "estafas-fraudes-tipos-penales-honduras": {
    classification: "APPROVED_TITLE_META_H1",
    title: "Estafa en Honduras: tipos, cómo denunciar y defensa",
    meta: "Tipos de estafa previstos en el Código Penal de Honduras, cómo presentar una denuncia y cuándo conviene defensa legal ante una acusación por fraude.",
    reason:
      'Se rechaza el "penas" propuesto (no verificado contra el CP). Se conserva tipos/denuncia/defensa ya soportados por el body.',
    legalNotes:
      "METADATA_ONLY: sin cifras de penas. Referencia genérica al Código Penal ya presente en el body.",
  },
  "derechos-trabajadora-embarazada-honduras": {
    classification: "APPROVED_TITLE_META_H1",
    title: "Derechos de la trabajadora embarazada en Honduras",
    meta: "Qué protección tiene la trabajadora embarazada en Honduras durante el embarazo y la lactancia, y qué pasos seguir si la despiden por esa razón.",
    reason:
      'Title actual truncado con repetición "en Honduras en Honduras", "(2026)" no verificado y cola "| Abogad". Se reescribe limpio y sin cifras no verificadas.',
    legalNotes:
      "METADATA_ONLY: se omiten cifras (semanas de licencia, porcentajes) que no pude verificar contra fuente oficial en esta intervención; el body las conserva intactas.",
  },
  "habeas-corpus-cuando-interponer-honduras": {
    classification: "APPROVED_TITLE_META_H1",
    title: "Hábeas corpus en Honduras: cuándo y cómo interponerlo",
    meta: "En qué casos procede el hábeas corpus en Honduras y cómo presentarlo: requisitos, ante quién se interpone y diferencias con otras vías.",
    reason:
      'Se elimina "Proteja su libertad" (promesa) y el plazo de 24 h de la meta (no verificado en esta intervención). Título alineado a cuándo/cómo interponer.',
    legalNotes:
      "METADATA_ONLY: se retira la cifra de 24 h de la meta; el body no se modifica y conserva su contenido.",
  },
  "custodia-hijos-honduras-juez": {
    classification: "APPROVED_TITLE_META_H1",
    title: "Custodia de hijos en Honduras: qué evalúa el juez",
    meta: "Criterios que el juez considera en la custodia de hijos en Honduras: interés superior del menor, capacidad parental y régimen de visitas.",
    reason:
      'Refuerza la intención de búsqueda ("qué decide/considera el juez") manteniendo los criterios ya cubiertos en el body.',
    legalNotes:
      'METADATA_ONLY: "interés superior del menor" es principio general ya presente en el body; sin cifras.',
  },
  "licencia-ambiental-categorias-plazos-honduras": {
    classification: "APPROVED_TITLE_META_H1",
    title: "Licencia ambiental en Honduras: categorías y plazos",
    meta: "Categorías y plazos de la licencia ambiental en Honduras según la Ley General del Ambiente y el SINEIA, y requisitos del trámite.",
    reason:
      'Title actual con "Guía Completa 2024" (año no verificado). Se normaliza a categorías/plazos (slug) manteniendo el marco legal ya citado.',
    legalNotes:
      "Ley General del Ambiente/SINEIA ya presentes en el body (restatement). Sin plazos numéricos nuevos en la meta.",
  },
  "defensa-penal-menores-edad-honduras": {
    classification: "APPROVED_TITLE_META_H1",
    title: "Defensa penal juvenil en Honduras: proceso y derechos",
    meta: "Cómo funciona la defensa penal de menores de 18 años en Honduras: principios, medidas aplicables y diferencias con el sistema de adultos.",
    reason:
      'Title actual con marca "| Pineda y Asociados" que desperdicia caracteres. Se elimina marca y se alinea a proceso/derechos ya cubiertos.',
    legalNotes:
      "METADATA_ONLY: restatement de principios ya presentes en el body; sin cifras.",
  },

  // ── APPROVED_TITLE_META (meta_title + meta_description; H1 intacto) ────
  "nacionalidad-espanola-para-hondurenos-residencia-plazos": {
    classification: "APPROVED_TITLE_META",
    keepH1: true,
    title: "Nacionalidad española para hondureños: requisitos y plazos",
    meta: "Requisitos y proceso para que un hondureño obtenga la nacionalidad española por residencia: documentación, pasos del trámite y plazos.",
    reason:
      'Title actual con marca y meta con "Obtenga..."/"¡Consulte a expertos!" (promocional). Se limpia sin introducir la cifra de 2 años en la meta.',
    legalNotes:
      'METADATA_ONLY: se omite "2 años" de la meta (cifra no verificada en esta intervención); el body la conserva.',
  },
  "reclamar-deuda-legalmente-honduras": {
    classification: "APPROVED_TITLE_META",
    keepH1: true,
    title: "Cómo reclamar una deuda legalmente en Honduras",
    meta: "Vías legales para reclamar una deuda en Honduras: requerimiento, proceso monitorio o juicio ejecutivo, requisitos y plazos de prescripción.",
    reason:
      'Title actual "Cómo Cobrar una Deuda en Honduras | Pineda y Asociados": marca desperdicia caracteres y "Cobrar" vs slug "reclamar". Se alinea a la intención.',
    legalNotes:
      "METADATA_ONLY: proceso monitorio/juicio ejecutivo/plazos de prescripción ya presentes en la meta y el body actuales (restatement).",
  },
  "expropiacion-forzosa-derechos-propietario-honduras": {
    classification: "APPROVED_TITLE_META",
    keepH1: true,
    title: "Expropiación forzosa en Honduras: derechos del propietario",
    meta: "Qué es la expropiación forzosa por utilidad pública en Honduras y qué derechos tiene el propietario, incluido el justiprecio de su terreno.",
    reason:
      'Title actual "Ley de Expropiación Forzosa Honduras | Pineda y Asociados": marca desperdicia caracteres y "Ley de" no aporta a la intención. CTR ya alto (4.06 %) pero el title se beneficia de quitar marca.',
    legalNotes:
      "METADATA_ONLY: justiprecio ya presente en el body/meta actuales (restatement).",
  },
  "contratacion-publica-licitaciones": {
    classification: "APPROVED_TITLE_META",
    keepH1: true,
    title: "Contratación pública en Honduras: modalidades y requisitos",
    meta: "Cómo participar en la contratación pública de Honduras: modalidades, requisitos, garantías y documentación para proveedores del Estado.",
    reason:
      'Title actual "Contratación Pública Honduras: Guía Empresas" ("Guía Empresas" atípico). Se normaliza a modalidades/requisitos cubiertos por el body.',
    legalNotes:
      "METADATA_ONLY: restatement de contenido ya cubierto; sin cifras.",
  },

  // ── APPROVED_METADATA_ONLY (solo meta_title + meta_description) ────────
  "juicio-oral-etapas-que-esperar-honduras": {
    classification: "APPROVED_METADATA_ONLY",
    keepH1: true,
    title: "Juicio oral en Honduras: etapas y qué esperar",
    meta: "Etapas del juicio oral penal en Honduras: apertura, pruebas, conclusiones, deliberación y sentencia, y cómo prepararse.",
    reason:
      'Alinea title de SERP a la consulta ("qué esperar") sin tocar el H1 actual ("etapas y preparación"), ya válido.',
    legalNotes: "METADATA_ONLY: restatement de etapas ya presentes en el body.",
  },

  // ── NO_CHANGE (deferred; sin cambios) ─────────────────────────────────
  "cuando-necesito-abogado-penalista-honduras": {
    classification: "NO_CHANGE",
    meta: "",
    reason:
      'Datos muy bajos (48 impresiones). Title/meta actuales de calidad. El cambio propuesto (1ª persona "necesito") no aporta beneficio claro. Se excluye del lote.',
    legalNotes: "Sin cambios.",
  },
  "divorcio-honduras-guia-completa": {
    classification: "NO_CHANGE",
    meta: "",
    reason:
      'Title/meta actuales de calidad ("vías, requisitos y plazos", H1 "3 vías"). Se rechaza "tipos... (2026)": "vías" coincide con el H1 del body y "2026" no está verificado. CTR bajo a posición 10 se explica por competencia SERP, no por metadata.',
    legalNotes: "Sin cambios.",
  },
  "poder-legal-honduras-cuando-se-necesita": {
    classification: "NO_CHANGE",
    meta: "",
    reason:
      'El término jurídico correcto es "poder notarial" (no "poder legal"). El title actual es preciso y el body cubre tipos/alcance/requisitos. No se sacrifica precisión legal por match de query.',
    legalNotes: "Sin cambios.",
  },
  "despido-laboral-honduras-guia-completa": {
    classification: "NO_CHANGE",
    meta: "",
    reason:
      'Title actual alineado con la URL (despido laboral/injustificado). El problema de títulos duplicados se resuelve al corregir "empleador-no-paga-salario". Sin cambios aquí.',
    legalNotes: "Sin cambios.",
  },
  "pension-alimenticia-honduras-guia-completa": {
    classification: "NO_CHANGE",
    meta: "",
    reason:
      'URL canibalizada por "pension-alimenticia-porcentaje-honduras-2026" (dominante). La propuesta introducía "porcentaje/cálculo" (cifras sensibles no verificadas). Metadata no corrige canibalización; mantener requisitos/pasos.',
    legalNotes: "Sin cambios.",
  },
};

function sha256(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

function assertNoPolicyViolations(
  slug: string,
  text: string,
  field: string,
): void {
  const violations = scanContentPolicyViolations(text);
  const errors = violations.filter((v) => v.severity === "error");
  if (errors.length > 0) {
    const detail = errors.map((e) => `${e.code}:${e.match}`).join(" | ");
    throw new Error(
      `[editorial] Violación de política en ${slug}.${field}: ${detail}`,
    );
  }
}

function assertNoTemplateLanguage(slug: string, text: string): void {
  const bad = [
    /\bResuelve\b/i,
    /pasos concretos, requisitos y fuentes oficiales/i,
    /sin\s+compromiso/i,
    /\b20\d{2}\b/, // años sin verificar
    /\bpenas?\b/i, // penas sin verificación contra CP
  ];
  for (const re of bad) {
    if (re.test(text)) {
      throw new Error(
        `[editorial] Lenguaje de plantilla/prohibido en ${slug}: "${re.source}"`,
      );
    }
  }
}

function normalize(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function main(): void {
  const src = JSON.parse(readFileSync(SRC_PATCH, "utf8")) as {
    patch: SourceEntry[];
  };
  if (src.patch.length !== 18) {
    throw new Error(
      `[editorial] Se esperaban 18 entradas; hay ${src.patch.length}`,
    );
  }

  const slugs = new Set(src.patch.map((e) => e.slug));
  for (const slug of Object.keys(DECISIONS)) {
    if (!slugs.has(slug))
      throw new Error(`[editorial] Decisión para slug inexistente: ${slug}`);
  }

  const rows: string[] = [];
  const approved: unknown[] = [];
  const deferred: unknown[] = [];
  const errors: string[] = [];

  const header = [
    "url",
    "slug",
    "category",
    "gsc_evidence",
    "current_title",
    "current_meta",
    "current_h1",
    "classification",
    "approved_title",
    "approved_meta",
    "reason",
    "legal_notes",
  ].join(",");
  rows.push(header);

  for (const entry of src.patch) {
    const decision = DECISIONS[entry.slug];
    if (!decision)
      throw new Error(`[editorial] Falta decisión para ${entry.slug}`);

    const approvedTitle = decision.title ?? entry.current.title;
    const approvedMeta = decision.meta || entry.current.meta;
    const isApproved = decision.classification.startsWith("APPROVED");

    // Validación de copy aprobado.
    if (isApproved) {
      const t = normalize(approvedTitle);
      const m = normalize(approvedMeta);
      if (t.length > META_TITLE_MAX)
        errors.push(`${entry.slug}: title ${t.length} > ${META_TITLE_MAX}`);
      if (t.length < MIN_TITLE)
        errors.push(`${entry.slug}: title ${t.length} < ${MIN_TITLE}`);
      if (m.length > META_DESC_MAX)
        errors.push(`${entry.slug}: meta ${m.length} > ${META_DESC_MAX}`);
      assertNoTemplateLanguage(entry.slug, t);
      assertNoTemplateLanguage(entry.slug, m);
      assertNoPolicyViolations(entry.slug, t, "title");
      assertNoPolicyViolations(entry.slug, m, "meta");
    }

    const csvTitle = approvedTitle.replace(/"/g, '""');
    const csvMeta = approvedMeta.replace(/"/g, '""');
    const csvCurrentTitle = entry.current.title.replace(/"/g, '""');
    const csvCurrentMeta = entry.current.meta.replace(/"/g, '""');
    const csvCurrentH1 = entry.current.h1.replace(/"/g, '""');
    const csvReason = decision.reason.replace(/"/g, '""');
    const csvLegal = decision.legalNotes.replace(/"/g, '""');
    rows.push(
      [
        entry.url,
        entry.slug,
        entry.category,
        `"${entry.gsc_evidence.replace(/"/g, '""')}"`,
        `"${csvCurrentTitle}"`,
        `"${csvCurrentMeta}"`,
        `"${csvCurrentH1}"`,
        decision.classification,
        `"${csvTitle}"`,
        `"${csvMeta}"`,
        `"${csvReason}"`,
        `"${csvLegal}"`,
      ].join(","),
    );

    const base = {
      url: entry.url,
      slug: entry.slug,
      category: entry.category,
      gsc_evidence: entry.gsc_evidence,
      classification: decision.classification,
      reason: decision.reason,
      legal_notes: decision.legalNotes,
      legal_review: isApproved ? "METADATA_ONLY" : "NONE",
      legal_claims_added: isApproved ? "none" : "none",
    };

    if (isApproved) {
      const after: Record<string, string> = {
        metaDescription: approvedMeta,
        metaTitle: approvedTitle,
      };
      if (!decision.keepH1) after.title = approvedTitle;
      approved.push({
        ...base,
        status: "APPROVED",
        before: null, // se rellena con --mode capture desde la DB (valores reales)
        after,
        contentHash: sha256(JSON.stringify(after)),
        rowVersion: 1,
      });
    } else {
      deferred.push({ ...base, status: decision.classification });
    }
  }

  if (errors.length > 0) {
    throw new Error(
      `[editorial] Errores de validación:\n- ${errors.join("\n- ")}`,
    );
  }

  mkdirSync(GROWTH_DIR, { recursive: true });

  const outReview = join(GROWTH_DIR, "batch-1-editorial-review.csv");
  const outApproved = join(GROWTH_DIR, "batch-1-approved-patch.json");
  const outDeferred = join(GROWTH_DIR, "batch-1-deferred-patch.json");

  writeFileSync(outReview, rows.join("\n") + "\n", "utf8");
  writeFileSync(
    outApproved,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        source: "batch-1-title-meta-patch.json",
        status: "EDITORIAL_APPROVED",
        count: approved.length,
        applyPolicy: {
          columns: ["title", "metaTitle", "metaDescription"],
          dryRunDefault: true,
          productionRequires: "ALLOW_PRODUCTION_SEO_BATCH1=true",
          noSlugChanges: true,
          noRedirects: true,
          noNoindexChanges: true,
        },
        patch: approved,
      },
      null,
      2,
    ) + "\n",
    "utf8",
  );
  writeFileSync(
    outDeferred,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        source: "batch-1-title-meta-patch.json",
        status: "DEFERRED",
        count: deferred.length,
        note: "Entradas NO_CHANGE/REMOVE_FROM_BATCH excluidas de la aplicación de producción.",
        patch: deferred,
      },
      null,
      2,
    ) + "\n",
    "utf8",
  );

  console.log(`[editorial] OK`);
  console.log(`  revisión: ${outReview}`);
  console.log(`  aprobados: ${approved.length} → ${outApproved}`);
  console.log(`  diferidos: ${deferred.length} → ${outDeferred}`);
}

try {
  main();
} catch (err) {
  console.error((err as Error).message);
  process.exit(1);
}
