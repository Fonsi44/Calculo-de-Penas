'use client';

import { useState, useEffect } from 'react';

interface PortalData {
  ok: boolean;
  expediente?: { numeroInterno: string; estado: string; area: string | null };
  requisitos?: Array<{ id: string; nombre: string; tipo: string; estado: string; documentoEstado: string | null; documentoId: string | null }>;
  error?: string;
  codigo?: string;
}

export default function CargarPage({ params }: { params: Promise<{ token: string }> }) {
  const [token, setToken] = useState<string | null>(null);
  const [portal, setPortal] = useState<PortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    params.then((p) => setToken(p.token));
  }, [params]);

  useEffect(() => {
    if (!token) return;
    fetch(`/api/public/portal?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((d) => { setPortal(d); setLoading(false); })
      .catch(() => { setError('Error al cargar el portal'); setLoading(false); });
  }, [token]);

  async function handleUpload(file: File) {
    if (!token) return;
    setUploading(true);
    setMensaje(null);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('archivo', file);
      const res = await fetch(`/api/public/cargar/${encodeURIComponent(token)}`, { method: 'POST', body: formData });
      const data = await res.json();
      if (res.ok) {
        setMensaje(data.mensaje ?? 'Documento recibido correctamente.');
        setError(null);
      } else {
        setError(data.error ?? 'Error al subir el documento.');
      }
    } catch {
      setError('Error de conexión al subir el documento.');
    } finally {
      setUploading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-2xl text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Cargando portal seguro...</p>
        </div>
      </div>
    );
  }

  if (error && !portal) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-2xl text-center">
          <div className="text-red-500 text-5xl mb-4">&#9888;</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Enlace no disponible</h1>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  if (!portal?.ok) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-2xl text-center">
          <div className="text-amber-500 text-5xl mb-4">&#9888;</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Enlace inválido o expirado</h1>
          <p className="text-gray-500">{portal?.error ?? 'Este enlace no es válido o ha expirado. Contacte a su abogado para obtener uno nuevo.'}</p>
        </div>
      </div>
    );
  }

  const exp = portal.expediente;
  const reqs = portal.requisitos ?? [];
  const pendientes = reqs.filter((r) => r.estado !== 'aprobado' && r.estado !== 'rechazado');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto p-4 sm:p-8">
        <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8">
          <div className="border-b border-gray-200 pb-4 mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Portal de documentos</h1>
            <p className="text-gray-500 mt-1">
              Expediente: <span className="font-medium text-gray-700">{exp?.numeroInterno}</span>
            </p>
            {exp?.area && <p className="text-sm text-gray-400">{exp.area}</p>}
          </div>

          {mensaje && (
            <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-4 mb-6">
              {mensaje}
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-4 mb-6">
              {error}
            </div>
          )}

          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Documentos requeridos</h2>
            {reqs.length === 0 ? (
              <p className="text-gray-400 text-sm">No hay requisitos documentales pendientes.</p>
            ) : (
              <div className="space-y-2">
                {reqs.map((r) => (
                  <div key={r.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-800">{r.nombre}</p>
                      <p className="text-xs text-gray-400">
                        {r.estado === 'aprobado' ? 'Aprobado' :
                         r.estado === 'rechazado' ? 'Rechazado' :
                         r.estado === 'subido' ? 'Recibido, en revisión' :
                         'Pendiente'}
                      </p>
                    </div>
                    {r.estado === 'aprobado' ? (
                      <span className="text-green-600 text-sm font-medium">Completado</span>
                    ) : r.estado === 'rechazado' ? (
                      <span className="text-red-500 text-sm">Requiere reemplazo</span>
                    ) : (
                      <span className={`text-sm ${r.documentoEstado === 'subido' ? 'text-amber-600' : 'text-gray-400'}`}>
                        {r.documentoEstado === 'subido' ? 'En revisión' : 'Pendiente'}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {pendientes.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">Subir documento</h2>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                <input
                  type="file"
                  id="archivo"
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.txt"
                  disabled={uploading}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUpload(file);
                  }}
                />
                <label htmlFor="archivo" className="cursor-pointer">
                  <div className="text-4xl text-gray-300 mb-2">&#128194;</div>
                  <p className="text-gray-600 font-medium mb-1">
                    {uploading ? 'Subiendo...' : 'Haga clic para seleccionar un archivo'}
                  </p>
                  <p className="text-gray-400 text-sm">
                    PDF, JPG, PNG, DOC (máx. 25 MB)
                  </p>
                </label>
              </div>
            </div>
          )}

          <div className="mt-8 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-400 text-center">
              Portal seguro. Sus documentos están protegidos.
              Si tiene problemas, contacte a su abogado.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
