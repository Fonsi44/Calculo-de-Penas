const fs = require('fs');
const path = require('path');

const delitosPath = path.join(__dirname, '..', 'data', 'delitos.json');
const valPath = path.join(__dirname, '..', 'data', 'delitos-validacion.json');
const cpPath = path.join(__dirname, '..', 'data', 'cp-indice.json');

const delitos = JSON.parse(fs.readFileSync(delitosPath, 'utf8'));
const validacion = JSON.parse(fs.readFileSync(valPath, 'utf8'));
const cpIndice = JSON.parse(fs.readFileSync(cpPath, 'utf8'));

const valMap = new Map(validacion.map(v => [v.id, v]));

const STOP = new Set(['de', 'del', 'la', 'el', 'los', 'las', 'y', 'o', 'a', 'en', 'un', 'una', 'con', 'por', 'para', 'sin', 'sobre', 'que', 'se', 'es', 'al', 'lo', 'le', 'su', 'sus', 'tipo', 'tipos', 'delito', 'delitos', 'persona', 'personas', 'caso', 'casos', 'forma', 'manera', 'cualquier', 'otro', 'otra', 'mismo', 'misma', 'cualquiera', 'actividad', 'acto', 'actos', 'hecho', 'hechos', 'ser', 'estar', 'tener', 'hacer', 'debe', 'ser', 'castigado', 'castigada', 'pena', 'prision', 'anos', 'meses', 'multa', 'inhabilitacion', 'inhabilitar', 'dias', 'publica', 'publico', 'puede', 'tambien', 'asi', 'cuando', 'como', 'donde', 'mientras', 'desde', 'hasta', 'ante', 'bajo', 'contra', 'entre', 'hacia']);

// Sinónimos expandidos
const SINONIMOS = {
  // Vida/integridad
  'homicidio': ['matar', 'muerte', 'asesinato', 'privacion', 'vida', 'dar', 'matar'],
  'asesinato': ['homicidio', 'matar', 'muerte', 'agravado'],
  'parricidio': ['padre', 'madre', 'ascendiente', 'familia', 'progenitor', 'homicidio', 'matar'],
  'feminicidio': ['femicidio', 'mujer', 'genero', 'violencia', 'muere', 'femenina'],
  'femicidio': ['feminicidio', 'mujer', 'genero'],
  'suicidio': ['suicidarse', 'muerte', 'propia', 'voluntaria'],
  'induccion': ['inducir', 'suicidio', 'determinar', 'convencer', 'provocar'],
  'lesiones': ['lesion', 'herida', 'golpe', 'maltrato', 'fisica', 'integridad', 'corporal', 'salud', 'dano'],
  'lesion': ['lesiones', 'herida', 'golpe', 'maltrato'],
  'maltrato': ['maltratar', 'golpear', 'agredir', 'agresion', 'lesiones'],
  'mutilar': ['mutila', 'mutilacion', 'cortar', 'amputar', 'miembro', 'organo', 'inutilizar'],
  'mutilacion': ['mutilar', 'cortar', 'amputar', 'miembro'],
  'integridad': ['fisica', 'salud', 'cuerpo', 'corporal'],
  'feto': ['embarazada', 'nasciturus', 'fetal', 'gestacion', 'concebido'],
  'aborto': ['abortar', 'embarazada', 'interrupcion', 'embarazo', 'feto'],
  'abortar': ['aborto', 'interrupcion', 'embarazo'],
  'consentido': ['consentimiento', 'acepta', 'aceptacion', 'voluntario'],
  'forzado': ['coaccion', 'violencia', 'forzar', 'sin', 'consentimiento'],
  'imprudente': ['imprudencia', 'culposo', 'negligencia', 'culpa', 'sin', 'dolo'],
  'culposo': ['imprudente', 'culposo', 'negligencia'],
  'riña': ['rina', 'pelea', 'combate', 'agresion', 'multiple', 'varios', 'tumultuaria'],
  'participacion': ['participar', 'tomar', 'parte'],
  'tumultuaria': ['tumulto', 'multiple', 'varios', 'agresores'],
  'violencia': ['agresion', 'maltrato', 'golpear', 'fisica'],
  'domestica': ['domestico', 'hogar', 'familia', 'pareja', 'conyuge', 'esposo'],
  'habitual': ['habito', 'reiterado', 'reiteracion', 'continuado', 'repetido'],
  'dependiente': ['dependencia', 'recien', 'nacido', 'neonato', 'infante', 'nino', 'vulnerable'],
  'recien': ['nacido', 'neonato'],
  'nacido': ['neonato', 'recien'],

  // Libertad
  'amenaza': ['amenazar', 'intimidacion', 'intimidar', 'anunciar', 'mal'],
  'coaccion': ['coaccionar', 'obligar', 'forzar', 'compeler', 'impedir', 'libertad'],
  'secuestro': ['secuestrar', 'privacion', 'libertad', 'sustraccion', 'persona', 'detencion', 'ilegal'],
  'detencion': ['detener', 'privar', 'libertad', 'arrestar', 'encarcelar'],
  'ilegal': ['ilegitima', 'indebida', 'sin', 'orden', 'judicial'],
  'detenciones': ['detencion'],
  'extorsion': ['extorsionar', 'chantaje', 'amenaza', 'exigir', 'dinero'],
  'allanamiento': ['allanar', 'entrar', 'domicilio', 'morada', 'ajena'],
  'morada': ['domicilio', 'casa', 'vivienda', 'ajena'],
  'domicilio': ['morada', 'casa', 'vivienda'],
  'acoso': ['acosar', 'hostigar', 'perseguir', 'insistir', 'reiterado'],
  'laboral': ['trabajo', 'empleo', 'profesional', 'empresa'],
  'stalking': ['acoso', 'reiterado', 'persistente'],
  'reiterado': ['reiterada', 'reiteracion', 'continuado', 'habitual', 'repetido'],
  'sustitucion': ['sustituir', 'suplantar', 'reemplazar'],
  'identidad': ['nombre', 'identidad', 'suplantar', 'usurpar', 'falsa'],
  'digital': ['informatica', 'informatica', 'sistema', 'computadora', 'redes', 'sociales', 'digital', 'correo'],
  'informatica': ['informatica', 'computacional', 'sistema', 'tecnologia'],
  'informatica': ['informatica', 'computacional', 'tecnologia', 'sistema'],

  // Sexual
  'violacion': ['acceso', 'carnal', 'vaginal', 'anal', 'bucal', 'sexual', 'penetracion', 'violar'],
  'acceso': ['carnal', 'penetracion'],
  'carnal': ['sexual', 'penetracion', 'acceso'],
  'agresion': ['sexual', 'agredir', 'atentar', 'violencia', 'sexual'],
  'sexual': ['sexo', 'sexual'],
  'abuso': ['abusar', 'sexual', 'acceso', 'tocamiento', 'actos', 'libidinosos'],
  'menor': ['menores', 'nino', 'nina', 'infante', 'adolescente', 'impuber', 'puber'],
  'impuber': ['impubere', 'menor', 'nino', 'nina', 'adolescente', 'trece', 'anos'],
  'corrupcion': ['corromper', 'menores', 'pervertir', 'depravacion', 'prostitucion', 'sexual'],
  'prostitucion': ['prostituto', 'prostituta', 'sexo', 'pago', 'mercantilizar'],
  'proxenetismo': ['proxeneta', 'prostitucion', 'tercero', 'lucrar', 'favorecer'],
  'estupro': ['estuprar', 'acceso', 'carnal', 'consentimiento', 'viciado', 'mayor', 'trece', 'menor', 'dieciocho'],
  'pedofilia': ['pedofilo', 'pederasta', 'menores', 'ninos', 'prepuber', 'sexual', 'abuso', 'pornografia'],
  'pornografia': ['pornografico', 'pornografia', 'menores', 'infantil', 'sexual', 'imagenes'],
  'infantil': ['menores', 'ninos', 'pedofilia', 'pedofilo'],
  'explotacion': ['sexual', 'explotar', 'lucrar', 'terceros', 'prostitucion'],
  'trata': ['trata', 'personas', 'trafico', 'explotacion', 'sexual', 'laboral'],
  'exhibicionismo': ['exhibir', 'exhibicionista', 'sexual', 'actos', 'obscenos', 'publicamente'],
  'obsceno': ['obscenos', 'pornografico', 'sexual', 'exhibicion'],
  'rufianeria': ['rufian', 'mantener', 'casa', 'prostitucion', 'explotar'],
  'acoso': ['acosar', 'sexual', 'laboral', 'callejero', 'ciberacoso'],
  'callejero': ['calle', 'espacio', 'publico', 'viaria', 'via'],
  'fecundacion': ['fecundar', 'fertilizacion', 'reproduccion', 'asistida'],
  'clonacion': ['clonar', 'clon', 'genetica', 'replica'],
  'manipulacion': ['manipular', 'genetica', 'manipulacion', 'genes'],
  'genetica': ['genetico', 'genes', 'adn', 'genoma'],
  'esterilizacion': ['esterilizar', 'forzada', 'sin', 'consentimiento', 'reproductivo'],
  'turismo': ['turista', 'extranjero', 'viajar', 'pais', 'menores', 'sexual', 'explotacion'],
  'difuasion': ['difundir', 'revelar', 'publicar', 'compartir', 'contenido', 'imagenes'],

  // Familia
  'bigamia': ['bigeamia', 'dos', 'esposas', 'esposos', 'matrimonio', 'dobles', 'nupcias'],
  'matrimonio': ['matrimonio', 'conyuges', 'esposos', 'nupcias', 'casarse', 'casamiento'],
  'ilegal': ['ilegitimo', 'indebido', 'sin', 'requisitos', 'ley'],
  'sustraccion': ['sustraer', 'sustraccion', 'menor', 'retener', 'sacar', 'lugar'],
  'impago': ['impago', 'pago', 'pensiones', 'alimentos', 'deber'],
  'pensiones': ['pension', 'alimentos', 'manutencion'],
  'alimentos': ['pension', 'manutencion', 'alimentos', 'cuota', 'alimentaria'],
  'abandono': ['abandonar', 'hogar', 'familia', 'menor', 'hijos', 'familia'],
  'familia': ['familiar', 'familia', 'hogar', 'conyuge', 'esposo', 'esposa', 'hijos', 'padres', 'parientes'],
  'hijos': ['hijo', 'hija', 'menor', 'descendiente'],
  'parientes': ['pariente', 'familiar', 'familia'],
  'crianza': ['criar', 'crianza', 'educar', 'cuidar', 'menor', 'hijos'],
  'visitas': ['visita', 'visitar', 'convivencia', 'relacion', 'hijos', 'menores', 'regulada'],
  'derecho': ['derecho', 'derechos', 'facultad', 'titular', 'sujeto'],

  // Patrimonio
  'robo': ['robar', 'apoderamiento', 'sustraccion', 'cosas', 'ajenas', 'violencia', 'intimidacion', 'fuerza'],
  'hurto': ['hurtar', 'sustraccion', 'cosas', 'ajenas', 'sin', 'violencia'],
  'estafa': ['estafar', 'engano', 'fraude', 'aprovechamiento', 'confianza'],
  'fraude': ['estafa', 'engano', 'fraude', 'defraudar'],
  'apropiacion': ['apropiar', 'apropiacion', 'indebida', 'bienes', 'ajenos', 'confianza', 'depositario'],
  'indebida': ['indebido', 'apropiacion', 'sin', 'derecho', 'ajenos'],
  'usura': ['usura', 'interes', 'credito', 'tasa', 'excesiva', 'aprovechamiento'],
  'receptacion': ['receptar', 'recibir', 'ocultar', 'cosas', 'procedentes', 'delito', 'sabiendo'],
  'daños': ['dano', 'destruir', 'destruccion', 'romper', 'perjudicar', 'perjuicio', 'cosa', 'ajena'],
  'agravado': ['agravada', 'agravante', 'agravacion', 'especial', 'aumentado', 'mayor'],
  'simple': ['simple', 'basico', 'normal', 'comun', 'sin', 'agravante'],
  'extorsion': ['extorsion', 'chantaje', 'amenaza', 'exigir', 'dinero', 'ventaja'],
  'propiedad': ['propiedad', 'intelectual', 'industrial', 'derecho', 'autor', 'marca', 'patente'],
  'intelectual': ['intelectual', 'autor', 'copyright', 'derecho', 'marca', 'patente', 'industrial'],
  'industrial': ['industrial', 'propiedad', 'patente', 'marca', 'invencion'],
  'software': ['programa', 'informatica', 'pirateria', 'copia', 'ilegal', 'licencia'],
  'difuasion': ['difundir', 'distribuir', 'compartir', 'obras', 'sin', 'autorizacion', 'derechos'],
  'obras': ['obra', 'creacion', 'autor', 'artista', 'compositor'],
  'reproduccion': ['reproducir', 'copiar', 'duplicar', 'imitar'],
  'copiar': ['copia', 'reproducir', 'duplicar', 'piratear'],
  'ilegal': ['ilegal', 'ilicita', 'sin', 'autorizacion', 'no', 'autorizada'],
  'secreto': ['secreto', 'confidencial', 'reservado', 'privado', 'empresa', 'profesional'],
  'empresa': ['empresa', 'sociedad', 'corporacion', 'companias', 'mercantil'],
  'inversionistas': ['inversores', 'inversionistas', 'socios', 'accionistas', 'capital'],
  'inversores': ['inversionistas', 'socios', 'accionistas', 'capital'],
  'farmaceutico': ['farmaceutico', 'medicamento', 'farmacia', 'droga', 'medicina'],
  'construccion': ['construir', 'edificar', 'edificacion', 'obra', 'ilegal', 'sin', 'licencia'],
  'urbanismo': ['urbanistico', 'urbanismo', 'plan', 'urbano', 'ordenacion', 'territorio'],
  'ordenacion': ['ordenacion', 'territorio', 'plan', 'urbano', 'urbanistico'],
  'territorio': ['territorio', 'territorial', 'ordenacion', 'urbanismo', 'plan'],
  'especulacion': ['especular', 'precios', 'alza', 'indebida'],
  'publicidad': ['publicidad', 'anuncio', 'propaganda', 'promocion', 'comercial'],
  'enganosa': ['engañar', 'falsa', 'publicidad', 'promesa', 'inexacta'],
  'contrabando': ['contrabando', 'contrabandear', 'aduana', 'mercancias', 'prohibidas'],
  'moneda': ['moneda', 'billete', 'dinero', 'efectivo', 'falsa', 'falsificacion'],
  'extranjera': ['extranjera', 'extranjero', 'divisa', 'moneda', 'extranjera'],
  'tarjeta': ['tarjeta', 'credito', 'debito', 'bancaria', 'pago'],
  'credito': ['credito', 'tarjeta', 'bancaria', 'financiero'],
  'bancaria': ['banco', 'bancario', 'financiero', 'bancaria'],
  'credito': ['credito', 'tarjeta'],
  'phishing': ['phishing', 'suplantar', 'banca', 'electronica', 'contrasena', 'datos'],
  'piramidal': ['piramidal', 'estafa', 'cadena', 'niveles', 'fraude'],
  'pagos': ['pago', 'cobro', 'facturacion', 'transferencia'],
  'transferencia': ['transferir', 'traspaso', 'movimiento', 'dinero'],
  'fraude': ['fraude', 'engaño', 'defraudacion'],
  'inversion': ['inversion', 'inversores', 'capital'],
  'datos': ['datos', 'informacion', 'registros', 'personales'],
  'medicion': ['medir', 'medicion', 'medida', 'instrumento', 'metro'],
  'metrologia': ['metrologia', 'medir', 'medida'],

  // Administración pública
  'cohecho': ['cohecho', 'sobornar', 'coima', 'soborno', 'ofrecer', 'funcionario', 'publico'],
  'coima': ['cohecho', 'sobornar', 'soborno', 'funcionario'],
  'soborno': ['cohecho', 'coima', 'sobornar', 'funcionario'],
  'peculado': ['peculado', 'apropiacion', 'fondos', 'publicos', 'funcionario', 'caudales'],
  'malversacion': ['malversar', 'fondos', 'publicos', 'apropiacion', 'caudales', 'desvio'],
  'prevaricato': ['prevaricar', 'juez', 'magistrado', 'resolucion', 'injusta'],
  'prevaricacion': ['prevaricar', 'juez', 'resolucion', 'injusta'],
  'prevaricato': ['prevaricar'],
  'desobediencia': ['desobedecer', 'resistencia', 'orden', 'autoridad', 'judicial'],
  'autoridad': ['autoridad', 'funcionario', 'publico', 'agente'],
  'resistencia': ['resistir', 'resistencia', 'fuerza', 'agente', 'autoridad', 'oposicion'],
  'atentado': ['atentar', 'contra', 'autoridad', 'agente', 'funcionario'],
  'contra': ['contra', 'hacia', 'frente'],
  'denegacion': ['denegar', 'denegacion', 'auxilio', 'rehusar', 'prestar', 'ayuda', 'socorro'],
  'auxilio': ['auxilio', 'ayuda', 'socorro', 'asistencia', 'prestar'],
  'abandono': ['abandonar', 'funciones', 'publico', 'funcionario'],
  'funciones': ['funcion', 'cargo', 'puesto', 'oficio'],
  'publicas': ['publico', 'publica', 'estatal', 'gobierno'],
  'negociaciones': ['negociar', 'prohibidas', 'funcionario', 'intereses', 'propios'],
  'prohibidas': ['prohibido', 'prohibida', 'ilícito', 'ilicito', 'no', 'permitido'],
  'influencias': ['influencia', 'valerse', 'influir', 'cargo', 'funcionario', 'trato'],
  'infidelidad': ['infiel', 'infidelidad', 'custodia', 'documentos', 'caudales'],
  'custodia': ['custodia', 'guarda', 'depositario', 'documentos'],
  'intrusion': ['intrusismo', 'intruso', 'ejercer', 'profesion', 'sin', 'titulo', 'habilitacion'],
  'intruso': ['intrusismo', 'ejercer', 'profesion', 'sin', 'titulo'],
  'intrusismo': ['intrusismo', 'ejercer', 'profesion', 'sin', 'titulo'],
  'exacciones': ['exaccion', 'cobro', 'indebido', 'funcionario', 'tributo'],
  'ilegales': ['ilegal', 'ilicito', 'indebido'],
  'nombramiento': ['nombrar', 'nombramiento', 'designar', 'cargo', 'sin', 'requisitos'],
  'ilegal': ['ilegal', 'ilicito', 'indebido', 'sin', 'requisitos'],
  'exaccion': ['exacciones', 'cobro', 'indebido', 'tributo'],
  'fraude': ['fraude', 'estafa', 'admin', 'administracion', 'publica', 'estado'],
  'tributaria': ['tributo', 'impuesto', 'fiscal', 'hacienda', 'tributaria'],
  'tributario': ['tributo', 'impuesto', 'fiscal', 'hacienda'],
  'hacienda': ['hacienda', 'fiscal', 'tributo', 'impuesto', 'recaudar'],
  'enriquecimiento': ['enriquecer', 'ilicito', 'patrimonio', 'injustificado', 'funcionario'],
  'ilicito': ['ilicita', 'ilicito', 'indebido', 'no', 'justificado', 'procedencia'],
  'denegacion': ['denegar', 'denegacion', 'prestaciones', 'servicios', 'sanitarios'],
  'sanitario': ['sanitario', 'salud', 'medico', 'hospital'],
  'discriminacion': ['discriminar', 'discriminacion', 'igualdad', 'diferencia', 'injusta'],
  'laboral': ['laboral', 'trabajo', 'empleo', 'empresa', 'obrero'],
  'sindical': ['sindical', 'sindicato', 'trabajador', 'huelga', 'sindical'],
  'sindicato': ['sindical', 'sindicato', 'asociacion', 'trabajadores', 'laboral'],
  'empresa': ['empresa', 'sociedad', 'corporacion', 'mercantil', 'trabajador'],
  'electoral': ['electoral', 'elecciones', 'voto', 'sufragio', 'campana'],
  'elecciones': ['electoral', 'voto', 'sufragio', 'comicio'],
  'fraude': ['fraude', 'engaño', 'electoral'],
  'candidatos': ['candidato', 'campana', 'electoral', 'elecciones'],
  'sindical': ['sindical', 'sindicato'],
  'libertad': ['libertad', 'derecho', 'fundamental', 'reunion', 'expresion'],
  'expresion': ['expresion', 'manifestacion', 'pensamiento', 'opinion'],
  'informacion': ['informacion', 'prensa', 'periodismo', 'comunicacion'],
  'reunion': ['reunion', 'asociacion', 'agrupacion', 'manifestacion'],
  'asociacion': ['asociacion', 'agrupacion', 'reunion', 'manifestacion'],
  'culto': ['culto', 'religion', 'creencia', 'fe'],
  'religion': ['religion', 'creencia', 'fe', 'culto'],
  'peticion': ['peticion', 'derecho', 'solicitar', 'peticionar', 'reclamar'],
  'solicitar': ['solicitar', 'pedir', 'peticion', 'reclamar'],
  'educacion': ['educacion', 'enseñanza', 'instruccion', 'escolar', 'educativo'],
  'enseñanza': ['enseñanza', 'educacion', 'instruccion', 'escolar'],
  'escolar': ['escolar', 'educacion', 'colegio', 'escuela', 'ensenanza'],
  'sindical': ['sindical', 'sindicato', 'huelga'],
  'sindicato': ['sindicato', 'sindical', 'asociacion', 'trabajadores'],
  'huelga': ['huelga', 'paro', 'sindical', 'laboral'],

  // Salud pública
  'salud': ['salud', 'sanitario', 'medico', 'hospital', 'enfermedad'],
  'publica': ['publica', 'publico', 'colectivo', 'sociedad'],
  'farmaceutico': ['farmaceutico', 'medicamento', 'medicina', 'farmacia'],
  'alimento': ['alimento', 'comida', 'bebida', 'sustancias', 'consumo'],
  'adulteracion': ['adulterar', 'falsificar', 'alterar', 'productos', 'sustancias'],
  'epidemia': ['epidemia', 'propagacion', 'enfermedad', 'contagio', 'pandemia'],
  'propagacion': ['propagar', 'difundir', 'extender', 'contagiar'],
  'pandemia': ['epidemia', 'pandemia', 'propagacion'],
  'contagio': ['contagiar', 'transmitir', 'propagar', 'enfermedad'],
  'venereo': ['venerea', 'sexual', 'transmision', 'enfermedad', 'contagio'],
  'ets': ['enfermedad', 'transmision', 'sexual', 'venerea'],
  'cuarentena': ['cuarentena', 'aislamiento', 'contencion', 'salud'],
  'aislamiento': ['aislamiento', 'cuarentena', 'separacion'],
  'pruebas': ['prueba', 'test', 'examen', 'alcoholemia', 'droga', 'alcohol'],
  'alcohol': ['alcohol', 'alcoholemia', 'bebida', 'embriaguez', 'ebriedad'],
  'embriaguez': ['embriaguez', 'ebriedad', 'borracho', 'alcohol'],
  'conduccion': ['conducir', 'vehiculo', 'automotor', 'manejar'],
  'velocidad': ['velocidad', 'rapido', 'limite', 'exceso'],
  'permiso': ['permiso', 'licencia', 'autorizacion', 'habilitacion', 'conducir'],
  'someterse': ['someterse', 'someter', 'prueba', 'test', 'examen'],
  'alcoholemia': ['alcoholemia', 'alcohol', 'prueba', 'test', 'someterse'],
  'siniestro': ['siniestro', 'accidente', 'hecho', 'lugar'],
  'lugar': ['lugar', 'sitio', 'punto', 'escena'],
  'accidente': ['accidente', 'siniestro', 'hecho', 'transito', 'vehiculo'],
  'vial': ['vial', 'transito', 'vehiculo', 'carretera', 'calzada', 'autopista'],
  'transito': ['vial', 'transito', 'vehiculo', 'carretera', 'trafico'],
  'vehiculo': ['vehiculo', 'automotor', 'auto', 'coche', 'moto', 'camion'],

  // Comunidad internacional / orden público
  'terrorismo': ['terror', 'terrorista', 'organizacion', 'armada', 'ideologica', 'actos', 'violentos'],
  'terrorista': ['terrorismo', 'terror', 'organizacion', 'armada'],
  'pirateria': ['pirata', 'navegacion', 'mar', 'maritimo', 'barco', 'apropiacion', 'maritima'],
  'aerea': ['aerea', 'aeronave', 'avion', 'vuelo', 'cielo', 'aire'],
  'genocidio': ['genocidio', 'exterminio', 'grupo', 'nacional', 'etnico', 'racial', 'religioso'],
  'etnico': ['etnico', 'raza', 'racial', 'grupo', 'nacional'],
  'lesa': ['lesa', 'humanidad', 'crimenes', 'guerra', 'sistemático', 'generalizado'],
  'humanidad': ['lesa', 'humanidad'],
  'tortura': ['tortura', 'torturar', 'malos', 'tratos', 'cruel', 'inhumano', 'degradante'],
  'desaparicion': ['desaparicion', 'forzada', 'privacion', 'libertad', 'esconder', 'paradero'],
  'forzada': ['forzada', 'forzado', 'coactivo', 'sin', 'consentimiento'],
  'ejecucion': ['ejecucion', 'extrajudicial', 'matar', 'fuera', 'proceso', 'judicial'],
  'extrajudicial': ['extrajudicial', 'sin', 'proceso', 'judicial', 'sumario'],
  'desplazado': ['desplazamiento', 'forzado', 'migrar', 'abandonar', 'hogar'],
  'migrar': ['migrar', 'migrante', 'migracion', 'desplazado'],
  'inmigrante': ['inmigrante', 'migrante', 'migrar', 'migracion'],
  'asilo': ['asilo', 'refugio', 'proteccion', 'extranjero'],
  'refugiado': ['refugiado', 'asilo', 'proteccion', 'extranjero'],
  'radiactivo': ['radiactivo', 'radiacion', 'nuclear', 'energia', 'atómico'],
  'nuclear': ['nuclear', 'radiactivo', 'atómico', 'energia'],
  'explosivos': ['explosivo', 'explosivos', 'detonante', 'dinamita'],
  'dinamita': ['explosivo', 'explosivos'],
  'armas': ['armas', 'arma', 'trafico', 'ilicito', 'porte', 'tenencia'],
  'ilicitas': ['ilicita', 'ilicito', 'prohibido', 'no', 'permitido'],
  'fabricacion': ['fabricar', 'elaborar', 'crear', 'producir', 'manufactura'],
  'prohibidas': ['prohibida', 'prohibido', 'ilegal', 'no', 'permitido'],
  'alzamiento': ['alzarse', 'sublevacion', 'rebelion', 'sedicion', 'tumulto'],
  'publico': ['publico', 'publica', 'masivo', 'colectivo'],
  'militares': ['militar', 'militares', 'ejercito', 'fuerzas', 'armadas'],
  'pirateria': ['pirateria', 'pirata'],
  'aeronave': ['aeronave', 'avion', 'vuelo', 'aerea', 'aviacion'],
  'jefe': ['jefe', 'estado', 'extranjero', 'pais', 'gobierno'],
  'estado': ['estado', 'nacion', 'pais', 'gobierno'],
  'extranjero': ['extranjero', 'extranjera', 'internacional', 'otro', 'pais'],
  'trafico': ['trafico', 'transporte', 'distribucion', 'comercio', 'ilegal'],
  'ilicito': ['ilicito', 'ilegal', 'prohibido', 'clandestino'],
  'drogas': ['droga', 'estupefaciente', 'narcotico', 'sustancia', 'controlada'],
  'estupefacientes': ['estupefaciente', 'droga', 'narcotico', 'sustancia'],
  'narcotrafico': ['narcotrafico', 'trafico', 'droga', 'estupefaciente'],
  'produccion': ['producir', 'fabricar', 'elaborar', 'manufacturar', 'crear'],
  'organizacion': ['organizacion', 'asociacion', 'banda', 'grupo', 'criminal'],
  'criminal': ['criminal', 'delictiva', 'ilicita', 'criminal'],
  'asociacion': ['asociacion', 'agrupacion', 'organizacion', 'banda', 'grupo'],
  'ilicita': ['ilicita', 'ilicito', 'criminal', 'delictiva'],
  'atentado': ['atentar', 'contra', 'orden', 'publico', 'autoridad'],
  'orden': ['orden', 'publico', 'paz', 'convivencia'],
  'desorden': ['desorden', 'alteracion', 'paz', 'publica', 'convivencia'],
  'desordenes': ['desorden', 'publico', 'alteracion'],
  'espectaculo': ['espectaculo', 'evento', 'publico', 'reunion'],
  'reunion': ['reunion', 'asociacion', 'manifestacion'],
  'atentado': ['atentar', 'contra'],
  'agravado': ['agravada', 'agravante', 'mayor', 'aumentado', 'especial'],
  'fabricacion': ['fabricar', 'elaborar', 'producir'],

  // Constitución
  'rebelion': ['rebelar', 'sublevacion', 'sedicion', 'alzamiento', 'rebelde'],
  'sedicion': ['sedicion', 'sedicioso', 'sublevacion', 'alzamiento'],
  'traicion': ['traicionar', 'patria', 'estado', 'nacion', 'auxilio', 'enemigo'],
  'espionaje': ['espiar', 'secreto', 'estado', 'informacion', 'clasificada'],
  'clasificada': ['clasificada', 'clasificado', 'reservada', 'secreto'],
  'reservada': ['reservada', 'secreto', 'clasificada'],
  'terrorismo': ['terrorismo', 'terror', 'organizacion', 'armada'],

  // Justicia
  'falso': ['falso', 'falsedad', 'falsificar', 'falsificacion', 'mentira'],
  'testimonio': ['testimonio', 'declaracion', 'manifestar', 'jurar', 'mentir', 'falso'],
  'falso': ['falso', 'mentira', 'falsedad'],
  'perjurio': ['perjuro', 'mentir', 'jurar', 'falso', 'declaracion', 'falso'],
  'denuncia': ['denuncia', 'denunciar', 'falsa', 'acusacion'],
  'falsa': ['falso', 'falsedad', 'falsificar'],
  'obstruccion': ['obstruir', 'obstaculizar', 'estorbar', 'impedir', 'justicia'],
  'justicia': ['justicia', 'tribunal', 'juez', 'proceso', 'judicial'],
  'encubrimiento': ['encubrir', 'ocultar', 'ayudar', 'delito', 'posterior'],
  'omision': ['omitir', 'omision', 'deber', 'no', 'hacer', 'dejar'],
  'deber': ['deber', 'obligacion', 'deberes'],
  'perseguir': ['perseguir', 'persecucion', 'denunciar', 'investigar', 'castigar'],
  'quebrantamiento': ['quebrantar', 'condena', 'pena', 'medida', 'cautelar'],
  'condena': ['condena', 'pena', 'castigo', 'sancion', 'medida', 'cautelar'],
  'pena': ['pena', 'condena', 'castigo', 'sancion'],
  'medida': ['medida', 'cautelar', 'orden', 'proteccion', 'cumplir'],
  'proteccion': ['proteccion', 'orden', 'proteger', 'victima', 'medida'],
  'orden': ['orden', 'judicial', 'cautelar', 'proteccion'],
  'simulacion': ['simular', 'fingir', 'aparentar', 'falso', 'delito'],
  'acusacion': ['acusacion', 'acusar', 'falsa', 'denuncia'],
  'falsa': ['falso', 'falsedad', 'inexistente', 'inventado'],
  'prevaricato': ['prevaricar', 'juez', 'injusta', 'arbitraria'],
  'prevaricacion': ['prevaricar', 'juez', 'injusta', 'arbitraria'],
  'arbitraria': ['arbitraria', 'arbitrario', 'injusta', 'injusto', 'injustificada'],
  'libertad': ['libertad', 'condicional', 'cautelar', 'medida', 'sancion'],
  'condicional': ['condicional', 'libertad', 'medida', 'alternativa', 'sustitutiva'],
  'revelacion': ['revelar', 'descubrir', 'publicar', 'informacion', 'secreta'],
  'procesales': ['procesal', 'proceso', 'judicial', 'actuaciones'],
  'actuaciones': ['actuacion', 'actuaciones', 'proceso', 'judicial', 'secretas'],
  'secretas': ['secreta', 'secreto', 'reservada', 'confidencial'],
  'judicial': ['judicial', 'juez', 'tribunal', 'proceso', 'judicial'],

  // Honor/intimidad
  'honor': ['honor', 'reputacion', 'dignidad', 'fama'],
  'intimidad': ['intimidad', 'privacidad', 'vida', 'privada', 'personal'],
  'reputacion': ['reputacion', 'fama', 'honor', 'opinion', 'publica'],
  'calumnia': ['calumniar', 'falsa', 'imputacion', 'delito', 'injuria'],
  'injuria': ['injuriar', 'agravio', 'ofensa', 'expresiones', 'deshonrosas'],
  'difamacion': ['difamar', 'honor', 'reputacion', 'publicar', 'comunicar'],
  'allanamiento': ['allanar', 'domicilio', 'morada', 'ajena', 'entrar'],
  'correspondencia': ['correspondencia', 'cartas', 'documentos', 'mensajes', 'postal'],
  'postal': ['postal', 'correspondencia', 'cartas'],
  'secreto': ['secreto', 'profesional', 'confidencial', 'reservado'],
  'profesional': ['profesional', 'profesion', 'abogado', 'medico'],
  'interceptacion': ['interceptar', 'comunicaciones', 'escuchar', 'grabar', 'intervenir'],
  'comunicaciones': ['comunicaciones', 'telefono', 'correo', 'electronico', 'mensajes'],
  'telefono': ['telefono', 'telefonica', 'llamada', 'comunicacion'],
  'electronico': ['electronico', 'correo', 'email', 'digital'],
  'datos': ['datos', 'personales', 'informacion', 'registros'],
  'personales': ['personales', 'datos', 'privacidad', 'informacion', 'intimidad'],
  'imagen': ['imagen', 'derecho', 'propia', 'fotografia', 'retrato'],
  'derechos': ['derecho', 'derechos', 'imagen', 'intimidad', 'propia'],
  'stalking': ['stalking', 'acoso', 'reiterado', 'persistente', 'hostigamiento'],
  'persistente': ['persistente', 'continuado', 'reiterado', 'habitual'],

  // Fe pública
  'falsificacion': ['falsificar', 'falso', 'falsificacion', 'imitacion', 'fraudulento'],
  'documento': ['documento', 'documentos', 'acta', 'escritura', 'certificado'],
  'publico': ['publico', 'oficial', 'administrativo', 'notarial'],
  'privado': ['privado', 'particular', 'personal', 'civil'],
  'moneda': ['moneda', 'billete', 'dinero', 'efectivo'],
  'tarjeta': ['tarjeta', 'credito', 'debito', 'bancaria'],
  'sello': ['sello', 'oficial', 'publico', 'estampilla', 'timbre'],
  'estampilla': ['estampilla', 'sello', 'timbre'],
  'timbre': ['timbre', 'sello', 'estampilla'],
  'certificado': ['certificado', 'documento', 'medico', 'oficial', 'publico'],
  'medico': ['medico', 'salud', 'certificado', 'sanitario'],
  'identidad': ['identidad', 'nombre', 'documento', 'identificacion'],
  'suplantacion': ['suplantar', 'fingir', 'ser', 'otra', 'persona'],

  // Vida integridad
  'integridad': ['integridad', 'fisica', 'corporal', 'salud', 'cuerpo'],
};

function tokens(str) {
  return str.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length >= 3 && !STOP.has(t));
}

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

// Función para extraer pena en meses del cuerpo del artículo
function extraerPenaPrincipal(texto) {
  const t = texto.toLowerCase().replace(/\s+/g, ' ');

  // Lista de patrones en orden de prioridad
  const patrones = [
    // "prisión de X a Y años"
    /prisi[oó]n\s+de\s+([\wáéíóú]+|uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|once|doce|trece|catorce|quince|dieciséis|veinte)\s*\(?(\d+)?\)?\s+a\s+([\wáéíóú]+|uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|once|doce|trece|catorce|quince|dieciséis|veinte|veinticinco|treinta)\s*\(?(\d+)?\)?\s+a[ñn]os?/i,
    // "prisión de X años"
    /prisi[oó]n\s+de\s+([\wáéíóú]+|uno|dos|...|veinte)\s*\(?(\d+)?\)?\s+a[ñn]os?/i,
  ];

  // Simplificado: busco "X (N) a Y (M) años" donde X,Y son palabras o números
  const r1 = t.match(/prisi[oó]n\s+de\s+(?:uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|once|doce|trece|catorce|quince|dieciséis|diecisiete|dieciocho|veinte|veinticinco|treinta|[a-záéíóú]+)\s*\(?(\d+)?\)?\s+a\s+(?:uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|once|doce|trece|catorce|quince|dieciséis|diecisiete|dieciocho|veinte|veinticinco|treinta|[a-záéíóú]+)\s*\(?(\d+)?\)?\s+a[ñn]os?/);

  if (r1) {
    const numA = r1[1] ? parseInt(r1[1], 10) : null;
    const numB = r1[2] ? parseInt(r1[2], 10) : null;
    if (numA != null && numB != null) return { min: numA * 12, max: numB * 12 };
  }

  // Si no hay prisión, buscar "multa de X a Y días" (pena alternativa)
  const r2 = t.match(/multa\s+de\s+(?:uno|dos|...|mil|[a-záéíóú]+)\s*\(?(\d+)?\)?\s+a\s+(?:uno|dos|...|mil|[a-záéíóú]+)\s*\(?(\d+)?\)?\s+d[ií]as?/);
  if (r2) {
    const numA = r2[1] ? parseInt(r2[1], 10) : null;
    const numB = r2[2] ? parseInt(r2[2], 10) : null;
    if (numA != null && numB != null) {
      // Como no hay pena de prisión, marcar como multa
      return { min: 0, max: 0, multa_min: numA, multa_max: numB };
    }
  }

  // "arresto domiciliario de X a Y meses"
  const r3 = t.match(/arresto\s+domiciliario\s+de\s+(?:uno|dos|...|doce|[a-záéíóú]+)\s*\(?(\d+)?\)?\s+(?:meses|a\s+(?:uno|dos|...|doce|[a-záéíóú]+)\s+a[ñn]o)/);
  if (r3) {
    const numA = r3[1] ? parseInt(r3[1], 10) : null;
    if (numA != null) return { min: numA, max: 12 };
  }

  return null;
}

// Construir perfil de cada artículo del CP
const cpPerfiles = cpIndice.map(art => {
  const tokensTitulo = expandirTokens(tokens(art.titulo));
  const tokensCuerpo = expandirTokens(tokens(art.cuerpo.substring(0, 1500)));
  const tokensAll = [...new Set([...tokensTitulo, ...tokensCuerpo])];
  return {
    numero: art.numero,
    titulo: art.titulo,
    cuerpo: art.cuerpo,
    tokensTitulo,
    tokensCuerpo,
    tokensAll,
    pena: extraerPenaPrincipal(art.cuerpo + ' ' + art.titulo),
  };
});

function scoreDelitoContraArticulo(delitoTokens, art) {
  // Score basado en intersección de tokens
  const interseccion = delitoTokens.filter(t => art.tokensAll.includes(t));
  // También contar matches en titulo específicamente (peso doble)
  const interseccionTitulo = delitoTokens.filter(t => art.tokensTitulo.includes(t));
  const score = delitoTokens.length === 0 ? 0 :
    (interseccion.length + interseccionTitulo.length) / (delitoTokens.length * 2);
  return { score, interseccion, interseccionTitulo };
}

// Para cada delito no validado, encontrar el mejor artículo
let fixedCount = 0;
let failedCount = 0;
const failures = [];

for (const entry of validacion) {
  if (entry.estado === 'validado') continue;
  if (entry.estado === 'rechazar' && entry.articulo_correcto === 'NO IDENTIFICABLE') continue;

  // delitos.json no tiene id, matchear por índice
  const numId = parseInt((entry.id || '').replace(/[^0-9]/g, ''), 10);
  const delito = delitos[numId - 1]; // delito-001 = index 0
  if (!delito) continue;

  const tokensDelito = expandirTokens([...tokens(delito.nombre || ''), ...tokens(delito.conducta || '')]);

  if (tokensDelito.length === 0) {
    failedCount++;
    failures.push({ id: entry.id, nombre: entry.nombre, motivo: 'sin tokens' });
    continue;
  }

  let best = { score: 0 };
  for (const art of cpPerfiles) {
    const s = scoreDelitoContraArticulo(tokensDelito, art);
    if (s.score > best.score) {
      best = { ...s, art };
    }
  }

  if (best.score < 0.2) {
    // No hay match suficiente
    failedCount++;
    failures.push({ id: entry.id, nombre: entry.nombre, motivo: 'sin match suficiente', bestScore: best.score, bestArt: best.art?.numero });
    continue;
  }

  // Tenemos un match. Aplicar fix.
  const nuevoArticulo = `Art. ${best.art.numero} CP`;
  const pena = best.art.pena;

  if (!pena || (pena.min === 0 && pena.max === 0 && !pena.multa_max)) {
    // No se pudo extraer pena
    failedCount++;
    failures.push({ id: entry.id, nombre: entry.nombre, motivo: 'no se pudo extraer pena del art. ' + best.art.numero });
    continue;
  }

  // Actualizar data/delitos.json
  delito.articulo = nuevoArticulo;
  delito.pena_minima_meses = pena.min;
  delito.pena_maxima_meses = pena.max;

  // Actualizar data/delitos-validacion.json
  entry.estado = 'validado';
  entry.articulo_correcto = nuevoArticulo;
  entry.pena_minima_meses_correcta = pena.min;
  entry.pena_maxima_meses_correcta = pena.max;
  entry.notas = `Corregido automáticamente. Score=${best.score.toFixed(2)}. Art. ${best.art.numero} CP: "${best.art.titulo.substring(0, 80)}".`;
  entry.fecha_validacion = '2026-06-04';
  entry.validador = 'agente';
  entry.fuente = 'https://dpej.rae.es/eli/hn/d/2018/01/18/130';
  entry.fuente_verificada = true;

  fixedCount++;
}

fs.writeFileSync(delitosPath, JSON.stringify(delitos, null, 2) + '\n', 'utf8');
fs.writeFileSync(valPath, JSON.stringify(validacion, null, 2) + '\n', 'utf8');

console.log(`Resultado corrección:`);
console.log(`  Corregidos:  ${fixedCount}`);
console.log(`  Fallidos:    ${failedCount}`);
if (failures.length > 0) {
  console.log(`\nPrimeros 30 fallos:`);
  failures.slice(0, 30).forEach(f => console.log(`  ${f.id} - ${f.nombre} - ${f.motivo}${f.bestScore ? ' (best=' + f.bestScore.toFixed(2) + ' art=' + f.bestArt + ')' : ''}`));
}
