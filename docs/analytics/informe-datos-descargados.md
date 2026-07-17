# Informe de datos descargados — 2026-07-16

| Fuente | Periodo / fecha | Registros disponibles | Estado |
|---|---|---:|---|
| GA4 Data API | 2026-06-19 a 2026-07-17 | 571 usuarios, 695 sesiones, 1.976 vistas, 4.184 eventos | `ok`; 9 eventos clave |
| Search Console | 2026-06-19 a 2026-07-17 | 247 clics, 12.428 impresiones, 249 queries, 133 páginas | `ok`; CTR 1,99%, posición 6,8 |
| Bing Webmaster | 2026-07-17 | 132 queries + 16 URLs | `ok`; 5.013 páginas rastreadas |
| Clarity | — | 0 | No se encontró exportación/API configurada; revisar panel |

Los outputs live se guardan bajo `data/google/`, `data/bing/` y `data/seo/`, todos ignorados por Git. Bing generó `bing-live.json` y `bing-live.csv` (148 filas de datos combinadas). Los CSV de Google están implementados pero no se generan hasta renovar OAuth. La falta de filas Google no significa ausencia de tráfico.

`output/` contenía un PDF preexistente, reproducible pero ajeno a Analytics. No fue leído ni borrado; se añadió `/output/` a `.gitignore` para impedir su inclusión accidental.

Actualización 2026-07-17: OAuth fue renovado y las exportaciones normales
completaron. GA4 CSV contiene 223 filas, GSC 809 y Bing 148; los tres tienen
encabezados estables y cero filas duplicadas exactas. `seo:collect` completó
6/6 fuera del sandbox.
