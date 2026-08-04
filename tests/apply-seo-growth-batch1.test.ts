import { describe, it, expect } from "vitest";
import {
  parseArgs,
  assertWriteAllowed,
  assertCanonicalUrl,
  assertNoProhibitedCopy,
  validatePatch,
  sameState,
  buildUpdate,
  sha256,
  ALLOWED_COLUMNS,
  CANONICAL_HOST,
  type PatchEntry,
} from "../scripts/apply-seo-growth-batch1";

// El host se deriva de la fuente única (.env.example) vía el runner: nunca se
// hand-typea el dominio (evita reintroducir la variante sin la "da" de
// "asociados").
const TYPO_HOST = CANONICAL_HOST.replace("asociados", "asocios");
const BASE_URL = `https://${CANONICAL_HOST}/blog/derecho-laboral/empleador-no-paga-salario-honduras`;

function makeEntry(overrides: Partial<PatchEntry> = {}): PatchEntry {
  const after: Record<string, string> = {
    title: "No me paga el salario en Honduras: qué hacer y reclamar",
    metaTitle: "No me paga el salario en Honduras: qué hacer y reclamar",
    metaDescription:
      "Qué hacer si su empleador no le paga el salario en Honduras: comprobantes que conservar, reclamación ante la autoridad laboral y vías para cobrar lo adeudado.",
  };
  return {
    url: BASE_URL,
    slug: "empleador-no-paga-salario-honduras",
    category: "derecho-laboral",
    status: "APPROVED",
    before: null,
    after,
    contentHash: sha256(JSON.stringify(after)),
    rowVersion: 1,
    ...overrides,
  };
}

const ROW = {
  title: "Despido Injustificado en Honduras: Prestaciones y Plazos",
  metaTitle: "Despido Injustificado en Honduras: Prestaciones y Plazos",
  metaDescription:
    "Prestaciones y plazos ante un despido injustificado en Honduras.",
  updatedAt: null as string | null,
};

const ROW_AFTER: Record<string, string> = {
  title: ROW.title,
  metaTitle: ROW.metaTitle,
  metaDescription: ROW.metaDescription,
};

describe("apply-seo-growth-batch1: parseArgs", () => {
  it("dry-run es el modo por defecto (seguro) y batch por defecto 1", () => {
    expect(parseArgs([]).mode).toBe("dry-run");
    expect(parseArgs([]).env).toBe("staging");
    expect(parseArgs([]).batch).toBe(1);
  });

  it("parsea --mode/--env/--env-file/--backup/--batch explícitos", () => {
    const p = parseArgs([
      "--mode",
      "apply",
      "--env",
      "production",
      "--env-file",
      ".env",
      "--backup",
      "ts-1",
      "--batch",
      "3",
    ]);
    expect(p).toEqual({
      mode: "apply",
      env: "production",
      envFile: ".env",
      backup: "ts-1",
      only: [],
      batch: 3,
    });
  });

  it("parsea filtros --only repetibles", () => {
    const p = parseArgs([
      "--only",
      "slug-a",
      "--only",
      "slug-b",
      "--mode",
      "verify",
    ]);
    expect(p.only).toEqual(["slug-a", "slug-b"]);
  });

  it("rechaza modos y entornos inválidos", () => {
    expect(() => parseArgs(["--mode", "explode"])).toThrow();
    expect(() => parseArgs(["--env", "marte"])).toThrow();
  });
});

describe("apply-seo-growth-batch1: allowlist de columnas", () => {
  it("solo title/metaTitle/metaDescription están permitidas", () => {
    expect(ALLOWED_COLUMNS.has("title")).toBe(true);
    expect(ALLOWED_COLUMNS.has("metaTitle")).toBe(true);
    expect(ALLOWED_COLUMNS.has("metaDescription")).toBe(true);
  });

  it("rechaza una entrada con columna no permitida (p. ej. body)", () => {
    const entry = makeEntry();
    entry.after = { ...entry.after, body: "texto" };
    expect(() => validatePatch([entry])).toThrow(/Columna no permitida/);
  });

  it("rechaza entrada sin ningún cambio", () => {
    const entry = makeEntry();
    entry.after = {};
    expect(() => validatePatch([entry])).toThrow(/Entrada sin cambios/);
  });
});

describe("apply-seo-growth-batch1: hash y duplicados", () => {
  it("rechaza patch editado sin regenerar (contentHash no coincide)", () => {
    const entry = makeEntry();
    entry.contentHash = sha256("otra cosa");
    expect(() => validatePatch([entry])).toThrow(/contentHash no coincide/);
  });

  it("rechaza slugs duplicados", () => {
    const a = makeEntry();
    const b = makeEntry();
    b.url = BASE_URL;
    b.slug = a.slug;
    expect(() => validatePatch([a, b])).toThrow(/Slug duplicado/);
  });

  it("acepta un patch válido completo", () => {
    expect(() => validatePatch([makeEntry()])).not.toThrow();
  });
});

describe("apply-seo-growth-batch1: canonical", () => {
  it("acepta URLs con el dominio canónico", () => {
    expect(() => assertCanonicalUrl(BASE_URL)).not.toThrow();
  });

  it('rechaza dominio incorrecto (variante sin "da" o www duplicado)', () => {
    expect(() =>
      assertCanonicalUrl(`https://www.www.${CANONICAL_HOST}/blog/x`),
    ).toThrow();
    expect(() => assertCanonicalUrl(`https://${TYPO_HOST}/blog/x`)).toThrow();
    expect(() =>
      assertCanonicalUrl(`https://${CANONICAL_HOST}/landing`),
    ).toThrow();
  });
});

describe("apply-seo-growth-batch1: copy prohibido", () => {
  it('rechaza lenguaje de plantilla "Resuelve"', () => {
    expect(() =>
      assertNoProhibitedCopy(
        "slug",
        "metaTitle",
        "Resuelve cuando necesito abogado",
      ),
    ).toThrow();
  });

  it('rechaza "sin compromiso" (política comercial R24)', () => {
    expect(() =>
      assertNoProhibitedCopy(
        "slug",
        "metaDescription",
        "consulta sin compromiso hoy mismo",
      ),
    ).toThrow();
  });

  it("rechaza años no verificados (no vigentes)", () => {
    expect(() =>
      assertNoProhibitedCopy("slug", "metaTitle", "Divorcio en Honduras 2024"),
    ).toThrow();
  });

  it("permite el año vigente (mantenimiento anual comprobado)", () => {
    const year = String(new Date().getFullYear());
    expect(() =>
      assertNoProhibitedCopy("slug", "metaTitle", `Pensión alimenticia en Honduras ${year}`),
    ).not.toThrow();
  });

  it("acepta copy editorial limpio", () => {
    expect(() =>
      assertNoProhibitedCopy(
        "slug",
        "metaTitle",
        "Hábeas corpus en Honduras: cuándo y cómo interponerlo",
      ),
    ).not.toThrow();
  });
});

describe("apply-seo-growth-batch1: guardia de entorno", () => {
  it("bloquea producción sin ALLOW_PRODUCTION_SEO_BATCH1=true", () => {
    expect(() => assertWriteAllowed("production", "production", {})).toThrow(
      /ALLOW_PRODUCTION_SEO_BATCH1/,
    );
  });

  it("permite producción solo con la bandera explícita", () => {
    expect(() =>
      assertWriteAllowed("production", "production", {
        ALLOW_PRODUCTION_SEO_BATCH1: "true",
      }),
    ).not.toThrow();
  });

  it("rechaza declaración que no coincide con el entorno detectado", () => {
    expect(() =>
      assertWriteAllowed("staging", "production", {
        ALLOW_PRODUCTION_SEO_BATCH1: "true",
      }),
    ).toThrow(/no coincide/);
  });

  it("bloquea escritura en staging sin ALLOW_STAGING_MIGRATIONS=true", () => {
    expect(() => assertWriteAllowed("staging", "staging", {})).toThrow(
      /ALLOW_STAGING_MIGRATIONS/,
    );
  });

  it("permite staging con la bandera", () => {
    expect(() =>
      assertWriteAllowed("staging", "staging", {
        ALLOW_STAGING_MIGRATIONS: "true",
      }),
    ).not.toThrow();
  });

  it("permite local declarado como local", () => {
    expect(() => assertWriteAllowed("local", "local", {})).not.toThrow();
  });
});

describe("apply-seo-growth-batch1: idempotencia y diff", () => {
  it("buildUpdate solo devuelve campos que cambian", () => {
    const after: Record<string, string> = {
      title: "Título nuevo",
      metaTitle: ROW.metaTitle,
      metaDescription: ROW.metaDescription,
    };
    const update = buildUpdate(ROW, after);
    expect(update.title).toBe("Título nuevo");
    expect(update.metaTitle).toBeUndefined();
    expect(update.metaDescription).toBeUndefined();
  });

  it("buildUpdate no escribe nada si current == after (idempotente)", () => {
    expect(buildUpdate(ROW, ROW_AFTER)).toEqual({});
  });

  it("sameState compara todos los campos con valores nulos", () => {
    expect(sameState(ROW, { ...ROW })).toBe(true);
    expect(sameState(ROW, { ...ROW, title: "otro" })).toBe(false);
    expect(sameState(ROW, null)).toBe(false);
    expect(sameState(null, null)).toBe(true);
  });
});

describe("apply-seo-growth-batch1: rollback", () => {
  it("buildUpdate restaura los valores previos (before) cuando difieren", () => {
    const applied: typeof ROW = {
      title: "Título nuevo aplicado",
      metaTitle: "Título nuevo aplicado",
      metaDescription: "Meta nueva aplicada",
      updatedAt: null,
    };
    const update = buildUpdate(applied, ROW_AFTER);
    expect(update.title).toBe(ROW.title);
    expect(update.metaTitle).toBe(ROW.metaTitle);
    expect(update.metaDescription).toBe(ROW.metaDescription);
  });

  it("rollback es no-op si ya está en estado previo", () => {
    expect(buildUpdate(ROW, ROW_AFTER)).toEqual({});
  });
});
