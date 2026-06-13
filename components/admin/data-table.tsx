'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';

type Column = { key: string; label: string; format?: 'number' | 'percent' | 'date' | 'text' };

type DataTableProps = {
  columns: Column[];
  data: Record<string, unknown>[];
  pageSize?: number;
  filename?: string;
};

function formatCell(value: unknown, format?: string): string {
  if (value === null || value === undefined) return '—';
  if (format === 'percent') {
    const n = Number(value);
    return `${(n * 100).toFixed(1)}%`;
  }
  if (format === 'number') return Number(value).toLocaleString();
  return String(value);
}

function toCsv(columns: Column[], data: Record<string, unknown>[]): string {
  const bom = '\uFEFF';
  const header = columns.map((c) => `"${c.label}"`).join(',');
  const rows = data.map((row) => columns.map((c) => `"${String(row[c.key] ?? '')}"`).join(','));
  return bom + header + '\n' + rows.join('\n');
}

export function DataTable({ columns, data, pageSize = 10, filename = 'export.csv' }: DataTableProps) {
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(data.length / pageSize);
  const start = (page - 1) * pageSize;
  const pageData = data.slice(start, start + pageSize);

  const handleExport = () => {
    const blob = new Blob([toCsv(columns, data)], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!data.length) return null;

  return (
    <div>
      <div className="flex justify-end mb-2">
        <button onClick={handleExport} className="inline-flex items-center gap-1 text-xxs font-semibold text-primary hover:text-accent-dark transition-colors">
          <Download size={12} /> CSV
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border/30">
              {columns.map((c) => (
                <th key={c.key} className="text-left font-bold text-text-muted uppercase tracking-wider py-2 pr-3">{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageData.map((row, i) => (
              <tr key={i} className="border-b border-border/20 hover:bg-surface-alt/50 transition-colors">
                {columns.map((c) => (
                  <td key={c.key} className="py-2 pr-3 text-text">{formatCell(row[c.key], c.format)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-3">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="text-xxs font-semibold text-primary disabled:text-text-muted disabled:cursor-not-allowed">Anterior</button>
          <span className="text-xxs text-text-muted">{page} / {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="text-xxs font-semibold text-primary disabled:text-text-muted disabled:cursor-not-allowed">Siguiente</button>
        </div>
      )}
    </div>
  );
}
