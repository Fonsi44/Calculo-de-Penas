'use client';

import { useEffect, useState, use } from 'react';
import { Scale, Upload, FileText, CheckCircle2, AlertTriangle, Lock, Loader2 } from 'lucide-react';

interface EstadoToken {
  ok: boolean;
  error?: string;
  codigo?: string;
  expediente?: { numeroInterno: string };
}

export default function PortalCargaClient({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [estado, setEstado] = useState<EstadoToken | null>(null);
  const [verificando, setVerificando] = useState(true);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [resultado, setResultado] = useState<{ ok: boolean; mensaje: string; duplicado?: boolean } | null>(null);

  // Verificar validez del token al montar (GET implícito vía POST de prueba ligero
  // no es ideal; usamos el propio endpoint de carga que valida el token y devuelve
  // error específico si el token es inválido). Para UX, mostramos el formulario y
  // dejamos que la carga valide el token.
  /* eslint-disable react-hooks/set-state-in-effect -- inicialización única */
  useEffect(() => {
    setVerificando(false);
    setEstado({ ok: true });
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!archivo) return;
    setSubiendo(true);
    setResultado(null);
    try {
      const fd = new FormData();
      fd.append('archivo', archivo);
      const res = await fetch(`/api/public/cargar/${token}`, { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) {
        setResultado({ ok: false, mensaje: data.error || 'Error al subir el documento.' });
        if (res.status === 404 || res.status === 410) {
          setEstado({ ok: false, error: data.error, codigo: 'invalido' });
        }
      } else {
        setResultado({ ok: true, mensaje: data.mensaje, duplicado: data.duplicado });
        setArchivo(null);
      }
    } catch {
      setResultado({ ok: false, mensaje: 'Error de conexión. Inténtelo de nuevo.' });
    } finally {
      setSubiendo(false);
    }
  };

  if (verificando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Loader2 className="animate-spin text-primary" size={28} />
      </div>
    );
  }

  // Token inválido/expirado/revocado.
  if (estado && !estado.ok) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full text-center">
          <div className="w-14 h-14 rounded-xl bg-danger-bg flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="text-danger" size={28} />
          </div>
          <h1 className="text-lg font-bold text-primary mb-2">Enlace no disponible</h1>
          <p className="text-sm text-text-secondary mb-6">{estado.error}</p>
          <p className="text-xs text-text-muted">
            Si cree que es un error, contacte con su abogado en Pineda y Asociados.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-xl bg-primary flex items-center justify-center mx-auto mb-3 shadow-lg">
            <Scale className="text-accent" size={28} />
          </div>
          <h1 className="text-lg font-extrabold text-primary">Pineda y Asociados</h1>
          <p className="text-xs text-text-muted mt-1 flex items-center justify-center gap-1.5">
            <Lock size={12} /> Entrega segura de documentos
          </p>
        </div>

        <div className="bg-surface border border-border-light rounded-lg p-5 shadow-sm">
          <div className="flex items-start gap-2 p-3 rounded-md bg-info/10 border border-info/20 mb-4">
            <FileText className="text-info flex-shrink-0 mt-0.5" size={16} />
            <p className="text-xs text-text">
              Su abogado le ha solicitado documentación. Suba aquí los archivos solicitados.
              La entrega es confidencial y queda registrada en el expediente.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-2">
                Seleccione el documento
              </label>
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-md p-6 cursor-pointer hover:border-accent hover:bg-surface-alt transition-colors">
                <Upload className="text-text-muted mb-2" size={24} />
                <span className="text-sm font-medium text-text">
                  {archivo ? archivo.name : 'Haga clic para seleccionar'}
                </span>
                <span className="text-xxs text-text-muted mt-1">
                  PDF, JPG, PNG, DOCX · máx. 25 MB
                </span>
                <input
                  type="file"
                  className="sr-only"
                  accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.txt"
                  onChange={(e) => {
                    setArchivo(e.target.files?.[0] ?? null);
                    setResultado(null);
                  }}
                  required
                />
              </label>
            </div>

            {resultado && (
              <div
                className={`p-3 rounded-md flex items-start gap-2 ${
                  resultado.ok
                    ? 'bg-success/10 border border-success/20'
                    : 'bg-danger-bg border border-danger/30'
                }`}
              >
                {resultado.ok ? (
                  <CheckCircle2 className="text-success flex-shrink-0 mt-0.5" size={16} />
                ) : (
                  <AlertTriangle className="text-danger flex-shrink-0 mt-0.5" size={16} />
                )}
                <p className="text-xs text-text">{resultado.mensaje}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={!archivo || subiendo}
              className="w-full h-10 rounded-md bg-primary text-text-inverse font-bold text-sm hover:bg-primary-light disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {subiendo ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Subiendo...
                </>
              ) : (
                <>
                  <Upload size={14} /> Entregar documento
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xxs text-text-muted mt-4 leading-relaxed">
          Sus datos se tratan con confidencialidad conforme a las políticas del despacho.
          Si necesita ayuda, contacte con su abogado.
        </p>
      </div>
    </div>
  );
}
