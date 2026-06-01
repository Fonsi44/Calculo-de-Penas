# Justicia Verdadera — Protocolo obligatorio para agentes IA

Este repositorio requiere precisión, trazabilidad, verificación real y honestidad operativa. Ningún agente puede afirmar que algo está implementado, corregido, validado o completado si no lo ha comprobado mediante lectura de archivos, cambios reales y comandos de validación cuando correspondan.

Este protocolo aplica a cualquier agente IA, proveedor, modelo, herramienta o modo de trabajo usado dentro del repositorio. Las reglas de este archivo son permanentes y no deben tratarse como una tarea puntual.

## Principios obligatorios

1. No afirmar "hecho", "completado", "validado", "listo" o "todo correcto" sin pruebas reales.
2. No inventar resultados de comandos.
3. No inventar URLs, fuentes legales, APIs, rutas, dependencias ni comportamiento del sistema.
4. Si no hay Internet, decirlo claramente.
5. Si una validación no puede ejecutarse, reportar `NO VALIDADO` con la causa exacta.
6. Si una fuente externa no puede verificarse, marcarla como pendiente.
7. No ocultar errores.
8. No borrar datos existentes salvo instrucción explícita.
9. No reescribir archivos completos si basta una corrección mínima.
10. No dejar funciones truncadas, código muerto, comentarios falsos o promesas no implementadas.
11. No cambiar arquitectura sin justificación técnica.
12. No modificar configuración de modelos, proveedores o APIs salvo instrucción explícita del usuario.
13. No responder de forma complaciente si el estado real del código no lo permite.
14. No asumir que una validación equivale a otra. Un `dry-run` no equivale a una validación completa de producción.
15. No confundir compilación correcta con funcionamiento real del sistema.

## Honestidad operativa obligatoria

El agente debe distinguir claramente entre:

- `IMPLEMENTADO`: el archivo fue modificado realmente.
- `VALIDADO`: se ejecutaron comandos reales y pasaron.
- `NO VALIDADO`: no se pudo comprobar por falta de Internet, dependencias, variables de entorno, permisos, servicios externos, credenciales o comando inexistente.
- `PENDIENTE`: falta trabajo real por hacer.
- `RIESGO`: existe una condición que puede fallar en ejecución real.
- `NO APLICABLE`: la validación o regla no corresponde a la tarea realizada.

Está prohibido usar "hecho", "listo", "completado", "validado" o "todo correcto" si no corresponde exactamente a uno de esos estados.

Si una tarea está parcialmente completada, el agente debe decirlo claramente y reportar porcentaje completado y porcentaje restante.

## Forma de trabajo obligatoria

Antes de modificar:

- Leer los archivos afectados.
- Localizar funciones, rutas y bloques exactos.
- Entender el cambio mínimo necesario.
- Identificar riesgos antes de tocar código.
- Revisar si existen instrucciones previas en `README.md`, `CHANGELOG.md`, documentación interna, configuración del proyecto o archivos de reglas.
- Confirmar si el cambio requiere actualizar documentación.
- Confirmar si el cambio afecta validaciones, CLI, rutas, corpus, metadata, fuentes, indexación, OCR o scraping.

Durante la modificación:

- Aplicar cambios mínimos y controlados.
- Mantener compatibilidad con la arquitectura existente.
- No eliminar lógica funcional sin justificación.
- No introducir dependencias innecesarias.
- No crear rutas nuevas si ya existen rutas oficiales del proyecto.
- No sustituir funciones completas por código incompleto.
- No dejar código parcialmente implementado.
- No dejar comentarios que prometan comportamientos no implementados.
- No mezclar refactors grandes con correcciones puntuales salvo instrucción explícita.
- No cambiar nombres públicos, flags CLI, rutas o formatos de metadata sin justificación.

Después de modificar:

- Ejecutar validaciones reales.
- Revisar que el cambio quedó aplicado.
- Revisar que no se introdujeron regresiones.
- Reportar resultados reales, no supuestos.
- Si algo no puede validarse, reportarlo como `NO VALIDADO`.
- Si algo falla, corregirlo o reportarlo como riesgo pendiente.
- Si se modifica comportamiento del proyecto, actualizar documentación si existe y aplica.

## Comandos mínimos de validación

Cuando se modifique código Python:

```bash
python -m py_compile crawler.py
```

Cuando se modifique `crawler.py`, ejecutar además:

```bash
python crawler.py --help
python crawler.py --once --dry-run
```

Si el cambio afecta CLI, fuentes, URLs, seeds, OCR, deduplicación, indexación, metadata, Playwright, scraping o validación de fuentes, ejecutar además:

```bash
python crawler.py --once --only-fixed --no-ai --dry-run
python crawler.py --once --only-fixed --include-complementary --no-ai --dry-run
python crawler.py --once --validate-sources --dry-run
python crawler.py --once --validate-sources --include-pending --dry-run
```

Cuando se modifique TypeScript, Next.js, React, rutas, componentes, API routes o código dentro de `app/`, ejecutar si existen los scripts:

```bash
npm run typecheck
npm run lint
```

Cuando se modifiquen dependencias, configuración global, build, rutas de despliegue, Vercel, Next.js config, package manager o estructura del proyecto, ejecutar si existe:

```bash
npm run build
```

Cuando se modifiquen dependencias Python, revisar si existen:

```text
requirements.txt
pyproject.toml
poetry.lock
Pipfile
```

Cuando se modifiquen dependencias Node, revisar si existen:

```text
package.json
package-lock.json
pnpm-lock.yaml
yarn.lock
```

Si un comando no existe, falla por dependencias, falla por variables de entorno, requiere Internet o no puede ejecutarse por el entorno, reportar:

```text
NO VALIDADO: causa exacta
```

No sustituir validación real por suposiciones.

## Reglas específicas para `crawler.py`

Cuando se modifique `crawler.py`:

1. No usar `shell=True`.
2. No borrar PDFs, textos, metadata, logs, estado ni `_stats.js`.
3. No crear carpetas `corpus_data` duplicadas si existe `app/corpus_data`.
4. No inventar URLs legales, fuentes oficiales ni rutas de PDF.
5. No mover fuentes pendientes a core sin validación real.
6. No indexar documentos con `quality_score < 0.4` salvo flag explícito `--index-low-quality`.
7. No hacer scraping agresivo.
8. No intentar saltar CAPTCHA, login, paywalls, bloqueos ni restricciones.
9. No sobrescribir estados específicos con estados genéricos.
10. No dejar funciones truncadas o parcialmente sustituidas.
11. No descargar de nuevo documentos existentes si ya hay PDF válido salvo `--reprocess-existing`.
12. No usar hash de URL como deduplicación principal.
13. Deduplicar por `pdf_sha256` y `text_sha256`.
14. Si una fuente no devuelve PDF real o devuelve HTML, no indexarla como documento legal.
15. Si una fuente bloquea o no responde, continuar con el resto del ciclo sin romper ejecución.
16. No asumir que `requests.head()` valida correctamente una fuente si `GET` puede comportarse diferente.
17. No asumir que una URL es PDF real sin comprobar `content-type`, tamaño mínimo o cabecera `%PDF` cuando aplique.
18. No ejecutar crawler infinito hasta haber validado varios ciclos `--once`.
19. No procesar fuentes pendientes salvo flag explícito.
20. No ocultar errores de OCR, indexador, base de datos, red, permisos o dependencias.

## Estados de indexación protegidos

No sobrescribir estos estados con `index_failed`:

- `missing_database_url`
- `pending_indexer_review`
- `pending_review`
- `no_text`
- `duplicate`
- `network_unavailable`
- `access_limited`
- `blocked_or_captcha`
- `ocr_pending`

Solo usar `index_failed` si hubo un fallo real del indexador y no existe un estado más específico.

Si una función devuelve `False` por una causa específica ya registrada en metadata, conservar la causa específica.

## Reglas sobre fuentes legales

1. Las fuentes oficiales verificadas deben mantenerse separadas de las pendientes.
2. Las fuentes complementarias no deben mezclarse con core sin justificación.
3. Las fuentes pendientes no deben procesarse salvo flag explícito.
4. Las fuentes sin URL no deben causar errores.
5. Si no hay Internet, no validar como éxito.
6. Si una fuente bloquea, registrar estado específico.
7. Si una URL devuelve HTML en vez de PDF, no indexarla como documento legal.
8. No inventar PDFs directos desde TSC, SAR, ONCAE, ENAG, CNBS, Poder Judicial ni ninguna institución.
9. Si una URL no puede verificarse, dejarla como pendiente.
10. Si una fuente requiere autenticación, login, CAPTCHA o acceso restringido, marcar `access_limited` o `blocked_or_captcha`.
11. Priorizar fuentes oficiales hondureñas.
12. Mantener trazabilidad entre documento, institución, URL, rama jurídica, estado de validación y fecha de procesamiento.
13. No usar fuentes no oficiales como core salvo justificación explícita.
14. No indexar documentos legales de calidad insuficiente.
15. No mezclar legislación vigente, histórica o no verificada sin metadata que lo indique.

## Metadata mínima obligatoria

Todo documento procesado debe conservar, cuando aplique:

- `source_id`
- `url`
- `alternative_urls`
- `title`
- `domain`
- `institution`
- `country`
- `rama`
- `legal_area`
- `document_type`
- `topics`
- `article_refs`
- `possible_validity`
- `pdf_sha256`
- `text_sha256`
- `downloaded_at`
- `processed_at`
- `extraction_method`
- `page_count`
- `word_count`
- `quality_score`
- `indexed`
- `index_status`
- `pending_review`
- `errors`
- `source_type`
- `official`
- `prioridad`
- `is_core_source`
- `is_complementary_source`
- `is_pending_source`
- `validated_externally`
- `validation_status`
- `validation_notes`

Si un campo no aplica, usar valor explícito como `null`, `false`, `[]`, `"desconocido"` o `"no_aplica"` según corresponda. No omitir trazabilidad crítica.

## Reglas para corpus legal

1. No borrar corpus existente.
2. No borrar metadata existente.
3. No borrar PDFs existentes.
4. No borrar textos extraídos.
5. No borrar logs salvo instrucción explícita.
6. No duplicar documentos ya indexados.
7. No indexar textos vacíos o insuficientes.
8. No indexar documentos con OCR fallido sin revisión.
9. Guardar documentos pendientes de revisión con `pending_review=true`.
10. Registrar errores de extracción, OCR, validación e indexación.

## Reglas para documentación

Si el cambio afecta comportamiento, comandos, configuración, fuentes, estructura del corpus o flujo de ejecución, actualizar documentación si existe:

- `README.md`
- `CHANGELOG.md`
- documentación interna relevante

No crear documentación innecesaria si el proyecto no la usa, salvo instrucción explícita.

Cuando se actualice documentación, indicar claramente qué se actualizó.

## Reglas de comunicación con el usuario

- Responder siempre en español.
- Ser claro, breve y directo.
- No usar respuestas complacientes.
- No decir "sí" automáticamente.
- Si algo está mal, decirlo claramente.
- Si algo no se pudo validar, decirlo claramente.
- No usar emojis salvo que el usuario los use primero.
- Si una tarea tiene múltiples pasos, enumerarlos y marcar completado, pendiente o no validado.
- Si algo no puede hacerse, explicar por qué y ofrecer alternativa si existe.
- No llenar la respuesta con teoría innecesaria.
- No prometer entregables que no se puedan cumplir.
- Distinguir entre plantilla, borrador, versión parcial, versión completa y validación real.

## Formato final obligatorio

Toda respuesta final del agente debe incluir exactamente:

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

Si no se modificaron archivos, indicar:

```text
Archivos modificados: ninguno
```

Si no se ejecutaron comandos, indicar:

```text
Comandos ejecutados: ninguno
NO VALIDADO: no se ejecutaron comandos; causa exacta
```

## Prohibiciones absolutas

- Inventar resultados.
- Inventar URLs.
- Inventar fuentes legales.
- Inventar validaciones.
- Ocultar errores.
- Decir "todo correcto" sin comandos reales.
- Decir "implementado" sin haber modificado o revisado archivos.
- Decir "validado" sin ejecutar comandos.
- Reescribir archivos completos sin necesidad.
- Cambiar arquitectura sin justificación.
- Borrar datos del corpus sin autorización explícita.
- Repetir instrucciones sin aplicar cambios.
- Sustituir funciones funcionales por código incompleto.
- Dejar código roto pero reportarlo como completado.
- Ignorar errores de validación.
- Confundir `dry-run` con validación completa de producción.
- Mezclar tareas no solicitadas.
- Añadir funcionalidades no pedidas.
- Hacer scraping agresivo.
- Saltar CAPTCHA, login o restricciones.
- Mover fuentes pendientes a core sin validación real.
- Modificar configuración de modelos o proveedores sin instrucción explícita.

## Criterio de cierre

Una tarea solo puede considerarse cerrada si:

1. Los archivos afectados fueron revisados.
2. Los cambios fueron aplicados.
3. Los comandos mínimos relevantes fueron ejecutados.
4. Los resultados fueron reportados.
5. Los riesgos pendientes fueron declarados.
6. Lo no verificable fue marcado como `NO VALIDADO`.
7. No quedan funciones truncadas, rutas rotas, estados sobrescritos indebidamente ni validaciones inventadas.

## Criterio de respuesta ante incertidumbre

Si el agente no está seguro:

1. No debe inventar.
2. Debe inspeccionar archivos si tiene acceso.
3. Debe ejecutar comandos si corresponde.
4. Si no puede comprobarlo, debe marcar `NO VALIDADO`.
5. Debe proponer el siguiente paso mínimo verificable.

## Instrucción final permanente

La prioridad del agente es preservar integridad, trazabilidad, seguridad y verificabilidad del repositorio. La respuesta correcta no es la más complaciente, sino la más precisa y comprobable.
