---
name: 'TypeScript Standards'
description: 'Convenciones de TypeScript y React (Next.js App Router) del proyecto'
applyTo: '**/*.{ts,tsx}'
---
# Convenciones TypeScript / React — Pineda y Asociados

- Next.js App Router: `app/**` para rutas, `components/**` para UI
  compartida. No duplicar rutas ni lógica.
- **Fuentes de verdad** (`AGENTS.md` §2): blog → `lib/blog-db.ts`;
  FAQ → `lib/faq-db.ts`; delitos → `data/delitos.json`; schema →
  `lib/schema.ts`; config sitio → `lib/site.ts`. Nunca duplicar.
- **No rediseñar la web pública** (`app/(public)/**`) visualmente (R5);
  cambios SEO sí.
- **Design tokens canónicos (R16)**: radius `rounded-lg`, sombras
  `.btn-shadow-*`, icono `w-11 h-11`; dorado solo como acento.
- Un solo `<h1>` por página de post (R15); disclaimer legal solo en
  `<LegalDisclaimer>` (R14).
- Zod en rutas POST/PATCH/PUT; `sanitize-html` en HTML de entrada.
- Errores: no ocultar con `try/catch` vacíos ni casts inseguros (R20).
- Sin `any` innecesario; tipos explícitos y verificables con `npx tsc --noEmit`.
- Analítica solo vía `components/analytics-scripts.tsx`; sin PII ni
  consultas legales en eventos.