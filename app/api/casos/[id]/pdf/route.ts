import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import { db } from '@/lib/db';
import { casos, calculos } from '@/lib/schema';
import { eq, desc } from 'drizzle-orm';
import { getTokenFromCookies, verifyToken } from '@/lib/auth';
import { CasoPDFDocument } from '@/lib/pdf-document';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = getTokenFromCookies(request);
  if (!token) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  const payload = verifyToken(token);
  if (!payload) {
    return new Response(JSON.stringify({ error: 'Sesión inválida' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { id } = await params;

  const [caso] = await db.select().from(casos).where(eq(casos.id, id));
  if (!caso) {
    return new Response(JSON.stringify({ error: 'Caso no encontrado' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  if (caso.usuarioId !== payload.userId) {
    return new Response(JSON.stringify({ error: 'Sin permiso sobre este caso' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const calculosList = await db.select().from(calculos)
    .where(eq(calculos.casoId, id))
    .orderBy(desc(calculos.creadoEn));

  const casoCompleto = { ...caso, calculos: calculosList };

  const buffer = await renderToBuffer(
    React.createElement(CasoPDFDocument as any, { caso: casoCompleto }) as any
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
}
