# Fase 2 - Script de despliegue completo (post-build exitoso)
# Ejecutar SOLO despues de que Vercel build pase a READY
# Uso: .\scripts\fase2-deploy-complete.ps1

$ErrorActionPreference = "Stop"

Write-Host "FASE 2 - Despliegue completo" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Configurar rutas
$NODE_PATH = "C:\Program Files\nodejs\node.exe"
$NPX_PATH = "C:\Program Files\nodejs\npx.cmd"

# Verificar que estamos en el directorio correcto
if (-not (Test-Path "package.json")) {
    Write-Host "Error: No se encontro package.json. Ejecutar desde la raiz del proyecto." -ForegroundColor Red
    exit 1
}

# Verificar que .env existe
if (-not (Test-Path ".env")) {
    Write-Host "Error: No se encontro archivo .env" -ForegroundColor Red
    exit 1
}

Write-Host "Entorno verificado" -ForegroundColor Green
Write-Host ""

# Paso 1: Ejecutar migracion
Write-Host "PASO 1: Ejecutar migracion Drizzle..." -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Yellow

try {
    & $NPX_PATH drizzle-kit push
    Write-Host "Migracion ejecutada correctamente" -ForegroundColor Green
} catch {
    Write-Host "Error ejecutando migracion: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Paso 2: Ejecutar seed Fase 2
Write-Host "PASO 2: Ejecutar seed Fase 2..." -ForegroundColor Yellow
Write-Host "-----------------------------------" -ForegroundColor Yellow

try {
    & $NPX_PATH tsx drizzle/seed-fase2.ts
    Write-Host "Seed Fase 2 completado" -ForegroundColor Green
} catch {
    Write-Host "Error ejecutando seed: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Paso 3: Ejecutar vinculación de supuestos penales
Write-Host "PASO 3: Vincular delitos con supuestos penales..." -ForegroundColor Yellow
Write-Host "---------------------------------------------------" -ForegroundColor Yellow

try {
    & $NPX_PATH tsx scripts/vincular-supuestos-penales.ts
    Write-Host "Vinculacion completada" -ForegroundColor Green
} catch {
    Write-Host "Error ejecutando vinculacion: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Resumen
Write-Host "================================" -ForegroundColor Cyan
Write-Host "FASE 2 completada exitosamente" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Resumen:" -ForegroundColor White
Write-Host "  • Migracion: Completada" -ForegroundColor Green
Write-Host "  • Seed Fase 2: Completado" -ForegroundColor Green
Write-Host "  • Vinculacion: Completada" -ForegroundColor Green
Write-Host ""
Write-Host "Validacion: Verificar en Neon Console" -ForegroundColor Yellow
Write-Host "  • Tabla supuestos_penales: debe tener 1+ registros" -ForegroundColor White
Write-Host "  • Tabla remisiones_normativas: debe tener 3 registros" -ForegroundColor White
Write-Host "  • Tabla agravantes_especificas: se poblara despues" -ForegroundColor White
Write-Host ""
Write-Host "URL produccion: https://www.pinedayasociadoshn.com" -ForegroundColor Cyan
Write-Host ""
