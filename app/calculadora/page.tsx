'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Home, Search, Gavel, Plus, X, ClipboardList, Scale, Check, Minus } from 'lucide-react';
import { AGRAVANTES, ATENUANTES, EXIMENTES, GRADOS_AUTORIA, GRADOS_EJECUCION, TIPOS_CONCURSO } from '@/lib/catalogos';
import type { Delito, DelitoConfig, CatalogoItem, Step } from '../types';

const STEPS = [
  { num: 1, label: 'Delito', icon: '🔍' },
  { num: 2, label: 'Variantes', icon: '⚙️' },
  { num: 3, label: 'Participación', icon: '👥' },
  { num: 4, label: 'Circunstancias', icon: '⚖️' },
  { num: 5, label: 'Más delitos', icon: '➕' },
  { num: 6, label: 'Concurso', icon: '🔗' },
  { num: 7, label: 'Resumen', icon: '📋' },
  { num: 8, label: 'Resultado', icon: '🔨' },
];

export default function Calculadora() {
  const router = useRouter();

  const [delitos, setDelitos] = useState<Delito[]>([]);
  const [step, setStep] = useState<Step>(1);
  const [configs, setConfigs] = useState<DelitoConfig[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [tipoConcurso, setTipoConcurso] = useState<string>('ninguno');
  const [resultado, setResultado] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch('/api/delitos?limit=1000')
      .then(r => r.json())
      .then(d => setDelitos(Array.isArray(d) ? d : []))
      .catch(e => console.warn(e))
      .finally(() => setLoading(false));
  }, []);

  const current = configs[currentIdx];

  const selectDelito = (d: Delito) => {
    const cfg: DelitoConfig = {
      delito: d,
      pena_seleccionada: 'prision',
      variables_activas: [],
      grado_autoria: 'autor_directo',
      grado_ejecucion: 'consumado',
      reduccion_tentativa: 1,
      agravantes: [],
      atenuantes: [],
      eximentes: [],
      eximente_completa: false,
    };
    const next = [...configs];
    next[currentIdx] = cfg;
    setConfigs(next);
    setStep(d.tiene_pena_alternativa ? 2 : 3);
  };

  const updateCurrent = (patch: Partial<DelitoConfig>) => {
    const next = [...configs];
    next[currentIdx] = { ...next[currentIdx], ...patch };
    setConfigs(next);
  };

  const toggle = (arr: string[], v: string) =>
    arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v];

  const goNext = () => {
    if (step === 1) {
      const d = current?.delito;
      setStep(d && !d.tiene_pena_alternativa ? 3 : 2);
      return;
    }
    if (step === 5 && configs.length === 1) { setStep(7); return; }
    if (step < 8) setStep((step + 1) as Step);
  };

  const goPrev = () => {
    if (step === 7 && configs.length === 1) { setStep(5); return; }
    if (step === 3 && current?.delito && !current.delito.tiene_pena_alternativa) { setStep(1); return; }
    if (step > 1) setStep((step - 1) as Step);
  };

  const addAnotherDelito = () => {
    setCurrentIdx(configs.length);
    setStep(1);
    setSearch('');
  };

  const removeDelito = (idx: number) => {
    const next = configs.filter((_, i) => i !== idx);
    setConfigs(next);
    if (currentIdx >= next.length) setCurrentIdx(Math.max(0, next.length - 1));
  };

  const calcular = async () => {
    setCalculating(true);
    setError(null);
    try {
      const body = {
        delitos: configs.map(c => ({
          delito_id: c.delito.id,
          pena_seleccionada: c.pena_seleccionada,
          variables_activas: c.variables_activas,
          grado_autoria: c.grado_autoria,
          grado_ejecucion: c.grado_ejecucion,
          reduccion_tentativa: c.reduccion_tentativa,
          agravantes: c.agravantes,
          atenuantes: c.atenuantes,
          eximentes: c.eximentes,
          eximente_completa: c.eximente_completa,
        })),
        tipo_concurso: configs.length > 1 ? tipoConcurso : 'ninguno',
      };
      const res = await fetch('/api/calcular', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al calcular');
      }
      const data = await res.json();
      setResultado(data);
      setStep(8);
    } catch (e: any) {
      setError(e.message || 'No se pudo calcular la pena');
    } finally {
      setCalculating(false);
    }
  };

  const reset = () => {
    setConfigs([]);
    setCurrentIdx(0);
    setTipoConcurso('ninguno');
    setResultado(null);
    setStep(1);
    setSearch('');
    setError(null);
  };

  const filtered = delitos.filter(d => {
    if (!search) return true;
    const q = search.toLowerCase();
    return d.nombre.toLowerCase().includes(q) || d.articulo.toLowerCase().includes(q) || (d.conducta || '').toLowerCase().includes(q);
  });

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-text-secondary text-sm">Cargando catálogos jurídicos...</p>
        </div>
      </div>
    );
  }

  const pasoActual = STEPS.find(s => s.num === step)!;

  return (
    <div className="flex flex-col flex-1 bg-background">
      {/* Header */}
      <div className="bg-primary px-3 py-2">
        <div className="flex items-center">
          <button onClick={goPrev} className="w-8 h-8 rounded-md bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
            <ChevronLeft size={20} className="text-white" />
          </button>
          <div className="flex-1 ml-2">
            <h1 className="text-white font-bold text-sm">Calculadora de Penas</h1>
            <p className="text-[#C9D1DD] text-[10px]">Paso {step} de 8 · {pasoActual.label}</p>
          </div>
          <Link href="/" className="w-8 h-8 rounded-md bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
            <Home size={18} className="text-white" />
          </Link>
        </div>

        {/* Stepper */}
        <div className="flex gap-1 mt-2 overflow-x-auto pb-0.5 scrollbar-none">
          {STEPS.map(s => {
            const active = s.num === step;
            const done = s.num < step;
            return (
              <div key={s.num} className="flex items-center min-w-[36px]">
                <div className={`w-5.5 h-5.5 rounded-full flex items-center justify-center text-[9px] font-bold transition-colors ${
                  active ? 'bg-accent text-primary' : done ? 'bg-accent/60 text-primary' : 'bg-white/15 text-[#D5DDEA]'
                }`}>
                  {done ? <Check size={10} /> : s.num}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-3 max-w-lg mx-auto w-full">
        {/* Step 1: Seleccionar delito */}
        {step === 1 && (
          <div>
            <div className="flex items-center gap-2 bg-white border border-border rounded-lg px-3 py-2 mb-3 shadow-sm">
              <Search size={16} className="text-text-muted" />
              <input
                className="flex-1 text-sm text-text outline-none bg-transparent py-1"
                placeholder="Buscar delito..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                autoFocus
              />
              {search && (
                <button onClick={() => setSearch('')}>
                  <X size={16} className="text-text-muted" />
                </button>
              )}
            </div>

            {configs.length > 0 && (
              <div className="mb-2">
                <p className="text-xs text-text-muted mb-1">Delitos seleccionados:</p>
                {configs.map((c, i) => (
                  <div key={i} className="flex items-center gap-2 bg-accent/10 px-2.5 py-1.5 rounded-md mb-1">
                    <span className="text-xs font-semibold text-primary flex-1 truncate">{c.delito.nombre}</span>
                    <button onClick={() => removeDelito(i)}><X size={14} className="text-danger" /></button>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-1.5">
              {filtered.length === 0 ? (
                <p className="text-center text-text-muted text-sm py-8">Sin resultados</p>
              ) : (
                filtered.map(d => (
                  <button
                    key={d.id}
                    onClick={() => selectDelito(d)}
                    className="w-full text-left bg-surface border border-border-light rounded-lg p-2.5 hover:shadow-md transition-shadow"
                  >
                    <p className="font-semibold text-sm text-text">{d.nombre}</p>
                    <p className="text-[11px] text-text-muted mt-0.5">{d.articulo} · {d.clasificacion}</p>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* Step 2: Variantes */}
        {step === 2 && (
          <div>
            <h2 className="font-bold text-sm text-text mb-2">Tipo de pena</h2>
            <p className="text-xs text-text-muted mb-3">
              Este delito admite pena alternativa. ¿Qué tipo de pena desea calcular?
            </p>
            <div className="space-y-2">
              {[
                { id: 'prision', label: 'Prisión', desc: 'Pena privativa de libertad' },
                { id: 'multa', label: 'Multa', desc: 'Pena alternativa no privativa' },
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => { updateCurrent({ pena_seleccionada: opt.id as 'prision' | 'multa' }); setStep(3); }}
                  className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                    current?.pena_seleccionada === opt.id
                      ? 'border-accent bg-accent/5'
                      : 'border-border bg-surface hover:border-accent/50'
                  }`}
                >
                  <p className="font-semibold text-sm text-text">{opt.label}</p>
                  <p className="text-xs text-text-muted">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Participación */}
        {step === 3 && (
          <div>
            <div className="mb-4">
              <h2 className="font-bold text-sm text-text mb-2">Grado de autoría</h2>
              <div className="space-y-1.5">
                {GRADOS_AUTORIA.map(g => (
                  <button
                    key={g.id}
                    onClick={() => updateCurrent({ grado_autoria: g.id })}
                    className={`w-full text-left p-2.5 rounded-lg border transition-all ${
                      current?.grado_autoria === g.id ? 'border-accent bg-accent/5' : 'border-border bg-surface hover:border-accent/50'
                    }`}
                  >
                    <p className="font-semibold text-sm text-text">{g.nombre}</p>
                    <p className="text-[11px] text-text-muted">{g.descripcion} ({g.articulo})</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <h2 className="font-bold text-sm text-text mb-2">Grado de ejecución</h2>
              <div className="space-y-1.5">
                {GRADOS_EJECUCION.map(g => (
                  <button
                    key={g.id}
                    onClick={() => updateCurrent({ grado_ejecucion: g.id })}
                    className={`w-full text-left p-2.5 rounded-lg border transition-all ${
                      current?.grado_ejecucion === g.id ? 'border-accent bg-accent/5' : 'border-border bg-surface hover:border-accent/50'
                    }`}
                  >
                    <p className="font-semibold text-sm text-text">{g.nombre}</p>
                    <p className="text-[11px] text-text-muted">{g.descripcion} ({g.articulo})</p>
                  </button>
                ))}
              </div>
            </div>

            {(current?.grado_ejecucion === 'tentativa_acabada' || current?.grado_ejecucion === 'tentativa_inacabada') && (
              <div>
                <h2 className="font-bold text-sm text-text mb-2">Reducción por tentativa</h2>
                <div className="flex gap-2">
                  {[1, 2].map(n => (
                    <button
                      key={n}
                      onClick={() => updateCurrent({ reduccion_tentativa: n })}
                      className={`flex-1 p-2.5 rounded-lg border font-semibold text-sm transition-all ${
                        current?.reduccion_tentativa === n ? 'border-accent bg-accent/5 text-accent' : 'border-border bg-surface text-text hover:border-accent/50'
                      }`}
                    >
                      {n} grado{n > 1 ? 's' : ''}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 4: Circunstancias */}
        {step === 4 && (
          <div>
            <div className="mb-4">
              <h2 className="font-bold text-sm text-text mb-2">Eximentes</h2>
              <div className="space-y-1.5">
                {EXIMENTES.map(e => (
                  <button
                    key={e.id}
                    onClick={() => {
                      if (e.completa) {
                        updateCurrent({ eximente_completa: !current?.eximente_completa, eximentes: [] });
                      } else {
                        updateCurrent({ eximentes: toggle(current?.eximentes || [], e.id), eximente_completa: false });
                      }
                    }}
                    className={`w-full text-left p-2.5 rounded-lg border transition-all ${
                      current?.eximente_completa && e.completa ? 'border-accent bg-accent/5' :
                      current?.eximentes.includes(e.id) ? 'border-accent bg-accent/5' : 'border-border bg-surface hover:border-accent/50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm text-text flex-1">{e.nombre}</p>
                      {e.completa && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold">COMPLETA</span>
                      )}
                    </div>
                    <p className="text-[11px] text-text-muted">{e.articulo}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <h2 className="font-bold text-sm text-text mb-2">Agravantes (Art. 27 CP)</h2>
              <div className="flex flex-wrap gap-1.5">
                {AGRAVANTES.map(a => (
                  <button
                    key={a.id}
                    onClick={() => updateCurrent({ agravantes: toggle(current?.agravantes || [], a.id) })}
                    className={`px-2.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                      current?.agravantes.includes(a.id)
                        ? 'bg-danger/10 border-danger/30 text-danger'
                        : 'bg-surface border-border text-text-secondary hover:border-danger/30'
                    }`}
                  >
                    {a.nombre}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <h2 className="font-bold text-sm text-text mb-2">Atenuantes (Art. 26 CP)</h2>
              <div className="flex flex-wrap gap-1.5">
                {ATENUANTES.map(a => (
                  <button
                    key={a.id}
                    onClick={() => updateCurrent({ atenuantes: toggle(current?.atenuantes || [], a.id) })}
                    className={`px-2.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                      current?.atenuantes.includes(a.id)
                        ? 'bg-success/10 border-success/30 text-success'
                        : 'bg-surface border-border text-text-secondary hover:border-success/30'
                    }`}
                  >
                    {a.nombre}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Más delitos */}
        {step === 5 && (
          <div>
            <h2 className="font-bold text-sm text-text mb-2">Delitos seleccionados</h2>
            <div className="space-y-1.5 mb-4">
              {configs.map((c, i) => (
                <div key={i} className="flex items-center gap-2 bg-surface border border-border-light rounded-lg p-2.5">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-text truncate">{c.delito.nombre}</p>
                    <p className="text-[11px] text-text-muted">{c.delito.articulo}</p>
                  </div>
                  <button onClick={() => removeDelito(i)} className="p-1 hover:bg-danger/10 rounded transition-colors">
                    <X size={14} className="text-danger" />
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={addAnotherDelito}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-lg border-2 border-dashed border-border text-text-secondary font-semibold text-sm hover:border-accent hover:text-accent transition-all"
            >
              <Plus size={16} />
              Añadir otro delito
            </button>

            {configs.length > 0 && (
              <button
                onClick={() => setStep(configs.length > 1 ? 6 : 7)}
                className="w-full mt-3 py-3 rounded-lg bg-primary text-white font-bold text-sm hover:bg-primary-light transition-colors"
              >
                {configs.length > 1 ? 'Configurar concurso' : 'Ver resumen'}
              </button>
            )}
          </div>
        )}

        {/* Step 6: Concurso */}
        {step === 6 && (
          <div>
            <h2 className="font-bold text-sm text-text mb-2">Tipo de concurso</h2>
            <p className="text-xs text-text-muted mb-3">
              Al existir múltiples delitos, seleccione el tipo de concurso aplicable.
            </p>
            <div className="space-y-2">
              {TIPOS_CONCURSO.map(tc => (
                <button
                  key={tc.id}
                  onClick={() => setTipoConcurso(tc.id)}
                  className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                    tipoConcurso === tc.id ? 'border-accent bg-accent/5' : 'border-border bg-surface hover:border-accent/50'
                  }`}
                >
                  <p className="font-semibold text-sm text-text">{tc.nombre}</p>
                  <p className="text-[11px] text-text-muted">{tc.articulo}</p>
                  <p className="text-[11px] text-text-muted mt-0.5">{tc.descripcion}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 7: Resumen */}
        {step === 7 && (
          <div>
            <h2 className="font-bold text-sm text-text mb-3">Resumen del cálculo</h2>
            {configs.map((c, i) => (
              <div key={i} className="bg-surface border border-border-light rounded-lg p-3 mb-2 shadow-sm">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">#{i + 1}</span>
                  <p className="font-bold text-sm text-text flex-1">{c.delito.nombre}</p>
                </div>
                <div className="grid grid-cols-2 gap-1 text-xs text-text-muted">
                  <span>Artículo: {c.delito.articulo}</span>
                  <span>Pena: {c.pena_seleccionada === 'prision' ? 'Prisión' : 'Multa'}</span>
                  <span>Autoría: {GRADOS_AUTORIA.find(g => g.id === c.grado_autoria)?.nombre}</span>
                  <span>Ejecución: {GRADOS_EJECUCION.find(g => g.id === c.grado_ejecucion)?.nombre}</span>
                </div>
                {(c.agravantes.length > 0 || c.atenuantes.length > 0) && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {c.agravantes.map(aid => (
                      <span key={aid} className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-danger/10 text-danger">
                        {AGRAVANTES.find(a => a.id === aid)?.nombre}
                      </span>
                    ))}
                    {c.atenuantes.map(aid => (
                      <span key={aid} className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-success/10 text-success">
                        {ATENUANTES.find(a => a.id === aid)?.nombre}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {tipoConcurso !== 'ninguno' && (
              <div className="bg-accent/10 border border-accent/20 rounded-lg p-2.5 mb-3">
                <p className="text-xs font-bold text-primary">
                  Concurso: {TIPOS_CONCURSO.find(tc => tc.id === tipoConcurso)?.nombre}
                </p>
              </div>
            )}

            {error && (
              <div className="bg-danger/10 border border-danger/30 rounded-lg p-2.5 mb-3">
                <p className="text-xs font-semibold text-danger">{error}</p>
              </div>
            )}

            <button
              onClick={calcular}
              disabled={calculating}
              className="w-full py-3 rounded-lg bg-primary text-white font-bold text-sm hover:bg-primary-light transition-colors disabled:opacity-70"
            >
              {calculating ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Calculando...
                </span>
              ) : (
                'Calcular pena'
              )}
            </button>
          </div>
        )}

        {/* Step 8: Resultado */}
        {step === 8 && resultado && (
          <div>
            <div className="bg-surface border border-accent/30 rounded-lg p-4 mb-3 text-center shadow-md">
              <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Pena Principal</p>
              <p className="text-xl font-extrabold text-primary">{resultado.pena_principal}</p>
            </div>

            {resultado.penas_accesorias?.length > 0 && (
              <div className="bg-surface border border-border-light rounded-lg p-3 mb-2">
                <p className="font-bold text-xs text-text mb-1">Penas accesorias</p>
                <ul className="list-disc list-inside text-xs text-text-muted">
                  {resultado.penas_accesorias.map((p: string, i: number) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              </div>
            )}

            {resultado.delitos_analizados?.map((d: any, i: number) => (
              <div key={i} className="bg-surface border border-border-light rounded-lg p-3 mb-2 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <Gavel size={14} className="text-accent" />
                  <p className="font-bold text-sm text-text">{d.nombre}</p>
                </div>
                <div className="grid grid-cols-2 gap-1 text-xs text-text-muted mb-1">
                  <span>Artículo: {d.articulo}</span>
                  <span>Gravedad: {d.gravedad}</span>
                  <span>Pena base: {d.pena_base_texto}</span>
                  <span>Pena individual: {d.pena_individual_texto}</span>
                </div>
                {d.agravantes_aplicadas?.length > 0 && (
                  <p className="text-[11px] text-text-muted mb-0.5">
                    <span className="font-semibold text-danger">Agravantes:</span> {d.agravantes_aplicadas.join(', ')}
                  </p>
                )}
                {d.atenuantes_aplicadas?.length > 0 && (
                  <p className="text-[11px] text-text-muted mb-0.5">
                    <span className="font-semibold text-success">Atenuantes:</span> {d.atenuantes_aplicadas.join(', ')}
                  </p>
                )}
              </div>
            ))}

            <details className="bg-surface border border-border-light rounded-lg p-3 mb-3 shadow-sm">
              <summary className="font-bold text-xs text-text cursor-pointer">Análisis jurídico completo</summary>
              <pre className="mt-2 text-[11px] text-text-muted whitespace-pre-wrap font-sans leading-4">
                {resultado.analisis_juridico}
              </pre>
            </details>

            <div className="bg-warning/10 border border-warning/30 rounded-lg p-2.5 mb-3">
              <p className="text-[11px] text-text-muted italic">{resultado.disclaimer}</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={reset}
                className="flex-1 py-2.5 rounded-lg border border-border text-text-secondary font-semibold text-sm hover:bg-gray-50 transition-colors"
              >
                Nueva consulta
              </button>
              <Link
                href="/"
                className="flex-1 py-2.5 rounded-lg bg-primary text-white font-bold text-sm text-center hover:bg-primary-light transition-colors"
              >
                Inicio
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Footer nav (except step 8) */}
      {step < 8 && (
        <div className="sticky bottom-0 bg-surface border-t border-border-light px-3 py-2 flex gap-3">
          <button
            onClick={goPrev}
            className="flex-1 py-2.5 rounded-md border border-border text-text-secondary font-semibold text-sm hover:bg-gray-50 transition-colors"
          >
            Atrás
          </button>
          <button
            onClick={goNext}
            disabled={step === 1 && !current}
            className="flex-1 flex items-center justify-center gap-1 py-2.5 rounded-md bg-primary text-white font-bold text-sm hover:bg-primary-light transition-colors disabled:opacity-50"
          >
            Continuar
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
