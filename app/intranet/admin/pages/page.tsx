'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Globe, FileText, Layers, Edit3, Settings, CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { getEditablePagesMeta } from '@/lib/page-content-db';

interface PageStat {
  page: string;
  sections: number;
  fields: number;
  updatedAt: string | null;
}

const ICONS: Record<string, typeof Globe> = {
  home: Globe,
  despacho: Globe,
  'solicitar-consulta': FileText,
  'como-llegar': Globe,
  terminos: FileText,
  'aviso-legal': FileText,
  'politica-privacidad': FileText,
  'politica-cookies': FileText,
  disclaimer: FileText,
  configuracion: Settings,
};

export default function AdminPagesPage() {
  const [stats, setStats] = useState<Record<string, PageStat>>({});
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState<Awaited<ReturnType<typeof getEditablePagesMeta>>>([]);

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/pages').then(r => r.json()),
      getEditablePagesMeta(),
    ])
      .then(([data, pagesMeta]) => {
        const statMap: Record<string, PageStat> = {};
        for (const p of (data.pages ?? [])) {
          statMap[p.page] = p;
        }
        setStats(statMap);
        setMeta(pagesMeta);
      })
      .catch(console.warn)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-8"><Spinner /></div>;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-extrabold text-primary">Páginas</h1>
        <p className="text-xs text-text-secondary mt-1">
          Gestiona el contenido de las páginas públicas del sitio.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {meta.map(pageMeta => {
          const p = stats[pageMeta.page];
          const Icon = ICONS[pageMeta.page] ?? FileText;
          const hasContent = p && p.fields > 0;

          return (
            <Link
              key={pageMeta.page}
              href={`/intranet/admin/pages/${pageMeta.page}`}
              className="group block"
            >
              <Card padding="md" className="h-full hover:shadow-md hover:border-accent/50 transition-all">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-accent/15 flex items-center justify-center flex-shrink-0">
                    <Icon size={20} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h2 className="font-bold text-sm text-primary group-hover:text-accent-dark transition-colors">
                        {pageMeta.label}
                      </h2>
                      <ArrowRight size={14} className="text-text-muted group-hover:text-accent-dark transition-colors flex-shrink-0" />
                    </div>
                    <p className="text-xxs text-text-secondary mt-0.5">/{pageMeta.page}</p>
                    <div className="flex items-center gap-3 mt-2 text-xxs text-text-muted">
                      <span className="flex items-center gap-1">
                        <Layers size={10} /> {pageMeta.sections.length} secciones
                      </span>
                      <span className="flex items-center gap-1">
                        <Edit3 size={10} /> {pageMeta.sections.reduce((acc, s) => acc + s.fields.length, 0)} campos
                      </span>
                      {pageMeta.sections.some(s => s.fields.some(f => 'default' in f)) && (
                        <span className="flex items-center gap-1 text-success">
                          <CheckCircle2 size={10} /> Con contenido
                        </span>
                      )}
                      {hasContent && p.sections > 0 && (
                        <span className="flex items-center gap-1 text-accent-dark">
                          <Edit3 size={10} /> Personalizado
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>

      {meta.length === 0 && (
        <Card padding="lg">
          <div className="text-center">
            <p className="text-text-secondary text-sm">No hay páginas disponibles.</p>
          </div>
        </Card>
      )}
    </div>
  );
}
