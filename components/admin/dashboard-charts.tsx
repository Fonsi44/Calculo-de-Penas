'use client';

import { useEffect, useState } from 'react';
import { Users } from 'lucide-react';
import { MetricCard } from './metric-card';
import { ChartCard } from './chart-card';
import { BaseLineChart } from './base-line-chart';
import { BaseDonutChart } from './base-donut-chart';
import { BaseBarChart } from './base-bar-chart';

type DashboardData = Record<string, unknown> | null;

interface BreakdownItem {
  device?: string;
  users?: number;
  source?: string;
  sessions?: number;
  query?: string;
  clicks?: number;
}

interface TimelinePoint {
  date?: string;
  activeUsers?: number;
  sessions?: number;
  [key: string]: unknown;
}

export function DashboardCharts() {
  const [days, setDays] = useState<7 | 28 | 90>(28);
  const [ga4, setGa4] = useState<DashboardData>(null);
  const [gsc, setGsc] = useState<DashboardData>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    const ab = new AbortController();

    Promise.all([
      fetch(`/api/admin/analytics/timeline?days=${days}`, { signal: ab.signal }).then((r) => r.json()),
      fetch(`/api/admin/search-console/timeline?days=${days}`, { signal: ab.signal }).then((r) => r.json()),
    ])
      .then(([a, s]) => {
        setGa4(a);
        setGsc(s);
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    return () => ab.abort();
  }, [days]);

  const periodPresets = (
    <div className="flex gap-1 mb-4">
      {([7, 28, 90] as const).map((d) => (
        <button
          key={d}
          onClick={() => setDays(d)}
          className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
            days === d ? 'bg-primary text-text-inverse' : 'bg-surface-alt text-text-secondary hover:bg-primary/10'
          }`}
        >
          {d} días
        </button>
      ))}
    </div>
  );

  const ga4ok = ga4?.status === 'ok';
  const gscOk = gsc?.status === 'ok';

  function trend(val: number | undefined | null): { direction: 'up' | 'down'; percentage: number } | undefined {
    if (val === null || val === undefined || Math.abs(val) < 0.5) return undefined;
    return { direction: val >= 0 ? 'up' : 'down', percentage: Math.abs(val) };
  }

  const metricCards = ga4ok && (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
      <MetricCard label="Usuarios" value={(ga4?.totals as Record<string, number>)?.activeUsers ?? 0} icon={<Users size={16} />} trend={trend((ga4?.previousPeriod as Record<string, Record<string, number>>)?.changes?.activeUsers)} subtitle="vs período anterior" />
      <MetricCard label="Sesiones" value={(ga4?.totals as Record<string, number>)?.sessions ?? 0} trend={trend((ga4?.previousPeriod as Record<string, Record<string, number>>)?.changes?.sessions)} />
      <MetricCard label="Páginas vistas" value={(ga4?.totals as Record<string, number>)?.screenPageViews ?? 0} trend={trend((ga4?.previousPeriod as Record<string, Record<string, number>>)?.changes?.screenPageViews)} />
      <MetricCard label="Nuevos usuarios" value={(ga4?.totals as Record<string, number>)?.newUsers ?? 0} trend={trend((ga4?.previousPeriod as Record<string, Record<string, number>>)?.changes?.newUsers)} />
    </div>
  );

  return (
    <div className="space-y-4">
      {periodPresets}

      {loading && <div className="text-xs text-text-muted text-center py-4">Cargando datos...</div>}
      {ga4?.status === 'permission_denied' && <div className="text-xs text-warning text-center py-4">GA4: permisos denegados</div>}
      {ga4?.status === 'not_configured' && <div className="text-xs text-text-muted text-center py-4">GA4 no configurado</div>}
      {ga4?.status === 'error' && <div className="text-xs text-danger text-center py-4">Error al cargar GA4</div>}

      {ga4ok && (
        <>
          {metricCards}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ChartCard title="Usuarios y sesiones" status={ga4.status}>
              <BaseLineChart
                data={ga4.data}
                lines={[
                  { key: 'activeUsers', color: '#D4AF37', label: 'Usuarios' },
                  { key: 'sessions', color: '#0F1D3A', label: 'Sesiones' },
                ]}
              />
            </ChartCard>
            <ChartCard title="Dispositivos" status={ga4.status}>
              <BaseDonutChart data={(ga4.deviceBreakdown as BreakdownItem[] ?? []).map((d) => ({ name: d.device ?? '', value: d.users ?? 0 }))} />
            </ChartCard>
            {((ga4.sourceBreakdown as BreakdownItem[] ?? []).length) > 0 && (
              <ChartCard title="Fuentes de tráfico" status={ga4.status}>
                <BaseBarChart data={(ga4.sourceBreakdown as BreakdownItem[] ?? []).slice(0, 5).map((s) => ({ name: s.source ?? '', value: s.sessions ?? 0 }))} horizontal color="#D4AF37" height={150} />
              </ChartCard>
            )}
            {ga4ok && (
              <ChartCard title="Tráfico diario" status={ga4.status}>
                <BaseBarChart
                  data={(ga4.data as TimelinePoint[] ?? []).map((d) => ({ name: (d.date ?? '').slice(5), value: d.activeUsers ?? 0 }))}
                  color="#D4AF37"
                  height={150}
                />
              </ChartCard>
            )}
          </div>
        </>
      )}

      {loading && !gscOk && <div className="text-xs text-text-muted text-center py-4">Cargando datos...</div>}
      {gsc?.status === 'permission_denied' && <div className="text-xs text-warning text-center py-4">GSC: permisos denegados</div>}
      {gsc?.status === 'no_data' && <div className="text-xs text-text-muted text-center py-4">GSC sin datos para este período</div>}
      {gsc?.status === 'not_configured' && <div className="text-xs text-text-muted text-center py-4">GSC no configurado</div>}

      {gscOk && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartCard title="Clics e impresiones (GSC)" status={gsc.status}>
            <BaseLineChart
              data={gsc.data as TimelinePoint[] ?? []}
              lines={[
                { key: 'clicks', color: '#D4AF37', label: 'Clics' },
                { key: 'impressions', color: '#8A8F95', label: 'Impresiones' },
              ]}
            />
          </ChartCard>
          {((gsc.topQueries as BreakdownItem[] ?? []).length) > 0 && (
            <ChartCard title="Top consultas" status={gsc.status}>
              <BaseBarChart
                data={(gsc.topQueries as BreakdownItem[] ?? []).slice(0, 10).map((q) => ({ name: (q.query ?? '').length > 25 ? (q.query ?? '').substring(0, 25) + '...' : q.query ?? '', value: q.clicks ?? 0 }))}
                horizontal
                color="#D4AF37"
                height={250}
              />
            </ChartCard>
          )}
        </div>
      )}
    </div>
  );
}
