import { NextResponse } from 'next/server';
import { requireAdmin, authFailureResponse } from '@/lib/auth';
import { getAuth } from '@/lib/google';
import { google } from 'googleapis';
import { cachedGsc } from '@/lib/cache-dashboard';

function getDateRange(days: number) {
  const end = new Date();
  const endStr = end.toISOString().split('T')[0];
  const start = new Date(Date.now() - days * 86400000);
  const startStr = start.toISOString().split('T')[0];
  return { startStr, endStr };
}

function validateDays(days: number): 7 | 28 | 90 {
  if (days === 7 || days === 28 || days === 90) return days;
  return 28;
}

export async function GET(request: Request) {
  try {
    requireAdmin(request);
  } catch (err) {
    return authFailureResponse(err);
  }

  const { searchParams } = new URL(request.url);
  const days = validateDays(parseInt(searchParams.get('days') ?? '28', 10));
  const siteUrl = process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL;

  if (!siteUrl) {
    return NextResponse.json({ configured: false, success: false, status: 'not_configured', message: 'Falta GOOGLE_SEARCH_CONSOLE_SITE_URL' });
  }

  try {
    const data = await cachedGsc(async () => {
      const auth = getAuth(['https://www.googleapis.com/auth/webmasters.readonly']);
      const sc = google.searchconsole({ version: 'v1', auth });
      const current = getDateRange(days);
      const prevEnd = new Date(Date.now() - days * 86400000);
      prevEnd.setDate(prevEnd.getDate() - 1);
      const prevStart = new Date(prevEnd.getTime() - days * 86400000);

      const [currDaily, currQueries, prevTotals] = await Promise.all([
        sc.searchanalytics.query({
          siteUrl,
          requestBody: { startDate: current.startStr, endDate: current.endStr, dimensions: ['date'], rowLimit: days },
        }),
        sc.searchanalytics.query({
          siteUrl,
          requestBody: { startDate: current.startStr, endDate: current.endStr, dimensions: ['query'], rowLimit: 20 },
        }),
        sc.searchanalytics.query({
          siteUrl,
          requestBody: { startDate: prevStart.toISOString().split('T')[0], endDate: prevEnd.toISOString().split('T')[0], dimensions: ['date'], rowLimit: days },
        }),
      ]);

      const currTotClicks = (currDaily.data.rows ?? []).reduce((s, r) => s + (r.clicks ?? 0), 0);
      const currTotImp = (currDaily.data.rows ?? []).reduce((s, r) => s + (r.impressions ?? 0), 0);
      const prevTotClicks = (prevTotals.data.rows ?? []).reduce((s, r) => s + (r.clicks ?? 0), 0);
      const prevTotImp = (prevTotals.data.rows ?? []).reduce((s, r) => s + (r.impressions ?? 0), 0);

      const calcChange = (curr: number, prev: number) => (prev > 0 ? Math.round(((curr - prev) / prev) * 1000) / 10 : null);

      const timeline = (currDaily.data.rows ?? []).map((r) => ({
        date: r.keys?.[0] ?? '',
        clicks: r.clicks ?? 0,
        impressions: r.impressions ?? 0,
        ctr: r.ctr ?? 0,
        position: r.position ?? 0,
      }));

      return {
        data: timeline,
        totals: { clicks: currTotClicks, impressions: currTotImp },
        previousPeriod: {
          totals: { clicks: prevTotClicks, impressions: prevTotImp },
          changes: { clicks: calcChange(currTotClicks, prevTotClicks), impressions: calcChange(currTotImp, prevTotImp) },
        },
        topQueries: (currQueries.data.rows ?? []).map((r) => ({
          query: r.keys?.[0] ?? '',
          clicks: r.clicks ?? 0,
          impressions: r.impressions ?? 0,
          ctr: r.ctr ?? 0,
          position: r.position ?? 0,
        })),
      };
    }, 900);

    return NextResponse.json({
      configured: true,
      success: true,
      status: 'ok',
      ...data,
      lastUpdatedAt: new Date().toISOString(),
      source: 'cache',
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error desconocido';
    if (msg.includes('permission') || msg.includes('403')) {
      return NextResponse.json({ configured: true, success: false, status: 'permission_denied', message: msg });
    }
    return NextResponse.json({ configured: true, success: false, status: 'error', message: msg });
  }
}
