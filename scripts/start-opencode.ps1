#!/usr/bin/env pwsh
# =============================================================================
# start-opencode.ps1 — Arranca OpenCode para el proyecto Pineda y Asociados.
#
# PowerShell 7 en macOS. No contiene secretos. Usa rutas relativas.
# Valida que se ejecute desde la raíz Git antes de arrancar.
# Establece únicamente variables técnicas documentadas (sin secretos).
# Propaga el exit code de OpenCode.
#
# USO (desde la raíz del repositorio):
#   pwsh -NoProfile -File scripts/start-opencode.ps1
#   pwsh -NoProfile -File scripts/start-opencode.ps1 --agent task-executor
# =============================================================================
[CmdletBinding()]
param(
    [string]$Agent = ''
)

$ErrorActionPreference = 'Stop'

# ── 1. Raíz Git ─────────────────────────────────────────────────────────────
$gitDir = & git rev-parse --show-toplevel 2>$null
if ($LASTEXITCODE -ne 0 -or -not $gitDir) {
    Write-Error 'Ejecutar este script desde la raíz del repositorio Git de Pineda y Asociados.'
    exit 1
}
Set-Location $gitDir
Write-Host "Raíz del repositorio: $gitDir"

# ── 2. Requisitos ───────────────────────────────────────────────────────────
foreach ($cmd in @('opencode', 'node', 'npm')) {
    if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) {
        Write-Error "No se encontró el binario '$cmd'. Instálalo antes de continuar."
        exit 1
    }
}

# ── 3. Variables técnicas documentadas (sin secretos) ───────────────────────
# Siguen el patrón de la configuración del proyecto. No leer .env.local.
$env:NEXT_TELEMETRY_DISABLED = '1'
$env:OPENCODE_NO_AUTOUPDATE = '1'

# ── 4. Arranque ─────────────────────────────────────────────────────────────
$arguments = @()
if ($Agent) {
    $arguments += @('--agent', $Agent)
}
Write-Host 'Arrancando OpenCode…'
& opencode @arguments
$exitCode = $LASTEXITCODE
Write-Host "OpenCode finalizado con exit code: $exitCode"
exit $exitCode
