# Fase 3C — SEO y GEO de los artículos modificados

**Fecha:** 2026-07-26
**Modo:** `IMPLEMENTACIÓN` sobre `main`
**Alcance:** los 4 artículos desbloqueados + los 3 con claims reformulados (CNA y Art. 71).

---

## 1. Resumen ejecutivo

Revisión SEO/GEO enfocada en calidad y diferenciación sobre longitud. Los 4 artículos desbloqueados pierden afirmaciones comerciales no demostrables y ganan precisión normativa, lo que mejora la calidad para motores de búsqueda y para motores generativos (GEO).

| Artículo | Cambio SEO principal | Impacto GEO |
|----------|---------------------|-------------|
| `diferencia-denuncia-querella-acusacion-honduras` | +3 citas CPP literales (Arts. 96, 99, 269, 301) | Alto: contenido verificable para LLMs |
| `abogado-penalista-choluteca` | Eliminación "6-12 meses" → plazo procesal Art. 292 | Medio: afirmación comprobable |
| `abogado-penalista-sur-honduras` | Eliminación "ventaja procesal" → Art. 289 defensa técnica | Medio: precisión |
| `cuando-necesito-abogado-penalista-honduras` | Eliminación "es crucial" → Arts. 88, 96, 99, 289 | Alto: base normativa |
| `defensa-penal-honduras` (Art. 71) | Plazo 24h + excepción 48h textual | Alto: dato verificable |
| `defensa-penal-menores-edad-honduras` (CNA) | +8 confirmaciones con texto CNA | Alto: contenido verificable |
| `violencia-domestica-ruta-legal-honduras` (Art. 71) | Plazo 24h/48h con CPP Arts. 175-176 | Alto: precisión |

---

## 2. Revisión por dimensión (enunciado §8)

### 2.1 Intención de búsqueda

| Artículo | Intención primaria | Cobertura |
|----------|-------------------|-----------|
| `diferencia-denuncia-querella` | Informacional: "diferencia denuncia querella acusación Honduras" | ✅ Ahora responde con citas legales concretas |
| `abogado-penalista-choluteca` | Transaccional + informacional local | ✅ Mantiene CTA local sin afirmaciones de duración |
| `abogado-penalista-sur-honduras` | Transaccional + informacional regional | ✅ Mantiene enfoque sur sin "ventaja procesal" |
| `cuando-necesito-abogado-penalista` | Informacional: "cuándo necesito abogado penalista" | ✅ Responde con derechos de defensa concretos |

### 2.2 Solapamiento entre páginas

- `abogado-penalista-choluteca` vs `abogado-penalista-sur-honduras`: tratan zonas distintas (cabecera departamental vs. región sur genérica Nacaome/San Lorenzo). Tras Fase 3C, el segundo pierde la afirmación de "ventaja procesal local", reduciendo el solapamiento conceptual.
- No se detecta canibalización nueva.

### 2.3 Contenido local

- `abogado-penalista-choluteca`: el claim local sobre autoridades judiciales queda en `needs_human_review` (paquete dedicado). No se elimina, se marca para verificación.
- `abogado-penalista-sur-honduras`: conserva menciones geográficas (Nacaome, Valle, San Lorenzo) como contexto, sin afirmar "ventaja procesal".

### 2.4 Headings

- No se modifican headings (H2/H3) en los 4 artículos desbloqueados. Solo se reemplazan párrafos puntuales dentro de las secciones existentes.

### 2.5 Respuesta inicial

- `diferencia-denuncia-querella`: la respuesta inicial (párrafo bajo H2 principal) se mantiene con la distinción conceptual; las correcciones se aplican en secciones posteriores con citas CPP.

### 2.6 Metadatos

- No se modifican `meta_title` ni `meta_description` en Fase 3C. Los metadatos actuales siguen siendo coherentes con el contenido corregido.

### 2.7 Canonical

- Las 7 URLs modificadas mantienen su canonical automático (`/blog/derecho-penal/[slug]`). Sin cambios.

### 2.8 Enlazado interno

- No se añaden ni eliminan enlaces internos en Fase 3C. La estructura de enlazado existente se preserva.

### 2.9 Schema (JSON-LD)

- No se modifica el schema `Article`/`BlogPosting` de los artículos. Los avisos `AiReviewNotice` se renderizan según el estado actualizado de cada artículo.

### 2.10 Fuentes visibles

- Los artículos modificados ahora citan artículos legales concretos (CPP Arts. 96, 99, 269, 289, 292, 301; Constitución Arts. 71, 88; CNA Arts. 180, 195, principios). Esto mejora la verificabilidad visible para el lector.

### 2.11 Avisos de revisión

- Los artículos en `needs_human_review` muestran el componente `AiReviewNotice` con aviso de revisión pendiente.
- Los artículos en `completed` no muestran aviso (estado verificado).

### 2.12 CTA

- Los CTA hacia `solicitar-consulta` se mantienen en los artículos transaccionales.

### 2.13 Claims comerciales

- **Eliminados en Fase 3C:** "6-12 meses", "ventaja procesal concreta", "es crucial", "facilita la defensa", "resultados garantizados" (no presente explícitamente pero afín).
- **Sustituidos por:** derechos de defensa técnica (Arts. 88, 96, 99, 289) y plazos procesales puntuales verificables.

### 2.14 Contenido útil para motores generativos (GEO)

Esta es la mejora más relevante para GEO:

- **Antes:** afirmaciones comerciales sin respaldo ("6-12 meses", "facilita defensa") que un LLM no puede verificar y tendería a omitir o matizar.
- **Después:** datos verificables con cita legal precisa (Art. 292 audiencia inicial 6 días; Art. 289 presencia de defensor bajo pena de nulidad; Art. 71 plazo 24h/48h con excepción).

Los LLMs (ChatGPT, Perplexity, Gemini) pueden ahora citar estos artículos con confianza porque están respaldados por normas verificables.

---

## 3. Recomendaciones posteriores (no aplicadas en Fase 3C)

1. **`abogado-penalista-sur-honduras`:** considerar renombrar a un enfoque más informacional para diferenciarlo aún más del de Choluteca.
2. **Schema `LegalArticle`:** evaluar añadir schema específico de artículo legal con referencias a las normas citadas (mejora GEO).
3. **FAQ estructurado:** los artículos `diferencia-denuncia-querella` y `cuando-necesito-abogado` se prestan a FAQPage schema con preguntas frecuentes.

Estas recomendaciones **no se aplican en Fase 3C** (no crear páginas nuevas ni modificar artículos ajenos al Lote 1).

---

## 4. Conclusión

Fase 3C mejora la calidad SEO/GEO del Lote 1 sustituyendo afirmaciones comerciales por datos normativos verificables. La diferenciación entre artículos se mantiene o mejora. **No se crearon páginas nuevas ni se modificaron artículos ajenos al Lote 1.**
