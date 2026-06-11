const fs = require('fs');
const path = require('path');

const valPath = path.join(__dirname, '..', 'data', 'delitos-validacion.json');
const cpPath = path.join(__dirname, '..', 'data', 'cp-indice.json');
const delitosPath = path.join(__dirname, '..', 'data', 'delitos.json');

const validacion = JSON.parse(fs.readFileSync(valPath, 'utf8'));
const cpIndice = JSON.parse(fs.readFileSync(cpPath, 'utf8'));
const delitos = JSON.parse(fs.readFileSync(delitosPath, 'utf8'));

// Map de delitos por id
const delitosMap = new Map(delitos.map(d => [d.id, d]));

// Index de CP por numero
const cpMap = new Map();
for (const art of cpIndice) {
  if (!cpMap.has(art.numero)) cpMap.set(art.numero, art);
}

function numArt(articuloStr) {
  if (!articuloStr) return null;
  const m = articuloStr.match(/Art\.?\s*(\d+)/i);
  return m ? parseInt(m[1], 10) : null;
}

// Stopwords y normalización
const STOP = new Set(['de', 'del', 'la', 'el', 'los', 'las', 'y', 'o', 'a', 'en', 'un', 'una', 'con', 'por', 'para', 'sin', 'sobre', 'que', 'se', 'es', 'al', 'lo', 'le', 'su', 'sus', 'tipo', 'tipos', 'delito', 'delitos', 'persona', 'personas', 'caso', 'casos', 'forma', 'manera', 'cualquier', 'otro', 'otra', 'mismo', 'misma', 'cualquiera', 'actividad', 'acto', 'actos', 'hecho', 'hechos']);

function tokens(str) {
  return str.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // quitar acentos
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length >= 3 && !STOP.has(t));
}

// Sinónimos / términos equivalentes para mejorar matching
const SINONIMOS = {
  'feminicidio': ['femicidio', 'mujer', 'femenina'],
  'femicidio': ['feminicidio'],
  'homicidio': ['matar', 'muerte', 'asesinato', 'vida'],
  'asesinato': ['matar', 'muerte', 'homicidio'],
  'lesiones': ['lesion', 'herida', 'integridad', 'fisica'],
  'robo': ['robar', 'apoderamiento', 'sustraccion', 'hurto'],
  'hurto': ['hurtar', 'sustraccion', 'robo'],
  'estafa': ['estafar', 'engano', 'fraude'],
  'fraude': ['estafa', 'engano'],
  'violacion': ['acceso', 'carnal', 'sexual'],
  'abuso': ['abusar', 'acceso', 'carnal'],
  'agresion': ['agresion', 'sexual', 'ataque'],
  'amenaza': ['amenazar', 'intimidacion', 'intimidar'],
  'coaccion': ['coaccionar', 'obligar', 'forzar', 'compeler'],
  'extorsion': ['extorsionar'],
  'secuestro': ['secuestrar', 'sustraccion', 'persona', 'detencion'],
  'detencion': ['detener', 'privacion', 'libertad'],
  'trafico': ['trafico', 'narcotrafico', 'droga', 'estupefaciente'],
  'droga': ['estupefaciente', 'narcotico', 'sustancia'],
  'corrupcion': ['sobornar', 'cohecho', 'coima'],
  'cohecho': ['coima', 'soborno', 'corrupcion'],
  'peculado': ['apropiacion', 'fondos', 'publicos'],
  'malversacion': ['malversar', 'fondos', 'publicos', 'apropiacion'],
  'prevaricato': ['prevaricar', 'juez', 'resolucion', 'injusta'],
  'falso': ['falsedad', 'falsificar', 'falsificacion'],
  'falsificacion': ['falso', 'falsificar'],
  'usurpacion': ['usurpar', 'funciones', 'publicas'],
  'allanamiento': ['allanar', 'domicilio', 'morada'],
  'incendio': ['incendiar', 'fuego', 'quemar'],
  'explosion': ['explotar', 'detonar'],
  'inundacion': ['inundar'],
  'desastre': ['catastrofe', 'calamidad'],
  'envenenamiento': ['envenenar', 'sustancia', 'toxica', 'veneno'],
  'contagio': ['contagiar', 'transmitir', 'enfermedad'],
  'contagio venereo': ['contagiar', 'enfermedad', 'venerea', 'sexual', 'transmision'],
  'ets': ['enfermedad', 'transmision', 'sexual', 'venerea'],
  'infeccion': ['contagio', 'enfermedad', 'transmitir'],
  'aborto': ['abortar', 'embarazada', 'feto', 'interrupcion'],
  'abandono': ['abandonar'],
  'omision': ['omitir', 'deber'],
  'omision de deberes': ['omision', 'deber', 'impedir'],
  'socorro': ['auxilio', 'socorrer', 'ayuda'],
  'ocultamiento': ['ocultar', 'encubrir'],
  'encubrimiento': ['encubrir', 'ocultar'],
  'receptacion': ['receptar', 'recibir', 'cosas', 'procedentes', 'delito'],
  'apropiacion': ['apropiar', 'apoderarse'],
  'usurpacion de funciones': ['usurpar', 'funciones', 'publicas', 'ejercer'],
  'rebelion': ['rebelar', 'sublevacion', 'sedicion', 'levantamiento'],
  'sedicion': ['sedicioso', 'sublevacion', 'rebelion'],
  'terrorismo': ['terror', 'terrorista'],
  'pirateria': ['pirata', 'mar', 'nave'],
  'genocidio': ['genocida', 'exterminio', 'grupo', 'nacional', 'etnico'],
  'lesa humanidad': ['lesa', 'humanidad', 'crimenes', 'guerra'],
  'tortura': ['torturar', 'malos tratos', 'sufrimiento'],
  'desaparicion': ['desaparecer', 'forzada', 'privacion', 'libertad'],
  'espionaje': ['espiar', 'secreto', 'estado'],
  'traicion': ['traicionar', 'patria', 'estado', 'nacion'],
  'contrabando': ['contrabandear', 'mercaderia', 'aduana'],
  'defraudacion': ['defraudar', 'tributos', 'impuestos', 'hacienda', 'fiscal'],
  'lavado': ['lavar', 'dinero', 'activos', 'capitales'],
  'trata': ['trata', 'personas', 'trafico', 'explotacion'],
  'explotacion': ['explotar', 'sexual', 'laboral', 'comercial'],
  'acoso': ['acosar', 'hostigar', 'perseguir'],
  'matrimonio': ['matrimonio', 'conyuges', 'esposos', 'nupcias'],
  'bigamia': ['bigeamia', 'dos', 'esposas'],
  'sustraccion de menores': ['sustraccion', 'menor', 'sustraer', 'nino'],
  'sustraccion': ['sustraer', 'sustraccion'],
  'calumnia': ['calumniar', 'falsa', 'imputacion', 'delito'],
  'injuria': ['injuriar', 'ofender', 'agravio', 'honor'],
  'difamacion': ['difamar', 'honor', 'reputacion'],
  'allanamiento de morada': ['allanamiento', 'morada', 'domicilio', 'ajeno'],
  'descubrimiento': ['descubrir', 'revelar', 'secreto'],
  'revelacion': ['revelar', 'secreto'],
  'violacion de secretos': ['secreto', 'revelar', 'descubrir'],
  'violacion de domicilio': ['allanamiento', 'domicilio', 'morada'],
  'violacion de correspondencia': ['correspondencia', 'cartas', 'documentos'],
  'quebrantamiento': ['quebrantar', 'condena', 'pena'],
  'prevaricacion': ['prevaricar', 'juez', 'injusta'],
  'omision del deber de socorro': ['omision', 'deber', 'socorro', 'auxilio', 'ayuda'],
  'omision de los deberes': ['omision', 'deberes', 'impedir', 'delito', 'persecucion'],
  'atribuciones': ['atribuciones', 'facultades'],
  'negociaciones': ['negociar', 'prohibidas'],
  'influencias': ['influencia', 'influir', 'valerse'],
  'infidelidad': ['infiel', 'infidelidad', 'custodia', 'documentos'],
  'desobediencia': ['desobedecer', 'resistencia', 'orden'],
  'resistencia': ['resistir', 'resistencia', 'autoridad', 'fuerza'],
  'atentado': ['atentar', 'autoridad', 'agente'],
  'desordenes': ['desorden', 'publico', 'alteracion'],
  'armas': ['arma', 'armas', 'porte', 'tenencia', 'trafico'],
  'estupefacientes': ['estupefaciente', 'droga', 'narcotico', 'sustancia'],
  'salud publica': ['salud', 'publica', 'medicamento', 'farmaco', 'alimento'],
  'farmaceuticos': ['farmaceutico', 'medicamento', 'farmacia', 'droga'],
  'alimentarios': ['alimento', 'comida', 'bebida', 'sustancia'],
  'epidemias': ['epidemia', 'enfermedad', 'contagio', 'propagacion'],
  'contaminacion': ['contaminar', 'sustancia', 'agua', 'ambiente', 'ecologia'],
  'medio ambiente': ['ambiente', 'medio', 'ecologia', 'naturaleza', 'flora', 'fauna'],
  'flora': ['flora', 'vegetacion', 'plantas', 'bosque'],
  'fauna': ['fauna', 'animales'],
  'patrimonio historico': ['patrimonio', 'historico', 'cultural', 'monumento', 'arqueologico'],
  'incendio forestal': ['incendio', 'forestal', 'bosque', 'fuego'],
  'urbanismo': ['urbanismo', 'construccion', 'edificacion', 'plan', 'urbano'],
  'propiedad intelectual': ['propiedad', 'intelectual', 'derecho', 'autor', 'patente', 'marca'],
  'fraude informatico': ['informatico', 'informatica', 'sistema', 'computadora', 'datos', 'cibernetico'],
  'homicidio imprudente': ['imprudente', 'culposo', 'imprudencia', 'negligencia', 'culpa'],
  'homicidio culposo': ['culposo', 'imprudente', 'imprudencia', 'negligencia', 'culpa'],
  'homicidio': ['matar', 'muerte', 'asesinar', 'matar'],
  'riña': ['rina', 'pelea', 'combate'],
  'aborto consentido': ['aborto', 'consentido'],
  'aborto forzado': ['aborto', 'forzado', 'violencia'],
  'aborto': ['abortar', 'embarazada', 'feto'],
  'feto': ['feto', 'lesion', 'embarazo'],
  'vida dependiente': ['vida', 'dependiente', 'recien nacido', 'neonato', 'infante'],
  'cohecho': ['coima', 'soborno', 'cohecho'],
  'cohecho activo': ['cohecho', 'activo', 'ofrecer'],
  'cohecho pasivo': ['cohecho', 'pasivo', 'recibir'],
  'malversacion': ['malversar', 'fondos', 'apropiacion'],
  'fraudes': ['fraude', 'estafa', 'engano'],
  'falso testimonio': ['falso', 'testimonio', 'falso', 'declaracion', 'mentir', 'perjurio'],
  'perjurio': ['perjuro', 'mentir', 'jurar', 'falso', 'declaracion'],
  'obstruccion': ['obstruir', 'obstaculizar', 'justicia'],
  'encubrimiento': ['encubrir', 'ocultar'],
  'obstruccion a la justicia': ['obstruir', 'justicia', 'impedir', 'estorbar'],
  'omision': ['omitir', 'deber'],
  'moneda': ['moneda', 'billete', 'falsa', 'falsificacion'],
  'falsificacion de moneda': ['moneda', 'falsa', 'falsificar'],
  'documentos': ['documento', 'falsificar', 'falsificacion'],
  'documentos publicos': ['documento', 'publico', 'oficial', 'falsificar'],
  'documentos privados': ['documento', 'privado', 'falsificar'],
  'usurpacion de identidad': ['identidad', 'usurpar', 'suplantar', 'nombre'],
  'sustitucion': ['sustituir', 'suplantar', 'reemplazar'],
  'atentados': ['atentar', 'autoridad'],
  'armas': ['armas', 'trafico', 'ilicito', 'porte'],
  'seguridad colectiva': ['seguridad', 'colectiva', 'peligro', 'comun', 'publico'],
  'radiactivo': ['radiactivo', 'radiacion', 'nuclear', 'energia'],
  'vial': ['vial', 'trafico', 'circulacion', 'vehiculo', 'conductor'],
  'vigilancia': ['vigilancia', 'observar', 'espiar'],
  'fiscales': ['fiscal', 'impuesto', 'tributo', 'hacienda'],
  'electoral': ['electoral', 'eleccion', 'voto', 'sufragio'],
  'expresion': ['expresion', 'manifestacion', 'libertad', 'opinion'],
  'reunion': ['reunion', 'asociacion', 'manifestacion'],
  'asociacion': ['asociacion', 'agrupacion', 'reunion'],
  'culto': ['culto', 'religion', 'creencia'],
  'instruccion': ['instruccion', 'educacion', 'ensenanza'],
  'seguridad laboral': ['seguridad', 'laboral', 'trabajo', 'higiene', 'ocupacional'],
  'sindical': ['sindical', 'sindicato', 'trabajador', 'huelga'],
  'discriminacion': ['discriminar', 'discriminacion', 'igualdad'],
  'salud laboral': ['salud', 'laboral', 'trabajo', 'ocupacional'],
  'accidente de trabajo': ['accidente', 'trabajo'],
  'tortura': ['tortura', 'torturar'],
  'desaparicion forzada': ['desaparicion', 'forzada'],
  'genocidio': ['genocidio'],
  'lesa humanidad': ['lesa', 'humanidad'],
  'pirateria': ['pirateria', 'pirata'],
  'comunidad internacional': ['comunidad', 'internacional', 'derecho', 'internacional'],
  'radiactivo': ['radiactivo', 'nuclear'],
  'seguridad del estado': ['seguridad', 'estado', 'nacion'],
  'espionaje': ['espionaje', 'espiar'],
  'produccion': ['produccion', 'fabricar', 'elaborar'],
  'trafico': ['trafico', 'transporte', 'distribucion', 'comercio'],
  'produccion de drogas': ['produccion', 'droga', 'fabricar', 'elaborar'],
  'trafico de drogas': ['trafico', 'droga', 'transporte'],
  'extorsion': ['extorsion', 'chantaje', 'amenaza'],
  'usura': ['usura', 'interes', 'credito'],
  'receptacion': ['receptacion', 'receptar', 'recibir'],
  'apropiacion indebida': ['apropiacion', 'indebida', 'apropiar'],
  'estafa simple': ['estafa', 'simple'],
  'estafa agravada': ['estafa', 'agravada', 'agravante'],
  'hurto simple': ['hurto', 'simple'],
  'hurto agravado': ['hurto', 'agravado', 'agravante'],
  'robo simple': ['robo', 'simple'],
  'robo agravado': ['robo', 'agravado', 'agravante'],
  'daño simple': ['dano', 'simple', 'destruir', 'danar'],
  'daño agravado': ['dano', 'agravado', 'destruir', 'danar'],
  'fraude': ['fraude', 'engano'],
  'fraude procesal': ['fraude', 'procesal'],
  'simulacion': ['simulacion', 'simular'],
  'encubrimiento': ['encubrir', 'encubrimiento'],
  'desobediencia': ['desobedecer', 'desobediencia'],
  'prevaricato': ['prevaricar', 'prevaricato'],
  'prevaricacion': ['prevaricar'],
  'cohecho': ['cohecho', 'sobornar'],
  'peculado': ['peculado', 'apropiacion', 'fondos', 'publicos'],
  'concussión': ['concusion'],
  'concusion': ['concusion'],
  'negociaciones prohibidas': ['negociaciones', 'prohibidas'],
  'influencias': ['influencias', 'valerse'],
  'infidelidad en la custodia': ['infidelidad', 'custodia', 'documentos'],
  'abuso de autoridad': ['abuso', 'autoridad'],
  'abuso contra particulares': ['abuso', 'particulares'],
  'denegacion de auxilio': ['denegacion', 'auxilio'],
  'prevaricacion': ['prevaricar'],
  'prevaricato': ['prevaricar'],
  'revelacion de secretos': ['revelar', 'secretos', 'descubrir'],
  'deslealtad': ['desleal'],
};

function expandirTokens(tokens) {
  const set = new Set(tokens);
  for (const t of [...tokens]) {
    if (SINONIMOS[t]) {
      for (const s of SINONIMOS[t]) set.add(s);
    }
  }
  return [...set];
}

function numArt(articuloStr) {
  if (!articuloStr) return null;
  const m = articuloStr.match(/Art\.?\s*(\d+)/i);
  return m ? parseInt(m[1], 10) : null;
}

const stats = { validado: 0, rechazar: 0, revisar: 0 };

for (const entry of validacion) {
  const num = numArt(entry.articulo_actual);
  const fuenteUrl = 'https://dpej.rae.es/eli/hn/d/2018/01/18/130';

  if (num == null) {
    entry.estado = 'rechazar';
    entry.articulo_correcto = 'NO IDENTIFICABLE';
    entry.notas = `No se pudo extraer número de artículo de "${entry.articulo_actual}".`;
    entry.fecha_validacion = '2026-06-04';
    entry.validador = 'agente';
    entry.fuente = fuenteUrl;
    entry.fuente_verificada = true;
    stats.rechazar++;
    continue;
  }

  const art = cpMap.get(num);
  if (!art) {
    entry.estado = 'rechazar';
    entry.articulo_correcto = 'NO EXISTE en CP vigente';
    entry.notas = `Art. ${num} no existe en el CP Honduras vigente (Decreto 130-2017). El catálogo referencia un artículo que no forma parte del articulado.`;
    entry.fecha_validacion = '2026-06-04';
    entry.validador = 'agente';
    entry.fuente = fuenteUrl;
    entry.fuente_verificada = true;
    stats.rechazar++;
    continue;
  }

  // Validación semántica: tokens del nombre del delito vs tokens del título del artículo
  const tokensNombre = expandirTokens(tokens(entry.nombre || ''));
  const tokensTitulo = expandirTokens(tokens(art.titulo || ''));

  // Intersección: cuántos tokens del nombre aparecen (con sinónimos) en el título
  const interseccion = tokensNombre.filter(t => tokensTitulo.includes(t));
  const porcentajeMatch = tokensNombre.length === 0 ? 0 : interseccion.length / tokensNombre.length;

  // Penalizaciones por palabras "marcadoras" del nombre que NO están en el título
  const stopKeywords = new Set(['grave', 'graves', 'simple', 'agravado', 'agravada', 'agravante', 'intencional', 'imprudente', 'culposo', 'culposa', 'consumado', 'tentativa', 'frustrada', 'especial', 'comun', 'basico', 'basica']);
  const tokensUtiles = tokensNombre.filter(t => !stopKeywords.has(t));
  const interseccionUtiles = tokensUtiles.filter(t => tokensTitulo.includes(t));
  const porcentajeUtiles = tokensUtiles.length === 0 ? 1 : interseccionUtiles.length / tokensUtiles.length;

  // También mirar el cuerpo del artículo (primeras 500 chars)
  const tokensCuerpo = expandirTokens(tokens(art.cuerpo.substring(0, 800)));
  const interseccionCuerpo = tokensNombre.filter(t => tokensCuerpo.includes(t));
  const porcentajeCuerpo = tokensNombre.length === 0 ? 0 : interseccionCuerpo.length / tokensNombre.length;

  const score = Math.max(porcentajeMatch, porcentajeUtiles, porcentajeCuerpo);

  let estado, articulo_correcto, notas;

  if (score >= 0.5) {
    // Hay match semántico suficiente
    estado = 'validado';
    articulo_correcto = `Art. ${num} CP`;
    notas = `Validado semánticamente (score=${score.toFixed(2)}). Art. ${num} CP: "${art.titulo.substring(0, 100)}". Match entre nombre y título/cuerpo del artículo.`;
  } else if (score >= 0.25) {
    // Match parcial
    estado = 'revisar';
    articulo_correcto = `Art. ${num} CP`;
    notas = `Match parcial (score=${score.toFixed(2)}). Art. ${num} CP trata sobre: "${art.titulo.substring(0, 100)}". El delito "${entry.nombre}" puede no corresponder a este artículo. Verificar manualmente.`;
  } else {
    // Sin match semántico
    estado = 'rechazar';
    articulo_correcto = `Art. ${num} CP (no coincide con "${entry.nombre}")`;
    notas = `Sin match semántico (score=${score.toFixed(2)}). El artículo ${num} CP trata sobre: "${art.titulo.substring(0, 100)}", pero el delito "${entry.nombre}" no parece corresponder.`;
  }

  entry.estado = estado;
  entry.articulo_correcto = articulo_correcto;
  entry.notas = notas;
  entry.fecha_validacion = '2026-06-04';
  entry.validador = 'agente';
  entry.fuente = fuenteUrl;
  entry.fuente_verificada = true;
  stats[estado]++;
}

fs.writeFileSync(valPath, JSON.stringify(validacion, null, 2) + '\n', 'utf8');
console.log('Resultado validación semántica:');
console.log('  Validados: ', stats.validado, '(match semántico >= 50%)');
console.log('  A revisar: ', stats.revisar, '(match parcial 25-50%)');
console.log('  Rechazados:', stats.rechazar, '(match < 25% o artículo no existe)');
console.log('Archivo actualizado:', valPath);
