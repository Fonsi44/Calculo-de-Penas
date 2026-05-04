import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING, RADIUS, SHADOWS, BACKEND_URL } from '../src/theme';
import type { Delito, DelitoConfig, CatalogItem, Step } from '../src/types';

const STEPS = [
  { num: 1, label: 'Delito', icon: 'magnify' as const },
  { num: 2, label: 'Variantes', icon: 'tune' as const },
  { num: 3, label: 'Participación', icon: 'account-group' as const },
  { num: 4, label: 'Circunstancias', icon: 'scale-unbalanced' as const },
  { num: 5, label: 'Más delitos', icon: 'plus-circle-outline' as const },
  { num: 6, label: 'Concurso', icon: 'vector-link' as const },
  { num: 7, label: 'Resumen', icon: 'clipboard-text-outline' as const },
  { num: 8, label: 'Resultado', icon: 'gavel' as const },
];

export default function Calculadora() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Catalogs
  const [delitos, setDelitos] = useState<Delito[]>([]);
  const [agravantes, setAgravantes] = useState<CatalogItem[]>([]);
  const [atenuantes, setAtenuantes] = useState<CatalogItem[]>([]);
  const [eximentes, setEximentes] = useState<CatalogItem[]>([]);
  const [gradosAutoria, setGradosAutoria] = useState<CatalogItem[]>([]);
  const [gradosEjecucion, setGradosEjecucion] = useState<CatalogItem[]>([]);
  const [tiposConcurso, setTiposConcurso] = useState<CatalogItem[]>([]);

  // Wizard state
  const [step, setStep] = useState<Step>(1);
  const [configs, setConfigs] = useState<DelitoConfig[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [tipoConcurso, setTipoConcurso] = useState<string>('ninguno');
  const [resultado, setResultado] = useState<any>(null);

  // UI
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`${BACKEND_URL}/api/delitos?limit=1000`).then((r) => r.json()),
      fetch(`${BACKEND_URL}/api/agravantes`).then((r) => r.json()),
      fetch(`${BACKEND_URL}/api/atenuantes`).then((r) => r.json()),
      fetch(`${BACKEND_URL}/api/eximentes`).then((r) => r.json()),
      fetch(`${BACKEND_URL}/api/grados-autoria`).then((r) => r.json()),
      fetch(`${BACKEND_URL}/api/grados-ejecucion`).then((r) => r.json()),
      fetch(`${BACKEND_URL}/api/tipos-concurso`).then((r) => r.json()),
    ])
      .then(([d, ag, at, ex, ga, ge, tc]) => {
        setDelitos(Array.isArray(d) ? d : []);
        setAgravantes(Array.isArray(ag) ? ag : []);
        setAtenuantes(Array.isArray(at) ? at : []);
        setEximentes(Array.isArray(ex) ? ex : []);
        setGradosAutoria(Array.isArray(ga) ? ga : []);
        setGradosEjecucion(Array.isArray(ge) ? ge : []);
        setTiposConcurso(Array.isArray(tc) ? tc : []);
      })
      .catch((e) => console.warn(e))
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
    // skip variants if no alternative
    if (d.tiene_pena_alternativa) setStep(2);
    else setStep(3);
  };

  const updateCurrent = (patch: Partial<DelitoConfig>) => {
    const next = [...configs];
    next[currentIdx] = { ...next[currentIdx], ...patch };
    setConfigs(next);
  };

  const toggle = (arr: string[], v: string) =>
    arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];

  const goNext = () => {
    if (step === 1) {
      const d = current?.delito;
      if (d && !d.tiene_pena_alternativa) setStep(3);
      else setStep(2);
      return;
    }
    if (step === 5 && configs.length === 1) {
      setStep(7);
      return;
    }
    if (step < 8) setStep((step + 1) as Step);
  };

  const goPrev = () => {
    if (step === 7 && configs.length === 1) {
      setStep(5);
      return;
    }
    if (step === 3 && current?.delito && !current.delito.tiene_pena_alternativa) {
      setStep(1);
      return;
    }
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
    try {
      const body = {
        delitos: configs.map((c) => ({
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
      const res = await fetch(`${BACKEND_URL}/api/calcular`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      setResultado(data);
      setStep(8);
    } catch (e) {
      Alert.alert('Error', 'No se pudo calcular la pena');
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
  };

  // Filter delitos
  const filtered = delitos.filter((d) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      d.nombre.toLowerCase().includes(q) ||
      d.articulo.toLowerCase().includes(q) ||
      (d.conducta || '').toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <View style={[styles.root, { paddingTop: insets.top, alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ marginTop: SPACING.sm, color: COLORS.textSecondary }}>
          Cargando catálogos jurídicos...
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.root, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={goPrev}>
          <Ionicons name="chevron-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Calculadora de Penas</Text>
          <Text style={styles.headerSub}>Paso {step} de 8 · {STEPS[step - 1].label}</Text>
        </View>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.replace('/')}>
          <Ionicons name="home-outline" size={22} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {/* Stepper */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.stepperWrap}
        contentContainerStyle={styles.stepperContent}
      >
        {STEPS.map((s) => {
          const active = s.num === step;
          const done = s.num < step;
          return (
            <View key={s.num} style={styles.stepItem}>
              <View
                style={[
                  styles.stepCircle,
                  active && styles.stepCircleActive,
                  done && styles.stepCircleDone,
                ]}
              >
                {done ? (
                  <Ionicons name="checkmark" size={16} color={COLORS.white} />
                ) : (
                  <Text
                    style={[
                      styles.stepNum,
                      active && { color: COLORS.primary },
                    ]}
                  >
                    {s.num}
                  </Text>
                )}
              </View>
              <Text style={[styles.stepLabel, active && styles.stepLabelActive]} numberOfLines={1}>
                {s.label}
              </Text>
            </View>
          );
        })}
      </ScrollView>

      {/* Content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: SPACING.md, paddingBottom: 140 }}
        keyboardShouldPersistTaps="handled"
      >
        {step === 1 && (
          <Step1
            delitos={filtered}
            search={search}
            setSearch={setSearch}
            onSelect={selectDelito}
            currentSelected={current?.delito.id}
            totalCount={delitos.length}
          />
        )}
        {step === 2 && current && (
          <Step2 config={current} update={updateCurrent} />
        )}
        {step === 3 && current && (
          <Step3
            config={current}
            update={updateCurrent}
            gradosAutoria={gradosAutoria}
            gradosEjecucion={gradosEjecucion}
          />
        )}
        {step === 4 && current && (
          <Step4
            config={current}
            update={updateCurrent}
            agravantes={agravantes}
            atenuantes={atenuantes}
            eximentes={eximentes}
            toggle={toggle}
          />
        )}
        {step === 5 && (
          <Step5
            configs={configs}
            currentIdx={currentIdx}
            onAdd={addAnotherDelito}
            onRemove={removeDelito}
          />
        )}
        {step === 6 && (
          <Step6
            tipos={tiposConcurso}
            selected={tipoConcurso}
            onSelect={setTipoConcurso}
            count={configs.length}
          />
        )}
        {step === 7 && (
          <Step7
            configs={configs}
            tipoConcurso={tipoConcurso}
            tipos={tiposConcurso}
            agravantesCat={agravantes}
            atenuantesCat={atenuantes}
            gradosAutoria={gradosAutoria}
            gradosEjecucion={gradosEjecucion}
          />
        )}
        {step === 8 && resultado && <Step8 resultado={resultado} />}
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + SPACING.sm }]}>
        {step === 8 ? (
          <>
            <TouchableOpacity style={styles.btnSecondary} onPress={reset}>
              <Ionicons name="refresh" size={18} color={COLORS.primary} />
              <Text style={styles.btnSecondaryText}>Nuevo cálculo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnPrimary} onPress={() => router.replace('/')}>
              <Text style={styles.btnPrimaryText}>Finalizar</Text>
            </TouchableOpacity>
          </>
        ) : step === 7 ? (
          <>
            <TouchableOpacity style={styles.btnSecondary} onPress={goPrev}>
              <Ionicons name="chevron-back" size={18} color={COLORS.primary} />
              <Text style={styles.btnSecondaryText}>Atrás</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btnPrimary, calculating && { opacity: 0.7 }]}
              onPress={calcular}
              disabled={calculating || configs.length === 0}
            >
              {calculating ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <>
                  <MaterialCommunityIcons name="gavel" size={18} color={COLORS.white} />
                  <Text style={styles.btnPrimaryText}>Calcular pena</Text>
                </>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity style={styles.btnSecondary} onPress={goPrev}>
              <Ionicons name="chevron-back" size={18} color={COLORS.primary} />
              <Text style={styles.btnSecondaryText}>Atrás</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btnPrimary, !current && step !== 5 && step !== 6 && { opacity: 0.5 }]}
              onPress={goNext}
              disabled={!current && step !== 5 && step !== 6}
            >
              <Text style={styles.btnPrimaryText}>Continuar</Text>
              <Ionicons name="chevron-forward" size={18} color={COLORS.white} />
            </TouchableOpacity>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

/* ---------- STEP 1: SELECT DELITO ---------- */
function Step1({
  delitos,
  search,
  setSearch,
  onSelect,
  currentSelected,
  totalCount,
}: any) {
  return (
    <View>
      <SectionTitle
        kicker="Paso 1"
        title="Selecciona el delito"
        desc={`Catálogo del Código Penal de Honduras · ${totalCount} delitos disponibles`}
      />
      <View style={styles.searchInline}>
        <Ionicons name="search" size={18} color={COLORS.textMuted} />
        <TextInput
          style={styles.searchInlineInput}
          placeholder="Buscar por nombre o artículo..."
          placeholderTextColor={COLORS.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        {!!search && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
      </View>
      <Text style={styles.smallMuted}>{delitos.length} resultados</Text>
      {delitos.map((d: Delito) => {
        const sel = d.id === currentSelected;
        return (
          <TouchableOpacity
            key={d.id}
            style={[styles.delitoCard, sel && styles.delitoCardSel]}
            onPress={() => onSelect(d)}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.delitoName}>{d.nombre}</Text>
              <View style={styles.metaRow}>
                <View style={styles.articuloPill}>
                  <Text style={styles.articuloText}>{d.articulo}</Text>
                </View>
                {d.es_grave && (
                  <View style={styles.gravePill}>
                    <Text style={styles.gravePillText}>GRAVE</Text>
                  </View>
                )}
              </View>
              <Text style={styles.delitoPena}>{d.pena_texto}</Text>
            </View>
            <Ionicons
              name={sel ? 'checkmark-circle' : 'chevron-forward'}
              size={22}
              color={sel ? COLORS.success : COLORS.textMuted}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

/* ---------- STEP 2: VARIANTS / ALTERNATIVE ---------- */
function Step2({ config, update }: any) {
  const d = config.delito;
  return (
    <View>
      <SectionTitle
        kicker="Paso 2"
        title="Variantes y contexto"
        desc={d.nombre}
      />
      {d.tiene_pena_alternativa ? (
        <>
          <Text style={styles.subLabel}>Tipo de pena a aplicar</Text>
          <RadioCard
            selected={config.pena_seleccionada === 'prision'}
            title="Pena de prisión"
            desc={`${monthsToText(d.pena_minima_meses)} a ${monthsToText(d.pena_maxima_meses)}`}
            onPress={() => update({ pena_seleccionada: 'prision' })}
          />
          <RadioCard
            selected={config.pena_seleccionada === 'multa'}
            title="Pena alternativa (multa)"
            desc={`${monthsToText(d.pena_alternativa_min)} a ${monthsToText(d.pena_alternativa_max)}`}
            onPress={() => update({ pena_seleccionada: 'multa' })}
          />
        </>
      ) : (
        <View style={styles.noteBox}>
          <Ionicons name="information-circle-outline" size={18} color={COLORS.info} />
          <Text style={styles.noteText}>
            Este delito no contempla penas alternativas. Continuaremos con la pena principal.
          </Text>
        </View>
      )}
    </View>
  );
}

/* ---------- STEP 3: PARTICIPATION ---------- */
function Step3({ config, update, gradosAutoria, gradosEjecucion }: any) {
  return (
    <View>
      <SectionTitle
        kicker="Paso 3"
        title="Grado de participación"
        desc="Define autoría y ejecución conforme al Código Penal"
      />

      <Text style={styles.subLabel}>Autoría (Art. 28-29 CP)</Text>
      {gradosAutoria.map((g: CatalogItem) => (
        <RadioCard
          key={g.id}
          selected={config.grado_autoria === g.id}
          title={g.nombre}
          desc={`${g.articulo} · ${g.descripcion}`}
          onPress={() => update({ grado_autoria: g.id })}
          warn={g.id === 'complice'}
        />
      ))}

      <Text style={[styles.subLabel, { marginTop: SPACING.md }]}>
        Ejecución (Art. 15-16 CP)
      </Text>
      {gradosEjecucion.map((g: CatalogItem) => (
        <RadioCard
          key={g.id}
          selected={config.grado_ejecucion === g.id}
          title={g.nombre}
          desc={`${g.articulo} · ${g.descripcion}`}
          onPress={() => update({ grado_ejecucion: g.id })}
          warn={g.id !== 'consumado'}
        />
      ))}

      {config.grado_ejecucion !== 'consumado' && (
        <View style={{ marginTop: SPACING.sm }}>
          <Text style={styles.subLabel}>Reducción de grados</Text>
          <View style={styles.row}>
            {[1, 2].map((n) => (
              <TouchableOpacity
                key={n}
                style={[
                  styles.pillChoice,
                  config.reduccion_tentativa === n && styles.pillChoiceActive,
                ]}
                onPress={() => update({ reduccion_tentativa: n })}
              >
                <Text
                  style={[
                    styles.pillChoiceText,
                    config.reduccion_tentativa === n && { color: COLORS.primary },
                  ]}
                >
                  -{n} grado{n > 1 ? 's' : ''}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

/* ---------- STEP 4: CIRCUMSTANCES ---------- */
function Step4({ config, update, agravantes, atenuantes, eximentes, toggle }: any) {
  return (
    <View>
      <SectionTitle
        kicker="Paso 4"
        title="Circunstancias modificativas"
        desc="Agravantes, atenuantes y eximentes (Art. 25-27 CP)"
      />

      <CollapsibleGroup
        title="Agravantes (Art. 27 CP)"
        subtitle="Llevan la pena a su mitad superior"
        color={COLORS.danger}
        items={agravantes}
        selected={config.agravantes}
        onToggle={(id: string) =>
          update({ agravantes: toggle(config.agravantes, id) })
        }
      />

      <CollapsibleGroup
        title="Atenuantes (Art. 26 CP)"
        subtitle="Llevan la pena a su mitad inferior"
        color={COLORS.success}
        items={atenuantes}
        selected={config.atenuantes}
        onToggle={(id: string) =>
          update({ atenuantes: toggle(config.atenuantes, id) })
        }
      />

      <CollapsibleGroup
        title="Eximentes (Art. 25 CP)"
        subtitle="Pueden eximir total o parcialmente la responsabilidad"
        color={COLORS.info}
        items={eximentes}
        selected={config.eximentes}
        onToggle={(id: string) =>
          update({ eximentes: toggle(config.eximentes, id) })
        }
      />

      {config.eximentes.length > 0 && (
        <View style={styles.toggleBox}>
          <View style={{ flex: 1 }}>
            <Text style={styles.toggleTitle}>¿Eximente completa?</Text>
            <Text style={styles.toggleDesc}>
              Si es completa, exime la pena. Si es incompleta, la atenúa.
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.toggle,
              config.eximente_completa && { backgroundColor: COLORS.success },
            ]}
            onPress={() => update({ eximente_completa: !config.eximente_completa })}
          >
            <View
              style={[
                styles.toggleThumb,
                config.eximente_completa && { left: 22 },
              ]}
            />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

/* ---------- STEP 5: ADD MORE DELITOS ---------- */
function Step5({ configs, currentIdx, onAdd, onRemove }: any) {
  return (
    <View>
      <SectionTitle
        kicker="Paso 5"
        title="¿Agregar otro delito?"
        desc="Si se cometieron varios delitos, agrégalos para evaluar concurso"
      />
      {configs.map((c: DelitoConfig, i: number) => (
        <View key={i} style={styles.delitoConfigCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.delitoConfigTitle}>{c.delito.nombre}</Text>
            <Text style={styles.delitoConfigSub}>{c.delito.articulo}</Text>
            <View style={{ flexDirection: 'row', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
              <Text style={styles.tagSmall}>{c.grado_autoria.replace('_', ' ')}</Text>
              <Text style={styles.tagSmall}>{c.grado_ejecucion.replace('_', ' ')}</Text>
              {c.agravantes.length > 0 && (
                <Text style={[styles.tagSmall, { color: COLORS.danger }]}>
                  +{c.agravantes.length} agrav.
                </Text>
              )}
              {c.atenuantes.length > 0 && (
                <Text style={[styles.tagSmall, { color: COLORS.success }]}>
                  +{c.atenuantes.length} atenu.
                </Text>
              )}
            </View>
          </View>
          <TouchableOpacity onPress={() => onRemove(i)} style={{ padding: 6 }}>
            <Ionicons name="trash-outline" size={20} color={COLORS.danger} />
          </TouchableOpacity>
        </View>
      ))}

      <TouchableOpacity style={styles.addCard} onPress={onAdd}>
        <Ionicons name="add-circle" size={28} color={COLORS.accent} />
        <View style={{ flex: 1 }}>
          <Text style={styles.addCardTitle}>Agregar otro delito</Text>
          <Text style={styles.addCardDesc}>Configurar un delito adicional</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

/* ---------- STEP 6: CONCURSO ---------- */
function Step6({ tipos, selected, onSelect, count }: any) {
  return (
    <View>
      <SectionTitle
        kicker="Paso 6"
        title="Tipo de concurso"
        desc={`Hay ${count} delitos. Define la regla de acumulación.`}
      />
      {tipos.map((t: any) => (
        <RadioCard
          key={t.id}
          selected={selected === t.id}
          title={t.nombre}
          desc={`${t.articulo} · ${t.descripcion}`}
          onPress={() => onSelect(t.id)}
        />
      ))}
    </View>
  );
}

/* ---------- STEP 7: SUMMARY ---------- */
function Step7({
  configs,
  tipoConcurso,
  tipos,
  agravantesCat,
  atenuantesCat,
  gradosAutoria,
  gradosEjecucion,
}: any) {
  const tc = tipos.find((t: any) => t.id === tipoConcurso);
  return (
    <View>
      <SectionTitle
        kicker="Paso 7"
        title="Revisión final"
        desc="Verifica los datos antes de calcular"
      />
      {configs.map((c: DelitoConfig, i: number) => {
        const ga = gradosAutoria.find((g: any) => g.id === c.grado_autoria);
        const ge = gradosEjecucion.find((g: any) => g.id === c.grado_ejecucion);
        return (
          <View key={i} style={styles.summaryCard}>
            <Text style={styles.summaryNum}>Delito {i + 1}</Text>
            <Text style={styles.summaryTitle}>{c.delito.nombre}</Text>
            <Text style={styles.summarySub}>
              {c.delito.articulo} · {c.delito.clasificacion}
            </Text>
            <SummaryRow label="Autoría" value={ga?.nombre || c.grado_autoria} />
            <SummaryRow label="Ejecución" value={ge?.nombre || c.grado_ejecucion} />
            {c.agravantes.length > 0 && (
              <SummaryRow
                label="Agravantes"
                value={c.agravantes
                  .map((a) => agravantesCat.find((x: any) => x.id === a)?.nombre || a)
                  .join(', ')}
                color={COLORS.danger}
              />
            )}
            {c.atenuantes.length > 0 && (
              <SummaryRow
                label="Atenuantes"
                value={c.atenuantes
                  .map((a) => atenuantesCat.find((x: any) => x.id === a)?.nombre || a)
                  .join(', ')}
                color={COLORS.success}
              />
            )}
            {c.eximentes.length > 0 && (
              <SummaryRow
                label="Eximentes"
                value={`${c.eximentes.length} (${c.eximente_completa ? 'completa' : 'incompleta'})`}
                color={COLORS.info}
              />
            )}
          </View>
        );
      })}
      {configs.length > 1 && tc && (
        <View style={[styles.summaryCard, { borderLeftColor: COLORS.accent, borderLeftWidth: 4 }]}>
          <Text style={styles.summaryNum}>Concurso</Text>
          <Text style={styles.summaryTitle}>{tc.nombre}</Text>
          <Text style={styles.summarySub}>
            {tc.articulo} · {tc.descripcion}
          </Text>
        </View>
      )}
    </View>
  );
}

/* ---------- STEP 8: RESULT ---------- */
function Step8({ resultado }: any) {
  return (
    <View>
      <View style={styles.resultBanner}>
        <View style={styles.resultIcon}>
          <MaterialCommunityIcons name="gavel" size={28} color={COLORS.accent} />
        </View>
        <Text style={styles.resultLabel}>PENA APLICABLE</Text>
        <Text style={styles.resultValue}>{resultado.pena_principal}</Text>
        <Text style={styles.resultDate}>{resultado.fecha}</Text>
      </View>

      {resultado.penas_accesorias?.length > 0 && (
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNum}>Penas accesorias</Text>
          {resultado.penas_accesorias.map((p: string, i: number) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <Ionicons name="ribbon-outline" size={14} color={COLORS.accent} />
              <Text style={{ fontSize: 13, color: COLORS.text }}>{p}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.summaryCard}>
        <Text style={styles.summaryNum}>Detalle por delito</Text>
        {resultado.delitos_analizados?.map((d: any, i: number) => (
          <View key={i} style={{ marginTop: i === 0 ? 6 : 12 }}>
            <Text style={[styles.summaryTitle, { fontSize: 14 }]}>
              {i + 1}. {d.nombre}
            </Text>
            <Text style={styles.summarySub}>{d.articulo}</Text>
            <Text style={[styles.summaryRowVal, { marginTop: 4 }]}>{d.pena_individual_texto}</Text>
            {d.modificaciones?.length > 0 &&
              d.modificaciones.map((m: string, j: number) => (
                <Text key={j} style={{ fontSize: 11, color: COLORS.textSecondary, marginTop: 2 }}>
                  → {m}
                </Text>
              ))}
          </View>
        ))}
      </View>

      {resultado.concurso_descripcion && resultado.tipo_concurso !== 'ninguno' && (
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNum}>Concurso aplicado</Text>
          <Text style={styles.summaryTitle}>
            {resultado.tipo_concurso.toUpperCase()}
          </Text>
          <Text style={styles.summarySub}>{resultado.concurso_articulo}</Text>
          <Text style={[styles.summaryRowVal, { marginTop: 6 }]}>
            {resultado.concurso_descripcion}
          </Text>
        </View>
      )}

      <View style={styles.disclaimerBox}>
        <Ionicons name="warning-outline" size={16} color={COLORS.warning} />
        <Text style={styles.disclaimerText}>{resultado.disclaimer}</Text>
      </View>
    </View>
  );
}

/* ---------- HELPERS ---------- */
function monthsToText(m: number) {
  if (!m || m <= 0) return '0 meses';
  if (m >= 480) return 'Prisión perpetua';
  const a = Math.floor(m / 12);
  const r = m % 12;
  if (a > 0 && r > 0) return `${a} año${a > 1 ? 's' : ''} y ${r} mes${r > 1 ? 'es' : ''}`;
  if (a > 0) return `${a} año${a > 1 ? 's' : ''}`;
  return `${r} mes${r > 1 ? 'es' : ''}`;
}

function SectionTitle({ kicker, title, desc }: any) {
  return (
    <View style={{ marginBottom: SPACING.md }}>
      <Text style={styles.kicker}>{kicker}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.titleDesc}>{desc}</Text>
    </View>
  );
}

function RadioCard({ selected, title, desc, onPress, warn }: any) {
  return (
    <TouchableOpacity
      style={[
        styles.radioCard,
        selected && styles.radioCardSel,
        warn && selected && { borderColor: COLORS.warning, backgroundColor: COLORS.warning + '10' },
      ]}
      onPress={onPress}
    >
      <View
        style={[
          styles.radioOuter,
          selected && { borderColor: COLORS.primary },
        ]}
      >
        {selected && <View style={styles.radioInner} />}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.radioTitle}>{title}</Text>
        <Text style={styles.radioDesc}>{desc}</Text>
      </View>
    </TouchableOpacity>
  );
}

function CollapsibleGroup({ title, subtitle, items, selected, onToggle, color }: any) {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.group}>
      <TouchableOpacity style={styles.groupHeader} onPress={() => setOpen(!open)}>
        <View style={[styles.groupDot, { backgroundColor: color }]} />
        <View style={{ flex: 1 }}>
          <Text style={styles.groupTitle}>{title}</Text>
          <Text style={styles.groupSub}>{subtitle}</Text>
        </View>
        {selected.length > 0 && (
          <View style={[styles.groupBadge, { backgroundColor: color }]}>
            <Text style={styles.groupBadgeText}>{selected.length}</Text>
          </View>
        )}
        <Ionicons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={COLORS.textMuted}
        />
      </TouchableOpacity>
      {open && (
        <View style={styles.groupBody}>
          {items.map((it: any) => {
            const sel = selected.includes(it.id);
            return (
              <TouchableOpacity
                key={it.id}
                style={[styles.checkRow, sel && { backgroundColor: color + '12' }]}
                onPress={() => onToggle(it.id)}
              >
                <View style={[styles.checkBox, sel && { backgroundColor: color, borderColor: color }]}>
                  {sel && <Ionicons name="checkmark" size={14} color={COLORS.white} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.checkTitle}>{it.nombre}</Text>
                  {!!it.descripcion && <Text style={styles.checkDesc}>{it.descripcion}</Text>}
                  {!!it.articulo && <Text style={styles.checkArt}>{it.articulo}</Text>}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}

function SummaryRow({ label, value, color }: any) {
  return (
    <View style={{ flexDirection: 'row', marginTop: 6 }}>
      <Text style={styles.summaryRowLabel}>{label}:</Text>
      <Text style={[styles.summaryRowVal, color && { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 4,
    gap: SPACING.sm,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { color: COLORS.white, fontSize: 17, fontWeight: '700' },
  headerSub: { color: '#C9D1DD', fontSize: 11, marginTop: 2 },
  stepperWrap: { backgroundColor: COLORS.primary, paddingBottom: SPACING.sm },
  stepperContent: { paddingHorizontal: SPACING.md, gap: 12, alignItems: 'flex-start' },
  stepItem: { alignItems: 'center', minWidth: 60 },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  stepCircleActive: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  stepCircleDone: { backgroundColor: COLORS.success, borderColor: COLORS.success },
  stepNum: { color: COLORS.white, fontWeight: '700', fontSize: 13 },
  stepLabel: {
    color: '#A8B3C6',
    fontSize: 9,
    marginTop: 4,
    fontWeight: '600',
  },
  stepLabelActive: { color: COLORS.accent },
  kicker: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.accent,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
    lineHeight: 26,
  },
  titleDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  searchInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.md,
    paddingVertical: Platform.OS === 'ios' ? 12 : 6,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.sm,
  },
  searchInlineInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    paddingVertical: 4,
  },
  smallMuted: { fontSize: 11, color: COLORS.textMuted, marginBottom: SPACING.sm },
  delitoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
    ...SHADOWS.sm,
  },
  delitoCardSel: {
    borderColor: COLORS.success,
    backgroundColor: COLORS.success + '08',
  },
  delitoName: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 6 },
  metaRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: 6 },
  articuloPill: {
    backgroundColor: COLORS.primary + '12',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  articuloText: { fontSize: 11, fontWeight: '700', color: COLORS.primary },
  gravePill: {
    backgroundColor: COLORS.danger + '15',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  gravePillText: { fontSize: 9, fontWeight: '800', color: COLORS.danger },
  delitoPena: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '600' },
  subLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.sm,
    marginTop: SPACING.sm,
  },
  radioCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm + 4,
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginBottom: SPACING.sm,
  },
  radioCardSel: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '06' },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  radioTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  radioDesc: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2, lineHeight: 17 },
  noteBox: {
    flexDirection: 'row',
    gap: SPACING.sm,
    backgroundColor: COLORS.info + '10',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.info + '40',
  },
  noteText: { flex: 1, fontSize: 12, color: COLORS.text, lineHeight: 17 },
  row: { flexDirection: 'row', gap: SPACING.sm },
  pillChoice: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  pillChoiceActive: {
    backgroundColor: COLORS.accent + '20',
    borderColor: COLORS.accent,
  },
  pillChoiceText: { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary },
  group: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginBottom: SPACING.sm,
    overflow: 'hidden',
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
  },
  groupDot: { width: 8, height: 8, borderRadius: 4 },
  groupTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  groupSub: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  groupBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
    minWidth: 22,
    alignItems: 'center',
  },
  groupBadgeText: { color: COLORS.white, fontSize: 11, fontWeight: '700' },
  groupBody: { borderTopWidth: 1, borderTopColor: COLORS.borderLight },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    padding: SPACING.sm + 4,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  checkBox: {
    width: 22,
    height: 22,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkTitle: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  checkDesc: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  checkArt: { fontSize: 10, color: COLORS.textMuted, marginTop: 2, fontStyle: 'italic' },
  toggleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginTop: SPACING.sm,
    gap: SPACING.sm,
  },
  toggleTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  toggleDesc: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.border,
    padding: 2,
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.white,
    position: 'absolute',
    top: 2,
    left: 2,
  },
  delitoConfigCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  delitoConfigTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  delitoConfigSub: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  tagSmall: {
    fontSize: 10,
    backgroundColor: COLORS.borderLight,
    color: COLORS.textSecondary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  addCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 2,
    borderColor: COLORS.accent,
    borderStyle: 'dashed',
    backgroundColor: COLORS.accent + '08',
    marginTop: SPACING.sm,
  },
  addCardTitle: { fontSize: 14, fontWeight: '700', color: COLORS.primary },
  addCardDesc: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  summaryCard: {
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginBottom: SPACING.sm,
    ...SHADOWS.sm,
  },
  summaryNum: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.accent,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  summaryTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  summarySub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  summaryRowLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    minWidth: 90,
  },
  summaryRowVal: { flex: 1, fontSize: 12, color: COLORS.text },
  resultBanner: {
    backgroundColor: COLORS.primary,
    padding: SPACING.lg,
    borderRadius: RADIUS.xl,
    alignItems: 'center',
    marginBottom: SPACING.md,
    ...SHADOWS.lg,
  },
  resultIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(201,165,92,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.accent,
    marginBottom: SPACING.sm,
  },
  resultLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.accent,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  resultValue: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.white,
    marginTop: SPACING.sm,
    textAlign: 'center',
    lineHeight: 28,
  },
  resultDate: { fontSize: 11, color: '#C9D1DD', marginTop: 6 },
  disclaimerBox: {
    flexDirection: 'row',
    gap: SPACING.sm,
    padding: SPACING.md,
    backgroundColor: COLORS.warning + '14',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.warning + '40',
    marginTop: SPACING.sm,
  },
  disclaimerText: { flex: 1, fontSize: 11, color: COLORS.textSecondary, lineHeight: 16, fontStyle: 'italic' },
  footer: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm + 4,
    gap: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  btnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  btnSecondaryText: { color: COLORS.primary, fontWeight: '700', fontSize: 14 },
  btnPrimary: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
  },
  btnPrimaryText: { color: COLORS.white, fontWeight: '700', fontSize: 14 },
});
