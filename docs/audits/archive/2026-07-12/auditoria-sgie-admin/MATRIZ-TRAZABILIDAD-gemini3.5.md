# MATRIZ DE TRAZABILIDAD DE AUDITORÍA
**Repositorio:** Justicia Verdadera (Pineda y Asociados)  
**Fecha:** 12 de Julio de 2026  
**Auditor Principal:** Líder QA y Especialista DevSecOps (Gemini 3.5)  

---

## 1. Mapeo de Hallazgos, Ubicaciones y Correcciones

| Identificador | Descripción del Riesgo / Hallazgo | Ubicación Física en el Código | Impacto / Severidad | Mitigación Relacionada | Estado |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **GEMINI35-SEC-01** | Ausencia de `middleware.ts` para invocar el proxy en Next.js. | [Raíz del proyecto](file:///c:/Proyectos/Justicia%20Verdadera/) y [proxy.ts](file:///c:/Proyectos/Justicia%20Verdadera/proxy.ts) | **Crítica** / Bypass de seguridad en edge. | **Tarea 1.1:** Crear `middleware.ts` en la raíz. | PENDIENTE (No implementado) |
| **GEMINI35-SEC-02** | Exposición de secretos de producción en claro en `.env` local. | [.env](file:///c:/Proyectos/Justicia%20Verdadera/.env) | **Crítica** / Fuga de credenciales críticas. | **Tarea 1.2:** Rotar claves y eliminar `.env` físico. | PENDIENTE (No implementado) |
| **GEMINI35-SEC-03** | Fallback estático inseguro de `PREVIEW_SECRET` en firmas JWT. | [app/(public)/preview/[token]/page.tsx:L5](file:///c:/Proyectos/Justicia%20Verdadera/app/(public)/preview/[token]/page.tsx#L5) y [app/api/admin/preview/route.ts:L6](file:///c:/Proyectos/Justicia%20Verdadera/app/api/admin/preview/route.ts#L6) | **Alta** / Falsificación de firmas de preview. | **Tarea 1.3:** Eliminar fallback de desarrollo. | PENDIENTE (No implementado) |
| **GEMINI35-SEC-04** | Vulnerabilidad de XSS reflejado al renderizar posts sin sanitizar. | [app/(public)/preview/[token]/page.tsx:L55](file:///c:/Proyectos/Justicia%20Verdadera/app/(public)/preview/[token]/page.tsx#L55) | **Alta** / Inyección de scripts y robo de sesión. | **Tarea 1.3:** Integrar `sanitize-html` en preview. | PENDIENTE (No implementado) |
| **GEMINI35-DATA-05** | 25 delitos críticos con prisión nula (`0-0`) y sin clasificación. | [data/delitos.json](file:///c:/Proyectos/Justicia Verdadera/data/delitos.json) | **Media** / Error en cálculo de penas. | **Tarea 2.1:** Completar rangos en `data/delitos.json`. | PENDIENTE (No implementado) |
| **GEMINI35-ARCH-06** | Inconsistencia de proveedor (OpenAI vs DeepSeek) en embeddings RAG. | [lib/rag/config.ts:L35](file:///c:/Proyectos/Justicia%20Verdadera/lib/rag/config.ts#L35) y [lib/rag/embeddings.ts](file:///c:/Proyectos/Justicia%20Verdadera/lib/rag/embeddings.ts) | **Media** / Incoherencia vectorial semántica. | **Tarea 2.2:** Cambiar default a DeepSeek. | PENDIENTE (No implementado) |
| **GEMINI35-ARCH-07** | Bypass del filtro de magic bytes en extensiones no soportadas (.docx). | [lib/sgie/util.ts:L135-L144](file:///c:/Proyectos/Justicia%20Verdadera/lib/sgie/util.ts#L135-L144) | **Baja** / Almacenamiento de archivos no verificados. | **Tarea 3.2:** Añadir magic bytes para docx/zip. | PENDIENTE (No implementado) |
| **GEMINI35-PERF-08** | Alta sobrecarga de escrituras en Neon por rate limiting en Postgres. | [lib/rate-limit.ts:L50](file:///c:/Proyectos/Justicia%20Verdadera/lib/rate-limit.ts#L50) | **Baja** / Incremento de costos de cómputo Neon. | **Tarea 3.1:** Migrar rate limiting a Redis / Vercel. | PENDIENTE (No implementado) |
| **GEMINI35-QUAL-09** | Bloque duplicado de exclusiones en el archivo `.gitignore`. | [.gitignore](file:///c:/Proyectos/Justicia%20Verdadera/.gitignore) | **Informativa** / Desorden y deuda técnica simple. | **Tarea 3.2:** Eliminar duplicados en `.gitignore`. | PENDIENTE (No implementado) |

---

## 2. Notas de Trazabilidad
*   Todos los fallos e inconsistencias listados son de carácter **factual y verificado**, derivados de la inspección directa del código fuente del repositorio y de la ejecución de comandos locales de validación.
*   Al no permitirse la realización de cambios en el código productivo durante esta iteración de auditoría, el estado de mitigación de todos los hallazgos permanece en **PENDIENTE** para ser resuelto en la siguiente fase de corrección técnica.
