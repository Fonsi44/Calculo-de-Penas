'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '@/app/auth-context';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/ui';
import {
  Plus, Pencil, Eye, EyeOff, Search, RefreshCw,
  ChevronLeft, ChevronRight, X, Check, Play,
} from 'lucide-react';

interface Plantilla {
  id: string;
  slug: string;
  nombre: string;
  asunto: string;
  cuerpoHtml: string;
  variablesPermitidas: string[];
  estado: 'borrador' | 'activa' | 'desactivada';
  creadoEn: string;
  actualizadoEn: string | null;
}

const ESTADO_LABELS: Record<string, { label: string; className: string }> = {
  borrador: { label: 'Borrador', className: 'bg-gray-100 text-gray-700 border-gray-300' },
  activa: { label: 'Activa', className: 'bg-green-100 text-green-700 border-green-300' },
  desactivada: { label: 'Desactivada', className: 'bg-red-100 text-red-700 border-red-300' },
};

async function apiCall(url: string, options?: RequestInit) {
  const res = await fetch(url, { credentials: 'include', ...options });
  if (res.status === 401) throw new Error('No autorizado');
  return res.json();
}

export default function PlantillasAdminPage() {
  const { user, loading } = useAuth();
  const [plantillas, setPlantillas] = useState<Plantilla[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filtroEstado, setFiltroEstado] = useState<string>('');
  const [busqueda, setBusqueda] = useState('');
  const [fetching, setFetching] = useState(true);
  const [editorAbierto, setEditorAbierto] = useState<string | null>(null); // null = nuevo, string = id editar
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const limit = 20;

  // Form state
  const [formSlug, setFormSlug] = useState('');
  const [formNombre, setFormNombre] = useState('');
  const [formAsunto, setFormAsunto] = useState('');
  const [formCuerpoHtml, setFormCuerpoHtml] = useState('');
  const [formVariables, setFormVariables] = useState('');
  const [formEstado, setFormEstado] = useState<'borrador' | 'activa' | 'desactivada'>('borrador');

  // Preview test variables
  const [testVars, setTestVars] = useState('{}');

  const cargarPlantillas = useCallback(async () => {
    setFetching(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (filtroEstado) params.set('estado', filtroEstado);
      if (busqueda) params.set('q', busqueda);
      const data = await apiCall(`/api/admin/sgie/plantillas?${params}`);
      setPlantillas(data.plantillas ?? []);
      setTotal(data.total ?? 0);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setFetching(false);
    }
  }, [page, filtroEstado, busqueda]);

  const mounted = useRef(false);
  useEffect(() => {
    if (!loading && user?.rol === 'admin' && !mounted.current) {
      mounted.current = true;
      cargarPlantillas();
    }
  }, [loading, user, cargarPlantillas]);

  const abrirEditor = (plantilla?: Plantilla) => {
    if (plantilla) {
      setEditorAbierto(plantilla.id);
      setFormSlug(plantilla.slug);
      setFormNombre(plantilla.nombre);
      setFormAsunto(plantilla.asunto);
      setFormCuerpoHtml(plantilla.cuerpoHtml);
      setFormVariables(plantilla.variablesPermitidas.join('\n'));
      setFormEstado(plantilla.estado);
    } else {
      setEditorAbierto('nuevo');
      setFormSlug('');
      setFormNombre('');
      setFormAsunto('');
      setFormCuerpoHtml('');
      setFormVariables('');
      setFormEstado('borrador');
    }
    setTestVars('{}');
    setPreviewHtml(null);
  };

  const cerrarEditor = () => {
    setEditorAbierto(null);
    setPreviewHtml(null);
  };

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    setError(null);
    try {
      const body = {
        slug: formSlug,
        nombre: formNombre,
        asunto: formAsunto,
        cuerpoHtml: formCuerpoHtml,
        variablesPermitidas: formVariables
          .split('\n')
          .map((v) => v.trim())
          .filter(Boolean),
        ...(editorAbierto !== 'nuevo' ? { estado: formEstado } : {}),
      };

      let res;
      if (editorAbierto === 'nuevo') {
        res = await apiCall('/api/sgie/plantillas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      } else {
        res = await apiCall(`/api/sgie/plantillas/${editorAbierto}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      }

      if (res.error) {
        setError(res.error);
      } else {
        cerrarEditor();
        cargarPlantillas();
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setGuardando(false);
    }
  };

  const hacerPreview = async () => {
    setPreviewHtml(null);
    setError(null);
    try {
      let vars: Record<string, string> = {};
      try {
        vars = JSON.parse(testVars);
      } catch {
        setError('JSON inválido para variables de prueba');
        return;
      }
      const res = await apiCall('/api/admin/sgie/plantillas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plantillaSlug: formSlug, variables: vars }),
      });
      if (res.error) {
        setError(res.error);
      } else {
        setPreviewHtml(res.cuerpoHtml);
      }
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  if (loading) return <Spinner size="lg" />;
  if (!user || user.rol !== 'admin') {
    return (
      <div className="text-center py-20">
        <p className="font-bold text-primary">Acceso restringido</p>
        <p className="text-sm text-text-secondary mt-2">Solo administradores pueden gestionar plantillas.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-primary">Plantillas de correo</h1>
          <p className="text-sm text-text-secondary mt-1">
            {total} plantilla{total !== 1 ? 's' : ''} — Gestión de correos automatizados SGIE
          </p>
        </div>
        <button
          onClick={() => abrirEditor()}
          className="inline-flex items-center gap-2 h-9 px-4 rounded-md bg-primary text-text-inverse font-semibold text-sm hover:bg-primary-light transition-colors"
        >
          <Plus size={16} />
          Nueva plantilla
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-md bg-danger-bg border border-danger/20 text-danger text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)}><X size={14} /></button>
        </div>
      )}

      {/* Filtros */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Buscar plantilla..."
            value={busqueda}
            onChange={(e) => { setBusqueda(e.target.value); setPage(1); }}
            className="h-9 pl-8 pr-3 rounded-md border border-border-light bg-surface text-sm text-text focus:outline-none focus:ring-1 focus:ring-accent w-56"
          />
        </div>
        <select
          value={filtroEstado}
          onChange={(e) => { setFiltroEstado(e.target.value); setPage(1); }}
          className="h-9 px-3 rounded-md border border-border-light bg-surface text-sm text-text focus:outline-none focus:ring-1 focus:ring-accent"
        >
          <option value="">Todos los estados</option>
          <option value="borrador">Borrador</option>
          <option value="activa">Activa</option>
          <option value="desactivada">Desactivada</option>
        </select>
        <button
          onClick={cargarPlantillas}
          className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-border-light text-sm text-text-secondary hover:bg-surface-alt transition-colors"
        >
          <RefreshCw size={14} />
          Actualizar
        </button>
      </div>

      {/* Editor */}
      {editorAbierto && (
        <div className="bg-surface border border-border-light rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-primary">
              {editorAbierto === 'nuevo' ? 'Nueva plantilla' : 'Editar plantilla'}
            </h2>
            <button onClick={cerrarEditor} className="p-1 hover:bg-surface-alt rounded">
              <X size={18} className="text-text-muted" />
            </button>
          </div>
          <form onSubmit={guardar} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Slug</label>
                <input
                  type="text"
                  value={formSlug}
                  onChange={(e) => setFormSlug(e.target.value)}
                  required
                  disabled={editorAbierto !== 'nuevo'}
                  placeholder="ej: solicitud_documentos"
                  className="w-full h-9 px-3 rounded-md border border-border-light bg-background text-sm disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Nombre</label>
                <input
                  type="text"
                  value={formNombre}
                  onChange={(e) => setFormNombre(e.target.value)}
                  required
                  placeholder="Nombre descriptivo"
                  className="w-full h-9 px-3 rounded-md border border-border-light bg-background text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">Asunto</label>
              <input
                type="text"
                value={formAsunto}
                onChange={(e) => setFormAsunto(e.target.value)}
                required
                placeholder="Asunto del correo (puede usar {{variables}})"
                className="w-full h-9 px-3 rounded-md border border-border-light bg-background text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">
                Cuerpo HTML
              </label>
              <textarea
                value={formCuerpoHtml}
                onChange={(e) => setFormCuerpoHtml(e.target.value)}
                required
                rows={10}
                placeholder="<!DOCTYPE html>..."
                className="w-full px-3 py-2 rounded-md border border-border-light bg-background text-sm font-mono resize-y"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  Variables permitidas (una por línea)
                </label>
                <textarea
                  value={formVariables}
                  onChange={(e) => setFormVariables(e.target.value)}
                  rows={4}
                  placeholder="nombre_cliente&#10;numero_expediente"
                  className="w-full px-3 py-2 rounded-md border border-border-light bg-background text-sm font-mono resize-y"
                />
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">
                    Variables de prueba (JSON)
                  </label>
                  <textarea
                    value={testVars}
                    onChange={(e) => setTestVars(e.target.value)}
                    rows={4}
                    placeholder='{"nombre_cliente":"Juan Pérez","numero_expediente":"EXP-001"}'
                    className="w-full px-3 py-2 rounded-md border border-border-light bg-background text-sm font-mono resize-y"
                  />
                </div>
                <button
                  type="button"
                  onClick={hacerPreview}
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-accent/30 text-accent text-xs font-semibold hover:bg-accent/10 transition-colors"
                >
                  <Play size={13} />
                  Vista previa
                </button>
              </div>
            </div>
            {editorAbierto !== 'nuevo' && (
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Estado</label>
                <select
                  value={formEstado}
                  onChange={(e) => setFormEstado(e.target.value as typeof formEstado)}
                  className="h-9 px-3 rounded-md border border-border-light bg-background text-sm"
                >
                  <option value="borrador">Borrador</option>
                  <option value="activa">Activa</option>
                  <option value="desactivada">Desactivada</option>
                </select>
              </div>
            )}
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={guardando}
                className="inline-flex items-center gap-2 h-9 px-5 rounded-md bg-primary text-text-inverse font-semibold text-sm hover:bg-primary-light disabled:opacity-50 transition-colors"
              >
                {guardando ? <Spinner size="sm" /> : <Check size={16} />}
                {editorAbierto === 'nuevo' ? 'Crear plantilla' : 'Guardar cambios'}
              </button>
              <button
                type="button"
                onClick={cerrarEditor}
                className="h-9 px-4 rounded-md border border-border-light text-sm text-text-secondary hover:bg-surface-alt transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Preview panel */}
      {previewHtml && (
        <div className="bg-white border border-border-light rounded-lg p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-primary text-sm">Vista previa del correo</h3>
            <button onClick={() => setPreviewHtml(null)} className="p-1 hover:bg-surface-alt rounded">
              <X size={16} className="text-text-muted" />
            </button>
          </div>
          <div className="border border-gray-200 rounded-md max-h-96 overflow-y-auto">
            <iframe
              srcDoc={previewHtml}
              title="Vista previa"
              className="w-full h-96 border-0"
            />
          </div>
        </div>
      )}

      {/* Tabla */}
      {fetching ? (
        <Spinner size="lg" />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-light text-left">
                  <th className="py-2.5 px-3 font-semibold text-text-secondary text-xs">Nombre</th>
                  <th className="py-2.5 px-3 font-semibold text-text-secondary text-xs">Slug</th>
                  <th className="py-2.5 px-3 font-semibold text-text-secondary text-xs">Asunto</th>
                  <th className="py-2.5 px-3 font-semibold text-text-secondary text-xs">Variables</th>
                  <th className="py-2.5 px-3 font-semibold text-text-secondary text-xs">Estado</th>
                  <th className="py-2.5 px-3 font-semibold text-text-secondary text-xs">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                {plantillas.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-text-muted text-sm">
                      No se encontraron plantillas.
                    </td>
                  </tr>
                ) : (
                  plantillas.map((p) => (
                    <tr key={p.id} className="hover:bg-surface-alt/50 transition-colors">
                      <td className="py-2.5 px-3 font-medium text-text">{p.nombre}</td>
                      <td className="py-2.5 px-3 text-text-muted font-mono text-xs">{p.slug}</td>
                      <td className="py-2.5 px-3 text-text-secondary text-xs max-w-xs truncate">
                        {p.asunto}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex flex-wrap gap-1">
                          {p.variablesPermitidas.slice(0, 3).map((v) => (
                            <span key={v} className="px-1.5 py-0.5 rounded bg-surface-alt text-xxs text-text-muted font-mono">
                              {`{{${v}}}`}
                            </span>
                          ))}
                          {p.variablesPermitidas.length > 3 && (
                            <span className="text-xxs text-text-muted">+{p.variablesPermitidas.length - 3}</span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={cn(
                          'inline-block px-2 py-0.5 rounded-full text-xxs font-semibold border',
                          ESTADO_LABELS[p.estado]?.className ?? 'bg-gray-100 text-gray-700',
                        )}>
                          {ESTADO_LABELS[p.estado]?.label ?? p.estado}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => abrirEditor(p)}
                            className="p-1.5 rounded-md hover:bg-surface-alt text-text-secondary hover:text-text transition-colors"
                            title="Editar"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={async () => {
                              if (!confirm(`¿${p.estado === 'activa' ? 'Desactivar' : 'Activar'} plantilla "${p.nombre}"?`)) return;
                              const nuevoEstado = p.estado === 'activa' ? 'desactivada' : 'activa';
                              await apiCall(`/api/sgie/plantillas/${p.id}`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ estado: nuevoEstado }),
                              });
                              cargarPlantillas();
                            }}
                            className="p-1.5 rounded-md hover:bg-surface-alt text-text-secondary hover:text-text transition-colors"
                            title={p.estado === 'activa' ? 'Desactivar' : 'Activar'}
                          >
                            {p.estado === 'activa' ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-text-muted">
                Página {page} de {totalPages} ({total} resultados)
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="p-1.5 rounded-md border border-border-light hover:bg-surface-alt disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="p-1.5 rounded-md border border-border-light hover:bg-surface-alt disabled:opacity-30 transition-colors"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
