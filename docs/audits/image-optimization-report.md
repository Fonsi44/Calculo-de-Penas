# Reporte de optimización de imágenes

Fecha: 2026-07-04T02:35:29.368Z
Modo: APPLY (cambios escritos)

## Hallazgos

- KEEP  public\images\logo.png (294.0 KB) — PNG pequeño/icono
- RECOMP public\images\blog\delitos-ambientales-como-denunciarlos-honduras.webp: 568.4 KB → 568.4 KB (q=72)
- AVIF  public\images\blog\delitos-ambientales-como-denunciarlos-honduras.avif generado
- RECOMP public\images\blog\habeas-corpus-cuando-interponer-honduras.webp: 557.8 KB → 557.8 KB (q=72)
- AVIF  public\images\blog\habeas-corpus-cuando-interponer-honduras.avif generado
- RECOMP public\images\corporate\courthouse.webp: 442.4 KB → 442.4 KB (q=72)
- AVIF  public\images\corporate\courthouse.avif generado
- RECOMP public\images\services\actos-notariales-internacionales.webp: 502.2 KB → 502.2 KB (q=72)
- AVIF  public\images\services\actos-notariales-internacionales.avif generado
- RECOMP public\images\services\asuntos-civiles-y-familiares-desde-el-extranjero.webp: 842.9 KB → 842.9 KB (q=72)
- AVIF  public\images\services\asuntos-civiles-y-familiares-desde-el-extranjero.avif generado
- RECOMP public\images\services\gestion-documental-y-legalizacion.webp: 947.4 KB → 947.4 KB (q=72)
- AVIF  public\images\services\gestion-documental-y-legalizacion.avif generado

## Configuración
- maxWidth: 1920px
- WebP quality: 78
- AVIF quality: 60
- Umbral eliminación JPG: 200.0 KB

## Próximos pasos manuales
- Recompresión WebP >400 KB con `npx @squoosh/cli` o inspector visual.
- Verificar referencias en código tras borrado de JPG.

## Recompresión final WebP (2026-07-04 T07:00Z)

Recompresión parcial de los 2 WebP >400KB restantes. Lock de archivo intermitente
impidió aplicar calidad 60 + resize 1400; se logró calidad 68 + resize 1600 vía
mv externo. Los AVIF equivalentes ya se sirven a navegadores modernos.

| Archivo | Antes | Después | Ahorro |
|---|---|---|---|
| blog/delitos-ambientales-como-denunciarlos-honduras.webp | 486 KB | 472 KB | 14 KB |
| blog/habeas-corpus-cuando-interponer-honduras.webp | 485 KB | 474 KB | 11 KB |

Total ahorrado: 25 KB (parcial). AVIF sirve la versión optimizada en Chrome/Edge/Firefox.
