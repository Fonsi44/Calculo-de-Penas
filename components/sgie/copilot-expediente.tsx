'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/components/ui/toast';
import { Bot, Send, AlertTriangle, CheckCircle2 } from 'lucide-react';

export function CopilotExpediente({ expedienteId }: { expedienteId: string }) {
  const toast = useToast();
  const [pregunta, setPregunta] = useState('');
  const [respuesta, setRespuesta] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleConsultar = async () => {
    if (!pregunta.trim()) return;
    setLoading(true); setError(''); setRespuesta(null);
    try {
      const resp = await fetch(`/api/sgie/expedientes/${expedienteId}/copilot`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pregunta: pregunta.trim() }),
      });
      if (resp.status === 429) { setError('Demasiadas consultas. Espere un momento.'); return; }
      if (resp.status === 403) { setError('No tiene permisos para usar el asistente.'); return; }
      if (!resp.ok) { setError('Error del asistente.'); return; }
      const data = await resp.json();
      setRespuesta(data);
    } catch { setError('Error de conexión.'); }
    finally { setLoading(false); }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleConsultar(); } };

  return (
    <Card padding="md">
      <div className="flex items-center gap-2 mb-3">
        <Bot size={16} className="text-accent-dark" />
        <h2 className="text-sm font-bold text-text">Asistente SGIE</h2>
      </div>

      <div className="flex gap-2 mb-3">
        <input
          className="flex-1 border border-border rounded-lg px-3 py-2 text-sm bg-surface text-text"
          placeholder="Pregunte sobre el expediente, documentos, plazos..."
          value={pregunta}
          onChange={e => setPregunta(e.target.value)}
          onKeyDown={handleKeyDown}
          aria-label="Pregunta al asistente"
        />
        <Button variant="primary" size="sm" onClick={handleConsultar} loading={loading}>
          <Send size={14} />
        </Button>
      </div>

      {loading && <div className="flex justify-center py-4"><Spinner size="sm" /></div>}

      {error && (
        <div className="flex items-center gap-2 p-2 bg-danger/10 text-danger text-xs rounded" role="alert">
          <AlertTriangle size={12} /> {error}
        </div>
      )}

      {respuesta && (
        <div className="mt-2 space-y-2 text-sm">
          <p className="text-text">{respuesta.answer as string}</p>

          {(respuesta.citations as Array<Record<string, unknown>> || []).length > 0 && (
            <div className="mt-2">
              <p className="text-xxs text-text-muted font-semibold uppercase mb-1">Citas</p>
              {(respuesta.citations as Array<Record<string, unknown>>).map((c, i) => (
                <div key={i} className="text-xs text-text-muted border-l-2 border-accent pl-2 mb-1">
                  <span className="font-semibold">{String(c.tipo || c.tipo_fuente || 'Fuente')}</span>
                  {c.version ? ` v${c.version}` : ''}
                  {c.pagina ? ` · pág. ${c.pagina}` : ''}
                  {c.seccion ? ` · §${c.seccion}` : ''}
                  <p className="text-xxs">{String(c.fragmento || '').slice(0, 150)}</p>
                </div>
              ))}
            </div>
          )}

          {respuesta.confidence !== undefined && (
            <p className="text-xxs text-text-muted">Confianza: {Math.round(Number(respuesta.confidence) * 100)}%</p>
          )}

          {(respuesta.suggestions as string[] || []).length > 0 && (
            <div className="mt-1">
              <p className="text-xxs text-text-muted font-semibold uppercase mb-1">Sugerencias</p>
              {(respuesta.suggestions as string[]).map((s, i) => (
                <p key={i} className="text-xs text-text-secondary">• {s}</p>
              ))}
            </div>
          )}

          {(respuesta.proposedActions as Array<Record<string, unknown>> || []).length > 0 && (
            <div className="mt-2 pt-2 border-t border-border-light">
              {(respuesta.proposedActions as Array<Record<string, unknown>>).map((a, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <CheckCircle2 size={12} className="text-accent-dark" />
                  <span>{String(a.action || a.titulo || '')}</span>
                  <Button variant="ghost" size="sm" onClick={() => toast.success('Propuesta registrada')}>Confirmar</Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
