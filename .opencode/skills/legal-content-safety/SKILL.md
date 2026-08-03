---
name: legal-content-safety
description: Seguridad del contenido jurídico (YMYL). Usar SIEMPRE que se genere, valide o corrija contenido legal del blog, FAQ, landings o delitos. No inventar derecho, citas, credenciales ni resultados. Requiere fuentes canónicas y revisión humana.
---

# Seguridad del contenido jurídico — Pineda y Asociados

Regla absoluta: **R4 — no inventar datos legales.** Citas verificables contra el
Código Penal de Honduras y las fuentes canónicas del repositorio.

## Fuentes canónicas (AGENTS.md §2)

- Delitos CP: `data/delitos.json` (100 % verificable contra CP Honduras).
- Artículos CP: `data/articulos_cp.json`.
- Constitución: `data/articulos_constitucion.json`.
- Códigos: `data/codigo_trabajo.json`, `codigo_civil.json`,
  `codigo_comercio.json`, `codigo_tributario.json`.
- Blog: `lib/blog-db.ts` (DB `blog_posts`). FAQ: `lib/faq-db.ts`.

## Procedimiento

1. Verificar cada afirmación legal contra una fuente canónica.
2. Si no hay fuente: proponer como PENDIENTE de revisión humana, nunca afirmar.
3. Disclaimer legal en `<LegalDisclaimer>` (R14); nunca en body (R15).
4. Estados editoriales respetados; no publicar contenido `pending`.

## Validaciones

- `npm run validate:dates` + `npm run content:audit` para blog.
- Scripts de validación de citas del proyecto (blog:verify-fix, corregir-citas).

## Anti-patrones

- Citar artículos, plazos o penas sin verificar contra la fuente.
- Inventar credenciales de abogados (CAH), directorios o resultados.
- Escribir el disclaimer dentro del body del post.

## Detenerse y pedir intervención

- Cualquier dato legal no verificable o ambiguo.
