const fs = require('fs');
const path = require('path');

const raePath = 'C:/Users/Admin/.local/share/opencode/tool-output/tool_e916b9f97001n6wlVNp2joVqMc';
const outPath = path.join(__dirname, '..', 'data', 'cp-indice.json');

const c = fs.readFileSync(raePath, 'utf8');

// Encontrar el cuerpo del CP (después de "Preámbulo" o "DECRETO 130 2017")
// El primer "Artículo 1." marca el inicio real de los artículos
const firstArt = c.indexOf('Artículo 1.');
if (firstArt === -1) {
  console.error('No se encontró Artículo 1.');
  process.exit(1);
}

// Cortar todo el preámbulo y nos quedamos con el articulado
let body = c.substring(firstArt);

// Limpiar HTML residual: tags <...> y entidades &...;
body = body.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#x([0-9A-Fa-f]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16))).replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)));

// Colapsar espacios múltiples
body = body.replace(/\s+/g, ' ').trim();

// Dividir por marcador de artículo: "Artículo NNN. "
const re = /Artículo\s+(\d+)\.\s+/g;
const matches = [];
let m;
while ((m = re.exec(body)) !== null) {
  matches.push({ numero: parseInt(m[1], 10), start: m.index, headerEnd: m.index + m[0].length });
}

// Construir el texto de cada artículo (desde headerEnd hasta el inicio del siguiente)
const articulos = [];
for (let i = 0; i < matches.length; i++) {
  const start = matches[i].headerEnd;
  const end = i + 1 < matches.length ? matches[i + 1].start : body.length;
  const texto = body.substring(start, end).trim();

  // El título suele ser la primera frase antes del primer punto (o hasta el primer "\n" o cambio claro)
  // Como colapsamos espacios, el título es la primera frase corta antes del primer " Quien" o " El" o " La" o " Debe" o " Será" o " Se"
  const tituloMatch = texto.match(/^([^.]+)\.\s+(.*)$/s);
  let titulo = '';
  let cuerpo = texto;
  if (tituloMatch) {
    titulo = tituloMatch[1].trim();
    cuerpo = tituloMatch[2].trim();
  } else {
    titulo = texto.substring(0, 200);
    cuerpo = texto;
  }

  articulos.push({
    numero: matches[i].numero,
    titulo,
    cuerpo,
    texto_completo: texto,
  });
}

console.log('Artículos extraídos:', articulos.length);
console.log('Primero:', articulos[0].numero, '-', articulos[0].titulo.substring(0, 80));
console.log('Último:', articulos[articulos.length - 1].numero, '-', articulos[articulos.length - 1].titulo.substring(0, 80));
console.log('Art. 200:', articulos.find(a => a.numero === 200)?.titulo);
console.log('Art. 201:', articulos.find(a => a.numero === 201)?.titulo);

fs.writeFileSync(outPath, JSON.stringify(articulos, null, 2), 'utf8');
console.log('Índice escrito en:', outPath);
