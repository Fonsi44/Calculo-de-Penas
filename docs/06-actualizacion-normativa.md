# 06 — Procedimiento de actualización normativa

## Cuándo se activa

- Reforma parcial o total al Código Penal de Honduras.
- Nueva jurisprudencia vinculante de la Corte Suprema de Justicia.
- Cambio en la Constitución que afecte derechos fundamentales penalmente relevantes.
- Adopción de un tratado internacional con impacto penal.

## Procedimiento paso a paso

### 1. Recepción y validación

- [ ] Obtener texto oficial publicado en La Gaceta.
- [ ] Verificar número de decreto y fecha de vigencia.
- [ ] Consultar con abogado HN colegiado si hay dudas interpretativas.

### 2. Actualización del catálogo CP

- [ ] Reemplazar `data/articulos_cp.json` con los artículos del nuevo texto.
- [ ] Si cambia la estructura (libros, títulos, capítulos), reflejar en `data/ramas_juridicas.json`.
- [ ] Generar migración Drizzle si el schema cambia:
  ```bash
  npx drizzle-kit generate
  # Revisar SQL generado
  npx drizzle-kit push
  ```

### 3. Re-validación del catálogo de delitos

- [ ] Ejecutar:
  ```bash
  node scripts/validate-delitos-tfidf.js
  ```
- [ ] Revisar manualmente `data/delitos-validacion.csv`:
  - Filas `REVISAR`: confirmar artículo correcto en PDF oficial.
  - Filas `NO_ENCONTRADO`: delito eliminado o renumerado; decidir si se conserva o se desactiva.
- [ ] Actualizar `data/delitos.json` con artículos correctos (NO eliminar sin respaldo).
- [ ] Regenerar estados:
  ```bash
  node scripts/generar-estados-delitos.js
  ```

### 4. Actualización del motor

- [ ] Revisar `lib/rules/v1/` para verificar que las reglas siguen vigentes.
- [ ] Si cambia una norma (Art. 66, 70, etc.):
  1. Crear `lib/rules/v2/` con las nuevas reglas (mantener v1).
  2. Añadir tests para v2.
  3. Migrar `lib/calculo.ts` para re-exportar v2.
  4. Marcar v1 como `@deprecated`.
- [ ] Actualizar catálogo `lib/catalogos.ts` si cambian agravantes/atenuantes/eximentes.

### 5. Documentación

- [ ] Actualizar `docs/03-trazabilidad-normativa.md` con nuevos Arts. CP.
- [ ] Actualizar `docs/02-motor-calculo.md` con nuevas reglas.
- [ ] Añadir entrada en `CHANGELOG.md` con fecha, decreto, resumen de cambios.

### 6. Validación y deploy

- [ ] `npm test` debe pasar (actualizar tests si la regla cambia).
- [ ] `npm run build` debe pasar.
- [ ] PR con revisión de abogado HN.
- [ ] CI verde.
- [ ] Deploy a staging primero (Vercel preview).
- [ ] Tests manuales en calculadora con casos típicos.
- [ ] Deploy a producción.

### 7. Comunicación

- [ ] Notificar a usuarios (banner en app, email).
- [ ] Publicar nota técnica en sitio web.
- [ ] Actualizar versión del motor en metadata.

## Versionado del motor

- **v1** (actual, 2026-06): implementación base.
- **v2** (futuro): cuando se introduzca cambio incompatible.
- Cada `lib/rules/vN/` debe tener su propio set de tests.

## Riesgos del proceso

- **Cambio silencioso**: si se modifica `data/articulos_cp.json` sin re-validar, los delitos quedan con artículos obsoletos.
- **Sesgo interpretativo**: reglas implementadas sin validación de abogado HN colegiado.
- **Regresión**: cambio en cálculo que rompe tests existentes sin actualizar los casos de prueba.

## Herramientas auxiliares

- `scripts/validate-delitos.js` — valida estructura del JSON.
- `scripts/validate-delitos-tfidf.js` — TF-IDF vs texto del CP.
- `scripts/generar-estados-delitos.js` — genera `data/delitos-estados.json` desde CSV.
- `scripts/seed.ts` (Drizzle) — poblar BD desde JSON.

## Pendiente

- Sistema de versionado del motor con tabla `regla_versiones` en BD (no implementado).
- Auditoría: tabla `calculo_traza` para registrar cada cambio de regla aplicado a un cálculo histórico (no implementado).
- Migración de datos entre versiones del CP sin pérdida de cálculos históricos.
