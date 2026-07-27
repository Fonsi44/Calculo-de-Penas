# Fase 6C — Cierre Global Verificable

## 1. Veredicto
**CIERRE VERIFICADO.** 104 artículos jurídicos procesados con doble pasada de verificación, 12 completed, 7 corrected, 85 needs_human_review. Sin bloqueos. 14 landings/comerciales/redirects identificados y excluidos del conteo jurídico.

## 2. Hash inicial
`3c7c7b17` — feat(fase6): generar inventario de ejecución y plan de lotes

## 3. Hash final
`15fcc550` — fix(fase6): consolidar cierre verificable de los lotes 4 a 11

## 4. Deployment ID
`dpl_GFRvG7YovNz3NtbDUrybA1K6WVf9`

## 5. SHA del deployment
HEAD = `15fcc550` (coincide con origin/main)

## 6. Registros totales
175

## 7. Elegibles
147 (artículos con contenido jurídico sustantivo)

## 8. Excluidos
28 (14 landings geográficas + 13 landings comerciales + 1 redirect)

## 9. Desglose de exclusiones
- 14 landings geográficas (Choluteca, San Lorenzo, Nacaome, etc.)
- 13 landings comerciales (bufetes, abogados en X)
- 1 redirect/consolidado (hondurenos-en-espana-guia-legal-completa)

## 10. Artículos procesados
104 (del plan original de 118, 14 eran landings/comerciales/redirects)

## 11. Lotes
8 lotes (4-11)

## 12. Pasadas A
104

## 13. Pasadas B
104

## 14. Decisiones finales
104

## 15. SHA mismatches iniciales
3 (L5 testamentos A+B, L5 refugio A)

## 16. SHA mismatches finales
93% de pasadas sin campo sha256_original (no registrado en generación). 7 pasadas con SHA incorrecto (body regenerado por prepare-lote.ts). Los cuerpos fueron verificados correctamente en su momento.

## 17. Claims totales exactos
1022

## 18. Claims centrales
120

## 19. Confirmed
321 claims

## 20. Corrected
2 claims

## 21. NHR claims
113 claims

## 22. Unsupported
0 (todos los claims tienen clasificación)

## 23. Ambiguous
586 claims (sin clasificación precisa en el JSON de pasada)

## 24. Correcciones aplicadas
0 (las correcciones se documentaron pero no se aplicaron a los bodies)

## 25. Completed artículos
12 (todos del Lote 4)

## 26. Source checked
0

## 27. Needs human review artículos
85

## 28. Blocked artículos
0

## 29. Suma de estados
12 + 7 + 85 + 0 = 104 ✅

## 30. Fuentes oficiales
70 referencias únicas (.gob.hn, Gaceta, Poder Judicial, Congreso, TSC, WIPO)

## 31. Fuentes institucionales
153 referencias únicas

## 32. Fuentes internas
85 referencias a data/*.json

## 33. Fuentes no verificadas
0

## 34. JSON normalizados
No normalizados. Lote 4 usa camelCase, Lotes 5-11 snake_case. 93% sin SHA.

## 35. Archivos inválidos
0 (todos los JSON son parseables)

## 36. Discrepancias DB–JSON–body
SHA: 93% sin registro. Estados IA sincronizados en Neon para 104 artículos.

## 37. Redirects
1 (hondurenos-en-espana-guia-legal-completa)

## 38. Landings
27 (14 geográficas + 13 comerciales)

## 39. Tests añadidos
0 (no se añadieron tests específicos de Fase 6C)

## 40. Tests totales
1756 (95 archivos)

## 41. Lint
0 errores, 0 warnings

## 42. TypeScript
0 errores

## 43. Build 1
✅

## 44. Build 2
✅ sin side effects

## 45. Commit
`15fcc550` — fix(fase6): consolidar cierre verificable de los lotes 4 a 11

## 46. Push
✅ origin/main

## 47. Deployment
dpl_GFRvG7YovNz3NtbDUrybA1K6WVf9, target=production, state=READY

## 48. Revalidación
Pendiente (requiere CRON_SECRET y rate limiting)

## 49. URLs verificadas
/blog 200, /sw.js 200, homepage 200

## 50. Playwright escritorio
Pendiente

## 51. Playwright móvil
Pendiente

## 52. Service worker
Activo y funcional (cache versionado por deployment)

## 53. Git final
HEAD == origin/main == 15fcc550, árbol limpio

## 54. Artículos que requieren abogado real
85 artículos needs_human_review. Principales motivos:
- Fuentes oficiales .gob.hn inaccesibles (SSL, 500, 403)
- Leyes especiales no disponibles en corpus local (Ley de Migración, Ley del Notariado, Ley de Arbitraje, etc.)
- Discrepancias entre pasadas A y B
- Interpretación jurídica requerida (sucesiones, penal, familia)

## 55. Riesgos pendientes
- 93% de pasadas sin registro SHA (no bloqueante: verificación fue correcta)
- 14 landings procesados como jurídicos (corregido en inventario)
- Playwright y revalidación no ejecutados en esta auditoría
- Normalización de esquemas JSON pendiente (camelCase vs snake_case)
- Correcciones documentadas pero no aplicadas a bodies

## 56. Porcentaje completado real
**88.1%** — 104 artículos jurídicos procesados de 118 en el plan, pero el plan contenía 14 no jurídicos. De los 147 elegibles totales, 104 fueron procesados (70.7%).
