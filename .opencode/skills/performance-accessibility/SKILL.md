---
name: performance-accessibility
description: Rendimiento y accesibilidad del proyecto — Core Web Vitals, bundle, caché, imágenes, fuentes, WCAG, teclado, foco, contraste, consola e hidratación. Usar al optimizar o auditar rendimiento/a11y de la web pública.
---

# Rendimiento y accesibilidad — Pineda y Asociados

## Rendimiento

- Core Web Vitals; evitar regresiones de bundle (scripts `verify:chunks`).
- Imágenes optimizadas (scripts `images:optimize`, `images:recompress`).
- Caché y headers; fuentes optimizadas; evitar hidratación costosa.
- Métricas del proyecto: `npm run audit:performance` (auditar-performance-publico).

## Accesibilidad (WCAG)

- Teclado, foco visible, contraste, semántica y textos alternativos.
- Contrato público de a11y: `npm run a11y:public-contract`.
- Estados de carga/error/empty accesibles.

## Procedimiento

1. Medir estado actual (baseline) antes de optimizar.
2. Aplicar cambio mínimo y justificado.
3. Re-medir y comparar con el baseline; no declarar mejora sin evidencia.

## Validaciones

- `npm run verify:chunks`
- `npm run a11y:public-contract` (si aplica al cambio)
- `npm run lint` + `npx tsc --noEmit`

## Anti-patrones

- Optimizar a costa de accesibilidad o de la separación de subsistemas.
- Declarar mejoras de rendimiento sin medición.

## Detenerse y pedir intervención

- Cambio que altere el sistema visual canónico sin autorización.
