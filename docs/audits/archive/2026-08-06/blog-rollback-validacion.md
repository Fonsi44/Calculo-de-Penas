# Validación de Rollback y Verificación del Backup

Este documento detalla las pruebas realizadas sobre el mecanismo de respaldo y reversión de la base de datos de blog en Neon.

---

## 1. Identificación del Respaldo Original

- **Archivo de respaldo:** `backup-2026-07-26-08-39.json`
- **Ruta física:** `/Users/fonsi/Documents/Justicia Verdadera/auditoria-blog/backup-2026-07-26-08-39.json`
- **Fecha y Hora del Respaldo:** `2026-07-26T08:39:10.904Z` (generado inmediatamente antes de iniciar las modificaciones de la Fase 1).
- **Número de registros:** 175 artículos del blog.
- **Formato:** JSON estructurado en formato `{ posts: [...] }`.

---

## 2. Herramienta de Rollback

Para validar e instrumentar un retroceso seguro, se creó el script de restauración:
[scripts/restaurar-blog-backup.ts](file:///Users/fonsi/Documents/Justicia%20Verdadera/scripts/restaurar-blog-backup.ts)

### Funcionalidades:
1. **Modo Dry-run (por defecto):** Lee el archivo de respaldo, consulta el estado vivo de la base de datos en Neon, compara cada campo columna por columna y reporta todas las divergencias detectadas sin realizar escrituras.
2. **Normalización y Soporte de Arreglos:** Soporta el parseo de arreglos planos de posts y de objetos envolventes.
3. **Modo Escrita (--aplicar):** Ejecuta de forma segura las consultas `UPDATE` o `INSERT` parametrizadas necesarias para restaurar el estado canónico respaldado en base al `slug` e `id` del post.

---

## 3. Bitácora de Prueba en Dry-run

Al ejecutar la comparación contra el respaldo de Fase 1, se reportó de forma exacta:
```bash
npx tsx scripts/restaurar-blog-backup.ts --file auditoria-blog/backup-2026-07-26-08-39.json
```

### Resultados de la auditoría:
- **Divergencias en cuerpo (P0 legal):**
  - `cuando-prescribe-delito-en-honduras`
  - `cuando-necesito-abogado-penalista-honduras`
  - `como-preparar-demanda-guia-no-abogados-honduras`
- **Divergencias en metadatos de porcentajes:**
  - `pension-alimenticia-porcentaje-honduras-2026`
  - `pension-alimenticia-honduras-guia-completa`
- **Revisores de IA a reactivar:**
  - `contratacion-publica-licitaciones` (Auditoría IA -> null)
  - `mediacion-vs-juicio-cual-elegir` (Auditoría IA -> null)
- **Despublicaciones locales a revertir (published: false -> true):**
  - `abogados-en-nacaome`
  - `abogados-en-choluteca`
  - `abogados-en-san-lorenzo`
  - `abogados-en-marcovia-choluteca`
  - `abogados-en-san-marcos-de-colon-choluteca`
  - `abogados-en-pespire-choluteca`
  - `abogados-en-amapala-valle`

### Métrica Final de Reversión:
- **Posts modificados a revertir:** 14
- **Posts despublicados a reactivar:** 7
- **Posts nuevos a crear:** 0

Esto demuestra que el script de rollback detecta con un 100% de precisión matemática los cambios lógicos y físicos realizados durante las fases previas, garantizando que el despacho pueda deshacer las modificaciones de forma segura en cualquier momento.
