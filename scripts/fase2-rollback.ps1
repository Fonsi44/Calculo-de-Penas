# Fase 2 — Script de rollback por emergencia
# USAR SOLO si Fase 2 causa problemas críticos en producción
# Uso: .\scripts\fase2-rollback.ps1

Write-Host "🚨 FASE 2 — Rollback de emergencia" -ForegroundColor Red
Write-Host "====================================" -ForegroundColor Red
Write-Host ""

$confirmation = Read-Host "⚠️  ESTO ELIMINARÁ las tablas de Fase 2. ¿Está seguro? (yes/no)"
if ($confirmation -ne "yes") {
    Write-Host "❌ Rollback cancelado" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "🔧 Iniciando rollback..." -ForegroundColor Yellow
Write-Host ""

# Cargar variables de entorno
Get-Content .env | ForEach-Object {
    if ($_ -match '^([^=]+)=(.+)$') {
        $name = $matches[1]
        $value = $matches[2]
        Set-Variable -Name $name -Value $value -Scope Script
    }
}

# Paso 1: Eliminar tabla agravantes_especificas
Write-Host "1️⃣  Eliminando tabla agravantes_especificas..." -ForegroundColor White
try {
    $query = "DROP TABLE IF EXISTS agravantes_especificas CASCADE;"
    psql "$DATABASE_URL" -c "$query" 2>&1 | Out-Null
    Write-Host "   ✅ Tabla eliminada" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Error: $_" -ForegroundColor Red
}

Write-Host ""

# Paso 2: Eliminar tabla remisiones_normativas
Write-Host "2️⃣  Eliminando tabla remisiones_normativas..." -ForegroundColor White
try {
    $query = "DROP TABLE IF EXISTS remisiones_normativas CASCADE;"
    psql "$DATABASE_URL" -c "$query" 2>&1 | Out-Null
    Write-Host "   ✅ Tabla eliminada" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Error: $_" -ForegroundColor Red
}

Write-Host ""

# Paso 3: Eliminar tabla supuestos_penales
Write-Host "3️⃣  Eliminando tabla supuestos_penales..." -ForegroundColor White
try {
    $query = "DROP TABLE IF EXISTS supuestos_penales CASCADE;"
    psql "$DATABASE_URL" -c "$query" 2>&1 | Out-Null
    Write-Host "   ✅ Tabla eliminada" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Error: $_" -ForegroundColor Red
}

Write-Host ""

# Paso 4: Eliminar enum tipo_pena
Write-Host "4️⃣  Eliminando enum tipo_pena..." -ForegroundColor White
try {
    $query = "DROP TYPE IF EXISTS tipo_pena CASCADE;"
    psql "$DATABASE_URL" -c "$query" 2>&1 | Out-Null
    Write-Host "   ✅ Enum eliminado" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Error: $_" -ForegroundColor Red
}

Write-Host ""

# Paso 5: Verificar rollback
Write-Host "5️⃣  Verificando rollback..." -ForegroundColor White
try {
    $query = @"
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('supuestos_penales', 'agravantes_especificas', 'remisiones_normativas');
"@
    $result = psql "$DATABASE_URL" -c "$query" -t 2>&1
    $tables = @($result | ForEach-Object { $_.Trim() })

    if ($tables.Count -eq 0) {
        Write-Host "   ✅ Rollback completado: todas las tablas han sido eliminadas" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Aún existen tablas: $($tables -join ', ')" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ❌ Error verificando rollback: $_" -ForegroundColor Red
}

Write-Host ""

Write-Host "====================================" -ForegroundColor Red
Write-Host "🏁 Rollback finalizado" -ForegroundColor Yellow
Write-Host "====================================" -ForegroundColor Red
Write-Host ""
Write-Host "ℹ️  Para revertir el código al estado anterior (Fase 0):" -ForegroundColor White
Write-Host "   git revert HEAD" -ForegroundColor Gray
Write-Host "   git push origin main" -ForegroundColor Gray
Write-Host ""
Write-Host "🌐 Producción: https://www.pinedayasociadoshn.com" -ForegroundColor Cyan
Write-Host ""
