import { NextResponse } from 'next/server';
import { requireAdmin, authFailureResponse } from '@/lib/auth';
import { getAuth } from '@/lib/google';
import { google } from 'googleapis';
import { cachedAnalytics } from '@/lib/cache-dashboard';

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

  const propertyId = process.env.GOOGLE_ANALYTICS_PROPERTY_ID;
  if (!propertyId) {
    return NextResponse.json({ configured: false, success: false, status: 'not_configured', message: 'Falta GOOGLE_ANALYTICS_PROPERTY_ID' });
  }

  try {
    const data = await cachedAnalytics(async () => {
      const auth = getAuth(['https://www.googleapis.com/auth/analytics.readonly']);
      const analytics = google.analyticsdata({ version: 'v1beta', auth });
      const property = `properties/${propertyId}`;

      const current = getDateRange(days);
      const previous = getDateRange(days * 2);
      const prevStart = previous.startStr;
      const prevEnd = previous.endStr;
      const currStart = current.startStr;
      const currEnd = current.endStr;

      // Current period (with daily breakdown)
      const [currDaily, currDevices, currSources] = await Promise.all([
        analytics.properties.runReport({
          property,
          requestBody: {
            dateRanges: [{ startDate: currStart, endDate: currEnd }],
            dimensions: [{ name: 'date' }],
            metrics: [{ name: 'activeUsers' }, { name: 'sessions' }, { name: 'screenPageViews' }, { name: 'newUsers' }],
          },
        }),
        analytics.properties.runReport({
          property,
          requestBody: {
            dateRanges: [{ startDate: currStart, endDate: currEnd }],
            dimensions: [{ name: 'deviceCategory' }],
            metrics: [{ name: 'activeUsers' }],
          },
        }),
        analytics.properties.runReport({
          property,
          requestBody: {
            dateRanges: [{ startDate: currStart, endDate: currEnd }],
            dimensions: [{ name: 'sessionSource' }],
            metrics: [{ name: 'sessions' }],
            orderBys: [{ metric: { metricName: 'sessions' as const }, desc: true }],
            limit: '10',
          },
        }),
      ]);

      // Previous period totals for comparison
      const prevTotals = await analytics.properties.runReport({
        property,
        requestBody: {
          dateRanges: [{ startDate: prevStart, endDate: currStart }],
          metrics: [{ name: 'activeUsers' }, { name: 'sessions' }, { name: 'screenPageViews' }, { name: 'newUsers' }],
        },
      });

      const currTotals = currDaily.data.totals?.[0]?.metricValues ?? [];
      const prevVals = prevTotals.data.totals?.[0]?.metricValues ?? [];

      const getVal = (arr: { value?: string | null }[] | undefined, i: number) => (arr?.[i]?.value ? Number(arr[i].value) : 0);
      const calcChange = (curr: number, prev: number) => (prev > 0 ? Math.round(((curr - prev) / prev) * 1000) / 10 : null);

      const timeline = (currDaily.data.rows ?? []).map((r) => ({
        date: r.dimensionValues?.[0]?.value ?? '',
        activeUsers: Number(r.metricValues?.[0]?.value ?? 0),
        sessions: Number(r.metricValues?.[1]?.value ?? 0),
        screenPageViews: Number(r.metricValues?.[2]?.value ?? 0),
        newUsers: Number(r.metricValues?.[3]?.value ?? 0),
      }));

      return {
        data: timeline,
        totals: {
          activeUsers: getVal(currTotals, 0),
          sessions: getVal(currTotals, 1),
          screenPageViews: getVal(currTotals, 2),
          newUsers: getVal(currTotals, 3),
        },
        previousPeriod: {
          totals: {
            activeUsers: getVal(prevVals, 0),
            sessions: getVal(prevVals, 1),
            screenPageViews: getVal(prevVals, 2),
            newUsers: getVal(prevVals, 3),
          },
          changes: {
            activeUsers: calcChange(getVal(currTotals, 0), getVal(prevVals, 0)),
            sessions: calcChange(getVal(currTotals, 1), getVal(prevVals, 1)),
            screenPageViews: calcChange(getVal(currTotals, 2), getVal(prevVals, 2)),
            newUsers: calcChange(getVal(currTotals, 3), getVal(prevVals, 3)),
          },
        },
        deviceBreakdown: (currDevices.data.rows ?? []).map((r) => ({
          device: r.dimensionValues?.[0]?.value ?? 'unknown',
          users: Number(r.metricValues?.[0]?.value ?? 0),
        })),
        sourceBreakdown: (currSources.data.rows ?? []).map((r) => ({
          source: r.dimensionValues?.[0]?.value ?? 'unknown',
          sessions: Number(r.metricValues?.[0]?.value ?? 0),
        })),
      };
    }, 600);

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
