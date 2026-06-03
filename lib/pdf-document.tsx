import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { DelitoConfig } from '@/lib/rules/v1/types';

const colors = {
  primary: '#1A2B4A',
  accent: '#C5A572',
  text: '#1F2330',
  textMuted: '#6B7280',
  textSecondary: '#4B5563',
  surface: '#FFFFFF',
  surfaceAlt: '#F5F2EC',
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  success: '#1E7E5A',
  danger: '#9B2C2C',
  warning: '#8A6D1B',
  info: '#1E5B8A',
  aggravation: '#9B2C2C',
  mitigation: '#1E5B8A',
  exemption: '#1E7E5A',
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 50,
    paddingBottom: 60,
    paddingHorizontal: 50,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: colors.text,
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 12,
    marginBottom: 18,
    borderBottomWidth: 2,
    borderBottomColor: colors.accent,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandMark: {
    width: 28,
    height: 28,
    borderRadius: 4,
    backgroundColor: colors.primary,
    color: colors.accent,
    fontFamily: 'Helvetica-Bold',
    fontSize: 14,
    textAlign: 'center',
    paddingTop: 6,
    marginRight: 10,
  },
  brandName: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 12,
    color: colors.primary,
    letterSpacing: 2,
  },
  brandSub: {
    fontSize: 8,
    color: colors.textMuted,
    marginTop: 1,
  },
  pageNum: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 8,
    color: colors.textMuted,
  },
  footerLine: {
    position: 'absolute',
    bottom: 50,
    left: 50,
    right: 50,
    height: 0.5,
    backgroundColor: colors.border,
  },
  footer: {
    position: 'absolute',
    bottom: 32,
    left: 50,
    right: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 7,
    color: colors.textMuted,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: colors.primary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 10,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  metaItem: {
    fontSize: 9,
    color: colors.textSecondary,
    marginRight: 16,
    marginBottom: 4,
  },
  metaLabel: {
    fontFamily: 'Helvetica-Bold',
    color: colors.textMuted,
    textTransform: 'uppercase',
    fontSize: 7,
    letterSpacing: 1,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginTop: 14,
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  penaPrincipalBox: {
    backgroundColor: colors.surfaceAlt,
    borderLeftWidth: 4,
    borderLeftColor: colors.accent,
    padding: 14,
    marginBottom: 14,
  },
  penaPrincipalLabel: {
    fontSize: 8,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  penaPrincipalValue: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: colors.primary,
    marginBottom: 4,
  },
  penaPrincipalRango: {
    fontSize: 9,
    color: colors.textSecondary,
  },
  accesoriaBox: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 8,
    marginBottom: 4,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  accesoriaBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent,
    marginRight: 8,
    marginTop: 4,
  },
  accesoriaText: {
    flex: 1,
    fontSize: 9,
    color: colors.text,
  },
  delitoCard: {
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
    marginBottom: 8,
    backgroundColor: colors.surface,
  },
  delitoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  delitoNum: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary,
    color: '#FFFFFF',
    fontFamily: 'Helvetica-Bold',
    fontSize: 11,
    textAlign: 'center',
    paddingTop: 5,
    marginRight: 8,
  },
  delitoTitle: {
    flex: 1,
    fontFamily: 'Helvetica-Bold',
    fontSize: 11,
    color: colors.primary,
  },
  delitoArt: {
    fontSize: 8,
    color: colors.textMuted,
    fontFamily: 'Helvetica-Bold',
  },
  penaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
    paddingVertical: 2,
  },
  penaRowLabel: {
    fontSize: 8,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  penaRowValue: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: colors.text,
  },
  modifItem: {
    fontSize: 8,
    color: colors.textSecondary,
    marginBottom: 2,
    paddingLeft: 8,
  },
  modifBullet: {
    color: colors.accent,
    marginRight: 4,
  },
  analisisBox: {
    backgroundColor: colors.surfaceAlt,
    padding: 10,
    marginBottom: 10,
    fontSize: 9,
    lineHeight: 1.5,
    color: colors.text,
  },
  fundamentoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  artChip: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: colors.primary,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 0.5,
    borderColor: colors.border,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 4,
    marginBottom: 4,
  },
  disclaimer: {
    marginTop: 18,
    padding: 10,
    backgroundColor: colors.surfaceAlt,
    borderLeftWidth: 3,
    borderLeftColor: colors.warning,
    fontSize: 8,
    color: colors.textSecondary,
    lineHeight: 1.5,
    fontStyle: 'italic',
  },
  warnBadge: {
    fontSize: 7,
    color: colors.danger,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginRight: 6,
  },
  badge: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 2,
    marginLeft: 4,
  },
  badgeAggravation: { backgroundColor: '#FCEDEA', color: colors.aggravation },
  badgeMitigation: { backgroundColor: '#E5EFF5', color: colors.mitigation },
  badgeExemption: { backgroundColor: '#E1F2EA', color: colors.exemption },
});

interface DelitoAnalizado {
  delito: { id: number | string; nombre: string; articulo: string; clasificacion?: string; penas_accesorias?: string[] };
  pena_min: number;
  pena_max: number;
  pena_recomendada: number;
  pena_recomendada_texto?: string;
  gravedad: string;
  tipo_pena: string;
  exento: boolean;
  pena_base_min?: number;
  pena_base_max?: number;
  modificaciones: string[];
  penas_accesorias?: string[];
  agravantes_aplicadas?: string[];
  atenuantes_aplicadas?: string[];
}

interface Calculo {
  id: string;
  config: DelitoConfig;
  resultado: {
    delitos_analizados: DelitoAnalizado[];
    tipo_concurso: string;
    concurso_descripcion: string;
    concurso_articulo: string;
    pena_principal: string;
    pena_principal_minimo_meses: number;
    pena_principal_maximo_meses: number;
    penas_accesorias: string[];
    analisis_juridico: string;
    fecha: string;
    disclaimer: string;
  };
  creadoEn: string;
}

interface Caso {
  id: string;
  titulo: string;
  cliente: string | null;
  estado: string;
  creadoEn: string;
  calculos: Calculo[];
}

function formatMeses(meses: number): string {
  if (!Number.isFinite(meses) || meses <= 0) return '0 meses';
  const anios = Math.floor(meses / 12);
  const m = meses % 12;
  if (anios === 0) return `${m} ${m === 1 ? 'mes' : 'meses'}`;
  if (m === 0) return `${anios} ${anios === 1 ? 'año' : 'años'}`;
  return `${anios} ${anios === 1 ? 'año' : 'años'} y ${m} ${m === 1 ? 'mes' : 'meses'}`;
}

function formatFecha(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('es-HN', { day: '2-digit', month: 'long', year: 'numeric' });
  } catch { return iso; }
}

function formatFechaHora(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString('es-HN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch { return iso; }
}

function ArticuloChip({ n }: { n: number }) {
  return <Text style={styles.artChip}>Art. {n}</Text>;
}

function CalculoSection({ calc, index }: { calc: Calculo; index: number }) {
  const r = calc.resultado;
  return (
    <View wrap={false}>
      <Text style={styles.sectionTitle}>Cálculo {index + 1} — {formatFechaHora(calc.creadoEn)}</Text>

      <View style={styles.penaPrincipalBox}>
        <Text style={styles.penaPrincipalLabel}>Pena principal</Text>
        <Text style={styles.penaPrincipalValue}>{r.pena_principal}</Text>
        <Text style={styles.penaPrincipalRango}>
          Marco: {formatMeses(r.pena_principal_minimo_meses)} – {formatMeses(r.pena_principal_maximo_meses)}
          {r.concurso_articulo ? ` · ${r.concurso_articulo}` : ''}
        </Text>
      </View>

      {r.penas_accesorias && r.penas_accesorias.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Penas accesorias</Text>
          {r.penas_accesorias.map((a, i) => (
            <View key={i} style={styles.accesoriaBox}>
              <View style={styles.accesoriaBullet} />
              <Text style={styles.accesoriaText}>{a}</Text>
            </View>
          ))}
        </>
      )}

      <Text style={styles.sectionTitle}>I. Delitos analizados</Text>
      {r.delitos_analizados.map((d, i) => (
        <View key={i} style={styles.delitoCard} wrap={false}>
          <View style={styles.delitoHeader}>
            <Text style={styles.delitoNum}>{i + 1}</Text>
            <Text style={styles.delitoTitle}>{d.delito.nombre}</Text>
            <Text style={styles.delitoArt}>{d.delito.articulo}</Text>
          </View>

          <View style={styles.penaRow}>
            <Text style={styles.penaRowLabel}>Pena base ({d.tipo_pena})</Text>
            <Text style={styles.penaRowValue}>
              {d.pena_base_min !== undefined && d.pena_base_max !== undefined
                ? `${formatMeses(d.pena_base_min)} – ${formatMeses(d.pena_base_max)}`
                : '—'}
            </Text>
          </View>

          <View style={styles.penaRow}>
            <Text style={styles.penaRowLabel}>Pena resultante</Text>
            <Text style={styles.penaRowValue}>
              {d.exento
                ? 'EXENTO (Art. 30 CP)'
                : `${formatMeses(d.pena_min)} – ${formatMeses(d.pena_max)}`}
            </Text>
          </View>

          <View style={styles.penaRow}>
            <Text style={styles.penaRowLabel}>Pena recomendada</Text>
            <Text style={styles.penaRowValue}>
              {d.exento ? '—' : formatMeses(d.pena_recomendada)}
            </Text>
          </View>

          <View style={styles.penaRow}>
            <Text style={styles.penaRowLabel}>Gravedad</Text>
            <Text style={styles.penaRowValue}>{d.gravedad}</Text>
          </View>

          {d.modificaciones && d.modificaciones.length > 0 && (
            <View style={{ marginTop: 6 }}>
              <Text style={[styles.penaRowLabel, { marginBottom: 3 }]}>Modificaciones aplicadas</Text>
              {d.modificaciones.map((m, j) => (
                <Text key={j} style={styles.modifItem}>
                  <Text style={styles.modifBullet}>›</Text> {m}
                </Text>
              ))}
            </View>
          )}

          {d.penas_accesorias && d.penas_accesorias.length > 0 && (
            <View style={{ marginTop: 6 }}>
              <Text style={[styles.penaRowLabel, { marginBottom: 3 }]}>Accesorias del tipo penal</Text>
              {d.penas_accesorias.map((a, j) => (
                <Text key={j} style={styles.modifItem}>
                  <Text style={styles.modifBullet}>›</Text> {a}
                </Text>
              ))}
            </View>
          )}
        </View>
      ))}

      <Text style={styles.sectionTitle}>II. Concurso aplicable</Text>
      <View style={styles.analisisBox}>
        <Text>{r.concurso_descripcion}</Text>
      </View>

      <Text style={styles.sectionTitle}>III. Análisis jurídico</Text>
      <View style={styles.analisisBox}>
        {r.analisis_juridico.split('\n').map((line, i) => (
          <Text key={i} style={{ marginBottom: 2 }}>{line || ' '}</Text>
        ))}
      </View>

      <Text style={styles.sectionTitle}>IV. Fundamento normativo</Text>
      <View style={styles.fundamentoGrid}>
        <ArticuloChip n={19} />
        <ArticuloChip n={21} />
        <ArticuloChip n={25} />
        <ArticuloChip n={26} />
        <ArticuloChip n={27} />
        <ArticuloChip n={30} />
        <ArticuloChip n={31} />
        <ArticuloChip n={32} />
        <ArticuloChip n={60} />
        <ArticuloChip n={61} />
        <ArticuloChip n={62} />
        <ArticuloChip n={66} />
        <ArticuloChip n={67} />
        <ArticuloChip n={68} />
        <ArticuloChip n={69} />
        <ArticuloChip n={70} />
      </View>

      <View style={styles.disclaimer}>
        <Text>
          <Text style={styles.warnBadge}>Aviso legal — </Text>
          {r.disclaimer}
        </Text>
      </View>
    </View>
  );
}

export function CasoPDFDocument({ caso }: { caso: Caso }) {
  const totalCalculos = caso.calculos.length;
  return (
    <Document
      title={`Informe pericial — ${caso.titulo}`}
      author="LEX HONDURAS"
      subject="Cálculo de pena — Código Penal de Honduras (Decreto 130-2017)"
      creator="LEX HONDURAS — Motor de Cálculo de Penas"
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.header} fixed>
          <View style={styles.brand}>
            <Text style={styles.brandMark}>L</Text>
            <View>
              <Text style={styles.brandName}>LEX HONDURAS</Text>
              <Text style={styles.brandSub}>Informe pericial de cálculo de pena</Text>
            </View>
          </View>
        </View>

        <Text style={styles.title}>{caso.titulo}</Text>
        <Text style={styles.subtitle}>Marco legal: Código Penal de Honduras — Decreto 130-2017</Text>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Cliente</Text>
            <Text>{caso.cliente || 'No especificado'}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Estado</Text>
            <Text>{caso.estado}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Creado</Text>
            <Text>{formatFecha(caso.creadoEn)}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Cálculos</Text>
            <Text>{totalCalculos}</Text>
          </View>
        </View>

        {caso.calculos.length === 0 ? (
          <View style={styles.disclaimer}>
            <Text>Este caso no contiene cálculos guardados.</Text>
          </View>
        ) : (
          caso.calculos.map((calc, i) => (
            <CalculoSection key={calc.id} calc={calc} index={i} />
          ))
        )}

        <View style={styles.footerLine} fixed />
        <View style={styles.footer} fixed>
          <Text>LEX HONDURAS · info@lexhn.app</Text>
          <Text>Generado el {formatFechaHora(new Date().toISOString())}</Text>
        </View>

        <Text style={styles.pageNum} fixed render={({ pageNumber, totalPages }) => (
          `Página ${pageNumber} de ${totalPages}`
        )} />
      </Page>
    </Document>
  );
}
