"""
Auditoria cruzada: verifica cada delito del catalogo contra el texto real del CP.
Genera data/auditoria-cruzada.json con clasificacion y correcciones propuestas.
"""
import json
import re
import os
import sys
from difflib import SequenceMatcher

# ── Carga de datos ──────────────────────────────────────────────
BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

delitos = json.load(open(os.path.join(BASE, 'data', 'delitos.json'), 'r', encoding='utf-8'))
cp_arts = json.load(open(os.path.join(BASE, 'data', 'articulos_cp.json'), 'r', encoding='utf-8'))
cts_arts = json.load(open(os.path.join(BASE, 'data', 'articulos_constitucion.json'), 'r', encoding='utf-8'))
validacion = json.load(open(os.path.join(BASE, 'data', 'delitos-validacion.json'), 'r', encoding='utf-8'))
try:
    estados = json.load(open(os.path.join(BASE, 'data', 'delitos-estados.json'), 'r', encoding='utf-8'))
except:
    estados = {'entradas': {}}

# ── Indices ──────────────────────────────────────────────────────
cp_by_num = {}
for a in cp_arts:
    m = re.search(r'\d+', a.get('articulo', ''))
    if m:
        cp_by_num[int(m.group())] = a

cts_by_num = {}
for a in cts_arts:
    n = a.get('numero')
    if n is not None:
        cts_by_num[n] = a

val_by_id = {}
for v in validacion:
    if v.get('id'):
        val_by_id[v['id']] = v

# ── Funciones de extraccion de penas (mejoradas) ─────────────────

def _extraer_digitos(s):
    """Extract first number from a mixed string like 'uno (1)' -> 1"""
    m = re.search(r'\d+', s)
    if m:
        return int(m.group())
    nums = {
        'uno': 1, 'un': 1, 'dos': 2, 'tres': 3, 'cuatro': 4, 'cinco': 5,
        'seis': 6, 'siete': 7, 'ocho': 8, 'nueve': 9, 'diez': 10,
        'once': 11, 'doce': 12, 'trece': 13, 'catorce': 14, 'quince': 15,
        'dieciseis': 16, 'diecisiete': 17, 'dieciocho': 18, 'diecinueve': 19,
        'veinte': 20, 'veintiuno': 21, 'veintidos': 22, 'veintitres': 23,
        'veinticuatro': 24, 'veinticinco': 25, 'treinta': 30,
        'cuarenta': 40, 'cincuenta': 50, 'sesenta': 60, 'setenta': 70,
        'ochenta': 80, 'noventa': 90, 'cien': 100, 'doscientos': 200,
        'trescientos': 300, 'cuatrocientos': 400, 'quinientos': 500,
        'seiscientos': 600, 'setecientos': 700, 'ochocientos': 800,
        'novecientos': 900, 'mil': 1000, 'dos mil': 2000, 'tres mil': 3000,
        'cinco mil': 5000, 'diez mil': 10000, 'veinte mil': 20000,
        'cincuenta mil': 50000, 'cien mil': 100000,
    }
    words = s.lower().strip().split()
    for w in words:
        w = w.strip('.,;:()')
        if w in nums:
            return nums[w]
    return None

def anyos_a_meses(valor, unidad):
    u = (unidad or '').lower()
    if u.startswith('año') or u.startswith('ano'):
        return valor * 12
    return valor

def extraer_penas(texto):
    """Extrae todas las penas del texto de un articulo del CP.
    Retorna lista de dicts con tipo, min, max."""
    penas = []

    def add_prision(min_val, max_val, match_str):
        if min_val is not None and max_val is not None:
            penas.append({'tipo': 'prision', 'min': min_val, 'max': max_val, 'match': match_str[:80]})

    # Pattern A: "prision de ... a ... anos/meses" (direct order)
    for m in re.finditer(
        r'(?:pena\s+de\s+)?prisión\s+(?:de\s+)?(.+?)\s+a\s+(.+?)\s+(años?|meses?|anos?)',
        texto, re.IGNORECASE
    ):
        min_v = _extraer_digitos(m.group(1))
        max_v = _extraer_digitos(m.group(2))
        if min_v is not None and max_v is not None:
            add_prision(anyos_a_meses(min_v, m.group(3)), anyos_a_meses(max_v, m.group(3)), m.group(0))

    # Pattern B: "X a Y anos/meses de prision" (inverted order)
    for m in re.finditer(
        r'(?:pena\s+de|penas\s+de)\s+(.+?)\s+a\s+(.+?)\s+(años?|meses?|anos?)\s+de\s+prisión',
        texto, re.IGNORECASE
    ):
        min_v = _extraer_digitos(m.group(1))
        max_v = _extraer_digitos(m.group(2))
        if min_v is not None and max_v is not None:
            add_prision(anyos_a_meses(min_v, m.group(3)), anyos_a_meses(max_v, m.group(3)), m.group(0))

    # Pattern C: single value inverted "X anos de prision" (must NOT contain " a ")
    for m in re.finditer(
        r'(?:pena\s+de|penas\s+de)\s+(.+?)\s+(años?|meses?|anos?)\s+de\s+prisión',
        texto, re.IGNORECASE
    ):
        if ' a ' in m.group(1):
            continue
        v = _extraer_digitos(m.group(1))
        if v is not None:
            add_prision(anyos_a_meses(v, m.group(2)), anyos_a_meses(v, m.group(2)), m.group(0))

    # Pattern D: single value direct "prision de X anos/meses"
    for m in re.finditer(
        r'(?:pena\s+de\s+)?prisión\s+(?:de\s+)?(.+?)\s+(años?|meses?|anos?)',
        texto, re.IGNORECASE
    ):
        if ' a ' in m.group(1):
            continue
        # Exclude if it already matches a range (was caught by Pattern A)
        v = _extraer_digitos(m.group(1))
        if v is not None:
            add_prision(v, v, m.group(0))

    # Pattern E: "prestacion de servicios de utilidad publica de X a Y meses"
    for m in re.finditer(
        r'prestación\s+de\s+servicios\s+(?:de\s+utilidad\s+pública\s+)?(?:o\s+a\s+las\s+víctimas\s+)?de\s+(.+?)\s+a\s+(.+?)\s+(meses?|días?)',
        texto, re.IGNORECASE
    ):
        min_v = _extraer_digitos(m.group(1))
        max_v = _extraer_digitos(m.group(2))
        if min_v is not None and max_v is not None:
            penas.append({'tipo': 'servicios_publicos', 'min': min_v, 'max': max_v, 'unidad': m.group(3).lower(), 'match': m.group(0)[:80]})

    # Pattern F: "arresto domiciliario de X a Y meses"
    for m in re.finditer(
        r'arresto\s+(?:domiciliario|de\s+fin\s+de\s+semana)\s+de\s+(.+?)\s+a\s+(.+?)\s+(meses?|días?|semanas?)',
        texto, re.IGNORECASE
    ):
        min_v = _extraer_digitos(m.group(1))
        max_v = _extraer_digitos(m.group(2))
        if min_v is not None and max_v is not None:
            penas.append({'tipo': 'arresto_domiciliario', 'min': min_v, 'max': max_v, 'unidad': m.group(3).lower(), 'match': m.group(0)[:80]})

    # Pattern G: "multa de X a Y dias/meses"
    for m in re.finditer(
        r'multa\s+de\s+(.+?)\s+(?:a\s+(.+?)\s+)?(?:días?|salarios?|meses?)',
        texto, re.IGNORECASE
    ):
        min_v = _extraer_digitos(m.group(1))
        max_v = _extraer_digitos(m.group(2)) if m.group(2) else min_v
        unidad = 'dias'
        if 'mes' in m.group(0).lower():
            unidad = 'meses'
        if min_v is not None:
            penas.append({'tipo': 'multa', 'min': min_v, 'max': max_v or min_v, 'unidad': unidad, 'match': m.group(0)[:80]})

    # Pattern H: "inhabilitacion absoluta/especial de X a Y anos/meses"
    for m in re.finditer(
        r'inhabilitación\s+(absoluta|especial)\s+(?:de|por|hasta)?\s*(.+?)\s+a\s+(.+?)\s+(años?|meses?|anos?)',
        texto, re.IGNORECASE
    ):
        min_v = _extraer_digitos(m.group(2))
        max_v = _extraer_digitos(m.group(3))
        if min_v is not None and max_v is not None:
            penas.append({'tipo': 'inhabilitacion', 'alcance': m.group(1), 'min': min_v, 'max': max_v, 'unidad': m.group(4).lower(), 'match': m.group(0)[:80]})

    # Pattern I: Inhabilitacion without duration (just mentioned)
    for m in re.finditer(
        r'(?:pena\s+de\s+)?inhabilitación\s+(absoluta|especial)',
        texto, re.IGNORECASE
    ):
        already = any(p.get('tipo') == 'inhabilitacion' and p.get('alcance') == m.group(1) for p in penas)
        if not already:
            penas.append({'tipo': 'inhabilitacion', 'alcance': m.group(1), 'min': 0, 'max': 0, 'match': m.group(0)[:80]})

    # Perpetua
    if re.search(r'prisión\s+(?:a\s+)?perpetuidad|prisión\s+permanente|cadena\s+perpetua|reclusión\s+perpetua', texto, re.IGNORECASE):
        penas.append({'tipo': 'prision_perpetua', 'min': 9999, 'max': 9999, 'match': 'perpetua'})

    return penas

# ── Funciones de similitud ───────────────────────────────────────

def similarity(a, b):
    """SequenceMatcher ratio entre dos strings."""
    if not a or not b:
        return 0.0
    return SequenceMatcher(None, a.lower()[:500], b.lower()[:500]).ratio()

def normalizar(s):
    """Normaliza texto: minusculas, sin acentos, sin puntuacion extra."""
    s = s.lower()
    s = re.sub(r'[áàäâ]', 'a', s)
    s = re.sub(r'[éèëê]', 'e', s)
    s = re.sub(r'[íìïî]', 'i', s)
    s = re.sub(r'[óòöô]', 'o', s)
    s = re.sub(r'[úùüû]', 'u', s)
    s = re.sub(r'ñ', 'n', s)
    s = re.sub(r'[^a-z0-9\s]', ' ', s)
    s = re.sub(r'\s+', ' ', s)
    return s.strip()

def tokens(s):
    """Tokeniza un texto normalizado."""
    return [t for t in normalizar(s).split() if len(t) >= 3]

# ── Funcion principal de auditoria ───────────────────────────────

def extraer_num_articulo(articulo_str):
    if not articulo_str:
        return None
    m = re.search(r'Art\.?\s*(\d+)', articulo_str, re.IGNORECASE)
    return int(m.group(1)) if m else None

def auditar_delito(d, idx):
    """Audita un delito individual. Retorna dict con resultado."""
    num = extraer_num_articulo(d.get('articulo', ''))
    nombre = d.get('nombre', '')
    resultado = {
        'id': d.get('id', f'delito-{idx:04d}'),
        'nombre': nombre,
        'articulo_actual': d.get('articulo', ''),
        'articulo_num': num,
        'pena_min_actual': d.get('pena_minima_meses', 0),
        'pena_max_actual': d.get('pena_maxima_meses', 0),
        'pena_alt_min_actual': d.get('pena_alternativa_min', 0),
        'pena_alt_max_actual': d.get('pena_alternativa_max', 0),
        'tiene_alternativa_actual': d.get('tiene_pena_alternativa', False),
        'es_grave_actual': d.get('es_grave', False),
        'penas_accesorias_actual': d.get('penas_accesorias', []),
        'rama_id': d.get('rama_id', ''),
        'constitucion_id': d.get('constitucion_articulo_id'),
        'conducta_actual': d.get('conducta', '')[:300],
        'estado_previo': '',
        'clasificacion': '',
        'articulo_cp_encontrado': False,
        'articulo_cp_texto': '',
        'articulo_cp_epigrafe': '',
        'articulo_cp_tema': '',
        'penas_extraidas_cp': [],
        'similitud_conducta': 0.0,
        'pena_prision_cp_min': 0,
        'pena_prision_cp_max': 0,
        'pena_multas_cp': [],
        'pena_servicios_cp': [],
        'pena_arresto_cp': [],
        'inhabilitaciones_cp': [],
        'pena_perpetua_cp': False,
        'discrepancias': [],
        'correcciones': {},
        'constitucion_ok': False,
        'constitucion_texto': '',
    }

    # 1. Buscar articulo en CP
    if num is None:
        resultado['clasificacion'] = 'CORREGIR_ARTICULO'
        resultado['discrepancias'].append('No se pudo extraer numero de articulo')
        return resultado

    art_cp = cp_by_num.get(num)
    if art_cp is None:
        resultado['clasificacion'] = 'CORREGIR_ARTICULO'
        resultado['discrepancias'].append(f'Art. {num} no existe en el CP Honduras vigente')
        return resultado

    resultado['articulo_cp_encontrado'] = True
    resultado['articulo_cp_texto'] = art_cp.get('texto', '')[:500]
    resultado['articulo_cp_epigrafe'] = art_cp.get('epigrafe', '')
    resultado['articulo_cp_tema'] = art_cp.get('tema', '')

    # 2. Similitud entre conducta almacenada y texto real del CP
    conducta = d.get('conducta', '')
    texto_cp = art_cp.get('texto', '')
    resultado['similitud_conducta'] = similarity(conducta, texto_cp)

    # 3. Extraer penas del texto del CP
    penas_cp = extraer_penas(texto_cp)
    resultado['penas_extraidas_cp'] = penas_cp

    prisiones = [p for p in penas_cp if p['tipo'] == 'prision']
    perpetuas = [p for p in penas_cp if p['tipo'] == 'prision_perpetua']
    multas = [p for p in penas_cp if p['tipo'] == 'multa']
    servicios = [p for p in penas_cp if p['tipo'] == 'servicios_publicos']
    arrestos = [p for p in penas_cp if p['tipo'] == 'arresto_domiciliario']
    inhab = [p for p in penas_cp if p['tipo'] == 'inhabilitacion']

    if prisiones:
        resultado['pena_prision_cp_min'] = min(p['min'] for p in prisiones)
        resultado['pena_prision_cp_max'] = max(p['max'] for p in prisiones)
    if perpetuas:
        resultado['pena_perpetua_cp'] = True
        resultado['pena_prision_cp_min'] = 9999
        resultado['pena_prision_cp_max'] = 9999
    resultado['pena_multas_cp'] = [{'min': m['min'], 'max': m['max'], 'unidad': m.get('unidad', 'dias')} for m in multas]
    resultado['pena_servicios_cp'] = [{'min': s['min'], 'max': s['max'], 'unidad': s.get('unidad', 'meses')} for s in servicios]
    resultado['pena_arresto_cp'] = [{'min': a['min'], 'max': a['max'], 'unidad': a.get('unidad', 'meses')} for a in arrestos]
    resultado['inhabilitaciones_cp'] = [{'alcance': i.get('alcance', ''), 'min': i.get('min', 0), 'max': i.get('max', 0)} for i in inhab]

    # 4. Comparar penas
    penas_act = {
        'min': d.get('pena_minima_meses', 0),
        'max': d.get('pena_maxima_meses', 0),
    }
    penas_cp_prision = {
        'min': resultado['pena_prision_cp_min'],
        'max': resultado['pena_prision_cp_max'],
    }

    # 4a: Determinar si el delito tiene pena privativa de libertad segun CP
    tiene_prision_cp = len(prisiones) > 0 or len(perpetuas) > 0
    tiene_pena_no_privativa = len(servicios) > 0 or len(arrestos) > 0
    tiene_multa = len(multas) > 0

    # 4b: Comparar
    if not tiene_prision_cp and not tiene_pena_no_privativa and tiene_multa:
        # Solo tiene multa
        if d.get('pena_minima_meses', 0) == 0 and d.get('pena_maxima_meses', 0) == 0:
            resultado['clasificacion'] = 'SIN_PENA_PRIVATIVA'
            if not d.get('tiene_pena_alternativa') or d.get('pena_alternativa_min', 0) == 0:
                resultado['discrepancias'].append('Falta registrar la multa como pena alternativa')
                if multas:
                    resultado['correcciones']['pena_alternativa_min'] = multas[0]['min']
                    resultado['correcciones']['pena_alternativa_max'] = multas[0]['max']
                    resultado['correcciones']['tiene_pena_alternativa'] = True
        else:
            resultado['clasificacion'] = 'CORREGIR_PENA'
            resultado['discrepancias'].append(f'Articulo sin pena de prision pero catalogo tiene {penas_act["min"]}-{penas_act["max"]} meses. Debe ser 0.')
            resultado['correcciones']['pena_minima_meses'] = 0
            resultado['correcciones']['pena_maxima_meses'] = 0

    elif tiene_prision_cp:
        # Comparar rangos
        if penas_act['min'] == penas_cp_prision['min'] and penas_act['max'] == penas_cp_prision['max']:
            pass  # OK por ahora, se clasifica mas abajo
        elif penas_act['min'] == 0 and penas_act['max'] == 0:
            resultado['clasificacion'] = 'CORREGIR_PENA'
            resultado['discrepancias'].append(f'CP dice prision {penas_cp_prision["min"]}-{penas_cp_prision["max"]}m pero catalogo tiene 0-0')
            resultado['correcciones']['pena_minima_meses'] = penas_cp_prision['min']
            resultado['correcciones']['pena_maxima_meses'] = penas_cp_prision['max']
        else:
            resultado['clasificacion'] = 'CORREGIR_PENA'
            resultado['discrepancias'].append(f'Penas difieren: catalogo={penas_act["min"]}-{penas_act["max"]}m vs CP={penas_cp_prision["min"]}-{penas_cp_prision["max"]}m')
            resultado['correcciones']['pena_minima_meses'] = penas_cp_prision['min']
            resultado['correcciones']['pena_maxima_meses'] = penas_cp_prision['max']

        # Multas: ver si hay multa en CP que no este registrada
        if multas and not d.get('tiene_pena_alternativa'):
            resultado['discrepancias'].append('CP menciona multa pero no esta registrada como alternativa')
            resultado['correcciones']['pena_alternativa_min'] = multas[0]['min']
            resultado['correcciones']['pena_alternativa_max'] = multas[0]['max']
            resultado['correcciones']['tiene_pena_alternativa'] = True

    elif tiene_pena_no_privativa:
        resultado['clasificacion'] = 'SIN_PENA_PRIVATIVA'
        if d.get('pena_minima_meses', 0) > 0:
            resultado['discrepancias'].append(f'CP no tiene prision pero catalogo tiene {penas_act["min"]}-{penas_act["max"]}m')
            resultado['correcciones']['pena_minima_meses'] = 0
            resultado['correcciones']['pena_maxima_meses'] = 0

    else:
        # Sin pena detectable
        if d.get('pena_minima_meses', 0) > 0:
            resultado['clasificacion'] = 'REVISAR_MANUAL'
            resultado['discrepancias'].append(f'CP no tiene pena de prision detectable pero catalogo tiene {penas_act["min"]}-{penas_act["max"]}m')
        else:
            resultado['clasificacion'] = 'SIN_PENA_PRIVATIVA'

    # 5. Si no hubo discrepancia de penas, verificar similitud de conducta
    if resultado['clasificacion'] == '':
        sim = resultado['similitud_conducta']
        if sim >= 0.85:
            resultado['clasificacion'] = 'OK'
        elif sim >= 0.50:
            resultado['clasificacion'] = 'OK'
            resultado['discrepancias'].append(f'Conducta tiene similitud media ({sim:.2f}) con texto CP. Verificar.')
        else:
            resultado['clasificacion'] = 'REVISAR_MANUAL'
            resultado['discrepancias'].append(f'Conducta tiene similitud baja ({sim:.2f}) con texto CP. Posible articulo incorrecto.')

    # 6. Verificar es_grave
    if d.get('es_grave', False) and resultado['pena_prision_cp_max'] < 120 and resultado['pena_prision_cp_max'] > 0:
        resultado['discrepancias'].append(f'es_grave=true pero pena maxima CP es {resultado["pena_prision_cp_max"]}m (< 120m)')
        resultado['correcciones']['es_grave'] = False
    elif not d.get('es_grave', False) and resultado['pena_prision_cp_max'] >= 120:
        resultado['discrepancias'].append(f'es_grave=false pero pena maxima CP es {resultado["pena_prision_cp_max"]}m (>= 120m)')
        resultado['correcciones']['es_grave'] = True

    # 7. Verificar referencia constitucional
    cts_id = d.get('constitucion_articulo_id')
    if cts_id is not None and cts_id > 0:
        cts_art = cts_by_num.get(cts_id)
        if cts_art:
            resultado['constitucion_ok'] = True
            resultado['constitucion_texto'] = cts_art.get('texto', '')[:200]
        else:
            resultado['discrepancias'].append(f'Constitucion art. {cts_id} no existe en datos')
    elif cts_id == 0 or cts_id is None:
        pass  # Muchos delitos no tienen referencia constitucional

    # 8. Estado previo de validacion
    val_entry = val_by_id.get(d.get('id', ''))
    if val_entry:
        resultado['estado_previo'] = val_entry.get('estado', '')

    return resultado

# ── Ejecutar auditoria ───────────────────────────────────────────

print(f'Auditando {len(delitos)} delitos contra {len(cp_arts)} articulos del CP...')
print(f'Articulos de Constitucion: {len(cts_arts)}')
print()

resultados = []
stats = {'OK': 0, 'CORREGIR_PENA': 0, 'CORREGIR_ARTICULO': 0, 'SIN_PENA_PRIVATIVA': 0, 'REVISAR_MANUAL': 0}

for i, d in enumerate(delitos):
    res = auditar_delito(d, i)
    resultados.append(res)
    cls = res['clasificacion'] or 'OK'
    stats[cls] = stats.get(cls, 0) + 1

# ── Mostrar resumen ──────────────────────────────────────────────
print('=== RESULTADOS DE AUDITORIA ===')
print(f'Total delitos auditados: {len(resultados)}')
for k, v in sorted(stats.items()):
    pct = v/len(resultados)*100
    print(f'  {k}: {v} ({pct:.1f}%)')

# ── Mostrar discrepancias ────────────────────────────────────────
print()
print('=== DELITOS CON DISCREPANCIAS ===')
discrepantes = [r for r in resultados if r['clasificacion'] not in ('OK',)]
for r in discrepantes[:60]:
    print(f'\n[{r["clasificacion"]}] {r["nombre"]} ({r["articulo_actual"]})')
    for disc in r['discrepancias']:
        print(f'  ! {disc}')
    if r['correcciones']:
        print(f'  > Correcciones: {r["correcciones"]}')

if len(discrepantes) > 60:
    print(f'\n... y {len(discrepantes)-60} mas. Ver archivo completo.')

# ── Guardar informe completo ─────────────────────────────────────
informe = {
    'generado_en': '2026-06-05',
    'fuente_cp': 'data/articulos_cp.json',
    'fuente_delitos': 'data/delitos.json',
    'total_delitos': len(delitos),
    'estadisticas': stats,
    'resultados': resultados,
}

output_path = os.path.join(BASE, 'data', 'auditoria-cruzada.json')
with open(output_path, 'w', encoding='utf-8') as f:
    json.dump(informe, f, ensure_ascii=False, indent=2)
print(f'\nInforme guardado en: {output_path}')

# ── Generar resumen de correcciones ──────────────────────────────
correcciones = []
for r in resultados:
    if r['correcciones']:
        item = {
            'id': r['id'],
            'nombre': r['nombre'],
            'articulo': r['articulo_actual'],
            'clasificacion': r['clasificacion'],
            'correcciones': r['correcciones'],
            'discrepancias': r['discrepancias'],
        }
        correcciones.append(item)

corr_path = os.path.join(BASE, 'data', 'correcciones-pendientes.json')
with open(corr_path, 'w', encoding='utf-8') as f:
    json.dump(correcciones, f, ensure_ascii=False, indent=2)
print(f'Correcciones pendientes guardadas en: {corr_path}')
print(f'Total correcciones pendientes: {len(correcciones)}')
