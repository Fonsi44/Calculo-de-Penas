# Indice de Archivos Archivados

Saneamiento integral del repositorio — 2026-06-05

---

## Codigo Muerto Confirmado (0 imports en todo el repositorio)

| Ruta Original | Motivo | Confianza | Riesgo de Recuperacion |
|---|---|---|---|
| `components/ui/breadcrumb.tsx` | Componente Breadcrumb con navegacion jerarquica, 0 imports en todo el repo | ALTA | Bajo — componente aislado, facil de reinsertar si se necesita |
| `hooks/use-local-storage.ts` | Hook useLocalStorage, 0 imports | ALTA | Bajo — hook generico, standalone |
| `lib/api-helpers.ts` | apiSuccess() y apiError() nunca usados por ninguna ruta API. Todas las rutas construyen respuestas manualmente. | ALTA | Bajo — si se decide estandarizar helpers en el futuro, reimplementar o recuperar |
| `lib/rules/v2/types.ts` | Re-export de v1/types sin consumidores. Directorio `lib/rules/v2/` fantasma sin implementacion real. | ALTA | Nulo — es un placeholder sin logica propia |

---

## Backups de data/ (confianza ALTA)

| Ruta Original | Motivo | Confianza | Riesgo de Recuperacion |
|---|---|---|---|
| `data/articulos_constitucion.json.gitbak` | Backup de git con encoding danado (mojibake) | ALTA | Bajo — el archivo activo `articulos_constitucion.json` tiene 378 articulos correctos |
| `data/backup_articulos_constitucion_2026-06-05.json` | Backup fechado generado por `scripts/resend-neon.mjs` | ALTA | Bajo — snapshot puntual antes de reseed |
| `data/backup_delitos_2026-06-05.json` | Backup fechado generado por `scripts/resend-neon.mjs` | ALTA | Bajo — snapshot puntual antes de reseed |
| `data/delitos.json.bak2` | Backup manual de delitos.json | ALTA | Bajo — el catalogo activo tiene 483 delitos validados |
| `data/delitos-estados.json.bak2` | Backup manual de delitos-estados.json | ALTA | Bajo — regenerable desde `generar-estados-delitos.js` |
| `data/delitos-validacion.json.bak2` | Backup manual de delitos-validacion.json | ALTA | Bajo — regenerable desde los scripts de validacion |
| `data/comparacion_arts_constitucion.txt` | Output de script fallido (contiene SyntaxError de Python) | ALTA | Nulo — artefacto de ejecucion erronea |
| `data/reclasificacion_88.csv` | Archivo vacio (solo header, 0 filas de datos) | ALTA | Nulo — sin datos aprovechables |

---

## Artefactos Historicos de data/ (confianza MEDIA)

| Ruta Original | Motivo | Confianza | Riesgo de Recuperacion |
|---|---|---|---|
| `data/delitos-propuestos.json` | Catalogo intermedio de 395 delitos extraidos del CP por `extract-penas-from-cp.py`. Solo referenciado en CHANGELOG.md y docs/24-validacion-delitos.md como referencia historica. | MEDIA | Medio — util como referencia si se rehace la extraccion de delitos desde cero |
| `data/delitos-validacion.md` | Reporte documental de validacion TF-IDF (2026-06-03). No leido por codigo. | MEDIA | Bajo — documento auto-explicativo, conserva contexto historico |
| `data/inventario_cp_delitos.csv` | Inventario one-time: 362 articulos CP con tema='delitos'. Origen desconocido. | MEDIA | Medio — podria ser util para futuras validaciones cruzadas |
| `data/inventario_faltantes.csv` | Inventario one-time: 255 articulos CP no cubiertos por el catalogo. | MEDIA | Medio — referencia para identificar gaps en futuras expansiones |
| `data/validacion_constitucion.txt` | Diff entre version antigua (128 arts, mojibake) y nueva (378 arts) de la Constitucion. | MEDIA | Bajo — la version nueva ya esta activa en `articulos_constitucion.json` |

---

## Scripts Historicos One-Shot (confianza ALTA)

| Ruta Original | Motivo | Confianza | Riesgo de Recuperacion |
|---|---|---|---|
| `scripts/apply-0003.cjs` | Aplico la migracion 0003 directamente a Neon sin Drizzle Kit. Migracion ya aplicada. | ALTA | Bajo — la migracion esta en `drizzle/migrations/` |
| `scripts/build-constitucion-index.py` | Extrajo la Constitucion desde PDF (PyMuPDF). Ya completado, JSON de salida existe. | ALTA | Medio — util como referencia si se necesita re-extraer de un PDF actualizado |
| `scripts/build-cp-index.cjs` | Generaba `cp-indice.json`. Ruta de entrada hardcodeada a archivo temporal inexistente. Dependencia rota. | ALTA | Bajo — `parse_cp_html.py` hace lo mismo pero completo |
| `scripts/check-neon.cjs` | Verificacion post-migracion 0003 de la estructura de BD. Ya completada. | ALTA | Bajo — one-shot de diagnostico |
| `scripts/fix-delitos.cjs` | Correccion automatica masiva de delitos (570 lineas). Ya aplicada. Reemplazada por `fix-delitos-curated.cjs` (curacion manual superior). | ALTA | Bajo — `fix-delitos-curated.cjs` es mas autoritativo |
| `scripts/init-validacion.cjs` | Inicializo `delitos-validacion.json` marcando todos como pendiente. Ya completado. | ALTA | Bajo — `regen-delitos-validation.cjs` hace lo mismo pero mas completo |
| `scripts/parse_cp_html.py` | Extrajo 635 articulos del CP desde HTML. Ruta de entrada hardcodeada a archivo temporal inexistente. | ALTA | Medio — util como referencia de parsing si se necesita re-extraer |
| `scripts/regen-delitos-validation.cjs` | Regenero `delitos-validacion.json` con 100% validados. Ya completado. | ALTA | Bajo — funcionalidad cubierta por `validate-all.cjs` |
| `scripts/regenerate-estados.cjs` | Regeneraba `delitos-estados.json`. Redundante con `remove-rejected.cjs` y `regen-delitos-validation.cjs`. | ALTA | Bajo — `generar-estados-delitos.js` cubre esta funcion |
| `scripts/remove-rejected.cjs` | Elimino delitos especificos (Duelo, Provocacion al duelo). Ya completado. | ALTA | Bajo — one-shot de limpieza puntual |
| `scripts/update-validacion.cjs` | Aplico correcciones manuales de abogado revisor a `delitos-validacion.json`. Ya aplicadas. | ALTA | Bajo — las correcciones ya estan en el JSON activo |
| `scripts/validate-delitos.js` | Validador basico por tokens Jaccard. Redundante: `validate-all.cjs` (semantico) y `validate-delitos-tfidf.js` (TF-IDF) son superiores. | ALTA | Bajo — los otros 2 validadores cubren el mismo proposito con mayor precision |
| `scripts/verify-auditoria.cjs` | Verifico DDL de tabla `auditoria_eventos` post-migracion. Ya completada. | ALTA | Bajo — one-shot de verificacion |

---

## Assets Boilerplate no Usados (confianza ALTA)

| Ruta Original | Motivo | Confianza | Riesgo de Recuperacion |
|---|---|---|---|
| `public/file.svg` | Icono generico de `create-next-app`. 0 referencias en el codigo. | ALTA | Nulo — boilerplate sin valor |
| `public/globe.svg` | Icono globo de `create-next-app`. 0 referencias en el codigo. | ALTA | Nulo — boilerplate sin valor |
| `public/next.svg` | Logo Next.js de `create-next-app`. 0 referencias en el codigo. | ALTA | Nulo — boilerplate sin valor |
| `public/vercel.svg` | Logo Vercel de `create-next-app`. 0 referencias en el codigo. | ALTA | Nulo — boilerplate sin valor |
| `public/window.svg` | Icono ventana de `create-next-app`. 0 referencias en el codigo. | ALTA | Nulo — boilerplate sin valor |

---

## Resumen

- **Total archivos archivados:** 35
- **Confianza ALTA:** 27 archivos
- **Confianza MEDIA:** 8 archivos (artefactos historicos de data/)
- **Archivos conservados en data/:** 7 (delitos, ramas_juridicas, articulos_constitucion, articulos_cp, delitos-estados, delitos-validacion, delitos-validacion.csv)
- **Scripts conservados:** 10 (e2e-start, check-secrets, cleanup-e2e-users, dedupe-delitos, extract-penas-from-cp, fix-delitos-curated, generar-estados-delitos, resend-neon, validate-all, validate-delitos-tfidf)
- **Assets conservados en public/:** 2 (manifest.json, icon-192.svg)
