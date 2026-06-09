import { readdirSync, mkdirSync, existsSync, statSync } from 'fs';
import { join, basename, extname } from 'path';
import sharp from 'sharp';

const INPUT_DIR = 'docs/imagenes';
const OUTPUT_DIR = 'public/images/blog';

if (!existsSync(OUTPUT_DIR)) {
  mkdirSync(OUTPUT_DIR, { recursive: true });
}

const files = readdirSync(INPUT_DIR).filter(f => f.toLowerCase().endsWith('.jpg'));

let converted = 0;
let skipped = 0;
let errors = 0;

for (const file of files) {
  const inputPath = join(INPUT_DIR, file);
  const baseName = basename(file, extname(file));

  // Fix typo: "hondura" -> "honduras"
  const correctedName = baseName.endsWith('hondura') && baseName !== 'honduras'
    ? baseName.replace(/hondura$/, 'honduras')
    : baseName;

  const outputPath = join(OUTPUT_DIR, `${correctedName}.webp`);

  if (existsSync(outputPath)) {
    const existingSize = statSync(outputPath).size;
    if (existingSize > 100) {
      skipped++;
      continue;
    }
  }

  try {
    await sharp(inputPath)
      .resize({ width: 1200, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(outputPath);

    const inputSize = statSync(inputPath).size;
    const outputSize = statSync(outputPath).size;
    const reduction = ((1 - outputSize / inputSize) * 100).toFixed(1);
    console.log(`${correctedName}.webp — ${(outputSize / 1024).toFixed(0)} KB (${reduction}% reducción)`);
    converted++;
  } catch (err) {
    console.error(`ERROR: ${file} — ${err.message}`);
    errors++;
  }
}

console.log(`\n=== RESUMEN ===`);
console.log(`Convertidas: ${converted}`);
console.log(`Omitidas (ya existen): ${skipped}`);
console.log(`Errores: ${errors}`);
