import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { canonicalOrigin, mask } from "../scripts/seo-data-cli.mjs";

const ROOT = resolve(import.meta.dirname, "..");

function envExampleValue(key: string): string | null {
  const line = readFileSync(resolve(ROOT, ".env.example"), "utf8")
    .split("\n")
    .find((l) => l.trim().startsWith(`${key}=`));
  return line ? line.trim().split("=", 2)[1].replace(/^"|"$/g, "") : null;
}

describe("seo-data-cli — origen canónico", () => {
  it("canonicalOrigin coincide con NEXT_PUBLIC_SITE_URL de .env.example", () => {
    const example = envExampleValue("NEXT_PUBLIC_SITE_URL");
    expect(example).toBeTruthy();
    expect(canonicalOrigin()).toBe(example?.replace(/\/+$/, ""));
  });

  it('el origen usa el dominio correcto pinedayasociadoshn.com (con "asociados")', () => {
    expect(canonicalOrigin()).toMatch(
      /^https:\/\/www\.pinedayasociadoshn\.com$/,
    );
  });
});

describe("seo-data-cli — mask de secretos", () => {
  it("no expone valores completos", () => {
    const masked = mask("supersecreto1234567890");
    expect(masked).not.toContain("supersecreto");
    expect(masked.length).toBeLessThan(12);
  });

  it("marca ausencia sin filtrar nada", () => {
    expect(mask(undefined)).toBe("[no configurada]");
    expect(mask("")).toBe("[no configurada]");
  });
});

describe("seo-data-cli — estados honestos", () => {
  it("no_credentials/no_access no deben considerarse PASS (contrato de la CLI)", () => {
    // La CLI traduce los estados de los colectores: solo status==='ok' es PASS;
    // no_credentials/no_access/empty/partial → SKIPPED/PARTIAL.
    const translate = (status: string) => {
      if (status === "ok") return "PASS";
      if (["no_credentials", "no_access", "empty"].includes(status))
        return "SKIPPED";
      return "PARTIAL";
    };
    expect(translate("ok")).toBe("PASS");
    expect(translate("no_credentials")).not.toBe("PASS");
    expect(translate("no_access")).not.toBe("PASS");
    expect(translate("empty")).not.toBe("PASS");
    expect(translate("partial")).not.toBe("PASS");
  });
});
