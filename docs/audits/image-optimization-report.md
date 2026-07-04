# Reporte de optimización de imágenes

Fecha: 2026-07-04T01:28:49.103Z
Modo: APPLY (cambios escritos)

## Hallazgos

- CONV  public\images\blog\jorono-international-2693200.jpg (3829.7 KB) → WebP 117.6 KB + AVIF
- DEL   public\images\blog\jorono-international-2693200.jpg (original JPG tras conversión)
- CONV  public\images\blog\pexels-ekaterina-bolovtsova-6077861.jpg (1764.2 KB) → WebP 62.5 KB + AVIF
- DEL   public\images\blog\pexels-ekaterina-bolovtsova-6077861.jpg (original JPG tras conversión)
- KEEP  public\images\logo.png (294.0 KB) — PNG pequeño/icono
- WARN  public\images\blog\delitos-ambientales-como-denunciarlos-honduras.webp (568.4 KB) — WebP >400KB, recomprimir manualmente
- WARN  public\images\blog\habeas-corpus-cuando-interponer-honduras.webp (557.8 KB) — WebP >400KB, recomprimir manualmente
- WARN  public\images\corporate\courthouse.webp (442.4 KB) — WebP >400KB, recomprimir manualmente
- WARN  public\images\services\actos-notariales-internacionales.webp (502.2 KB) — WebP >400KB, recomprimir manualmente
- WARN  public\images\services\asuntos-civiles-y-familiares-desde-el-extranjero.webp (842.9 KB) — WebP >400KB, recomprimir manualmente
- WARN  public\images\services\gestion-documental-y-legalizacion.webp (947.4 KB) — WebP >400KB, recomprimir manualmente

## Configuración
- maxWidth: 1920px
- WebP quality: 78
- AVIF quality: 60
- Umbral eliminación JPG: 200.0 KB

## Próximos pasos manuales
- Recompresión WebP >400 KB con `npx @squoosh/cli` o inspector visual.
- Verificar referencias en código tras borrado de JPG.
