import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Platform,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

// Colors based on PDF design
const COLORS = {
  primary: '#007AFF',
  secondary: '#3498DB',
  background: '#F5F5F5',
  white: '#FFFFFF',
  black: '#000000',
  gray: '#8E8E93',
  lightGray: '#E5E5EA',
  red: '#FF3B30',
  green: '#34C759',
  orange: '#FF9500',
};

// Types
interface Delito {
  id: string;
  nombre: string;
  articulo: string;
  categoria: string;
  descripcion: string;
  pena_prision_min: number;
  pena_prision_max: number;
  pena_multa_min: number;
  pena_multa_max: number;
  tiene_pena_alternativa: boolean;
  es_grave: boolean;
  variables?: Array<{id: string; nombre: string; descripcion: string; pena_accesoria?: string}>;
  pena_principal_texto: string;
  pena_alternativa_texto?: string;
}

interface DelitoConfig {
  delito: Delito;
  pena_seleccionada: 'prision' | 'multa';
  variables_activas: string[];
  grado_autoria: string;
  grado_ejecucion: string;
  reduccion_tentativa: number;
  agravantes: string[];
  atenuantes: string[];
  eximentes: string[];
  eximente_completa: boolean;
}

type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

const STEPS = [
  { num: 1, label: 'Seleccionar\nDelito' },
  { num: 2, label: 'Variantes/\nContexto' },
  { num: 3, label: 'Participación' },
  { num: 4, label: 'Circunstancias' },
  { num: 5, label: 'Añadir Delitos' },
  { num: 6, label: 'Tipo de\nConcurso' },
  { num: 7, label: 'Resumen' },
  { num: 8, label: 'Resultado' },
];

export default function Index() {
  // Navigation state
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [screen, setScreen] = useState<'home' | 'calculator'>('home');
  
  // Data state
  const [delitos, setDelitos] = useState<Delito[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [agravantes, setAgravantes] = useState<any[]>([]);
  const [atenuantes, setAtenuantes] = useState<any[]>([]);
  const [eximentes, setEximentes] = useState<any[]>([]);
  const [gradosAutoria, setGradosAutoria] = useState<any[]>([]);
  const [gradosEjecucion, setGradosEjecucion] = useState<any[]>([]);
  const [tiposConcurso, setTiposConcurso] = useState<any[]>([]);
  
  // Calculator state
  const [delitosConfigurados, setDelitosConfigurados] = useState<DelitoConfig[]>([]);
  const [currentDelitoIndex, setCurrentDelitoIndex] = useState(0);
  const [tipoConcurso, setTipoConcurso] = useState('ninguno');
  const [resultado, setResultado] = useState<any>(null);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch data
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [delitosRes, categoriasRes, agravantesRes, atenuantesRes, eximentesRes, autoriaRes, ejecucionRes, concursoRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/delitos`),
        fetch(`${BACKEND_URL}/api/categorias`),
        fetch(`${BACKEND_URL}/api/agravantes`),
        fetch(`${BACKEND_URL}/api/atenuantes`),
        fetch(`${BACKEND_URL}/api/eximentes`),
        fetch(`${BACKEND_URL}/api/grados-autoria`),
        fetch(`${BACKEND_URL}/api/grados-ejecucion`),
        fetch(`${BACKEND_URL}/api/tipos-concurso`),
      ]);
      
      setDelitos(await delitosRes.json());
      setCategorias(await categoriasRes.json());
      setAgravantes(await agravantesRes.json());
      setAtenuantes(await atenuantesRes.json());
      setEximentes(await eximentesRes.json());
      setGradosAutoria(await autoriaRes.json());
      setGradosEjecucion(await ejecucionRes.json());
      setTiposConcurso(await concursoRes.json());
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchInitialData();
    setRefreshing(false);
  }, []);

  // Calculator functions
  const startCalculator = () => {
    setScreen('calculator');
    setCurrentStep(1);
    setDelitosConfigurados([]);
    setCurrentDelitoIndex(0);
    setTipoConcurso('ninguno');
    setResultado(null);
  };

  const goToHome = () => {
    setScreen('home');
    setCurrentStep(1);
    setDelitosConfigurados([]);
    setSearchQuery('');
    setSelectedCategoria(null);
  };

  const selectDelito = (delito: Delito) => {
    const newConfig: DelitoConfig = {
      delito,
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
    
    if (currentDelitoIndex < delitosConfigurados.length) {
      const updated = [...delitosConfigurados];
      updated[currentDelitoIndex] = newConfig;
      setDelitosConfigurados(updated);
    } else {
      setDelitosConfigurados([...delitosConfigurados, newConfig]);
    }
    
    // Check if delito has variables or alternative penalty
    if (delito.tiene_pena_alternativa || (delito.variables && delito.variables.length > 0)) {
      setCurrentStep(2);
    } else {
      setCurrentStep(3);
    }
  };

  const updateCurrentDelito = (updates: Partial<DelitoConfig>) => {
    const updated = [...delitosConfigurados];
    updated[currentDelitoIndex] = { ...updated[currentDelitoIndex], ...updates };
    setDelitosConfigurados(updated);
  };

  const addAnotherDelito = () => {
    setCurrentDelitoIndex(delitosConfigurados.length);
    setCurrentStep(1);
    setSearchQuery('');
  };

  const removeDelito = (index: number) => {
    const updated = delitosConfigurados.filter((_, i) => i !== index);
    setDelitosConfigurados(updated);
    if (currentDelitoIndex >= updated.length) {
      setCurrentDelitoIndex(Math.max(0, updated.length - 1));
    }
  };

  const calcularPena = async () => {
    setLoading(true);
    try {
      const requestBody = {
        delitos: delitosConfigurados.map(d => ({
          delito_id: d.delito.id,
          pena_seleccionada: d.pena_seleccionada,
          variables_activas: d.variables_activas,
          grado_autoria: d.grado_autoria,
          grado_ejecucion: d.grado_ejecucion,
          reduccion_tentativa: d.reduccion_tentativa,
          agravantes: d.agravantes,
          atenuantes: d.atenuantes,
          eximentes: d.eximentes,
          eximente_completa: d.eximente_completa,
        })),
        tipo_concurso: delitosConfigurados.length > 1 ? tipoConcurso : 'ninguno',
      };
      
      const response = await fetch(`${BACKEND_URL}/api/calcular`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
      
      const data = await response.json();
      setResultado(data);
      setCurrentStep(8);
    } catch (err) {
      console.error('Error calculating:', err);
    } finally {
      setLoading(false);
    }
  };

  const goToStep = (step: Step) => {
    if (step <= currentStep || step === currentStep + 1) {
      setCurrentStep(step);
    }
  };

  const continueToNext = () => {
    if (currentStep < 8) {
      // Skip step 2 if no variables/alternatives
      if (currentStep === 1) {
        const currentDelito = delitosConfigurados[currentDelitoIndex]?.delito;
        if (currentDelito && !currentDelito.tiene_pena_alternativa && (!currentDelito.variables || currentDelito.variables.length === 0)) {
          setCurrentStep(3);
          return;
        }
      }
      // Skip step 6 if only one delito
      if (currentStep === 5 && delitosConfigurados.length === 1) {
        setCurrentStep(7);
        return;
      }
      setCurrentStep((currentStep + 1) as Step);
    }
  };

  // Filter delitos
  const filteredDelitos = delitos.filter(d => {
    if (searchQuery && !d.nombre.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (selectedCategoria && d.categoria !== selectedCategoria) {
      return false;
    }
    return true;
  });

  // Render functions
  const renderProgressBar = () => (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false} 
      style={styles.progressContainer}
      contentContainerStyle={styles.progressContent}
    >
      {STEPS.map((step, index) => {
        const isActive = step.num === currentStep;
        const isCompleted = step.num < currentStep;
        const isDisabled = step.num > currentStep;
        
        return (
          <TouchableOpacity
            key={step.num}
            style={[
              styles.progressStep,
              isActive && styles.progressStepActive,
            ]}
            onPress={() => goToStep(step.num as Step)}
            disabled={isDisabled}
          >
            <View style={[
              styles.progressNumber,
              isActive && styles.progressNumberActive,
              isCompleted && styles.progressNumberCompleted,
            ]}>
              <Text style={[
                styles.progressNumberText,
                (isActive || isCompleted) && styles.progressNumberTextActive,
              ]}>
                {step.num}
              </Text>
            </View>
            <Text style={[
              styles.progressLabel,
              isActive && styles.progressLabelActive,
            ]} numberOfLines={2}>
              {step.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );

  const renderHeader = (title: string) => (
    <View style={styles.header}>
      <TouchableOpacity style={styles.backButton} onPress={() => {
        if (currentStep > 1) {
          setCurrentStep((currentStep - 1) as Step);
        } else {
          goToHome();
        }
      }}>
        <Ionicons name="chevron-back" size={28} color={COLORS.primary} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{title}</Text>
      <TouchableOpacity style={styles.homeButton} onPress={goToHome}>
        <Ionicons name="home-outline" size={24} color={COLORS.primary} />
      </TouchableOpacity>
    </View>
  );

  const renderHome = () => (
    <ScrollView 
      style={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
    >
      <View style={styles.homeHeader}>
        <Ionicons name="scale-outline" size={60} color={COLORS.primary} />
        <Text style={styles.homeTitle}>Motor de Cálculo de Penas</Text>
        <Text style={styles.homeSubtitle}>Legislación Penal de Honduras</Text>
      </View>
      
      <TouchableOpacity style={styles.mainCard} onPress={startCalculator}>
        <View style={styles.cardIcon}>
          <Ionicons name="calculator-outline" size={32} color={COLORS.primary} />
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>Calculadora de Penas</Text>
          <Text style={styles.cardDescription}>Calcula penas del Código Penal</Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color={COLORS.gray} />
      </TouchableOpacity>
      
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Categorías de Delitos</Text>
        {categorias.map((cat, index) => (
          <TouchableOpacity 
            key={index} 
            style={styles.categoriaItem}
            onPress={() => {
              setSelectedCategoria(cat.nombre);
              startCalculator();
            }}
          >
            <Text style={styles.categoriaName}>{cat.nombre}</Text>
            <Text style={styles.categoriaCant}>{cat.cantidad} delitos</Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <View style={styles.disclaimer}>
        <Ionicons name="information-circle-outline" size={20} color={COLORS.gray} />
        <Text style={styles.disclaimerText}>
          Este cálculo es orientativo y no sustituye la función jurisdiccional.
        </Text>
      </View>
    </ScrollView>
  );

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Lista de Delitos</Text>
      <Text style={styles.stepSubtitle}>{filteredDelitos.length} delitos disponibles</Text>
      
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={COLORS.gray} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar delito..."
          placeholderTextColor={COLORS.gray}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={COLORS.gray} />
          </TouchableOpacity>
        )}
      </View>
      
      {selectedCategoria && (
        <TouchableOpacity 
          style={styles.filterBadge}
          onPress={() => setSelectedCategoria(null)}
        >
          <Text style={styles.filterBadgeText}>{selectedCategoria}</Text>
          <Ionicons name="close" size={16} color={COLORS.white} />
        </TouchableOpacity>
      )}
      
      <ScrollView style={styles.delitosList}>
        {filteredDelitos.map((delito) => (
          <TouchableOpacity
            key={delito.id}
            style={styles.delitoCard}
            onPress={() => selectDelito(delito)}
          >
            <View style={styles.delitoHeader}>
              <Text style={styles.delitoNombre}>{delito.nombre}</Text>
              {delito.es_grave && (
                <View style={styles.graveBadge}>
                  <Text style={styles.graveBadgeText}>GRAVE</Text>
                </View>
              )}
            </View>
            <Text style={styles.delitoArticulo}>{delito.articulo}</Text>
            <Text style={styles.delitoDescripcion} numberOfLines={2}>{delito.descripcion}</Text>
            <Text style={styles.delitoPena}>Pena principal: {delito.pena_principal_texto}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderStep2 = () => {
    const config = delitosConfigurados[currentDelitoIndex];
    if (!config) return null;
    const delito = config.delito;
    
    return (
      <ScrollView style={styles.stepContent}>
        <Text style={styles.stepTitle}>Variantes / Contexto</Text>
        <Text style={styles.stepSubtitle}>{delito.nombre}</Text>
        
        {delito.tiene_pena_alternativa && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pena alternativa</Text>
            <Text style={styles.sectionDescription}>Selecciona una de las siguientes opciones:</Text>
            
            <TouchableOpacity
              style={[styles.optionCard, config.pena_seleccionada === 'prision' && styles.optionCardSelected]}
              onPress={() => updateCurrentDelito({ pena_seleccionada: 'prision' })}
            >
              <View style={[styles.radioCircle, config.pena_seleccionada === 'prision' && styles.radioCircleSelected]}>
                {config.pena_seleccionada === 'prision' && <View style={styles.radioInner} />}
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>{delito.pena_principal_texto}</Text>
                <Text style={styles.optionSubtitle}>Pena privativa de libertad (por defecto)</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.optionCard, config.pena_seleccionada === 'multa' && styles.optionCardSelected]}
              onPress={() => updateCurrentDelito({ pena_seleccionada: 'multa' })}
            >
              <View style={[styles.radioCircle, config.pena_seleccionada === 'multa' && styles.radioCircleSelected]}>
                {config.pena_seleccionada === 'multa' && <View style={styles.radioInner} />}
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>{delito.pena_alternativa_texto}</Text>
                <Text style={styles.optionSubtitle}>Pena pecuniaria (alternativa)</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}
        
        {delito.variables && delito.variables.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Variables del delito</Text>
            {delito.variables.map((variable) => (
              <TouchableOpacity
                key={variable.id}
                style={[styles.checkboxCard, config.variables_activas.includes(variable.id) && styles.checkboxCardSelected]}
                onPress={() => {
                  const updated = config.variables_activas.includes(variable.id)
                    ? config.variables_activas.filter(v => v !== variable.id)
                    : [...config.variables_activas, variable.id];
                  updateCurrentDelito({ variables_activas: updated });
                }}
              >
                <View style={[styles.checkbox, config.variables_activas.includes(variable.id) && styles.checkboxSelected]}>
                  {config.variables_activas.includes(variable.id) && (
                    <Ionicons name="checkmark" size={16} color={COLORS.white} />
                  )}
                </View>
                <View style={styles.checkboxContent}>
                  <Text style={styles.checkboxTitle}>{variable.nombre}</Text>
                  <Text style={styles.checkboxSubtitle}>{variable.descripcion}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
        
        <TouchableOpacity style={styles.continueButton} onPress={continueToNext}>
          <Text style={styles.continueButtonText}>Continuar</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  const renderStep3 = () => {
    const config = delitosConfigurados[currentDelitoIndex];
    if (!config) return null;
    
    return (
      <ScrollView style={styles.stepContent}>
        <Text style={styles.stepTitle}>Participación</Text>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Grado de Autoría</Text>
          <Text style={styles.sectionDescription}>Selecciona cómo participó la persona en el delito (Art. 28 y 29 CP).</Text>
          
          {gradosAutoria.map((grado) => (
            <TouchableOpacity
              key={grado.id}
              style={[styles.optionCard, config.grado_autoria === grado.id && styles.optionCardSelected]}
              onPress={() => updateCurrentDelito({ grado_autoria: grado.id })}
            >
              <View style={[styles.radioCircle, config.grado_autoria === grado.id && styles.radioCircleSelected]}>
                {config.grado_autoria === grado.id && <View style={styles.radioInner} />}
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>{grado.nombre}</Text>
                <Text style={styles.optionSubtitle}>{grado.descripcion}</Text>
                <Text style={styles.optionArticle}>{grado.articulo}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Grado de Ejecución</Text>
          <Text style={styles.sectionDescription}>Selecciona si el delito se completó o quedó en tentativa (Art. 16 y 62 CP).</Text>
          
          {gradosEjecucion.map((grado) => (
            <View key={grado.id}>
              <TouchableOpacity
                style={[styles.optionCard, config.grado_ejecucion === grado.id && styles.optionCardSelected]}
                onPress={() => updateCurrentDelito({ grado_ejecucion: grado.id })}
              >
                <View style={[styles.radioCircle, config.grado_ejecucion === grado.id && styles.radioCircleSelected]}>
                  {config.grado_ejecucion === grado.id && <View style={styles.radioInner} />}
                </View>
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>{grado.nombre}</Text>
                  <Text style={styles.optionSubtitle}>{grado.descripcion}</Text>
                  <Text style={styles.optionArticle}>{grado.articulo}</Text>
                </View>
              </TouchableOpacity>
              
              {config.grado_ejecucion === grado.id && grado.id !== 'consumado' && (
                <View style={styles.subOptions}>
                  <Text style={styles.subOptionLabel}>Grado de reducción de pena:</Text>
                  <View style={styles.subOptionRow}>
                    <TouchableOpacity
                      style={[styles.subOptionButton, config.reduccion_tentativa === 1 && styles.subOptionButtonSelected]}
                      onPress={() => updateCurrentDelito({ reduccion_tentativa: 1 })}
                    >
                      <Text style={[styles.subOptionText, config.reduccion_tentativa === 1 && styles.subOptionTextSelected]}>-1 Grado</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.subOptionButton, config.reduccion_tentativa === 2 && styles.subOptionButtonSelected]}
                      onPress={() => updateCurrentDelito({ reduccion_tentativa: 2 })}
                    >
                      <Text style={[styles.subOptionText, config.reduccion_tentativa === 2 && styles.subOptionTextSelected]}>-2 Grados</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          ))}
        </View>
        
        <TouchableOpacity style={styles.continueButton} onPress={continueToNext}>
          <Text style={styles.continueButtonText}>Continuar</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  const renderStep4 = () => {
    const config = delitosConfigurados[currentDelitoIndex];
    if (!config) return null;
    
    return (
      <ScrollView style={styles.stepContent}>
        <Text style={styles.stepTitle}>Circunstancias</Text>
        
        <View style={styles.countersRow}>
          <View style={styles.counterBadge}>
            <Text style={styles.counterLabel}>Atenuantes</Text>
            <Text style={styles.counterValue}>{config.atenuantes.length}</Text>
          </View>
          <View style={[styles.counterBadge, styles.counterBadgeRed]}>
            <Text style={styles.counterLabel}>Agravantes</Text>
            <Text style={styles.counterValue}>{config.agravantes.length}</Text>
          </View>
          <View style={styles.counterBadge}>
            <Text style={styles.counterLabel}>Eximentes</Text>
            <Text style={styles.counterValue}>{config.eximentes.length}</Text>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Agravantes (Art. 22 CP)</Text>
          {agravantes.map((agr) => (
            <TouchableOpacity
              key={agr.id}
              style={[styles.checkboxCard, config.agravantes.includes(agr.id) && styles.checkboxCardSelectedRed]}
              onPress={() => {
                const updated = config.agravantes.includes(agr.id)
                  ? config.agravantes.filter(a => a !== agr.id)
                  : [...config.agravantes, agr.id];
                updateCurrentDelito({ agravantes: updated });
              }}
            >
              <View style={[styles.checkbox, config.agravantes.includes(agr.id) && styles.checkboxSelectedRed]}>
                {config.agravantes.includes(agr.id) && (
                  <Ionicons name="checkmark" size={16} color={COLORS.white} />
                )}
              </View>
              <View style={styles.checkboxContent}>
                <Text style={styles.checkboxTitle}>{agr.articulo} - {agr.nombre}</Text>
              </View>
              <TouchableOpacity style={styles.infoButton}>
                <Ionicons name="information-circle-outline" size={20} color={COLORS.gray} />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Atenuantes (Art. 21 CP)</Text>
          {atenuantes.map((aten) => (
            <TouchableOpacity
              key={aten.id}
              style={[styles.checkboxCard, config.atenuantes.includes(aten.id) && styles.checkboxCardSelectedGreen]}
              onPress={() => {
                const updated = config.atenuantes.includes(aten.id)
                  ? config.atenuantes.filter(a => a !== aten.id)
                  : [...config.atenuantes, aten.id];
                updateCurrentDelito({ atenuantes: updated });
              }}
            >
              <View style={[styles.checkbox, config.atenuantes.includes(aten.id) && styles.checkboxSelectedGreen]}>
                {config.atenuantes.includes(aten.id) && (
                  <Ionicons name="checkmark" size={16} color={COLORS.white} />
                )}
              </View>
              <View style={styles.checkboxContent}>
                <Text style={styles.checkboxTitle}>{aten.articulo} - {aten.nombre}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Eximentes (Art. 20 CP)</Text>
          {eximentes.map((ex) => (
            <TouchableOpacity
              key={ex.id}
              style={[styles.checkboxCard, config.eximentes.includes(ex.id) && styles.checkboxCardSelected]}
              onPress={() => {
                const updated = config.eximentes.includes(ex.id)
                  ? config.eximentes.filter(e => e !== ex.id)
                  : [...config.eximentes, ex.id];
                const esCompleta = updated.some(eid => {
                  const eximente = eximentes.find(e => e.id === eid);
                  return eximente?.completa === true;
                });
                updateCurrentDelito({ eximentes: updated, eximente_completa: esCompleta });
              }}
            >
              <View style={[styles.checkbox, config.eximentes.includes(ex.id) && styles.checkboxSelected]}>
                {config.eximentes.includes(ex.id) && (
                  <Ionicons name="checkmark" size={16} color={COLORS.white} />
                )}
              </View>
              <View style={styles.checkboxContent}>
                <Text style={styles.checkboxTitle}>{ex.articulo} - {ex.nombre}</Text>
                <Text style={styles.checkboxSubtitle}>{ex.completa ? 'Eximente completa' : 'Eximente incompleta'}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
        
        <View style={styles.selectionSummary}>
          <Text style={styles.selectionSummaryText}>
            {config.agravantes.length + config.atenuantes.length + config.eximentes.length} seleccionadas
          </Text>
        </View>
        
        <TouchableOpacity style={styles.continueButton} onPress={continueToNext}>
          <Text style={styles.continueButtonText}>Continuar</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  const renderStep5 = () => (
    <ScrollView style={styles.stepContent}>
      <Text style={styles.stepTitle}>Añadir Delitos</Text>
      <Text style={styles.stepSubtitle}>{delitosConfigurados.length} delito(s) configurado(s)</Text>
      
      {delitosConfigurados.map((config, index) => (
        <View key={index} style={styles.delitoSummaryCard}>
          <View style={styles.delitoSummaryHeader}>
            <View style={styles.delitoSummaryNumber}>
              <Text style={styles.delitoSummaryNumberText}>{index + 1}</Text>
            </View>
            <View style={styles.delitoSummaryInfo}>
              <Text style={styles.delitoSummaryName}>{config.delito.nombre}</Text>
              <Text style={styles.delitoSummaryArticle}>{config.delito.articulo}</Text>
            </View>
            {delitosConfigurados.length > 1 && (
              <TouchableOpacity 
                style={styles.removeButton}
                onPress={() => removeDelito(index)}
              >
                <Ionicons name="close-circle" size={24} color={COLORS.red} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      ))}
      
      <TouchableOpacity style={styles.addDelitoButton} onPress={addAnotherDelito}>
        <Ionicons name="add-circle-outline" size={24} color={COLORS.primary} />
        <Text style={styles.addDelitoButtonText}>Añadir delito</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.continueButton} onPress={continueToNext}>
        <Text style={styles.continueButtonText}>Continuar al cálculo</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderStep6 = () => (
    <ScrollView style={styles.stepContent}>
      <Text style={styles.stepTitle}>Tipo de Concurso</Text>
      <Text style={styles.stepSubtitle}>
        Has seleccionado {delitosConfigurados.length} delitos. Selecciona el tipo de concurso que corresponde:
      </Text>
      
      {tiposConcurso.map((tipo) => (
        <TouchableOpacity
          key={tipo.id}
          style={[styles.concursoCard, tipoConcurso === tipo.id && styles.concursoCardSelected]}
          onPress={() => setTipoConcurso(tipo.id)}
        >
          <View style={[styles.radioCircle, tipoConcurso === tipo.id && styles.radioCircleSelected]}>
            {tipoConcurso === tipo.id && <View style={styles.radioInner} />}
          </View>
          <View style={styles.concursoContent}>
            <Text style={styles.concursoTitle}>{tipo.nombre}</Text>
            <Text style={styles.concursoDescription}>{tipo.descripcion}</Text>
            <Text style={styles.concursoArticle}>{tipo.articulo}</Text>
          </View>
        </TouchableOpacity>
      ))}
      
      <TouchableOpacity style={styles.continueButton} onPress={continueToNext}>
        <Text style={styles.continueButtonText}>Ver Resumen</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderStep7 = () => (
    <ScrollView style={styles.stepContent}>
      <Text style={styles.stepTitle}>Resumen del cálculo</Text>
      
      <Text style={styles.resumenSubtitle}>Delitos seleccionados:</Text>
      
      {delitosConfigurados.map((config, index) => (
        <View key={index} style={styles.resumenCard}>
          <Text style={styles.resumenDelitoTitle}>Delito {index + 1}: {config.delito.nombre}</Text>
          <Text style={styles.resumenDelitoArticle}>{config.delito.articulo}</Text>
          
          <View style={styles.resumenRow}>
            <Text style={styles.resumenLabel}>Grado de autoría:</Text>
            <Text style={styles.resumenValue}>{config.grado_autoria}</Text>
          </View>
          
          <View style={styles.resumenRow}>
            <Text style={styles.resumenLabel}>Grado de ejecución:</Text>
            <Text style={styles.resumenValue}>{config.grado_ejecucion}</Text>
          </View>
          
          {config.agravantes.length > 0 && (
            <View style={styles.resumenCircunstancias}>
              <Text style={styles.resumenCircunstanciasTitle}>Agravantes:</Text>
              {config.agravantes.map(aid => {
                const agr = agravantes.find(a => a.id === aid);
                return agr ? <Text key={aid} style={styles.resumenCircunstanciaItem}>• {agr.nombre}</Text> : null;
              })}
            </View>
          )}
          
          {config.atenuantes.length > 0 && (
            <View style={styles.resumenCircunstancias}>
              <Text style={[styles.resumenCircunstanciasTitle, { color: COLORS.green }]}>Atenuantes:</Text>
              {config.atenuantes.map(aid => {
                const aten = atenuantes.find(a => a.id === aid);
                return aten ? <Text key={aid} style={styles.resumenCircunstanciaItem}>• {aten.nombre}</Text> : null;
              })}
            </View>
          )}
        </View>
      ))}
      
      {delitosConfigurados.length > 1 && (
        <View style={styles.resumenConcurso}>
          <Text style={styles.resumenConcursoTitle}>Tipo de concurso:</Text>
          <Text style={styles.resumenConcursoValue}>{tipoConcurso}</Text>
        </View>
      )}
      
      <TouchableOpacity 
        style={[styles.continueButton, loading && styles.buttonDisabled]} 
        onPress={calcularPena}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={COLORS.white} />
        ) : (
          <Text style={styles.continueButtonText}>Calcular Pena</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );

  const renderStep8 = () => {
    if (!resultado) return null;
    
    return (
      <ScrollView style={styles.stepContent}>
        <View style={styles.resultadoHeader}>
          <Text style={styles.resultadoTitle}>Pena Final Resultante</Text>
          <Text style={styles.resultadoPena}>{resultado.pena_principal}</Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Desglose por Delitos</Text>
          {resultado.delitos_analizados.map((delito: any, index: number) => (
            <View key={index} style={styles.desgloseCard}>
              <Text style={styles.desgloseTitle}>Delito {index + 1}: {delito.nombre}</Text>
              <Text style={styles.desgloseArticle}>{delito.articulo}</Text>
              
              <View style={styles.desgloseRow}>
                <Text style={styles.desgloseLabel}>Autoría:</Text>
                <Text style={styles.desgloseValue}>{delito.grado_autoria}</Text>
              </View>
              <View style={styles.desgloseRow}>
                <Text style={styles.desgloseLabel}>Ejecución:</Text>
                <Text style={styles.desgloseValue}>{delito.grado_ejecucion}</Text>
              </View>
              <View style={styles.desgloseRow}>
                <Text style={styles.desgloseLabel}>Pena Individual:</Text>
                <Text style={[styles.desgloseValue, styles.desglosePena]}>{delito.pena_individual_texto}</Text>
              </View>
              
              {delito.agravantes_aplicadas.length > 0 && (
                <View style={styles.desgloseCircunstancias}>
                  <Text style={[styles.desgloseCircunstanciasLabel, { color: COLORS.red }]}>Agravantes:</Text>
                  <Text style={styles.desgloseCircunstanciasValue}>{delito.agravantes_aplicadas.join(', ')}</Text>
                </View>
              )}
              
              {delito.atenuantes_aplicadas.length > 0 && (
                <View style={styles.desgloseCircunstancias}>
                  <Text style={[styles.desgloseCircunstanciasLabel, { color: COLORS.green }]}>Atenuantes:</Text>
                  <Text style={styles.desgloseCircunstanciasValue}>{delito.atenuantes_aplicadas.join(', ')}</Text>
                </View>
              )}
            </View>
          ))}
        </View>
        
        {resultado.penas_accesorias.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Penas Accesorias</Text>
            {resultado.penas_accesorias.map((pena: string, index: number) => (
              <View key={index} style={styles.accesoriaItem}>
                <Ionicons name="alert-circle" size={18} color={COLORS.orange} />
                <Text style={styles.accesoriaText}>{pena}</Text>
              </View>
            ))}
          </View>
        )}
        
        {resultado.tipo_concurso !== 'ninguno' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tipo de Concurso</Text>
            <View style={styles.concursoResultCard}>
              <Text style={styles.concursoResultTitle}>Concurso {resultado.tipo_concurso}</Text>
              <Text style={styles.concursoResultDesc}>{resultado.concurso_descripcion}</Text>
            </View>
          </View>
        )}
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Análisis Jurídico</Text>
          <View style={styles.analisisCard}>
            <Text style={styles.analisisText}>{resultado.analisis_juridico}</Text>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Análisis Técnico</Text>
          <View style={styles.analisisCard}>
            <Text style={styles.analisisText}>{resultado.analisis_tecnico}</Text>
          </View>
        </View>
        
        <View style={styles.disclaimer}>
          <Ionicons name="warning-outline" size={20} color={COLORS.orange} />
          <Text style={styles.disclaimerText}>
            Este cálculo es orientativo y no sustituye la función jurisdiccional. La determinación definitiva de la pena corresponde exclusivamente a los tribunales de justicia.
          </Text>
        </View>
        
        <TouchableOpacity style={styles.newCalculationButton} onPress={goToHome}>
          <Ionicons name="refresh" size={24} color={COLORS.white} />
          <Text style={styles.newCalculationText}>Nueva Consulta</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  // Main render
  if (screen === 'home') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
        <View style={styles.homeHeaderBar}>
          <Text style={styles.homeHeaderTitle}>Calculadora de Penas</Text>
        </View>
        {renderHome()}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      {renderHeader(STEPS[currentStep - 1].label.replace('\n', ' '))}
      {renderProgressBar()}
      
      {currentStep === 1 && renderStep1()}
      {currentStep === 2 && renderStep2()}
      {currentStep === 3 && renderStep3()}
      {currentStep === 4 && renderStep4()}
      {currentStep === 5 && renderStep5()}
      {currentStep === 6 && renderStep6()}
      {currentStep === 7 && renderStep7()}
      {currentStep === 8 && renderStep8()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.black,
    flex: 1,
    textAlign: 'center',
  },
  backButton: {
    padding: 4,
  },
  homeButton: {
    padding: 4,
  },
  // Home
  homeHeaderBar: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  homeHeaderTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.black,
  },
  content: {
    flex: 1,
  },
  homeHeader: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: COLORS.white,
    marginBottom: 16,
  },
  homeTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.black,
    marginTop: 12,
  },
  homeSubtitle: {
    fontSize: 16,
    color: COLORS.gray,
    marginTop: 4,
  },
  mainCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
      android: { elevation: 2 },
    }),
  },
  cardIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: `${COLORS.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.black,
  },
  cardDescription: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 4,
  },
  infoCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 12,
  },
  categoriaItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  categoriaName: {
    fontSize: 15,
    color: COLORS.black,
    flex: 1,
  },
  categoriaCant: {
    fontSize: 14,
    color: COLORS.gray,
  },
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: `${COLORS.orange}15`,
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.gray,
    lineHeight: 18,
  },
  // Progress Bar
  progressContainer: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  progressContent: {
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  progressStep: {
    alignItems: 'center',
    paddingHorizontal: 8,
    minWidth: 70,
  },
  progressStepActive: {},
  progressNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  progressNumberActive: {
    backgroundColor: COLORS.primary,
  },
  progressNumberCompleted: {
    backgroundColor: COLORS.green,
  },
  progressNumberText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray,
  },
  progressNumberTextActive: {
    color: COLORS.white,
  },
  progressLabel: {
    fontSize: 10,
    color: COLORS.gray,
    textAlign: 'center',
  },
  progressLabelActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  // Step Content
  stepContent: {
    flex: 1,
    padding: 16,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.black,
    marginBottom: 4,
  },
  stepSubtitle: {
    fontSize: 15,
    color: COLORS.gray,
    marginBottom: 16,
  },
  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 16,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.black,
  },
  filterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginBottom: 12,
    gap: 8,
  },
  filterBadgeText: {
    color: COLORS.white,
    fontSize: 14,
  },
  // Delitos List
  delitosList: {
    flex: 1,
  },
  delitoCard: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  delitoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  delitoNombre: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.black,
    flex: 1,
  },
  graveBadge: {
    backgroundColor: COLORS.red,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  graveBadgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  delitoArticulo: {
    fontSize: 14,
    color: COLORS.primary,
    marginBottom: 8,
  },
  delitoDescripcion: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 8,
  },
  delitoPena: {
    fontSize: 13,
    color: COLORS.black,
    fontWeight: '500',
  },
  // Sections
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 12,
  },
  // Option Cards
  optionCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}08`,
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.gray,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  radioCircleSelected: {
    borderColor: COLORS.primary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 4,
  },
  optionSubtitle: {
    fontSize: 14,
    color: COLORS.gray,
  },
  optionArticle: {
    fontSize: 13,
    color: COLORS.primary,
    marginTop: 4,
  },
  // Checkbox Cards
  checkboxCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  checkboxCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}08`,
  },
  checkboxCardSelectedRed: {
    borderColor: COLORS.red,
    backgroundColor: `${COLORS.red}08`,
  },
  checkboxCardSelectedGreen: {
    borderColor: COLORS.green,
    backgroundColor: `${COLORS.green}08`,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.gray,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  checkboxSelectedRed: {
    borderColor: COLORS.red,
    backgroundColor: COLORS.red,
  },
  checkboxSelectedGreen: {
    borderColor: COLORS.green,
    backgroundColor: COLORS.green,
  },
  checkboxContent: {
    flex: 1,
  },
  checkboxTitle: {
    fontSize: 15,
    color: COLORS.black,
  },
  checkboxSubtitle: {
    fontSize: 13,
    color: COLORS.gray,
    marginTop: 2,
  },
  infoButton: {
    padding: 4,
  },
  // Sub Options
  subOptions: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    marginTop: -8,
    marginBottom: 12,
    marginLeft: 36,
  },
  subOptionLabel: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 8,
  },
  subOptionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  subOptionButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    alignItems: 'center',
  },
  subOptionButtonSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  subOptionText: {
    fontSize: 14,
    color: COLORS.black,
  },
  subOptionTextSelected: {
    color: COLORS.white,
    fontWeight: '600',
  },
  // Counters
  countersRow: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  counterBadge: {
    flex: 1,
    backgroundColor: COLORS.white,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  counterBadgeRed: {
    backgroundColor: `${COLORS.red}15`,
  },
  counterLabel: {
    fontSize: 12,
    color: COLORS.gray,
  },
  counterValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.black,
    marginTop: 4,
  },
  selectionSummary: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  selectionSummaryText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  // Continue Button
  continueButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  continueButtonText: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '600',
  },
  // Step 5 - Añadir Delitos
  delitoSummaryCard: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  delitoSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  delitoSummaryNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  delitoSummaryNumberText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  delitoSummaryInfo: {
    flex: 1,
  },
  delitoSummaryName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black,
  },
  delitoSummaryArticle: {
    fontSize: 14,
    color: COLORS.gray,
  },
  removeButton: {
    padding: 4,
  },
  addDelitoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    gap: 8,
  },
  addDelitoButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  // Step 6 - Concurso
  concursoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  concursoCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}08`,
  },
  concursoContent: {
    flex: 1,
  },
  concursoTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 4,
  },
  concursoDescription: {
    fontSize: 14,
    color: COLORS.gray,
    lineHeight: 20,
    marginBottom: 8,
  },
  concursoArticle: {
    fontSize: 13,
    color: COLORS.primary,
  },
  // Step 7 - Resumen
  resumenSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 12,
  },
  resumenCard: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  resumenDelitoTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.black,
  },
  resumenDelitoArticle: {
    fontSize: 14,
    color: COLORS.primary,
    marginBottom: 12,
  },
  resumenRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  resumenLabel: {
    fontSize: 14,
    color: COLORS.gray,
    width: 130,
  },
  resumenValue: {
    fontSize: 14,
    color: COLORS.black,
    flex: 1,
  },
  resumenCircunstancias: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  resumenCircunstanciasTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.red,
    marginBottom: 4,
  },
  resumenCircunstanciaItem: {
    fontSize: 13,
    color: COLORS.gray,
    marginLeft: 8,
  },
  resumenConcurso: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  resumenConcursoTitle: {
    fontSize: 14,
    color: COLORS.gray,
  },
  resumenConcursoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black,
    marginTop: 4,
  },
  // Step 8 - Resultado
  resultadoHeader: {
    backgroundColor: COLORS.primary,
    padding: 24,
    borderRadius: 16,
    marginBottom: 24,
    alignItems: 'center',
  },
  resultadoTitle: {
    fontSize: 16,
    color: COLORS.white,
    opacity: 0.9,
    marginBottom: 8,
  },
  resultadoPena: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.white,
    textAlign: 'center',
  },
  desgloseCard: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  desgloseTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black,
  },
  desgloseArticle: {
    fontSize: 14,
    color: COLORS.primary,
    marginBottom: 12,
  },
  desgloseRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  desgloseLabel: {
    fontSize: 14,
    color: COLORS.gray,
    width: 120,
  },
  desgloseValue: {
    fontSize: 14,
    color: COLORS.black,
    flex: 1,
  },
  desglosePena: {
    fontWeight: '600',
    color: COLORS.primary,
  },
  desgloseCircunstancias: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  desgloseCircunstanciasLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  desgloseCircunstanciasValue: {
    fontSize: 13,
    color: COLORS.gray,
  },
  accesoriaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    gap: 12,
  },
  accesoriaText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.black,
  },
  concursoResultCard: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
  },
  concursoResultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 8,
  },
  concursoResultDesc: {
    fontSize: 14,
    color: COLORS.gray,
    lineHeight: 20,
  },
  analisisCard: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
  },
  analisisText: {
    fontSize: 13,
    color: COLORS.black,
    lineHeight: 20,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  newCalculationButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    gap: 12,
  },
  newCalculationText: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '600',
  },
});
