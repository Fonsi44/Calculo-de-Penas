'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Trash2, Edit3 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import { useConfirm } from '@/components/ui/confirm';
import { Spinner } from '@/components/ui/spinner';
import { PageHeader } from '@/components/ui/page-header';
import { TablePagination } from '@/components/ui/table-pagination';

interface AreaJuridica {
  id: string; slug: string; titulo: string; descripcionCorta: string | null;
  categoria: string; icono: string | null; sortOrder: number;
  estado: string; subservicios: { titulo: string; descripcion: string }[] | null;
  faqs: { pregunta: string; respuesta: string }[] | null;
}

export default function AdminServiciosPage() {
  const toast = useToast();
  const confirm = useConfirm();
  const [areas, setAreas] = useState<AreaJuridica[]>([]);
  const [loading, setLoading] = useState(true);
  const [catFilter, setCatFilter] = useState('');

  const fetchAreas = () => {
    setLoading(true);
    const params = catFilter ? `?categoria=${catFilter}` : '';
    fetch(`/api/admin/areas-juridicas${params}`)
      .then(r => r.json())
      .then(data => setAreas(data.areas ?? []))
      .catch(() => toast.danger('Error al cargar'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAreas(); }, [catFilter]); // eslint-disable-line react-hooks/exhaustive-deps,react-hooks/set-state-in-effect

  const handleDelete = async (id: string, titulo: string) => {
    if (!await confirm({ title: `¿Eliminar "${titulo}"?`, description: 'Esta acción no se puede deshacer.' })) return;
    try {
      const res = await fetch(`/api/admin/areas-juridicas?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.success('Área eliminada');
      fetchAreas();
    } catch { toast.danger('Error al eliminar'); }
  };

  if (loading) return <div className="flex justify-center py-8"><Spinner /></div>;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Áreas jurídicas"
        subtitle={`${areas.length} áreas de servicio`}
        actions={
          <Link href="/intranet/admin/pages/servicios-juridicos" className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-primary text-white text-xs font-semibold hover:bg-primary-light transition-colors"><Edit3 size={14} /> Editar página</Link>
        }
      />

      <div className="flex gap-2">
        {['', 'servicio', 'penal', 'migrante'].map(cat => (
          <button key={cat} onClick={() => setCatFilter(cat)}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${catFilter === cat ? 'bg-accent/15 text-primary' : 'bg-surface-alt text-text-secondary hover:bg-surface-alt/70'}`}>
            {cat || 'Todas'}
          </button>
        ))}
      </div>

      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-text-secondary">
                <th className="text-left p-3 text-xxs font-bold uppercase">Título</th>
                <th className="text-left p-3 text-xxs font-bold uppercase hidden sm:table-cell">Slug</th>
                <th className="text-left p-3 text-xxs font-bold uppercase hidden md:table-cell">Categoría</th>
                <th className="text-left p-3 text-xxs font-bold uppercase">Estado</th>
                <th className="text-right p-3 text-xxs font-bold uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {areas.map(area => (
                <tr key={area.id} className="border-b border-border hover:bg-surface-alt">
                  <td className="p-3 font-medium text-text">{area.titulo}</td>
                  <td className="p-3 text-text-secondary text-xs hidden sm:table-cell font-mono">/{area.slug}</td>
                  <td className="p-3 hidden md:table-cell">
                    <Badge tone={area.categoria === 'penal' ? 'aggravation' : area.categoria === 'migrante' ? 'info' : 'primary'}>
                      {area.categoria}
                    </Badge>
                  </td>
                  <td className="p-3">
                    <Badge tone={area.estado === 'publicado' ? 'success' : 'warning'}>{area.estado}</Badge>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" aria-label="Editar"><Edit3 size={14} /></Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(area.id, area.titulo)} aria-label="Eliminar"><Trash2 size={14} className="text-danger" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <TablePagination page={1} totalPages={1} total={areas.length} label="áreas" onPrev={() => {}} onNext={() => {}} />
      </Card>
    </div>
  );
}
