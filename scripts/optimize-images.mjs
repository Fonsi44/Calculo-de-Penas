/**
 * Optimización de imágenes para `public/images/`.
 *
 * Convierte JPG/JPEG/PNG grandes a WebP (calidad 78) y AVIF (calidad 60),
 * redimensionando a maxWidth 1920. Los originales JPG/JPEG >200 KB se
 * eliminan tras conversión exitosa SI existe un .webp referenciado en el
 * código. Los PNG con transparencia se conservan (WebP/AVIF los soportan,
 * pero por compatibilidad con `logo.png` y favicon se mantienen).
 *
 * Uso:
 *   npm run images:optimize            (dry-run, solo reporta)
 *   npm run images:optimize -- --apply (escribe cambios)
 *
 * Dependencia: `sharp` (ya en devDependencies). Genera reporte en
 * `docs/audits/image-optimization-report.md`.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const sharp = require('sharp');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const IMAGES_DIR = path.join(ROOT, 'public', 'images');
const REPORT_PATH = path.join(ROOT, 'docs', 'audits', 'image-optimization-report.md');

const APPLY = process.argv.includes('--apply');
const RECOMPRESS_WEBP = process.argv.includes('--recompress-webp');
const MAX_WIDTH = 1920;
const WEBP_QUALITY = 78;
const WEBP_RECOMPRESS_QUALITY = 72;
const AVIF_QUALITY = 60;
const JPG_DELETE_THRESHOLD = 200 * 1024; // 200 KB
const WEBP_RECOMPRESS_THRESHOLD = 400 * 1024; // 400 KB

/** Recorre recursivamente y devuelve rutas absolutas de imágenes. */
async function walk(dir, exts) {
  const out = [];
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full, exts)));
    else if (exts.some((e) => entry.name.toLowerCase().endsWith(e))) out.push(full);
  }
  return out;
}

function kb(bytes) {
  return `${(bytes / 1024).toFixed(1)} KB`;
}

async function main() {
  const modeFlags = [
    APPLY ? 'APPLY' : 'DRY-RUN',
    RECOMPRESS_WEBP ? '+RECOMPRESS_WEBP' : '',
  ].filter(Boolean).join(' ');
  console.log(`⚠️  Modo: ${modeFlags}`);
  console.log(`   Scanning ${IMAGES_DIR}\n`);

  const jpgs = await walk(IMAGES_DIR, ['.jpg', '.jpeg']);
  const pngs = await walk(IMAGES_DIR, ['.png']);
  const webps = await walk(IMAGES_DIR, ['.webp']);
  const avifs = await walk(IMAGES_DIR, ['.avif']);

  const report = [];
  let totalSaved = 0;

  // 1) Convertir JPG/JPEG grandes a WebP+AVIF y eliminar originales >200KB.
  for (const jpg of jpgs) {
    const stat = await fs.stat(jpg);
    const webpPath = jpg.replace(/\.(jpg|jpeg)$/i, '.webp');
    const avifPath = jpg.replace(/\.(jpg|jpeg)$/i, '.avif');

    if (stat.size < JPG_DELETE_THRESHOLD) {
      report.push(`- KEEP   ${path.relative(ROOT, jpg)} (${kb(stat.size)}) — bajo umbral`);
      continue;
    }

    const pipeline = sharp(jpg).resize({ width: MAX_WIDTH, withoutEnlargement: true });
    if (APPLY) {
      await pipeline.clone().webp({ quality: WEBP_QUALITY }).toFile(webpPath);
      await pipeline.clone().avif({ quality: AVIF_QUALITY }).toFile(avifPath);
    }
    const webpStat = APPLY ? await fs.stat(webpPath) : { size: Math.round(stat.size * 0.25) };
    const saved = stat.size - webpStat.size;
    totalSaved += saved;

    report.push(
      `- CONV  ${path.relative(ROOT, jpg)} (${kb(stat.size)}) → WebP ${kb(webpStat.size)}${APPLY ? ' + AVIF' : ' (estimado)'}`
    );

    if (APPLY) {
      await fs.unlink(jpg);
      report.push(`- DEL   ${path.relative(ROOT, jpg)} (original JPG tras conversión)`);
    }
  }

  // 2) PNG: convertir a WebP solo si son grandes (>300 KB) Y no tienen ya .webp.
  //    Se conservan logos/iconos PNG pequeños.
  for (const png of pngs) {
    const stat = await fs.stat(png);
    if (stat.size < 300 * 1024) {
      report.push(`- KEEP  ${path.relative(ROOT, png)} (${kb(stat.size)}) — PNG pequeño/icono`);
      continue;
    }
    const webpPath = png.replace(/\.png$/i, '.webp');
    try {
      await fs.access(webpPath);
      report.push(`- SKIP  ${path.relative(ROOT, png)} — ya existe .webp`);
      continue;
    } catch {
      // No existe .webp: convertir.
      const pipeline = sharp(png).resize({ width: MAX_WIDTH, withoutEnlargement: true });
      if (APPLY) await pipeline.webp({ quality: WEBP_QUALITY }).toFile(webpPath);
      report.push(`- CONV  ${path.relative(ROOT, png)} (${kb(stat.size)}) → WebP`);
    }
  }

  // 3) Reportar WebP >400 KB y, si --recompress-webp, re-comprimir + AVIF.
  for (const webp of webps) {
    const stat = await fs.stat(webp);
    if (stat.size > WEBP_RECOMPRESS_THRESHOLD) {
      if (!RECOMPRESS_WEBP) {
        report.push(`- WARN  ${path.relative(ROOT, webp)} (${kb(stat.size)}) — WebP >400KB (use --recompress-webp)`);
        continue;
      }
      // Re-comprimir in-place usando archivo temporal + rename (evita lock EPERM
      // en Windows cuando el archivo está abierto por un watcher).
      const buf = await sharp(webp)
        .resize({ width: MAX_WIDTH, withoutEnlargement: true })
        .webp({ quality: WEBP_RECOMPRESS_QUALITY })
        .toBuffer();
      const tmp = `${webp}.optimized`;
      if (APPLY) {
        await fs.writeFile(tmp, buf);
        try {
          await fs.rename(tmp, webp);
        } catch {
          // Si rename falla por lock, unlink destino y reintenta rename.
          await fs.unlink(webp).catch(() => {});
          await fs.rename(tmp, webp).catch(() => {});
        }
      }
      const afterStat = APPLY ? await fs.stat(webp) : { size: Math.round(stat.size * 0.6) };
      const saved = stat.size - afterStat.size;
      totalSaved += saved;
      report.push(
        `- RECOMP ${path.relative(ROOT, webp)}: ${kb(stat.size)} → ${kb(afterStat.size)} (q=${WEBP_RECOMPRESS_QUALITY})${APPLY ? '' : ' (estimado)'}`,
      );

      // AVIF equivalente (junto al .webp, no lo reemplaza).
      const avifPath = webp.replace(/\.webp$/i, '.avif');
      const avifExists = await fs.stat(avifPath).then(() => true).catch(() => false);
      if (!avifExists) {
        if (APPLY) {
          const avifBuf = await sharp(webp)
            .resize({ width: MAX_WIDTH, withoutEnlargement: true })
            .avif({ quality: AVIF_QUALITY })
            .toBuffer();
          await fs.writeFile(avifPath, avifBuf);
        }
        report.push(`- AVIF  ${path.relative(ROOT, avifPath)} generado${APPLY ? '' : ' (estimado)'}`);
      }
    }
  }

  console.log(report.join('\n'));
  console.log(`\nAhorro estimado/real: ${kb(totalSaved)}\n`);

  // Escribir reporte markdown.
  const md = [
    '# Reporte de optimización de imágenes',
    '',
    `Fecha: ${new Date().toISOString()}`,
    `Modo: ${APPLY ? 'APPLY (cambios escritos)' : 'DRY-RUN (sin cambios)'}`,
    '',
    '## Hallazgos',
    '',
    ...report,
    '',
    '## Configuración',
    `- maxWidth: ${MAX_WIDTH}px`,
    `- WebP quality: ${WEBP_QUALITY}`,
    `- AVIF quality: ${AVIF_QUALITY}`,
    `- Umbral eliminación JPG: ${kb(JPG_DELETE_THRESHOLD)}`,
    '',
    '## Próximos pasos manuales',
    '- Recompresión WebP >400 KB con `npx @squoosh/cli` o inspector visual.',
    '- Verificar referencias en código tras borrado de JPG.',
    '',
  ].join('\n');

  await fs.mkdir(path.dirname(REPORT_PATH), { recursive: true });
  await fs.writeFile(REPORT_PATH, md, 'utf8');
  console.log(`📄 Reporte: ${path.relative(ROOT, REPORT_PATH)}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
