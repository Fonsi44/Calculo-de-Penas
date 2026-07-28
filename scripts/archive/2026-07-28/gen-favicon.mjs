/**
 * Genera los favicons e iconos PWA a partir del logo oficial
 * (`public/images/logo.png`, 741×728, PNG transparente).
 *
 * Produce:
 *   - app/favicon.ico            → ICO multi-size (16, 32, 48) con entradas PNG.
 *   - public/icon-192.png        → icono PWA 192×192 (manifest).
 *   - public/icon-512.png        → icono PWA 512×512 (manifest, maskable).
 *   - public/apple-touch-icon.png → 180×180 (iOS).
 *
 * El logo se monta centrado sobre fondo navy `#0B1B3D` (theme_color del
 * manifest) con ~80 % de ocupa­ción, de modo que el icono se vea correcto
 * sobre cualquier fondo de pestaña y como tile PWA. El `apple-touch-icon`
 * requiere fondo opaco (iOS rellena con negro si es transparente).
 *
 * Uso:  node scripts/gen-favicon.mjs
 * Dependencia: `sharp` (transitiva de Next.js).
 */
import sharp from 'sharp';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const LOGO = join(ROOT, 'public/images/logo.png');
const NAVY = '#0B1B3D';
const FILL = 0.8; // proporción del icono que ocupa el logo

/**
 * Compone un icono cuadrado de `size` px: fondo navy + logo centrado al 80 %.
 * Devuelve un Buffer PNG.
 */
async function tile(size) {
  const logoSize = Math.round(size * FILL);
  const logo = await sharp(LOGO)
    .resize(logoSize, logoSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  return sharp({
    create: { width: size, height: size, channels: 4, background: NAVY },
  })
    .composite([{ input: logo, gravity: 'center' }])
    .png({ compressionLevel: 9 })
    .toBuffer();
}

/**
 * Ensambla un archivo .ico real con entradas PNG embebidas (formato soportado
 * por Chrome, Edge, Firefox y Safari ≥ macOS Sierra). Cabecera ICONDIR +
 * N×ICONDIRENTRY + blobs PNG.
 */
function buildIco(pngs) {
  const count = pngs.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type = 1 (icon)
  header.writeUInt16LE(count, 4);

  const dir = Buffer.alloc(16 * count);
  let offset = 6 + dir.length;
  pngs.forEach((png, i) => {
    const size = png.size;
    dir.writeUInt8(size >= 256 ? 0 : size, i * 16 + 0); // width
    dir.writeUInt8(size >= 256 ? 0 : size, i * 16 + 1); // height
    dir.writeUInt8(0, i * 16 + 2);                       // colorCount
    dir.writeUInt8(0, i * 16 + 3);                       // reserved
    dir.writeUInt16LE(1, i * 16 + 4);                    // planes
    dir.writeUInt16LE(32, i * 16 + 6);                   // bitCount
    dir.writeUInt32LE(png.buf.length, i * 16 + 8);       // bytesInRes
    dir.writeUInt32LE(offset, i * 16 + 12);              // imageOffset
    offset += png.buf.length;
  });

  return Buffer.concat([header, dir, ...pngs.map((p) => p.buf)]);
}

async function main() {
  const logoBuf = await readFile(LOGO);
  const meta = await sharp(logoBuf).metadata();
  console.log(`Logo fuente: ${meta.width}×${meta.height} (${meta.format})`);

  // Favicons (ICO): 16, 32, 48.
  const icoSizes = [16, 32, 48];
  const icoPngs = [];
  for (const s of icoSizes) {
    icoPngs.push({ size: s, buf: await tile(s) });
  }
  const ico = buildIco(icoPngs);
  await writeFile(join(ROOT, 'app/favicon.ico'), ico);
  console.log(`✓ app/favicon.ico (${ico.length} bytes, sizes ${icoSizes.join('/')})`);

  // Iconos PWA + apple-touch.
  await writeFile(join(ROOT, 'public/icon-192.png'), await tile(192));
  await writeFile(join(ROOT, 'public/icon-512.png'), await tile(512));
  await writeFile(join(ROOT, 'public/apple-touch-icon.png'), await tile(180));
  console.log('✓ public/icon-192.png, public/icon-512.png, public/apple-touch-icon.png');

  console.log('\nHecho. Recuerda actualizar layout.tsx, manifest.json y proxy.ts.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
