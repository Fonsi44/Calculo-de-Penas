'use client';

import { useEffect, useState, useRef } from 'react';
import { Upload, Trash2, ImageIcon, FileText, Search, Download, Copy } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import { useConfirm } from '@/components/ui/confirm';
import { Spinner } from '@/components/ui/spinner';
import { PageHeader } from '@/components/ui/page-header';
import { formatFechaCorta } from '@/lib/ui';

interface Medio {
  id: string; nombreArchivo: string; altText: string | null; titulo: string | null;
  tipoMime: string; tamaño: number; url: string; creadoEn: string;
}

export default function AdminMediosPage() {
  const toast = useToast();
  const confirm = useConfirm();
  const [medios, setMedios] = useState<Medio[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [copyId, setCopyId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchMedios = () => {
    setLoading(true);
    fetch('/api/admin/medios')
      .then(r => r.json())
      .then(data => setMedios(data.medios ?? []))
      .catch(() => toast.danger('Error al cargar biblioteca'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchMedios(); }, []); // eslint-disable-line react-hooks/exhaustive-deps,react-hooks/set-state-in-effect

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.danger('Máximo 10 MB'); return; }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('altText', file.name.replace(/\.[^.]+$/, ''));
      const res = await fetch('/api/admin/medios', { method: 'POST', body: fd });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Error'); }
      toast.success('Archivo subido');
      fetchMedios();
    } catch (e) { toast.danger(e instanceof Error ? e.message : 'Error al subir'); }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = ''; }
  };

  const handleDelete = async (medio: Medio) => {
    if (!await confirm({ title: '¿Eliminar archivo?', description: `Se eliminará "${medio.nombreArchivo}" de la biblioteca.` })) return;
    try {
      const res = await fetch(`/api/admin/medios?id=${medio.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.success('Archivo eliminado');
      setMedios(prev => prev.filter(m => m.id !== medio.id));
    } catch { toast.danger('Error al eliminar'); }
  };

  const copyUrl = async (url: string, id: string) => {
    try { await navigator.clipboard.writeText(url); setCopyId(id); setTimeout(() => setCopyId(null), 2000); toast.success('URL copiada'); }
    catch { toast.danger('Error al copiar'); }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isImage = (mime: string) => mime.startsWith('image/');

  return (
    <div className="space-y-4">
      <PageHeader
        title="Biblioteca de medios"
        subtitle={`${medios.length} archivos`}
        actions={
          <div className="flex gap-2">
            <input type="file" ref={fileRef} onChange={handleUpload} className="hidden" accept="image/*,.pdf,.doc,.docx" />
            <Button variant="primary" size="sm" onClick={() => fileRef.current?.click()} loading={uploading}>
              <Upload size={14} /> Subir archivo
            </Button>
          </div>
        }
      />

      <div className="relative">
        <Input placeholder="Buscar archivos..." iconLeft={<Search size={14} />} className="max-w-md" />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : medios.length === 0 ? (
        <Card padding="lg">
          <div className="text-center">
            <ImageIcon size={48} className="mx-auto text-text-muted opacity-50 mb-3" />
            <p className="text-sm text-text-secondary">La biblioteca está vacía. Sube tu primer archivo.</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {medios.map(medio => (
            <Card key={medio.id} padding="none" className="overflow-hidden">
              <div className="aspect-square bg-surface-alt relative group">
                {isImage(medio.tipoMime) ? (
                  <img src={medio.url} alt={medio.altText || ''} className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <FileText size={32} className="text-text-muted" />
                  </div>
                )}
                <div className="absolute inset-0 bg-overlay/0 group-hover:bg-overlay/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                  <button type="button" onClick={() => copyUrl(medio.url, medio.id)}
                    className="p-1.5 rounded-md bg-white/90 text-text hover:bg-white transition-colors" title="Copiar URL">
                    {copyId === medio.id ? <span className="text-xs font-bold text-success">✓</span> : <Copy size={14} />}
                  </button>
                  <button type="button" onClick={() => window.open(medio.url, '_blank')}
                    className="p-1.5 rounded-md bg-white/90 text-text hover:bg-white transition-colors" title="Descargar">
                    <Download size={14} />
                  </button>
                  <button type="button" onClick={() => handleDelete(medio)}
                    className="p-1.5 rounded-md bg-white/90 text-danger hover:bg-white transition-colors" title="Eliminar">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div className="p-2 space-y-1">
                <p className="text-xxs text-text truncate font-medium" title={medio.nombreArchivo}>{medio.nombreArchivo}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xxs text-text-muted">{formatSize(medio.tamaño)}</span>
                  <Badge tone={isImage(medio.tipoMime) ? 'success' : 'info'} size="sm">{medio.tipoMime.split('/')[0]}</Badge>
                </div>
                <p className="text-xxs text-text-muted">{formatFechaCorta(medio.creadoEn)}</p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
