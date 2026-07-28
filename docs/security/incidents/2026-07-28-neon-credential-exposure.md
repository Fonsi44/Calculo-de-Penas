# Incidente de Seguridad: Exposición de Credencial Neon (2026-07-28)

## 1. Origen
Se reportó que en una sesión anterior se introdujo una URL completa de Neon directamente en una línea de comandos. 

## 2. Alcance y Entorno Afectado
- **Entorno:** Terminal local y posibles logs de la sesión.
- **Alcance:** Potencial exposición de la cadena de conexión de Neon (`npg_...`). 

## 3. Exposición confirmada o descartada
Se realizó una auditoría completa utilizando:
- `git grep -n "npg_"`
- `git log --all -S"npg_" --oneline`
- `git diff origin/main...HEAD`
- `git stash list`
- `gh pr view 23 --comments`
- Búsquedas en `.local`, `.env.local` y el historial de la terminal actual.

**Resultado:** no se detectó el valor en archivos versionados, historial Git ni
comentarios del PR #23. La búsqueda local solo encuentra la cadena de ejemplo
`npg_` en este informe. La credencial sí fue introducida en una línea de
comandos de una sesión anterior, por lo que su posible presencia en registros
externos de esa sesión no puede descartarse desde el repositorio.

## 4. Entorno

La URL configurada actualmente se inspeccionó sin imprimir usuario, contraseña
ni cadena de conexión:

- proveedor/host: Neon (`aws.neon.tech`);
- base: `neondb`;
- no hay indicador de entorno en host, base o prefijo de usuario;
- el repositorio no permite determinar si el branch Neon es Production,
  Preview o Development;
- no se probó la credencial expuesta original ni se comparó su valor.

Por tanto, el entorno de la credencial expuesta queda
`BLOCKED_EXTERNAL_DATA`, no confirmado como Production.

## 5. Decisión de rotación

No se rotó ninguna credencial. Si Neon confirma que
`[REDACTED_NEON_DATABASE_URL]` corresponde a Production y continúa activa, se
requiere una autorización específica antes de rotarla. El trabajo que no usa
esa credencial puede continuar.

## 6. Validación

Si se autoriza la rotación:

1. crear una credencial nueva en el branch correcto de Neon;
2. actualizar únicamente los secretos de los entornos afectados;
3. verificar conexión read-only;
4. revocar la credencial expuesta;
5. validar Preview antes de cualquier cambio Production.
