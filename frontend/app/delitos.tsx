import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Alert,
  ActivityIndicator,
  Platform,
  RefreshControl,
  FlatList,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING, RADIUS, SHADOWS, BACKEND_URL } from '../src/theme';
import type { Delito } from '../src/types';
import { scale, fontScale, useResponsive } from '../src/responsive';
import Container from '../src/Container';

export default function DelitosCatalog() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isTablet } = useResponsive();
  const [delitos, setDelitos] = useState<Delito[]>([]);
  const [ramas, setRamas] = useState<{id:string;cantidad:number}[]>([]);
  const [search, setSearch] = useState('');
  const [activeRama, setActiveRama] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const ramaNames: Record<string,string> = {
    'vida_integridad':'Vida e Integridad Física','vida_integridad.homicidio':'Homicidio','vida_integridad.homicidio.consumado':'Homicidio consumado',
    'vida_integridad.homicidio.imprudente':'Homicidio imprudente','vida_integridad.aborto':'Aborto','vida_integridad.lesiones':'Lesiones',
    'vida_integridad.lesiones.graves':'Lesiones graves','vida_integridad.lesiones.leves':'Lesiones leves','vida_integridad.riña':'Riña',
    'vida_integridad.vida_dependiente':'Vida humana dependiente','libertad':'Libertad','libertad.detenciones':'Detenciones ilegales',
    'libertad.detenciones.ilegal':'Detención ilegal','libertad.detenciones.secuestro':'Secuestro','libertad.amenazas':'Amenazas y coacciones',
    'libertad.violencia_genero':'Violencia de género','libertad.integridad_moral':'Integridad moral',
    'libertad_sexual':'Libertad Sexual','libertad_sexual.agresiones':'Agresiones sexuales','libertad_sexual.agresiones.violacion':'Violación',
    'libertad_sexual.agresiones.agravada':'Agresión sexual agravada','libertad_sexual.abusos':'Abusos sexuales',
    'libertad_sexual.abusos.menores':'Abusos a menores','libertad_sexual.acoso':'Acoso sexual',
    'libertad_sexual.explotacion':'Explotación sexual','libertad_sexual.trata':'Trata de personas',
    'honor_intimidad':'Honor e Intimidad','honor_intimidad.calumnias':'Calumnias e injurias','honor_intimidad.secretos':'Revelación de secretos',
    'honor_intimidad.allanamiento':'Allanamiento','familia':'Familia','familia.matrimonio':'Matrimonios ilegales',
    'familia.sustraccion':'Sustracción de menores','familia.abandono':'Abandono familiar','patrimonio':'Patrimonio',
    'patrimonio.hurto':'Hurto','patrimonio.hurto.simple':'Hurto simple','patrimonio.hurto.agravado':'Hurto agravado',
    'patrimonio.robo':'Robo','patrimonio.robo.simple':'Robo simple','patrimonio.robo.agravado':'Robo agravado',
    'patrimonio.extorsion':'Extorsión','patrimonio.estafa':'Estafas','patrimonio.estafa.simple':'Estafa','patrimonio.estafa.agravada':'Estafa agravada',
    'patrimonio.apropiacion':'Apropiación indebida','patrimonio.daños':'Daños','patrimonio.daños.simple':'Daños simples','patrimonio.daños.agravado':'Daños agravados',
    'patrimonio.receptacion':'Receptación','patrimonio.insolvencia':'Insolvencia','patrimonio.usura':'Usura','patrimonio.propiedad_intelectual':'Propiedad intelectual',
    'patrimonio.fraude_informatico':'Fraude informático','trabajadores':'Derechos Laborales','trabajadores.sindical':'Libertad sindical',
    'trabajadores.seguridad_laboral':'Seguridad laboral','trabajadores.discriminacion':'Discriminación laboral',
    'territorio_ambiente':'Territorio y Medio Ambiente','territorio_ambiente.urbanismo':'Urbanismo','territorio_ambiente.patrimonio_historico':'Patrimonio histórico',
    'territorio_ambiente.medio_ambiente':'Medio ambiente','territorio_ambiente.flora_fauna':'Flora y fauna','territorio_ambiente.incendio_forestal':'Incendio forestal',
    'salud_publica':'Salud Pública','salud_publica.drogas':'Drogas','salud_publica.drogas.trafico':'Tráfico de drogas','salud_publica.drogas.produccion':'Producción de drogas',
    'salud_publica.alimentarios':'Delitos alimentarios','salud_publica.farmaceuticos':'Delitos farmacéuticos','salud_publica.epidemias':'Epidemias',
    'seguridad_colectiva':'Seguridad Colectiva','seguridad_colectiva.incendios':'Incendios','seguridad_colectiva.vial':'Seguridad vial','seguridad_colectiva.radiactivo':'Seguridad nuclear',
    'fe_publica':'Fe Pública','fe_publica.moneda':'Falsificación de moneda','fe_publica.documentos_publicos':'Documentos públicos','fe_publica.documentos_privados':'Documentos privados',
    'fe_publica.usurpacion':'Usurpación','admin_publica':'Administración Pública','admin_publica.cohecho':'Cohecho','admin_publica.influencias':'Tráfico de influencias',
    'admin_publica.malversacion':'Malversación','admin_publica.fraudes':'Fraudes','admin_publica.abuso_autoridad':'Abuso de autoridad',
    'admin_publica.infidelidad':'Infidelidad documental','admin_publica.negociaciones':'Negociaciones prohibidas',
    'justicia':'Administración de Justicia','justicia.prevaricato':'Prevaricato','justicia.omision':'Omisión','justicia.encubrimiento':'Encubrimiento',
    'justicia.falso_testimonio':'Falso testimonio','justicia.quebrantamiento':'Quebrantamiento','justicia.obstruccion':'Obstrucción',
    'orden_publico':'Orden Público','orden_publico.atentados':'Atentados','orden_publico.resistencia':'Resistencia','orden_publico.desordenes':'Desórdenes','orden_publico.armas':'Armas',
    'constitucion':'Constitución','constitucion.rebelion':'Rebelión','constitucion.derechos_fundamentales':'Derechos fundamentales',
    'constitucion.expresion':'Libertad de expresión','constitucion.culto':'Libertad de culto','constitucion.electoral':'Delitos electorales',
    'seguridad_estado':'Seguridad del Estado','seguridad_estado.traicion':'Traición','seguridad_estado.secretos':'Secretos de Estado','seguridad_estado.espionaje':'Espionaje',
    'comunidad_internacional':'Comunidad Internacional','comunidad_internacional.genocidio':'Genocidio','comunidad_internacional.lesa_humanidad':'Lesa humanidad',
    'comunidad_internacional.desaparicion':'Desaparición forzada','comunidad_internacional.tortura':'Tortura','comunidad_internacional.pirateria':'Piratería',
  };

  const getRamaPath = (id: string | null | undefined): string => {
    if (!id) return '';
    const parts = id.split('.');
    const names = parts.map((_, i) => ramaNames[parts.slice(0, i+1).join('.')]).filter(Boolean);
    return names.join(' > ');
  };

  const constitucionNombres: Record<number,string> = {
    2:'Art. 2 Constitución',15:'Art. 15 Constitución',57:'Art. 57 Constitución',58:'Art. 58 Constitución',
    59:'Art. 59 Constitución',60:'Art. 60 Constitución',61:'Art. 61 Constitución',63:'Art. 63 Constitución',
    65:'Art. 65 Constitución',66:'Art. 66 Constitución',68:'Art. 68 Constitución',69:'Art. 69 Constitución',
    70:'Art. 70 Constitución',71:'Art. 71 Constitución',72:'Art. 72 Constitución',73:'Art. 73 Constitución',
    74:'Art. 74 Constitución',75:'Art. 75 Constitución',77:'Art. 77 Constitución',78:'Art. 78 Constitución',
    79:'Art. 79 Constitución',80:'Art. 80 Constitución',86:'Art. 86 Constitución',87:'Art. 87 Constitución',88:'Art. 88 Constitución',
  };

  const load = async () => {
    try {
      const [dRes, rRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/delitos?limit=1000`),
        fetch(`${BACKEND_URL}/api/clasificaciones`),
      ]);
      const dJson = await dRes.json();
      const rJson = await rRes.json();
      setDelitos(Array.isArray(dJson) ? dJson : []);
      setRamas(Array.isArray(rJson) ? rJson : []);
    } catch (e) {
      console.warn('load delitos', e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const filtered = delitos.filter((d) => {
    if (search) {
      const q = search.toLowerCase();
      if (
        !d.nombre.toLowerCase().includes(q) &&
        !d.articulo.toLowerCase().includes(q) &&
        !(d.conducta || '').toLowerCase().includes(q)
      )
        return false;
    }
    if (activeRama && d.rama_id !== activeRama) return false;
    return true;
  });

  const handleDelete = (delito: Delito) => {
    const doDelete = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/delitos/${delito.id}`, {
          method: 'DELETE',
        });
        if (res.ok) {
          setDelitos((prev) => prev.filter((d) => d.id !== delito.id));
          if (Platform.OS === 'web') {
            console.log('Delito eliminado');
          }
        } else {
          Alert.alert('Error', 'No se pudo eliminar el delito');
        }
      } catch (e) {
        Alert.alert('Error', 'No se pudo eliminar el delito');
      }
    };

    if (Platform.OS === 'web') {
      // eslint-disable-next-line no-alert
      if (confirm(`¿Eliminar "${delito.nombre}"? Esta acción no se puede deshacer.`)) {
        doDelete();
      }
    } else {
      Alert.alert(
        'Eliminar delito',
        `¿Eliminar "${delito.nombre}"? Esta acción no se puede deshacer.`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Eliminar', style: 'destructive', onPress: doDelete },
        ]
      );
    }
  };

  const renderItem = ({ item }: { item: Delito }) => (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.cardBody}
        activeOpacity={0.7}
        onPress={() =>
          router.push({ pathname: '/delito-form', params: { id: item.id } })
        }
      >
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle} numberOfLines={2}>
              {item.nombre}
            </Text>
            <View style={styles.metaRow}>
              <View style={styles.articuloPill}>
                <Text style={styles.articuloText}>{item.articulo}</Text>
              </View>
              {item.es_grave && (
                <View style={styles.gravePill}>
                  <Text style={styles.gravePillText}>GRAVE</Text>
                </View>
              )}
            </View>
          </View>
        </View>
        {!!item.conducta && (
          <Text style={styles.cardDesc} numberOfLines={2}>
            {item.conducta}
          </Text>
        )}
        <View style={styles.penaRow}>
          <MaterialCommunityIcons name="gavel" size={scale(14)} color={COLORS.accent} />
          <Text style={styles.penaText}>{item.pena_texto || `${item.pena_minima_meses}-${item.pena_maxima_meses} meses`}</Text>
        </View>
        <Text style={styles.clasifText} numberOfLines={1}>
          {getRamaPath(item.rama_id)}
        </Text>
        {item.constitucion_articulo_id && constitucionNombres[item.constitucion_articulo_id] && (
          <Text style={[styles.clasifText, { color: COLORS.primary, fontStyle: 'normal', marginTop: scale(2) }]} numberOfLines={1}>
            {constitucionNombres[item.constitucion_articulo_id]}
          </Text>
        )}
      </TouchableOpacity>

      <View style={styles.cardActions}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => router.push({ pathname: '/delito-form', params: { id: item.id } })}
        >
          <Ionicons name="create-outline" size={scale(18)} color={COLORS.primary} />
          <Text style={styles.actionText}>Editar</Text>
        </TouchableOpacity>
        <View style={styles.actionDivider} />
        <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(item)}>
          <Ionicons name="trash-outline" size={scale(18)} color={COLORS.danger} />
          <Text style={[styles.actionText, { color: COLORS.danger }]}>Eliminar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <Container style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.canGoBack() ? router.back() : router.replace('/')}>
          <Ionicons name="chevron-back" size={scale(26)} color={COLORS.white} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Catálogo de Delitos</Text>
          <Text style={styles.headerSub}>{filtered.length} resultados</Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push({ pathname: '/delito-form', params: {} })}
        >
          <Ionicons name="add" size={scale(22)} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={scale(18)} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nombre, artículo o conducta..."
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

        {/* Rama filters */}
        <FlatList
          horizontal
          data={[{ nombre: 'Todas', cantidad: delitos.length } as any, ...ramas.map(r => ({...r, nombre: r.id}))]}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: SPACING.md }}
          keyExtractor={(item: any) => item.nombre}
          renderItem={({ item }: any) => {
            const isAll = item.nombre === 'Todas';
            const isActive = isAll ? !activeRama : activeRama === item.nombre;
            return (
              <TouchableOpacity
                style={[styles.chip, isActive && styles.chipActive]}
                onPress={() => setActiveRama(isAll ? null : item.nombre)}
              >
                <Text style={[styles.chipText, isActive && styles.chipTextActive]} numberOfLines={1}>
                  {isAll ? 'Todas' : getRamaPath(item.nombre) || item.nombre}
                </Text>
                <View style={[styles.chipCount, isActive && styles.chipCountActive]}>
                  <Text style={[styles.chipCountText, isActive && styles.chipCountTextActive]}>
                    {item.cantidad}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: SPACING.md, paddingBottom: 120 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.accent]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <MaterialCommunityIcons
                name="text-search"
                size={scale(56)}
                color={COLORS.textMuted}
              />
              <Text style={styles.emptyTitle}>Sin resultados</Text>
              <Text style={styles.emptyDesc}>
                Modifica la búsqueda o registra un nuevo delito.
              </Text>
            </View>
          }
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { bottom: insets.bottom + SPACING.md }]}
        onPress={() => router.push({ pathname: '/delito-form', params: {} })}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={scale(26)} color={COLORS.white} />
      </TouchableOpacity>
    </Container>
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
  backBtn: {
    width: scale(32),
    height: scale(32),
    borderRadius: RADIUS.sm,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtn: {
    width: scale(32),
    height: scale(32),
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { color: COLORS.white, fontSize: fontScale(16), fontWeight: '700' },
  headerSub: { color: '#C9D1DD', fontSize: fontScale(10), marginTop: scale(2) },
  searchWrap: { backgroundColor: COLORS.primary, paddingBottom: scale(6) },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: Platform.OS === 'ios' ? scale(10) : scale(4),
    borderRadius: RADIUS.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: fontScale(14),
    color: COLORS.text,
    paddingVertical: scale(6),
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingVertical: scale(6),
    paddingHorizontal: scale(12),
    borderRadius: RADIUS.pill,
    marginRight: scale(8),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  chipActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  chipText: { color: '#D5DDEA', fontSize: fontScale(12), fontWeight: '600' },
  chipTextActive: { color: COLORS.primary },
  chipCount: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: scale(6),
    paddingVertical: scale(2),
    borderRadius: RADIUS.pill,
    minWidth: scale(22),
    alignItems: 'center',
  },
  chipCountActive: { backgroundColor: COLORS.primary },
  chipCountText: { fontSize: fontScale(10), fontWeight: '700', color: '#D5DDEA' },
  chipCountTextActive: { color: COLORS.accent },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    marginBottom: scale(8),
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  cardBody: { padding: scale(12) },
  cardHeader: { flexDirection: 'row', marginBottom: scale(6) },
  cardTitle: {
    fontSize: fontScale(15),
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: scale(6),
  },
  metaRow: { flexDirection: 'row', gap: scale(6), flexWrap: 'wrap' },
  articuloPill: {
    backgroundColor: COLORS.primary + '12',
    paddingHorizontal: scale(8),
    paddingVertical: scale(3),
    borderRadius: RADIUS.sm,
  },
  articuloText: { fontSize: fontScale(11), fontWeight: '700', color: COLORS.primary },
  gravePill: {
    backgroundColor: COLORS.danger + '15',
    paddingHorizontal: scale(8),
    paddingVertical: scale(3),
    borderRadius: RADIUS.sm,
  },
  gravePillText: {
    fontSize: fontScale(9),
    fontWeight: '800',
    color: COLORS.danger,
    letterSpacing: fontScale(0.5),
  },
  cardDesc: {
    fontSize: fontScale(12),
    color: COLORS.textSecondary,
    lineHeight: fontScale(17),
    marginTop: scale(4),
  },
  penaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
    marginTop: SPACING.sm,
    backgroundColor: COLORS.accent + '12',
    paddingVertical: scale(6),
    paddingHorizontal: scale(10),
    borderRadius: RADIUS.sm,
    alignSelf: 'flex-start',
  },
  penaText: { fontSize: fontScale(12), fontWeight: '700', color: COLORS.primary },
  clasifText: {
    fontSize: fontScale(11),
    color: COLORS.textMuted,
    marginTop: scale(8),
    fontStyle: 'italic',
  },
  cardActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale(6),
    paddingVertical: scale(10),
  },
  actionText: { fontSize: fontScale(13), fontWeight: '600', color: COLORS.primary },
  actionDivider: { width: 1, backgroundColor: COLORS.borderLight },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: scale(60),
    gap: scale(8),
  },
  emptyTitle: { fontSize: fontScale(16), fontWeight: '700', color: COLORS.text },
  emptyDesc: { fontSize: fontScale(13), color: COLORS.textMuted, textAlign: 'center' },
  fab: {
    position: 'absolute',
    right: scale(12),
    bottom: scale(16),
    width: scale(48),
    height: scale(48),
    borderRadius: scale(24),
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.lg,
  },
});
