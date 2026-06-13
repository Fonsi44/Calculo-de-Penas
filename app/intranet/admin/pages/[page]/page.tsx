'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft, Save, ExternalLink, LayoutDashboard, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/components/ui/toast';
import { getEditablePagesMeta } from '@/lib/page-content-db';
import { VisualEditor } from '@/components/admin/visual-editor';
import Link from 'next/link';

type SectionMeta = { key: string; label: string; fields: { key: string; label: string; type: string }[] };
type PageMeta = { page: string; label: string; sections: SectionMeta[] };

const PAGE_ROUTES: Record<string, string> = {
  home: '/',
  despacho: '/despacho',
  'solicitar-consulta': '/solicitar-consulta',
  'como-llegar': '/como-llegar',
  terminos: '/terminos',
  'aviso-legal': '/aviso-legal',
  'politica-privacidad': '/politica-privacidad',
  'politica-cookies': '/politica-cookies',
  disclaimer: '/disclaimer',
  'servicios-juridicos': '/servicios-juridicos',
  'derecho-penal': '/derecho-penal',
  'hondurenos-en-espana': '/hondurenos-en-espana',
};

export default function AdminPageEditor() {
  const params = useParams<{ page: string }>();
  const toast = useToast();
  const [meta, setMeta] = useState<PageMeta | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('');
  const [mode, setMode] = useState<'form' | 'visual'>('form');
  const isConfig = params.page === 'configuracion';

  const VISUAL_PAGES = ['home', 'despacho', 'solicitar-consulta', 'como-llegar', 'terminos', 'aviso-legal', 'politica-privacidad', 'politica-cookies', 'disclaimer', 'servicios-juridicos', 'derecho-penal', 'hondurenos-en-espana'];

  useEffect(() => {
    getEditablePagesMeta().then(all => {
      const found = all.find(m => m.page === params.page);
      if (found) {
        setMeta(found);
        setActiveSection(found.sections[0]?.key ?? '');
      }
      setLoading(false);
    });
  }, [params.page]);

  useEffect(() => {
    if (!meta) return;
    const loadContent = isConfig
      ? fetch('/api/admin/site-config').then(r => r.json()).then(d => d.config ?? {})
      : fetch(`/api/admin/pages?page=${params.page}`).then(r => r.json()).then(d => {
          const flat: Record<string, string> = {};
          if (d.grouped) {
            for (const [section, fields] of Object.entries(d.grouped as Record<string, Record<string, string>>)) {
              for (const [field, content] of Object.entries(fields)) {
                flat[`${section}.${field}`] = content;
              }
            }
          }
          return flat;
        });

    loadContent
      .then(flat => {
        const merged: Record<string, string> = {};
        for (const section of meta.sections) {
          for (const field of section.fields) {
            const key = `${section.key}.${field.key}`;
            merged[key] = flat[key] ?? (field as { default?: string }).default ?? '';
          }
        }
        setValues(merged);
      })
      .catch(() => toast.danger('Error al cargar contenido'))
      .finally(() => setLoading(false));
  }, [meta, params.page, toast, isConfig]);

  const update = (key: string, value: string) => {
    setValues(v => ({ ...v, [key]: value }));
  };

  const handleSave = async () => {
    if (!meta) return;
    setSaving(true);

    if (isConfig) {
      const toSave: Record<string, string> = {};
      for (const [key, content] of Object.entries(values)) {
        const [, field] = key.includes('.') ? key.split('.', 2) : ['', key];
        if (field && content) toSave[field] = content;
      }
      if (Object.keys(toSave).length === 0) {
        toast.danger('No hay cambios para guardar');
        setSaving(false);
        return;
      }
      try {
        const res = await fetch('/api/admin/site-config', {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(toSave),
        });
        if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
        toast.success('Configuracion guardada. Los cambios se reflejaran en la web.');
        const data = await res.json();
        setValues(v => {
          const merged = { ...v };
          for (const [k, val] of Object.entries(data.config ?? {})) {
            for (const section of meta.sections) {
              const key = `${section.key}.${k}`;
              if (merged[key] !== undefined) merged[key] = val as string;
            }
          }
          return merged;
        });
      } catch (e) { toast.danger(e instanceof Error ? e.message : 'Error'); }
      setSaving(false);
      return;
    }

    const entries = Object.entries(values);
    let success = 0;
    let error = 0;
    let allRevalidated = true;

    for (const [key, content] of entries) {
      const [section, field] = key.includes('.') ? key.split('.', 2) : ['', key];
      if (!section || !field) continue;
      try {
        const res = await fetch('/api/admin/pages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ page: params.page, section, field, content }),
        });
        if (res.ok) {
          const data = await res.json();
          success++;
          if (data.revalidated === false) allRevalidated = false;
        } else error++;
      } catch { error++; }
    }

    setSaving(false);
    if (error === 0) {
      const msg = success === 1
        ? 'Campo guardado y publicado — ya visible en la web.'
        : `${success} campos guardados y publicados — ya visibles en la web.`;
      toast.success(msg);
      if (!allRevalidated) {
        toast.warning('Contenido guardado. La cache puede tardar unos segundos en reflejarse.');
      }
    } else {
      toast.danger(`Guardado con ${error} errores (${success} correctos)`);
    }
  };

  if (loading) return <div className="flex justify-center py-8"><Spinner /></div>;
  if (!meta) return (
    <Card padding="lg">
      <div className="text-center">
        <p className="text-text-secondary">Pagina no encontrada.</p>
      </div>
    </Card>
  );

  const currentRoute = PAGE_ROUTES[params.page];
  const canVisual = VISUAL_PAGES.includes(params.page) && !isConfig;
  const activeSectionMeta = meta.sections.find(s => s.key === activeSection);

  const isVisualMode = mode === 'visual' && canVisual;

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Link href="/intranet/admin/pages">
            <Button variant="ghost" size="sm"><ArrowLeft size={14} /></Button>
          </Link>
          <div>
            <h1 className="text-xl font-extrabold text-primary">{meta.label}</h1>
            <p className="text-xs text-text-secondary">/{params.page}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {currentRoute && (
            <Link href={currentRoute} target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="sm">
                <ExternalLink size={14} className="mr-1" /> Ver pagina
              </Button>
            </Link>
          )}
          <Button variant="primary" size="sm" onClick={handleSave} loading={saving}>
            <Save size={14} className="mr-1" /> Guardar todo
          </Button>
        </div>
      </div>

      {canVisual && (
        <div className="flex gap-0.5 bg-surface-alt rounded-lg p-0.5 border border-border-light w-fit mb-4">
          <button
            type="button"
            onClick={() => setMode('form')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              mode === 'form'
                ? 'bg-white text-primary shadow-sm border border-border-light'
                : 'text-text-secondary hover:text-text'
            }`}
          >
            <LayoutDashboard size={14} />
            Formulario
          </button>
          <button
            type="button"
            onClick={() => setMode('visual')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              mode === 'visual'
                ? 'bg-white text-primary shadow-sm border border-border-light'
                : 'text-text-secondary hover:text-text'
            }`}
          >
            <Eye size={14} />
            Vista previa
          </button>
        </div>
      )}

      {isVisualMode ? (
        <div
          style={{
            position: 'fixed',
            left: '14rem',
            right: 0,
            top: 0,
            bottom: 0,
            zIndex: 40,
          }}
        >
          <VisualEditor
            page={params.page}
            pageLabel={meta.label}
            onSwitchToForm={() => setMode('form')}
          />
        </div>
      ) : (
        <div className="flex gap-4">
          <nav className="w-48 flex-shrink-0 space-y-0.5">
            {meta.sections.map(s => (
              <button
                key={s.key}
                type="button"
                onClick={() => setActiveSection(s.key)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeSection === s.key
                    ? 'bg-accent/15 text-primary'
                    : 'text-text-secondary hover:bg-surface-alt hover:text-text'
                }`}
              >
                {s.label}
              </button>
            ))}
          </nav>

          <div className="flex-1 min-w-0 space-y-4">
            {activeSectionMeta ? (
              <Card padding="md">
                <h2 className="font-bold text-sm text-primary mb-3">
                  {activeSectionMeta.label as string}
                </h2>
                <div className="space-y-3">
                  {activeSectionMeta.fields.map(field => {
                    const key = `${activeSectionMeta.key}.${field.key}`;
                    const value = values[key] ?? '';

                    return (
                      <div key={key}>
                        <label className="block text-xs font-semibold text-text-secondary mb-1">
                          {field.label}
                        </label>
                        {field.type === 'richtext' ? (
                          <RichTextEditor
                            content={value}
                            onChange={html => update(key, html)}
                            minHeight={200}
                          />
                        ) : field.type === 'textarea' ? (
                          <textarea
                            value={value}
                            onChange={e => update(key, e.target.value)}
                            className="w-full min-h-[80px] p-2 rounded-md border border-border-light bg-surface text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/30 resize-y"
                          />
                        ) : (
                          <Input
                            value={value}
                            onChange={e => update(key, e.target.value)}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </Card>
            ) : (
              <Card padding="lg">
                <p className="text-center text-text-secondary">Selecciona una seccion.</p>
              </Card>
            )}
          </div>

          <div className="w-72 flex-shrink-0 hidden xl:block">
            <Card padding="md" className="sticky top-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                <span className="text-xs font-semibold text-primary uppercase tracking-wider">Vista previa</span>
              </div>
              {activeSectionMeta ? (
                <div className="space-y-2.5">
                  {activeSectionMeta.fields.map(field => {
                    const key = `${activeSectionMeta.key}.${field.key}`;
                    const value = values[key] ?? '';
                    const rte = field.type === 'richtext';

                    return (
                      <div key={`pv-${key}`} className="border-b border-border-light pb-2.5 last:border-b-0 last:pb-0">
                        <p className="text-xxs text-text-muted uppercase tracking-wide mb-1">{field.label}</p>
                        {!value ? (
                          <p className="text-xxs text-text-muted italic">Sin contenido</p>
                        ) : rte ? (
                          <div
                            className="preview-richtext text-xs text-text leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: value }}
                          />
                        ) : (
                          <p className="text-xs text-text leading-relaxed whitespace-pre-wrap">{value}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xxs text-text-muted text-center py-6">Selecciona una seccion para ver su contenido.</p>
              )}
            </Card>
          </div>

          <style>{`
            .preview-richtext h2 { font-size: 1.25rem; font-weight: 700; margin: 0.75rem 0 0.5rem; color: #0F1D3A; }
            .preview-richtext h3 { font-size: 1.1rem; font-weight: 600; margin: 0.6rem 0 0.4rem; color: #0F1D3A; }
            .preview-richtext p { margin: 0 0 0.5rem; }
            .preview-richtext strong { font-weight: 700; color: #0F1D3A; }
            .preview-richtext em { font-style: italic; }
            .preview-richtext a { color: #9A7A22; text-decoration: underline; }
            .preview-richtext ul, .preview-richtext ol { padding-left: 1.2rem; margin: 0.3rem 0 0.5rem; }
            .preview-richtext ul { list-style-type: disc; }
            .preview-richtext ol { list-style-type: decimal; }
            .preview-richtext li { margin-bottom: 0.2rem; }
          `}</style>
        </div>
      )}
    </>
  );
}
