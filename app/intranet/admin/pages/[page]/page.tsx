'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Eye, FileEdit, Save,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/components/ui/toast';
import { getEditablePagesMeta } from '@/lib/page-content-db';
import { PageVisualEditor } from '@/components/admin/page-visual-editor';
import { PageMetadataPanel, PageMetaFormData } from '@/components/admin/page-metadata-panel';
import Link from 'next/link';

type SectionMeta = { key: string; label: string; fields: { key: string; label: string; type: string }[] };
type PageMeta = { page: string; label: string; sections: SectionMeta[] };

const PAGE_ROUTES: Record<string, string> = {
  home: '/', despacho: '/despacho', 'solicitar-consulta': '/solicitar-consulta',
  'como-llegar': '/como-llegar', terminos: '/terminos', 'aviso-legal': '/aviso-legal',
  'politica-privacidad': '/politica-privacidad', 'politica-cookies': '/politica-cookies',
  disclaimer: '/disclaimer', 'servicios-juridicos': '/servicios-juridicos',
  'derecho-penal': '/derecho-penal', 'hondurenos-en-espana': '/hondurenos-en-espana',
};

export default function AdminPageEditor() {
  const params = useParams<{ page: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [metaDef, setMetaDef] = useState<PageMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageMeta, setPageMeta] = useState<Partial<PageMetaFormData> | undefined>(undefined);
  const isConfig = params.page === 'configuracion';

  const currentTab = searchParams.get('tab');
  const [tab, setTab] = useState<'editor' | 'metadata'>(
    currentTab === 'meta' ? 'metadata' : 'editor'
  );

  useEffect(() => {
    getEditablePagesMeta().then(all => {
      const found = all.find(m => m.page === params.page);
      if (found) { setMetaDef(found); }
      setLoading(false);
    });
  }, [params.page]);

  // Load existing metadata for the form view
  useEffect(() => {
    if (!metaDef || isConfig) return;
    fetch(`/api/admin/pages?page=${params.page}`)
      .then(r => r.json())
      .then(data => {
        if (data.grouped?._meta) {
          const m = data.grouped._meta;
          setPageMeta({
            metaTitle: m.meta_title || '',
            metaDescription: m.meta_description || '',
            ogTitle: m.og_title || '',
            ogDescription: m.og_description || '',
            ogImage: m.og_image || '',
            canonical: m.canonical || '',
            robots: m.robots || 'index, follow',
            noindex: m.noindex === 'true',
            keywords: m.keywords || '',
            slug: m.slug || '',
            parent: m.parent || '',
            sortOrder: m.sort_order ? parseInt(m.sort_order, 10) : 0,
            lang: m.lang || 'es-HN',
          });
        }
      })
      .catch(() => {});
  }, [metaDef, params.page, isConfig]);

  const handleSaveMetadata = useCallback(async (meta: PageMetaFormData) => {
    const res = await fetch('/api/admin/pages', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ page: params.page, meta }),
    });
    if (!res.ok) throw new Error('Error al guardar metadatos');
    setPageMeta(meta);
  }, [params.page]);

  if (loading) return <div className="flex justify-center py-8"><Spinner /></div>;
  if (!metaDef) return <Card padding="lg"><div className="text-center"><p className="text-text-secondary">Página no encontrada.</p></div></Card>;

  const currentRoute = PAGE_ROUTES[params.page];

  // Config page uses the legacy form-based editor
  if (isConfig) {
    return <LegacyConfigEditor page={params.page} />;
  }

  // Main: Visual editor with tab support for metadata
  return (
    <>
      {/* Tab switch (top) */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <Link href="/intranet/admin/pages">
            <Button variant="ghost" size="sm"><ArrowLeft size={14} /></Button>
          </Link>
          <div>
            <h1 className="text-xl font-extrabold text-primary">{metaDef.label}</h1>
            <p className="text-xs text-text-secondary">/{params.page}</p>
          </div>
        </div>
        <div className="flex gap-1.5">
          {currentRoute && (
            <Link href={currentRoute} target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="sm"><Eye size={14} /> Ver página</Button>
            </Link>
          )}
        </div>
      </div>

      {/* Mode tabs */}
      <div className="flex gap-0.5 bg-surface-alt rounded-lg p-0.5 border border-border w-fit mb-3">
        <button
          type="button"
          onClick={() => setTab('editor')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            tab === 'editor' ? 'bg-white text-primary shadow-sm border border-border' : 'text-text-secondary hover:text-text'
          }`}
        >
          <Eye size={14} /> Editor visual
        </button>
        <button
          type="button"
          onClick={() => setTab('metadata')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            tab === 'metadata' ? 'bg-white text-primary shadow-sm border border-border' : 'text-text-secondary hover:text-text'
          }`}
        >
          <FileEdit size={14} /> Metadatos y SEO
        </button>
      </div>

      {/* Content */}
      {tab === 'editor' ? (
        <PageVisualEditor
          page={params.page}
          pageLabel={metaDef.label}
          publicRoute={currentRoute}
          onBack={() => router.push('/intranet/admin/pages')}
        />
      ) : (
        <div className="max-w-2xl mx-auto">
          <div className="bg-white border border-border-light rounded-md">
            <PageMetadataPanel
              page={params.page}
              initialData={pageMeta}
              onSave={handleSaveMetadata}
              onClose={() => setTab('editor')}
            />
          </div>
        </div>
      )}
    </>
  );
}

// Legacy config editor for the special 'configuracion' page
function LegacyConfigEditor({ page: _page }: { page: string }) {
  void _page;
  const [meta, setMeta] = useState<{ label: string; sections: { key: string; label: string; fields: { key: string; label: string; type: string; default?: string }[] }[] } | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  useEffect(() => {
    getEditablePagesMeta().then(all => {
      const found = all.find(m => m.page === 'configuracion');
      if (found) {
        setMeta(found);
        const defaults: Record<string, string> = {};
        for (const s of found.sections)
          for (const f of s.fields)
            defaults[`${s.key}.${f.key}`] = (f as { default?: string }).default ?? '';
        setValues(defaults);
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!meta) return;
    fetch('/api/admin/site-config').then(r => r.json()).then(d => {
      const cfg = d.config ?? {};
      setValues(prev => {
        const merged = { ...prev };
        for (const [k, v] of Object.entries(cfg))
          for (const section of meta.sections) {
            const key = `${section.key}.${k}`;
            if (merged[key] !== undefined) merged[key] = v as string;
          }
        return merged;
      });
    }).catch(() => {});
  }, [meta]);

  const handleSave = async () => {
    setSaving(true);
    const toSave: Record<string, string> = {};
    for (const [key, content] of Object.entries(values)) {
      const [, field] = key.includes('.') ? key.split('.', 2) : ['', key];
      if (field && content) toSave[field] = content;
    }
    try {
      const res = await fetch('/api/admin/site-config', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toSave),
      });
      if (!res.ok) throw new Error();
      toast.success('Configuración guardada');
    } catch {
      toast.danger('Error al guardar');
    }
    setSaving(false);
  };

  if (loading) return <div className="flex justify-center py-8"><Spinner /></div>;
  if (!meta) return <Card padding="lg"><p className="text-center text-text-secondary">Página no encontrada.</p></Card>;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/intranet/admin/pages"><Button variant="ghost" size="sm"><ArrowLeft size={14} /></Button></Link>
          <h1 className="text-xl font-extrabold text-primary">Configuración Global</h1>
        </div>
        <Button variant="primary" size="sm" onClick={handleSave} loading={saving}>
          <Save size={14} /> Guardar
        </Button>
      </div>

      {meta.sections.map(section => (
        <Card key={section.key} padding="md">
          <h2 className="font-bold text-sm text-primary mb-3">{section.label}</h2>
          <div className="space-y-3">
            {section.fields.map(field => {
              const key = `${section.key}.${field.key}`;
              return (
                <div key={key}>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">{field.label}</label>
                  {field.type === 'textarea' ? (
                    <textarea
                      value={values[key] ?? ''}
                      onChange={e => setValues(v => ({ ...v, [key]: e.target.value }))}
                      className="w-full min-h-[60px] p-2 rounded-md border border-border bg-surface text-sm text-text outline-none focus:ring-2 focus:ring-accent/30 resize-y"
                    />
                  ) : (
                    <input
                      value={values[key] ?? ''}
                      onChange={e => setValues(v => ({ ...v, [key]: e.target.value }))}
                      className="w-full rounded-md border border-border-light bg-surface px-3 py-1.5 text-sm text-text outline-none focus:ring-2 focus:ring-accent/30"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      ))}
    </div>
  );
}
