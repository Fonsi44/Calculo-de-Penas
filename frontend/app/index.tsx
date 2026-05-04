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

export default function Home() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
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

  useEffect(() => {
    loadStats();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />

      {/* HERO HEADER */}
      <View style={styles.hero}>
        <View style={styles.heroOverlay} />
        <View style={styles.heroContent}>
          <View style={styles.brandRow}>
            <View style={styles.brandIcon}>
              <MaterialCommunityIcons name="scale-balance" size={28} color={COLORS.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.brandTitle}>LEX HONDURAS</Text>
              <Text style={styles.brandSubtitle}>Motor jurídico de cálculo de penas</Text>
            </View>
          </View>

          <Text style={styles.heroTitle}>Determine la pena{'\n'}con precisión técnica</Text>
          <Text style={styles.heroDesc}>
            Aplicación profesional basada en el Código Penal de Honduras (Decreto 130-2017).
          </Text>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.total}</Text>
              <Text style={styles.statLabel}>Delitos</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.clasificaciones}</Text>
              <Text style={styles.statLabel}>Clasificaciones</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>8</Text>
              <Text style={styles.statLabel}>Pasos</Text>
            </View>
          </View>
        </View>
      </View>

      {/* CONTENT */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={{ padding: SPACING.md, paddingBottom: SPACING.xxl }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.accent]} />
        }
      >
        <Text style={styles.sectionLabel}>Acciones principales</Text>

        {/* PRIMARY ACTION */}
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.primaryAction}
          onPress={() => router.push('/calculadora')}
        >
          <View style={styles.primaryActionIcon}>
            <MaterialCommunityIcons name="calculator-variant" size={32} color={COLORS.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.primaryActionTitle}>Calcular pena</Text>
            <Text style={styles.primaryActionDesc}>
              Flujo guiado de 8 pasos · concurso, agravantes, atenuantes
            </Text>
          </View>
          <View style={styles.primaryActionArrow}>
            <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
          </View>
        </TouchableOpacity>

        {/* SECONDARY ACTIONS */}
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.secondaryAction}
          onPress={() => router.push('/delitos')}
        >
          <View style={[styles.secondaryActionIcon, { backgroundColor: COLORS.accent + '22' }]}>
            <MaterialCommunityIcons name="book-open-variant" size={26} color={COLORS.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.secondaryActionTitle}>Catálogo de delitos</Text>
            <Text style={styles.secondaryActionDesc}>
              Buscar, crear, editar y eliminar tipos penales
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color={COLORS.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.secondaryAction}
          onPress={() => router.push({ pathname: '/delito-form', params: {} })}
        >
          <View style={[styles.secondaryActionIcon, { backgroundColor: COLORS.success + '22' }]}>
            <MaterialCommunityIcons name="plus-circle-outline" size={26} color={COLORS.success} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.secondaryActionTitle}>Registrar nuevo delito</Text>
            <Text style={styles.secondaryActionDesc}>
              Añadir un tipo penal personalizado al catálogo
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color={COLORS.textMuted} />
        </TouchableOpacity>

        {/* INFO PANEL */}
        <View style={styles.infoPanel}>
          <View style={styles.infoBadge}>
            <Ionicons name="shield-checkmark" size={14} color={COLORS.accent} />
            <Text style={styles.infoBadgeText}>Marco normativo</Text>
          </View>
          <Text style={styles.infoTitle}>Código Penal de Honduras</Text>
          <Text style={styles.infoBody}>
            Aplica reglas técnicas: reducción por complicidad y tentativa, mitad superior por
            agravantes, mitad inferior por atenuantes, eximentes completas e incompletas, y
            concursos real, ideal, medial y continuado.
          </Text>
        </View>

        <View style={styles.disclaimer}>
          <Ionicons name="information-circle-outline" size={16} color={COLORS.textMuted} />
          <Text style={styles.disclaimerText}>
            Este cálculo es orientativo y no sustituye la función jurisdiccional. La determinación
            definitiva corresponde a los tribunales de Honduras.
          </Text>
        </View>
      </ScrollView>
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
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg,
    borderBottomLeftRadius: RADIUS.xl,
    borderBottomRightRadius: RADIUS.xl,
    ...SHADOWS.lg,
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    right: -20,
    width: 200,
    height: 200,
    borderRadius: 200,
    backgroundColor: COLORS.primaryLight,
    opacity: 0.4,
  },
  heroContent: { position: 'relative' },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  brandIcon: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(201,165,92,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(201,165,92,0.4)',
  },
  brandTitle: {
    color: COLORS.accent,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 2,
  },
  brandSubtitle: {
    color: '#D5DDEA',
    fontSize: 11,
    marginTop: 2,
  },
  heroTitle: {
    color: COLORS.white,
    fontSize: 26,
    fontWeight: '800',
    lineHeight: 32,
    marginBottom: SPACING.xs,
  },
  heroDesc: {
    color: '#C9D1DD',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: SPACING.md,
  },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: RADIUS.md,
    padding: SPACING.sm + 2,
    alignItems: 'center',
  },
  statValue: {
    color: COLORS.accent,
    fontSize: 22,
    fontWeight: '800',
  },
  statLabel: {
    color: '#C9D1DD',
    fontSize: 10,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  content: { flex: 1 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: SPACING.sm,
    marginTop: SPACING.sm,
  },
  primaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    gap: SPACING.md,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.accent,
    ...SHADOWS.md,
    marginBottom: SPACING.md,
  },
  primaryActionIcon: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.accent + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryActionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
  },
  primaryActionDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 3,
  },
  primaryActionArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    gap: SPACING.md,
    marginBottom: SPACING.sm + 4,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.sm,
  },
  secondaryActionIcon: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryActionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  secondaryActionDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  infoPanel: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginTop: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.sm,
  },
  infoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    backgroundColor: COLORS.primary + '0F',
    borderRadius: RADIUS.pill,
    alignSelf: 'flex-start',
    marginBottom: SPACING.sm,
  },
  infoBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6,
  },
  infoBody: {
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.textSecondary,
  },
  disclaimer: {
    flexDirection: 'row',
    gap: SPACING.sm,
    padding: SPACING.md,
    marginTop: SPACING.md,
    backgroundColor: COLORS.warning + '14',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.warning + '40',
  },
  disclaimerText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
});
