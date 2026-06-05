import json
import re
import os

cp = json.load(open('data/articulos_cp.json', 'r', encoding='utf-8'))
delitos_actual = json.load(open('data/delitos.json', 'r', encoding='utf-8'))

def años_a_meses(valor, unidad):
    u = (unidad or '').lower()
    if u.startswith('año') or u.startswith('ano'):
        return valor * 12
    return valor

def _extraer_digitos(s):
    """Extract first number from a string like 'uno (1)' -> 1, or '3' -> 3"""
    m = re.search(r'\d+', s)
    if m:
        return int(m.group())
    nums = {'uno': 1, 'dos': 2, 'tres': 3, 'cuatro': 4, 'cinco': 5, 'seis': 6, 'siete': 7,
            'ocho': 8, 'nueve': 9, 'diez': 10, 'once': 11, 'doce': 12, 'trece': 13,
            'catorce': 14, 'quince': 15, 'dieciseis': 16, 'diecisiete': 17, 'dieciocho': 18,
            'diecinueve': 19, 'veinte': 20, 'veintiun': 21, 'veintiuno': 21, 'veintidos': 22,
            'veintitres': 23, 'veinticuatro': 24, 'veinticinco': 25, 'treinta': 30,
            'cuarenta': 40, 'cincuenta': 50, 'sesenta': 60, 'setenta': 70, 'ochenta': 80,
            'noventa': 90, 'cien': 100, 'doscientos': 200, 'trescientos': 300,
            'quinientos': 500, 'mil': 1000}
    words = s.lower().strip().split()
    for w in words:
        if w in nums:
            return nums[w]
    return None

def extraer_penas(texto):
    penas = []

    # Helper: normalize and add a prison penalty
    def add_prision(min_val, max_val, match_str):
        if min_val and max_val:
            penas.append({'tipo': 'prision', 'min': min_val, 'max': max_val, 'match': match_str[:60]})

    # Pattern A: "prisión de ... a ... años/meses" (direct order)
    for m in re.finditer(
        r'(?:pena\s+de\s+)?prisión\s+(?:de\s+)?(.+?)\s+a\s+(.+?)\s+(años?|meses?|anos?)',
        texto, re.IGNORECASE
    ):
        min_v = _extraer_digitos(m.group(1))
        max_v = _extraer_digitos(m.group(2))
        if min_v and max_v:
            add_prision(años_a_meses(min_v, m.group(3)), años_a_meses(max_v, m.group(3)), m.group(0))

    # Pattern B: "pena de X a Y años de prisión" (inverted order)
    for m in re.finditer(
        r'(?:pena\s+de|penas\s+de)\s+(.+?)\s+a\s+(.+?)\s+(años?|meses?|anos?)\s+de\s+prisión',
        texto, re.IGNORECASE
    ):
        min_v = _extraer_digitos(m.group(1))
        max_v = _extraer_digitos(m.group(2))
        if min_v and max_v:
            add_prision(años_a_meses(min_v, m.group(3)), años_a_meses(max_v, m.group(3)), m.group(0))

    # Pattern C: "X años de prisión" (single value, inverted, after "pena de")
    for m in re.finditer(
        r'(?:pena\s+de|penas\s+de)\s+(.+?)\s+(años?|meses?|anos?)\s+de\s+prisión',
        texto, re.IGNORECASE
    ):
        if ' a ' in m.group(0):
            continue
        v = _extraer_digitos(m.group(1))
        if v:
            add_prision(años_a_meses(v, m.group(2)), años_a_meses(v, m.group(2)), m.group(0))

    # Pattern D: "prisión de ... años/meses" (single value, direct)
    for m in re.finditer(
        r'(?:pena\s+de\s+)?prisión\s+(?:de\s+)?(.+?)\s+(años?|meses?|anos?)',
        texto, re.IGNORECASE
    ):
        if ' a ' in m.group(0):
            continue
        v = _extraer_digitos(m.group(1))
        if v:
            add_prision(años_a_meses(v, m.group(2)), años_a_meses(v, m.group(2)), m.group(0))

    # Multa: "multa de ... a ... días"
    for m in re.finditer(
        r'multa\s+de\s+(.+?)\s+(?:a\s+(.+?))?\s*(?:días?|salarios?|meses?)',
        texto, re.IGNORECASE
    ):
        min_v = _extraer_digitos(m.group(1))
        max_v = _extraer_digitos(m.group(2)) if m.group(2) else min_v
        if min_v:
            penas.append({'tipo': 'multa', 'min': min_v, 'max': max_v or min_v, 'match': m.group(0)[:60]})

    # Inhabilitacion
    for m in re.finditer(
        r'inhabilitación\s+(absoluta|especial)',
        texto, re.IGNORECASE
    ):
        penas.append({'tipo': 'inhabilitacion', 'alcance': m.group(1), 'match': m.group(0)[:60]})

    # Perpetua / prisión a perpetuidad
    if re.search(r'prisión\s+(?:a\s+)?perpetuidad|prisión\s+permanente|cadena\s+perpetua|reclusión\s+perpetua', texto, re.IGNORECASE):
        penas.append({'tipo': 'prision_perpetua', 'min': 9999, 'max': 9999, 'match': 'perpetua'})

    return penas

def dividir_por_pena_distinta(texto):
    split_points = [
        r'Las\s+penas\s+(?:previstas|se\s+deben)\s+',
        r'Se\s+(?:impondrá|aplicará)\s+',
        r'El\s+hecho\s+previsto\s+en\s+el\s+artículo\s+',
        r'Cuando\s+el\s+sujeto\s+',
        r'La\s+pena\s+de\s+prisión\s+',
    ]
    candidates = sorted(set(
        m.start() for pat in split_points
        for m in re.finditer(pat, texto, re.IGNORECASE)
        if m.start() > 100
    ))
    if not candidates:
        return [texto.strip()]
    segments = []
    last = 0
    for pos in candidates:
        if pos - last > 30:
            segments.append(texto[last:pos].strip())
            last = pos
    segments.append(texto[last:].strip())
    segments = [s for s in segments if len(s) > 30]

    # Check: only split if >=2 segments have different prison ranges
    ranges_per_seg = []
    for s in segments:
        penas = extraer_penas(s)
        prision = [p for p in penas if p['tipo'] == 'prision']
        if prision:
            ranges_per_seg.append((prision[0]['min'], prision[0]['max']))
    unique_ranges = set(ranges_per_seg)
    if len(unique_ranges) >= 2 and len(segments) >= 2:
        return segments
    return [texto.strip()]

def entry_from_text(art_num, articulo, epigrafe, texto, modalidad_label='', nota=''):
    penas = extraer_penas(texto)
    prision = [p for p in penas if p['tipo'] in ('prision', 'prision_perpetua')]
    multa = [p for p in penas if p['tipo'] == 'multa']
    inhab = [p for p in penas if p['tipo'] == 'inhabilitacion']

    if prision:
        pena_min = min(p['min'] for p in prision)
        pena_max = max(p['max'] for p in prision)
    else:
        pena_min = 0
        pena_max = 0

    penas_acc = list(set(
        'Inhabilitación absoluta' if p.get('alcance') == 'absoluta' else 'Inhabilitación especial'
        for p in inhab
    ))

    conducta_text = texto[:250].replace('\n', ' ').strip()
    nombre = epigrafe if epigrafe and len(epigrafe) > 3 else f"{articulo} CP"
    if modalidad_label:
        nombre = f"{nombre} ({modalidad_label})"

    return {
        'nombre': nombre,
        'articulo': articulo,
        'conducta': conducta_text,
        'pena_minima_meses': pena_min,
        'pena_maxima_meses': pena_max,
        'tiene_pena_alternativa': len(multa) > 0,
        'pena_alternativa_min': multa[0]['min'] if multa else 0,
        'pena_alternativa_max': multa[0]['max'] if multa else 0,
        'penas_accesorias': penas_acc,
        'rama_id': '',
        'constitucion_articulo_id': None,
        'fuente_pena': 'parsing',
        'nota': nota,
    }

cp_delitos = [a for a in cp if a.get('tema') == 'delitos']
propuestos = []

for a in cp_delitos:
    m = re.search(r'\d+', a['articulo'])
    if not m:
        continue
    num = int(m.group())
    texto = a.get('texto', '') or ''
    epigrafe = a.get('epigrafe', '') or ''

    modalidades = dividir_por_pena_distinta(texto)

    if len(modalidades) == 1:
        propuestos.append(entry_from_text(num, a['articulo'], epigrafe, modalidades[0]))
    else:
        for i, mod_text in enumerate(modalidades):
            propuestos.append(entry_from_text(num, a['articulo'], epigrafe, mod_text, f'modalidad {i+1}', f'Modalidad {i+1} de {a["articulo"]}'))

print(f'Articulos procesados: {len(cp_delitos)}')
print(f'Entradas propuestas: {len(propuestos)}')

with_pena = [e for e in propuestos if e['pena_minima_meses'] > 0]
without = [e for e in propuestos if e['pena_minima_meses'] == 0 and e['pena_maxima_meses'] == 0]
print(f'Con prision detectada: {len(with_pena)} ({len(with_pena)/len(propuestos)*100:.1f}%)')
print(f'Sin penalidad: {len(without)}')

print('\n--- Muestras con pena ---')
for e in with_pena[:8]:
    print(f'  {e["nombre"]}: {e["articulo"]} | {e["pena_minima_meses"]}-{e["pena_maxima_meses"]}m')

with open('data/delitos-propuestos.json', 'w', encoding='utf-8') as f:
    json.dump(propuestos, f, ensure_ascii=False, indent=2)
print(f'\nSalvado en data/delitos-propuestos.json ({os.path.getsize("data/delitos-propuestos.json")} bytes)')
