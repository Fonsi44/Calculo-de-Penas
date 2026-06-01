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
import { scale, fontScale, useResponsive } from '../src/responsive';
import Container from '../src/Container';

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
  const { isTablet } = useResponsive();

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
          <Ionicons name="chevron-back" size={scale(24)} color={COLORS.white} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Calculadora de Penas</Text>
          <Text style={styles.headerSub}>Paso {step} de 8 · {STEPS[step - 1].label}</Text>
        </View>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.replace('/')}>
          <Ionicons name="home-outline" size={scale(22)} color={COLORS.white} />
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
                  <Ionicons name="checkmark" size={scale(16)} color={COLORS.white} />
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
        contentContainerStyle={{ padding: scale(12), paddingBottom: scale(100) }}
        keyboardShouldPersistTaps="handled"
      >
        <Container>
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
        </Container>
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + SPACING.sm }]}>
        {step === 8 ? (
          <>
            <TouchableOpacity style={styles.btnSecondary} onPress={reset}>
              <Ionicons name="refresh" size={scale(18)} color={COLORS.primary} />
              <Text style={styles.btnSecondaryText}>Nuevo cálculo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnPrimary} onPress={() => router.replace('/')}>
              <Text style={styles.btnPrimaryText}>Finalizar</Text>
            </TouchableOpacity>
          </>
        ) : step === 7 ? (
          <>
            <TouchableOpacity style={styles.btnSecondary} onPress={goPrev}>
              <Ionicons name="chevron-back" size={scale(18)} color={COLORS.primary} />
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
                  <MaterialCommunityIcons name="gavel" size={scale(18)} color={COLORS.white} />
                  <Text style={styles.btnPrimaryText}>Calcular pena</Text>
                </>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity style={styles.btnSecondary} onPress={goPrev}>
              <Ionicons name="chevron-back" size={scale(18)} color={COLORS.primary} />
              <Text style={styles.btnSecondaryText}>Atrás</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btnPrimary, !current && step !== 5 && step !== 6 && { opacity: 0.5 }]}
              onPress={goNext}
              disabled={!current && step !== 5 && step !== 6}
            >
              <Text style={styles.btnPrimaryText}>Continuar</Text>
              <Ionicons name="chevron-forward" size={scale(18)} color={COLORS.white} />
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
        <Ionicons name="search" size={scale(18)} color={COLORS.textMuted} />
        <TextInput
          style={styles.searchInlineInput}
          placeholder="Buscar por nombre o artículo..."
          placeholderTextColor={COLORS.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        {!!search && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={scale(18)} color={COLORS.textMuted} />
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
              size={scale(22)}
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
          <Ionicons name="information-circle-outline" size={scale(18)} color={COLORS.info} />
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
                config.eximente_completa && { left: scale(22) },
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
            <View style={{ flexDirection: 'row', gap: scale(6), marginTop: scale(6), flexWrap: 'wrap' }}>
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
          <TouchableOpacity onPress={() => onRemove(i)} style={{ padding: scale(6) }}>
            <Ionicons name="trash-outline" size={scale(20)} color={COLORS.danger} />
          </TouchableOpacity>
        </View>
      ))}

      <TouchableOpacity style={styles.addCard} onPress={onAdd}>
        <Ionicons name="add-circle" size={scale(28)} color={COLORS.accent} />
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
        <View style={[styles.summaryCard, { borderLeftColor: COLORS.accent, borderLeftWidth: scale(4) }]}>
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
          <MaterialCommunityIcons name="gavel" size={scale(28)} color={COLORS.accent} />
        </View>
        <Text style={styles.resultLabel}>PENA APLICABLE</Text>
        <Text style={styles.resultValue}>{resultado.pena_principal}</Text>
        <Text style={styles.resultDate}>{resultado.fecha}</Text>
      </View>

      {resultado.penas_accesorias?.length > 0 && (
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNum}>Penas accesorias</Text>
          {resultado.penas_accesorias.map((p: string, i: number) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: scale(6), marginTop: scale(4) }}>
              <Ionicons name="ribbon-outline" size={scale(14)} color={COLORS.accent} />
              <Text style={{ fontSize: fontScale(13), color: COLORS.text }}>{p}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.summaryCard}>
        <Text style={styles.summaryNum}>Detalle por delito</Text>
        {resultado.delitos_analizados?.map((d: any, i: number) => (
          <View key={i} style={{ marginTop: i === 0 ? scale(6) : scale(12) }}>
            <Text style={[styles.summaryTitle, { fontSize: fontScale(14) }]}>
              {i + 1}. {d.nombre}
            </Text>
            <Text style={styles.summarySub}>{d.articulo}</Text>
            <Text style={[styles.summaryRowVal, { marginTop: scale(4) }]}>{d.pena_individual_texto}</Text>
            {d.modificaciones?.length > 0 &&
              d.modificaciones.map((m: string, j: number) => (
                <Text key={j} style={{ fontSize: fontScale(11), color: COLORS.textSecondary, marginTop: scale(2) }}>
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
          <Text style={[styles.summaryRowVal, { marginTop: scale(6) }]}>
            {resultado.concurso_descripcion}
          </Text>
        </View>
      )}

      <View style={styles.disclaimerBox}>
        <Ionicons name="warning-outline" size={scale(16)} color={COLORS.warning} />
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
          size={scale(20)}
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
                  {sel && <Ionicons name="checkmark" size={scale(14)} color={COLORS.white} />}
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
    <View style={{ flexDirection: 'row', marginTop: scale(6) }}>
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
    paddingHorizontal: scale(12),
    paddingVertical: scale(8),
    gap: scale(8),
  },
  iconBtn: {
    width: scale(32),
    height: scale(32),
    borderRadius: RADIUS.sm,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { color: COLORS.white, fontSize: fontScale(15), fontWeight: '700' },
  headerSub: { color: '#C9D1DD', fontSize: fontScale(10), marginTop: scale(1) },
  stepperWrap: { backgroundColor: COLORS.primary, paddingBottom: scale(4) },
  stepperContent: { paddingHorizontal: scale(12), gap: scale(8), alignItems: 'flex-start' },
  stepItem: { alignItems: 'center', minWidth: scale(48) },
  stepCircle: {
    width: scale(26),
    height: scale(26),
    borderRadius: scale(13),
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  stepCircleActive: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  stepCircleDone: { backgroundColor: COLORS.success, borderColor: COLORS.success },
  stepNum: { color: COLORS.white, fontWeight: '700', fontSize: fontScale(13) },
  stepLabel: {
    color: '#A8B3C6',
    fontSize: fontScale(9),
    marginTop: scale(4),
    fontWeight: '600',
  },
  stepLabelActive: { color: COLORS.accent },
  kicker: {
    fontSize: fontScale(10),
    fontWeight: '800',
    color: COLORS.accent,
    letterSpacing: scale(1.5),
    textTransform: 'uppercase',
    marginBottom: scale(4),
  },
  title: {
    fontSize: fontScale(18),
    fontWeight: '800',
    color: COLORS.text,
    lineHeight: fontScale(22),
  },
  titleDesc: {
    fontSize: fontScale(13),
    color: COLORS.textSecondary,
    marginTop: scale(4),
    lineHeight: fontScale(18),
  },
  searchInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.md,
    paddingVertical: Platform.OS === 'ios' ? scale(12) : scale(6),
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.sm,
  },
  searchInlineInput: {
    flex: 1,
    fontSize: fontScale(14),
    color: COLORS.text,
    paddingVertical: scale(4),
  },
  smallMuted: { fontSize: fontScale(11), color: COLORS.textMuted, marginBottom: SPACING.sm },
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
  delitoName: { fontSize: fontScale(15), fontWeight: '700', color: COLORS.text, marginBottom: scale(6) },
  metaRow: { flexDirection: 'row', gap: scale(6), flexWrap: 'wrap', marginBottom: scale(6) },
  articuloPill: {
    backgroundColor: COLORS.primary + '12',
    paddingHorizontal: scale(8),
    paddingVertical: scale(2),
    borderRadius: RADIUS.sm,
  },
  articuloText: { fontSize: fontScale(11), fontWeight: '700', color: COLORS.primary },
  gravePill: {
    backgroundColor: COLORS.danger + '15',
    paddingHorizontal: scale(8),
    paddingVertical: scale(2),
    borderRadius: RADIUS.sm,
  },
  gravePillText: { fontSize: fontScale(9), fontWeight: '800', color: COLORS.danger },
  delitoPena: { fontSize: fontScale(12), color: COLORS.textSecondary, fontWeight: '600' },
  subLabel: {
    fontSize: fontScale(12),
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: scale(1),
    marginBottom: SPACING.sm,
    marginTop: SPACING.sm,
  },
  radioCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm + scale(4),
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginBottom: SPACING.sm,
  },
  radioCardSel: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '06' },
  radioOuter: {
    width: scale(22),
    height: scale(22),
    borderRadius: scale(11),
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: scale(2),
  },
  radioInner: {
    width: scale(10),
    height: scale(10),
    borderRadius: scale(5),
    backgroundColor: COLORS.primary,
  },
  radioTitle: { fontSize: fontScale(14), fontWeight: '700', color: COLORS.text },
  radioDesc: { fontSize: fontScale(12), color: COLORS.textSecondary, marginTop: scale(2), lineHeight: fontScale(17) },
  noteBox: {
    flexDirection: 'row',
    gap: SPACING.sm,
    backgroundColor: COLORS.info + '10',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.info + '40',
  },
  noteText: { flex: 1, fontSize: fontScale(12), color: COLORS.text, lineHeight: fontScale(17) },
  row: { flexDirection: 'row', gap: SPACING.sm },
  pillChoice: {
    flex: 1,
    paddingVertical: scale(12),
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
  pillChoiceText: { fontSize: fontScale(13), fontWeight: '700', color: COLORS.textSecondary },
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
  groupDot: { width: scale(8), height: scale(8), borderRadius: scale(4) },
  groupTitle: { fontSize: fontScale(14), fontWeight: '700', color: COLORS.text },
  groupSub: { fontSize: fontScale(11), color: COLORS.textMuted, marginTop: scale(2) },
  groupBadge: {
    paddingHorizontal: scale(8),
    paddingVertical: scale(2),
    borderRadius: RADIUS.pill,
    minWidth: scale(22),
    alignItems: 'center',
  },
  groupBadgeText: { color: COLORS.white, fontSize: fontScale(11), fontWeight: '700' },
  groupBody: { borderTopWidth: 1, borderTopColor: COLORS.borderLight },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    padding: SPACING.sm + scale(4),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  checkBox: {
    width: scale(22),
    height: scale(22),
    borderRadius: scale(5),
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: scale(2),
  },
  checkTitle: { fontSize: fontScale(13), fontWeight: '600', color: COLORS.text },
  checkDesc: { fontSize: fontScale(11), color: COLORS.textSecondary, marginTop: scale(2) },
  checkArt: { fontSize: fontScale(10), color: COLORS.textMuted, marginTop: scale(2), fontStyle: 'italic' },
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
  toggleTitle: { fontSize: fontScale(14), fontWeight: '700', color: COLORS.text },
  toggleDesc: { fontSize: fontScale(11), color: COLORS.textMuted, marginTop: scale(2) },
  toggle: {
    width: scale(44),
    height: scale(24),
    borderRadius: scale(12),
    backgroundColor: COLORS.border,
    padding: scale(2),
  },
  toggleThumb: {
    width: scale(20),
    height: scale(20),
    borderRadius: scale(10),
    backgroundColor: COLORS.white,
    position: 'absolute',
    top: scale(2),
    left: scale(2),
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
  delitoConfigTitle: { fontSize: fontScale(14), fontWeight: '700', color: COLORS.text },
  delitoConfigSub: { fontSize: fontScale(11), color: COLORS.textMuted, marginTop: scale(2) },
  tagSmall: {
    fontSize: fontScale(10),
    backgroundColor: COLORS.borderLight,
    color: COLORS.textSecondary,
    paddingHorizontal: scale(6),
    paddingVertical: scale(2),
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
  addCardTitle: { fontSize: fontScale(14), fontWeight: '700', color: COLORS.primary },
  addCardDesc: { fontSize: fontScale(11), color: COLORS.textSecondary, marginTop: scale(2) },
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
    fontSize: fontScale(10),
    fontWeight: '800',
    color: COLORS.accent,
    letterSpacing: scale(1.5),
    textTransform: 'uppercase',
    marginBottom: scale(4),
  },
  summaryTitle: { fontSize: fontScale(16), fontWeight: '700', color: COLORS.text },
  summarySub: { fontSize: fontScale(12), color: COLORS.textSecondary, marginTop: scale(2) },
  summaryRowLabel: {
    fontSize: fontScale(12),
    fontWeight: '700',
    color: COLORS.textSecondary,
    minWidth: scale(90),
  },
  summaryRowVal: { flex: 1, fontSize: fontScale(12), color: COLORS.text },
  resultBanner: {
    backgroundColor: COLORS.primary,
    padding: SPACING.lg,
    borderRadius: RADIUS.xl,
    alignItems: 'center',
    marginBottom: SPACING.md,
    ...SHADOWS.lg,
  },
  resultIcon: {
    width: scale(60),
    height: scale(60),
    borderRadius: scale(30),
    backgroundColor: 'rgba(201,165,92,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.accent,
    marginBottom: SPACING.sm,
  },
  resultLabel: {
    fontSize: fontScale(11),
    fontWeight: '800',
    color: COLORS.accent,
    letterSpacing: scale(2),
    textTransform: 'uppercase',
  },
  resultValue: {
    fontSize: fontScale(22),
    fontWeight: '800',
    color: COLORS.white,
    marginTop: SPACING.sm,
    textAlign: 'center',
    lineHeight: fontScale(28),
  },
  resultDate: { fontSize: fontScale(11), color: '#C9D1DD', marginTop: scale(6) },
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
  disclaimerText: { flex: 1, fontSize: fontScale(11), color: COLORS.textSecondary, lineHeight: fontScale(16), fontStyle: 'italic' },
  footer: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    paddingHorizontal: scale(12),
    paddingTop: scale(8),
    gap: scale(8),
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  btnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale(4),
    paddingVertical: scale(10),
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  btnSecondaryText: { color: COLORS.primary, fontWeight: '700', fontSize: fontScale(13) },
  btnPrimary: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale(4),
    paddingVertical: scale(10),
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.primary,
  },
  btnPrimaryText: { color: COLORS.white, fontWeight: '700', fontSize: fontScale(13) },
});
