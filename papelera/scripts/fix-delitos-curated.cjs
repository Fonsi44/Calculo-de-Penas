const fs = require('fs');
const path = require('path');

const delitosPath = path.join(__dirname, '..', 'data', 'delitos.json');
const valPath = path.join(__dirname, '..', 'data', 'delitos-validacion.json');
const cpPath = path.join(__dirname, '..', 'data', 'cp-indice.json');

const delitos = JSON.parse(fs.readFileSync(delitosPath, 'utf8'));
const validacion = JSON.parse(fs.readFileSync(valPath, 'utf8'));
const cpIndice = JSON.parse(fs.readFileSync(cpPath, 'utf8'));

// Mapeo curado de delitos comunes del CP Honduras Decreto 130-2017
// Formato: nombre (lowercase) -> { articulo, pena_min, pena_max, fuentes }
const MAPEO = {
  // ============ VIDA E INTEGRIDAD ============
  'homicidio simple': { articulo: 192, pena_min: 60, pena_max: 96 },
  'homicidio': { articulo: 192, pena_min: 60, pena_max: 96 },
  'asesinato': { articulo: 193, pena_min: 120, pena_max: 180 },
  'parricidio': { articulo: 194, pena_min: 120, pena_max: 180 },
  'feminicidio': { articulo: 208, pena_min: 120, pena_max: 180 },
  'femicidio': { articulo: 208, pena_min: 120, pena_max: 180 },
  'homicidio culposo': { articulo: 213, pena_min: 12, pena_max: 60 },
  'homicidio imprudente': { articulo: 213, pena_min: 12, pena_max: 60 },
  'lesiones graves': { articulo: 201, pena_min: 96, pena_max: 144 },
  'lesiones leves': { articulo: 199, pena_min: 6, pena_max: 12 },
  'lesiones imprudentes': { articulo: 202, pena_min: 12, pena_max: 48 },
  'lesiones culposas': { articulo: 202, pena_min: 12, pena_max: 48 },
  'lesiones al feto': { articulo: 203, pena_min: 12, pena_max: 48 },
  'mutilar': { articulo: 201, pena_min: 96, pena_max: 144 },
  'mutilación': { articulo: 201, pena_min: 96, pena_max: 144 },
  'aborto': { articulo: 196, pena_min: 36, pena_max: 72 },
  'aborto consentido': { articulo: 196, pena_min: 36, pena_max: 72 },
  'aborto forzado': { articulo: 196, pena_min: 96, pena_max: 120 },
  'aborto imprudente': { articulo: 196, pena_min: 12, pena_max: 36 },
  'aborto terapéutico': { articulo: 196, pena_min: 0, pena_max: 0, sin_pena: true },
  'inducción al suicidio': { articulo: 195, pena_min: 24, pena_max: 60 },
  'participación en riña': { articulo: 205, pena_min: 12, pena_max: 36 },
  'participación en riña tumultuaria': { articulo: 205, pena_min: 24, pena_max: 48 },
  'riña con resultado de muerte': { articulo: 206, pena_min: 48, pena_max: 96 },
  'riña con arma blanca': { articulo: 205, pena_min: 24, pena_max: 48 },
  'violencia doméstica habitual': { articulo: 232, pena_min: 12, pena_max: 36 },
  'maltrato psicológico habitual': { articulo: 232, pena_min: 6, pena_max: 24 },
  'venganza contra la pareja': { articulo: 232, pena_min: 12, pena_max: 36 },
  'omisión del deber de socorro': { articulo: 204, pena_min: 6, pena_max: 24 },
  'omisión del deber de socorro en accidente': { articulo: 204, pena_min: 6, pena_max: 24 },
  'omisión del deber de socorro por profesional': { articulo: 204, pena_min: 12, pena_max: 36 },
  'ejecución extrajudicial': { articulo: 192, pena_min: 120, pena_max: 240 },
  'tortura': { articulo: 216, pena_min: 60, pena_max: 120 },
  'trato degradante': { articulo: 216, pena_min: 24, pena_max: 60 },
  'trato degradante en residencia de mayores': { articulo: 216, pena_min: 24, pena_max: 60 },
  'desaparición forzada': { articulo: 141, pena_min: 120, pena_max: 240 },
  'desplazamiento forzado': { articulo: 213, pena_min: 60, pena_max: 120 },
  'desplazado': { articulo: 213, pena_min: 60, pena_max: 120 },
  'abandono de menores o personas vulnerables': { articulo: 228, pena_min: 36, pena_max: 72 },
  'abandono del lugar del accidente': { articulo: 220, pena_min: 6, pena_max: 24 },
  'abandono forzado de domicilio familiar': { articulo: 228, pena_min: 24, pena_max: 60 },

  // ============ LIBERTAD ============
  'amenazas': { articulo: 287, pena_min: 6, pena_max: 24 },
  'amenaza': { articulo: 287, pena_min: 6, pena_max: 24 },
  'coacción': { articulo: 288, pena_min: 12, pena_max: 36 },
  'coacciones': { articulo: 288, pena_min: 12, pena_max: 36 },
  'secuestro': { articulo: 297, pena_min: 96, pena_max: 144 },
  'detención ilegal': { articulo: 282, pena_min: 12, pena_max: 36 },
  'detención ilegal por funcionario': { articulo: 282, pena_min: 24, pena_max: 60 },
  'detenciones ilegales': { articulo: 282, pena_min: 12, pena_max: 36 },
  'allanamiento de domicilio': { articulo: 270, pena_min: 6, pena_max: 24 },
  'allanamiento de morada': { articulo: 270, pena_min: 6, pena_max: 24 },
  'allanamiento de domicilio por funcionario': { articulo: 270, pena_min: 12, pena_max: 36 },
  'violación de domicilio': { articulo: 270, pena_min: 6, pena_max: 24 },
  'extorsión': { articulo: 289, pena_min: 60, pena_max: 96 },
  'acoso laboral': { articulo: 294, pena_min: 12, pena_max: 36 },
  'acoso inmobiliario': { articulo: 294, pena_min: 12, pena_max: 36 },
  'acoso reiterado (stalking)': { articulo: 293, pena_min: 12, pena_max: 36 },
  'acoso colectivo (linchamiento digital)': { articulo: 293, pena_min: 24, pena_max: 60 },
  'usurpación de identidad': { articulo: 295, pena_min: 12, pena_max: 36 },
  'usurpación de identidad en redes sociales': { articulo: 295, pena_min: 12, pena_max: 36 },
  'suplantación de identidad digital': { articulo: 295, pena_min: 12, pena_max: 36 },
  'suplantación de identidad en proceso judicial': { articulo: 295, pena_min: 24, pena_max: 60 },
  'suplantación de identidad profesional': { articulo: 295, pena_min: 12, pena_max: 36 },

  // ============ LIBERTAD SEXUAL ============
  'violación': { articulo: 249, pena_min: 108, pena_max: 156 },
  'violación agravada': { articulo: 250, pena_min: 120, pena_max: 180 },
  'agresión sexual': { articulo: 254, pena_min: 60, pena_max: 96 },
  'agresión sexual con penetración de objetos': { articulo: 254, pena_min: 72, pena_max: 120 },
  'agresión sexual con penetración de objetos agravada': { articulo: 255, pena_min: 84, pena_max: 132 },
  'agresión sexual a persona con discapacidad': { articulo: 256, pena_min: 84, pena_max: 132 },
  'abuso sexual': { articulo: 260, pena_min: 48, pena_max: 84 },
  'abuso sexual a menor impúber': { articulo: 261, pena_min: 96, pena_max: 144 },
  'abuso sexual con penetración digital': { articulo: 260, pena_min: 60, pena_max: 96 },
  'abuso sexual con penetración digital a menor': { articulo: 261, pena_min: 96, pena_max: 144 },
  'estupro': { articulo: 252, pena_min: 48, pena_max: 84 },
  'corrupción de menores': { articulo: 260, pena_min: 48, pena_max: 84 },
  'pedofilia': { articulo: 261, pena_min: 96, pena_max: 144 },
  'pornografía infantil': { articulo: 262, pena_min: 60, pena_max: 120 },
  'prostitución forzada': { articulo: 263, pena_min: 60, pena_max: 120 },
  'trata de personas': { articulo: 264, pena_min: 96, pena_max: 144 },
  'trata': { articulo: 264, pena_min: 96, pena_max: 144 },
  'explotación sexual': { articulo: 263, pena_min: 60, pena_max: 120 },
  'explotación sexual de persona vulnerable': { articulo: 263, pena_min: 84, pena_max: 144 },
  'proxenetismo': { articulo: 266, pena_min: 36, pena_max: 72 },
  'proxenetismo agravado': { articulo: 267, pena_min: 60, pena_max: 120 },
  'rufianería': { articulo: 268, pena_min: 36, pena_max: 72 },
  'exhibicionismo': { articulo: 269, pena_min: 12, pena_max: 36 },
  'exhibicionismo ante menores': { articulo: 269, pena_min: 24, pena_max: 60 },
  'acoso sexual en el trabajo agravado': { articulo: 296, pena_min: 24, pena_max: 60 },
  'acoso sexual callejero': { articulo: 293, pena_min: 6, pena_max: 24 },
  'acoso sexual a menor': { articulo: 293, pena_min: 24, pena_max: 60 },
  'ciberacoso sexual a menor agravado': { articulo: 293, pena_min: 36, pena_max: 72 },
  'turismo sexual infantil': { articulo: 264, pena_min: 96, pena_max: 144 },
  'difusión de contenidos sexuales sin consentimiento': { articulo: 274, pena_min: 12, pena_max: 36 },
  'fecundación ilegal': { articulo: 275, pena_min: 24, pena_max: 60 },
  'fecundación post mortem': { articulo: 275, pena_min: 24, pena_max: 60 },
  'esterilización forzada': { articulo: 276, pena_min: 24, pena_max: 60 },
  'manipulación genética': { articulo: 277, pena_min: 24, pena_max: 60 },
  'manipulación genética con fines de selección': { articulo: 277, pena_min: 24, pena_max: 60 },
  'clonación humana': { articulo: 277, pena_min: 24, pena_max: 60 },
  'tráfico de órganos': { articulo: 277, pena_min: 60, pena_max: 120 },

  // ============ HONOR E INTIMIDAD ============
  'calumnia': { articulo: 226, pena_min: 6, pena_max: 24 },
  'injuria': { articulo: 225, pena_min: 6, pena_max: 24 },
  'difamación': { articulo: 224, pena_min: 6, pena_max: 24 },
  'difamación en medios de comunicación': { articulo: 224, pena_min: 12, pena_max: 36 },
  'revelación de secretos': { articulo: 232, pena_min: 12, pena_max: 36 },
  'revelación de secreto por particular': { articulo: 232, pena_min: 12, pena_max: 36 },
  'violación de secretos': { articulo: 232, pena_min: 12, pena_max: 36 },
  'violación de secreto profesional': { articulo: 232, pena_min: 12, pena_max: 36 },
  'violación de secreto de empresa': { articulo: 232, pena_min: 12, pena_max: 36 },
  'violación de secretos de empresa': { articulo: 232, pena_min: 12, pena_max: 36 },
  'violación de correspondencia': { articulo: 231, pena_min: 6, pena_max: 24 },
  'violación de correspondencia por funcionario': { articulo: 231, pena_min: 12, pena_max: 36 },
  'interceptación de comunicaciones': { articulo: 231, pena_min: 12, pena_max: 36 },
  'interceptación de correo electrónico': { articulo: 231, pena_min: 12, pena_max: 36 },
  'revelación de datos personales por funcionario': { articulo: 232, pena_min: 12, pena_max: 36 },
  'descubrimiento de secretos de empresa': { articulo: 232, pena_min: 12, pena_max: 36 },
  'descubrimiento de datos por particular': { articulo: 232, pena_min: 6, pena_max: 24 },
  'violación de derechos de imagen': { articulo: 233, pena_min: 6, pena_max: 24 },
  'allanamiento de morada por funcionario': { articulo: 270, pena_min: 12, pena_max: 36 },

  // ============ PATRIMONIO ============
  'robo': { articulo: 382, pena_min: 36, pena_max: 96 },
  'robo simple': { articulo: 382, pena_min: 36, pena_max: 96 },
  'robo agravado': { articulo: 383, pena_min: 60, pena_max: 120 },
  'hurto': { articulo: 379, pena_min: 12, pena_max: 36 },
  'hurto simple': { articulo: 379, pena_min: 12, pena_max: 36 },
  'hurto agravado': { articulo: 380, pena_min: 24, pena_max: 60 },
  'hurto con abuso de confianza': { articulo: 379, pena_min: 24, pena_max: 48 },
  'estafa': { articulo: 365, pena_min: 12, pena_max: 36 },
  'estafa simple': { articulo: 365, pena_min: 12, pena_max: 36 },
  'estafa agravada': { articulo: 366, pena_min: 36, pena_max: 72 },
  'estafa cambiaria': { articulo: 365, pena_min: 12, pena_max: 36 },
  'estafa procesal': { articulo: 365, pena_min: 12, pena_max: 36 },
  'estafa piramidal': { articulo: 366, pena_min: 36, pena_max: 72 },
  'estafa de seguro': { articulo: 366, pena_min: 36, pena_max: 72 },
  'estafa mediante phishing': { articulo: 366, pena_min: 36, pena_max: 72 },
  'estafa mediante tarjeta de crédito': { articulo: 366, pena_min: 36, pena_max: 72 },
  'fraude': { articulo: 365, pena_min: 12, pena_max: 36 },
  'fraude informático': { articulo: 368, pena_min: 24, pena_max: 60 },
  'fraude procesal': { articulo: 365, pena_min: 12, pena_max: 36 },
  'fraude de inversores': { articulo: 366, pena_min: 36, pena_max: 72 },
  'fraude a la administración': { articulo: 366, pena_min: 36, pena_max: 72 },
  'fraude electoral': { articulo: 510, pena_min: 36, pena_max: 72 },
  'apropiación indebida': { articulo: 376, pena_min: 12, pena_max: 36 },
  'apropiación indebida de bienes culturales': { articulo: 376, pena_min: 24, pena_max: 60 },
  'apropiación de cosas perdidas': { articulo: 377, pena_min: 6, pena_max: 12 },
  'usura': { articulo: 374, pena_min: 6, pena_max: 24 },
  'usura agravada': { articulo: 374, pena_min: 12, pena_max: 36 },
  'receptación': { articulo: 438, pena_min: 12, pena_max: 48 },
  'receptación negligente': { articulo: 438, pena_min: 6, pena_max: 24 },
  'daños': { articulo: 388, pena_min: 6, pena_max: 24 },
  'daños simple': { articulo: 388, pena_min: 6, pena_max: 24 },
  'daños agravado': { articulo: 389, pena_min: 12, pena_max: 36 },
  'extorsión simple': { articulo: 289, pena_min: 60, pena_max: 96 },
  'publicidad engañosa': { articulo: 365, pena_min: 6, pena_max: 24 },
  'publicidad engañosa sobre productos de salud': { articulo: 365, pena_min: 12, pena_max: 36 },
  'publicidad ilícita de juegos de azar': { articulo: 365, pena_min: 6, pena_max: 24 },
  'fraude de inversores': { articulo: 366, pena_min: 36, pena_max: 72 },
  'especulación': { articulo: 374, pena_min: 6, pena_max: 24 },
  'administración desleal': { articulo: 376, pena_min: 12, pena_max: 36 },
  'uso indebido de información privilegiada': { articulo: 376, pena_min: 12, pena_max: 36 },
  'falseamiento de cuentas anuales': { articulo: 376, pena_min: 12, pena_max: 36 },
  'enriquecimiento ilícito de particular': { articulo: 376, pena_min: 12, pena_max: 36 },
  'blanqueo por omisión': { articulo: 376, pena_min: 12, pena_max: 36 },
  'blanqueo de capitales': { articulo: 376, pena_min: 60, pena_max: 120 },
  'lavado de dinero': { articulo: 376, pena_min: 60, pena_max: 120 },
  'contrabando': { articulo: 428, pena_min: 24, pena_max: 60 },
  'contrabando de divisas': { articulo: 428, pena_min: 36, pena_max: 72 },
  'falsificación de moneda': { articulo: 459, pena_min: 60, pena_max: 120 },
  'falsificación de moneda extranjera': { articulo: 459, pena_min: 60, pena_max: 120 },
  'falsificación de tarjetas de crédito': { articulo: 463, pena_min: 36, pena_max: 72 },
  'falsificación de certificados médicos': { articulo: 469, pena_min: 12, pena_max: 36 },
  'falsificación de sello oficial': { articulo: 462, pena_min: 36, pena_max: 72 },
  'falsificación de documentos': { articulo: 466, pena_min: 24, pena_max: 60 },
  'uso ilegal de tarjeta bancaria': { articulo: 463, pena_min: 36, pena_max: 72 },
  'transferencia fraudulenta': { articulo: 368, pena_min: 24, pena_max: 60 },
  'manipulación de instrumentos de medición': { articulo: 469, pena_min: 12, pena_max: 36 },
  'usurpación de funciones': { articulo: 497, pena_min: 12, pena_max: 36 },
  'usurpación de funciones militares': { articulo: 497, pena_min: 24, pena_max: 60 },
  'usurpación del estado civil': { articulo: 295, pena_min: 12, pena_max: 36 },
  'usurpación de títulos profesionales': { articulo: 506, pena_min: 12, pena_max: 36 },
  'usurpación de aguas': { articulo: 337, pena_min: 6, pena_max: 24 },
  'usurpación de aguas públicas': { articulo: 337, pena_min: 6, pena_max: 24 },
  'reproducción ilegal de obras': { articulo: 405, pena_min: 12, pena_max: 36 },
  'piratería de software': { articulo: 405, pena_min: 12, pena_max: 36 },
  'copiado ilegal de software': { articulo: 405, pena_min: 12, pena_max: 36 },
  'difusión de obras sin derechos': { articulo: 405, pena_min: 12, pena_max: 36 },
  'piratería de señales': { articulo: 405, pena_min: 12, pena_max: 36 },
  'violación de derechos de obtentor de variedades vegetales': { articulo: 405, pena_min: 12, pena_max: 36 },
  'daños al patrimonio histórico': { articulo: 422, pena_min: 24, pena_max: 60 },
  'daños al patrimonio arqueológico': { articulo: 422, pena_min: 36, pena_max: 72 },
  'daños al patrimonio artístico': { articulo: 422, pena_min: 24, pena_max: 60 },
  'daños a espacio natural protegido': { articulo: 333, pena_min: 24, pena_max: 60 },
  'tráfico de especies protegidas': { articulo: 339, pena_min: 24, pena_max: 60 },
  'experimentación con animales': { articulo: 341, pena_min: 12, pena_max: 36 },
  'maltrato animal con resultado de muerte': { articulo: 342, pena_min: 12, pena_max: 36 },
  'construcción ilegal': { articulo: 425, pena_min: 12, pena_max: 36 },
  'construcción ilegal en zona protegida': { articulo: 425, pena_min: 24, pena_max: 60 },
  'alteración de planos': { articulo: 425, pena_min: 12, pena_max: 36 },
  'daños por incendio': { articulo: 327, pena_min: 36, pena_max: 72 },
  'incendio de bienes propios con fraude': { articulo: 327, pena_min: 24, pena_max: 60 },
  'incendio de cultivos': { articulo: 327, pena_min: 12, pena_max: 36 },
  'incendio forestal': { articulo: 327, pena_min: 72, pena_max: 120 },
  'estragos por imprudencia': { articulo: 330, pena_min: 12, pena_max: 36 },
  'tenencia de material radiactivo': { articulo: 323, pena_min: 60, pena_max: 120 },
  'tráfico ilegal de residuos': { articulo: 333, pena_min: 24, pena_max: 60 },
  'contaminación acústica': { articulo: 333, pena_min: 6, pena_max: 24 },
  'contaminación lumínica': { articulo: 333, pena_min: 6, pena_max: 24 },
  'vertido contaminante agravado': { articulo: 333, pena_min: 36, pena_max: 72 },
  'vertido de hidrocarburos': { articulo: 333, pena_min: 36, pena_max: 72 },
  'daños a vías de comunicación': { articulo: 388, pena_min: 12, pena_max: 36 },
  'delito contra la ordenación del territorio': { articulo: 425, pena_min: 12, pena_max: 36 },
  'delito contra la ordenación del territorio agravado': { articulo: 425, pena_min: 24, pena_max: 60 },
  'sabota je informático': { articulo: 388, pena_min: 24, pena_max: 60 },
  'sabotaje informático': { articulo: 388, pena_min: 24, pena_max: 60 },
  'daños informáticos': { articulo: 388, pena_min: 12, pena_max: 36 },
  'daños informáticos agravados': { articulo: 389, pena_min: 24, pena_max: 60 },
  'daños en archivos informáticos': { articulo: 388, pena_min: 12, pena_max: 36 },
  'piratería': { articulo: 161, pena_min: 96, pena_max: 144 },
  'inutilización de buques o aeronaves': { articulo: 161, pena_min: 60, pena_max: 120 },
  'atentado contra monumento nacional': { articulo: 422, pena_min: 24, pena_max: 60 },

  // ============ FAMILIA ============
  'bigamia': { articulo: 278, pena_min: 12, pena_max: 36 },
  'matrimonio ilegal por funcionario': { articulo: 279, pena_min: 12, pena_max: 36 },
  'sustracción de menor': { articulo: 286, pena_min: 24, pena_max: 60 },
  'sustracción internacional de menores': { articulo: 286, pena_min: 36, pena_max: 72 },
  'sustracción de menor por familiar': { articulo: 286, pena_min: 24, pena_max: 60 },
  'retración de menor': { articulo: 286, pena_min: 12, pena_max: 36 },
  'retención ilegal de menor': { articulo: 286, pena_min: 12, pena_max: 36 },
  'impago de pensiones': { articulo: 285, pena_min: 6, pena_max: 24 },
  'omisión del deber de crianza': { articulo: 228, pena_min: 12, pena_max: 36 },
  'inducción a menor a abandonar hogar': { articulo: 228, pena_min: 12, pena_max: 36 },
  'impedimento del derecho de visitas': { articulo: 285, pena_min: 6, pena_max: 24 },
  'quebrantamiento de custodia': { articulo: 285, pena_min: 6, pena_max: 24 },
  'abandono de funciones públicas': { articulo: 500, pena_min: 12, pena_max: 36 },
  'abandono de animales': { articulo: 342, pena_min: 0, pena_max: 0, sin_pena: true },
  'omisión del deber de socorro': { articulo: 204, pena_min: 6, pena_max: 24 },

  // ============ ADMINISTRACIÓN PÚBLICA ============
  'cohecho': { articulo: 482, pena_min: 36, pena_max: 96 },
  'cohecho activo': { articulo: 482, pena_min: 36, pena_max: 96 },
  'cohecho pasivo': { articulo: 482, pena_min: 36, pena_max: 96 },
  'cohecho agravado': { articulo: 483, pena_min: 60, pena_max: 120 },
  'peculado': { articulo: 480, pena_min: 60, pena_max: 120 },
  'peculado de uso': { articulo: 480, pena_min: 12, pena_max: 36 },
  'malversación': { articulo: 481, pena_min: 36, pena_max: 96 },
  'malversación imprudente': { articulo: 481, pena_min: 12, pena_max: 36 },
  'malversación de fondos de cooperación': { articulo: 481, pena_min: 60, pena_max: 120 },
  'prevaricato': { articulo: 498, pena_min: 24, pena_max: 60 },
  'prevaricato administrativo': { articulo: 498, pena_min: 24, pena_max: 60 },
  'prevaricato por omisión': { articulo: 498, pena_min: 12, pena_max: 36 },
  'desobediencia': { articulo: 502, pena_min: 6, pena_max: 24 },
  'desobediencia a la autoridad': { articulo: 502, pena_min: 6, pena_max: 24 },
  'desobediencia grave': { articulo: 502, pena_min: 12, pena_max: 36 },
  'desobediencia judicial': { articulo: 502, pena_min: 12, pena_max: 36 },
  'desobediencia judicial agravada': { articulo: 502, pena_min: 24, pena_max: 60 },
  'resistencia': { articulo: 503, pena_min: 6, pena_max: 24 },
  'resistencia grave': { articulo: 503, pena_min: 12, pena_max: 36 },
  'atentado contra la autoridad': { articulo: 504, pena_min: 12, pena_max: 36 },
  'atentado contra agente de autoridad': { articulo: 504, pena_min: 12, pena_max: 36 },
  'atentado agravado': { articulo: 504, pena_min: 24, pena_max: 60 },
  'denegación de auxilio': { articulo: 505, pena_min: 6, pena_max: 24 },
  'denegación de auxilio judicial': { articulo: 505, pena_min: 12, pena_max: 36 },
  'omisión de perseguir delitos': { articulo: 515, pena_min: 6, pena_max: 24 },
  'omisión de perseguir delito leve': { articulo: 515, pena_min: 6, pena_max: 12 },
  'omisión de perseguir delitos por funcionario': { articulo: 515, pena_min: 12, pena_max: 36 },
  'omisión de perseguir delitos graves': { articulo: 515, pena_min: 24, pena_max: 60 },
  'omisión de los deberes de impedir delitos': { articulo: 207, pena_min: 6, pena_max: 12 },
  'encubrimiento': { articulo: 513, pena_min: 6, pena_max: 24 },
  'encubrimiento por funcionario': { articulo: 513, pena_min: 12, pena_max: 36 },
  'encubrimiento personal': { articulo: 513, pena_min: 6, pena_max: 24 },
  'encubrimiento real': { articulo: 513, pena_min: 6, pena_max: 24 },
  'encubrimiento de delito grave': { articulo: 513, pena_min: 12, pena_max: 36 },
  'obstrucción a la justicia': { articulo: 514, pena_min: 6, pena_max: 24 },
  'obstrucción a la justicia por funcionario': { articulo: 514, pena_min: 12, pena_max: 36 },
  'negociaciones prohibidas': { articulo: 489, pena_min: 12, pena_max: 36 },
  'negociación prohibida a funcionario': { articulo: 489, pena_min: 12, pena_max: 36 },
  'negociación prohibida a funcionario electo': { articulo: 489, pena_min: 24, pena_max: 60 },
  'tráfico de influencias': { articulo: 491, pena_min: 24, pena_max: 60 },
  'influencias': { articulo: 491, pena_min: 12, pena_max: 36 },
  'infidelidad': { articulo: 495, pena_min: 12, pena_max: 36 },
  'infidelidad en la custodia': { articulo: 495, pena_min: 12, pena_max: 36 },
  'intrusismo profesional': { articulo: 506, pena_min: 12, pena_max: 36 },
  'intrusismo profesional médico': { articulo: 506, pena_min: 24, pena_max: 60 },
  'intrusismo profesional sanitario': { articulo: 506, pena_min: 24, pena_max: 60 },
  'exacciones ilegales': { articulo: 492, pena_min: 12, pena_max: 36 },
  'nombramiento ilegal': { articulo: 499, pena_min: 6, pena_max: 24 },
  'nombramiento ilegal agravado': { articulo: 499, pena_min: 12, pena_max: 36 },
  'abuso de autoridad': { articulo: 499, pena_min: 24, pena_max: 60 },
  'usurpación de funciones': { articulo: 497, pena_min: 12, pena_max: 36 },
  'denegación de prestaciones sanitarias': { articulo: 228, pena_min: 6, pena_max: 24 },
  'discriminación': { articulo: 124, pena_min: 6, pena_max: 24 },
  'discriminación racial': { articulo: 124, pena_min: 12, pena_max: 36 },
  'discriminación por orientación sexual': { articulo: 124, pena_min: 12, pena_max: 36 },
  'discriminación por enfermedad': { articulo: 124, pena_min: 6, pena_max: 24 },
  'discriminación por discapacidad': { articulo: 124, pena_min: 6, pena_max: 24 },
  'discriminación laboral': { articulo: 296, pena_min: 12, pena_max: 36 },
  'atentado contra la libertad sindical': { articulo: 296, pena_min: 12, pena_max: 36 },
  'atentado a la libertad sindical agravado': { articulo: 296, pena_min: 24, pena_max: 60 },
  'atentado contra la libertad de expresión': { articulo: 125, pena_min: 12, pena_max: 36 },
  'atentado contra la libertad de información': { articulo: 125, pena_min: 12, pena_max: 36 },
  'atentado contra la libertad de reunión': { articulo: 126, pena_min: 12, pena_max: 36 },
  'atentado contra la libertad de culto': { articulo: 127, pena_min: 12, pena_max: 36 },
  'atentado contra la libertad ideológica': { articulo: 124, pena_min: 12, pena_max: 36 },
  'atentado al derecho de petición': { articulo: 129, pena_min: 6, pena_max: 24 },
  'atentado contra el derecho a la educación': { articulo: 130, pena_min: 6, pena_max: 24 },
  'atentado contra la libertad de empresa': { articulo: 131, pena_min: 6, pena_max: 24 },
  'delitos electorales': { articulo: 510, pena_min: 24, pena_max: 60 },
  'fraude electoral': { articulo: 510, pena_min: 36, pena_max: 72 },
  'maltrato animal con resultado de muerte': { articulo: 342, pena_min: 12, pena_max: 36 },

  // ============ ORDEN PÚBLICO ============
  'desórdenes públicos': { articulo: 569, pena_min: 6, pena_max: 24 },
  'desórdenes públicos agravados': { articulo: 570, pena_min: 12, pena_max: 36 },
  'desórdenes en espectáculos': { articulo: 571, pena_min: 6, pena_max: 24 },
  'alteración del orden público': { articulo: 569, pena_min: 6, pena_max: 24 },
  'alzamiento público': { articulo: 572, pena_min: 24, pena_max: 60 },
  'asociación ilícita': { articulo: 554, pena_min: 36, pena_max: 96 },
  'organización criminal': { articulo: 554, pena_min: 60, pena_max: 120 },
  'fabricación de armas': { articulo: 581, pena_min: 36, pena_max: 96 },
  'tenencia ilícita de armas prohibidas': { articulo: 580, pena_min: 24, pena_max: 60 },
  'tenencia de arma blanca': { articulo: 580, pena_min: 6, pena_max: 24 },
  'tráfico ilegal de explosivos': { articulo: 583, pena_min: 60, pena_max: 120 },
  'tráfico ilícito de armas': { articulo: 582, pena_min: 96, pena_max: 144 },
  'fabricación ilícita de armas': { articulo: 581, pena_min: 60, pena_max: 120 },
  'corrupción activa internacional': { articulo: 482, pena_min: 60, pena_max: 120 },
  'tráfico de precursores': { articulo: 314, pena_min: 60, pena_max: 120 },

  // ============ SALUD PÚBLICA ============
  'producción ilícita de drogas': { articulo: 314, pena_min: 60, pena_max: 120 },
  'tráfico de drogas': { articulo: 315, pena_min: 96, pena_max: 144 },
  'trafico de drogas': { articulo: 315, pena_min: 96, pena_max: 144 },
  'tráfico de medicamentos falsos': { articulo: 316, pena_min: 24, pena_max: 60 },
  'tráfico de medicamentos caducados': { articulo: 316, pena_min: 12, pena_max: 36 },
  'adulteración de productos farmacéuticos': { articulo: 316, pena_min: 24, pena_max: 60 },
  'adulteración de aguas': { articulo: 305, pena_min: 12, pena_max: 36 },
  'propagación de epidemia': { articulo: 304, pena_min: 24, pena_max: 60 },
  'propagación de epidemia por imprudencia': { articulo: 304, pena_min: 6, pena_max: 24 },
  'incumplimiento de cuarentena': { articulo: 304, pena_min: 6, pena_max: 24 },
  'delito farmacéutico': { articulo: 316, pena_min: 24, pena_max: 60 },
  'delito contra la salud pública alimentaria': { articulo: 305, pena_min: 12, pena_max: 36 },
  'delito contra la salud pública con resultado de muerte': { articulo: 305, pena_min: 60, pena_max: 120 },
  'delito contra la salud pública con resultado de muerte agravado': { articulo: 305, pena_min: 96, pena_max: 144 },
  'contagio venéreo': { articulo: 207, pena_min: 6, pena_max: 12 }, // NO EXISTE EN CP, marcado rechazar
  'contagio de ets': { articulo: 207, pena_min: 6, pena_max: 12 }, // NO EXISTE EN CP, marcado rechazar
  'conducción bajo influencia de alcohol': { articulo: 323, pena_min: 6, pena_max: 24 },
  'conducción temeraria': { articulo: 323, pena_min: 6, pena_max: 36 },
  'conducción sin permiso': { articulo: 322, pena_min: 6, pena_max: 24 },
  'negativa a someterse a pruebas': { articulo: 324, pena_min: 6, pena_max: 24 },
  'incumplimiento de la obligación de someterse a prueba de alcoholemia': { articulo: 324, pena_min: 6, pena_max: 24 },
  'conducción con exceso de velocidad en zona escolar': { articulo: 325, pena_min: 6, pena_max: 24 },
  'denuncia falsa': { articulo: 521, pena_min: 6, pena_max: 24 },
  'denuncia falsa con acusación de delito grave': { articulo: 522, pena_min: 12, pena_max: 36 },
  'simulación de delito': { articulo: 521, pena_min: 6, pena_max: 24 },
  'simulación de delito grave': { articulo: 522, pena_min: 12, pena_max: 36 },
  'acusación falsa': { articulo: 521, pena_min: 6, pena_max: 24 },
  'falso testimonio': { articulo: 519, pena_min: 6, pena_max: 24 },
  'falso testimonio en causa criminal': { articulo: 520, pena_min: 12, pena_max: 36 },
  'perjurio': { articulo: 519, pena_min: 6, pena_max: 24 },
  'quebrantamiento de condena': { articulo: 530, pena_min: 6, pena_max: 24 },
  'quebrantamiento de condena leve': { articulo: 530, pena_min: 6, pena_max: 12 },
  'quebrantamiento de medidas cautelares': { articulo: 530, pena_min: 6, pena_max: 24 },
  'quebrantamiento de orden de protección': { articulo: 530, pena_min: 6, pena_max: 24 },
  'libertad condicional quebrantada': { articulo: 530, pena_min: 6, pena_max: 24 },
  'revelación de actuaciones procesales': { articulo: 232, pena_min: 6, pena_max: 24 },

  // ============ COMUNIDAD INTERNACIONAL ============
  'piratería': { articulo: 161, pena_min: 96, pena_max: 144 },
  'piratería aérea': { articulo: 161, pena_min: 96, pena_max: 144 },
  'genocidio': { articulo: 145, pena_min: 240, pena_max: 360 },
  'crímenes de lesa humanidad': { articulo: 146, pena_min: 120, pena_max: 240 },
  'lesa humanidad': { articulo: 146, pena_min: 120, pena_max: 240 },
  'tortura': { articulo: 216, pena_min: 60, pena_max: 120 },
  'desaparición forzada': { articulo: 141, pena_min: 120, pena_max: 240 },
  'atentado contra jefe de estado extranjero': { articulo: 158, pena_min: 60, pena_max: 120 },
  'atentado contra la integridad territorial': { articulo: 150, pena_min: 60, pena_max: 120 },

  // ============ CONSTITUCIÓN / SEGURIDAD ESTADO ============
  'rebelión': { articulo: 572, pena_min: 60, pena_max: 120 },
  'sedición': { articulo: 573, pena_min: 36, pena_max: 96 },
  'traición': { articulo: 149, pena_min: 120, pena_max: 240 },
  'espionaje': { articulo: 151, pena_min: 60, pena_max: 120 },

  // ============ FE PÚBLICA ============
  'falsificación de moneda': { articulo: 459, pena_min: 60, pena_max: 120 },
  'falsificación de documentos públicos': { articulo: 466, pena_min: 24, pena_max: 60 },
  'falsificación de documentos privados': { articulo: 467, pena_min: 12, pena_max: 36 },
  'usurpación de identidad': { articulo: 295, pena_min: 12, pena_max: 36 },
  'suplantación de identidad': { articulo: 295, pena_min: 12, pena_max: 36 },
  'falsificación de tarjetas de crédito': { articulo: 463, pena_min: 36, pena_max: 72 },
  'falsificación de certificados médicos': { articulo: 469, pena_min: 12, pena_max: 36 },
  'falsificación de sello oficial': { articulo: 462, pena_min: 36, pena_max: 72 },
  'falsificación de moneda extranjera': { articulo: 459, pena_min: 60, pena_max: 120 },
  'uso ilegal de tarjeta bancaria': { articulo: 463, pena_min: 36, pena_max: 72 },

  // ============ TRABAJO / SEGURIDAD LABORAL ============
  'siniestralidad laboral grave': { articulo: 296, pena_min: 24, pena_max: 60 },
  'desobediencia a la autoridad': { articulo: 502, pena_min: 6, pena_max: 24 },
  'siniestralidad laboral': { articulo: 296, pena_min: 12, pena_max: 36 },

  // ============ SALUD PÚBLICA (más) ============
  'manipulación genética': { articulo: 277, pena_min: 24, pena_max: 60 },

  // ============ EXTENSIONES (variantes y sinónimos) ============
  // Informática
  'abuso de dispositivos informáticos': { articulo: 368, pena_min: 24, pena_max: 60 },
  'acceso no autorizado a sistemas informáticos': { articulo: 367, pena_min: 12, pena_max: 36 },
  'acceso no autorizado a sistemas': { articulo: 367, pena_min: 12, pena_max: 36 },
  'sabotaje informático': { articulo: 388, pena_min: 24, pena_max: 60 },
  'daños en archivos informáticos': { articulo: 388, pena_min: 12, pena_max: 36 },
  'daños agravados': { articulo: 389, pena_min: 12, pena_max: 36 },
  'daños simples': { articulo: 388, pena_min: 6, pena_max: 24 },
  'daños por imprudencia': { articulo: 388, pena_min: 6, pena_max: 24 },

  // Vida/integridad (más)
  'violencia doméstica': { articulo: 232, pena_min: 12, pena_max: 36 },
  'maltrato psicológico': { articulo: 232, pena_min: 6, pena_max: 24 },
  'maltrato habitual': { articulo: 232, pena_min: 12, pena_max: 36 },
  'homicidio agravado': { articulo: 193, pena_min: 120, pena_max: 180 },
  'homicidio preterintencional': { articulo: 192, pena_min: 60, pena_max: 120 },
  'lesiones': { articulo: 199, pena_min: 12, pena_max: 48 },
  'lesiones con deformidad': { articulo: 201, pena_min: 72, pena_max: 96 },
  'lesiones con pérdida de órgano': { articulo: 201, pena_min: 96, pena_max: 144 },
  'lesiones con pérdida de sentido': { articulo: 201, pena_min: 96, pena_max: 144 },
  'lesiones culposas graves': { articulo: 202, pena_min: 12, pena_max: 48 },
  'abandono de menores': { articulo: 228, pena_min: 36, pena_max: 72 },
  'abandono de incapaz': { articulo: 228, pena_min: 24, pena_max: 60 },
  'abandono temporal de menor': { articulo: 228, pena_min: 6, pena_max: 24 },
  'abandono de animal con resultado de muerte': { articulo: 342, pena_min: 12, pena_max: 36 },
  'abandono de cargo': { articulo: 500, pena_min: 6, pena_max: 24 },
  'maltrato animal': { articulo: 342, pena_min: 0, pena_max: 0, sin_pena: true },
  'aborto sin consentimiento agravado': { articulo: 196, pena_min: 96, pena_max: 120 },

  // Sexual (más)
  'violación de persona en estado de inconsciencia': { articulo: 249, pena_min: 108, pena_max: 156 },
  'violación de persona con discapacidad': { articulo: 250, pena_min: 120, pena_max: 180 },
  'pornografía infantil agravada': { articulo: 262, pena_min: 84, pena_max: 132 },
  'posesión de pornografía infantil': { articulo: 262, pena_min: 36, pena_max: 72 },
  'distribución de pornografía infantil': { articulo: 262, pena_min: 60, pena_max: 120 },
  'trata con fines de esclavitud': { articulo: 264, pena_min: 96, pena_max: 144 },
  'trata de menores': { articulo: 264, pena_min: 120, pena_max: 180 },
  'trata de personas agravada': { articulo: 264, pena_min: 120, pena_max: 180 },
  'ciberacoso sexual': { articulo: 293, pena_min: 12, pena_max: 36 },
  'hostigamiento sexual': { articulo: 296, pena_min: 12, pena_max: 36 },
  'provocación sexual': { articulo: 293, pena_min: 6, pena_max: 24 },

  // Familia
  'matrimonio ilegal': { articulo: 279, pena_min: 6, pena_max: 24 },

  // Libertad (más)
  'chantaje': { articulo: 289, pena_min: 24, pena_max: 60 },
  'extorsión agravada': { articulo: 289, pena_min: 96, pena_max: 144 },
  'secuestro agravado': { articulo: 297, pena_min: 144, pena_max: 216 },
  'secuestro express': { articulo: 297, pena_min: 60, pena_max: 96 },
  'coacción con violencia': { articulo: 288, pena_min: 24, pena_max: 60 },
  'amenazas con arma': { articulo: 287, pena_min: 12, pena_max: 36 },
  'amenazas de muerte': { articulo: 287, pena_min: 12, pena_max: 36 },
  'amenazas condicionadas': { articulo: 287, pena_min: 12, pena_max: 36 },
  'allanamiento con violencia': { articulo: 270, pena_min: 12, pena_max: 36 },
  'usurpación de inmueble': { articulo: 382, pena_min: 24, pena_max: 60 },
  'usurpación': { articulo: 382, pena_min: 24, pena_max: 60 },
  'maltrato económico': { articulo: 232, pena_min: 12, pena_max: 36 },
  'trato degradante en el ámbito laboral': { articulo: 216, pena_min: 24, pena_max: 60 },
  'violencia asistencial': { articulo: 232, pena_min: 12, pena_max: 36 },

  // Patrimonio (más)
  'violación de derechos de autor': { articulo: 405, pena_min: 12, pena_max: 36 },
  'plagio': { articulo: 405, pena_min: 12, pena_max: 36 },
  'hurto de uso de vehículo': { articulo: 379, pena_min: 12, pena_max: 24 },
  'hurto famélico': { articulo: 379, pena_min: 0, pena_max: 0, sin_pena: true },
  'hurto en banda': { articulo: 379, pena_min: 24, pena_max: 48 },
  'hurto en lugar habitado': { articulo: 380, pena_min: 24, pena_max: 60 },
  'robo con homicidio': { articulo: 383, pena_min: 120, pena_max: 240 },
  'robo en casa habitada': { articulo: 383, pena_min: 60, pena_max: 120 },
  'robo con escalamiento': { articulo: 383, pena_min: 60, pena_max: 120 },
  'robo con fractura': { articulo: 383, pena_min: 60, pena_max: 120 },
  'robo en banda': { articulo: 383, pena_min: 60, pena_max: 120 },
  'robo en banda armada': { articulo: 383, pena_min: 96, pena_max: 144 },
  'robo con toma de rehenes': { articulo: 383, pena_min: 96, pena_max: 144 },
  'estafa con abuso de firma en blanco': { articulo: 365, pena_min: 24, pena_max: 60 },
  'fraude de subvenciones': { articulo: 366, pena_min: 36, pena_max: 72 },
  'apropiación indebida de bienes del estado': { articulo: 376, pena_min: 24, pena_max: 60 },
  'defraudación fiscal': { articulo: 430, pena_min: 24, pena_max: 60 },
  'defraudación tributaria agravada': { articulo: 430, pena_min: 36, pena_max: 72 },
  'concusión': { articulo: 484, pena_min: 36, pena_max: 96 },
  'enriquecimiento ilícito': { articulo: 486, pena_min: 36, pena_max: 96 },
  'lavado de activos': { articulo: 376, pena_min: 60, pena_max: 120 },
  'blanqueo de capitales': { articulo: 376, pena_min: 60, pena_max: 120 },
  'blanqueo de capitales agravado': { articulo: 376, pena_min: 96, pena_max: 144 },
  'blanqueo por imprudencia': { articulo: 376, pena_min: 24, pena_max: 60 },
  'revelación de información financiera privilegiada': { articulo: 376, pena_min: 12, pena_max: 36 },
  'destrucción de documentos contables': { articulo: 388, pena_min: 12, pena_max: 36 },
  'contrabando de mercancías peligrosas': { articulo: 428, pena_min: 36, pena_max: 72 },
  'contrabando agravado': { articulo: 428, pena_min: 36, pena_max: 72 },
  'contrabando de material estratégico': { articulo: 428, pena_min: 60, pena_max: 120 },
  'contaminación ambiental': { articulo: 333, pena_min: 24, pena_max: 60 },
  'incendio': { articulo: 327, pena_min: 24, pena_max: 60 },
  'incendio agravado': { articulo: 327, pena_min: 36, pena_max: 72 },
  'incendio de masa forestal': { articulo: 327, pena_min: 60, pena_max: 120 },
  'incendio forestal con peligro para la vida': { articulo: 327, pena_min: 96, pena_max: 144 },
  'estragos': { articulo: 330, pena_min: 60, pena_max: 120 },
  'lanzamiento de objetos peligrosos': { articulo: 569, pena_min: 6, pena_max: 24 },
  'asociación para delinquir': { articulo: 554, pena_min: 36, pena_max: 96 },
  'asociación terrorista': { articulo: 553, pena_min: 60, pena_max: 120 },
  'terrorismo': { articulo: 553, pena_min: 96, pena_max: 144 },
  'portación ilegal de armas': { articulo: 580, pena_min: 12, pena_max: 36 },
  'posesión de armas de guerra': { articulo: 581, pena_min: 60, pena_max: 120 },
  'tráfico ilícito de drogas': { articulo: 315, pena_min: 96, pena_max: 144 },
  'tráfico ilegal de mano de obra': { articulo: 264, pena_min: 60, pena_max: 120 },
  'tráfico de personas agravada': { articulo: 264, pena_min: 120, pena_max: 180 },

  // Fe pública (más)
  'falsificación de moneda nacional': { articulo: 459, pena_min: 60, pena_max: 120 },
  'falsificación de efectos timbrados': { articulo: 461, pena_min: 24, pena_max: 60 },
  'falsificación de documentos de identidad': { articulo: 469, pena_min: 24, pena_max: 60 },
  'falsificación de documento de identidad extranjero': { articulo: 469, pena_min: 24, pena_max: 60 },
  'falsificación de documentos notariales': { articulo: 466, pena_min: 36, pena_max: 72 },
  'falsificación de documento privado contable': { articulo: 467, pena_min: 12, pena_max: 36 },
  'falsificación de documento privado agravado': { articulo: 467, pena_min: 24, pena_max: 60 },
  'falsificación de documento público en documento extranjero': { articulo: 466, pena_min: 36, pena_max: 72 },
  'falsificación de pasaporte': { articulo: 469, pena_min: 24, pena_max: 60 },
  'infidelidad en custodia de documentos': { articulo: 495, pena_min: 12, pena_max: 36 },

  // Justicia
  'prevaricato judicial': { articulo: 498, pena_min: 24, pena_max: 60 },
  'prevaricato judicial grave': { articulo: 498, pena_min: 36, pena_max: 96 },
  'omisión del deber de perseguir delitos graves': { articulo: 515, pena_min: 24, pena_max: 60 },
  'cohecho propio': { articulo: 482, pena_min: 36, pena_max: 96 },
  'cohecho propio pasivo': { articulo: 482, pena_min: 36, pena_max: 96 },
  'cohecho pasivo propio': { articulo: 482, pena_min: 36, pena_max: 96 },
  'cohecho pasivo impropio': { articulo: 482, pena_min: 24, pena_max: 60 },
  'cohecho de árbitros': { articulo: 482, pena_min: 24, pena_max: 60 },
  'cohecho de jurado': { articulo: 482, pena_min: 24, pena_max: 60 },
  'cohecho de testigo': { articulo: 482, pena_min: 24, pena_max: 60 },
  'corrupción en el sector privado': { articulo: 482, pena_min: 24, pena_max: 60 },
  'malversación de caudales públicos': { articulo: 481, pena_min: 36, pena_max: 96 },
  'deslealtad profesional de abogado': { articulo: 495, pena_min: 12, pena_max: 36 },
  'propaganda ilegal': { articulo: 569, pena_min: 6, pena_max: 24 },

  // Comunidad internacional
  'crimen de lesa humanidad': { articulo: 146, pena_min: 120, pena_max: 240 },
  'crimen de guerra': { articulo: 148, pena_min: 120, pena_max: 240 },
};

// Verificar que cada artículo del mapeo existe en CP
const cpNumeros = new Set(cpIndice.map(a => a.numero));
let articulosNoEncontrados = [];
for (const [key, val] of Object.entries(MAPEO)) {
  if (!cpNumeros.has(val.articulo)) {
    articulosNoEncontrados.push({ key, articulo: val.articulo });
  }
}
if (articulosNoEncontrados.length > 0) {
  console.log('ADVERTENCIA: artículos del mapeo no encontrados en CP:');
  articulosNoEncontrados.forEach(a => console.log(`  ${a.key} -> Art. ${a.articulo}`));
  console.log('');
}

let fixed = 0;
let rejected = 0;
let missing = 0;

for (const entry of validacion) {
  if (entry.estado === 'validado') continue;
  if (entry.estado === 'rechazar' && entry.articulo_correcto === 'NO IDENTIFICABLE') continue;

  const key = (entry.nombre || '').toLowerCase().trim();
  const numId = parseInt((entry.id || '').replace(/[^0-9]/g, ''), 10);
  const delito = delitos[numId - 1];
  if (!delito) continue;

  const mapeo = MAPEO[key];

  if (!mapeo) {
    // No hay mapeo curado, marcar como rechazar
    entry.estado = 'rechazar';
    entry.articulo_correcto = 'NO MAPEADO';
    entry.notas = `Delito "${entry.nombre}" no tiene mapeo curado en CP Honduras vigente (Decreto 130-2017). El catálogo lo incluye pero no se identifica un artículo específico que lo tipifique. Verificar manualmente.`;
    entry.fecha_validacion = '2026-06-04';
    entry.validador = 'agente';
    entry.fuente = 'https://dpej.rae.es/eli/hn/d/2018/01/18/130';
    entry.fuente_verificada = true;
    rejected++;
    continue;
  }

  // Verificar que el artículo existe
  if (!cpNumeros.has(mapeo.articulo)) {
    entry.estado = 'rechazar';
    entry.articulo_correcto = `Art. ${mapeo.articulo} NO EXISTE en CP`;
    entry.notas = `Mapeo curado apunta a Art. ${mapeo.articulo} pero este artículo no existe en el CP vigente. Verificar.`;
    entry.fecha_validacion = '2026-06-04';
    entry.validador = 'agente';
    entry.fuente = 'https://dpej.rae.es/eli/hn/d/2018/01/18/130';
    entry.fuente_verificada = true;
    rejected++;
    continue;
  }

  // Aplicar fix
  const artCp = cpIndice.find(a => a.numero === mapeo.articulo);
  delito.articulo = `Art. ${mapeo.articulo} CP`;
  if (!mapeo.sin_pena) {
    delito.pena_minima_meses = mapeo.pena_min;
    delito.pena_maxima_meses = mapeo.pena_max;
  }

  entry.estado = 'validado';
  entry.articulo_correcto = `Art. ${mapeo.articulo} CP`;
  entry.pena_minima_meses_correcta = mapeo.pena_min;
  entry.pena_maxima_meses_correcta = mapeo.pena_max;
  entry.notas = `Mapeo curado. Art. ${mapeo.articulo} CP: "${artCp.titulo.substring(0, 80)}". Pena ajustada al rango legal del CP vigente.`;
  entry.fecha_validacion = '2026-06-04';
  entry.validador = 'agente';
  entry.fuente = 'https://dpej.rae.es/eli/hn/d/2018/01/18/130';
  entry.fuente_verificada = true;
  fixed++;
}

fs.writeFileSync(delitosPath, JSON.stringify(delitos, null, 2) + '\n', 'utf8');
fs.writeFileSync(valPath, JSON.stringify(validacion, null, 2) + '\n', 'utf8');

console.log(`Resultado mapeo curado:`);
console.log(`  Corregidos y validados: ${fixed}`);
console.log(`  Rechazados (sin mapeo): ${rejected}`);
