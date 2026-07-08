import React from 'react';
import { renderToBuffer, type DocumentProps } from '@react-pdf/renderer';
import { requireAuth, authFailureResponse } from '@/lib/auth';
import { validateCsrf } from '@/lib/csrf';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    requireAuth(request);
    validateCsrf(request);

    let body: unknown;
    try { body = await request.json(); } catch {
      return Response.json({ error: 'JSON inválido' }, { status: 400 });
    }

    if (!body || typeof body !== 'object') {
      return Response.json({ error: 'JSON inválido' }, { status: 400 });
    }

    const { resultado } = body as { resultado?: unknown };

    if (!resultado || typeof resultado !== 'object') {
      return Response.json({ error: 'Resultado requerido' }, { status: 400 });
    }

    const { CasoPDFDocument } = await import('@/lib/pdf-document');
    const casoCompleto = {
      titulo: 'Cálculo de pena',
      cliente: null,
      estado: 'completado',
      creadoEn: (resultado as Record<string, unknown>).fecha ?? new Date().toISOString(),
      calculos: [{
        id: 'directo',
        casoId: 'directo',
        config: null,
        resultado,
        creadoEn: new Date().toISOString(),
      }],
    };

    const buffer = await renderToBuffer(
      React.createElement(CasoPDFDocument, { caso: casoCompleto as never }) as unknown as React.ReactElement<DocumentProps>
    );

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="LEX-HN-calculo.pdf"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (e) {
    return authFailureResponse(e);
  }
}
