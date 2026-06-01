import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Platform,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING, RADIUS, SHADOWS, BACKEND_URL } from '../src/theme';
import { scale, fontScale, useResponsive } from '../src/responsive';
import Container from '../src/Container';

export default function Home() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isTablet } = useResponsive();
  const [stats, setStats] = useState({ total: 0, clasificaciones: 0 });
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = async () => {
    try {
      const [countRes, clasRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/delitos/count`),
        fetch(`${BACKEND_URL}/api/clasificaciones`),
      ]);
      const count = await countRes.json();
      const clas = await clasRes.json();
      setStats({
        total: count.total ?? 0,
        clasificaciones: Array.isArray(clas) ? clas.length : 0,
      });
    } catch (e) {
      console.warn('Stats error', e);
    }
  };

  useEffect(() => { loadStats(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />
      <View style={styles.hero}>
        <View pointerEvents="none" style={[styles.heroOverlay, { width: scale(200), height: scale(200), borderRadius: scale(200), zIndex: 0 }]} />
        <View style={styles.heroContent}>
          <View style={styles.brandRow}>
            <View style={[styles.brandIcon, { width: scale(36), height: scale(36), borderRadius: RADIUS.sm, marginRight: scale(8) }]}>
              <MaterialCommunityIcons name="scale-balance" size={fontScale(18)} color={COLORS.accent} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text numberOfLines={1} style={[styles.brandTitle, { fontSize: fontScale(12) }]}>LEX HONDURAS</Text>
              <Text style={[styles.brandSubtitle, { fontSize: fontScale(10) }]}>Motor juridico de calculo de penas</Text>
            </View>
          </View>

          <Text style={[styles.heroTitle, { fontSize: fontScale(20), lineHeight: fontScale(24) }]}>
            Determine la pena con precision tecnica
          </Text>
          <Text style={[styles.heroDesc, { fontSize: fontScale(12), lineHeight: fontScale(16) }]}>
            Codigo Penal de Honduras (Decreto 130-2017)
          </Text>

          <View style={[styles.statsRow, isTablet && styles.statsRowTablet]}>
            {[
              { value: stats.total, label: 'Delitos' },
              { value: stats.clasificaciones, label: 'Clasificaciones' },
              { value: 8, label: 'Pasos' },
            ].map((s, i) => (
              <View key={i} style={[styles.statCard, isTablet && { padding: scale(12) }]}>
                <Text style={[styles.statValue, { fontSize: fontScale(22) }]}>{s.value}</Text>
                <Text style={[styles.statLabel, { fontSize: fontScale(10) }]}>{s.label}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <Container style={{ paddingBottom: SPACING.lg }}>
        <ScrollView
          contentContainerStyle={{ padding: scale(12) }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.accent]} />
          }
        >
          <Text style={styles.sectionLabel}>Acciones principales</Text>

          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.primaryAction, isTablet && { padding: scale(16) }]}
            onPress={() => router.push('/calculadora')}
          >
            <View style={[styles.primaryActionIcon, { width: scale(44), height: scale(44), borderRadius: RADIUS.sm }]}>
              <MaterialCommunityIcons name="calculator-variant" size={fontScale(22)} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={[styles.primaryActionTitle, { fontSize: fontScale(15) }]}>Calcular pena</Text>
              <Text style={[styles.primaryActionDesc, { fontSize: fontScale(11) }]}>
                Flujo guiado de 8 pasos · concurso, agravantes, atenuantes
              </Text>
            </View>
            <View style={[styles.primaryActionArrow, { width: scale(28), height: scale(28), borderRadius: scale(14) }]}>
              <Ionicons name="arrow-forward" size={fontScale(16)} color={COLORS.white} />
            </View>
          </TouchableOpacity>

          {[
            {
              title: 'Catalogo de delitos',
              desc: 'Buscar, crear, editar y eliminar tipos penales',
              icon: 'book-open-variant' as const,
              color: COLORS.accent,
              onPress: () => router.push('/delitos'),
            },
            {
              title: 'Registrar nuevo delito',
              desc: 'Anadir un tipo penal personalizado al catalogo',
              icon: 'plus-circle-outline' as const,
              color: COLORS.success,
              onPress: () => router.push({ pathname: '/delito-form', params: {} }),
            },
          ].map((item, i) => (
            <TouchableOpacity
              key={i}
              activeOpacity={0.85}
              style={[styles.secondaryAction, isTablet && { padding: scale(14) }]}
              onPress={item.onPress}
            >
              <View style={[styles.secondaryActionIcon, { width: scale(40), height: scale(40), borderRadius: RADIUS.sm, backgroundColor: item.color + '22' }]}>
                <MaterialCommunityIcons name={item.icon} size={fontScale(20)} color={item.color} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={[styles.secondaryActionTitle, { fontSize: fontScale(14) }]}>{item.title}</Text>
                <Text style={[styles.secondaryActionDesc, { fontSize: fontScale(11) }]}>{item.desc}</Text>
              </View>
              <Ionicons name="chevron-forward" size={fontScale(18)} color={COLORS.textMuted} />
            </TouchableOpacity>
          ))}

          <View style={[styles.infoPanel, isTablet && { padding: scale(14) }]}>
            <View style={styles.infoBadge}>
              <Ionicons name="shield-checkmark" size={fontScale(12)} color={COLORS.accent} />
              <Text style={[styles.infoBadgeText, { fontSize: fontScale(9) }]}>Marco normativo</Text>
            </View>
            <Text style={[styles.infoTitle, { fontSize: fontScale(14) }]}>Codigo Penal de Honduras</Text>
            <Text style={[styles.infoBody, { fontSize: fontScale(12), lineHeight: fontScale(16) }]}>
              Aplica reglas tecnicas: reduccion por complicidad y tentativa, mitad superior por
              agravantes, mitad inferior por atenuantes, eximentes completas e incompletas, y
              concursos real, ideal, medial y continuado.
            </Text>
          </View>

          <View style={styles.disclaimer}>
            <Ionicons name="information-circle-outline" size={fontScale(14)} color={COLORS.textMuted} />
            <Text style={[styles.disclaimerText, { fontSize: fontScale(10), lineHeight: fontScale(14) }]}>
              Este calculo es orientativo y no sustituye la funcion jurisdiccional.
            </Text>
          </View>
        </ScrollView>
      </Container>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  hero: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
    borderBottomLeftRadius: RADIUS.xl,
    borderBottomRightRadius: RADIUS.xl,
    ...SHADOWS.lg,
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    right: -scale(20),
    backgroundColor: COLORS.primaryLight,
    opacity: 0.4,
  },
  heroContent: { position: 'relative', zIndex: 1 },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    flexWrap: 'nowrap',
  },
  brandIcon: {
    backgroundColor: 'rgba(201,165,92,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(201,165,92,0.4)',
    marginRight: scale(8),
  },
  brandTitle: {
    color: COLORS.accent,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 2,
    flexShrink: 1,
  },
  brandSubtitle: {
    color: '#D5DDEA',
    fontSize: 11,
    marginTop: 2,
  },
  heroTitle: {
    color: COLORS.white,
    fontWeight: '800',
    marginBottom: SPACING.xs,
  },
  heroDesc: {
    color: '#C9D1DD',
    marginBottom: SPACING.sm,
  },
  statsRow: {
    flexDirection: 'row',
    gap: scale(6),
    marginTop: SPACING.xs,
  },
  statsRowTablet: {
    maxWidth: 500,
    alignSelf: 'center',
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: RADIUS.sm,
    padding: scale(8),
    alignItems: 'center',
  },
  statValue: {
    color: COLORS.accent,
    fontWeight: '800',
  },
  statLabel: {
    color: '#C9D1DD',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: scale(6),
    marginTop: 0,
  },
  primaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: scale(12),
    borderRadius: RADIUS.md,
    // gap not universally supported on RN web; use explicit margins on children
    borderLeftWidth: 3,
    borderLeftColor: COLORS.accent,
    ...SHADOWS.md,
    marginBottom: scale(10),
  },
  primaryActionIcon: {
    backgroundColor: COLORS.accent + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scale(10),
  },
  primaryActionTitle: {
    fontWeight: '700',
    color: COLORS.text,
  },
  primaryActionDesc: {
    color: COLORS.textSecondary,
    marginTop: 3,
  },
  primaryActionArrow: {
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: scale(11),
    borderRadius: RADIUS.md,
    // gap not universally supported; children use explicit spacing
    marginBottom: scale(8),
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.sm,
  },
  secondaryActionIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scale(10),
  },
  secondaryActionTitle: {
    fontWeight: '700',
    color: COLORS.text,
  },
  secondaryActionDesc: {
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  infoPanel: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: scale(12),
    marginTop: scale(10),
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.sm,
  },
  infoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(4),
    paddingHorizontal: scale(8),
    paddingVertical: scale(3),
    backgroundColor: COLORS.primary + '0F',
    borderRadius: RADIUS.pill,
    alignSelf: 'flex-start',
    marginBottom: scale(6),
  },
  infoBadgeText: {
    fontWeight: '700',
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  infoTitle: {
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: scale(4),
  },
  infoBody: {
    color: COLORS.textSecondary,
  },
  disclaimer: {
    flexDirection: 'row',
    gap: scale(8),
    padding: scale(10),
    marginTop: scale(10),
    backgroundColor: COLORS.warning + '14',
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.warning + '40',
  },
  disclaimerText: {
    flex: 1,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
});
