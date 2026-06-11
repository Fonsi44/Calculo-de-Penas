'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Search, BarChart3, Globe, FileText, CheckCircle2, AlertTriangle,
  ExternalLink, Activity, MousePointerClick, Smartphone,
  Laptop, Monitor,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Input } from '@/components/ui/input';

type TabId = 'resumen' | 'analytics' | 'search-console' | 'indexacion' | 'sitemap' | 'acciones';

const TABS: { id: TabId; label: string; icon: typeof BarChart3 }[] = [
  { id: 'resumen', label: 'Resumen SEO', icon: BarChart3 },
  { id: 'analytics', label: 'Analytics', icon: Activity },
  { id: 'search-console', label: 'Search Console', icon: MousePointerClick },
  { id: 'indexacion', label: 'Indexación', icon: Globe },
  { id: 'sitemap', label: 'Sitemap', icon: FileText },
  { id: 'acciones', label: 'Acciones', icon: AlertTriangle },
];

type Metrics = {
  activeUsers: number | null;
  sessions: number | null;
  screenPageViews: number | null;
  newUsers: number | null;
  averageSessionDuration: number | null;
  bounceRate: number | null;
};

type Row = { dimension: string; metric: number | null };

type AnalyticsData = {
  configured: boolean;
  metrics: Metrics;
  topPages: Row[];
  trafficSources: Row[];
  countries: Row[];
  devices: Row[];
  dateRange: { startDate: string; endDate: string };
  error?: string | null;
};

type SCRow = { dimension: string; clicks: number; impressions: number; ctr: number; position: number };

type SCData = {
  configured: boolean;
  totalClicks: number;
  totalImpressions: number;
  totalCtr: number;
  averagePosition: number;
  topQueries: SCRow[];
  topPages: SCRow[];
  dateRange: { startDate: string; endDate: string };
  error?: string | null;
};

type SummaryData = {
  site: {
    url: string;
    noindex: boolean;
    gaConfigured: boolean;
    gscConfigured: boolean;
    gaFrontendConfigured: boolean;
    indexNowConfigured: boolean;
    indexNowStatus: string;
    serviceAccountEmail: string | null;
    analyticsPropertyId: string | null;
    searchConsoleSiteUrl: string | null;
  };
  content: { totalPosts: number; publishedPosts: number; draftPosts: number; publicPages: number };
  analytics: AnalyticsData | { configured: false; error: string | null };
  searchConsole: SCData | { configured: false; error: string | null };
  status?: {
    sitemap: string;
    robots: string;
    jsonLd: string;
    indexNow: string;
    noindex: string;
    gaFrontend: string;
    gaBackend: string;
    searchConsole: string;
  };
};

type InspectResult = {
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

type SitemapData = {
  url: string;
  noindex: boolean;
  totalIncluded: number;
  staticRoutes: number;
  categories: number;
  blogPostsTotal: number;
  blogPostsPublished: number;
  blogPostsDrafts: number;
  sampleUrls: string[];
  note: string | null;
};

function fmtNum(n: number | null | undefined): string {
  if (n === null || n === undefined) return '—';
  return n.toLocaleString('es-HN', { maximumFractionDigits: 0 });
}

function fmtPct(n: number | null | undefined): string {
  if (n === null || n === undefined) return '—';
  return `${(n * 100).toFixed(1)}%`;
}

function fmtPos(n: number | null | undefined): string {
  if (n === null || n === undefined) return '—';
  return n.toFixed(1);
}

function fmtDuration(s: number | null | undefined): string {
  if (s === null || s === undefined) return '—';
  const min = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${min}m ${sec}s`;
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('es-HN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch { return iso; }
}

function StatusBadge({ status }: { status: string | null | undefined }) {
  if (!status) return <Badge tone="neutral">Desconocido</Badge>;
  if (status === 'PASS' || status === 'Submitted and indexed' || status === 'YES')
    return <Badge tone="success">Correcto</Badge>;
  if (status === 'PARTIAL')
    return <Badge tone="warning">Parcial</Badge>;
  if (status === 'FAIL' || status === 'BLOCKED' || status === 'BLOCKED_BY_NOINDEX')
    return <Badge tone="danger">Error</Badge>;
  return <Badge tone="neutral">{status}</Badge>;
}

export default function SeoDashboardPage() {
  const [tab, setTab] = useState<TabId>('resumen');
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [scData, setScData] = useState<SCData | null>(null);
  const [sitemapData, setSitemapData] = useState<SitemapData | null>(null);
  const [inspectUrl, setInspectUrl] = useState('');
  const [inspectResult, setInspectResult] = useState<InspectResult | null>(null);
  const [inspecting, setInspecting] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [loadingSC, setLoadingSC] = useState(false);
  const [analyticsDays, setAnalyticsDays] = useState<7 | 28 | 90>(28);
  const [scDays, setScDays] = useState<7 | 28 | 90>(28);

  const fetchAnalytics = useCallback(async (days: 7 | 28 | 90) => {
    setLoadingAnalytics(true);
    try {
      const res = await fetch(`/api/admin/analytics?days=${days}`);
      const data = await res.json();
      setAnalytics(data);
    } catch { /* ignore */ }
    setLoadingAnalytics(false);
  }, []);

  const fetchSC = useCallback(async (days: 7 | 28 | 90) => {
    setLoadingSC(true);
    try {
      const res = await fetch(`/api/admin/search-console?days=${days}`);
      const data = await res.json();
      setScData(data);
    } catch { /* ignore */ }
    setLoadingSC(false);
  }, []);

  const doInspect = useCallback(async () => {
    if (!inspectUrl.trim()) return;
    setInspecting(true);
    setInspectResult(null);
    try {
      const res = await fetch('/api/admin/seo/inspect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: inspectUrl.trim() }),
      });
      const data = await res.json();
      setInspectResult(data.result ?? null);
    } catch { /* ignore */ }
    setInspecting(false);
  }, [inspectUrl]);

  useEffect(() => {
    const load = async () => {
      try {
        const [s, sm] = await Promise.all([
          fetch('/api/admin/seo/summary'),
          fetch('/api/admin/seo/sitemap'),
        ]);
        const summaryData = await s.json();
        const sitemapData = await sm.json();
        setSummary(summaryData);
        setSitemapData(sitemapData);
      } catch { /* ignore */ }
      setLoadingSummary(false);
    };
    load();
  }, []);

  const DEFAULT_URLS = [
    'https://www.pinedayasociadoshn.com/',
    'https://www.pinedayasociadoshn.com/despacho',
    'https://www.pinedayasociadoshn.com/servicios-juridicos',
    'https://www.pinedayasociadoshn.com/derecho-penal',
    'https://www.pinedayasociadoshn.com/blog',
    'https://www.pinedayasociadoshn.com/preguntas-frecuentes',
    'https://www.pinedayasociadoshn.com/solicitar-consulta',
  ];

  function renderSummary() {
    if (loadingSummary) return <div className="flex justify-center py-12"><Spinner /></div>;
    if (!summary) return <p className="text-center text-text-secondary py-8">No se pudo cargar el resumen SEO.</p>;

    const s = summary;

    return (
      <div className="space-y-5">
        {/* Status cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <Card padding="sm" className="text-center">
            <p className="text-xl font-extrabold text-primary tabular-nums">{s.content.publicPages}</p>
            <p className="text-xxs text-text-muted uppercase tracking-wider">Páginas públicas</p>
          </Card>
          <Card padding="sm" className="text-center">
            <p className="text-xl font-extrabold text-success tabular-nums">{s.content.publishedPosts}</p>
            <p className="text-xxs text-text-muted uppercase tracking-wider">Posts publicados</p>
          </Card>
          <Card padding="sm" className="text-center">
            <p className="text-xl font-extrabold text-warning tabular-nums">{s.content.draftPosts}</p>
            <p className="text-xxs text-text-muted uppercase tracking-wider">Borradores</p>
          </Card>
          <Card padding="sm" className="text-center">
            <p className={`text-xl font-extrabold tabular-nums ${s.site.noindex ? 'text-danger' : 'text-success'}`}>
              {s.site.noindex ? 'NOINDEX' : 'INDEXABLE'}
            </p>
            <p className="text-xxs text-text-muted uppercase tracking-wider">Estado global</p>
          </Card>
        </div>

        {s.site.noindex && (
          <Card padding="md" className="border-danger/50 bg-danger/5">
            <div className="flex items-start gap-3">
              <AlertTriangle size={20} className="text-danger flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm text-danger">NEXT_PUBLIC_NOINDEX=true</p>
                <p className="text-xs text-text-secondary mt-1">
                  El sitio completo está bloqueado para indexación. Google no indexará ninguna página.
                  Para producción, cambiar NEXT_PUBLIC_NOINDEX a false en .env.local.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* API Status */}
        <div>
          <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Estado de integraciones</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Card padding="sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity size={16} className={s.site.gaConfigured ? 'text-success' : 'text-text-muted'} />
                  <span className="text-sm font-medium text-text">GA4 Data API</span>
                </div>
                <Badge tone={s.site.gaConfigured ? 'success' : 'neutral'}>
                  {s.site.gaConfigured ? 'Configurado' : 'Sin configurar'}
                </Badge>
              </div>
              {s.site.gaConfigured && s.site.analyticsPropertyId && (
                <p className="text-xxs text-text-muted mt-1">Property: {s.site.analyticsPropertyId}</p>
              )}
            </Card>
            <Card padding="sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Search size={16} className={s.site.gscConfigured ? 'text-success' : 'text-text-muted'} />
                  <span className="text-sm font-medium text-text">Search Console API</span>
                </div>
                <Badge tone={s.site.gscConfigured ? 'success' : 'neutral'}>
                  {s.site.gscConfigured ? 'Configurado' : 'Sin configurar'}
                </Badge>
              </div>
              {s.site.gscConfigured && s.site.searchConsoleSiteUrl && (
                <p className="text-xxs text-text-muted mt-1">Site: {s.site.searchConsoleSiteUrl}</p>
              )}
            </Card>
            <Card padding="sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 size={16} className={s.site.gaFrontendConfigured ? 'text-success' : 'text-text-muted'} />
                  <span className="text-sm font-medium text-text">GA4 Frontend</span>
                </div>
                <Badge tone={s.site.gaFrontendConfigured ? 'success' : 'neutral'}>
                  {s.site.gaFrontendConfigured ? 'Activo' : 'Sin configurar'}
                </Badge>
              </div>
            </Card>
            <Card padding="sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className={s.site.indexNowConfigured ? 'text-success' : 'text-text-muted'} />
                  <span className="text-sm font-medium text-text">IndexNow</span>
                </div>
                <Badge tone={s.site.indexNowConfigured ? 'success' : 'neutral'}>
                  {s.site.indexNowConfigured ? 'Configurado' : 'Sin configurar'}
                </Badge>
              </div>
            </Card>
          </div>
        </div>

        {/* Quick metrics from Analytics */}
        {'configured' in s.analytics && s.analytics.configured && 'metrics' in s.analytics && s.analytics.metrics && (
          <div>
            <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Méticas rápidas (28 días)</p>
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
              <Card padding="sm" className="text-center">
                <p className="text-lg font-extrabold text-primary tabular-nums">{fmtNum(s.analytics.metrics.activeUsers)}</p>
                <p className="text-xxs text-text-muted uppercase tracking-wider">Usuarios</p>
              </Card>
              <Card padding="sm" className="text-center">
                <p className="text-lg font-extrabold text-primary tabular-nums">{fmtNum(s.analytics.metrics.sessions)}</p>
                <p className="text-xxs text-text-muted uppercase tracking-wider">Sesiones</p>
              </Card>
              <Card padding="sm" className="text-center">
                <p className="text-lg font-extrabold text-primary tabular-nums">{fmtNum(s.analytics.metrics.screenPageViews)}</p>
                <p className="text-xxs text-text-muted uppercase tracking-wider">Páginas vistas</p>
              </Card>
              <Card padding="sm" className="text-center">
                <p className="text-lg font-extrabold text-primary tabular-nums">{fmtNum(s.analytics.metrics.newUsers)}</p>
                <p className="text-xxs text-text-muted uppercase tracking-wider">Nuevos</p>
              </Card>
              <Card padding="sm" className="text-center">
                <p className="text-lg font-extrabold text-primary tabular-nums">{fmtDuration(s.analytics.metrics.averageSessionDuration)}</p>
                <p className="text-xxs text-text-muted uppercase tracking-wider">Duración media</p>
              </Card>
              <Card padding="sm" className="text-center">
                <p className="text-lg font-extrabold text-primary tabular-nums">{fmtPct(s.analytics.metrics.bounceRate !== null ? s.analytics.metrics.bounceRate / 100 : null)}</p>
                <p className="text-xxs text-text-muted uppercase tracking-wider">Rebote</p>
              </Card>
            </div>
          </div>
        )}

        {/* Search Console quick metrics */}
        {'configured' in s.searchConsole && s.searchConsole.configured && 'totalClicks' in s.searchConsole && (
          <div>
            <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Search Console (28 días)</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <Card padding="sm" className="text-center">
                <p className="text-lg font-extrabold text-primary tabular-nums">{fmtNum(s.searchConsole.totalClicks)}</p>
                <p className="text-xxs text-text-muted uppercase tracking-wider">Clicks</p>
              </Card>
              <Card padding="sm" className="text-center">
                <p className="text-lg font-extrabold text-primary tabular-nums">{fmtNum(s.searchConsole.totalImpressions)}</p>
                <p className="text-xxs text-text-muted uppercase tracking-wider">Impresiones</p>
              </Card>
              <Card padding="sm" className="text-center">
                <p className="text-lg font-extrabold text-primary tabular-nums">{fmtPct(s.searchConsole.totalCtr)}</p>
                <p className="text-xxs text-text-muted uppercase tracking-wider">CTR</p>
              </Card>
              <Card padding="sm" className="text-center">
                <p className="text-lg font-extrabold text-primary tabular-nums">{fmtPos(s.searchConsole.averagePosition)}</p>
                <p className="text-xxs text-text-muted uppercase tracking-wider">Posición media</p>
              </Card>
            </div>
          </div>
        )}
      </div>
    );
  }

  function renderAnalytics() {
    const data = analytics;
    if (!data && !loadingAnalytics) {
      return (
        <div className="text-center py-8">
          <p className="text-text-secondary mb-4">Cargar datos de Google Analytics 4</p>
          <Button variant="primary" size="sm" onClick={() => fetchAnalytics(analyticsDays)}>
            <BarChart3 size={14} className="mr-1" /> Cargar Analytics
          </Button>
        </div>
      );
    }

    if (loadingAnalytics) return <div className="flex justify-center py-12"><Spinner /></div>;

    if (!data) return null;

    if (!data.configured) {
      return (
        <Card padding="md" className="border-warning/50 bg-warning/5">
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="text-warning flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm">GA4 no configurado</p>
              <p className="text-xs text-text-secondary mt-1">{'error' in data ? data.error : 'Define GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY y GOOGLE_ANALYTICS_PROPERTY_ID en .env.local'}</p>
            </div>
          </div>
        </Card>
      );
    }

    if ('error' in data && data.error) {
      return (
        <Card padding="md" className="border-danger/50 bg-danger/5">
          <p className="text-sm font-bold text-danger">Error al consultar GA4</p>
          <p className="text-xs text-text-secondary mt-1">{data.error}</p>
        </Card>
      );
    }

    const m = data.metrics;

    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            {([7, 28, 90] as const).map((d) => (
              <Button key={d} variant={analyticsDays === d ? 'primary' : 'ghost'} size="sm" onClick={() => { setAnalyticsDays(d); fetchAnalytics(d); }}>
                {d} días
              </Button>
            ))}
          </div>
          <p className="text-xxs text-text-muted">{data.dateRange.startDate} — {data.dateRange.endDate}</p>
        </div>

        {/* Main metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          <Card padding="sm" className="text-center">
            <p className="text-xl font-extrabold text-primary tabular-nums">{fmtNum(m.activeUsers)}</p>
            <p className="text-xxs text-text-muted uppercase">Usuarios activos</p>
          </Card>
          <Card padding="sm" className="text-center">
            <p className="text-xl font-extrabold text-primary tabular-nums">{fmtNum(m.sessions)}</p>
            <p className="text-xxs text-text-muted uppercase">Sesiones</p>
          </Card>
          <Card padding="sm" className="text-center">
            <p className="text-xl font-extrabold text-primary tabular-nums">{fmtNum(m.screenPageViews)}</p>
            <p className="text-xxs text-text-muted uppercase">Páginas vistas</p>
          </Card>
          <Card padding="sm" className="text-center">
            <p className="text-xl font-extrabold text-primary tabular-nums">{fmtNum(m.newUsers)}</p>
            <p className="text-xxs text-text-muted uppercase">Nuevos usuarios</p>
          </Card>
          <Card padding="sm" className="text-center">
            <p className="text-xl font-extrabold text-primary tabular-nums">{fmtDuration(m.averageSessionDuration)}</p>
            <p className="text-xxs text-text-muted uppercase">Duración media</p>
          </Card>
          <Card padding="sm" className="text-center">
            <p className="text-xl font-extrabold text-primary tabular-nums">{fmtPct(m.bounceRate !== null ? m.bounceRate / 100 : null)}</p>
            <p className="text-xxs text-text-muted uppercase">Rebote</p>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Top Pages */}
          <Card padding="md">
            <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Páginas más vistas</p>
            {data.topPages.length === 0 ? (
              <p className="text-sm text-text-secondary">Sin datos</p>
            ) : (
              <div className="space-y-1.5">
                {data.topPages.map((p, i) => (
                  <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-border/30 last:border-0">
                    <span className="text-text truncate max-w-[70%]">{p.dimension}</span>
                    <span className="font-semibold text-primary tabular-nums">{fmtNum(p.metric)}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Traffic Sources */}
          <Card padding="md">
            <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Fuentes de tráfico</p>
            {data.trafficSources.length === 0 ? (
              <p className="text-sm text-text-secondary">Sin datos</p>
            ) : (
              <div className="space-y-1.5">
                {data.trafficSources.map((s, i) => (
                  <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-border/30 last:border-0">
                    <span className="text-text truncate max-w-[70%]">{s.dimension || '(direct)'}</span>
                    <span className="font-semibold text-primary tabular-nums">{fmtNum(s.metric)}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Countries */}
          <Card padding="md">
            <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Países</p>
            {data.countries.length === 0 ? (
              <p className="text-sm text-text-secondary">Sin datos</p>
            ) : (
              <div className="space-y-1.5">
                {data.countries.map((c, i) => (
                  <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-border/30 last:border-0">
                    <span className="text-text truncate max-w-[70%]">{c.dimension || '(unknown)'}</span>
                    <span className="font-semibold text-primary tabular-nums">{fmtNum(c.metric)}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Devices */}
          <Card padding="md">
            <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Dispositivos</p>
            {data.devices.length === 0 ? (
              <p className="text-sm text-text-secondary">Sin datos</p>
            ) : (
              <div className="space-y-1.5">
                {data.devices.map((d, i) => (
                  <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-border/30 last:border-0">
                    <span className="flex items-center gap-1.5 text-text">
                      {d.dimension === 'mobile' ? <Smartphone size={12} /> : d.dimension === 'tablet' ? <Monitor size={12} /> : <Laptop size={12} />}
                      {d.dimension || '(unknown)'}
                    </span>
                    <span className="font-semibold text-primary tabular-nums">{fmtNum(d.metric)}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    );
  }

  function renderSearchConsole() {
    const data = scData;
    if (!data && !loadingSC) {
      return (
        <div className="text-center py-8">
          <p className="text-text-secondary mb-4">Cargar datos de Google Search Console</p>
          <Button variant="primary" size="sm" onClick={() => fetchSC(scDays)}>
            <Search size={14} className="mr-1" /> Cargar Search Console
          </Button>
        </div>
      );
    }

    if (loadingSC) return <div className="flex justify-center py-12"><Spinner /></div>;

    if (!data) return null;

    if (!data.configured) {
      return (
        <Card padding="md" className="border-warning/50 bg-warning/5">
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="text-warning flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm">Search Console no configurado</p>
              <p className="text-xs text-text-secondary mt-1">{'error' in data ? data.error : 'Define GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY y GOOGLE_SEARCH_CONSOLE_SITE_URL en .env.local'}</p>
            </div>
          </div>
        </Card>
      );
    }

    if ('error' in data && data.error) {
      return (
        <Card padding="md" className="border-danger/50 bg-danger/5">
          <p className="text-sm font-bold text-danger">Error al consultar Search Console</p>
          <p className="text-xs text-text-secondary mt-1">{data.error}</p>
        </Card>
      );
    }

    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            {([7, 28, 90] as const).map((d) => (
              <Button key={d} variant={scDays === d ? 'primary' : 'ghost'} size="sm" onClick={() => { setScDays(d); fetchSC(d); }}>
                {d} días
              </Button>
            ))}
          </div>
          <p className="text-xxs text-text-muted">{data.dateRange.startDate} — {data.dateRange.endDate}</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <Card padding="sm" className="text-center">
            <p className="text-xl font-extrabold text-primary tabular-nums">{fmtNum(data.totalClicks)}</p>
            <p className="text-xxs text-text-muted uppercase">Clicks</p>
          </Card>
          <Card padding="sm" className="text-center">
            <p className="text-xl font-extrabold text-primary tabular-nums">{fmtNum(data.totalImpressions)}</p>
            <p className="text-xxs text-text-muted uppercase">Impresiones</p>
          </Card>
          <Card padding="sm" className="text-center">
            <p className="text-xl font-extrabold text-primary tabular-nums">{fmtPct(data.totalCtr)}</p>
            <p className="text-xxs text-text-muted uppercase">CTR</p>
          </Card>
          <Card padding="sm" className="text-center">
            <p className="text-xl font-extrabold text-primary tabular-nums">{fmtPos(data.averagePosition)}</p>
            <p className="text-xxs text-text-muted uppercase">Posición media</p>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card padding="md">
            <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Principales consultas</p>
            {data.topQueries.length === 0 ? (
              <p className="text-sm text-text-secondary">Sin datos</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border/50 text-text-muted">
                      <th className="text-left pb-2 font-semibold">Consulta</th>
                      <th className="text-right pb-2 font-semibold">Clicks</th>
                      <th className="text-right pb-2 font-semibold">Impr.</th>
                      <th className="text-right pb-2 font-semibold">CTR</th>
                      <th className="text-right pb-2 font-semibold">Pos.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topQueries.map((q, i) => (
                      <tr key={i} className="border-b border-border/20 hover:bg-surface-alt">
                        <td className="py-1.5 pr-2 text-text max-w-[200px] truncate">{q.dimension}</td>
                        <td className="py-1.5 text-right tabular-nums font-medium">{q.clicks}</td>
                        <td className="py-1.5 text-right tabular-nums">{q.impressions}</td>
                        <td className="py-1.5 text-right tabular-nums">{fmtPct(q.ctr)}</td>
                        <td className="py-1.5 text-right tabular-nums">{fmtPos(q.position)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <Card padding="md">
            <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Páginas con mejor rendimiento</p>
            {data.topPages.length === 0 ? (
              <p className="text-sm text-text-secondary">Sin datos</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border/50 text-text-muted">
                      <th className="text-left pb-2 font-semibold">Página</th>
                      <th className="text-right pb-2 font-semibold">Clicks</th>
                      <th className="text-right pb-2 font-semibold">Impr.</th>
                      <th className="text-right pb-2 font-semibold">CTR</th>
                      <th className="text-right pb-2 font-semibold">Pos.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topPages.map((p, i) => (
                      <tr key={i} className="border-b border-border/20 hover:bg-surface-alt">
                        <td className="py-1.5 pr-2 text-text max-w-[200px] truncate" title={p.dimension}>{p.dimension}</td>
                        <td className="py-1.5 text-right tabular-nums font-medium">{p.clicks}</td>
                        <td className="py-1.5 text-right tabular-nums">{p.impressions}</td>
                        <td className="py-1.5 text-right tabular-nums">{fmtPct(p.ctr)}</td>
                        <td className="py-1.5 text-right tabular-nums">{fmtPos(p.position)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      </div>
    );
  }

  function renderIndexacion() {
    return (
      <div className="space-y-5">
        <Card padding="md">
          <p className="text-sm font-bold text-text mb-2">Inspeccionar URL</p>
          <p className="text-xs text-text-secondary mb-3">
            Usa la URL Inspection API de Google Search Console para auditar el estado de indexación de cualquier URL.
          </p>
          <div className="flex gap-2">
            <Input
              value={inspectUrl}
              onChange={(e) => setInspectUrl(e.target.value)}
              placeholder="https://www.pinedayasociadoshn.com/..."
              className="flex-1"
            />
            <Button variant="primary" size="sm" onClick={doInspect} disabled={inspecting || !inspectUrl.trim()}>
              {inspecting ? <Spinner /> : <Search size={14} className="mr-1" />}
              Inspeccionar
            </Button>
          </div>

          <div className="flex flex-wrap gap-2 mt-3">
            {DEFAULT_URLS.map((u) => (
              <button
                key={u}
                onClick={() => setInspectUrl(u)}
                className="text-xxs px-2 py-1 rounded bg-surface-alt text-text-secondary hover:bg-accent/10 hover:text-primary transition-colors border border-border/30"
              >
                {u.replace('https://www.pinedayasociadoshn.com', '') || '/'}
              </button>
            ))}
          </div>
        </Card>

        {inspectResult && (
          <Card padding="md">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold text-text truncate max-w-[70%]" title={inspectResult.url}>
                {inspectResult.url}
              </p>
              <StatusBadge status={inspectResult.indexStatus} />
            </div>

            {inspectResult.error && (
              <div className="flex items-start gap-2 p-3 rounded bg-danger/5 border border-danger/30 mb-3">
                <AlertTriangle size={14} className="text-danger flex-shrink-0 mt-0.5" />
                <p className="text-xs text-danger">{inspectResult.error}</p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="space-y-1">
                <p className="text-text-muted">Estado de cobertura:</p>
                <p className="font-medium text-text">{inspectResult.coverageState ?? '—'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-text-muted">Indexable:</p>
                <p className="font-medium">
                  {inspectResult.isIndexable === true ? <span className="text-success">Sí</span> : inspectResult.isIndexable === false ? <span className="text-danger">No</span> : '—'}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-text-muted">Bloqueado por robots.txt:</p>
                <p className="font-medium">{inspectResult.isBlockedByRobots ? <span className="text-danger">Sí</span> : 'No'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-text-muted">Bloqueado por noindex:</p>
                <p className="font-medium">{inspectResult.isBlockedByNoindex ? <span className="text-danger">Sí</span> : 'No'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-text-muted">Canonical (Google):</p>
                <p className="font-medium text-text break-all">{inspectResult.canonical ?? '—'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-text-muted">Canonical (declarado):</p>
                <p className="font-medium text-text break-all">{inspectResult.userCanonical ?? '—'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-text-muted">Último rastreo:</p>
                <p className="font-medium text-text">{fmtDate(inspectResult.crawlingDate)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-text-muted">Sitemap:</p>
                <p className="font-medium text-text">{inspectResult.sitemapState ?? '—'}</p>
              </div>
            </div>

            {inspectResult.isBlockedByRobots && (
              <div className="flex items-start gap-2 p-3 rounded bg-warning/5 border border-warning/30 mt-3">
                <AlertTriangle size={14} className="text-warning flex-shrink-0 mt-0.5" />
                <p className="text-xs text-text-secondary">Esta URL está bloqueada por robots.txt. Revisar app/robots.ts.</p>
              </div>
            )}
            {inspectResult.isBlockedByNoindex && (
              <div className="flex items-start gap-2 p-3 rounded bg-warning/5 border border-warning/30 mt-3">
                <AlertTriangle size={14} className="text-warning flex-shrink-0 mt-0.5" />
                <p className="text-xs text-text-secondary">Esta URL tiene noindex. No será indexada por Google.</p>
              </div>
            )}
            {inspectResult.canonical && inspectResult.userCanonical && inspectResult.canonical !== inspectResult.userCanonical && (
              <div className="flex items-start gap-2 p-3 rounded bg-warning/5 border border-warning/30 mt-3">
                <AlertTriangle size={14} className="text-warning flex-shrink-0 mt-0.5" />
                <p className="text-xs text-text-secondary">El canonical que Google ha elegido difiere del declarado. Revisar la etiqueta canonical.</p>
              </div>
            )}
          </Card>
        )}

        {!inspectResult && !inspecting && (
          <Card padding="md" className="text-center">
            <Globe size={32} className="mx-auto text-text-muted mb-2" />
            <p className="text-sm text-text-secondary">
               Ingresa una URL y haz clic en &ldquo;Inspeccionar&rdquo; para auditar su estado de indexación.
            </p>
          </Card>
        )}
      </div>
    );
  }

  function renderSitemap() {
    if (!sitemapData) return <div className="flex justify-center py-12"><Spinner /></div>;

    return (
      <div className="space-y-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <Card padding="sm" className="text-center">
            <p className="text-xl font-extrabold text-primary tabular-nums">{sitemapData.totalIncluded}</p>
            <p className="text-xxs text-text-muted uppercase">URLs en sitemap</p>
          </Card>
          <Card padding="sm" className="text-center">
            <p className="text-xl font-extrabold text-primary tabular-nums">{sitemapData.staticRoutes}</p>
            <p className="text-xxs text-text-muted uppercase">Rutas estáticas</p>
          </Card>
          <Card padding="sm" className="text-center">
            <p className="text-xl font-extrabold text-primary tabular-nums">{sitemapData.categories}</p>
            <p className="text-xxs text-text-muted uppercase">Categorías blog</p>
          </Card>
          <Card padding="sm" className="text-center">
            <p className="text-xl font-extrabold text-primary tabular-nums">{sitemapData.blogPostsPublished}</p>
            <p className="text-xxs text-text-muted uppercase">Posts publicados</p>
          </Card>
        </div>

        {sitemapData.note && (
          <Card padding="md" className={`${sitemapData.noindex ? 'border-danger/50 bg-danger/5' : 'border-success/30 bg-success/5'}`}>
            <div className="flex items-start gap-2">
              {sitemapData.noindex ? <AlertTriangle size={16} className="text-danger flex-shrink-0 mt-0.5" /> : <CheckCircle2 size={16} className="text-success flex-shrink-0 mt-0.5" />}
              <p className="text-xs text-text-secondary">{sitemapData.note}</p>
            </div>
          </Card>
        )}

        <Card padding="md">
          <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">URLs del sitemap (muestra)</p>
          {sitemapData.sampleUrls.length === 0 ? (
            <p className="text-sm text-text-secondary">No hay URLs en el sitemap (noindex activo).</p>
          ) : (
            <div className="space-y-1">
              {sitemapData.sampleUrls.map((url, i) => (
                <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-border/20 last:border-0">
                  <span className="text-text">{url}</span>
                  <a href={url} target="_blank" rel="noopener noreferrer" className="text-accent hover:text-accent-dark">
                    <ExternalLink size={12} />
                  </a>
                </div>
              ))}
              {sitemapData.totalIncluded > 10 && (
                <p className="text-xxs text-text-muted text-center pt-1">
                  +{sitemapData.totalIncluded - 10} URLs más
                </p>
              )}
            </div>
          )}
        </Card>

        <Card padding="md">
          <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Acciones</p>
          <div className="flex flex-wrap gap-2">
            <a href="/sitemap.xml" target="_blank" rel="noopener noreferrer">
              <Button variant="primary" size="sm">
                <ExternalLink size={14} className="mr-1" /> Ver sitemap.xml
              </Button>
            </a>
            <a href="/robots.txt" target="_blank" rel="noopener noreferrer">
              <Button variant="secondary" size="sm">
                <FileText size={14} className="mr-1" /> Ver robots.txt
              </Button>
            </a>
          </div>
        </Card>
      </div>
    );
  }

  function renderAcciones() {
    if (!summary) return <div className="flex justify-center py-12"><Spinner /></div>;

    const s = summary;
    const isProd = typeof window !== 'undefined' && window.location.hostname === 'www.pinedayasociadoshn.com';

    const recommendations: { icon: typeof CheckCircle2; tone: 'success' | 'warning' | 'danger' | 'neutral'; text: string }[] = [];

    if (s.site.noindex) {
      recommendations.push({
        icon: AlertTriangle,
        tone: 'danger',
        text: 'NEXT_PUBLIC_NOINDEX=true — El sitio completo está bloqueado para indexación. Cambiar a false en .env.local para producción.',
      });
    } else {
      recommendations.push({
        icon: CheckCircle2,
        tone: 'success',
        text: 'Indexación permitida — NEXT_PUBLIC_NOINDEX=false. Google puede indexar el sitio.',
      });
    }

    if (!s.site.gaFrontendConfigured) {
      recommendations.push({
        icon: AlertTriangle,
        tone: 'warning',
        text: 'GA4 Frontend — Establecer NEXT_PUBLIC_GA_ID en .env.local para activar Google Analytics en la web pública.',
      });
    } else {
      recommendations.push({
        icon: CheckCircle2,
        tone: 'success',
        text: `GA4 Frontend activo — Tracking configurado con ID de medición.`,
      });
    }

    if (!s.site.gaConfigured) {
      recommendations.push({
        icon: AlertTriangle,
        tone: 'warning',
        text: 'GA4 Data API — Configurar GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY y GOOGLE_ANALYTICS_PROPERTY_ID en .env.local para ver métricas en este panel.',
      });
    } else {
      recommendations.push({
        icon: CheckCircle2,
        tone: 'success',
        text: 'GA4 Data API configurada — Las métricas se muestran en la pestaña Analytics.',
      });
    }

    if (!s.site.gscConfigured) {
      recommendations.push({
        icon: AlertTriangle,
        tone: 'warning',
        text: 'Search Console API — Configurar GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY y GOOGLE_SEARCH_CONSOLE_SITE_URL en .env.local.',
      });
    } else {
      recommendations.push({
        icon: CheckCircle2,
        tone: 'success',
        text: 'Search Console API configurada — Datos de rendimiento SEO disponibles.',
      });
    }

    recommendations.push({
      icon: CheckCircle2,
      tone: 'success',
      text: 'Sitemap dinámico — Implementado con app/sitemap.ts. Incluye páginas públicas, categorías de blog y posts publicados.',
    });

    recommendations.push({
      icon: CheckCircle2,
      tone: 'success',
      text: 'robots.txt dinámico — Implementado con app/robots.ts. Bloquea intranet, API y AI crawlers. Permite rastreo público.',
    });

    recommendations.push({
      icon: CheckCircle2,
      tone: 'success',
      text: 'Datos estructurados — JSON-LD completo (LegalService, Organization, WebSite, FAQPage, BlogPosting, BreadcrumbList).',
    });

    if (!s.site.indexNowConfigured) {
      recommendations.push({
        icon: AlertTriangle,
        tone: 'warning',
        text: 'IndexNow — Definir INDEXNOW_KEY en .env.local para activar notificaciones a Bing y otros buscadores.',
      });
    } else {
      recommendations.push({
        icon: CheckCircle2,
        tone: 'success',
        text: 'IndexNow configurado — Clave y script postbuild activos.',
      });
    }

    return (
      <div className="space-y-4">
        <Card padding="md">
          <p className="text-sm font-bold text-text mb-2">Recomendaciones y estado</p>
          <p className="text-xs text-text-secondary mb-3">
            Estado actual de cada componente SEO.{' '}
            {isProd && <span className="text-success font-medium">Entorno de producción detectado.</span>}
          </p>
          <ul className="space-y-2 text-xs">
            {recommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-2">
                <rec.icon
                  size={12}
                  className={`flex-shrink-0 mt-0.5 ${
                    rec.tone === 'success' ? 'text-success' :
                    rec.tone === 'danger' ? 'text-danger' :
                    rec.tone === 'warning' ? 'text-warning' : 'text-text-muted'
                  }`}
                />
                <span className="text-text-secondary">{rec.text}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card padding="md">
          <p className="text-sm font-bold text-text mb-2">Variables de entorno necesarias</p>
          <div className="space-y-1.5 text-xs text-text-secondary font-mono bg-surface-alt p-3 rounded">
            <p>NEXT_PUBLIC_NOINDEX=false{s.site.noindex ? ' ← actualmente true' : ' ✓'}</p>
            <p>NEXT_PUBLIC_GA_ID={s.site.gaFrontendConfigured ? '✓' : '(pendiente)'}</p>
            <p>GOOGLE_SERVICE_ACCOUNT_EMAIL={s.site.serviceAccountEmail ? '✓' : '(pendiente)'}</p>
            <p>GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY={s.site.serviceAccountEmail ? '✓' : '(pendiente)'}</p>
            <p>GOOGLE_ANALYTICS_PROPERTY_ID={s.site.analyticsPropertyId ? '✓' : '(pendiente)'}</p>
            <p>GOOGLE_SEARCH_CONSOLE_SITE_URL={s.site.searchConsoleSiteUrl ? '✓' : '(pendiente)'}</p>
            <p>INDEXNOW_KEY={s.site.indexNowConfigured ? '✓' : '(pendiente)'}</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-extrabold text-primary">Panel SEO</h1>
        <p className="text-xs text-text-secondary mt-1">
          Analítica, Search Console, indexación y sitemap
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 border-b border-border/50 pb-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-t-md text-xs font-medium transition-colors ${
              tab === t.id
                ? 'bg-accent/15 text-primary border-b-2 border-accent'
                : 'text-text-secondary hover:text-text hover:bg-surface-alt'
            }`}
          >
            <t.icon size={14} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'resumen' && renderSummary()}
      {tab === 'analytics' && renderAnalytics()}
      {tab === 'search-console' && renderSearchConsole()}
      {tab === 'indexacion' && renderIndexacion()}
      {tab === 'sitemap' && renderSitemap()}
      {tab === 'acciones' && renderAcciones()}

      {/* Footer info */}
      <div className="flex flex-wrap gap-3 text-xxs text-text-muted pt-4 border-t border-border/30">
        <span>Google Analytics mide tráfico y comportamiento.</span>
        <span>Search Console audita rendimiento SEO e indexación.</span>
        <span>Google decide si indexa cada URL.</span>
      </div>
    </div>
  );
}
