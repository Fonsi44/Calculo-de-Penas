@echo off
REM ==========================================================================
REM  run-blog-lotes.cmd — Wrapper autónomo para procesar el blog por lotes
REM
REM  PROBLEMA: el harness de ZCode mata background tasks a los 10 min. Cada
REM  lote de 16 posts tarda ~10 min. Procesar 119 posts restantes requiere
REM  ~18 lotes → ~3h que el agente no puede supervisionar.
REM
REM  SOLUCIÓN: este script buclea lotes de N posts (--limit) con --offset
REM  incremental, sin intervención del agente. Lo lanza el usuario en su
REM  terminal nativa (cmd.exe) y vuelve en ~30-45 min con --ctr-only (posts OK)
REM  o ~3h sin --ctr-only. Reanuda solo si un lote falla (reintenta el mismo
REM  offset). Guarda logs en auditoria-blog/run-blog-lotes.log.
REM
REM  USO:
REM    scripts\run-blog-lotes.cmd                       # posts 41-159, --aplicar --ctr-only
REM    scripts\run-blog-lotes.cmd --offset 40 --limit 16
REM    scripts\run-blog-lotes.cmd --no-ctr   # sin --ctr-only (body completo)
REM    scripts\run-blog-lotes.cmd --dry-run  # dry-run (no escribe DB)
REM    scripts\run-blog-lotes.cmd --end 159  # tope de offset (default 159)
REM
REM  REQUISITOS:
REM    - DATABASE_URL y DEEPSEEK_API_KEY en .env.local
REM    - Node.js + tsx (instalado vía npm install)
REM  ==========================================================================
setlocal enabledelayedexpansion

set OFFSET_DEFAULT=40
set LIMIT_DEFAULT=16
set END_DEFAULT=159
set CTR_ONLY=--ctr-only
set APLICAR_FLAG=--aplicar
set LOG=auditoria-blog\run-blog-lotes.log

REM Parsear args manuales
set OFFSET=%OFFSET_DEFAULT%
set LIMIT=%LIMIT_DEFAULT%
set END=%END_DEFAULT%
:parse
if "%~1"=="" goto parsed
if /i "%~1"=="--no-ctr" (set CTR_ONLY=)
if /i "%~1"=="--dry-run" (set APLICAR_FLAG=)
if /i "%~1"=="--offset" (set OFFSET=%~2 & shift)
if /i "%~1"=="--limit" (set LIMIT=%~2 & shift)
if /i "%~1"=="--end" (set END=%~2 & shift)
shift
goto parse
:parsed

if not exist auditoria-blog mkdir auditoria-blog
echo [%date% %time%] INICIO wrapper (offset=%OFFSET% limit=%LIMIT% end=%END% ctr_only=%CTR_ONLY% aplicar=%APLICAR_FLAG%) > %LOG%

set LOTEA=%OFFSET%
:bucle
if !LOTEA! geq %END% goto fin
set /a LIMITE_REAL=%LIMIT%
set /a NEXT_OFFSET=!LOTEA!+%LIMIT%
if !NEXT_OFFSET! gtr %END% set /a LIMITE_REAL=%END%-!LOTEA!
if !LIMITE_REAL! leq 0 goto fin

echo.
echo "[%date% %time%] === LOTE offset=!LOTEA! limit=!LIMITE_REAL! ==="
echo [%date% %time%] === LOTE offset=!LOTEA! limit=!LIMITE_REAL! === >> %LOG%

call npx tsx scripts\blog-verify-fix.ts -- %APLICAR_FLAG% %CTR_ONLY% --offset !LOTEA! --limit !LIMITE_REAL! --reset-checkpoint >> %LOG% 2>&1
set EXITCODE=%errorlevel%

if %EXITCODE% neq 0 (
  echo [%date% %time%] LOTE offset=!LOTEA! FALLO (exit %EXITCODE%). Reintentando una sola vez...
  echo [%date% %time%] LOTE offset=!LOTEA! FALLO (exit %EXITCODE%). Reintento #1 >> %LOG%
  call npx tsx scripts\blog-verify-fix.ts -- %APLICAR_FLAG% %CTR_ONLY% --offset !LOTEA! --limit !LIMITE_REAL! --reset-checkpoint >> %LOG% 2>&1
  set EXITCODE=%errorlevel%
  if !EXITCODE! neq 0 (
    echo [%date% %time%] Reintento tambien fallo (exit !EXITCODE!). Abortando wrapper.
    echo [%date% %time%] Reintento fallo. Abortando. >> %LOG%
    exit /b !EXITCODE!
  )
)

set /a LOTES_REALIZADOS=!LOTEA!+!LIMITE_REAL!
set LOTES=!LOTES_REALIZADOS!
goto bucle

:fin
echo.
echo [%date% %time%] WRAPPER COMPLETADO. Procesados hasta offset !LOTEA!.
echo [%date% %time%] WRAPPER COMPLETADO hasta offset !LOTEA!. >> %LOG%
endlocal