# Fase 2 — Script de despliegue completo (post-build exitoso)
# Ejecutar SOLO después de que Vercel build pase a READY
# Uso: .\scripts\fase2-deploy-complete.ps1

Write-Host "🚀 FASE 2 — Despliegue completo" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Verificar que estamos en el directorio correcto
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: No se encontró package.json. Ejecutar desde la raíz del proyecto." -ForegroundColor Red
    exit 1
}

# Verificar que .env existe
if (-not (Test-Path ".env")) {
    Write-Host "❌ Error: No se encontró archivo .env" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Entorno verificado" -ForegroundColor Green
Write-Host ""

# Paso 1: Ejecutar migración
Write-Host "📝 PASO 1: Ejecutar migración Drizzle..." -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Yellow

try {
    npx drizzle-kit push
    Write-Host "✅ Migración ejecutada correctamente" -ForegroundColor Green
} catch {
    Write-Host "❌ Error ejecutando migración: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Paso 2: Ejecutar seed Fase 2
Write-Host "🌱 PASO 2: Ejecutar seed Fase 2..." -ForegroundColor Yellow
Write-Host "-----------------------------------" -ForegroundColor Yellow

try {
    npx tsx drizzle/seed-fase2.ts
    Write-Host "✅ Seed Fase 2 completado" -ForegroundColor Green
} catch {
    Write-Host "❌ Error ejecutando seed: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Paso 3: Ejecutar vinculación de supuestos penales
Write-Host "🔗 PASO 3: Vincular delitos con supuestos penales..." -ForegroundColor Yellow
Write-Host "---------------------------------------------------" -ForegroundColor Yellow

try {
    npx tsx scripts/vincular-supuestos-penales.ts
    Write-Host "✅ Vinculación completada" -ForegroundColor Green
} catch {
    Write-Host "❌ Error ejecutando vinculación: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Resumen
Write-Host "================================" -ForegroundColor Cyan
Write-Host "🎉 FASE 2 completada exitosamente" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 Resumen:" -ForegroundColor White
Write-Host "  • Migración: ✅ Completada" -ForegroundColor Green
Write-Host "  • Seed Fase 2: ✅ Completado" -ForegroundColor Green
Write-Host "  • Vinculación: ✅ Completada" -ForegroundColor Green
Write-Host ""
Write-Host "🔍 Validación: Verificar en Neon Console" -ForegroundColor Yellow
Write-Host "  • Tabla supuestos_penales: debe tener 1+ registros" -ForegroundColor White
Write-Host "  • Tabla remisiones_normativas: debe tener 3 registros" -ForegroundColor White
Write-Host "  • Tabla agravantes_especificas: se poblará después" -ForegroundColor White
Write-Host ""
Write-Host "🌐 URL producción: https://www.pinedayasociadoshn.com" -ForegroundColor Cyan
Write-Host ""
