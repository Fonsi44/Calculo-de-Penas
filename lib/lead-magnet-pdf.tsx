import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { site } from '@/lib/site';
import type { LeadMagnet } from '@/lib/lead-magnets';

const colors = {
  primary: '#1A2B4A',
  accent: '#C5A572',
  text: '#1F2330',
  textMuted: '#6B7280',
  surface: '#FFFFFF',
  surfaceAlt: '#F5F2EC',
  border: '#E5E7EB',
  success: '#1E7E5A',
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
  coverPage: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 120,
  },
  coverBrandLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 60,
  },
  coverBrandMark: {
    width: 36,
    height: 36,
    borderRadius: 4,
    backgroundColor: colors.primary,
    color: colors.accent,
    fontFamily: 'Helvetica-Bold',
    fontSize: 18,
    textAlign: 'center',
    paddingTop: 8,
    marginRight: 12,
  },
  coverBrandName: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 18,
    color: colors.primary,
  },
  coverGuideLabel: {
    fontSize: 11,
    color: colors.accent,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 20,
  },
  coverTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 26,
    color: colors.primary,
    textAlign: 'center',
    lineHeight: 1.3,
    marginBottom: 20,
  },
  coverSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 1.6,
    marginHorizontal: 30,
    marginBottom: 40,
  },
  coverDisclaimer: {
    fontSize: 8,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 12,
    marginBottom: 18,
    borderBottomWidth: 2,
    borderBottomColor: colors.accent,
  },
  headerTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 14,
    color: colors.primary,
  },
  sectionTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 14,
    color: colors.primary,
    marginBottom: 10,
    marginTop: 20,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.accent,
  },
  sectionBody: {
    fontSize: 10,
    color: colors.text,
    lineHeight: 1.7,
    marginBottom: 8,
  },
  bulletItem: {
    flexDirection: 'row',
    marginBottom: 4,
    paddingLeft: 12,
  },
  bullet: {
    width: 10,
    fontSize: 10,
    color: colors.accent,
  },
  bulletText: {
    flex: 1,
    fontSize: 10,
    color: colors.text,
    lineHeight: 1.6,
  },
  faqQuestion: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
    color: colors.primary,
    marginTop: 10,
    marginBottom: 4,
    paddingLeft: 8,
    borderLeftWidth: 2,
    borderLeftColor: colors.accent,
  },
  faqAnswer: {
    fontSize: 9.5,
    color: colors.text,
    lineHeight: 1.6,
    marginBottom: 10,
    paddingLeft: 16,
  },
  ctaBox: {
    marginTop: 24,
    padding: 16,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: 4,
  },
  ctaTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 12,
    color: colors.primary,
    marginBottom: 6,
  },
  ctaBody: {
    fontSize: 10,
    color: colors.text,
    lineHeight: 1.6,
    marginBottom: 8,
  },
  contactLine: {
    fontSize: 10,
    color: colors.text,
    marginBottom: 3,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 50,
    right: 50,
    fontSize: 7,
    color: colors.textMuted,
    textAlign: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
  },
});

const AREA_CONTENT: Record<string, { sections: { title: string; body: string[] }[]; faqs: { q: string; a: string }[] }> = {
  'derecho-penal': {
    sections: [
      {
        title: 'Sus derechos frente a un proceso penal',
        body: [
          'El derecho penal hondureño está regulado por el Código Penal (Decreto 130-2017) y sus reformas vigentes (119-2019, 46-2020, 93-2021, 59-2024). Toda persona tiene derecho a la presunción de inocencia, a ser informada de los cargos en su contra, a no declarar contra sí misma y a contar con asistencia letrada desde el primer momento.',
          'Conocer estos derechos es el primer paso para una defensa efectiva. No espere a que el proceso avance: cada hora cuenta.',
        ],
      },
      {
        title: 'Etapas del proceso penal hondureño',
        body: [
          'Investigación: El Ministerio Público investiga los hechos. Puede durar hasta 6 meses en casos comunes.',
          'Audiencia inicial: Se informa al imputado de los cargos y se decide sobre medidas cautelares.',
          'Audiencia preliminar: Se evalúa si existen elementos suficientes para ir a juicio.',
          'Juicio oral y público: Se presentan pruebas y se dicta sentencia.',
          'Recursos: Apelación, casación y revisión ante la Corte Suprema de Justicia.',
        ],
      },
      {
        title: 'Errores comunes que debe evitar',
        body: [
          'Declarar sin abogado presente: todo lo que diga puede usarse en su contra.',
          'No solicitar medidas sustitutivas a la prisión preventiva cuando proceden.',
          'Desconocer los plazos: cada etapa tiene términos que pueden beneficiarle si actúa a tiempo.',
          'Elegir un abogado sin experiencia en penal: el derecho penal es técnico y especializado.',
        ],
      },
    ],
    faqs: [
      { q: '¿Pueden defenderme si acabo de ser detenido?', a: 'Sí. La asistencia letrada es un derecho irrenunciable. Podemos acudir a la estación policial o al juzgado de inmediato.' },
      { q: '¿Cuánto cuesta una defensa penal?', a: 'Depende de la complejidad del caso. Ofrecemos consulta inicial confidencial para evaluar su situación y emitir un presupuesto claro por escrito.' },
      { q: '¿Qué es la prisión preventiva y cómo evitarla?', a: 'Es una medida cautelar excepcional. Existen medidas sustitutivas como fianza, arresto domiciliario o prohibición de salir del país. Su abogado debe solicitarlas si proceden.' },
    ],
  },
};

const DEFAULT_CONTENT: typeof AREA_CONTENT[string] = {
  sections: [
    {
      title: 'Información práctica sobre esta área del derecho',
      body: [
        'El sistema legal hondureño contempla normativa específica para esta área. Es fundamental contar con asesoría profesional para comprender sus derechos, obligaciones y las vías de acción disponibles.',
        'Cada caso es único y requiere un análisis individualizado por un abogado habilitado que conozca la legislación aplicable, la jurisprudencia vigente y la práctica forense en Honduras.',
      ],
    },
    {
      title: 'Aspectos clave que debe conocer',
      body: [
        'Requisitos legales y documentación necesaria para iniciar cualquier trámite o proceso.',
        'Plazos y términos que la ley establece — no dejarlos pasar puede perjudicar su caso.',
        'Costes y honorarios habituales en esta área, incluyendo tasas judiciales y notariales.',
        'Errores frecuentes que las personas cometen al intentar resolver estos asuntos sin abogado.',
      ],
    },
    {
      title: 'Recomendaciones prácticas',
      body: [
        'Solicite una consulta con un abogado antes de tomar cualquier decisión legal.',
        'Recopile y organice toda la documentación relacionada con su caso.',
        'No firme ningún documento sin revisión legal previa.',
        'Mantenga un registro de todas las comunicaciones y actuaciones.',
      ],
    },
  ],
  faqs: [
    { q: '¿Necesito abogado para este tipo de asuntos?', a: 'Aunque algunos trámites pueden parecer sencillos, la asesoría legal profesional evita errores que pueden ser costosos o irreversibles. Un abogado conoce los plazos, requisitos y estrategias adecuadas.' },
    { q: '¿Cuánto tiempo puede tomar resolver mi caso?', a: 'Depende de la complejidad y del tipo de procedimiento. En la consulta inicial podemos darle una estimación realista basada en nuestra experiencia con casos similares.' },
    { q: '¿Cómo funciona la evaluación inicial?', a: 'La evaluación inicial es confidencial: permite entender el caso, plantear una estrategia inicial y entregar un presupuesto por escrito antes de cualquier compromiso formal.' },
  ],
};

function getContentForArea(area: string) {
  return AREA_CONTENT[area] ?? DEFAULT_CONTENT;
}

interface LeadMagnetPdfProps {
  magnet: LeadMagnet;
}

export function LeadMagnetPdf({ magnet }: LeadMagnetPdfProps) {
  const content = getContentForArea(magnet.area);

  return (
    <Document title={magnet.titulo} author={site.name} creator={site.name}>
      {/* COVER PAGE */}
      <Page size="A4" style={[styles.page, styles.coverPage]}>
        <View style={styles.coverBrandLine}>
          <Text style={styles.coverBrandMark}>PA</Text>
          <Text style={styles.coverBrandName}>Pineda y Asociados</Text>
        </View>
        <Text style={styles.coverGuideLabel}>Guía Legal Descargable</Text>
        <Text style={styles.coverTitle}>{magnet.titulo}</Text>
        <Text style={styles.coverSubtitle}>{magnet.descripcion}</Text>
        <Text style={styles.coverDisclaimer}>
          Esta guía tiene fines informativos y no sustituye la asesoría legal personalizada.{'\n'}
          Consulte directamente con un abogado antes de tomar decisiones legales.{'\n'}
          © {new Date().getFullYear()} {site.name}. Todos los derechos reservados.
        </Text>
      </Page>

      {/* CONTENT PAGES */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Guía Legal: {magnet.titulo}</Text>
        </View>

        {content.sections.map((section, i) => (
          <React.Fragment key={i}>
            <Text style={styles.sectionTitle}>{i + 1}. {section.title}</Text>
            {section.body.map((p, j) => (
              <Text key={j} style={styles.sectionBody}>{p}</Text>
            ))}
          </React.Fragment>
        ))}

        <Text style={[styles.sectionTitle, { marginTop: 30 }]}>Preguntas frecuentes</Text>
        {content.faqs.map((faq, i) => (
          <React.Fragment key={i}>
            <Text style={styles.faqQuestion}>{faq.q}</Text>
            <Text style={styles.faqAnswer}>{faq.a}</Text>
          </React.Fragment>
        ))}

        <View style={styles.ctaBox}>
          <Text style={styles.ctaTitle}>¿Necesita asesoría legal en {magnet.titulo.replace('Guía legal: ', '')}?</Text>
          <Text style={styles.ctaBody}>
            Solicite una evaluación inicial confidencial. Nuestro equipo evaluará su caso
            y le explicará sus opciones con claridad y honestidad.
          </Text>
          <Text style={styles.contactLine}>📞 {site.phoneDisplay}</Text>
          <Text style={styles.contactLine}>📧 {site.email}</Text>
          <Text style={styles.contactLine}>🌐 {site.url}</Text>
        </View>

        <Text style={styles.footer}>
          {site.name} | {site.address.full} | {site.phoneDisplay} | Esta guía no constituye asesoría legal.
        </Text>
      </Page>
    </Document>
  );
}
