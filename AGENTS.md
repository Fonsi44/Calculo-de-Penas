# Calculo de Penas — Protocolo obligatorio para agentes IA

Este repositorio (Calculo de Penas) requiere precisión, trazabilidad y verificación real. Ningún agente puede afirmar que algo está implementado, corregido, validado o completado si no lo ha comprobado mediante lectura de los archivos relevantes, cambios reales y la ejecución de comandos de validación cuando correspondan.

Este protocolo aplica a cualquier agente IA, proveedor, modelo, herramienta o modo de trabajo usado dentro de este repositorio. Las reglas de este archivo son normativas y deben seguirse en todas las intervenciones.

## Ámbito y archivos críticos

Principalmente trabajamos con:

- `backend/` — FastAPI, inicialización de BD y seeds (`backend/server.py`, `backend/init_neon.py`, `backend/data/*`).
- `frontend/` — App Expo / React Native Web (rutas en `frontend/app/`, `frontend/package.json`).
- `pyproject.toml`, `vercel.json` — configuración de despliegue en Vercel.

Antes de tocar cualquier cambio, identifica si el cambio impacta backend, frontend, datos/semillas o despliegue y procede con las validaciones adecuadas.

## Principios obligatorios

1. No afirmar "hecho", "completado", "validado", "listo" o "todo correcto" sin evidencias reales.
2. No inventar resultados de comandos, URLs, APIs, rutas ni dependencias.
3. Si no hay Internet o no se puede ejecutar un comando, documentarlo como `NO VALIDADO` con la causa exacta.
4. No borrar datos o seeds sin respaldo y sin coordinar la migración.
5. No reescribir archivos completos si basta una corrección puntual.
6. No dejar funciones truncadas, TODOs falsos o promesas no implementadas.
7. No cambiar arquitectura o despliegue sin justificar técnicamente y documentar.

## Honestidad operativa (estatus)

Usar uno de los siguientes estados explícitos al reportar resultados:

- `IMPLEMENTADO`: se modificó el/los archivo(s).
- `VALIDADO`: se ejecutaron y pasaron las validaciones relevantes.
- `NO VALIDADO`: no se pudo comprobar (documentar la causa).
- `PENDIENTE`: falta trabajo por hacer.
- `RIESGO`: hay una condición que puede fallar en ejecución real.
- `NO APLICABLE`: la validación o regla no corresponde a la tarea.

Si una tarea está parcialmente completada, reportar `Porcentaje completado` y `Porcentaje restante`.

## Forma de trabajo obligatoria

Antes de modificar:

- Leer los archivos afectados y las rutas de integración (`backend/server.py`, `backend/init_neon.py`, `frontend/app/**`, `frontend/package.json`, `pyproject.toml`, `vercel.json`).
- Localizar funciones, endpoints y bloques exactos a cambiar.
- Entender el alcance mínimo del cambio y sus efectos (DB, seeds, API, UI, despliegue).
- Identificar riesgos (p. ej. pérdida de datos, cambios en API pública, migraciones incompletas).
- Revisar documentación existente (`README.md`, `frontend/README.md`, `docs/`).

Durante la modificación:

- Aplicar cambios mínimos y controlados.
- Mantener compatibilidad con la arquitectura existente.
- No introducir dependencias sin justificación.
- No mezclar grandes refactors con correcciones puntuales en la misma PR.

Después de modificar:

- Ejecutar las validaciones relevantes (ver sección de comandos mínimos).
- Confirmar que los archivos quedaron correctamente actualizados en VCS.
- Verificar que no se introdujeron regresiones en API o UI.
- Documentar cambios que afecten flujos o despliegues en `docs/` o `README.md`.
- Si no se pudo validar algo, marcar `NO VALIDADO` y explicar la causa exacta.

## Comandos mínimos de validación (recomendados para este repo)

1) Backend (Python / FastAPI):

```bash
# Validación estática básica de sintaxis en los módulos modificados
python -m py_compile backend/server.py backend/init_neon.py

# Ejecutar tests (si existen)
python -m pytest -q

# Ejecutar servidor local (para pruebas manuales). Requiere dependencias instaladas.
uvicorn backend.server:app --reload --port 8000

# Inicializar seeds en entorno de pruebas (NO ejecutar en producción sin backup)
python backend/init_neon.py
```

2) Frontend (Expo / React Native web):

```bash
cd frontend
# Instalar dependencias
npm install    # o `yarn install` según flujo del equipo

# Chequeos estáticos y lint
npm run lint    # o `yarn lint`

# Vista previa en web
npx expo start --web

# Construcción web (si aplica)
npm run build
```

3) Despliegue / Vercel:

- Este repo incluye `pyproject.toml` con `tool.vercel.entrypoint = "backend.server:app"`. Revisar `pyproject.toml` antes de cambiar despliegue.
- Un push a `main` puede desencadenar build en Vercel si el proyecto está conectado — revisar el dashboard y logs.

4) Dependencias y lockfiles:

- Si se modifican dependencias Python, actualizar `requirements.txt` o `pyproject.toml` y documentar cómo reproducir el entorno.
- Si se modifican dependencias Node, actualizar `frontend/package.json` y el lockfile correspondiente (`package-lock.json`/`yarn.lock`).

Si un comando no existe o no puede ejecutarse por falta de herramientas, variables de entorno o Internet, reportar:

```text
NO VALIDADO: causa exacta
```

## Reglas para datos y scripts de inicialización

El proyecto usa seeds y scripts en `backend/data/` y `backend/init_neon.py`. Aplican las siguientes reglas:

1. No borrar ficheros de seeds (`backend/data/*.json`) sin respaldo ni plan de migración.
2. Los cambios en formato de seeds deben acompañarse de actualización del script de inicialización y pruebas idempotentes.
3. No ejecutar scripts de inicialización en producción sin backup y validación en staging.
4. Documentar cambios de esquema o seeds en `docs/`.
5. Registrar y conservar logs de inicialización y migraciones.

## Trazabilidad y metadatos

Mantener trazabilidad entre seeds/datos, origen, fecha de procesamiento y cambios. Documentar procedencia de datasets y separarlos claramente de datos de prueba.

## Reglas de comunicación con el usuario

- Responder siempre en español.
- Ser claro, breve y directo.
- No usar respuestas complacientes.
- Si algo no se pudo validar, indicarlo como `NO VALIDADO` con la causa exacta.

## Formato final obligatorio

Toda respuesta final del agente (al cerrar una tarea o entregar cambios) debe incluir exactamente el siguiente bloque en texto plano:

```text
Porcentaje completado:
Porcentaje restante:
Archivos modificados:
Comandos ejecutados:
Resultado de cada comando:
Cambios aplicados:
Errores corregidos:
Riesgos pendientes:
NO VALIDADO:
Próximo paso recomendado:
```

Notas:

- Si no se modificaron archivos, indicar `Archivos modificados: ninguno`.
- Si no se ejecutaron comandos, indicar `Comandos ejecutados: ninguno` y `NO VALIDADO: no se ejecutaron comandos; causa exacta`.

Este bloque estandariza los informes y facilita revisiones.

## Prohibiciones absolutas

- Inventar resultados, URLs, validaciones o pruebas.
- Ocultar errores o reportar validaciones sin ejecutarlas.
- Reescribir datos críticos sin respaldo.

## Criterio de cierre

Una tarea solo puede considerarse cerrada si:

1. Los archivos afectados fueron revisados.
2. Los cambios fueron aplicados y comiteados.
3. Se ejecutaron los comandos mínimos relevantes (si aplican) y sus resultados fueron reportados.
4. Los riesgos pendientes fueron declarados.
5. Lo no verificable fue marcado como `NO VALIDADO`.

## Criterio de respuesta ante incertidumbre

Si el agente no está seguro:

1. No inventar.
2. Inspeccionar archivos si están disponibles.
3. Ejecutar comandos si corresponde.
4. Si no puede comprobarse, marcar `NO VALIDADO` y proponer el siguiente paso mínimo verificable.

---

Documento adaptado para el repositorio "Calculo de Penas". Mantener este archivo bajo control de versiones y actualizar cuando cambien los flujos de validación o despliegue.
