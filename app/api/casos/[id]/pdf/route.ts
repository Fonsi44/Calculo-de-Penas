import React from 'react';
import { renderToBuffer, type DocumentProps } from '@react-pdf/renderer';
import { db } from '@/lib/db';
import { casos, calculos } from '@/lib/schema';
import { eq, desc } from 'drizzle-orm';
import { requireAuth, authFailureResponse } from '@/lib/auth';
import { CasoPDFDocument } from '@/lib/pdf-document';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = requireAuth(request);
    const { id } = await params;

    const [caso] = await db.select().from(casos).where(eq(casos.id, id));
    if (!caso) {
      return Response.json({ error: 'Caso no encontrado' }, { status: 404 });
    }
    if (caso.usuarioId !== user.userId) {
      return Response.json({ error: 'Sin permiso sobre este caso' }, { status: 403 });
    }

    const calculosList = await db.select().from(calculos)
      .where(eq(calculos.casoId, id))
      .orderBy(desc(calculos.creadoEn));

    const casoCompleto = { ...caso, calculos: calculosList };

    const buffer = await renderToBuffer(
      React.createElement(CasoPDFDocument, { caso: casoCompleto as unknown as Parameters<typeof CasoPDFDocument>[0]['caso'] }) as unknown as React.ReactElement<DocumentProps>
    );

    const safeTitulo = (caso.titulo || 'caso')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9-_]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'caso';

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="LEX-HN-${safeTitulo}.pdf"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (e) {
    return authFailureResponse(e);
  }
}
