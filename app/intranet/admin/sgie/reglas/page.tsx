'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '@/app/auth-context';
import { Spinner } from '@/components/ui/spinner';
import { Shield, Save } from 'lucide-react';

export default function ReglasAdminPage() {
  const { user, loading: authLoading } = useAuth();
  const [config, setConfig] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [jsonText, setJsonText] = useState('');
  const mounted = useRef(false);

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/sgie/reglas');
      if (res.ok) {
        const data = await res.json();
        setConfig(data.activa);
        setJsonText(JSON.stringify(data.activa, null, 2));
      }
    } catch { /* */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (!authLoading && user?.rol === 'admin' && !mounted.current) { mounted.current = true; fetchConfig(); }
  }, [authLoading, user, fetchConfig]);

  const handleSave = async () => {
    setSaving(true); setMsg('');
    try {
      let parsed: unknown;
      try { parsed = JSON.parse(jsonText); } catch { setMsg('JSON inválido'); setSaving(false); return; }
      const res = await fetch('/api/admin/sgie/reglas', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: parsed, descripcion: 'Actualización desde panel admin' }),
      });
      if (!res.ok) { setMsg((await res.json()).error); }
      else { setMsg('Configuración guardada. Nueva versión creada.'); fetchConfig(); }
    } catch { setMsg('Error'); }
    finally { setSaving(false); }
  };

  if (authLoading) return <Spinner size="lg" />;
  if (!user || user.rol !== 'admin') return <div className="text-center py-20"><p className="font-bold text-primary">Acceso restringido</p></div>;
  if (loading) return <Spinner size="lg" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-primary">Configuración de reglas</h1>
        <p className="text-sm text-text-secondary mt-1">Ajuste de umbrales, pesos y parámetros del motor de reglas. Los cambios crean una nueva versión auditada.</p>
      </div>

      {msg && <div className="p-3 rounded-md bg-accent/10 text-accent text-sm">{msg}</div>}

      <div className="bg-surface border border-border-light rounded-lg p-4">
        <textarea value={jsonText} onChange={(e) => setJsonText(e.target.value)}
          className="w-full h-96 px-3 py-2 rounded-md border border-border-light bg-background text-sm font-mono resize-y" />
        <div className="flex justify-end mt-3">
          <button onClick={handleSave} disabled={saving}
            className="inline-flex items-center gap-2 h-9 px-5 rounded-md bg-primary text-text-inverse font-semibold text-sm hover:bg-primary-light disabled:opacity-50">
            <Save size={14} /> {saving ? 'Guardando...' : 'Guardar nueva versión'}
          </button>
        </div>
      </div>
    </div>
  );
}
