import fitz
import re
import json
import os

PDF_PATH = 'docs/Constitucion de Honduras.pdf'
OUT_PATH = 'data/articulos_constitucion.json'

doc = fitz.open(PDF_PATH)

# Extract all text from all pages
all_lines = []
for i in range(len(doc)):
    text = doc[i].get_text()
    for line in text.split('\n'):
        stripped = line.strip()
        if stripped:
            all_lines.append(stripped)

# State tracking
current_titulo = ''
current_capitulo = ''
current_seccion = ''

articles = []
i = 0
while i < len(all_lines):
    line = all_lines[i]

    # Match TITULO/TÍTULO
    m_tit = re.match(r'^T[IÍ]TULO\s+(.+)', line, re.IGNORECASE)
    if m_tit:
        current_titulo = m_tit.group(1).strip()
        current_capitulo = ''
        current_seccion = ''
        i += 1
        continue

    # Match CAPITULO/CAPÍTULO
    m_cap = re.match(r'^CAP[IÍ]TULO\s+(.+)', line, re.IGNORECASE)
    if m_cap:
        current_capitulo = m_cap.group(1).strip()
        current_seccion = ''
        i += 1
        continue

    # Match SECCION/SECCIÓN
    m_sec = re.match(r'^SECCI[OÓ]N\s+(.+)', line, re.IGNORECASE)
    if m_sec:
        current_seccion = m_sec.group(1).strip()
        i += 1
        continue

    # Match ARTICULO/ARTÍCULO NNN(-LETTER)?(.XX)?
    m_art = re.match(r'^ART[IÍ]CULO\s+(\d+)(-([A-Z]))?(?:\.\d+)?\.?\s*(.*)', line, re.IGNORECASE)
    if m_art:
        num = int(m_art.group(1))
        letter = m_art.group(3) or ''
        first_text = m_art.group(4).strip()

        # Build full article reference string
        suffix = f'-{letter}' if letter else ''
        art_ref = f'Art. {num}{suffix} Constitución'

        # Deduplicate: skip if we already have this exact (numero, letter) pair
        already_exists = any(a['numero'] == num and (a.get('letter', '') or '') == letter for a in articles)
        if already_exists:
            i += 1
            continue

        # Collect full article text (following lines until next ARTICULO/TITULO/CAPITULO/SECCION/header)
        article_lines = [first_text] if first_text else []
        j = i + 1
        while j < len(all_lines):
            next_line = all_lines[j]
            if re.match(r'^(ART[IÍ]CULO|T[IÍ]TULO|CAP[IÍ]TULO|SECCI[OÓ]N)\s', next_line, re.IGNORECASE):
                break
            # Skip page headers (CENTRO ELECTRONICO...)
            if 'CENTRO ELECTR' in next_line or ('Constituci' in next_line and '1982' in next_line):
                j += 1
                continue
            # Skip page footer with reform notes (e.g. "24 Artículo 145. Reformado por...")
            if re.match(r'^\d+\s+Art[íi]culo\s+\d+\.', next_line):
                article_lines.append(f'[Nota: {next_line}]')
                j += 1
                continue
            # Skip signature lines at the end of the document
            if any(sig in next_line for sig in ['JUAN PABLO URRUTIA', 'POLICARPO PAZ', 'OSCAR MEJIA', 'Por tanto', 'Tegucigalpa', 'Secretario', 'Presidente', 'El Secretario']):
                j += 1
                continue
            article_lines.append(next_line)
            j += 1

        article_text = ' '.join(article_lines)
        # Clean up whitespace
        article_text = re.sub(r'\s+', ' ', article_text).strip()

        entry = {
            'numero': num,
            'articulo': art_ref,
            'titulo': current_titulo if current_titulo else None,
            'capitulo': current_capitulo if current_capitulo else None,
            'texto': article_text,
        }
        if current_seccion:
            entry['seccion'] = current_seccion
        articles.append(entry)

        i = j
        continue

    i += 1

# Sort by article number
articles.sort(key=lambda x: x['numero'])

print(f'Artículos extraídos: {len(articles)}')
print(f'Rango: {articles[0]["numero"]} - {articles[-1]["numero"]}')

# Check for gaps
nums = [a['numero'] for a in articles]
full_range = set(range(nums[0], nums[-1] + 1))
missing = sorted(full_range - set(nums))
if missing:
    print(f'Faltantes: {len(missing)}')
else:
    print('Sin gaps')

# Check encoding - look for U+FFFD replacement characters which mean mojibake
repchar = '\ufffd'
bad = [a for a in articles if repchar in a['texto']]
if bad:
    print(f'WARNING: {len(bad)} articulos con caracteres de reemplazo (U+FFFD)')
    for b in bad[:5]:
        n = b['numero']
        print(f'  Art. {n}: texto corrupto')
else:
    print('Sin U+FFFD en texto')

# Also check that 'Ó' appears properly (it was in the first line)
if any('Ó' in a['texto'] for a in articles[:5]):
    print('Acentos OK en primeros articulos')
else:
    print('ATENCION: No se detectaron acentos en articulos iniciales')

# Write output
os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
with open(OUT_PATH, 'w', encoding='utf-8') as f:
    json.dump(articles, f, ensure_ascii=False, indent=2)

print(f'JSON escrito en {OUT_PATH}')
size = os.path.getsize(OUT_PATH)
print(f'  Tamano: {size} bytes')
doc.close()

# Verify JSON re-reads ok
with open(OUT_PATH, 'r', encoding='utf-8') as f:
    verify = json.load(f)
print(f'  Verificado: {len(verify)} articulos OK en JSON')

