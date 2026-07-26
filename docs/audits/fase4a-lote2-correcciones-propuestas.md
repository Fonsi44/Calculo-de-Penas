# Fase 4A — Correcciones propuestas del Lote 2

**Fecha:** 2026-07-26T18:48:53.531Z

> Solo se proponen correcciones respaldadas por fuente canónica verificable o
> fuente oficial hondureña. Los claims interpretativos o sin evidencia firme
> NO reciben redacción sustituta (quedan en `needs_human_review`).

## Total: 3 correcciones con evidencia firme

## 4a-pension-alimenticia-porc-01 — `pension-alimenticia-porcentaje-honduras-2026`

- **Texto anterior:** Artículo 1069
- **Texto sustituto:** Código de Familia (Arts. 211 y siguientes)
- **Motivo:** El artículo citado (Código Civil) no regula pensión alimenticia: Art. 1069 CC trata "asignación desde día cierto" y Art. 1230 CC trata "tutores, curadores y partición de herencias". La pensión alimenticia se regula en el Código de Familia (Decreto 76-84), Arts. 211 y ss.
- **Fuente:** Poder Judicial de Honduras — CEDIJ (poderjudicial.gob.hn)
- **Artículo:** Art. 211 y ss. Código de Familia
- **Fragmento:** Art. 211 CF establece el orden jerárquico de familiares con derecho a alimentos; Arts. 217-225 fijan la obligación y el monto según necesidades y capacidad.
- **Impacto en el body:** Reemplazar la cita "Artículo 1069/1230 del Código Civil" por la referencia correcta al Código de Familia.

## 4a-pension-alimenticia-porc-02 — `pension-alimenticia-porcentaje-honduras-2026`

- **Texto anterior:** Artículo 1230
- **Texto sustituto:** Código de Familia (Arts. 211 y siguientes)
- **Motivo:** El artículo citado (Código Civil) no regula pensión alimenticia: Art. 1069 CC trata "asignación desde día cierto" y Art. 1230 CC trata "tutores, curadores y partición de herencias". La pensión alimenticia se regula en el Código de Familia (Decreto 76-84), Arts. 211 y ss.
- **Fuente:** Poder Judicial de Honduras — CEDIJ (poderjudicial.gob.hn)
- **Artículo:** Art. 211 y ss. Código de Familia
- **Fragmento:** Art. 211 CF establece el orden jerárquico de familiares con derecho a alimentos; Arts. 217-225 fijan la obligación y el monto según necesidades y capacidad.
- **Impacto en el body:** Reemplazar la cita "Artículo 1069/1230 del Código Civil" por la referencia correcta al Código de Familia.

## 4a-pension-alimenticia-porc-03 — `pension-alimenticia-porcentaje-honduras-2026`

- **Texto anterior:** Artículo 1593
- **Texto sustituto:** Código de Familia (Decreto 76-84)
- **Motivo:** El Código de Familia no llega al Art. 1593 (su articulado no supera los 500). Cita numérica inválida; debe sustituirse por referencia genérica al Código de Familia.
- **Fuente:** Poder Judicial de Honduras — CEDIJ (poderjudicial.gob.hn)
- **Artículo:** Código de Familia (Decreto 76-84)
- **Fragmento:** El Código de Familia de Honduras no contiene un Art. 1593.
- **Impacto en el body:** Eliminar o sustituir el número de artículo inexistente.

## Claims corrected SIN sustitución automática

Los siguientes claims están marcados `corrected` pero no tienen sustitución
automática porque requieren decisión editorial humana sobre la redacción:

- **4a-custodia-hijos-honduras--01** (`custodia-hijos-honduras-juez`): Art. 65 CF — Artículo citado (Art. 65 CF) NO existe en la fuente canónica o NO trata del tema. La materia pertene…
- **4a-juicio-oral-etapas-que-e-05** (`juicio-oral-etapas-que-esperar-honduras`): Art. 82 — El artículo Art. 82 existe pero NO trata del tema afirmado en el cuerpo (pertinencia baja). Requiere…
- **4a-juicio-oral-etapas-que-e-12** (`juicio-oral-etapas-que-esperar-honduras`): Art. 339 CPP — El artículo Art. 339 CPP existe pero NO trata del tema afirmado en el cuerpo (pertinencia baja). Req…
- **4a-juicio-oral-etapas-que-e-16** (`juicio-oral-etapas-que-esperar-honduras`): Art. 2 CPP — El artículo Art. 2 CPP existe pero NO trata del tema afirmado en el cuerpo (pertinencia baja). Requi…
- **4a-que-hacer-si-me-detienen-02** (`que-hacer-si-me-detienen-en-honduras`): Art. 84 — El artículo Art. 84 existe pero NO trata del tema afirmado en el cuerpo (pertinencia baja). Requiere…

## Aplicación

Las correcciones se aplican en la Fase 4A §8 mediante
`scripts/fase4a-aplicar-correcciones.ts` con dry-run, ocurrencia única, hash
antes/después e idempotencia. La aplicación al body se verifica después.
