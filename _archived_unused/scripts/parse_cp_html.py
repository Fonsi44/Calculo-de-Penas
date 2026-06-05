#!/usr/bin/env python3
"""
Parse the CP Honduras HTML (Decreto 130-2017) and extract all articles into a JSON array.
"""

import re
import json
import sys
from collections import Counter

HTML_PATH = r"C:\Users\Admin\.local\share\opencode\tool-output\tool_e88eb87e9001RcYPJbjkWDWSCR"
OUTPUT_PATH = r"C:\Users\Admin\OneDrive - Alfons Roiget\Calculo de penas\data\articulos_cp.json"

def clean_html(text):
    """Remove HTML tags from text, preserving paragraph structure."""
    text = re.sub(r'<br\s*/?>', '\n', text)
    text = re.sub(r'<[^>]+>', '', text)
    # HTML entities
    text = text.replace('&amp;', '&').replace('&lt;', '<').replace('&gt;', '>')
    text = text.replace('&quot;', '"').replace('&nbsp;', ' ')
    text = text.replace('&#241;', 'ñ').replace('&#209;', 'Ñ')
    text = text.replace('&#225;', 'á').replace('&#233;', 'é').replace('&#237;', 'í')
    text = text.replace('&#243;', 'ó').replace('&#250;', 'ú')
    text = text.replace('&#193;', 'Á').replace('&#201;', 'É').replace('&#205;', 'Í')
    text = text.replace('&#211;', 'Ó').replace('&#218;', 'Ú')
    text = text.replace('&#252;', 'ü').replace('&#220;', 'Ü')
    text = text.replace('\ufffd', '')
    text = re.sub(r'[ \t]+', ' ', text)
    text = re.sub(r'\n\s*\n', '\n\n', text)
    text = text.strip()
    return text


def classify_libro(text):
    m = re.search(r'LIBRO\s+(I{0,3}V?I{0,3}|[IVXLCD]+)', text)
    if m:
        return f"Libro {m.group(1)}"
    return None

def classify_titulo(text):
    m = re.search(r'T[IÍ]TULO\s+(PRELIMINAR|[IVXLCD]+)\s*[-–—]?\s*(.*)', text)
    if m:
        num = m.group(1)
        name = m.group(2).strip() if m.group(2) else ''
        name = re.sub(r'\s*\.$', '', name).strip()
        if name:
            # Remove extra spaces
            name = re.sub(r'\s+', ' ', name)
            return f"Título {num} — {name}"
        return f"Título {num}"
    return None

def classify_capitulo(text):
    m = re.search(r'CAP[IÍ]TULO\s+([IVXLCD]+)\s*[-–—]?\s*(.*)', text)
    if m:
        num = m.group(1)
        name = m.group(2).strip() if m.group(2) else ''
        name = re.sub(r'\s*\.$', '', name).strip()
        if name:
            name = re.sub(r'\s+', ' ', name)
            return f"Capítulo {num} — {name}"
        return f"Capítulo {num}"
    return None

def classify_seccion(text):
    m = re.search(r'SECCI[OÓ]N\s+([IVXLCD]+)\s*[-–—]?\s*(.*)', text)
    if m:
        num = m.group(1)
        name = m.group(2).strip() if m.group(2) else ''
        name = re.sub(r'\s*\.$', '', name).strip()
        if name:
            name = re.sub(r'\s+', ' ', name)
            return f"Sección {num} — {name}"
        return f"Sección {num}"
    return None


def get_tema(articulo_num, epigrafe, texto, libro, titulo, capitulo):
    epig_lower = epigrafe.lower()
    text_lower = texto.lower()[:500]

    if libro and 'Libro I' in libro and titulo:
        if 'Título Preliminar' in titulo:
            return 'disposiciones_generales'
        tnum = re.search(r'Título\s+(PRELIMINAR|I{0,3}V?I{0,3})', titulo, re.I)
        if tnum:
            tn = tnum.group(1)
            if tn in ('I',):
                return 'garantias_penales'
            if tn in ('II',):
                if 'hecho' in titulo.lower() or 'delito' in titulo.lower():
                    return 'teoria_delito'
                return 'hecho_penal'
            if tn in ('III',):
                return 'autoria_participacion'
            if tn in ('IV',):
                return 'circunstancias'
            if tn in ('V',):
                if 'consecuencia' in titulo.lower():
                    return 'consecuencias_juridicas'
                return 'consecuencias_juridicas'
            if tn in ('VI',):
                return 'ejecucion_medidas'
    if libro and 'Libro II' in libro:
        return 'delitos'

    if any(w in epig_lower for w in ['pena', 'prisión', 'reclusión', 'multa', 'inhabilitación', 'días multa',
                                       'trabajo', 'localización', 'privación']):
        return 'penas'
    if any(w in epig_lower for w in ['eximente', 'exención', 'inimputabilidad', 'menor', 'enajenación',
                                       'trastorno', 'sordomudez']):
        return 'eximentes'
    if any(w in epig_lower for w in ['atenuante', 'atenuación', 'compensación']):
        return 'atenuantes'
    if any(w in epig_lower for w in ['agravante', 'agravación']):
        return 'agravantes'
    if any(w in epig_lower for w in ['concurso', 'continuado', 'delito masa']):
        return 'concursos'
    if any(w in epig_lower for w in ['autor', 'cómplice', 'inductor', 'cooperador', 'partícipe', 'encubridor',
                                       'coautor']):
        return 'autoria'
    if any(w in epig_lower for w in ['tentativa', 'frustración', 'actos preparatorios', 'proposición', 'conspiración',
                                       'iter criminis']):
        return 'iter_criminis'
    if any(w in epig_lower for w in ['error', 'dolo', 'culpa', 'imprudencia', 'caso fortuito', 'tipicidad',
                                       'omisión']):
        return 'tipicidad'
    if any(w in epig_lower for w in ['prescripción', 'caducidad']):
        return 'prescripcion'
    if any(w in epig_lower for w in ['medida de seguridad', 'internamiento', 'libertad vigilada', 'custodia',
                                       'sometimiento']):
        return 'medidas_seguridad'
    if any(w in epig_lower for w in ['responsabilidad civil', 'reparación', 'indemnización', 'restitución']):
        return 'responsabilidad_civil'
    if any(w in epig_lower for w in ['legalidad', 'irretroactividad', 'non bis in ídem', 'principio', 'garantía']):
        return 'garantias_penales'
    if any(w in epig_lower for w in ['suspensión', 'sustitución', 'libertad condicional', 'indulto', 'revisión',
                                       'ejecución']):
        return 'ejecucion'
    if any(w in epig_lower for w in ['derogatorio', 'abrogación', 'vigencia', 'derogar', 'abrogar',
                                       'disposición final']):
        return 'disposiciones_finales'

    if libro and 'Libro I' in libro:
        return 'parte_general'
    elif libro and 'Libro II' in libro:
        return 'delitos'
    return 'disposiciones_generales'


def main():
    with open(HTML_PATH, 'r', encoding='utf-8', errors='replace') as f:
        html = f.read()

    # Also try to fix corruption by reading as latin-1 and re-encoding
    # But let's work with what we have

    # Extract structural headings
    headings = []  # list of (position, type, clean_text)

    # Patterns for headings:
    # <p align="center" class="Xdef"><b>LIBRO I</b></p>
    # <p align="center" class="Xdef"><b>PARTE GENERAL</b></p>
    # <p align="center" class="Xdef"><b>TÍTULO I</b></p>
    # <p align="center" class="Xdef"><b>LEY PENAL</b></p>
    # <p align="center" class="Xdef"><b>CAPÍTULO I</b></p>

    for m in re.finditer(r'<p[^>]*class="Xdef"[^>]*><b>([^<]+)</b></p>', html, re.IGNORECASE):
        raw = m.group(1)
        text = clean_html(raw).strip()
        if re.match(r'^LIBRO\s', text, re.I):
            headings.append((m.start(), 'libro', text))
        elif re.match(r'^T[IÍ]TULO\s', text, re.I):
            headings.append((m.start(), 'titulo', text))
        elif re.match(r'^CAP[IÍ]TULO\s', text, re.I):
            headings.append((m.start(), 'capitulo', text))
        elif re.match(r'^SECCI[OÓ]N\s', text, re.I):
            headings.append((m.start(), 'seccion', text))

    print(f"Found {len(headings)} structural headings")

    # Also look for XL8 class headings (titles like "DISPOSICIONES FINALES")
    for m in re.finditer(r'<p[^>]*class="(?:XL8|XA8)"[^>]*>([^<]+)</p>', html, re.IGNORECASE):
        raw = m.group(1)
        text = clean_html(raw).strip().upper()
        if 'LIBRO' in text:
            if not any(h[0] == m.start() for h in headings):
                headings.append((m.start(), 'libro', text))
        elif 'TÍTULO' in text or 'TITULO' in text:
            if not any(h[0] == m.start() for h in headings):
                headings.append((m.start(), 'titulo', text))
        elif 'CAPÍTULO' in text or 'CAPITULO' in text:
            if not any(h[0] == m.start() for h in headings):
                headings.append((m.start(), 'capitulo', text))
        elif 'SECCIÓN' in text or 'SECCION' in text:
            if not any(h[0] == m.start() for h in headings):
                headings.append((m.start(), 'seccion', text))

    headings.sort(key=lambda x: x[0])

    # Extract articles
    articles = []

    # Pattern for article anchor
    art_pattern = re.compile(r'<a\s+name="ar\.(\d+)"[^>]*></a>Art[íi]culo\s+\d+', re.IGNORECASE)

    art_matches = list(art_pattern.finditer(html))
    print(f"Found {len(art_matches)} article anchors")

    if not art_matches:
        print("ERROR: No articles found!")
        return

    current_libro = None
    current_titulo = None
    current_capitulo = None
    current_seccion = None

    for idx, m in enumerate(art_matches):
        art_num = int(m.group(1))
        # Back up to include the preceding <p> tag (article header paragraph)
        preceding = html[max(0, m.start() - 300):m.start()]
        p_start = preceding.rfind('<p ')
        if p_start >= 0:
            start = max(0, m.start() - 300 + p_start)
        else:
            start = m.start()
        end = art_matches[idx + 1].start() if idx + 1 < len(art_matches) else len(html)

        # Update structural context based on headings before this article
        # Reset for this article
        for h_pos, h_type, h_text in headings:
            if h_pos < start:
                if h_type == 'libro':
                    current_libro = classify_libro(h_text)
                elif h_type == 'titulo':
                    t = classify_titulo(h_text)
                    if t:
                        current_titulo = t
                elif h_type == 'capitulo':
                    c = classify_capitulo(h_text)
                    if c:
                        current_capitulo = c
                elif h_type == 'seccion':
                    s = classify_seccion(h_text)
                    if s:
                        current_seccion = s

        # Extract the article block
        block = html[start:end]

        # Extract epigrafe: the article header is:
        # <p class="Xdef"><b><a name="ar.N"></a>Artículo N. <i></i></b>EPIGRAFE.</p>
        # The epigrafe is text between </b> and </p> in the article's header paragraph
        epigrafe = ''
        # Find the header paragraph (class="Xdef")
        header_p = re.search(r'<p[^>]*class="Xdef"[^>]*><b>.*?</b>\s*(.*?)\s*</p>', block, re.DOTALL | re.IGNORECASE)
        if header_p:
            epigrafe = clean_html(header_p.group(1))
            # Also strip leading/trailing periods
            epigrafe = epigrafe.strip('. ')
        else:
            # Fallback: find </b> then text until next tag or end
            m2 = re.search(r'</b>\s*([^<]+)', block)
            if m2:
                epigrafe = clean_html(m2.group(1)).strip('. ')

        # Extract content paragraphs
        # Content can be in class="XA5", "XL7", "XL8"
        content_parts = []
        # Skip the first Xdef paragraph (article header)
        for cm in re.finditer(r'<p[^>]*class="(?:XA5|XL7|XL8|XA8)"[^>]*>(.*?)</p>', block, re.DOTALL):
            content_text = clean_html(cm.group(1))
            if content_text:
                # Skip if this is just the article header
                header_check = re.match(r'^(?:Art[íi]culo\s+\d+|b>)', content_text)
                if header_check:
                    remaining = content_text[header_check.end():].strip()
                    if remaining:
                        # Check if it contains content after the header text
                        # The epigrafe might be here
                        if not epigrafe:
                            epigrafe = remaining.split('.')[0][:100].strip()
                        continue
                    continue
                content_parts.append(content_text)

        # Remove duplicates while preserving order
        seen = set()
        unique_parts = []
        for p in content_parts:
            if p not in seen:
                seen.add(p)
                unique_parts.append(p)
        content_parts = unique_parts

        full_text = '\n\n'.join(content_parts)

        # If still no content, try getting all text after </b>
        if not full_text:
            after_b = re.search(r'</b>', block)
            if after_b:
                remaining = block[after_b.end():]
                full_text = clean_html(remaining)

        # Determine tema
        tema = get_tema(art_num, epigrafe, full_text, current_libro, current_titulo, current_capitulo)

        article = {
            "articulo": f"Art. {art_num} CP",
            "libro": current_libro,
            "titulo": current_titulo,
            "capitulo": current_capitulo,
            "seccion": current_seccion,
            "epigrafe": epigrafe if epigrafe else f"Artículo {art_num}",
            "texto": full_text,
            "tema": tema
        }
        articles.append(article)

    # Save to JSON
    output_data = json.dumps(articles, ensure_ascii=False, indent=2)
    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        f.write(output_data)

    print(f"\nSaved {len(articles)} articles to {OUTPUT_PATH}")

    # Verify by re-reading
    with open(OUTPUT_PATH, 'r', encoding='utf-8') as f:
        verified = json.load(f)
    print(f"Verified: {len(verified)} articles")
    print(f"File size: {len(output_data)} bytes")

    # Show sample
    if verified:
        for a in verified[:3]:
            print(f"\n{a['articulo']}: {a['epigrafe'][:80]}")
            print(f"  Libro: {a['libro']}")
            print(f"  Título: {a['titulo']}")
            print(f"  Capítulo: {a['capitulo']}")
            print(f"  Tema: {a['tema']}")

        print(f"\nLast: {verified[-1]['articulo']}: {verified[-1]['epigrafe'][:80]}")

    # Count by tema
    temas = Counter(a['tema'] for a in verified)
    print(f"\nArticles by topic ({len(temas)} topics):")
    for t, c in temas.most_common():
        print(f"  {t}: {c}")


if __name__ == '__main__':
    main()
