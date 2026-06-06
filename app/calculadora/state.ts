'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDelitosLoader, useDelitosFilter } from './hooks';
import { useToast } from '@/components/ui/toast';
import { useConfirm } from '@/components/ui/confirm';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes';
import type { Delito, DelitoConfig, Step } from '../types';
import type { ResultadoCalculo } from '@/lib/calculo';

export interface Escenario {
  id: string;
  nombre: string;
  configs: DelitoConfig[];
  tipoConcurso: string;
  resultado: ResultadoCalculo | null;
}

let escenarioCounter = 0;
function nextEscenarioId() { return `esc-${++escenarioCounter}-${Date.now()}`; }

export function useCalculadoraState() {
  const router = useRouter();
  const searchParams = useSearchParams();
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
  const [loadingCalculoId, setLoadingCalculoId] = useState<string | null>(null);
  const [modificandoCaso, setModificandoCaso] = useState<{ casoTitulo: string } | null>(null);
  const [escenarios, setEscenarios] = useState<Escenario[]>([]);
  const [escenarioActivo, setEscenarioActivo] = useState<string | null>(null);

  const current = configs[currentIdx];
  const hasWork = configs.length > 0 || Boolean(resultado);

  useUnsavedChanges(configs.length > 0 && !resultado);

  useEffect(() => {
    if (resultado) setStep(8); // eslint-disable-line react-hooks/set-state-in-effect -- imperative navigation to result step
  }, [resultado]);

  useEffect(() => {
    const casoId = searchParams.get('casoId');
    const calculoId = searchParams.get('calculoId');
    if (!casoId) return;
    if (calculoId) {
      setSelectedCaso(casoId); // eslint-disable-line react-hooks/set-state-in-effect -- sync casoId from URL
      setLoadingCalculoId(calculoId);
    } else {
      setSelectedCaso(casoId);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!loadingCalculoId) return;
    const ctrl = new AbortController();
    const calculoId = loadingCalculoId;
    (async () => {
      try {
        const r = await fetch(`/api/calculos/${calculoId}`, { signal: ctrl.signal });
        if (!r.ok) throw new Error('No se pudo cargar el cálculo');
        const data = await r.json();
        const enriched: DelitoConfig[] = (data.config as Array<{ delito: Delito | null } & Omit<DelitoConfig, 'delito'>>)
          .filter(c => c.delito)
          .map(c => ({
            delito: c.delito as Delito,
            pena_seleccionada: (c.pena_seleccionada ?? 'prision') as 'prision' | 'multa',
            variables_activas: c.variables_activas ?? [],
            grado_autoria: c.grado_autoria ?? 'autor_directo',
            grado_ejecucion: c.grado_ejecucion ?? 'consumado',
            reduccion_tentativa: c.reduccion_tentativa ?? 1,
            agravantes: c.agravantes ?? [],
            atenuantes: c.atenuantes ?? [],
            eximentes: c.eximentes ?? [],
            eximente_completa: c.eximente_completa ?? null,
          }));
        if (enriched.length === 0) throw new Error('Cálculo sin delitos válidos');
        setConfigs(enriched);
        setSelectedCaso(data.casoId);
        setModificandoCaso({ casoTitulo: data.casoTitulo ?? '' });
        toast.success('Cálculo cargado. Modifica lo que necesites y guarda de nuevo.');
        setStep(1);
        setCurrentIdx(0);
      } catch (e) {
        if ((e as Error).name === 'AbortError') return;
        toast.danger('No se pudo cargar el cálculo');
      } finally {
        setLoadingCalculoId(null);
      }
    })();
    return () => ctrl.abort();
  }, [loadingCalculoId, toast]);

  const selectDelito = useCallback((d: Delito) => {
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
    setConfigs(prev => {
      const next = [...prev];
      next[currentIdx] = cfg;
      return next;
    });
    setStep(d.tiene_pena_alternativa ? 2 : 3);
  }, [currentIdx]);

  const updateCurrent = useCallback((patch: Partial<DelitoConfig>) => {
    setConfigs(prev => {
      const next = [...prev];
      next[currentIdx] = { ...next[currentIdx], ...patch };
      return next;
    });
  }, [currentIdx]);

  const goNext = useCallback(() => {
    setStep(prev => {
      if (prev === 1) {
        const d = current?.delito;
        if (!d) return prev;
        if ((d.estado === 'pendiente_revision' || d.estado === 'rechazado')
            && !pendientesConfirmados[d.id]) {
          toast.danger('Delito no verificado: confirma manualmente que el artículo coincide con la fuente oficial antes de continuar.');
          return prev;
        }
        return d && !d.tiene_pena_alternativa ? 3 : 2;
      }
      if (prev === 5 && configs.length === 1) return 7;
      if (prev === 7) return prev;
      if (prev < 8) return (prev + 1) as Step;
      return prev;
    });
  }, [current, configs.length, pendientesConfirmados, toast]);

  const goPrev = useCallback(() => {
    setStep(prev => {
      if (prev === 7 && configs.length === 1) return 5;
      if (prev === 3 && current?.delito && !current.delito.tiene_pena_alternativa) {
        return configs.length > 1 ? 5 : 1;
      }
      return Math.max(1, prev - 1) as Step;
    });
  }, [current, configs.length]);

  const addAnotherDelito = useCallback(() => {
    setCurrentIdx(configs.length);
    setStep(1);
    setSearch('');
  }, [configs.length, setSearch]);

  const removeDelito = useCallback(async (idx: number) => {
    if (configs.length === 1) {
      const ok = await confirm({
        title: '¿Descartar cálculo?',
        description: 'Se eliminará el único delito configurado.',
        confirmLabel: 'Descartar',
        tone: 'danger',
      });
      if (!ok) return;
    }
    setConfigs(prev => {
      const next = prev.filter((_, i) => i !== idx);
      if (currentIdx >= next.length) setCurrentIdx(Math.max(0, next.length - 1));
      return next;
    });
  }, [configs.length, currentIdx, confirm]);

  const calcular = useCallback(async () => {
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
      setError(e instanceof Error ? e.message : 'No se pudo calcular la pena');
    } finally {
      setCalculating(false);
    }
  }, [configs, tipoConcurso]);

  const reset = useCallback(async () => {
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
    setModificandoCaso(null);
    setSelectedCaso('');
  }, [hasWork, confirm, setSearch]);

  const exitCalculadora = useCallback(async () => {
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
  }, [hasWork, confirm, router]);

  const duplicateEscenario = useCallback(() => {
    const id = nextEscenarioId();
    const n = escenarios.length + 1;
    const esc: Escenario = {
      id,
      nombre: `Escenario ${n}`,
      configs: JSON.parse(JSON.stringify(configs)),
      tipoConcurso,
      resultado: resultado ? JSON.parse(JSON.stringify(resultado)) : null,
    };
    setEscenarios(prev => [...prev, esc]);
    setEscenarioActivo(id);
    toast.success(`Escenario ${n} creado. Ahora puedes modificarlo desde el paso 1.`);
  }, [configs, tipoConcurso, resultado, toast, escenarios.length]);

  const eliminarEscenario = useCallback((id: string) => {
    setEscenarios(prev => prev.filter(e => e.id !== id));
    if (escenarioActivo === id) setEscenarioActivo(null);
  }, [escenarioActivo]);

  const seleccionarEscenario = useCallback((id: string) => {
    const esc = escenarios.find(e => e.id === id);
    if (!esc) return;
    setConfigs(JSON.parse(JSON.stringify(esc.configs)));
    setTipoConcurso(esc.tipoConcurso);
    setResultado(esc.resultado ? JSON.parse(JSON.stringify(esc.resultado)) : null);
    setEscenarioActivo(id);
    setStep(esc.resultado ? 8 : 7);
    toast.success(`Escenario cargado: ${esc.nombre}`);
  }, [escenarios, toast]);

  const handleSaveClick = useCallback(async () => {
    try {
      const r = await fetch('/api/casos');
      const data = await r.json();
      setCasosList(Array.isArray(data) ? data.map((c: { id: string; titulo: string }) => ({ id: c.id, titulo: c.titulo })) : []);
    } catch {
      toast.danger('No se pudieron cargar los casos');
      return;
    }
    setShowSaveModal(true);
  }, [toast]);

  const handleSave = useCallback(async () => {
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
        casoId = data.id ?? data.data?.id;
      }
      const calcConfig = configs.map(c => ({
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
        body: JSON.stringify({ caso_id: casoId, config: calcConfig, resultado }),
      });
      toast.success('Guardado correctamente');
      setShowSaveModal(false);
      setSelectedCaso('');
    } catch {
      toast.danger('Error al guardar');
    } finally {
      setSaving(false);
    }
  }, [selectedCaso, configs, resultado, toast]);

  useKeyboardShortcuts([
    { key: 'Escape', handler: () => { setArticleRef(null); setShowSaveModal(false); } },
    { key: 'Enter', ctrl: true, enabled: step === 7, handler: () => calcular() },
    { key: 'ArrowLeft', enabled: step > 1 && step < 8, handler: () => goPrev() },
    { key: 'ArrowRight', enabled: step < 8 && step !== 7, handler: () => goNext() },
  ]);

  return {
    loader, loading, fetchError,
    search, setSearch, filtered,
    step, setStep, configs, currentIdx, setCurrentIdx,
    current, tipoConcurso, setTipoConcurso,
    resultado, calculating, error,
    articleRef, setArticleRef,
    showSaveModal, setShowSaveModal,
    selectedCaso, setSelectedCaso,
    saving, casosList,
    pendientesConfirmados, setPendientesConfirmados,
    modificandoCaso, setModificandoCaso,
    hasWork,
    selectDelito, updateCurrent, goNext, goPrev,
    addAnotherDelito, removeDelito,
    calcular, reset, exitCalculadora,
    handleSaveClick, handleSave,
    escenarios, escenarioActivo,
    duplicateEscenario, eliminarEscenario, seleccionarEscenario,
  };
}
