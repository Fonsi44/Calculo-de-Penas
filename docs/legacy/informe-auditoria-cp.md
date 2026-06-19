# INFORME TÉCNICO DE AUDITORÍA — BIBLIOTECA DEL CÓDIGO PENAL

**Fecha**: 2026-06-14
**Auditor**: Sistema de auditoría automatizada (scripts/auditar-cp.js)
**Base de datos**: articulos_cp (PostgreSQL via Neon)
**Archivo fuente**: data/articulos_cp.json
**Backup**: data/articulos_cp.json.BACKUP_20260614_*

---

## RESUMEN EJECUTIVO

| Métrica | Valor |
|---------|-------|
| Artículos revisados | 635 |
| Artículos correctos | 627 |
| Artículos corregidos | 8 |
| Artículos pendientes de revisión manual | 0 |
| Fuentes legales consultadas | 4 |
| Backups creados | 2 |

---

## ARTÍCULOS CORREGIDOS

| Artículo | Problema | Acción | Fuente |
|----------|----------|--------|--------|
| Art. 211 CP | Terminaba en coma; error "aúna" | Coma → punto; "aúna" → "a una" | Decreto 130-2017 |
| Art. 232 CP | Sin punto final | Añadido punto final | Decreto 130-2017 |
| Art. 317 CP | Sin punto final; "Derogado" en original | Añadido punto final; verificado activo en TSC | TSC / La Gaceta |
| Art. 337 CP | Párrafo final duplicado; "Derogado" en original | Eliminado duplicado; verificado activo en TSC | TSC / La Gaceta |
| Art. 363 CP | Severamente truncado (119 chars vs 1040) | Texto completo con 9 circunstancias + párrafo final | Decreto 130-2017 |
| Art. 521 CP | Sin punto final | Añadido punto final | Decreto 130-2017 |
| Art. 610 CP | Encabezado "DISPOSICIONES ADICIONALES" incluido | Eliminado encabezado de sección | Decreto 130-2017 |
| Art. 632 CP | Encabezado "DISPOSICIONES FINALES" incluido | Eliminado encabezado de sección | Decreto 130-2017 |
| Art. 613 CP | Encabezado "DISPOSICIONES TRANSITORIAS" incluido; typo "tiernas" | Eliminado encabezado; corregido typo | TSC / La Gaceta |

---

## FUENTES LEGALES UTILIZADAS

| Fuente | URL | Tipo | Uso |
|--------|-----|------|-----|
| Decreto 130-2017 (TSC) | https://www.tsc.gob.hn/web/leyes/Decreto_130-2017.pdf | PDF (texto) | Fuente principal de contraste |
| Código Penal (Poder Judicial) | https://www.poderjudicial.gob.hn/Cedij/Publicaciones%20Especiales%20Diario%20Oficial%20La%20Gaceta/Codigo%20Penal%20Decreto%20No.130-2017.pdf | PDF (imagen) | Consulta secundaria |
| UNPH (original) | https://repositorio.unph.edu.hn/s/unph/item/3084 | PDF (texto) | Fuente de contraste |
| UNPH (actualizado jul 2024) | https://repositorio.unph.edu.hn/s/unph/item/3137 | PDF (imagen) | Consulta de vigencia |

---

## CAUSA RAÍZ DE LOS PROBLEMAS

1. **Truncamiento por límite de importación**: Art. 363 CP fue importado incompleto (solo primera oración). El resto del artículo (9 circunstancias agravantes + párrafo final) se perdió durante la importación inicial.

2. **Errores de OCR/post-procesamiento**: Varios artículos (211, 232, 317, 521) perdieron el punto final durante la extracción del texto fuente.

3. **Fusión de encabezados de sección**: Los artículos 610, 613 y 632 incluían encabezados de sección ("DISPOSICIONES ADICIONALES", "TRANSITORIAS", "FINALES") como parte del texto del artículo.

4. **Duplicación por error de importación**: Art. 337 CP tenía el primer párrafo repetido al final.

5. **Conflicto de versiones**: Artículos 317, 337 y 613 aparecen como "Derogado" en el texto original del Decreto 130-2017 pero tienen texto activo en la versión consolidada (TSC/La Gaceta), lo que indica que fueron modificados por reformas posteriores.

---

## HERRAMIENTA DE AUDITORÍA

Se creó el script `scripts/auditar-cp.js` como herramienta reutilizable.

**Uso**:
```bash
node scripts/auditar-cp.js
```

**Funcionalidades**:
- Verifica 635 artículos contra 10 categorías de problemas
- Detecta: truncamiento, HTML roto, codificación, duplicados, encabezados mal ubicados, typos
- Genera reporte JSON en `data/auditoria-cp-report.json`
- Exporta informe legible por consola

---

## RESPALDO

- Backup 1: `data/articulos_cp.json.BACKUP_20260614_*` (copia previa a correcciones)
- Backup 2: `data/auditoria-correcciones.json` (log detallado de cambios)

---

## VALIDACIÓN MANUAL

Para validar la biblioteca desde el navegador:

1. Visitar https://www.pinedayasociadoshn.com/intranet/admin/cp
2. Verificar listado completo: deben aparecer 635 artículos
3. Buscar "Art. 363": debe mostrar texto completo con 9 circunstancias
4. Buscar "Art. 337": no debe tener párrafo duplicado al final
5. Buscar "Art. 610": no debe mostrar "DISPOSICIONES ADICIONALES"
6. Verificar Art. 1 y Art. 635: completos y con formato correcto
7. Probar búsqueda: "hurto", "robo", "homicidio", "pena"
8. Verificar que no hay errores 404 en rutas /cp, /cp/[id]
