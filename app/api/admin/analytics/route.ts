import { NextResponse } from 'next/server';
import { requireAdmin, authFailureResponse } from '@/lib/auth';
import {
  getAnalyticsData,
  isAnalyticsConfigured,
  getGoogleServiceAccountEmail,
  getAnalyticsPropertyIdOrNull,
} from '@/lib/google';

export async function GET(request: Request) {
  try {
    requireAdmin(request);
  } catch (err) {
    return authFailureResponse(err);
  }

  if (!isAnalyticsConfigured()) {
    return NextResponse.json({
      configured: false,
      message: 'Google Analytics 4 no está configurado. Define GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY y GOOGLE_ANALYTICS_PROPERTY_ID en .env.local',
      serviceAccountEmail: getGoogleServiceAccountEmail(),
      propertyId: getAnalyticsPropertyIdOrNull(),
    });
  }

  try {
    const { searchParams } = new URL(request.url);
    const daysParam = searchParams.get('days');
    const days = daysParam === '7' ? 7 : daysParam === '90' ? 90 : 28;

    const result = await getAnalyticsData(days as 7 | 28 | 90);

    return NextResponse.json({ configured: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido';
    return NextResponse.json(
      { configured: true, error: message },
      { status: 500 },
    );
  }
}
