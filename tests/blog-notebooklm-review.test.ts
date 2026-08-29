import { describe, it, expect } from 'vitest';
import type { ClaimExtraido } from '@/scripts/lib/blog-claims-extract';
import {
  applyCitationFixes,
  batchTimeoutSec,
  chunkClaims,
  BATCH_CHUNK_SIZE,
  buildBatchVerificationPrompt,
  buildCitationFixesFromResults,
  buildVerificationPrompt,
  claimKey,
  dedupeClaims,
  expandClaimsContext,
  prepareNotebooklmClaims,
  refineClaimsFromContext,
  formatSummaryMarkdown,
  parseNotebooklmBatchVerdict,
  parseNotebooklmVerdict,
  type ClaimReviewResult,
} from '@/scripts/lib/notebooklm-prompts';

const sampleClaim: ClaimExtraido = {
  tipo: 'articulo_cp',
  textoOriginal: 'Art. 294 CPP',
  contexto: 'La audiencia inicial se regula en el Art. 294 CPP según el proceso.',
};

describe('dedupeClaims', () => {
  it('elimina claims duplicados por tipo y texto', () => {
    const claims: ClaimExtraido[] = [
      sampleClaim,
      { ...sampleClaim },
      {
        tipo: 'articulo_const',
        textoOriginal: 'Art. 82',
        contexto: 'derecho a defensa Art. 82',
      },
    ];
    expect(dedupeClaims(claims)).toHaveLength(2);
  });
});

describe('claimKey', () => {
  it('normaliza a minúsculas', () => {
    expect(claimKey(sampleClaim)).toBe('articulo_cp::art. 294 cpp');
  });
});

describe('refineClaimsFromContext', () => {
  it('corrige CP a CPP cuando el contexto lo indica', () => {
    const claims: ClaimExtraido[] = [
      {
        tipo: 'articulo_cp',
        textoOriginal: 'art. 282 CP',
        contexto: 'El art. 282 CPP, numeral 8, exige registro',
      },
    ];
    const refined = refineClaimsFromContext(claims);
    expect(refined[0].textoOriginal).toBe('art. 282 CPP');
  });

  it('corrige CP a CPC cuando el contexto lo indica', () => {
    const claims: ClaimExtraido[] = [
      {
        tipo: 'articulo_cp',
        textoOriginal: 'art. 81 CP',
        contexto: 'El art. 81 CPC exige escritura pública o apud acta',
      },
    ];
    const refined = refineClaimsFromContext(claims);
    expect(refined[0].textoOriginal).toBe('art. 81 CPC');
  });
});

describe('expandClaimsContext', () => {
  it('amplía el contexto de decretos para no truncar citas vecinas', () => {
    const body =
      '<p>Código del Notariado (Decreto 353-2005) y el Código Civil (Decreto 76-1906).</p>';
    const claims: ClaimExtraido[] = [
      {
        tipo: 'decreto',
        textoOriginal: 'Decreto 353-2005',
        contexto: 'por el Código del Notariado (Decreto 353-2005) y el Código Civil (Decreto 7',
      },
    ];
    const expanded = expandClaimsContext(body, claims);
    expect(expanded[0].contexto).toContain('Decreto 76-1906');
  });
});

describe('prepareNotebooklmClaims', () => {
  it('aplica refinamiento, filtro y deduplicación', () => {
    const claims: ClaimExtraido[] = [
      {
        tipo: 'articulo_cp',
        textoOriginal: 'art. 81 CP',
        contexto: 'El art. 81 CPC exige escritura pública',
      },
      {
        tipo: 'articulo_cp',
        textoOriginal: 'art. 81 CP',
        contexto: 'El art. 81 CPC exige escritura pública',
      },
    ];
    const prepared = prepareNotebooklmClaims(
      '<p>El art. 81 CPC exige escritura pública.</p>',
      claims,
    );
    expect(prepared).toHaveLength(1);
    expect(prepared[0].textoOriginal).toBe('art. 81 CPC');
  });
});

describe('buildBatchVerificationPrompt', () => {
  it('incluye todas las citas numeradas y schema results', () => {
    const claims: ClaimExtraido[] = [
      sampleClaim,
      {
        tipo: 'articulo_const',
        textoOriginal: 'Art. 82',
        contexto: 'derecho a defensa Art. 82',
      },
    ];
    const prompt = buildBatchVerificationPrompt(claims, 'Audiencia inicial');
    expect(prompt).toContain('"id": "1"');
    expect(prompt).toContain('"id": "2"');
    expect(prompt).toContain('Art. 294 CPP');
    expect(prompt).toContain('"results"');
    expect(prompt).toContain('Audiencia inicial');
  });
});

describe('parseNotebooklmBatchVerdict', () => {
  it('mapea resultados por id a claimKey', () => {
    const claims: ClaimExtraido[] = [
      sampleClaim,
      {
        tipo: 'articulo_const',
        textoOriginal: 'Art. 82',
        contexto: 'derecho a defensa Art. 82',
      },
    ];
    const raw = JSON.stringify({
      results: [
        {
          id: '1',
          verdict: 'OK',
          norma_correcta: null,
          decreto: null,
          explicacion: 'Correcto',
          confianza: 'alta',
        },
        {
          id: '2',
          verdict: 'ERROR',
          norma_correcta: 'Art. 83',
          decreto: null,
          explicacion: 'Cita incorrecta',
          confianza: 'alta',
        },
      ],
    });
    const map = parseNotebooklmBatchVerdict(raw, claims);
    expect(map.size).toBe(2);
    expect(map.get(claimKey(sampleClaim))?.verdict).toBe('OK');
    expect(map.get(claimKey(claims[1]))?.verdict).toBe('ERROR');
  });

  it('devuelve mapa vacío si no hay JSON parseable', () => {
    const map = parseNotebooklmBatchVerdict('sin json', [sampleClaim]);
    expect(map.size).toBe(0);
  });
});

describe('chunkClaims', () => {
  it('divide en bloques de BATCH_CHUNK_SIZE', () => {
    const claims = Array.from({ length: 12 }, (_, i) => i);
    const chunks = chunkClaims(claims);
    expect(chunks).toHaveLength(2);
    expect(chunks[0]).toHaveLength(BATCH_CHUNK_SIZE);
    expect(chunks[1]).toHaveLength(BATCH_CHUNK_SIZE);
  });
});

describe('batchTimeoutSec', () => {
  it('escala con el número de citas hasta 600s', () => {
    expect(batchTimeoutSec(1)).toBe(150);
    expect(batchTimeoutSec(10)).toBe(420);
    expect(batchTimeoutSec(50)).toBe(600);
  });
});

describe('buildVerificationPrompt', () => {
  it('incluye cita y contexto', () => {
    const prompt = buildVerificationPrompt(sampleClaim, 'Audiencia inicial');
    expect(prompt).toContain('Art. 294 CPP');
    expect(prompt).toContain('Audiencia inicial');
    expect(prompt).toContain('"verdict"');
  });
});

describe('parseNotebooklmVerdict', () => {
  it('parsea JSON directo', () => {
    const raw = JSON.stringify({
      verdict: 'ERROR',
      norma_correcta: 'Art. 285 CPP',
      decreto: 'Decreto 9-99-E',
      explicacion: 'El artículo citado no corresponde.',
      confianza: 'alta',
    });
    const parsed = parseNotebooklmVerdict(raw);
    expect(parsed.verdict).toBe('ERROR');
    expect(parsed.norma_correcta).toBe('Art. 285 CPP');
    expect(parsed.confianza).toBe('alta');
  });

  it('acepta verdict correcto como OK', () => {
    const raw = JSON.stringify({
      verdict: 'correcto',
      norma_correcta: 'Art. 283 CPP',
      decreto: 'Decreto 9-99-E',
      explicacion: 'Coincide con la fuente.',
      confianza: 'alta',
    });
    expect(parseNotebooklmVerdict(raw).verdict).toBe('OK');
  });

  it('parsea answer anidado de nlm --json', () => {
    const outer = JSON.stringify({
      answer: JSON.stringify({
        verdict: 'ERROR',
        norma_correcta: 'Art. 285 CPP',
        decreto: null,
        explicacion: 'x',
        confianza: 'alta',
      }),
    });
    expect(parseNotebooklmVerdict(outer).verdict).toBe('ERROR');
  });

  it('parsea JSON en bloque markdown', () => {
    const raw = '```json\n{"verdict":"OK","norma_correcta":null,"decreto":null,"explicacion":"Correcto","confianza":"media"}\n```';
    const parsed = parseNotebooklmVerdict(raw);
    expect(parsed.verdict).toBe('OK');
    expect(parsed.confianza).toBe('media');
  });

  it('fallback INSUFICIENTE en texto libre', () => {
    const parsed = parseNotebooklmVerdict('No encuentro la norma en las fuentes.');
    expect(parsed.verdict).toBe('INSUFICIENTE');
    expect(parsed.confianza).toBe('baja');
  });
});

describe('applyCitationFixes', () => {
  it('reemplaza solo la primera ocurrencia por fix', () => {
    const body = '<p>Art. 294 CPP y otra mención Art. 294 CPP</p>';
    const { body: out, applied } = applyCitationFixes(body, [
      { from: 'Art. 294 CPP', to: 'Art. 285 CPP', motivo: 'corrección' },
    ]);
    expect(applied).toHaveLength(1);
    expect(out).toContain('Art. 285 CPP');
    expect(out.match(/Art\. 294 CPP/g)).toHaveLength(1);
  });
});

describe('buildCitationFixesFromResults', () => {
  it('solo genera fixes para ERROR con confianza alta', () => {
    const results: ClaimReviewResult[] = [
      {
        claim: sampleClaim,
        claimKey: 'k1',
        prompt: 'p',
        parsed: {
          verdict: 'ERROR',
          norma_correcta: 'Art. 285 CPP',
          decreto: null,
          explicacion: 'x',
          confianza: 'alta',
          rawAnswer: '',
        },
      },
      {
        claim: sampleClaim,
        claimKey: 'k2',
        prompt: 'p',
        parsed: {
          verdict: 'ERROR',
          norma_correcta: 'Art. 1 CPP',
          decreto: null,
          explicacion: 'y',
          confianza: 'media',
          rawAnswer: '',
        },
      },
    ];
    const fixes = buildCitationFixesFromResults(results);
    expect(fixes).toHaveLength(1);
    expect(fixes[0].to).toBe('Art. 285 CPP');
  });
});

describe('formatSummaryMarkdown', () => {
  it('genera tabla markdown', () => {
    const md = formatSummaryMarkdown('2026-08-28', [
      {
        slug: 'test-slug',
        title: 'Test',
        totalClaims: 3,
        ok: 2,
        errors: 1,
        insuficiente: 0,
        errorsAlta: 1,
      },
    ]);
    expect(md).toContain('test-slug');
    expect(md).toContain('| 3 |');
  });
});
