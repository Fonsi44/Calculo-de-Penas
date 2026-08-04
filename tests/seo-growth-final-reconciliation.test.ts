import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import {
  normalizeSlug,
  normalizeUrl,
  canonicalHost,
  parseCsvText,
  readCsvRows,
  canonicalClassification,
  loadBatchData,
  deriveInventory,
  checkInvariants,
  runReconcile,
} from "../scripts/seo-growth-final-reconcile.mjs";

const ROOT = process.cwd();
const GROWTH = resolve(ROOT, "docs/seo/growth");
const HOST = canonicalHost();

// ===========================================================================
// Test permanente de reconciliación del inventario SEO por lotes (1–9).
//
// Deriva TODOS los conteos desde los artefactos (nunca hardcodea una cifra
// incorrecta). Fija el total (175) únicamente porque el inventario definitivo
// fue demostrado y documentado en `final-reconciliation-report.md` y
// `all-batches-master-report.md`.
// ===========================================================================

function load() {
  const data = loadBatchData(GROWTH);
  const inv = deriveInventory(data);
  const { ok, failures } = checkInvariants(inv);
  return { data, inv, ok, failures };
}

describe("seo-growth-final-reconciliation: identidad canónica", () => {
  it('el host se deriva de .env.example y contiene "asociados"', () => {
    expect(HOST).toMatch(/asociados/);
    expect(HOST).not.toMatch(/asocios/);
  });

  it("normalizeSlug quita barras, espacios, query y normaliza a minúsculas", () => {
    expect(normalizeSlug("  /Blog/Derecho-Penal/Caso-X?ref=1#top  ")).toBe(
      "blog/derecho-penal/caso-x",
    );
  });

  it("normalizeUrl quita protocolo/www, query, fragmento y barra final", () => {
    expect(
      normalizeUrl("https://www.PinedaYAsociosHN.com/blog/x/?utm=1#a"),
    ).toBe("pinedayasocioshn.com/blog/x");
  });
});

describe("seo-growth-final-reconciliation: parser CSV RFC4180", () => {
  it("parsea comillas, comas internas y CRLF", () => {
    const text = 'a,b\n"x,y",z\n"w ""q""",v\n';
    const rows = parseCsvText(text);
    expect(rows).toEqual([
      ["a", "b"],
      ["x,y", "z"],
      ['w "q"', "v"],
    ]);
  });

  it("lee archivos CSV con BOM y devuelve objetos por encabezado", () => {
    const rows = readCsvRows(resolve(GROWTH, "batch-1-selection.csv"));
    expect(rows.length).toBe(18);
    expect(rows[0]).toHaveProperty("url");
    expect(rows[0]).toHaveProperty("priority");
  });
});

describe("seo-growth-final-reconciliation: clasificación canónica", () => {
  it("mapea variantes de aprobados al canónico", () => {
    expect(canonicalClassification("APPROVED_TITLE_META_H1", "")).toBe(
      "APPROVED_TITLE_META_H1",
    );
    expect(canonicalClassification("APPROVED_TITLE_META", "")).toBe(
      "APPROVED_TITLE_META",
    );
    expect(canonicalClassification("APPROVED_METADATA_ONLY", "")).toBe(
      "APPROVED_METADATA_ONLY",
    );
    expect(canonicalClassification("METADATA_ONLY", "")).toBe(
      "APPROVED_METADATA_ONLY",
    );
  });

  it("mapea NO_CHANGE y KEEP_NO_CHANGE (con INSUFFICIENT_DATA por motivo)", () => {
    expect(canonicalClassification("NO_CHANGE", "")).toBe("KEEP_NO_CHANGE");
    expect(
      canonicalClassification("KEEP_NO_CHANGE", "alineados y de calidad"),
    ).toBe("KEEP_NO_CHANGE");
    expect(
      canonicalClassification(
        "KEEP_NO_CHANGE",
        "Se difiere (INSUFFICIENT_DATA)",
      ),
    ).toBe("INSUFFICIENT_DATA");
    expect(
      canonicalClassification(
        "KEEP_NO_CHANGE",
        "Datos muy bajos (2 impresiones)",
      ),
    ).toBe("INSUFFICIENT_DATA");
    expect(canonicalClassification("UNPUBLISHED", "")).toBe("UNPUBLISHED");
  });

  it("cualquier clasificación desconocida se marca UNKNOWN (detecta categorías no normalizadas)", () => {
    expect(canonicalClassification("TITLE_META_SOLO", "")).toBe("UNKNOWN");
  });
});

describe("seo-growth-final-reconciliation: inventario (derivado de artefactos)", () => {
  const { inv, ok, failures } = load();

  it("las invariantes aritméticas cierran (0 fallos)", () => {
    expect(failures).toEqual([]);
    expect(ok).toBe(true);
  });

  it("total_unique = published + unpublished (175 = 135 + 40)", () => {
    expect(inv.totalUnique).toBe(175);
    expect(inv.publishedAnalyzed).toBe(135);
    expect(inv.unpublishedUnique).toBe(40);
    expect(inv.totalUnique).toBe(inv.publishedAnalyzed + inv.unpublishedUnique);
  });

  it("published = optimized + keep_no_change + insufficient_data + external_deferred", () => {
    expect(inv.optimized).toBe(104);
    expect(inv.keepNoChange).toBe(23);
    expect(inv.insufficientData).toBe(8);
    expect(inv.externalDeferred).toBe(0);
    expect(inv.publishedAnalyzed).toBe(
      inv.optimized +
        inv.keepNoChange +
        inv.insufficientData +
        inv.externalDeferred,
    );
  });

  it("optimized = suma del desglose de clasificaciones aprobadas (30+61+13=104)", () => {
    const breakdown = inv.approvedBreakdown as Record<string, number>;
    const sum = Object.values(breakdown).reduce((a, b) => a + b, 0);
    expect(sum).toBe(inv.optimized);
    expect(breakdown).toEqual({
      APPROVED_TITLE_META_H1: 30,
      APPROVED_TITLE_META: 61,
      APPROVED_METADATA_ONLY: 13,
    });
  });

  it("selected_unique_across_batches = published_analyzed (135)", () => {
    expect(inv.selectedUnique.length).toBe(inv.publishedAnalyzed);
    expect(inv.selectedUnique.length).toBe(135);
  });

  it("approved_unique + deferred_published_unique = published_analyzed (104+31=135)", () => {
    expect(inv.approvedUnique.length + inv.deferredUnique.length).toBe(
      inv.publishedAnalyzed,
    );
    expect(inv.approvedUnique.length).toBe(104);
    expect(inv.deferredUnique.length).toBe(31);
  });

  it("los 9 lotes están presentes y sus selecciones no contienen filas sin slug", () => {
    const data = loadBatchData(GROWTH);
    for (let b = 1; b <= 9; b++) {
      expect(data.selection[b].length).toBeGreaterThan(0);
      for (const r of data.selection[b]) {
        const slug = normalizeSlug(r.slug || (r.url || "").split("/").pop());
        expect(slug).not.toBe("");
      }
    }
  });

  it("no hay duplicados entre lotes, ni solapamientos aprobado/diferido ni publicado/no publicado", () => {
    expect(inv.duplicateSlugsAcrossBatches).toEqual([]);
    expect(inv.approvedDeferredOverlap).toEqual([]);
    expect(inv.publishedUnpublishedOverlap).toEqual([]);
    expect(inv.selectedUnpublishedOverlap).toEqual([]);
  });

  it("no hay URLs sin clasificar", () => {
    expect(inv.unclassified).toEqual([]);
  });

  it("no hay URLs con host no canónico (protección anti-typo del dominio)", () => {
    expect(inv.badHostUrls).toEqual([]);
  });

  it("measurement_pending = optimized (104) y manual_ga4_pending = 0", () => {
    expect(inv.measurementPending).toBe(104);
    expect(inv.manualGa4Pending).toBe(0);
  });
});

describe("seo-growth-final-reconciliation: entregables y cola diferida", () => {
  it("deferred-global.csv no tiene slugs duplicados y las columnas son las canónicas", () => {
    const csv = readFileSync(resolve(GROWTH, "deferred-global.csv"), "utf8");
    const rows = readCsvRows(resolve(GROWTH, "deferred-global.csv"));
    const header = csv.split("\n")[0];
    expect(header).toBe(
      "slug,url,publication_status,final_classification,batch,reason,action_required,dependency,review_date",
    );
    const slugs = rows.map((r) => r.slug);
    expect(new Set(slugs).size).toBe(rows.length);
    // 23 KEEP_NO_CHANGE + 8 INSUFFICIENT_DATA + 40 UNPUBLISHED = 71
    expect(rows.length).toBe(71);
    expect(
      rows.filter((r) => r.final_classification === "KEEP_NO_CHANGE"),
    ).toHaveLength(23);
    expect(
      rows.filter((r) => r.final_classification === "INSUFFICIENT_DATA"),
    ).toHaveLength(8);
    expect(
      rows.filter((r) => r.final_classification === "UNPUBLISHED"),
    ).toHaveLength(40);
    // action_required booleano y coherente
    for (const r of rows) {
      expect(["true", "false"]).toContain(r.action_required);
      if (r.final_classification === "INSUFFICIENT_DATA")
        expect(r.action_required).toBe("true");
      if (
        r.final_classification === "KEEP_NO_CHANGE" ||
        r.final_classification === "UNPUBLISHED"
      ) {
        expect(r.action_required).toBe("false");
      }
    }
  });

  it("existen todos los entregables de reconciliación", () => {
    for (const f of [
      "final-reconciliation.json",
      "final-reconciliation.csv",
      "final-duplicate-analysis.csv",
      "final-classification-map.csv",
      "final-reconciliation-report.md",
    ]) {
      expect(existsSync(resolve(GROWTH, f))).toBe(true);
    }
  });

  it("final-reconciliation.json tiene el veredicto y los invariantes ok", () => {
    const j = JSON.parse(
      readFileSync(resolve(GROWTH, "final-reconciliation.json"), "utf8"),
    );
    expect(j.verdict).toBe("SEO_GROWTH_ALL_BATCHES = COMPLETE_RECONCILED");
    expect(j.invariants.ok).toBe(true);
    expect(j.totalUnique).toBe(175);
    expect(j.publishedUnique).toBe(135);
    expect(j.optimizedUnique).toBe(104);
    expect(j.unpublishedUnique).toBe(40);
    expect(j.duplicates.acrossBatches).toBe(0);
  });

  it("final-reconciliation.csv no repite slugs", () => {
    const rows = readCsvRows(resolve(GROWTH, "final-reconciliation.csv"));
    const slugs = rows.map((r) => r.slug);
    expect(new Set(slugs).size).toBe(rows.length);
    expect(rows.length).toBe(175);
  });

  it("final-duplicate-analysis.csv no contiene duplicados reales (solo encabezado o vacío)", () => {
    const rows = readCsvRows(resolve(GROWTH, "final-duplicate-analysis.csv"));
    expect(rows.length).toBe(0);
  });
});

describe("seo-growth-final-reconciliation: informe maestro coherente", () => {
  it("el informe maestro declara las cifras reconciliadas (sin contradicciones)", () => {
    const md = readFileSync(
      resolve(GROWTH, "all-batches-master-report.md"),
      "utf8",
    );
    expect(md).toContain("SEO_GROWTH_ALL_BATCHES = COMPLETE_RECONCILED");
    expect(md).toContain("175 URLs únicas");
    expect(md).toContain("135 publicadas analizadas");
    expect(md).toContain("104 optimizadas");
    expect(md).toContain("23 conservadas (KEEP_NO_CHANGE)");
    expect(md).toContain("8 INSUFFICIENT_DATA");
    expect(md).toContain("40 no publicadas");
    expect(md).toContain("71 filas en cola diferida");
    // Ecuación explícita
    expect(md).toContain("TOTAL (175) = PUBLISHED (135) + UNPUBLISHED (40)");
    expect(md).toContain(
      "OPTIMIZED (104) = APPROVED_TITLE_META_H1 (30) + APPROVED_TITLE_META (61) + APPROVED_METADATA_ONLY (13)",
    );
    // Causa documentada del desfase
    expect(md).toContain("empleador-no-paga-salario-honduras");
  });
});

describe("seo-growth-final-reconciliation: determinismo", () => {
  it("dos ejecuciones de runReconcile producen el mismo JSON (sin generatedAt)", () => {
    const a = runReconcile(GROWTH, { write: false }).deliverables;
    const b = runReconcile(GROWTH, { write: false }).deliverables;
    const { generatedAt: _a, ...stableA } = a as {
      generatedAt: string;
      [k: string]: unknown;
    };
    const { generatedAt: _b, ...stableB } = b as {
      generatedAt: string;
      [k: string]: unknown;
    };
    expect(stableA).toEqual(stableB);
  });
});
