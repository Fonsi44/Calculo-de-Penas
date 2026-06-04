# Validación Legal de Delitos — Proceso

## Estado actual

- **Total**: 469 delitos en `data/delitos.json`
- **Validados**: 0
- **Pendientes**: 469
- **Archivo de trabajo**: `data/delitos-validacion.json`

## ¿Por qué validar?

`data/delitos.json` se generó en bulk. Muchos artículos del CP (Código Penal,
Decreto 130-2017) pueden estar:
- **Mal asignados**: el delito "X" no está en el artículo "Y"
- **Desactualizados**: reformas posteriores al Decreto original
- **Con penas incorrectas**: la pena_minima_meses o pena_maxima_meses no coincide

La calculadora usa estos datos para generar resultados. **Datos incorrectos = resultados incorrectos = riesgo legal para el usuario final**.

## Estados posibles

| Estado | Significado | Acción |
|--------|-------------|--------|
| `pendiente` | Aún no validado | Investigar |
| `validado` | Artículo y penas CONFIRMADOS en fuente oficial | Mantener tal cual |
| `rechazar` | Delito no existe en CP, o artículo incorrecto | Marcar para exclusión |
| `revisar` | Datos dudosos, requiere opinión de abogado humano | Mantener con disclaimer |

## Fuentes oficiales prioritarias

1. **Congreso Nacional de Honduras** — texto vigente del CP
   - https://www.congresohnh.gob.hn/
2. **Diario Oficial La Gaceta** — publicación de leyes
   - https://www.lagaceta.hn/
3. **Poder Judicial de Honduras** — jurisprudencia
   - https://www.poderjudicial.gob.hn/
4. **Procuraduría General de la República (PGR)** — dictámenes
   - https://www.pgr.gob.hn/
5. **Corte Suprema de Justicia** — sentencias
   - https://www.csj.gob.hn/

**NO son fuentes válidas**:
- Wikipedia (puede estar desactualizada)
- Blogs o sitios no oficiales
- Copias del CP en sitios desconocidos

## Proceso de validación (por delito)

```
1. WebSearch: "Código Penal Honduras [nombre delito] [artículo]"
2. Identificar fuente oficial
3. WebFetch de la fuente oficial
4. Comparar:
   - ¿El artículo es correcto?
   - ¿La pena_minima coincide?
   - ¿La pena_maxima coincide?
   - ¿Hay pena alternativa?
5. Actualizar data/delitos-validacion.json
6. Si rechazar: marcar para exclusión en C7
```

## Estructura de cada entrada

```json
{
  "id": "delito-001",
  "nombre": "Abandono de animales",
  "articulo_actual": "Art. 342 CP",
  "rama_id": "territorio_ambiente.flora_fauna",
  "estado": "pendiente|validado|rechazar|revisar",
  "articulo_correcto": "Art. 342 CP",
  "pena_minima_meses_actual": 6,
  "pena_maxima_meses_actual": 24,
  "pena_minima_meses_correcta": 6,
  "pena_maxima_meses_correcta": 24,
  "tiene_pena_alternativa_actual": false,
  "pena_alternativa_min_actual": 0,
  "pena_alternativa_max_actual": 0,
  "fuente": "https://www.congresohnh.gob.hn/...",
  "fuente_verificada": true,
  "fecha_validacion": "2026-06-04",
  "validador": "agente",
  "notas": "Confirmado contra texto vigente del CP"
}
```

## Plan de ejecución (8-10 sesiones)

- **C0** (setup): script + JSON inicial ← ACTUAL
- **C1**: Rama Vida (10 delitos)
- **C2**: Rama Integridad (15 delitos)
- **C3**: Rama Libertad (20 delitos)
- **C4**: Rama Patrimonio + Orden económico (60 delitos)
- **C5**: Rama Sexual + Familia (40 delitos)
- **C6**: Rama Administración pública + Resto (~324 delitos)
- **C7**: Cierre: regenerar `data/delitos-estados.json`, tests, docs

Por sesión, validar ~50-80 delitos (depende de la complejidad de búsqueda).

## Limitaciones declaradas

**ESTE PROCESO NO REEMPLAZA LA VALIDACIÓN POR UN ABOGADO COLEGIADO HONDUREÑO.**

La validación con búsquedas online es la mejor alternativa dado el presupuesto $0,
pero tiene sesgos y limitaciones:
- Páginas oficiales pueden estar caídas
- Texto del CP puede tener reformas no digitalizadas
- Interpretación jurisprudencial puede variar

**El disclaimer en /terminos ya establece que la plataforma es "herramienta de apoyo"**.

## Comando útil

```bash
# Ver delitos pendientes
node -e "const d=require('./data/delitos-validacion.json'); console.log('Pendientes:', d.filter(x=>x.estado==='pendiente').length)"

# Ver siguiente lote a procesar (primeros 5 pendientes)
node -e "const d=require('./data/delitos-validacion.json'); console.log(d.filter(x=>x.estado==='pendiente').slice(0,5).map(x=>({id:x.id,nombre:x.nombre,articulo:x.articulo_actual})))"

# Estadísticas
node -e "const d=require('./data/delitos-validacion.json'); const c={};d.forEach(x=>c[x.estado]=(c[x.estado]||0)+1); console.log(c)"
```

## Roadmap

- [x] C0: setup script + JSON inicial (469 pendientes)
- [ ] C1-C6: validación efectiva
- [ ] C7: cierre + tests + docs
- [ ] D6: UI para que abogado humano revise "revisar" pendientes
