import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { newsletterSubscriptions } from '@/lib/schema';
import { getLeadMagnetByArea } from '@/lib/lead-magnets';
import { renderToBuffer } from '@react-pdf/renderer';
import { LeadMagnetPdf } from '@/lib/lead-magnet-pdf';

export async function GET(request: NextRequest) {
  const area = request.nextUrl.searchParams.get('area');
  const email = request.nextUrl.searchParams.get('email');

  if (!area || !email) {
    return NextResponse.json({ error: 'Parámetros requeridos: area, email' }, { status: 400 });
  }

  const magnet = getLeadMagnetByArea(area);
  if (!magnet) {
    return NextResponse.json({ error: 'Área no válida' }, { status: 400 });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Email inválido' }, { status: 400 });
  }

  try {
    await db
      .insert(newsletterSubscriptions)
      .values({ email: email.toLowerCase().trim(), source: magnet.source })
      .onConflictDoNothing();
  } catch {
    // El usuario ya podría existir — continuamos
  }

  try {
    const pdfBuffer = await renderToBuffer(LeadMagnetPdf({ magnet }));
    const pdfBytes = new Uint8Array(pdfBuffer);

    return new NextResponse(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="guia-${magnet.area}.pdf"`,
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (e) {
    console.error('[descargar] Error generando PDF:', e);
    return NextResponse.json({ error: 'Error al generar el PDF. Intente de nuevo.' }, { status: 500 });
  }
}
