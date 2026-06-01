import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING, RADIUS, SHADOWS, BACKEND_URL } from '../src/theme';
import { scale, fontScale, useResponsive } from '../src/responsive';
import Container from '../src/Container';
import type { Delito, Clasificacion } from '../src/types';

const DEFAULT_FORM = {
  nombre: '',
  articulo: '',
  conducta: '',
  clasificacion: '',
  pena_minima_meses: '',
  pena_maxima_meses: '',
  tiene_pena_alternativa: false,
  pena_alternativa_min: '',
  pena_alternativa_max: '',
  penas_accesorias: '',
  observaciones: '',
};

export default function DelitoForm() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id?: string }>();
  const isEdit = Boolean(params.id);
  const { isTablet } = useResponsive();

  const [form, setForm] = useState({ ...DEFAULT_FORM });
  const [clasificaciones, setClasificaciones] = useState<Clasificacion[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showClasifPicker, setShowClasifPicker] = useState(false);

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/clasificaciones`)
      .then((r) => r.json())
      .then((data) => setClasificaciones(Array.isArray(data) ? data : []))
      .catch(() => {});

    if (isEdit && params.id) {
      setLoading(true);
      fetch(`${BACKEND_URL}/api/delitos/${params.id}`)
        .then((r) => r.json())
        .then((d: Delito) => {
          setForm({
            nombre: d.nombre || '',
            articulo: d.articulo || '',
            conducta: d.conducta || '',
            clasificacion: d.clasificacion || '',
            pena_minima_meses: String(d.pena_minima_meses ?? ''),
            pena_maxima_meses: String(d.pena_maxima_meses ?? ''),
            tiene_pena_alternativa: !!d.tiene_pena_alternativa,
            pena_alternativa_min: String(d.pena_alternativa_min ?? ''),
            pena_alternativa_max: String(d.pena_alternativa_max ?? ''),
            penas_accesorias: (d.penas_accesorias || []).join(', '),
            observaciones: d.observaciones || '',
          });
        })
        .catch(() => Alert.alert('Error', 'No se pudo cargar el delito'))
        .finally(() => setLoading(false));
    }
  }, [params.id, isEdit]);

  const update = (k: keyof typeof DEFAULT_FORM, v: any) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const validate = () => {
    if (!form.nombre.trim()) return 'El nombre es obligatorio';
    if (!form.articulo.trim()) return 'El artículo es obligatorio';
    if (!form.clasificacion.trim()) return 'La clasificación es obligatoria';
    const min = parseInt(form.pena_minima_meses, 10);
    const max = parseInt(form.pena_maxima_meses, 10);
    if (isNaN(min) || min < 0) return 'Pena mínima inválida';
    if (isNaN(max) || max < min) return 'Pena máxima inválida';
    if (form.tiene_pena_alternativa) {
      const altMin = parseInt(form.pena_alternativa_min, 10);
      const altMax = parseInt(form.pena_alternativa_max, 10);
      if (isNaN(altMin) || isNaN(altMax) || altMax < altMin)
        return 'Pena alternativa inválida';
    }
    return null;
  };

  const handleSave = async () => {
    const err = validate();
    if (err) {
      Alert.alert('Validación', err);
      return;
    }
    setSaving(true);
    try {
      const payload = {
        nombre: form.nombre.trim(),
        articulo: form.articulo.trim(),
        conducta: form.conducta.trim(),
        clasificacion: form.clasificacion.trim(),
        pena_minima_meses: parseInt(form.pena_minima_meses, 10),
        pena_maxima_meses: parseInt(form.pena_maxima_meses, 10),
        tiene_pena_alternativa: form.tiene_pena_alternativa,
        pena_alternativa_min: form.tiene_pena_alternativa
          ? parseInt(form.pena_alternativa_min, 10) || 0
          : 0,
        pena_alternativa_max: form.tiene_pena_alternativa
          ? parseInt(form.pena_alternativa_max, 10) || 0
          : 0,
        penas_accesorias: form.penas_accesorias
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        observaciones: form.observaciones.trim() || null,
        es_grave: parseInt(form.pena_maxima_meses, 10) >= 60,
      };

      const url = isEdit
        ? `${BACKEND_URL}/api/delitos/${params.id}`
        : `${BACKEND_URL}/api/delitos`;
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const e = await res.text();
        throw new Error(e);
      }
      router.back();
    } catch (e: any) {
      Alert.alert('Error', `No se pudo guardar: ${e?.message || e}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!isEdit || !params.id) return;
    const doDelete = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/delitos/${params.id}`, {
          method: 'DELETE',
        });
        if (!res.ok) throw new Error();
        router.back();
      } catch {
        Alert.alert('Error', 'No se pudo eliminar');
      }
    };
    if (Platform.OS === 'web') {
      // eslint-disable-next-line no-alert
      if (confirm('¿Eliminar este delito? Acción irreversible.')) doDelete();
    } else {
      Alert.alert('Eliminar delito', '¿Eliminar este delito? Acción irreversible.', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  if (loading) {
    return (
      <View style={[styles.root, { paddingTop: insets.top, alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
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
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="close" size={scale(24)} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEdit ? 'Editar delito' : 'Nuevo delito'}
        </Text>
        <View style={{ width: scale(40) }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: scale(120) }}
        keyboardShouldPersistTaps="handled"
      >
        <Container>
          <Section title="Identificación" icon="bookmark-outline">
            <Field label="Nombre del delito *">
              <TextInput
                style={styles.input}
                value={form.nombre}
                onChangeText={(v) => update('nombre', v)}
                placeholder="Ej: Hurto agravado"
                placeholderTextColor={COLORS.textMuted}
              />
            </Field>
            <Field label="Artículo *">
              <TextInput
                style={styles.input}
                value={form.articulo}
                onChangeText={(v) => update('articulo', v)}
                placeholder="Ej: Art. 363 CP"
                placeholderTextColor={COLORS.textMuted}
              />
            </Field>
            <Field label="Clasificación *">
              <TouchableOpacity
                style={styles.input}
                onPress={() => setShowClasifPicker(!showClasifPicker)}
              >
                <Text
                  style={{
                    color: form.clasificacion ? COLORS.text : COLORS.textMuted,
                    flex: 1,
                    fontSize: fontScale(14),
                  }}
                >
                  {form.clasificacion || 'Selecciona o escribe la clasificación'}
                </Text>
                <Ionicons
                  name={showClasifPicker ? 'chevron-up' : 'chevron-down'}
                  size={scale(18)}
                  color={COLORS.textMuted}
                />
              </TouchableOpacity>
              {showClasifPicker && (
                <View style={styles.clasifPicker}>
                  <TextInput
                    style={[styles.input, { marginBottom: scale(8) }]}
                    value={form.clasificacion}
                    onChangeText={(v) => update('clasificacion', v)}
                    placeholder="Escribe una nueva o elige abajo"
                    placeholderTextColor={COLORS.textMuted}
                  />
                  <ScrollView style={{ maxHeight: scale(200) }}>
                    {clasificaciones.map((c) => (
                      <TouchableOpacity
                        key={c.nombre}
                        style={styles.clasifItem}
                        onPress={() => {
                          update('clasificacion', c.nombre);
                          setShowClasifPicker(false);
                        }}
                      >
                        <Text style={{ flex: 1, fontSize: fontScale(13), color: COLORS.text }}>
                          {c.nombre}
                        </Text>
                        <Text style={{ fontSize: fontScale(11), color: COLORS.textMuted }}>
                          {c.cantidad}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </Field>
            <Field label="Conducta tipificada">
              <TextInput
                style={[styles.input, styles.inputArea]}
                value={form.conducta}
                onChangeText={(v) => update('conducta', v)}
                placeholder="Descripción de la conducta sancionada"
                placeholderTextColor={COLORS.textMuted}
                multiline
                numberOfLines={3}
              />
            </Field>
          </Section>

          <Section title="Pena de prisión" icon="lock-closed-outline">
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Field label="Mínima (meses) *">
                  <TextInput
                    style={styles.input}
                    value={form.pena_minima_meses}
                    onChangeText={(v) => update('pena_minima_meses', v.replace(/[^0-9]/g, ''))}
                    placeholder="0"
                    placeholderTextColor={COLORS.textMuted}
                    keyboardType="numeric"
                  />
                </Field>
              </View>
              <View style={{ flex: 1 }}>
                <Field label="Máxima (meses) *">
                  <TextInput
                    style={styles.input}
                    value={form.pena_maxima_meses}
                    onChangeText={(v) => update('pena_maxima_meses', v.replace(/[^0-9]/g, ''))}
                    placeholder="0"
                    placeholderTextColor={COLORS.textMuted}
                    keyboardType="numeric"
                  />
                </Field>
              </View>
            </View>
            <Text style={styles.hint}>
              Tip: 1 año = 12 meses · 5 años = 60 meses · ≥60 meses ⇒ delito grave
            </Text>
          </Section>

          <Section title="Pena alternativa" icon="cash-outline">
            <View style={styles.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.switchTitle}>Posee pena alternativa</Text>
                <Text style={styles.switchDesc}>
                  Permite optar por multa u otra pena no privativa
                </Text>
              </View>
              <Switch
                value={form.tiene_pena_alternativa}
                onValueChange={(v) => update('tiene_pena_alternativa', v)}
                trackColor={{ false: COLORS.border, true: COLORS.accent }}
                thumbColor={COLORS.white}
              />
            </View>
            {form.tiene_pena_alternativa && (
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Field label="Mín. alternativa">
                    <TextInput
                      style={styles.input}
                      value={form.pena_alternativa_min}
                      onChangeText={(v) =>
                        update('pena_alternativa_min', v.replace(/[^0-9]/g, ''))
                      }
                      placeholder="0"
                      placeholderTextColor={COLORS.textMuted}
                      keyboardType="numeric"
                    />
                  </Field>
                </View>
                <View style={{ flex: 1 }}>
                  <Field label="Máx. alternativa">
                    <TextInput
                      style={styles.input}
                      value={form.pena_alternativa_max}
                      onChangeText={(v) =>
                        update('pena_alternativa_max', v.replace(/[^0-9]/g, ''))
                      }
                      placeholder="0"
                      placeholderTextColor={COLORS.textMuted}
                      keyboardType="numeric"
                    />
                  </Field>
                </View>
              </View>
            )}
          </Section>

          <Section title="Penas accesorias" icon="ribbon-outline">
            <Field label="Lista (separadas por coma)">
              <TextInput
                style={[styles.input, styles.inputArea]}
                value={form.penas_accesorias}
                onChangeText={(v) => update('penas_accesorias', v)}
                placeholder="Inhabilitación absoluta, Multa proporcional"
                placeholderTextColor={COLORS.textMuted}
                multiline
              />
            </Field>
          </Section>

          <Section title="Observaciones" icon="document-text-outline">
            <Field label="Notas adicionales">
              <TextInput
                style={[styles.input, styles.inputArea]}
                value={form.observaciones}
                onChangeText={(v) => update('observaciones', v)}
                placeholder="Apuntes técnicos, jurisprudencia, etc."
                placeholderTextColor={COLORS.textMuted}
                multiline
                numberOfLines={3}
              />
            </Field>
          </Section>

          {isEdit && (
            <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
              <Ionicons name="trash-outline" size={scale(18)} color={COLORS.danger} />
              <Text style={styles.deleteText}>Eliminar delito</Text>
            </TouchableOpacity>
          )}
        </Container>
      </ScrollView>

      {/* Footer save */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + SPACING.sm }]}>
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={() => router.back()}
        >
          <Text style={styles.cancelText}>Cancelar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.saveBtn, saving && { opacity: 0.7 }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <>
              <MaterialCommunityIcons name="content-save" size={scale(18)} color={COLORS.white} />
              <Text style={styles.saveText}>{isEdit ? 'Guardar cambios' : 'Crear delito'}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: any;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Ionicons name={icon} size={scale(16)} color={COLORS.accent} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: scale(12) }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
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
  headerTitle: {
    flex: 1,
    color: COLORS.white,
    fontSize: fontScale(17),
    fontWeight: '700',
    textAlign: 'center',
  },
  section: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
    marginBottom: scale(12),
    paddingBottom: scale(10),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  sectionTitle: {
    fontSize: fontScale(13),
    fontWeight: '700',
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: scale(1),
  },
  fieldLabel: {
    fontSize: fontScale(12),
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: scale(6),
  },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: scale(12),
    paddingVertical: Platform.OS === 'ios' ? scale(12) : scale(8),
    backgroundColor: COLORS.surfaceAlt,
    color: COLORS.text,
    fontSize: fontScale(14),
  },
  inputArea: {
    minHeight: scale(80),
    textAlignVertical: 'top',
  },
  row: { flexDirection: 'row', gap: scale(12) },
  hint: {
    fontSize: fontScale(11),
    color: COLORS.textMuted,
    fontStyle: 'italic',
    marginTop: scale(4),
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: scale(12),
  },
  switchTitle: { fontSize: fontScale(14), fontWeight: '600', color: COLORS.text },
  switchDesc: { fontSize: fontScale(11), color: COLORS.textMuted, marginTop: scale(2) },
  clasifPicker: {
    marginTop: scale(8),
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: RADIUS.md,
    padding: scale(10),
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  clasifItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: scale(10),
    paddingHorizontal: scale(8),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale(8),
    paddingVertical: scale(14),
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.danger + '40',
    backgroundColor: COLORS.danger + '10',
    marginTop: SPACING.sm,
  },
  deleteText: { color: COLORS.danger, fontWeight: '700', fontSize: fontScale(14) },
  footer: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    gap: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: scale(14),
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: { fontSize: fontScale(14), fontWeight: '600', color: COLORS.textSecondary },
  saveBtn: {
    flex: 2,
    flexDirection: 'row',
    paddingVertical: scale(14),
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale(8),
  },
  saveText: { fontSize: fontScale(14), fontWeight: '700', color: COLORS.white },
});
