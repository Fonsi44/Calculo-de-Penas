# Normalización de marca — Pineda y Asociados

> **Fecha:** 2026-06-19
> **Propósito:** unificar el nombre del proyecto bajo una única marca documental.

---

## Decisión

El nombre público y documental del proyecto es **"Pineda y Asociados"**.

Los siguientes términos quedan **deprecados** como nombre del proyecto en
documentación activa, texto visible, metadatos y comentarios operativos:

| Término deprecado | Motivo |
|-------------------|--------|
| LEX HONDURAS | Nombre antiguo del proyecto (antes del rebranding) |
| Justicia Verdadera | Nombre antiguo del proyecto; hoy es solo la ruta local `C:\Proyectos\Justicia Verdadera` |
| Calculo de Penas / Cálculo de Penas | Descripción funcional, no nombre de marca |
| calcio-de-penas-nextjs | Nombre histórico del proyecto Vercel (se conserva como identificador técnico externo) |

## Cambios aplicados

| Archivo | Cambio |
|---------|--------|
| `README.md` | Título y subtítulo → "Pineda y Asociados" |
| `AGENTS.md` | Encabezado → "Pineda y Asociados — Protocolo obligatorio para agentes IA" |
| `app/intranet/layout.tsx` | "LEX HONDURAS" → "Pineda y Asociados" (sidebar) |
| `app/intranet/admin/layout.tsx` | 2× "LEX HONDURAS" → "Pineda y Asociados" (sidebar admin) |
| `components/layout/app-shell.tsx` | "LEX HONDURAS" → "Pineda y Asociados" (sidebar) |
| `components/layout/app-sidebar.tsx` | "LEX HONDURAS" → "Pineda y Asociados" (sidebar) |
| `components/domain/penalty-result-panel.tsx` | "LEX HONDURAS" → "Pineda y Asociados" (resultado cálculo) |
| `lib/pdf-document.tsx` | 4× "LEX HONDURAS" → "Pineda y Asociados" + email `info@lexhn.app` → `contacto@pinedayasocioshn.com` |
| `docs/auditoria-repositorio-integral.md` | Título: "LEX HONDURAS / Pineda y Asociados" → "Pineda y Asociados" |
| `docs/01-arquitectura.md` | "LEX HONDURAS es una aplicación" → "Pineda y Asociados es una aplicación" |
| `.kilo/agent/SEOSenior.md` | "proyecto LEX HONDURAS" → "proyecto Pineda y Asociados" |
| `CHANGELOG.md` | Encabezado actualizado |

## Lo que NO se cambió

| Referencia | Motivo |
|------------|--------|
| `C:\Proyectos\Justicia Verdadera` | Ruta local (el usuario la conserva explícitamente) |
| `calculo-de-penas-nextjs.vercel.app` | Nombre técnico del proyecto Vercel (servicio externo) |
| `lib/csrf.ts` origen Vercel | Identificador técnico de despliegue |
| `docs/legacy/CHANGELOG_ARCHIVE.md` | Historial archivado |
| `docs/backups/*` | Copias de seguridad |
| `tests/auth-secret-validation.test.ts` ("lex-honduras-secret") | Valor de prueba, no branding |
| `docs/07-csp-hardening.md`, `09-despliegue.md`, `11-neon-pitr.md`, `12-vercel-alerts.md`, `fase2-guia-despliegue.md` | Refieren a URLs/proyectos Vercel históricos; son instrucciones técnicas que no deben cambiarse sin verificar el estado actual del deploy |

## Regla para agentes IA

A partir de ahora, **el único nombre válido del proyecto en documentación
activa, texto visible y comunicaciones es "Pineda y Asociados"**.

No usar "LEX HONDURAS", "Justicia Verdadera", "Cálculo de Penas" ni
"calculo-de-penas" como nombre del proyecto en ninguno de estos contextos:
- Documentación (README, AGENTS, CHANGELOG, docs/)
- Texto visible en la interfaz (headers, footers, sidebars, PDFs)
- Metadatos y branding (JSON-LD, títulos de página, OG tags)
- Prompts de agentes IA
- Comentarios operativos

Los términos antiguos en contexto histórico (archivos `docs/legacy/*` y
`docs/backups/*`) se conservan pero no deben usarse como referencia activa.
