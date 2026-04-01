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

// Types
interface Delito {
  id: string;
  nombre: string;
  articulo: string;
  categoria: string;
  ley: string;
  pena_minima_meses: number;
  pena_maxima_meses: number;
  pena_minima_texto: string;
  pena_maxima_texto: string;
  descripcion?: string;
  es_grave: boolean;
  permite_abreviado: boolean;
}

interface Categoria {
  nombre: string;
  cantidad_delitos: number;
}

interface Agravante {
  id: string;
  nombre: string;
  incremento: number;
}

interface Atenuante {
  id: string;
  nombre: string;
  reduccion: number;
}

interface ResultadoCalculo {
  delito: Delito;
  pena_base_minima_meses: number;
  pena_base_maxima_meses: number;
  pena_ajustada_minima_meses: number;
  pena_ajustada_maxima_meses: number;
  pena_minima_texto: string;
  pena_maxima_texto: string;
  tipo_procedimiento: string;
  procedimiento_descripcion: string;
  puede_procedimiento_abreviado: boolean;
  rebaja_por_abreviado?: string;
  agravantes_aplicadas: string[];
  atenuantes_aplicadas: string[];
  observaciones: string[];
}

type Screen = 'home' | 'categorias' | 'delitos' | 'detalle' | 'calcular' | 'resultado';

export default function Index() {
  // State
  const [screen, setScreen] = useState<Screen>('home');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Data
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [delitos, setDelitos] = useState<Delito[]>([]);
  const [filteredDelitos, setFilteredDelitos] = useState<Delito[]>([]);
  const [selectedCategoria, setSelectedCategoria] = useState<string | null>(null);
  const [selectedDelito, setSelectedDelito] = useState<Delito | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Calculation state
  const [agravantes, setAgravantes] = useState<Agravante[]>([]);
  const [atenuantes, setAtenuantes] = useState<Atenuante[]>([]);
  const [selectedAgravantes, setSelectedAgravantes] = useState<string[]>([]);
  const [selectedAtenuantes, setSelectedAtenuantes] = useState<string[]>([]);
  const [esReincidente, setEsReincidente] = useState(false);
  const [confiesa, setConfiesa] = useState(false);
  const [reparaDano, setReparaDano] = useState(false);
  
  // Result
  const [resultado, setResultado] = useState<ResultadoCalculo | null>(null);

  // Fetch functions
  const fetchCategorias = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/categorias`);
      const data = await response.json();
      setCategorias(data);
    } catch (err) {
      console.error('Error fetching categorias:', err);
      setError('Error al cargar categorías');
    }
  };

  const fetchDelitos = async (categoria?: string) => {
    setLoading(true);
    try {
      let url = `${BACKEND_URL}/api/delitos`;
      if (categoria) {
        url += `?categoria=${encodeURIComponent(categoria)}`;
      }
      const response = await fetch(url);
      const data = await response.json();
      setDelitos(data);
      setFilteredDelitos(data);
    } catch (err) {
      console.error('Error fetching delitos:', err);
      setError('Error al cargar delitos');
    } finally {
      setLoading(false);
    }
  };

  const fetchAgravantesAtenuantes = async () => {
    try {
      const [agravRes, atenuRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/agravantes`),
        fetch(`${BACKEND_URL}/api/atenuantes`),
      ]);
      setAgravantes(await agravRes.json());
      setAtenuantes(await atenuRes.json());
    } catch (err) {
      console.error('Error fetching circunstancias:', err);
    }
  };

  const calcularPena = async () => {
    if (!selectedDelito) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/calcular`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          delito_id: selectedDelito.id,
          tiene_agravantes: selectedAgravantes.length > 0,
          tiene_atenuantes: selectedAtenuantes.length > 0,
          es_reincidente: esReincidente,
          repara_dano: reparaDano,
          confiesa: confiesa,
          agravantes_seleccionadas: selectedAgravantes,
          atenuantes_seleccionadas: selectedAtenuantes,
        }),
      });
      const data = await response.json();
      setResultado(data);
      setScreen('resultado');
    } catch (err) {
      console.error('Error calculating:', err);
      setError('Error al calcular la pena');
    } finally {
      setLoading(false);
    }
  };

  // Effects
  useEffect(() => {
    fetchCategorias();
    fetchAgravantesAtenuantes();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = delitos.filter(d => 
        d.nombre.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredDelitos(filtered);
    } else {
      setFilteredDelitos(delitos);
    }
  }, [searchQuery, delitos]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchCategorias();
    if (selectedCategoria) {
      await fetchDelitos(selectedCategoria);
    }
    setRefreshing(false);
  }, [selectedCategoria]);

  // Navigation handlers
  const goToHome = () => {
    setScreen('home');
    setSelectedCategoria(null);
    setSelectedDelito(null);
    setSearchQuery('');
    resetCalculation();
  };

  const goToCategorias = () => {
    setScreen('categorias');
    fetchCategorias();
  };

  const goToDelitos = (categoria: string) => {
    setSelectedCategoria(categoria);
    fetchDelitos(categoria);
    setScreen('delitos');
  };

  const goToDetalle = (delito: Delito) => {
    setSelectedDelito(delito);
    setScreen('detalle');
  };

  const goToCalcular = () => {
    setScreen('calcular');
  };

  const resetCalculation = () => {
    setSelectedAgravantes([]);
    setSelectedAtenuantes([]);
    setEsReincidente(false);
    setConfiesa(false);
    setReparaDano(false);
    setResultado(null);
  };

  const searchAllDelitos = async () => {
    setSelectedCategoria(null);
    await fetchDelitos();
    setScreen('delitos');
  };

  // Toggle functions
  const toggleAgravante = (id: string) => {
    setSelectedAgravantes(prev => 
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  const toggleAtenuante = (id: string) => {
    setSelectedAtenuantes(prev => 
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  // Render components
  const renderHeader = (title: string, showBack: boolean = false) => (
    <View style={styles.header}>
      {showBack && (
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => {
            if (screen === 'resultado') setScreen('calcular');
            else if (screen === 'calcular') setScreen('detalle');
            else if (screen === 'detalle') setScreen('delitos');
            else if (screen === 'delitos') setScreen('categorias');
            else goToHome();
          }}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
      )}
      <Text style={[styles.headerTitle, showBack && { marginLeft: 40 }]}>{title}</Text>
      {showBack && (
        <TouchableOpacity style={styles.homeButton} onPress={goToHome}>
          <Ionicons name="home" size={22} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );

  const renderHome = () => (
    <View style={styles.homeContainer}>
      <View style={styles.logoContainer}>
        <Ionicons name="scale" size={80} color="#3498db" />
        <Text style={styles.appTitle}>Calculadora de Penas</Text>
        <Text style={styles.appSubtitle}>Derecho Penal Hondureño</Text>
        <Text style={styles.appVersion}>Código Penal Decreto 130-2017</Text>
      </View>
      
      <View style={styles.homeButtons}>
        <TouchableOpacity style={styles.mainButton} onPress={goToCategorias}>
          <Ionicons name="folder-open" size={28} color="#fff" />
          <Text style={styles.mainButtonText}>Ver por Categorías</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.mainButton, styles.searchButton]} onPress={searchAllDelitos}>
          <Ionicons name="search" size={28} color="#fff" />
          <Text style={styles.mainButtonText}>Buscar Delito</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.infoBox}>
        <Ionicons name="information-circle" size={20} color="#3498db" />
        <Text style={styles.infoText}>
          Esta aplicación calcula las penas según el Código Penal hondureño y determina el tipo de procedimiento aplicable (Ordinario, Abreviado o Especial).
        </Text>
      </View>
    </View>
  );

  const renderCategorias = () => (
    <ScrollView 
      style={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3498db']} />
      }
    >
      {categorias.map((cat, index) => (
        <TouchableOpacity 
          key={index} 
          style={styles.categoriaCard}
          onPress={() => goToDelitos(cat.nombre)}
        >
          <View style={styles.categoriaIcon}>
            <Ionicons name="folder" size={24} color="#3498db" />
          </View>
          <View style={styles.categoriaInfo}>
            <Text style={styles.categoriaNombre}>{cat.nombre}</Text>
            <Text style={styles.categoriaCantidad}>{cat.cantidad_delitos} delitos</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#bdc3c7" />
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderDelitos = () => (
    <View style={styles.content}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#7f8c8d" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar delito..."
          placeholderTextColor="#95a5a6"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#95a5a6" />
          </TouchableOpacity>
        )}
      </View>
      
      {selectedCategoria && (
        <Text style={styles.categoriaHeader}>{selectedCategoria}</Text>
      )}
      
      <ScrollView style={styles.delitosList}>
        {loading ? (
          <ActivityIndicator size="large" color="#3498db" style={styles.loader} />
        ) : filteredDelitos.length === 0 ? (
          <Text style={styles.emptyText}>No se encontraron delitos</Text>
        ) : (
          filteredDelitos.map((delito) => (
            <TouchableOpacity 
              key={delito.id} 
              style={styles.delitoCard}
              onPress={() => goToDetalle(delito)}
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
              <View style={styles.penasContainer}>
                <View style={styles.penaBox}>
                  <Text style={styles.penaLabel}>Mínima</Text>
                  <Text style={styles.penaValue}>{delito.pena_minima_texto}</Text>
                </View>
                <View style={styles.penaBox}>
                  <Text style={styles.penaLabel}>Máxima</Text>
                  <Text style={styles.penaValue}>{delito.pena_maxima_texto}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );

  const renderDetalle = () => (
    <ScrollView style={styles.content}>
      {selectedDelito && (
        <>
          <View style={styles.detalleCard}>
            <View style={styles.detalleHeaderRow}>
              <Text style={styles.detalleNombre}>{selectedDelito.nombre}</Text>
              {selectedDelito.es_grave && (
                <View style={styles.graveBadgeLarge}>
                  <Text style={styles.graveBadgeTextLarge}>DELITO GRAVE</Text>
                </View>
              )}
            </View>
            
            <View style={styles.detalleRow}>
              <Ionicons name="document-text" size={20} color="#3498db" />
              <Text style={styles.detalleLabel}>Artículo:</Text>
              <Text style={styles.detalleValue}>{selectedDelito.articulo}</Text>
            </View>
            
            <View style={styles.detalleRow}>
              <Ionicons name="book" size={20} color="#3498db" />
              <Text style={styles.detalleLabel}>Ley:</Text>
              <Text style={styles.detalleValue}>{selectedDelito.ley}</Text>
            </View>
            
            <View style={styles.detalleRow}>
              <Ionicons name="folder" size={20} color="#3498db" />
              <Text style={styles.detalleLabel}>Categoría:</Text>
              <Text style={styles.detalleValue}>{selectedDelito.categoria}</Text>
            </View>
            
            {selectedDelito.descripcion && (
              <View style={styles.descripcionContainer}>
                <Text style={styles.descripcionLabel}>Descripción:</Text>
                <Text style={styles.descripcionText}>{selectedDelito.descripcion}</Text>
              </View>
            )}
          </View>
          
          <View style={styles.penasCard}>
            <Text style={styles.penasTitle}>Penas de Prisión</Text>
            <View style={styles.penasRow}>
              <View style={styles.penaLarge}>
                <Text style={styles.penaLargeLabel}>MÍNIMA</Text>
                <Text style={styles.penaLargeValue}>{selectedDelito.pena_minima_texto}</Text>
              </View>
              <View style={styles.penaSeparator}>
                <Text style={styles.penaSeparatorText}>a</Text>
              </View>
              <View style={styles.penaLarge}>
                <Text style={styles.penaLargeLabel}>MÁXIMA</Text>
                <Text style={styles.penaLargeValue}>{selectedDelito.pena_maxima_texto}</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.procedimientoCard}>
            <Text style={styles.procedimientoTitle}>Tipo de Procedimiento</Text>
            {selectedDelito.permite_abreviado && selectedDelito.pena_maxima_meses <= 108 ? (
              <View style={styles.procedimientoInfo}>
                <Ionicons name="checkmark-circle" size={24} color="#27ae60" />
                <Text style={styles.procedimientoText}>Permite Procedimiento Abreviado</Text>
              </View>
            ) : (
              <View style={styles.procedimientoInfo}>
                <Ionicons name="alert-circle" size={24} color="#e74c3c" />
                <Text style={styles.procedimientoText}>Requiere Procedimiento Ordinario</Text>
              </View>
            )}
          </View>
          
          <TouchableOpacity style={styles.calcularButton} onPress={goToCalcular}>
            <Ionicons name="calculator" size={24} color="#fff" />
            <Text style={styles.calcularButtonText}>Calcular Pena con Circunstancias</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );

  const renderCalcular = () => (
    <ScrollView style={styles.content}>
      <View style={styles.calcularCard}>
        <Text style={styles.calcularTitle}>Circunstancias del Caso</Text>
        <Text style={styles.calcularSubtitle}>Delito: {selectedDelito?.nombre}</Text>
        
        {/* Opciones generales */}
        <View style={styles.opcionesSection}>
          <Text style={styles.opcionesTitulo}>Situación del Imputado</Text>
          
          <TouchableOpacity 
            style={styles.checkboxRow} 
            onPress={() => setEsReincidente(!esReincidente)}
          >
            <View style={[styles.checkbox, esReincidente && styles.checkboxChecked]}>
              {esReincidente && <Ionicons name="checkmark" size={16} color="#fff" />}
            </View>
            <Text style={styles.checkboxLabel}>Es reincidente</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.checkboxRow} 
            onPress={() => setConfiesa(!confiesa)}
          >
            <View style={[styles.checkbox, confiesa && styles.checkboxChecked]}>
              {confiesa && <Ionicons name="checkmark" size={16} color="#fff" />}
            </View>
            <Text style={styles.checkboxLabel}>Confiesa los hechos</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.checkboxRow} 
            onPress={() => setReparaDano(!reparaDano)}
          >
            <View style={[styles.checkbox, reparaDano && styles.checkboxChecked]}>
              {reparaDano && <Ionicons name="checkmark" size={16} color="#fff" />}
            </View>
            <Text style={styles.checkboxLabel}>Repara el daño a la víctima</Text>
          </TouchableOpacity>
        </View>
        
        {/* Agravantes */}
        <View style={styles.opcionesSection}>
          <Text style={styles.opcionesTitulo}>Circunstancias Agravantes</Text>
          {agravantes.map((agr) => (
            <TouchableOpacity 
              key={agr.id}
              style={styles.checkboxRow} 
              onPress={() => toggleAgravante(agr.id)}
            >
              <View style={[
                styles.checkbox, 
                selectedAgravantes.includes(agr.id) && styles.checkboxCheckedRed
              ]}>
                {selectedAgravantes.includes(agr.id) && (
                  <Ionicons name="checkmark" size={16} color="#fff" />
                )}
              </View>
              <Text style={styles.checkboxLabel}>{agr.nombre}</Text>
              <Text style={styles.incrementoText}>+{Math.round(agr.incremento * 100)}%</Text>
            </TouchableOpacity>
          ))}
        </View>
        
        {/* Atenuantes */}
        <View style={styles.opcionesSection}>
          <Text style={styles.opcionesTitulo}>Circunstancias Atenuantes</Text>
          {atenuantes.map((aten) => (
            <TouchableOpacity 
              key={aten.id}
              style={styles.checkboxRow} 
              onPress={() => toggleAtenuante(aten.id)}
            >
              <View style={[
                styles.checkbox, 
                selectedAtenuantes.includes(aten.id) && styles.checkboxCheckedGreen
              ]}>
                {selectedAtenuantes.includes(aten.id) && (
                  <Ionicons name="checkmark" size={16} color="#fff" />
                )}
              </View>
              <Text style={styles.checkboxLabel}>{aten.nombre}</Text>
              <Text style={styles.reduccionText}>-{Math.round(aten.reduccion * 100)}%</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      
      <TouchableOpacity 
        style={[styles.calcularButton, loading && styles.buttonDisabled]} 
        onPress={calcularPena}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Ionicons name="calculator" size={24} color="#fff" />
            <Text style={styles.calcularButtonText}>Calcular Pena</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );

  const renderResultado = () => (
    <ScrollView style={styles.content}>
      {resultado && (
        <>
          <View style={styles.resultadoCard}>
            <Text style={styles.resultadoTitle}>{resultado.delito.nombre}</Text>
            <Text style={styles.resultadoArticulo}>{resultado.delito.articulo}</Text>
          </View>
          
          {/* Pena Base */}
          <View style={styles.penaResultCard}>
            <Text style={styles.penaResultTitle}>Pena Base</Text>
            <View style={styles.penaResultRow}>
              <View style={styles.penaResultBox}>
                <Text style={styles.penaResultLabel}>Mínima</Text>
                <Text style={styles.penaResultValue}>
                  {resultado.delito.pena_minima_texto}
                </Text>
              </View>
              <Text style={styles.penaResultSeparator}>a</Text>
              <View style={styles.penaResultBox}>
                <Text style={styles.penaResultLabel}>Máxima</Text>
                <Text style={styles.penaResultValue}>
                  {resultado.delito.pena_maxima_texto}
                </Text>
              </View>
            </View>
          </View>
          
          {/* Pena Ajustada */}
          <View style={[styles.penaResultCard, styles.penaAjustadaCard]}>
            <Text style={styles.penaResultTitle}>Pena Ajustada</Text>
            <View style={styles.penaResultRow}>
              <View style={styles.penaResultBox}>
                <Text style={styles.penaResultLabel}>Mínima</Text>
                <Text style={[styles.penaResultValue, styles.penaAjustadaValue]}>
                  {resultado.pena_minima_texto}
                </Text>
              </View>
              <Text style={styles.penaResultSeparator}>a</Text>
              <View style={styles.penaResultBox}>
                <Text style={styles.penaResultLabel}>Máxima</Text>
                <Text style={[styles.penaResultValue, styles.penaAjustadaValue]}>
                  {resultado.pena_maxima_texto}
                </Text>
              </View>
            </View>
          </View>
          
          {/* Tipo de Procedimiento */}
          <View style={[
            styles.procedimientoResultCard,
            resultado.tipo_procedimiento === 'abreviado' && styles.procedimientoAbreviado,
            resultado.tipo_procedimiento === 'ordinario' && styles.procedimientoOrdinario,
            resultado.tipo_procedimiento === 'especial' && styles.procedimientoEspecial,
          ]}>
            <View style={styles.procedimientoResultHeader}>
              <Ionicons 
                name={
                  resultado.tipo_procedimiento === 'abreviado' ? 'flash' :
                  resultado.tipo_procedimiento === 'especial' ? 'star' : 'document-text'
                } 
                size={28} 
                color="#fff" 
              />
              <Text style={styles.procedimientoResultTitle}>
                Procedimiento {resultado.tipo_procedimiento.charAt(0).toUpperCase() + resultado.tipo_procedimiento.slice(1)}
              </Text>
            </View>
            <Text style={styles.procedimientoResultDesc}>
              {resultado.procedimiento_descripcion}
            </Text>
          </View>
          
          {/* Rebaja por Abreviado */}
          {resultado.rebaja_por_abreviado && (
            <View style={styles.rebajaCard}>
              <Ionicons name="trending-down" size={24} color="#27ae60" />
              <Text style={styles.rebajaText}>{resultado.rebaja_por_abreviado}</Text>
            </View>
          )}
          
          {/* Agravantes aplicadas */}
          {resultado.agravantes_aplicadas.length > 0 && (
            <View style={styles.circunstanciasCard}>
              <Text style={styles.circunstanciasTitulo}>Agravantes Aplicadas</Text>
              {resultado.agravantes_aplicadas.map((agr, idx) => (
                <View key={idx} style={styles.circunstanciaRow}>
                  <Ionicons name="arrow-up-circle" size={18} color="#e74c3c" />
                  <Text style={styles.circunstanciaText}>{agr}</Text>
                </View>
              ))}
            </View>
          )}
          
          {/* Atenuantes aplicadas */}
          {resultado.atenuantes_aplicadas.length > 0 && (
            <View style={styles.circunstanciasCard}>
              <Text style={styles.circunstanciasTitulo}>Atenuantes Aplicadas</Text>
              {resultado.atenuantes_aplicadas.map((aten, idx) => (
                <View key={idx} style={styles.circunstanciaRow}>
                  <Ionicons name="arrow-down-circle" size={18} color="#27ae60" />
                  <Text style={styles.circunstanciaText}>{aten}</Text>
                </View>
              ))}
            </View>
          )}
          
          {/* Observaciones */}
          {resultado.observaciones.length > 0 && (
            <View style={styles.observacionesCard}>
              <Text style={styles.observacionesTitulo}>Observaciones</Text>
              {resultado.observaciones.map((obs, idx) => (
                <View key={idx} style={styles.observacionRow}>
                  <Ionicons name="information-circle" size={18} color="#3498db" />
                  <Text style={styles.observacionText}>{obs}</Text>
                </View>
              ))}
            </View>
          )}
          
          <TouchableOpacity style={styles.nuevaConsultaButton} onPress={goToHome}>
            <Ionicons name="refresh" size={24} color="#fff" />
            <Text style={styles.nuevaConsultaText}>Nueva Consulta</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );

  // Main render
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2c3e50" />
      
      {renderHeader(
        screen === 'home' ? 'Calculadora de Penas' :
        screen === 'categorias' ? 'Categorías de Delitos' :
        screen === 'delitos' ? 'Delitos' :
        screen === 'detalle' ? 'Detalle del Delito' :
        screen === 'calcular' ? 'Calcular Pena' :
        'Resultado',
        screen !== 'home'
      )}
      
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => setError(null)}>
            <Ionicons name="close" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      )}
      
      {screen === 'home' && renderHome()}
      {screen === 'categorias' && renderCategorias()}
      {screen === 'delitos' && renderDelitos()}
      {screen === 'detalle' && renderDetalle()}
      {screen === 'calcular' && renderCalcular()}
      {screen === 'resultado' && renderResultado()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  header: {
    backgroundColor: '#2c3e50',
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  homeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  homeContainer: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginTop: 16,
  },
  appSubtitle: {
    fontSize: 18,
    color: '#7f8c8d',
    marginTop: 8,
  },
  appVersion: {
    fontSize: 14,
    color: '#95a5a6',
    marginTop: 4,
  },
  homeButtons: {
    gap: 16,
  },
  mainButton: {
    backgroundColor: '#3498db',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 12,
    gap: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#3498db',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  searchButton: {
    backgroundColor: '#9b59b6',
  },
  mainButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  infoBox: {
    backgroundColor: '#e8f4fc',
    padding: 16,
    borderRadius: 12,
    marginTop: 32,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    color: '#2980b9',
    fontSize: 14,
    lineHeight: 20,
  },
  categoriaCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  categoriaIcon: {
    width: 48,
    height: 48,
    backgroundColor: '#e8f4fc',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  categoriaInfo: {
    flex: 1,
  },
  categoriaNombre: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  categoriaCantidad: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 4,
  },
  searchContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#2c3e50',
  },
  categoriaHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7f8c8d',
    marginBottom: 12,
  },
  delitosList: {
    flex: 1,
  },
  delitoCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  delitoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  delitoNombre: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    flex: 1,
  },
  graveBadge: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 8,
  },
  graveBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  delitoArticulo: {
    fontSize: 14,
    color: '#3498db',
    marginBottom: 12,
  },
  penasContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  penaBox: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  penaLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  penaValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
  },
  loader: {
    marginTop: 32,
  },
  emptyText: {
    textAlign: 'center',
    color: '#7f8c8d',
    fontSize: 16,
    marginTop: 32,
  },
  detalleCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  detalleHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  detalleNombre: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2c3e50',
    flex: 1,
  },
  graveBadgeLarge: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 12,
  },
  graveBadgeTextLarge: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  detalleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  detalleLabel: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  detalleValue: {
    fontSize: 14,
    color: '#2c3e50',
    flex: 1,
  },
  descripcionContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
  },
  descripcionLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 8,
  },
  descripcionText: {
    fontSize: 14,
    color: '#2c3e50',
    lineHeight: 22,
  },
  penasCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  penasTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 16,
    textAlign: 'center',
  },
  penasRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  penaLarge: {
    flex: 1,
    alignItems: 'center',
  },
  penaLargeLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 8,
  },
  penaLargeValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#e74c3c',
  },
  penaSeparator: {
    paddingHorizontal: 16,
  },
  penaSeparatorText: {
    fontSize: 16,
    color: '#7f8c8d',
  },
  procedimientoCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  procedimientoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 12,
  },
  procedimientoInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  procedimientoText: {
    fontSize: 16,
    color: '#2c3e50',
  },
  calcularButton: {
    backgroundColor: '#27ae60',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 24,
    gap: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#27ae60',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  calcularButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  calcularCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  calcularTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  calcularSubtitle: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 20,
  },
  opcionesSection: {
    marginBottom: 24,
  },
  opcionesTitulo: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
    paddingBottom: 8,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#bdc3c7',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  checkboxCheckedRed: {
    backgroundColor: '#e74c3c',
    borderColor: '#e74c3c',
  },
  checkboxCheckedGreen: {
    backgroundColor: '#27ae60',
    borderColor: '#27ae60',
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 15,
    color: '#2c3e50',
  },
  incrementoText: {
    fontSize: 14,
    color: '#e74c3c',
    fontWeight: '600',
  },
  reduccionText: {
    fontSize: 14,
    color: '#27ae60',
    fontWeight: '600',
  },
  resultadoCard: {
    backgroundColor: '#2c3e50',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
  },
  resultadoTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  resultadoArticulo: {
    fontSize: 14,
    color: '#bdc3c7',
    marginTop: 8,
  },
  penaResultCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  penaAjustadaCard: {
    borderWidth: 2,
    borderColor: '#3498db',
  },
  penaResultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7f8c8d',
    marginBottom: 16,
    textAlign: 'center',
  },
  penaResultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  penaResultBox: {
    flex: 1,
    alignItems: 'center',
  },
  penaResultLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 8,
  },
  penaResultValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
  },
  penaAjustadaValue: {
    color: '#3498db',
    fontSize: 20,
  },
  penaResultSeparator: {
    fontSize: 16,
    color: '#7f8c8d',
    paddingHorizontal: 8,
  },
  procedimientoResultCard: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
  },
  procedimientoAbreviado: {
    backgroundColor: '#27ae60',
  },
  procedimientoOrdinario: {
    backgroundColor: '#e67e22',
  },
  procedimientoEspecial: {
    backgroundColor: '#9b59b6',
  },
  procedimientoResultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  procedimientoResultTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  procedimientoResultDesc: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 20,
  },
  rebajaCard: {
    backgroundColor: '#e8f8f0',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  rebajaText: {
    flex: 1,
    fontSize: 14,
    color: '#27ae60',
    lineHeight: 20,
  },
  circunstanciasCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  circunstanciasTitulo: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 12,
  },
  circunstanciaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  circunstanciaText: {
    fontSize: 14,
    color: '#2c3e50',
  },
  observacionesCard: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  observacionesTitulo: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 12,
  },
  observacionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  observacionText: {
    flex: 1,
    fontSize: 14,
    color: '#7f8c8d',
    lineHeight: 20,
  },
  nuevaConsultaButton: {
    backgroundColor: '#3498db',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 12,
    marginBottom: 24,
    gap: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#3498db',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  nuevaConsultaText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  errorBanner: {
    backgroundColor: '#e74c3c',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  errorText: {
    color: '#fff',
    flex: 1,
  },
});
