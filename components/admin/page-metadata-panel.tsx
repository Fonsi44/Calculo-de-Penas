'use client';

import { useState, useEffect } from 'react';
import {
  Save, Info, Search, Eye,
  Globe, FileText, Hash,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/ui';

export interface PageMetaFormData {
  metaTitle: string;
  metaDescription: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  canonical: string;
  robots: string;
  noindex: boolean;
  keywords: string;
  slug: string;
  parent: string;
  sortOrder: number;
  lang: string;
}

interface PageMetadataPanelProps {
  page: string;
  initialData?: Partial<PageMetaFormData>;
  onSave: (data: PageMetaFormData) => Promise<void>;
  onClose?: () => void;
}

const DEFAULT_META: PageMetaFormData = {
  metaTitle: '',
  metaDescription: '',
  ogTitle: '',
  ogDescription: '',
  ogImage: '',
  canonical: '',
  robots: 'index, follow',
  noindex: false,
  keywords: '',
  slug: '',
  parent: '',
  sortOrder: 0,
  lang: 'es-HN',
};

export function PageMetadataPanel({ page, initialData, onSave, onClose }: PageMetadataPanelProps) {
  const toast = useToast();
  const [form, setForm] = useState<PageMetaFormData>({ ...DEFAULT_META, ...initialData });
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<'general' | 'seo' | 'og' | 'avanzado'>('seo');

  // Sync form when initialData loads asynchronously (legitimate pattern for async data load)
  useEffect(() => {
    if (initialData) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({ ...DEFAULT_META, ...initialData });
    }
  }, [initialData]);

  const update = <K extends keyof PageMetaFormData>(key: K, value: PageMetaFormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(form);
      toast.success('Metadatos guardados');
    } catch {
      toast.danger('Error al guardar metadatos');
    } finally {
      setSaving(false);
    }
  };

  const sections = [
    { key: 'seo' as const, label: 'SEO', icon: Search },
    { key: 'og' as const, label: 'Open Graph', icon: Eye },
    { key: 'general' as const, label: 'General', icon: Info },
    { key: 'avanzado' as const, label: 'Avanzado', icon: Hash },
  ];

  const inputCls = 'w-full rounded-md border border-border-light bg-surface px-3 py-1.5 text-sm text-text outline-none focus:ring-2 focus:ring-accent/30';
  const labelCls = 'block text-xs font-semibold text-text-secondary mb-1';

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-light">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-accent/15 flex items-center justify-center">
            <FileText size={14} className="text-accent-dark" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-primary uppercase tracking-wider">Metadatos y SEO</h3>
            <p className="text-xxs text-text-muted">/{page}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <Eye size={14} />
            </Button>
          )}
          <Button variant="primary" size="sm" onClick={handleSave} loading={saving}>
            <Save size={14} className="mr-1" /> Guardar
          </Button>
        </div>
      </div>

      {/* Section tabs */}
      <div className="flex border-b border-border-light px-4">
        {sections.map((s) => (
          <button
            key={s.key}
            onClick={() => setActiveSection(s.key)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-colors',
              activeSection === s.key
                ? 'border-accent text-primary'
                : 'border-transparent text-text-secondary hover:text-text hover:border-border-light',
            )}
          >
            <s.icon size={13} />
            {s.label}
          </button>
        ))}
      </div>

      {/* Form content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeSection === 'general' && (
          <>
            <div>
              <label className={labelCls}>Slug personalizado</label>
              <Input
                value={form.slug}
                onChange={(e) => update('slug', e.target.value)}
                placeholder={page}
                className={inputCls}
              />
              <p className="text-xxs text-text-muted mt-1">Si está vacío, se usa el slug por defecto: /{page}</p>
            </div>
            <div>
              <label className={labelCls}>Idioma</label>
              <Input
                value={form.lang}
                onChange={(e) => update('lang', e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Página padre</label>
              <Input
                value={form.parent}
                onChange={(e) => update('parent', e.target.value)}
                placeholder="(ninguna)"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Orden</label>
              <Input
                type="number"
                value={form.sortOrder}
                onChange={(e) => update('sortOrder', parseInt(e.target.value) || 0)}
                className={inputCls}
              />
            </div>
          </>
        )}

        {activeSection === 'seo' && (
          <>
            <div>
              <label className={labelCls}>Meta título (title tag)</label>
              <Input
                value={form.metaTitle}
                onChange={(e) => update('metaTitle', e.target.value)}
                placeholder="Título para buscadores"
                className={inputCls}
              />
              <p className="text-xxs text-text-muted mt-1">
                {form.metaTitle.length > 0
                  ? `${form.metaTitle.length} caracteres · ${form.metaTitle.length > 60 ? '⚠️ Puede ser demasiado largo' : '✅ OK'}`
                  : 'Se usará el título por defecto de la página'}
              </p>
            </div>
            <div>
              <label className={labelCls}>Meta descripción</label>
              <textarea
                value={form.metaDescription}
                onChange={(e) => update('metaDescription', e.target.value)}
                placeholder="Descripción para buscadores (máx 160 caracteres)"
                rows={3}
                className={inputCls + ' resize-y'}
              />
              <p className="text-xxs text-text-muted mt-1">
                {form.metaDescription.length > 0
                  ? `${form.metaDescription.length} caracteres · ${form.metaDescription.length > 160 ? '⚠️ Largo recomendado: máx 160' : '✅ OK'}`
                  : 'Se usará la descripción por defecto'}
              </p>
            </div>
            <div>
              <label className={labelCls}>Keywords (separadas por coma)</label>
              <Input
                value={form.keywords}
                onChange={(e) => update('keywords', e.target.value)}
                placeholder="abogados, defensa penal, Nacaome"
                className={inputCls}
              />
              {form.keywords && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {form.keywords.split(',').map((k, i) => (
                    <Badge key={i} tone="neutral" size="sm">{k.trim()}</Badge>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className={labelCls}>URL canónica</label>
              <Input
                value={form.canonical}
                onChange={(e) => update('canonical', e.target.value)}
                placeholder="https://www.pinedayasociadoshn.com/{page}"
                className={inputCls}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <label className={labelCls}>Robots</label>
                <select
                  value={form.robots}
                  onChange={(e) => update('robots', e.target.value)}
                  className={inputCls + ' w-48'}
                >
                  <option value="index, follow">index, follow</option>
                  <option value="noindex, follow">noindex, follow</option>
                  <option value="index, nofollow">index, nofollow</option>
                  <option value="noindex, nofollow">noindex, nofollow</option>
                </select>
              </div>
              <div className="flex items-center gap-2 mt-5">
                <label className="text-xs text-text-secondary cursor-pointer flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    checked={form.noindex}
                    onChange={(e) => update('noindex', e.target.checked)}
                    className="rounded border-border"
                  />
                  No indexar
                </label>
              </div>
            </div>
          </>
        )}

        {activeSection === 'og' && (
          <>
            <div>
              <label className={labelCls}>OG Título</label>
              <Input
                value={form.ogTitle}
                onChange={(e) => update('ogTitle', e.target.value)}
                placeholder="Título para redes sociales"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>OG Descripción</label>
              <textarea
                value={form.ogDescription}
                onChange={(e) => update('ogDescription', e.target.value)}
                placeholder="Descripción para redes sociales"
                rows={3}
                className={inputCls + ' resize-y'}
              />
            </div>
            <div>
              <label className={labelCls}>OG Imagen (URL)</label>
              <Input
                value={form.ogImage}
                onChange={(e) => update('ogImage', e.target.value)}
                placeholder="https://.../og-image.png"
                className={inputCls}
              />
              {form.ogImage && (
                <div className="mt-2 rounded-md border border-border-light overflow-hidden w-48 h-28 bg-surface-alt">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={form.ogImage}
                    alt="Preview OG"
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>
              )}
            </div>
          </>
        )}

        {activeSection === 'avanzado' && (
          <div className="space-y-3 text-sm text-text-secondary">
            <Card padding="md" tone="accent">
              <p className="font-semibold text-xs text-primary mb-1">Estado de la página</p>
              <p className="text-xxs">
                Cambia el estado desde la barra superior del editor visual.
                Usa <strong>Publicado</strong> para visible en web,
                <strong> Borrador</strong> para trabajo en curso,
                <strong> Inactivo</strong> para ocultar temporalmente.
              </p>
            </Card>
            <div className="border-t border-border-light pt-3">
              <p className="text-xxs font-semibold text-text-muted uppercase tracking-wider mb-2">Información técnica</p>
              <div className="space-y-1 text-xxs">
                <p><span className="text-text-muted">Página:</span> {page}</p>
                <p><span className="text-text-muted">Slug:</span> /{form.slug || page}</p>
                <p><span className="text-text-muted">URL:</span> https://www.pinedayasociadoshn.com/{form.slug || page}</p>
                <p><span className="text-text-muted">Idioma:</span> {form.lang}</p>
                <p><span className="text-text-muted">Orden:</span> {form.sortOrder}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-border-light bg-surface-alt/50">
        <div className="flex items-center justify-between text-xxs text-text-muted">
          <span>Los cambios de contenido se guardan desde el editor visual</span>
          <span className="flex items-center gap-1">
            <Globe size={10} /> Sin deploy necesario
          </span>
        </div>
      </div>
    </div>
  );
}
