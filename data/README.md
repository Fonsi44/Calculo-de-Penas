# Directorio `data/` - Política de Datos y Secretos

Este directorio contiene tanto datos estáticos que funcionan como fuentes de verdad legales para la aplicación, como artefactos generados temporalmente por scripts.

## Fuentes de Verdad (Sí deben versionarse)
Los siguientes archivos son estructurales y **deben** permanecer en el repositorio:
- `delitos.json`, `delitos-estados.json` (Catálogo base de delitos).
- `articulos_cp.json`, `articulos_constitucion.json`, códigos civiles y leyes (`codigo_*.json`).
- `areas-juridicas.ts`, `landings-locales.ts`, `faq.ts` (Datos estáticos y menús).
- Documentos PDF base ubicados en `pdfs-articulos/`.

*(Regla de oro: No modifiques los datos legales con IA, usa herramientas de validación de fuentes reales).*

## Datos Generados (NO deben versionarse)
Los siguientes artefactos son generados por scripts operativos o de Inteligencia Artificial y **están excluidos** en `.gitignore`:
- **Reportes SEO / Métricas (GSC)**: Archivos como `gsc-country.json`, `gsc-device.json`, `gsc-pages.json`, etc.
- **Checkpoints**: Archivos como `corregir-checkpoint.json` que guardan el estado de tareas por lotes.
- **Dumps / Caches**: Cualquier exportación de auditoría temporal, resultados locales de Playwright, cachés locales de validación y dumps de la base de datos.
- Archivos terminados en `*.token`, `*.credential`, o `*.secret`.

## Secretos y Autenticación (Google / Bing)
- **`data/google/`**: Se usa para almacenar credenciales de Google Service Accounts y outputs locales interactivos (GSC, GA4). **Esta carpeta completa está excluida**. NUNCA guardes archivos aquí con la intención de subirlos.
- **`data/bing/`**: Reservado para credenciales e interacciones con Bing Webmaster Tools. **Esta carpeta completa está excluida**.
- **Variables de Entorno**: Las claves API (Google, Resend, DB, etc.) van en `.env.local` (excluido) y **no** deben commitearse. 

## ⚠️ Advertencia Crítica de Seguridad
- **NO SUBAS SECRETOS AL REPOSITORIO**. Revisa siempre qué estás commiteando.
- **Validación antes de commit**: Antes de hacer commit, ejecuta siempre `git status` y revisa la lista de archivos modificados. Asegúrate de que no haya ningún `.json` generado o token en la lista de *"Changes to be committed"*. Si ves un archivo generado accidentalmente, remuévelo con `git rm --cached <archivo>`.
