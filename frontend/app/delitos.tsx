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
import type { Delito, Clasificacion } from '../src/types';
import { scale, fontScale, useResponsive } from '../src/responsive';
import Container from '../src/Container';

export default function DelitosCatalog() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isTablet } = useResponsive();
  const [delitos, setDelitos] = useState<Delito[]>([]);
  const [clasificaciones, setClasificaciones] = useState<Clasificacion[]>([]);
  const [search, setSearch] = useState('');
  const [activeClasificacion, setActiveClasificacion] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const [dRes, cRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/delitos?limit=1000`),
        fetch(`${BACKEND_URL}/api/clasificaciones`),
      ]);
      const dJson = await dRes.json();
      const cJson = await cRes.json();
      setDelitos(Array.isArray(dJson) ? dJson : []);
      setClasificaciones(Array.isArray(cJson) ? cJson : []);
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
    if (activeClasificacion && d.clasificacion !== activeClasificacion) return false;
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
          {item.clasificacion}
        </Text>
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

        {/* Clasificacion filters */}
        <FlatList
          horizontal
          data={[{ nombre: 'Todas', cantidad: delitos.length } as any, ...clasificaciones]}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: SPACING.md }}
          keyExtractor={(item: any) => item.nombre}
          renderItem={({ item }: any) => {
            const isAll = item.nombre === 'Todas';
            const isActive = isAll ? !activeClasificacion : activeClasificacion === item.nombre;
            return (
              <TouchableOpacity
                style={[styles.chip, isActive && styles.chipActive]}
                onPress={() => setActiveClasificacion(isAll ? null : item.nombre)}
              >
                <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                  {item.nombre}
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
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + scale(4),
    gap: SPACING.sm,
  },
  backBtn: {
    width: scale(40),
    height: scale(40),
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtn: {
    width: scale(40),
    height: scale(40),
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { color: COLORS.white, fontSize: fontScale(18), fontWeight: '700' },
  headerSub: { color: '#C9D1DD', fontSize: fontScale(11), marginTop: scale(2) },
  searchWrap: { backgroundColor: COLORS.primary, paddingBottom: SPACING.sm + scale(4) },
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
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.sm + scale(4),
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  cardBody: { padding: SPACING.md },
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
    right: SPACING.md,
    width: scale(56),
    height: scale(56),
    borderRadius: scale(28),
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.lg,
  },
});
