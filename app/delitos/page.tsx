'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, X, ChevronLeft, Plus, Gavel, Edit3, Trash2, BookOpen, ArrowUpRight } from 'lucide-react';
import type { Delito } from '../types';

const ramaNames: Record<string, string> = {
  'vida_integridad': 'Vida e Integridad Física', 'vida_integridad.homicidio': 'Homicidio', 'vida_integridad.homicidio.consumado': 'Homicidio consumado',
  'vida_integridad.homicidio.imprudente': 'Homicidio imprudente', 'vida_integridad.aborto': 'Aborto', 'vida_integridad.lesiones': 'Lesiones',
  'vida_integridad.lesiones.graves': 'Lesiones graves', 'vida_integridad.lesiones.leves': 'Lesiones leves', 'vida_integridad.riña': 'Riña',
  'vida_integridad.vida_dependiente': 'Vida humana dependiente', 'libertad': 'Libertad', 'libertad.detenciones': 'Detenciones ilegales',
  'libertad.detenciones.ilegal': 'Detención ilegal', 'libertad.detenciones.secuestro': 'Secuestro', 'libertad.amenazas': 'Amenazas y coacciones',
  'libertad.violencia_genero': 'Violencia de género', 'libertad.integridad_moral': 'Integridad moral',
  'libertad_sexual': 'Libertad Sexual', 'libertad_sexual.agresiones': 'Agresiones sexuales', 'libertad_sexual.agresiones.violacion': 'Violación',
  'libertad_sexual.agresiones.agravada': 'Agresión sexual agravada', 'libertad_sexual.abusos': 'Abusos sexuales',
  'libertad_sexual.abusos.menores': 'Abusos a menores', 'libertad_sexual.acoso': 'Acoso sexual',
  'libertad_sexual.explotacion': 'Explotación sexual', 'libertad_sexual.trata': 'Trata de personas',
  'honor_intimidad': 'Honor e Intimidad', 'honor_intimidad.calumnias': 'Calumnias e injurias', 'honor_intimidad.secretos': 'Revelación de secretos',
  'honor_intimidad.allanamiento': 'Allanamiento', 'familia': 'Familia', 'patrimonio': 'Patrimonio',
  'patrimonio.hurto': 'Hurto', 'patrimonio.hurto.simple': 'Hurto simple', 'patrimonio.hurto.agravado': 'Hurto agravado',
  'patrimonio.robo': 'Robo', 'patrimonio.robo.simple': 'Robo simple', 'patrimonio.robo.agravado': 'Robo agravado',
  'patrimonio.extorsion': 'Extorsión', 'patrimonio.estafa': 'Estafas', 'patrimonio.estafa.simple': 'Estafa', 'patrimonio.estafa.agravada': 'Estafa agravada',
  'patrimonio.apropiacion': 'Apropiación indebida', 'patrimonio.daños': 'Daños', 'patrimonio.receptacion': 'Receptación',
  'patrimonio.fraude_informatico': 'Fraude informático', 'trabajadores': 'Derechos Laborales',
  'territorio_ambiente': 'Territorio y Medio Ambiente', 'territorio_ambiente.medio_ambiente': 'Medio ambiente',
  'territorio_ambiente.flora_fauna': 'Flora y fauna', 'territorio_ambiente.incendio_forestal': 'Incendio forestal',
  'salud_publica': 'Salud Pública', 'salud_publica.drogas': 'Drogas', 'salud_publica.drogas.trafico': 'Tráfico de drogas',
  'seguridad_colectiva': 'Seguridad Colectiva', 'seguridad_colectiva.vial': 'Seguridad vial',
  'fe_publica': 'Fe Pública', 'fe_publica.moneda': 'Falsificación de moneda',
  'admin_publica': 'Administración Pública', 'admin_publica.cohecho': 'Cohecho', 'admin_publica.malversacion': 'Malversación',
  'justicia': 'Administración de Justicia', 'justicia.prevaricato': 'Prevaricato',
  'orden_publico': 'Orden Público', 'constitucion': 'Constitución',
  'constitucion.rebelion': 'Rebelión', 'constitucion.derechos_fundamentales': 'Derechos fundamentales',
  'seguridad_estado': 'Seguridad del Estado', 'comunidad_internacional': 'Comunidad Internacional',
  'comunidad_internacional.genocidio': 'Genocidio', 'comunidad_internacional.lesa_humanidad': 'Lesa humanidad',
};

const getRamaPath = (id: string | null | undefined): string => {
  if (!id) return '';
  const parts = id.split('.');
  const names = parts.map((_, i) => ramaNames[parts.slice(0, i + 1).join('.')]).filter(Boolean);
  return names.join(' > ');
};

export default function DelitosCatalog() {
  const router = useRouter();
  const [delitos, setDelitos] = useState<Delito[]>([]);
  const [ramas, setRamas] = useState<{ id: string; cantidad: number }[]>([]);
  const [search, setSearch] = useState('');
  const [activeRama, setActiveRama] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [dRes, rRes] = await Promise.all([
        fetch('/api/delitos?limit=1000'),
        fetch('/api/clasificaciones'),
      ]);
      const dJson = await dRes.json();
      const rJson = await rRes.json();
      setDelitos(Array.isArray(dJson) ? dJson : []);
      setRamas(Array.isArray(rJson) ? rJson.map((r: any) => ({ id: r.nombre, cantidad: r.cantidad })) : []);
    } catch (e) {
      console.warn('load delitos', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = delitos.filter((d) => {
    if (search) {
      const q = search.toLowerCase();
      if (!d.nombre.toLowerCase().includes(q) && !d.articulo.toLowerCase().includes(q) && !(d.conducta || '').toLowerCase().includes(q))
        return false;
    }
    if (activeRama && d.rama_id !== activeRama) return false;
    return true;
  });

  const handleDelete = async (delito: Delito) => {
    if (!confirm(`¿Eliminar "${delito.nombre}"? Esta acción no se puede deshacer.`)) return;
    try {
      const res = await fetch(`/api/delitos/${delito.id}`, { method: 'DELETE' });
      if (res.ok) {
        setDelitos((prev) => prev.filter((d) => d.id !== delito.id));
      }
    } catch (e) {
      console.warn('Delete error', e);
    }
  };

  return (
    <div className="flex flex-col flex-1 bg-background">
      {/* Header */}
      <div className="flex items-center bg-primary px-3 py-2">
        <Link href="/" className="w-8 h-8 rounded-md bg-white/10 flex items-center justify-center mr-2 hover:bg-white/20 transition-colors">
          <ChevronLeft size={20} className="text-white" />
        </Link>
        <div className="flex-1">
          <h1 className="text-white font-bold text-base">Catálogo de Delitos</h1>
          <p className="text-[#C9D1DD] text-[10px]">{filtered.length} resultados</p>
        </div>
        <Link
          href="/delito-form"
          className="w-8 h-8 rounded-md bg-accent flex items-center justify-center hover:bg-accent-light transition-colors"
        >
          <Plus size={20} className="text-primary" />
        </Link>
      </div>

      {/* Search */}
      <div className="bg-primary pb-1.5">
        <div className="flex items-center bg-white mx-4 px-4 py-2 rounded-lg shadow-sm mb-2">
          <Search size={16} className="text-text-muted mr-2" />
          <input
            className="flex-1 text-sm text-text outline-none bg-transparent py-1"
            placeholder="Buscar por nombre, artículo o conducta..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch('')}>
              <X size={16} className="text-text-muted" />
            </button>
          )}
        </div>

        {/* Rama chips */}
        <div className="flex gap-2 px-4 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setActiveRama(null)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-colors ${
              !activeRama ? 'bg-accent border-accent text-primary' : 'bg-white/10 border-white/15 text-[#D5DDEA] hover:bg-white/20'
            }`}
          >
            Todas
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
              !activeRama ? 'bg-primary text-accent' : 'bg-white/15 text-[#D5DDEA]'
            }`}>{delitos.length}</span>
          </button>
          {ramas.map((r) => {
            const isActive = activeRama === r.id;
            return (
              <button
                key={r.id}
                onClick={() => setActiveRama(isActive ? null : r.id)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-colors ${
                  isActive ? 'bg-accent border-accent text-primary' : 'bg-white/10 border-white/15 text-[#D5DDEA] hover:bg-white/20'
                }`}
              >
                {getRamaPath(r.id) || r.id}
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  isActive ? 'bg-primary text-accent' : 'bg-white/15 text-[#D5DDEA]'
                }`}>{r.cantidad}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4 pb-20">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-text-muted">
            <BookOpen size={56} className="mb-2 opacity-50" />
            <p className="font-bold text-base text-text">Sin resultados</p>
            <p className="text-sm">Modifica la búsqueda o registra un nuevo delito.</p>
          </div>
        ) : (
          <div className="space-y-2 max-w-2xl mx-auto">
            {filtered.map((item) => (
              <div key={item.id} className="bg-surface rounded-lg border border-border-light shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <Link href={`/delito-form?id=${item.id}`} className="block p-3">
                  <div className="flex items-start mb-1.5">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm text-text mb-1 line-clamp-2">{item.nombre}</h3>
                      <div className="flex flex-wrap gap-1.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary">
                          {item.articulo}
                        </span>
                        {item.es_grave && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-danger/10 text-danger">
                            GRAVE
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {item.conducta && (
                    <p className="text-text-secondary text-xs leading-4 line-clamp-2 mb-1">{item.conducta}</p>
                  )}
                  <div className="flex items-center gap-1.5 mb-1">
                    <Gavel size={14} className="text-accent" />
                    <span className="text-xs font-bold text-primary">
                      {item.pena_texto || `${item.pena_minima_meses}-${item.pena_maxima_meses} meses`}
                    </span>
                  </div>
                  <p className="text-text-muted text-[11px] italic truncate">{getRamaPath(item.rama_id)}</p>
                </Link>

                <div className="flex border-t border-border-light">
                  <Link
                    href={`/delito-form?id=${item.id}`}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold text-primary hover:bg-gray-50 transition-colors"
                  >
                    <Edit3 size={14} />
                    Editar
                  </Link>
                  <div className="w-px bg-border-light" />
                  <button
                    onClick={() => handleDelete(item)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold text-danger hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={14} />
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <Link
        href="/delito-form"
        className="fixed bottom-4 right-4 w-12 h-12 rounded-full bg-primary shadow-lg flex items-center justify-center hover:bg-primary-light transition-colors z-10"
      >
        <Plus size={24} className="text-white" />
      </Link>
    </div>
  );
}
