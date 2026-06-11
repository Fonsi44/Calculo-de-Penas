import { google } from 'googleapis';

function getCredentials() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;

  if (!email || !key) {
    throw new Error(
      'Faltan credenciales de Google. Define GOOGLE_SERVICE_ACCOUNT_EMAIL y GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY en .env.local',
    );
  }

  return {
    client_email: email,
    private_key: key.replace(/\\n/g, '\n'),
  };
}

function getAnalyticsPropertyId(): string {
  const id = process.env.GOOGLE_ANALYTICS_PROPERTY_ID;
  if (!id) {
    throw new Error('Falta GOOGLE_ANALYTICS_PROPERTY_ID en .env.local');
  }
  return id;
}

function getSearchConsoleSiteUrl(): string {
  const url = process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL;
  if (!url) {
    throw new Error('Falta GOOGLE_SEARCH_CONSOLE_SITE_URL en .env.local');
  }
  return url;
}

export function getGoogleServiceAccountEmail(): string | null {
  return process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ?? null;
}

export function getAnalyticsPropertyIdOrNull(): string | null {
  return process.env.GOOGLE_ANALYTICS_PROPERTY_ID ?? null;
}

export function getSearchConsoleSiteUrlOrNull(): string | null {
  return process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL ?? null;
}

export function isGoogleConfigured(): boolean {
  return !!(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
    process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
  );
}

export function isAnalyticsConfigured(): boolean {
  return isGoogleConfigured() && !!process.env.GOOGLE_ANALYTICS_PROPERTY_ID;
}

export function isSearchConsoleConfigured(): boolean {
  return isGoogleConfigured() && !!process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL;
}

export type AnalyticsDateRange = {
  startDate: string;
  endDate: string;
};

export type AnalyticsMetrics = {
  activeUsers: number | null;
  sessions: number | null;
  screenPageViews: number | null;
  newUsers: number | null;
  averageSessionDuration: number | null;
  bounceRate: number | null;
};

export type AnalyticsRow = {
  dimension: string;
  metric: number | null;
};

export type AnalyticsResponse = {
  metrics: AnalyticsMetrics;
  topPages: AnalyticsRow[];
  trafficSources: AnalyticsRow[];
  countries: AnalyticsRow[];
  devices: AnalyticsRow[];
  dateRange: AnalyticsDateRange;
};

function mapRow(
  row: { dimensionValues?: { value?: string | null }[] | null; metricValues?: { value?: string | null }[] | null } | undefined,
  metricIndex = 0,
): AnalyticsRow {
  return {
    dimension: row?.dimensionValues?.[0]?.value ?? 'unknown',
    metric: row?.metricValues?.[metricIndex]?.value
      ? Number(row.metricValues[metricIndex].value)
      : null,
  };
}

export async function getAnalyticsData(
  days: 7 | 28 | 90 = 28,
): Promise<AnalyticsResponse> {
  const propertyId = getAnalyticsPropertyId();
  const credentials = getCredentials();

  const auth = new google.auth.JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
  });

  const analytics = google.analyticsdata({ version: 'v1beta', auth });

  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date(Date.now() - days * 86400000)
    .toISOString()
    .split('T')[0];

  const dateRange: AnalyticsDateRange = { startDate, endDate };
  const property = `properties/${propertyId}`;

  const [metricsRes, pagesRes, sourcesRes, countriesRes, devicesRes] =
    await Promise.all([
      analytics.properties.runReport({
        property,
        requestBody: {
          dateRanges: [{ startDate, endDate }],
          metrics: [
            { name: 'activeUsers' },
            { name: 'sessions' },
            { name: 'screenPageViews' },
            { name: 'newUsers' },
            { name: 'averageSessionDuration' },
            { name: 'bounceRate' },
          ],
        },
      }),
      analytics.properties.runReport({
        property,
        requestBody: {
          dateRanges: [{ startDate, endDate }],
          dimensions: [{ name: 'pagePath' }],
          metrics: [{ name: 'screenPageViews' }],
          orderBys: [{ metric: { metricName: 'screenPageViews' as const }, desc: true }],
          limit: '20',
        } as Record<string, unknown>,
      }),
      analytics.properties.runReport({
        property,
        requestBody: {
          dateRanges: [{ startDate, endDate }],
          dimensions: [{ name: 'sessionSource' }],
          metrics: [{ name: 'sessions' }],
          orderBys: [{ metric: { metricName: 'sessions' as const }, desc: true }],
          limit: '10',
        } as Record<string, unknown>,
      }),
      analytics.properties.runReport({
        property,
        requestBody: {
          dateRanges: [{ startDate, endDate }],
          dimensions: [{ name: 'country' }],
          metrics: [{ name: 'activeUsers' }],
          orderBys: [{ metric: { metricName: 'activeUsers' as const }, desc: true }],
          limit: '10',
        } as Record<string, unknown>,
      }),
      analytics.properties.runReport({
        property,
        requestBody: {
          dateRanges: [{ startDate, endDate }],
          dimensions: [{ name: 'deviceCategory' }],
          metrics: [{ name: 'activeUsers' }],
        },
      }),
    ]);

  const mainRows = metricsRes.data.rows ?? [];

  const getMetric = (rows: { metricValues?: { value?: string | null }[] | null }[] | undefined, idx: number): number | null => {
    const val = rows?.[0]?.metricValues?.[idx]?.value;
    return val ? Number(val) : null;
  };

  return {
    metrics: {
      activeUsers: getMetric(mainRows, 0),
      sessions: getMetric(mainRows, 1),
      screenPageViews: getMetric(mainRows, 2),
      newUsers: getMetric(mainRows, 3),
      averageSessionDuration: getMetric(mainRows, 4),
      bounceRate: getMetric(mainRows, 5),
    },
    topPages: (pagesRes.data.rows ?? []).map((r) => mapRow(r)),
    trafficSources: (sourcesRes.data.rows ?? []).map((r) => mapRow(r)),
    countries: (countriesRes.data.rows ?? []).map((r) => mapRow(r)),
    devices: (devicesRes.data.rows ?? []).map((r) => mapRow(r)),
    dateRange,
  };
}

export async function getAnalyticsForUrl(
  urlPath: string,
  days: 7 | 28 | 90 = 28,
): Promise<{ pageViews: number | null; activeUsers: number | null }> {
  const propertyId = getAnalyticsPropertyId();
  const credentials = getCredentials();

  const auth = new google.auth.JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
  });

  const analytics = google.analyticsdata({ version: 'v1beta', auth });

  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date(Date.now() - days * 86400000)
    .toISOString()
    .split('T')[0];

  const res = await analytics.properties.runReport({
    property: `properties/${propertyId}`,
    requestBody: {
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'pagePath' }],
      metrics: [{ name: 'screenPageViews' }, { name: 'activeUsers' }],
      dimensionFilter: {
        filter: {
          fieldName: 'pagePath',
          stringFilter: { value: urlPath, matchType: 'CONTAINS' },
        },
      },
    },
  });

  const rows = res.data.rows ?? [];
  if (rows.length === 0) {
    return { pageViews: null, activeUsers: null };
  }

  return {
    pageViews: rows[0]?.metricValues?.[0]?.value
      ? Number(rows[0].metricValues[0].value)
      : null,
    activeUsers: rows[0]?.metricValues?.[1]?.value
      ? Number(rows[0].metricValues[1].value)
      : null,
  };
}

/* -------------------------------------------------------------------------- */
/*  Google Search Console API                                                  */
/* -------------------------------------------------------------------------- */

export type SearchConsoleRow = {
  dimension: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
};

export type SearchConsoleResponse = {
  queries: SearchConsoleRow[];
  pages: SearchConsoleRow[];
  totalClicks: number;
  totalImpressions: number;
  totalCtr: number;
  averagePosition: number;
  dateRange: AnalyticsDateRange;
};

export async function getSearchConsoleData(
  days: 7 | 28 | 90 = 28,
): Promise<SearchConsoleResponse> {
  const siteUrl = getSearchConsoleSiteUrl();
  const credentials = getCredentials();

  const auth = new google.auth.JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
  });

  const searchconsole = google.searchconsole({ version: 'v1', auth });

  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date(Date.now() - days * 86400000)
    .toISOString()
    .split('T')[0];

  const dateRange: AnalyticsDateRange = { startDate, endDate };

  const [queriesRes, pagesRes] = await Promise.all([
    searchconsole.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate,
        endDate,
        dimensions: ['query'],
        rowLimit: 20,
      },
    }),
    searchconsole.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate,
        endDate,
        dimensions: ['page'],
        rowLimit: 20,
      },
    }),
  ]);

  const mapRows = (
    rows: { keys?: string[] | null; clicks?: number | null; impressions?: number | null; ctr?: number | null; position?: number | null }[] | undefined,
  ): SearchConsoleRow[] => {
    if (!rows) return [];
    return rows.map((r) => ({
      dimension: r.keys?.[0] ?? 'unknown',
      clicks: r.clicks ?? 0,
      impressions: r.impressions ?? 0,
      ctr: r.ctr ?? 0,
      position: r.position ?? 0,
    }));
  };

  const queryRows = queriesRes.data.rows ?? [];
  const pageRows = pagesRes.data.rows ?? [];

  const totalClicks = queryRows.reduce((s, r) => s + (r.clicks ?? 0), 0);
  const totalImpressions = queryRows.reduce((s, r) => s + (r.impressions ?? 0), 0);
  const totalCtr = totalImpressions > 0 ? totalClicks / totalImpressions : 0;
  const averagePosition =
    queryRows.length > 0
      ? queryRows.reduce((s, r) => s + (r.position ?? 0), 0) / queryRows.length
      : 0;

  return {
    queries: mapRows(queryRows),
    pages: mapRows(pageRows),
    totalClicks,
    totalImpressions,
    totalCtr,
    averagePosition,
    dateRange,
  };
}

export async function getSearchConsoleForUrl(
  urlPath: string,
  days: 7 | 28 | 90 = 28,
): Promise<{
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
} | null> {
  const siteUrl = getSearchConsoleSiteUrl();
  const credentials = getCredentials();

  const auth = new google.auth.JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
  });

  const searchconsole = google.searchconsole({ version: 'v1', auth });

  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date(Date.now() - days * 86400000)
    .toISOString()
    .split('T')[0];

  const res = await searchconsole.searchanalytics.query({
    siteUrl,
    requestBody: {
      startDate,
      endDate,
      dimensions: ['page'],
      dimensionFilterGroups: [
        {
          filters: [
            {
              dimension: 'page',
              operator: 'contains',
              expression: urlPath,
            },
          ],
        },
      ],
      rowLimit: 1,
    },
  });

  const rows = res.data.rows ?? [];
  if (rows.length === 0) return null;

  return {
    clicks: rows[0]?.clicks ?? 0,
    impressions: rows[0]?.impressions ?? 0,
    ctr: rows[0]?.ctr ?? 0,
    position: rows[0]?.position ?? 0,
  };
}

/* -------------------------------------------------------------------------- */
/*  URL Inspection API                                                        */
/* -------------------------------------------------------------------------- */

export type UrlInspectionResult = {
  url: string;
  indexStatus: string | null;
  coverageState: string | null;
  crawlingDate: string | null;
  indexingState: string | null;
  pageFetchState: string | null;
  robotsTxtState: string | null;
  sitemapState: string | null;
  canonical: string | null;
  userCanonical: string | null;
  isIndexable: boolean | null;
  isBlockedByRobots: boolean | null;
  isBlockedByNoindex: boolean | null;
  richResults: unknown | null;
  error: string | null;
};

export async function inspectUrl(
  urlToInspect: string,
): Promise<UrlInspectionResult> {
  const siteUrl = getSearchConsoleSiteUrl();
  const credentials = getCredentials();

  const auth = new google.auth.JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
  });

  const searchconsole = google.searchconsole({ version: 'v1', auth });

  const result: UrlInspectionResult = {
    url: urlToInspect,
    indexStatus: null,
    coverageState: null,
    crawlingDate: null,
    indexingState: null,
    pageFetchState: null,
    robotsTxtState: null,
    sitemapState: null,
    canonical: null,
    userCanonical: null,
    isIndexable: null,
    isBlockedByRobots: null,
    isBlockedByNoindex: null,
    richResults: null,
    error: null,
  };

  try {
    const res = await searchconsole.urlInspection.index.inspect({
      requestBody: {
        inspectionUrl: urlToInspect,
        siteUrl,
        languageCode: 'es-HN',
      },
    });

    const ins = res.data.inspectionResult;
    if (!ins) {
      result.error = 'No se pudo obtener resultado de inspección';
      return result;
    }

    const indexStatus = ins.indexStatusResult;
    if (indexStatus) {
      result.indexStatus = indexStatus.verdict ?? null;
      result.coverageState = indexStatus.coverageState ?? null;
      result.crawlingDate = indexStatus.lastCrawlTime ?? null;
      result.indexingState = indexStatus.indexingState ?? null;
      result.pageFetchState = indexStatus.pageFetchState ?? null;
      result.robotsTxtState = indexStatus.robotsTxtState ?? null;
      result.sitemapState = indexStatus.sitemap?.join(', ') ?? null;
      result.canonical = indexStatus.googleCanonical ?? null;
      result.userCanonical = indexStatus.userCanonical ?? null;

      result.isBlockedByRobots = indexStatus.robotsTxtState === 'BLOCKED';
      result.isBlockedByNoindex = indexStatus.indexingState === 'BLOCKED_BY_NOINDEX';

      result.isIndexable =
        indexStatus.verdict === 'PASS' ||
        indexStatus.coverageState === 'Submitted and indexed';

      result.richResults = ins.richResultsResult ?? null;
    }

    result.error = null;
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Error desconocido al inspeccionar URL';
    result.error = message;
  }

  return result;
}
