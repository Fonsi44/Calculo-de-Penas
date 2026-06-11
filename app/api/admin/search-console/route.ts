import { NextResponse } from 'next/server';
import { requireAdmin, authFailureResponse } from '@/lib/auth';
import {
  getSearchConsoleData,
  isSearchConsoleConfigured,
  getGoogleServiceAccountEmail,
  getSearchConsoleSiteUrlOrNull,
} from '@/lib/google';

export async function GET(request: Request) {
  try {
    requireAdmin(request);
  } catch (err) {
    return authFailureResponse(err);
  }

  if (!isSearchConsoleConfigured()) {
    return NextResponse.json({
      configured: false,
      message: 'Google Search Console no está configurado. Define GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY y GOOGLE_SEARCH_CONSOLE_SITE_URL en .env.local',
      serviceAccountEmail: getGoogleServiceAccountEmail(),
      siteUrl: getSearchConsoleSiteUrlOrNull(),
    });
  }

  try {
    const { searchParams } = new URL(request.url);
    const daysParam = searchParams.get('days');
    const days = daysParam === '7' ? 7 : daysParam === '90' ? 90 : 28;

    const data = await getSearchConsoleData(days as 7 | 28 | 90);

    return NextResponse.json({ configured: true, data });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido';
    return NextResponse.json(
      { configured: true, error: message },
      { status: 500 },
    );
  }
}
