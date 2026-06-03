'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDelitosLoader, useDelitosFilter } from './hooks';
import type { ResultadoCalculo } from '@/lib/calculo';
import Link from 'next/link';
import {
  ChevronLeft,
  Home,
  Search,
  Plus,
  X,
  Scale,
  Save,
  Printer,
  Search as SearchIcon,
} from 'lucide-react';
import {
  AGRAVANTES,
  ATENUANTES,
  EXIMENTES,
  GRADOS_AUTORIA,
  GRADOS_EJECUCION,
  TIPOS_CONCURSO,
} from '@/lib/catalogos';
import type { Delito, DelitoConfig, Step } from '../types';
import { ErrorBoundary } from '../error-boundary';
import { ArticleModal } from '../article-modal';
import { Button } from '@/components/ui/button';
import { IconButton } from '@/components/ui/icon-button';
import { Card, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Stepper, type StepperStep } from '@/components/ui/stepper';
import { Modal } from '@/components/ui/modal';
import { EmptyState, ErrorState } from '@/components/ui/empty-state';
import { CenteredSpinner } from '@/components/ui/spinner';
import { useToast } from '@/components/ui/toast';
import { useConfirm } from '@/components/ui/confirm';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes';
import { CircunstanciaPicker } from '@/components/domain/circunstancia-picker';
import { PenaltyResultPanel } from '@/components/domain/penalty-result-panel';
import { UserActions } from '@/components/layout/user-actions';
import { cn } from '@/lib/ui';

const STEPS: StepperStep[] = [
  { num: 1, label: 'Delito' },
  { num: 2, label: 'Variantes' },
  { num: 3, label: 'Participación' },
  { num: 4, label: 'Circunstancias' },
  { num: 5, label: 'Más delitos' },
  { num: 6, label: 'Concurso' },
  { num: 7, label: 'Resumen' },
  { num: 8, label: 'Resultado' },
];

export default function Calculadora() {
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();

  const loader = useDelitosLoader();
  const { delitos, loading, fetchError } = loader;
  const { search, setSearch, filtered } = useDelitosFilter(delitos);
  const [step, setStep] = useState<Step>(1);
  const [configs, setConfigs] = useState<DelitoConfig[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [tipoConcurso, setTipoConcurso] = useState<string>('ninguno');
  const [resultado, setResultado] = useState<ResultadoCalculo | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [articleRef, setArticleRef] = useState<string | null>(null);
  const [casosList, setCasosList] = useState<{ id: string; titulo: string }[]>([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [selectedCaso, setSelectedCaso] = useState('');
  const [saving, setSaving] = useState(false);
  const [pendientesConfirmados, setPendientesConfirmados] = useState<Record<string, boolean>>({});

  useUnsavedChanges(configs.length > 0 && !resultado);

  useEffect(() => {
    if (resultado) setStep(8);
  }, [resultado]);

  const current = configs[currentIdx];
  const hasWork = configs.length > 0 || Boolean(resultado);

  useKeyboardShortcuts([
    { key: 'Escape', handler: () => { setArticleRef(null); setShowSaveModal(false); } },
    { key: 'Enter', ctrl: true, enabled: step === 7, handler: () => calcular() },
    { key: 'ArrowLeft', enabled: step > 1 && step < 8, handler: () => goPrev() },
    { key: 'ArrowRight', enabled: step < 8 && step !== 7, handler: () => goNext() },
  ]);

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
      eximente_completa: null,
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

  const goNext = () => {
    if (step === 1) {
      const d = current?.delito;
      if (!d) return;
      if ((d.estado === 'pendiente_revision' || d.estado === 'rechazado')
          && !pendientesConfirmados[d.id]) {
        toast.danger(
          'Delito no verificado: confirma manualmente que el artículo coincide con la fuente oficial antes de continuar.',
        );
        return;
      }
      setStep(d && !d.tiene_pena_alternativa ? 3 : 2);
      return;
    }
    if (step === 5 && configs.length === 1) { setStep(7); return; }
    if (step === 7) return;
    if (step < 8) setStep((step + 1) as Step);
  };

  const goPrev = () => {
    if (step === 7 && configs.length === 1) { setStep(5); return; }
    if (step === 3 && current?.delito && !current.delito.tiene_pena_alternativa) {
      if (configs.length > 1) { setStep(5); return; }
      setStep(1); return;
    }
    if (step > 1) setStep((step - 1) as Step);
  };

  const addAnotherDelito = () => {
    setCurrentIdx(configs.length);
    setStep(1);
    setSearch('');
  };

  const removeDelito = async (idx: number) => {
    if (configs.length === 1) {
      const ok = await confirm({
        title: '¿Descartar cálculo?',
        description: 'Se eliminará el único delito configurado.',
        confirmLabel: 'Descartar',
        tone: 'danger',
      });
      if (!ok) return;
    }
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
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      const res = await fetch('/api/calcular', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Error al calcular');
      }
      const data = await res.json();
      setResultado(data);
    } catch (e) {
      console.error('[calcular] Error:', e);
      setError(e instanceof Error ? e.message : 'No se pudo calcular la pena');
    } finally {
      setCalculating(false);
    }
  };

  const reset = async () => {
    if (hasWork) {
      const ok = await confirm({
        title: '¿Iniciar nueva consulta?',
        description: 'Se descartarán los datos del cálculo actual.',
        confirmLabel: 'Nueva consulta',
        tone: 'warning',
      });
      if (!ok) return;
    }
    setConfigs([]);
    setCurrentIdx(0);
    setTipoConcurso('ninguno');
    setResultado(null);
    setStep(1);
    setSearch('');
    setError(null);
  };

  const exitCalculadora = async () => {
    if (hasWork) {
      const ok = await confirm({
        title: '¿Salir sin guardar?',
        description: 'Tienes un cálculo en curso que se perderá.',
        confirmLabel: 'Salir',
        tone: 'warning',
      });
      if (!ok) return;
    }
    router.push('/');
  };

  if (loading) return <CenteredSpinner label="Cargando catálogos jurídicos..." />;

  if (fetchError) {
    return (
      <div className="flex flex-1 items-center justify-center bg-background p-4">
        <ErrorState
          title="Error de conexión"
          description={fetchError}
          onRetry={() => { loader.refetch(); }}
        />
      </div>
    );
  }

  const pasoActual = STEPS.find(s => s.num === step)!;

  return (
    <div className="flex flex-col flex-1 bg-background">
      {/* Header dedicado de calculadora */}
      <header className="bg-primary px-3 py-2 no-print">
        <div className="flex items-center">
          <IconButton
            label="Paso anterior"
            variant="solid"
            onClick={goPrev}
            disabled={step === 1}
          >
            <ChevronLeft size={18} />
          </IconButton>
          <div className="flex-1 ml-2">
            <h1 className="text-text-inverse font-bold text-sm">Calculadora de Penas</h1>
            <p className="text-[11px] text-text-inverse/70">Paso {step} de 8 · {pasoActual.label}</p>
          </div>
          <UserActions />
          <IconButton
            label="Salir al inicio"
            variant="solid"
            onClick={exitCalculadora}
            className="ml-1"
          >
            <Home size={18} />
          </IconButton>
        </div>

        <div className="lg:hidden mt-2">
          <Stepper steps={STEPS} current={step} />
        </div>
      </header>

      {/* Desktop layout: sidebar stepper + content */}
      <div className="flex flex-1 overflow-hidden">
        <aside className="hidden lg:flex lg:flex-col desktop-sidebar bg-primary px-3 py-4 overflow-y-auto">
          <div className="flex items-center gap-2 mb-4">
            <Scale size={16} className="text-accent" />
            <span className="text-[11px] font-bold text-accent tracking-widest">PASO {step} DE 8</span>
          </div>
          <Stepper
            steps={STEPS}
            current={step}
            variant="vertical"
            onSelect={(n) => { if (n < step) setStep(n as Step); }}
          />
        </aside>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-3 max-w-lg mx-auto w-full lg:mx-0 lg:max-w-none lg:px-6 lg:py-4">
          {/* Step 1: Seleccionar delito */}
          {step === 1 && (
            <div>
              <BannerCalidadDatos />
              <div className="relative mb-3">
                <Input
                  iconLeft={<Search size={16} />}
                  placeholder="Buscar delito por nombre, artículo o conducta..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  iconRight={search ? (
                    <button type="button" onClick={() => setSearch('')} aria-label="Limpiar búsqueda">
                      <X size={16} />
                    </button>
                  ) : undefined}
                />
              </div>

              {configs.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-semibold text-text-secondary mb-1.5">Delitos configurados</p>
                  <div className="space-y-1.5">
                    {configs.map((c, i) => (
                      <div key={i} className="flex items-center gap-2 bg-accent/10 border border-accent/30 px-3 py-2 rounded-md">
                        <span className="text-xs font-bold text-primary flex-1 truncate">{c.delito.nombre}</span>
                        <Badge tone="accent">{c.delito.articulo}</Badge>
                        <button
                          type="button"
                          onClick={() => removeDelito(i)}
                          aria-label={`Quitar ${c.delito.nombre}`}
                          className="w-7 h-7 flex items-center justify-center rounded text-danger hover:bg-danger-bg"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {filtered.length === 0 ? (
                <EmptyState
                  icon={<SearchIcon size={40} />}
                  title="Sin resultados"
                  description="Modifica la búsqueda."
                />
              ) : (
                <div className="space-y-1.5">
                  {filtered.map(d => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => selectDelito(d)}
                      className="w-full text-left bg-surface border border-border-light rounded-md p-3 hover:shadow-md transition-shadow focus-visible:outline-none"
                    >
                      <div className="flex items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-text">{d.nombre}</p>
                          <p className="text-[11px] text-text-muted mt-0.5">{d.articulo} · {d.clasificacion}</p>
                        </div>
                        {d.estado === 'pendiente_revision' && (
                          <Badge tone="warning">Revisar</Badge>
                        )}
                        {d.estado === 'rechazado' && (
                          <Badge tone="danger">No verificado</Badge>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {current?.delito && (current.delito.estado === 'pendiente_revision' || current.delito.estado === 'rechazado') && (
                <div className="mt-3 border-2 border-warning rounded-md p-3 bg-warning-bg">
                  <p className="text-xs font-bold text-text mb-1">Art&iacute;culo no verificado contra la fuente oficial</p>
                  <p className="text-[11px] text-text-secondary mb-2">
                    {current.delito.estado_nota || 'El par (delito, art\u00edculo) no super\u00f3 la validaci\u00f3n autom\u00e1tica TF-IDF. Verifique manualmente contra el CP (Decreto 130-2017) antes de continuar.'}
                  </p>
                  {current.delito.estado_articulo_sugerido && (
                    <p className="text-[11px] text-text-secondary mb-2">
                      Sugerencia del validador: <strong>{current.delito.estado_articulo_sugerido}</strong>
                    </p>
                  )}
                  <label className="flex items-start gap-2 text-xs text-text cursor-pointer">
                    <input
                      type="checkbox"
                      className="mt-0.5"
                      checked={!!pendientesConfirmados[current.delito.id]}
                      onChange={e => setPendientesConfirmados(prev => ({ ...prev, [current.delito.id]: e.target.checked }))}
                    />
                    <span>Confirmo que verifiqu&eacute; el art&iacute;culo <strong>{current.delito.articulo}</strong> contra la fuente oficial y asumo la responsabilidad del uso.</span>
                  </label>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Variantes */}
          {step === 2 && (
            <div>
              <h2 className="font-bold text-base text-text mb-2">Tipo de pena</h2>
              <p className="text-xs text-text-secondary mb-3">
                Este delito admite pena alternativa. Seleccione el tipo de pena a calcular.
              </p>
              <div className="space-y-2">
                {[
                  { id: 'prision', label: 'Prisión', desc: 'Pena privativa de libertad' },
                  { id: 'multa', label: 'Multa', desc: 'Pena alternativa no privativa' },
                ].map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => { updateCurrent({ pena_seleccionada: opt.id as 'prision' | 'multa' }); setStep(3); }}
                    className={cn(
                      'w-full text-left p-3 rounded-md border-2 transition-all focus-visible:outline-none',
                      current?.pena_seleccionada === opt.id
                        ? 'border-accent bg-accent/10'
                        : 'border-border bg-surface hover:border-accent/50',
                    )}
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
              <Card padding="md" className="mb-3">
                <CardHeader title="Grado de autoría" />
                <div className="space-y-1.5">
                  {GRADOS_AUTORIA.map(g => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => updateCurrent({ grado_autoria: g.id })}
                      className={cn(
                        'w-full text-left p-2.5 rounded-md border transition-all focus-visible:outline-none',
                        current?.grado_autoria === g.id ? 'border-accent bg-accent/10' : 'border-border bg-surface hover:border-accent/50',
                      )}
                    >
                      <p className="font-semibold text-sm text-text">{g.nombre}</p>
                      <p className="text-[11px] text-text-muted">{g.descripcion} ({g.articulo})</p>
                    </button>
                  ))}
                </div>
              </Card>

              <Card padding="md" className="mb-3">
                <CardHeader title="Grado de ejecución" />
                <div className="space-y-1.5">
                  {GRADOS_EJECUCION.map(g => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => updateCurrent({ grado_ejecucion: g.id })}
                      className={cn(
                        'w-full text-left p-2.5 rounded-md border transition-all focus-visible:outline-none',
                        current?.grado_ejecucion === g.id ? 'border-accent bg-accent/10' : 'border-border bg-surface hover:border-accent/50',
                      )}
                    >
                      <p className="font-semibold text-sm text-text">{g.nombre}</p>
                      <p className="text-[11px] text-text-muted">{g.descripcion} ({g.articulo})</p>
                    </button>
                  ))}
                </div>
              </Card>

              {(current?.grado_ejecucion === 'tentativa_acabada' || current?.grado_ejecucion === 'tentativa_inacabada') && (
                <Card padding="md">
                  <CardHeader title="Reducción por tentativa" />
                  <div className="flex gap-2">
                    {[1, 2].map(n => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => updateCurrent({ reduccion_tentativa: n })}
                        className={cn(
                          'flex-1 h-10 rounded-md border font-semibold text-sm transition-all focus-visible:outline-none',
                          current?.reduccion_tentativa === n
                            ? 'border-accent bg-accent/10 text-accent-dark'
                            : 'border-border bg-surface text-text hover:border-accent/50',
                        )}
                      >
                        {n} grado{n > 1 ? 's' : ''}
                      </button>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* Step 4: Circunstancias */}
          {step === 4 && current && (
            <CircunstanciaPicker
              current={current}
              onChange={updateCurrent}
              onOpenArticle={setArticleRef}
            />
          )}

          {/* Step 5: Más delitos */}
          {step === 5 && (
            <div>
              <h2 className="font-bold text-base text-text mb-2">Delitos configurados</h2>
              <div className="space-y-2 mb-4">
                {configs.map((c, i) => (
                  <Card key={i} padding="sm">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-text truncate">{c.delito.nombre}</p>
                        <p className="text-[11px] text-text-muted">{c.delito.articulo}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeDelito(i)}
                        aria-label={`Quitar ${c.delito.nombre}`}
                        className="w-9 h-9 flex items-center justify-center rounded text-danger hover:bg-danger-bg"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </Card>
                ))}
              </div>

              <Button variant="secondary" fullWidth size="lg" onClick={addAnotherDelito} iconLeft={<Plus size={16} />}>
                Añadir otro delito
              </Button>

              {configs.length > 0 && (
                <Button
                  variant="primary"
                  fullWidth
                  size="lg"
                  className="mt-3"
                  onClick={() => setStep(configs.length > 1 ? 6 : 7)}
                >
                  {configs.length > 1 ? 'Configurar concurso' : 'Ver resumen'}
                </Button>
              )}
            </div>
          )}

          {/* Step 6: Concurso */}
          {step === 6 && (
            <div>
              <h2 className="font-bold text-base text-text mb-2">Tipo de concurso</h2>
              <p className="text-xs text-text-secondary mb-3">
                Al existir múltiples delitos, seleccione el tipo de concurso aplicable.
              </p>
              <div className="space-y-2">
                {TIPOS_CONCURSO.map(tc => (
                  <button
                    key={tc.id}
                    type="button"
                    onClick={() => setTipoConcurso(tc.id)}
                    className={cn(
                      'w-full text-left p-3 rounded-md border-2 transition-all focus-visible:outline-none',
                      tipoConcurso === tc.id ? 'border-accent bg-accent/10' : 'border-border bg-surface hover:border-accent/50',
                    )}
                  >
                    <p className="font-semibold text-sm text-text">{tc.nombre}</p>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setArticleRef(tc.articulo || null); }}
                      className="text-[11px] text-accent-dark underline hover:text-accent font-semibold text-left"
                    >
                      {tc.articulo}
                    </button>
                    <p className="text-[11px] text-text-muted mt-1">{tc.descripcion}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 7: Resumen */}
          {step === 7 && (
            <div>
              <h2 className="font-bold text-base text-text mb-3">Resumen del cálculo</h2>
              {configs.map((c, i) => (
                <Card key={i} padding="md" className="mb-2">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[11px] font-bold text-primary">#{i + 1}</span>
                    <p className="font-bold text-sm text-text flex-1">{c.delito.nombre}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-xs text-text-muted tabular-nums">
                    <span>Artículo: {c.delito.articulo}</span>
                    <span>Pena: {c.pena_seleccionada === 'prision' ? 'Prisión' : 'Multa'}</span>
                    <span>Autoría: {GRADOS_AUTORIA.find(g => g.id === c.grado_autoria)?.nombre}</span>
                    <span>Ejecución: {GRADOS_EJECUCION.find(g => g.id === c.grado_ejecucion)?.nombre}</span>
                  </div>
                  {(c.agravantes.length > 0 || c.atenuantes.length > 0 || c.eximentes.length > 0 || c.eximente_completa) && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {c.eximente_completa && (
                        <Badge tone="exemption">
                          Eximente: {EXIMENTES.find(e => e.id === c.eximente_completa)?.nombre}
                        </Badge>
                      )}
                      {c.eximentes.map(eid => (
                        <Badge key={eid} tone="exemption">
                          Eximente incompleta: {EXIMENTES.find(e => e.id === eid)?.nombre}
                        </Badge>
                      ))}
                      {c.agravantes.map(aid => (
                        <Badge key={aid} tone="aggravation">
                          {AGRAVANTES.find(a => a.id === aid)?.nombre}
                        </Badge>
                      ))}
                      {c.atenuantes.map(aid => (
                        <Badge key={aid} tone="mitigation">
                          {ATENUANTES.find(a => a.id === aid)?.nombre}
                        </Badge>
                      ))}
                    </div>
                  )}
                </Card>
              ))}

              {tipoConcurso !== 'ninguno' && (
                <div className="bg-accent/10 border border-accent/30 rounded-md p-3 mb-3">
                  <p className="text-xs font-bold text-primary">
                    Concurso: {TIPOS_CONCURSO.find(tc => tc.id === tipoConcurso)?.nombre}
                  </p>
                </div>
              )}

              {error && (
                <Card padding="md" tone="danger" className="mb-3 text-center">
                  <p className="text-sm font-bold text-danger mb-1">Error al calcular</p>
                  <p className="text-xs text-text-secondary mb-3">{error}</p>
                  <Button variant="danger" size="sm" onClick={calcular}>Reintentar</Button>
                </Card>
              )}

              <Button
                variant="primary"
                fullWidth
                size="lg"
                loading={calculating}
                onClick={calcular}
              >
                {calculating ? 'Calculando...' : 'Calcular pena'}
              </Button>
            </div>
          )}

          {/* Step 8: Resultado (informe pericial) */}
          {step === 8 && resultado?.pena_principal && (
            <ErrorBoundary fallback={
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="font-bold text-danger text-sm mb-2">Error al mostrar resultados</p>
                <p className="text-xs text-text-muted mb-4">Ocurrió un error al renderizar el cálculo. Intente nuevamente.</p>
                <Button variant="primary" onClick={reset}>Nueva consulta</Button>
              </div>
            }>
              <div className="print-area">
                <PenaltyResultPanel
                  resultado={resultado}
                  onOpenArticle={setArticleRef}
                />
              </div>

              {/* Acciones */}
              <div className="grid grid-cols-2 gap-2 mt-4 no-print">
                <Button variant="secondary" iconLeft={<Printer size={16} />} onClick={() => window.print()}>
                  Exportar PDF
                </Button>
                <Button
                  variant="primary"
                  iconLeft={<Save size={16} />}
                  onClick={async () => {
                    try {
                      const r = await fetch('/api/casos');
                      const data = await r.json();
                      setCasosList(Array.isArray(data) ? data.map((c: { id: string; titulo: string }) => ({ id: c.id, titulo: c.titulo })) : []);
                    } catch {
                      toast.danger('No se pudieron cargar los casos');
                      return;
                    }
                    setShowSaveModal(true);
                  }}
                >
                  Guardar caso
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-2 no-print">
                <Button variant="secondary" onClick={reset}>Nueva consulta</Button>
                <Link href="/" className="contents">
                  <Button variant="primary">Inicio</Button>
                </Link>
              </div>
            </ErrorBoundary>
          )}
        </div>
      </div>

      {/* Footer nav (except step 8) */}
      {step < 8 && (
        <div className="sticky bottom-0 bg-surface border-t border-border-light px-3 py-2 flex gap-3 no-print">
          <Button variant="secondary" fullWidth onClick={goPrev} disabled={step === 1}>
            Atrás
          </Button>
          {step === 7 ? (
            <Button
              variant="primary"
              fullWidth
              loading={calculating}
              onClick={calcular}
            >
              {calculating ? 'Calculando...' : 'Calcular pena'}
            </Button>
          ) : (
            <Button
              variant="primary"
              fullWidth
              onClick={goNext}
              disabled={step === 1 && !current}
              iconRight={<ChevronLeft size={16} className="rotate-180" />}
            >
              Continuar
            </Button>
          )}
          <div className="hidden sm:flex items-center text-[11px] text-text-muted gap-2">
            <span>← →</span>
            <span>Esc</span>
            {step === 7 && <span>⌘↵</span>}
          </div>
        </div>
      )}

      <ArticleModal articuloRef={articleRef} onClose={() => setArticleRef(null)} />

      <Modal
        open={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        title="Guardar en caso"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowSaveModal(false)}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              loading={saving}
              onClick={async () => {
                setSaving(true);
                try {
                  let casoId = selectedCaso;
                  if (!casoId) {
                    const res = await fetch('/api/casos', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ titulo: `Cálculo ${new Date().toLocaleDateString('es-ES')}` }),
                    });
                    const data = await res.json();
                    casoId = data.id;
                  }
                  const config = configs.map(c => ({
                    delito_id: c.delito.id,
                    pena_seleccionada: c.pena_seleccionada,
                    grado_autoria: c.grado_autoria,
                    grado_ejecucion: c.grado_ejecucion,
                    reduccion_tentativa: c.reduccion_tentativa,
                    agravantes: c.agravantes,
                    atenuantes: c.atenuantes,
                    eximentes: c.eximentes,
                    eximente_completa: c.eximente_completa,
                  }));
                  await fetch('/api/calculos', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ caso_id: casoId, config, resultado }),
                  });
                  toast.success('Guardado correctamente');
                  setShowSaveModal(false);
                  setSelectedCaso('');
                } catch {
                  toast.danger('Error al guardar');
                } finally {
                  setSaving(false);
                }
              }}
            >
              {selectedCaso ? 'Guardar en caso seleccionado' : 'Crear nuevo caso y guardar'}
            </Button>
          </>
        }
      >
        {casosList.length > 0 ? (
          <div className="space-y-1">
            <p className="text-xs font-semibold text-text-secondary mb-2">Selecciona un caso existente</p>
            {casosList.map(c => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedCaso(c.id)}
                className={cn(
                  'w-full text-left p-2.5 rounded-md text-sm transition-all focus-visible:outline-none',
                  selectedCaso === c.id
                    ? 'bg-accent/10 border border-accent'
                    : 'bg-surface-alt border border-border hover:border-accent/50',
                )}
              >
                {c.titulo}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setSelectedCaso('')}
              className="w-full text-left p-2.5 rounded-md text-sm text-text-muted hover:bg-surface-alt border border-dashed border-border"
            >
              + Crear caso nuevo con la fecha actual
            </button>
          </div>
        ) : (
          <p className="text-sm text-text-secondary">
            Se creará un nuevo caso con la fecha actual y se guardará este cálculo en él.
          </p>
        )}
      </Modal>
    </div>
  );
}

function BannerCalidadDatos() {
  const [summary, setSummary] = useState<{ verificados: number; pendientes: number; rechazados: number; total: number } | null>(null);
  useEffect(() => {
    fetch('/api/delitos/calidad')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setSummary(d); })
      .catch(() => { /* silencioso: el banner es informativo */ });
  }, []);
  if (!summary || summary.total === 0) return null;
  const { verificados, pendientes, rechazados, total } = summary;
  const pct = (n: number) => Math.round((n / total) * 100);
  return (
    <div className="mb-3 border border-warning/40 bg-warning-bg rounded-md p-3 text-[11px] text-text-secondary">
      <p className="font-bold text-text mb-1">Calidad del cat&aacute;logo de delitos</p>
      <p>
        <span className="text-success font-semibold">{verificados} verificados ({pct(verificados)}%)</span>
        {' · '}
        <span className="text-warning font-semibold">{pendientes} a revisar ({pct(pendientes)}%)</span>
        {' · '}
        <span className="text-danger font-semibold">{rechazados} rechazados ({pct(rechazados)}%)</span>
        {' de '}
        <strong>{total}</strong> totales.
      </p>
      <p className="mt-1">
        Fuente: <code>data/delitos-validacion.csv</code> (TF-IDF vs. CP Decreto 130-2017).
        Los delitos no verificados requerir&aacute;n confirmaci&oacute;n manual.
      </p>
    </div>
  );
}
