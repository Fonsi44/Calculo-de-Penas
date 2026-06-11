'use client';

import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { Spinner } from '@/components/ui/spinner';
import { site } from '@/lib/site';

const SECTIONS = [
  {
    title: 'Contacto',
    fields: [
      { key: 'telefono', label: 'Teléfono', placeholder: site.phone, type: 'text' },
      { key: 'whatsapp', label: 'WhatsApp', placeholder: '50495363724', hint: 'Solo dígitos con prefijo país', type: 'text' },
      { key: 'email', label: 'Email', placeholder: site.email, type: 'email' },
    ],
  },
  {
    title: 'Dirección',
    fields: [
      { key: 'direccion_line1', label: 'Línea 1', placeholder: site.address.line1, type: 'text' },
      { key: 'direccion_line2', label: 'Línea 2', placeholder: site.address.line2, type: 'text' },
      { key: 'ciudad', label: 'Ciudad', placeholder: site.address.city, type: 'text' },
      { key: 'departamento', label: 'Departamento', placeholder: site.address.department, type: 'text' },
    ],
  },
  {
    title: 'Horario',
    fields: [
      { key: 'horario', label: 'Horario', placeholder: site.hours, type: 'text' },
    ],
  },
  {
    title: 'Redes Sociales',
    fields: [
      { key: 'facebook', label: 'Facebook URL', placeholder: site.social.facebook ?? 'https://facebook.com/...', type: 'url' },
      { key: 'instagram', label: 'Instagram URL', placeholder: site.social.instagram ?? 'https://instagram.com/...', type: 'url' },
      { key: 'tiktok', label: 'TikTok URL', placeholder: site.social.tiktok ?? 'https://tiktok.com/...', type: 'url' },
    ],
  },
  {
    title: 'Geolocalización',
    fields: [
      { key: 'geo_lat', label: 'Latitud', placeholder: String(site.geo.latitude), type: 'text' },
      { key: 'geo_lng', label: 'Longitud', placeholder: String(site.geo.longitude), type: 'text' },
    ],
  },
];

export default function AdminConfigPage() {
  const toast = useToast();
  const [config, setConfig] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/admin/site-config')
      .then(r => r.json())
      .then(data => setConfig(data.config ?? {}))
      .catch(() => toast.danger('Error al cargar configuración'))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const updateField = (key: string, value: string) => {
    setConfig(c => ({ ...c, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const toSave: Record<string, string> = {};
      for (const s of SECTIONS) {
        for (const f of s.fields) {
          if (config[f.key] && config[f.key] !== f.placeholder) {
            toSave[f.key] = config[f.key];
          }
        }
      }

      if (Object.keys(toSave).length === 0) {
        toast.danger('No hay cambios para guardar');
        setSaving(false);
        return;
      }

      const res = await fetch('/api/admin/site-config', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toSave),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      toast.success('Configuración guardada. Los cambios se reflejarán en la web.');
      const data = await res.json();
      setConfig(data.config ?? {});
    } catch (e) { toast.danger(e instanceof Error ? e.message : 'Error'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="flex justify-center py-8"><Spinner /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-primary">Configuración del Sitio</h1>
          <p className="text-xs text-text-secondary">Sobrescribe los valores por defecto del sitio. Deja vacío para usar el valor predeterminado.</p>
        </div>
        <Button variant="primary" size="sm" onClick={handleSave} loading={saving}>
          <Save size={14} className="mr-1" /> Guardar todo
        </Button>
      </div>

      {SECTIONS.map(section => (
        <Card key={section.title} padding="md">
          <h2 className="font-bold text-sm text-primary mb-3">{section.title}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {section.fields.map(field => (
              <div key={field.key}>
                <label className="block text-xxs font-semibold text-text-secondary mb-1">{field.label}</label>
                <Input
                  type={field.type}
                  value={config[field.key] ?? ''}
                  onChange={e => updateField(field.key, e.target.value)}
                  placeholder={field.placeholder}
                />
                {field.hint && <p className="text-xxs text-text-muted mt-0.5">{field.hint}</p>}
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}
