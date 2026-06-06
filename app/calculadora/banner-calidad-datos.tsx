'use client';

import { useEffect, useState } from 'react';

interface CalidadSummary {
  verificados: number;
  pendientes: number;
  rechazados: number;
  total: number;
}

export function BannerCalidadDatos() {
  const [summary, setSummary] = useState<CalidadSummary | null>(null);
  useEffect(() => {
    fetch('/api/delitos/calidad')
      .then(r => r.ok ? r.json() : null)
      .then((d: CalidadSummary | null) => { if (d) setSummary(d); })
      .catch(() => { /* silencioso: el banner es informativo */ });
  }, []);
  if (!summary || summary.total === 0) return null;
  const { verificados, pendientes, rechazados, total } = summary;
  const pct = (n: number) => Math.round((n / total) * 100);
  const completo = pendientes === 0 && rechazados === 0;
  return (
    <div
      className={`mb-3 border rounded-md p-3 text-[11px] text-text-secondary ${
        completo
          ? 'border-success/30 bg-success-bg'
          : 'border-warning/40 bg-warning-bg'
      }`}
    >
      <p className="font-bold text-text mb-1">
        {completo ? 'Catálogo validado' : 'Calidad del catálogo de delitos'}
      </p>
      <p>
        <span className="text-success font-semibold">{verificados} verificados ({pct(verificados)}%)</span>
        {pendientes > 0 && (
          <>
            {' · '}
            <span className="text-warning font-semibold">{pendientes} a revisar ({pct(pendientes)}%)</span>
          </>
        )}
        {rechazados > 0 && (
          <>
            {' · '}
            <span className="text-danger font-semibold">{rechazados} rechazados ({pct(rechazados)}%)</span>
          </>
        )}
        {' de '}
        <strong>{total}</strong> totales.
      </p>
      <p className="mt-1">
        {completo
          ? 'Los registros han sido verificados contra el Código Penal (Decreto 130-2017) y reformas vigentes (119-2019, 46-2020, 93-2021, 59-2024). Reporte: '
          : 'Fuente: '}
        <code>data/delitos-validacion.csv</code>
        {!completo && ' (TF-IDF vs. CP Decreto 130-2017 y reformas vigentes). Los delitos no verificados requerirán confirmación manual.'}
      </p>
    </div>
  );
}
